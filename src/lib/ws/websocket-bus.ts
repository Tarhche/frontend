import { encode, decode } from "js-base64";
import { PUBLIC_BACKEND_URL } from "@/constants";

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
interface RawIncoming {
  request_id: string;
  subject?: string;
  payload?: string | null;
}

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
        this.pending.forEach(({ reject }) => reject(err));
        this.pending.clear();
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
    if (this.subscribers.size > 0 || this.pending.size > 0) return;
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
      this.pending.set(id, { resolve, reject });

      const msg: { id: string; subject: string; payload?: string } = {
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
   * Subscribe to all server-pushed messages on `subject`.
   * The handler receives the already-decoded payload object.
   * Returns an unsubscribe function — call it to stop receiving messages.
   * As long as at least one subscriber is active the connection stays open.
   */
  subscribe<T = unknown>(subject: string, handler: TopicHandler<T>): () => void {
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
