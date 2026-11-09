// The Scriban templates of a package file, rendered as lip renders them
// (protocol/package.md §3): every string of the document is a template whose
// variables are the document's top-level members as written. A port of
// LeviLauncher's `internal/lipcore/migrate/{render_doc,template}.go`, which
// implements the subset of Scriban 7.5 manifests use — variable references
// with member and index access — and rejects everything else, so a template
// lip would render differently is never rendered wrong here: it fails.
//
// Values are JSON values, numbers kept as their literal (`1.50` renders as
// `1.50`, the way .NET's decimal does).

/** A number, as its literal. */
export class TemplateNumber {
  readonly text: string;
  constructor(text: string) {
    this.text = text;
  }
}

/** An object, its members in order (a later one of the same key wins, as in lip). */
export class TemplateObject {
  readonly members: [string, TemplateValue][];
  constructor(members: [string, TemplateValue][]) {
    this.members = members;
  }
  get(key: string): TemplateValue | undefined {
    for (let i = this.members.length - 1; i >= 0; i--) if (this.members[i]![0] === key) return this.members[i]![1];
    return undefined;
  }
}

export type TemplateValue = null | boolean | string | TemplateNumber | TemplateValue[] | TemplateObject;

/** A template lip cannot render, or one outside the subset rendered here. */
export class TemplateError extends Error {
  /** A construct this subset does not implement (lip might render it). */
  readonly unsupported: boolean;
  constructor(message: string, unsupported = false) {
    super(message);
    this.unsupported = unsupported;
  }
}

const unsupported = (what: string) => new TemplateError(`unsupported Scriban template construct: ${what}`, true);
const templateError = (what: string) => new TemplateError(`template error: ${what}`);

type Scope = (name: string) => TemplateValue | undefined;

/** Renders every string of `root` (object keys excepted) with its top-level members as variables. */
export function renderDocument(root: TemplateValue): TemplateValue {
  if (!(root instanceof TemplateObject)) return root;
  const scope: Scope = (name) => root.get(name);
  const walk = (v: TemplateValue): TemplateValue => {
    if (typeof v === "string") return renderTemplate(v, scope);
    if (Array.isArray(v)) return v.map(walk);
    if (v instanceof TemplateObject) return new TemplateObject(v.members.map(([k, m]) => [k, walk(m)]));
    return v;
  };
  return walk(root);
}

/** Renders one template (`Template.Parse(src).Render(model)`); throws a {@link TemplateError}. */
export function renderTemplate(src: string, scope: Scope): string {
  let out = "";
  let i = 0;
  let rightTrim = ""; // whitespace control of the previous tag: "", "-", "~"
  for (;;) {
    const [next, raw] = findTag(src, i);
    let text = src.slice(i, next < 0 ? src.length : next);
    text = trimLeft(text, rightTrim);
    rightTrim = "";
    if (next >= 0 && !raw && next + 2 < src.length && (src[next + 2] === "-" || src[next + 2] === "~")) {
      text = trimRight(text, src[next + 2]!);
    }
    out += text;
    if (next < 0) return out;
    if (raw) {
      const start = next + 3;
      const k = src.indexOf("}%}", start);
      if (k < 0) return out + src.slice(start);
      out += src.slice(start, k);
      i = k + 3;
      continue;
    }
    let start = next + 2;
    if (start < src.length && (src[start] === "-" || src[start] === "~")) start++;
    const closeAt = findCodeEnd(src, start);
    let code: string;
    if (closeAt < 0) {
      code = src.slice(start);
      i = src.length;
    } else {
      code = src.slice(start, closeAt);
      i = closeAt + 2;
      const last = code.at(-1);
      if (last === "-" || last === "~") {
        rightTrim = last;
        code = code.slice(0, -1);
      }
    }
    out += evalCode(code, scope);
    if (closeAt < 0) return out;
  }
}

/** The next `{{` or `{%{` at or after `i` (and whether it is the raw one). */
function findTag(s: string, i: number): [number, boolean] {
  for (let j = i; j + 1 < s.length; j++) {
    if (s[j] !== "{") continue;
    if (s[j + 1] === "{") return [j, false];
    if (s[j + 1] === "%" && s[j + 2] === "{") return [j, true];
  }
  return [-1, false];
}

/** The `}}` closing the code block starting at `i`, skipping string literals and comments; -1: none. */
function findCodeEnd(s: string, i: number): number {
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (c === '"' || c === "'" || c === "`") {
      j = skipString(s, j);
      if (j < 0) return -1;
    } else if (c === "#") {
      while (j + 1 < s.length && s[j + 1] !== "\n" && !(s[j + 1] === "}" && s[j + 2] === "}")) j++;
    } else if (c === "}" && s[j + 1] === "}") {
      return j;
    }
  }
  return -1;
}

/** The closing quote of the literal starting at `s[i]`; -1: none. */
function skipString(s: string, i: number): number {
  const q = s[i];
  for (let j = i + 1; j < s.length; j++) {
    if (s[j] === "\\" && q !== "`") {
      j++;
      continue;
    }
    if (s[j] === q) return j;
  }
  return -1;
}

const SPACE = /\s/u;
const isSpace = (c: string) => SPACE.test(c);
const isInlineSpace = (c: string) => c !== "\n" && c !== "\r" && isSpace(c);

function trimLeft(text: string, mode: string): string {
  if (mode === "-") {
    let k = 0;
    while (k < text.length && isSpace(text[k]!)) k++;
    return text.slice(k);
  }
  if (mode === "~") {
    let k = 0;
    while (k < text.length && isInlineSpace(text[k]!)) k++;
    text = text.slice(k);
    if (text.startsWith("\r\n")) return text.slice(2);
    if (text.startsWith("\n")) return text.slice(1);
  }
  return text;
}

function trimRight(text: string, mode: string): string {
  const test = mode === "-" ? isSpace : mode === "~" ? isInlineSpace : null;
  if (!test) return text;
  let k = text.length;
  while (k > 0 && test(text[k - 1]!)) k--;
  return text.slice(0, k);
}

// --- lexer ---

type TokenKind = "ident" | "local" | "string" | "int" | "dot" | "lbrack" | "rbrack" | "minus" | "sep" | "other";

interface Token {
  kind: TokenKind;
  /** An identifier's name, a string's decoded value, an integer's literal or the raw text. */
  text: string;
}

const isIdentStart = (c: string | undefined) => !!c && /^[A-Za-z_]$/.test(c);
const isIdentPart = (c: string | undefined) => !!c && /^[A-Za-z0-9_]$/.test(c);
const isDigit = (c: string | undefined) => !!c && c >= "0" && c <= "9";

function lexCode(code: string): Token[] {
  const toks: Token[] = [];
  for (let i = 0; i < code.length; ) {
    const c = code[i]!;
    if (c === "\n" || c === ";") {
      toks.push({ kind: "sep", text: c });
      i++;
    } else if (c === " " || c === "\t" || c === "\r") {
      i++;
    } else if (c === "#") {
      while (i < code.length && code[i] !== "\n") i++;
    } else if (c === ".") {
      toks.push({ kind: "dot", text: c });
      i++;
    } else if (c === "[") {
      toks.push({ kind: "lbrack", text: c });
      i++;
    } else if (c === "]") {
      toks.push({ kind: "rbrack", text: c });
      i++;
    } else if (c === "-") {
      toks.push({ kind: "minus", text: c });
      i++;
    } else if (c === '"' || c === "'" || c === "`") {
      const end = skipString(code, i);
      if (end < 0) throw templateError("unterminated string literal");
      toks.push({ kind: "string", text: unquote(code.slice(i + 1, end), c) });
      i = end + 1;
    } else if (isIdentStart(c)) {
      let j = i + 1;
      while (isIdentPart(code[j])) j++;
      toks.push({ kind: "ident", text: code.slice(i, j) });
      i = j;
    } else if (c === "$" && isIdentStart(code[i + 1])) {
      let j = i + 2;
      while (isIdentPart(code[j])) j++;
      toks.push({ kind: "local", text: code.slice(i + 1, j) });
      i = j;
    } else if (isDigit(c)) {
      let j = i + 1;
      while (isDigit(code[j])) j++;
      if ((code[j] === "." && isDigit(code[j + 1])) || isIdentStart(code[j])) throw unsupported(`number literal ${code.slice(i)}`);
      toks.push({ kind: "int", text: code.slice(i, j) });
      i = j;
    } else {
      const ch = String.fromCodePoint(code.codePointAt(i)!);
      toks.push({ kind: "other", text: ch });
      i += ch.length;
    }
  }
  return toks;
}

const ESCAPES: Record<string, string> = { "'": "'", '"': '"', "\\": "\\", "0": "\0", a: "\x07", b: "\b", f: "\f", n: "\n", r: "\r", t: "\t", v: "\v" };
const isSurrogate = (cp: number) => cp >= 0xd800 && cp <= 0xdfff;

/** A string literal's body, decoded: backtick strings are verbatim, the others take backslash escapes. */
function unquote(body: string, q: string): string {
  if (q === "`") return body;
  let out = "";
  for (let i = 0; i < body.length; i++) {
    const c = body[i]!;
    if (c !== "\\") {
      out += c;
      continue;
    }
    i++;
    if (i >= body.length) throw templateError("bad escape");
    const e = body[i]!;
    if (e in ESCAPES) {
      out += ESCAPES[e];
    } else if (e === "x" || e === "u") {
      const n = e === "u" ? 4 : 2;
      const hex = body.slice(i + 1, i + 1 + n);
      if (hex.length < n || !/^[0-9A-Fa-f]+$/.test(hex)) throw templateError("bad escape");
      i += n;
      let cp = parseInt(hex, 16);
      // a \uD800-\uDBFF \uDC00-\uDFFF pair is one code point; a lone surrogate becomes U+FFFD
      if (cp >= 0xd800 && cp < 0xdc00 && body[i + 1] === "\\" && body[i + 2] === "u") {
        const low = body.slice(i + 3, i + 7);
        if (/^[0-9A-Fa-f]{4}$/.test(low)) {
          const lo = parseInt(low, 16);
          if (lo >= 0xdc00 && lo <= 0xdfff) {
            cp = 0x10000 + ((cp - 0xd800) << 10) + (lo - 0xdc00);
            i += 6;
          }
        }
      }
      out += isSurrogate(cp) ? "\uFFFD" : String.fromCodePoint(cp);
    } else {
      throw templateError(`bad escape \\${e}`);
    }
  }
  return out;
}

/** Scriban statement keywords: this subset does not implement them. */
const CONTROL_KEYWORDS = new Set([
  "if", "else", "end", "for", "in", "while", "func", "ret", "break", "continue", "case", "when", "with", "wrap",
  "capture", "readonly", "import", "tablerow", "this", "do",
]);

/** Scriban's builtin function objects; a member of the same name shadows them, else rendering one is unsupported. */
const BUILTIN_OBJECTS = new Set(["array", "date", "html", "include", "math", "object", "regex", "string", "timespan"]);

// --- evaluator ---

function evalCode(code: string, scope: Scope): string {
  let toks = lexCode(code);
  let out = "";
  while (toks.length) {
    let n = 0;
    while (n < toks.length && toks[n]!.kind !== "sep") n++;
    const stmt = toks.slice(0, n);
    toks = toks.slice(n + 1);
    if (stmt.length) out += renderValue(evalExpr(stmt, scope));
  }
  return out;
}

const nullish = (v: TemplateValue | undefined): TemplateValue => (v === undefined ? null : v);

/** Evaluates `primary accessor*`. */
function evalExpr(toks: Token[], scope: Scope): TemplateValue {
  let v: TemplateValue = null;
  let name: string;
  const first = toks[0]!;
  switch (first.kind) {
    case "ident":
      name = first.text;
      if (name === "true" || name === "false") v = name === "true";
      else if (name === "null") v = null;
      else if (CONTROL_KEYWORDS.has(name)) throw unsupported(`keyword "${name}"`);
      else {
        const found = scope(name);
        if (found !== undefined) v = found;
        else if (BUILTIN_OBJECTS.has(name)) throw unsupported(`builtin "${name}"`);
      }
      break;
    case "local":
      name = `$${first.text}`;
      break;
    case "string":
      name = "";
      v = first.text;
      break;
    case "int":
      name = "";
      v = new TemplateNumber(first.text);
      break;
    default:
      throw unsupported(`unexpected "${first.text}"`);
  }
  let rest = toks.slice(1);
  while (rest.length) {
    const tok = rest[0]!;
    if (tok.kind === "dot") {
      if (rest[1]?.kind !== "ident") throw unsupported("bad member access");
      const member = rest[1].text;
      rest = rest.slice(2);
      if (v === null) throw templateError(`cannot get the member ${name}.${member} for a null object`);
      name += `.${member}`;
      v = getMember(v, member);
    } else if (tok.kind === "lbrack") {
      let idx: Token;
      let neg = false;
      let close: number;
      if (rest.length >= 3 && (rest[1]!.kind === "int" || rest[1]!.kind === "string") && rest[2]!.kind === "rbrack") {
        idx = rest[1]!;
        close = 2;
      } else if (rest.length >= 4 && rest[1]!.kind === "minus" && rest[2]!.kind === "int" && rest[3]!.kind === "rbrack") {
        idx = rest[2]!;
        neg = true;
        close = 3;
      } else {
        throw unsupported("unsupported indexer");
      }
      rest = rest.slice(close + 1);
      if (v === null) throw templateError(`object ${name} is null, cannot access indexer`);
      name += "[]";
      v = getIndex(v, idx, neg);
    } else {
      throw unsupported(`unexpected "${tok.text}"`);
    }
  }
  return v;
}

function getMember(v: TemplateValue, member: string): TemplateValue {
  if (v instanceof TemplateObject) return nullish(v.get(member));
  if (Array.isArray(v) && member === "size") return new TemplateNumber(String(v.length));
  if (typeof v === "string" && member === "size") return new TemplateNumber(String(v.length));
  return null;
}

function getIndex(v: TemplateValue, idx: Token, neg: boolean): TemplateValue {
  if (v instanceof TemplateObject) return idx.kind === "string" ? nullish(v.get(idx.text)) : null;
  if (Array.isArray(v)) {
    if (idx.kind !== "int") return null;
    let n = Number(idx.text);
    if (!Number.isSafeInteger(n)) return null;
    if (neg && n !== 0) n = v.length - n;
    return n < 0 || n >= v.length ? null : nullish(v[n]);
  }
  if (typeof v === "string") {
    if (idx.kind !== "int") throw unsupported("string indexer");
    let n = Number(idx.text);
    if (!Number.isSafeInteger(n)) throw templateError("index out of range");
    if (neg && n !== 0) n = v.length - n;
    if (n < 0 || n >= v.length) throw templateError("index out of range");
    const unit = v[n]!;
    return isSurrogate(unit.charCodeAt(0)) ? "\uFFFD" : unit;
  }
  throw unsupported("indexer on a scalar");
}

/** A value as text, as Scriban's TemplateContext writes it. */
function renderValue(v: TemplateValue): string {
  if (v === null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "boolean") return String(v);
  if (v instanceof TemplateNumber) return formatNumber(v.text);
  return literal(v);
}

/** Nested values the way Scriban renders arrays and objects: `[1, "s", null]`, `{key: value, "not ident": 1}`. */
function literal(v: TemplateValue): string {
  if (v === null) return "null";
  if (typeof v === "boolean") return String(v);
  if (v instanceof TemplateNumber) return formatNumber(v.text);
  if (typeof v === "string") return scribanString(v);
  if (Array.isArray(v)) return `[${v.map(literal).join(", ")}]`;
  return `{${v.members.map(([k, m]) => `${isLiteralKey(k) ? k : scribanString(k)}: ${literal(m)}`).join(", ")}}`;
}

const isLiteralKey = (k: string) => /^[_\p{L}][_\p{L}\p{Nd}]*$/u.test(k);

const STRING_ESCAPES: Record<string, string> = { '"': '\\"', "\\": "\\\\", "\x07": "\\a", "\b": "\\b", "\t": "\\t", "\n": "\\n", "\v": "\\v", "\f": "\\f", "\r": "\\r" };

function scribanString(s: string): string {
  let out = '"';
  for (const c of s) {
    const code = c.charCodeAt(0);
    out += STRING_ESCAPES[c] ?? (code < 0x20 ? `\\x${code.toString(16).padStart(2, "0")}` : c);
  }
  return `${out}"`;
}

/** System.Decimal's 96-bit mantissa limit. */
const DECIMAL_MAX_MANTISSA = (1n << 96n) - 1n;
const INT64_MIN = -(1n << 63n);
const INT64_MAX = (1n << 63n) - 1n;

/**
 * A number literal as Scriban renders it: an integer that fits in a long as
 * such, anything else as System.Decimal, which keeps the literal's scale
 * (`1.50`, `1e3` → `1000`, `100e-2` → `1.00`). A literal a decimal cannot
 * hold exactly is unsupported.
 */
export function formatNumber(lit: string): string {
  if (/^-?\d+$/.test(lit)) {
    const n = BigInt(lit);
    if (n >= INT64_MIN && n <= INT64_MAX) return n.toString();
  }
  let s = lit;
  const neg = s.startsWith("-");
  if (neg) s = s.slice(1);
  let mant = s;
  let exp = 0;
  const k = s.search(/[eE]/);
  if (k >= 0) {
    mant = s.slice(0, k);
    const e = s.slice(k + 1).replace(/^\+/, "");
    if (!/^-?\d+$/.test(e) || Math.abs(Number(e)) > 1000) throw unsupported(`number ${lit}`);
    exp = Number(e);
  }
  const dot = mant.indexOf(".");
  const intPart = dot >= 0 ? mant.slice(0, dot) : mant;
  const frac = dot >= 0 ? mant.slice(dot + 1) : "";
  let digits = intPart + frac;
  let scale = frac.length - exp;
  if (scale < 0) {
    digits += "0".repeat(-scale);
    scale = 0;
  }
  if (!/^\d+$/.test(digits) || BigInt(digits) > DECIMAL_MAX_MANTISSA || scale > 28) throw unsupported(`number ${lit}`);
  if (digits.length < scale + 1) digits = "0".repeat(scale + 1 - digits.length) + digits;
  const ip = digits.slice(0, digits.length - scale).replace(/^0+/, "") || "0";
  let out = scale > 0 ? `${ip}.${digits.slice(digits.length - scale)}` : ip;
  if (neg && /[1-9]/.test(digits)) out = `-${out}`;
  return out;
}
