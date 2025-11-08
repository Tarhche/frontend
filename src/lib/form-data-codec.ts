/**
 * FormData <-> Object with nested + array support (TypeScript).
 * - Supports: user[name], user[address][street], items[0][name], tags[], tags[0]
 * - Preserves File/Blob values.
 * - Optional type coercion when reading FormData.
 */

export interface ToObjectOptions {
  /** coerce "true"/"false"/"null"/numbers to their types */
  coerce?: boolean;
  /** when coerce=true, convert "" to null */
  emptyToNull?: boolean;
}

export interface FromObjectOptions {
  /** append into an existing FormData */
  target?: FormData;
  /** arrays as arr[0] vs arr[] */
  indices?: boolean;
  /** append nulls as empty strings ("") */
  includeNull?: boolean;
  /** Date -> toISOString() (true) or milliseconds since epoch (false) */
  isoDates?: boolean;
}

export class FormDataCodec {
  /**
   * Convert FormData to a nested object.
   * @param formData
   * @param options
   * @returns A nested object (use a generic to hint the expected shape).
   */
  static toObject<T = Record<string, any>>(
    formData: FormData,
    options: ToObjectOptions = {}
  ): T {
    const { coerce = false, emptyToNull = false } = options;
    const root: Record<string, any> & { _root?: any[] } = {};

    for (const [rawKey, rawVal] of formData.entries()) {
      const tokens = this.tokenize(rawKey);
      const value = this.maybeCoerce(rawVal, { coerce, emptyToNull });
      this.assign(root, tokens, value);
    }
    return root as T;
  }

  /**
   * Convert a nested object to FormData.
   * @param obj
   * @param options
   */
  static fromObject(
    obj: Record<string, any> | null | undefined,
    options: FromObjectOptions = {}
  ): FormData {
    const {
      target = new FormData(),
      indices = false,
      includeNull = false,
      isoDates = true,
    } = options;

    const append = (k: string, v: string | Blob) => target.append(k, v);

    if (obj && typeof obj === "object") {
      Object.keys(obj).forEach((k) => {
        this.walkObject(obj[k], k, append, { indices, includeNull, isoDates });
      });
    }

    return target;
  }

  // ---------- Internals ----------

  /** Walk any value and append to FormData with nested keys. */
  private static walkObject(
    val: any,
    key: string,
    append: (k: string, v: string | Blob) => void,
    opts: Required<Pick<FromObjectOptions, "indices" | "includeNull" | "isoDates">>
  ): void {
    const { indices, includeNull, isoDates } = opts;

    if (val === undefined) return;

    // nulls
    if (val === null) {
      if (includeNull) append(key, "");
      return;
    }

    // Blob/File pass-through
    if (this.isBlob(val)) {
      append(key, val);
      return;
    }

    // Date
    if (val instanceof Date) {
      append(key, isoDates ? val.toISOString() : String(+val));
      return;
    }

    // Array
    if (Array.isArray(val)) {
      val.forEach((item, i) => {
        const nextKey = indices ? `${key}[${i}]` : `${key}[]`;

        if (item === null) {
          if (includeNull) append(nextKey, "");
          return;
        }

        if (this.isBlob(item)) {
          append(nextKey, item);
          return;
        }

        if (item instanceof Date) {
          append(nextKey, isoDates ? item.toISOString() : String(+item));
          return;
        }

        if (this.isPrimitive(item)) {
          append(nextKey, String(item));
          return;
        }

        // nested object/array
        this.walkObject(item, nextKey, append, opts);
      });
      return;
    }

    // Plain object
    if (this.isPlainObject(val)) {
      Object.keys(val).forEach((prop) => {
        const nextKey = `${key}[${prop}]`;
        this.walkObject(val[prop], nextKey, append, opts);
      });
      return;
    }

    // Primitive
    append(key, String(val));
  }

  /** Turn "a.b[0][c]..[2]" into tokens: ["a","b","0","c","","2"] ("" means 'push': []) */
  private static tokenize(path: string): string[] {
    const tokens: string[] = [];
    let buf = "";
    let inBracket = false;

    for (let i = 0; i < path.length; i++) {
      const ch = path[i];

      if (ch === "." && !inBracket) {
        if (buf) {
          tokens.push(buf);
          buf = "";
        }
        continue;
      }
      if (ch === "[" && !inBracket) {
        if (buf) {
          tokens.push(buf);
          buf = "";
        }
        inBracket = true;
        continue;
      }
      if (ch === "]" && inBracket) {
        tokens.push(buf); // may be empty -> '[]'
        buf = "";
        inBracket = false;
        continue;
      }
      buf += ch;
    }
    if (buf) tokens.push(buf);
    return tokens;
  }

  /** Assign value at the tokenized path, creating arrays/objects as needed. */
  private static assign(
    root: Record<string, any> & { _root?: any[] },
    tokens: string[],
    value: any
  ): void {
    let node: any = root;
    let parent: any = null;
    let parentKey: any = null;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const last = i === tokens.length - 1;

      // Empty token -> "push" (i.e., [])
      if (token === "") {
        // Ensure current node is an array (create it if we're on a property)
        if (!Array.isArray(node)) {
          if (parent) {
            if (parent[parentKey] === undefined || !Array.isArray(parent[parentKey])) {
              parent[parentKey] = [];
            }
            node = parent[parentKey];
          } else {
            // root-level [] (rare) -> treat root as array-like bag
            if (!Array.isArray(root._root)) root._root = [];
            node = root._root;
          }
        }

        if (last) {
          node.push(value);
          return;
        }

        // Prepare an element to descend into
        const next = tokens[i + 1];
        let elem: any;
        const needArray = next === "" || /^\d+$/.test(next);

        const tail = node[node.length - 1];
        if (
          tail !== undefined &&
          this.isPlainObject(tail) &&
          !needArray &&
          tail[next] === undefined
        ) {
          elem = tail;
        } else if (Array.isArray(tail) && needArray) {
          elem = tail;
        } else {
          elem = needArray ? [] : {};
          node.push(elem);
        }

        parent = node;
        parentKey = node.length - 1;
        node = elem;
        continue;
      }

      // Numeric token -> array index
      const isIndex = /^\d+$/.test(token);
      const key: number | string = isIndex ? Number(token) : token;

      if (last) {
        if (Array.isArray(node) && isIndex) {
          node[key] = value;
        } else if (Array.isArray(node) && !isIndex) {
          // array of objects: ensure object at tail
          if (!this.isPlainObject(node[node.length - 1])) node.push({});
          node[node.length - 1][key] = value;
        } else {
          if (node[key] === undefined) {
            node[key] = value;
          } else {
            // duplicate scalar keys -> array
            if (!Array.isArray(node[key])) node[key] = [node[key]];
            node[key].push(value);
          }
        }
        return;
      }

      // Not last: descend, creating structure if needed
      const next = tokens[i + 1];
      const nextIsArrayish = next === "" || /^\d+$/.test(next);

      if (Array.isArray(node)) {
        if (!isIndex) {
          if (!this.isPlainObject(node[node.length - 1])) node.push({});
          parent = node[node.length - 1];
          parentKey = key;
          if (parent[key] === undefined) parent[key] = nextIsArrayish ? [] : {};
          node = parent[key];
          continue;
        }
        if (node[key] === undefined) node[key] = nextIsArrayish ? [] : {};
        parent = node;
        parentKey = key;
        node = node[key];
        continue;
      }

      if (node[key] === undefined) node[key] = nextIsArrayish ? [] : {};
      parent = node;
      parentKey = key;
      node = node[key];
    }
  }

  private static isPrimitive(v: any): v is string | number | boolean | bigint | symbol | null | undefined {
    return v === null || (typeof v !== "object" && typeof v !== "function");
  }

  private static isPlainObject(v: any): v is Record<string, any> {
    return Object.prototype.toString.call(v) === "[object Object]";
  }

  private static isBlob(v: any): v is Blob {
    return typeof Blob !== "undefined" && v instanceof Blob;
  }

  /** Coerce strings to booleans/numbers/null if requested; keep File/Blob intact. */
  private static maybeCoerce(
    v: FormDataEntryValue,
    { coerce, emptyToNull }: Required<Pick<ToObjectOptions, "coerce" | "emptyToNull">>
  ): any {
    if (this.isBlob(v)) return v;
    if (!coerce) return v;

    const s = String(v);

    if (emptyToNull && s === "") return null;
    if (s === "true") return true;
    if (s === "false") return false;
    if (s === "null") return null;

    // Number (avoid stripping leading zeros like "0012")
    if (/^-?\d+(\.\d+)?$/.test(s) && !/^0\d+/.test(s)) {
      const num = Number(s);
      if (!Number.isNaN(num)) return num;
    }
    return s;
  }
}
