import {encode, decode} from "js-base64";
import {PUBLIC_BACKEND_URL} from "@/constants";

const DEFAULT_IDLE_TTL_MS = 30_000; // 30 seconds of idle time before auto-disconnecting the WebSocket

// Normalize whitespace and line endings before encoding — mirrors the existing
// encoding convention used for code payloads.
function b64Encode(s: string): string {
  return encode(s.replace(/ /g, " ").replace(/\r\n/g, "\n"));
}

function b64Decode(s: string): string {
  return decode(s);
}

// request_id is the only mandatory field in a response.
// subject is present in server-pushed events but not guaranteed in responses.
// payload is optional and can be null.
// kind says whether a reply is the whole answer, one chunk of a longer one, or
// the end of it. It is absent on the ordinary one-shot answers, whose kind is
// the zero value.
interface RawIncoming {
  request_id: string;
  subject?: string;
  kind?: ReplyKind;
  payload?: string | null;
}

export const ReplyKind = {
  Final: 0,
  Chunk: 1,
  EOF: 2,
} as const;

export type ReplyKind = (typeof ReplyKind)[keyof typeof ReplyKind];

/**
 * What a caller is told about a stream it opened. Chunks arrive as the raw
 * base64 the server sent, because what is inside them differs by subject — a
 * log line is JSON, a terminal's output is bytes — and only the caller knows
 * which.
 */
export type StreamHandlers = {
  onChunk: (payload: string | null) => void;
  onEnd?: (payload: string | null) => void;
  onError?: (error: Error) => void;
};

/**
 * A stream the client has open. Sending carries something to it — keystrokes,
 * a new window size — and closing ends it at both ends.
 */
export type StreamHandle = {
  readonly id: string;
  send<T>(subject: string, data: T): void;
  close(): void;
};

type StreamEntry = StreamHandlers;

type PendingEntry<T> = {
  resolve: (value: T) => void;
  reject: (err: Error) => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TopicHandler<T = any> = (data: T) => void;

export class WebSocketBus {
  private socket: WebSocket | null = null;
  private connectingPromise: Promise<void> | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pending = new Map<string, PendingEntry<any>>();
  private streams = new Map<string, StreamEntry>();
  private subscribers = new Map<string, Set<TopicHandler>>();
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly idleTtl: number;
  private readonly url: string;

  constructor(url: string, idleTtl = DEFAULT_IDLE_TTL_MS) {
    this.url = url;
    this.idleTtl = idleTtl;
  }

  // ─── Connection management ────────────────────────────────────────────────

  private ensureConnected(): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) return Promise.resolve();

    // Discard stale socket (CLOSING / CLOSED)
    if (this.socket) this.socket = null;

    if (this.connectingPromise) return this.connectingPromise;

    this.connectingPromise = new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(this.url);

      ws.addEventListener("open", () => {
        this.socket = ws;
        this.connectingPromise = null;
        resolve();
      });

      ws.addEventListener("error", () => {
        this.connectingPromise = null;
        reject(new Error("[WsBus] Connection failed"));
      });

      ws.addEventListener("message", (ev: MessageEvent<string>) => {
        this.handleIncoming(ev.data);
      });

      ws.addEventListener("close", () => {
        this.socket = null;
        this.connectingPromise = null;
        const err = new Error("[WsBus] Connection closed unexpectedly");
        this.pending.forEach(({reject}) => reject(err));
        this.pending.clear();
        this.streams.forEach(({onError}) => onError?.(err));
        this.streams.clear();
      });
    });

    return this.connectingPromise;
  }

  // ─── Message routing ──────────────────────────────────────────────────────

  private handleIncoming(raw: string) {
    let msg: RawIncoming;
    try {
      msg = JSON.parse(raw) as RawIncoming;
    } catch {
      console.error("[WsBus] Failed to parse message", raw);
      return;
    }

    // A stream's chunks are handed over as they arrived: what is inside one
    // differs by subject, so decoding it is the caller's business.
    if (msg.request_id && this.streams.has(msg.request_id)) {
      const stream = this.streams.get(msg.request_id)!;
      const payload = msg.payload ?? null;

      if (msg.kind === ReplyKind.Chunk) {
        stream.onChunk(payload);
      } else {
        this.streams.delete(msg.request_id);
        stream.onEnd?.(payload);
        this.scheduleIdleDisconnect();
      }

      return;
    }

    // Decode the outer base64 envelope; inner encoding is the caller's concern.
    // payload is optional — resolve with null when absent.
    let decoded: unknown = null;
    if (msg.payload) {
      try {
        decoded = JSON.parse(b64Decode(msg.payload));
      } catch {
        console.error("[WsBus] Failed to decode payload", msg.payload);
        return;
      }
    }

    // 1. Resolve one-shot request/response by UUID
    if (msg.request_id) {
      const entry = this.pending.get(msg.request_id);
      if (entry) {
        entry.resolve(decoded);
        this.pending.delete(msg.request_id);
        this.scheduleIdleDisconnect();
      }
    }

    // 2. Fan-out to all topic subscribers
    if (msg.subject) {
      this.subscribers.get(msg.subject)?.forEach((h) => h(decoded));
    }
  }

  // ─── Idle TTL ─────────────────────────────────────────────────────────────

  private scheduleIdleDisconnect() {
    if (
      this.subscribers.size > 0 ||
      this.pending.size > 0 ||
      this.streams.size > 0
    )
      return;
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      this.socket?.close(1000, "idle");
      this.socket = null;
    }, this.idleTtl);
  }

  private cancelIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Send a message on `subject` and await the correlated response.
   * The response payload is base64-decoded and JSON-parsed before resolving.
   * Any inner encoding (e.g. double-encoded fields) is the caller's responsibility.
   */
  async publish<TReq = unknown, TRes = unknown>(
    subject: string,
    data?: TReq,
  ): Promise<TRes> {
    await this.ensureConnected();
    this.cancelIdleTimer();

    const id = crypto.randomUUID();

    return new Promise<TRes>((resolve, reject) => {
      this.pending.set(id, {resolve, reject});

      const msg: {id: string; subject: string; payload?: string} = {
        id,
        subject,
      };
      if (data !== undefined) {
        msg.payload = b64Encode(JSON.stringify(data));
      }

      this.socket!.send(JSON.stringify(msg));
    });
  }

  /**
   * Open a stream: one request whose reply arrives in pieces, until the server
   * says it has ended or the caller closes it.
   *
   * Chunks are handed over as the raw base64 the server sent, since a log line
   * and a terminal's output are not the same thing inside.
   */
  async openStream<TReq = unknown>(
    subject: string,
    data: TReq | undefined,
    handlers: StreamHandlers,
  ): Promise<StreamHandle> {
    await this.ensureConnected();
    this.cancelIdleTimer();

    const id = crypto.randomUUID();
    this.streams.set(id, handlers);

    const msg: {id: string; subject: string; payload?: string} = {id, subject};
    if (data !== undefined) {
      msg.payload = b64Encode(JSON.stringify(data));
    }

    this.socket!.send(JSON.stringify(msg));

    return {
      id,
      // a request naming a stream is not a question, so it is not answered and
      // does not need an id of its own.
      send: <T>(inputSubject: string, input: T) => {
        if (this.socket?.readyState !== WebSocket.OPEN) return;

        this.socket.send(
          JSON.stringify({
            stream_id: id,
            subject: inputSubject,
            payload: b64Encode(JSON.stringify(input)),
          }),
        );
      },
      // a stream named with no subject to carry it to asks for it to end.
      close: () => {
        this.streams.delete(id);
        this.scheduleIdleDisconnect();

        if (this.socket?.readyState !== WebSocket.OPEN) return;

        this.socket.send(JSON.stringify({stream_id: id}));
      },
    };
  }

  /**
   * Subscribe to all server-pushed messages on `subject`.
   * The handler receives the already-decoded payload object.
   * Returns an unsubscribe function — call it to stop receiving messages.
   * As long as at least one subscriber is active the connection stays open.
   */
  subscribe<T = unknown>(
    subject: string,
    handler: TopicHandler<T>,
  ): () => void {
    if (!this.subscribers.has(subject)) {
      this.subscribers.set(subject, new Set());
    }
    this.subscribers.get(subject)!.add(handler as TopicHandler);
    this.cancelIdleTimer();

    return () => {
      const set = this.subscribers.get(subject);
      if (set) {
        set.delete(handler as TopicHandler);
        if (set.size === 0) this.subscribers.delete(subject);
      }
      this.scheduleIdleDisconnect();
    };
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let _bus: WebSocketBus | null = null;

export function getWebSocketBus(idleTtl?: number): WebSocketBus {
  if (!_bus) {
    const base = PUBLIC_BACKEND_URL!;
    const wsUrl = `${base.startsWith("https:") ? "wss" : "ws"}://${base.replace(/^https?:\/\//, "")}/api/ws`;
    _bus = new WebSocketBus(wsUrl, idleTtl);
  }
  return _bus;
}
