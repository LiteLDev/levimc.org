// The sides an entry of a package file runs on (lip.toml `side`), with their
// labels and sprites. The ids are the values of the listing's `side=` query
// parameter (`env=` in older links).
import type { Side } from "../types.ts";
import type { Labels, SpriteName } from "./sprites.ts";

export interface SideDef {
  id: Side;
  label: Labels;
  icon: SpriteName;
}

/** Server first, as the JSON lists sides. */
export const SIDES: readonly SideDef[] = [
  { id: "server", label: { en: "Server", "zh-CN": "服务端", "zh-Hant": "伺服器端" }, icon: "menu" },
  { id: "client", label: { en: "Client", "zh-CN": "客户端", "zh-Hant": "用戶端" }, icon: "monitor" },
];

export const SIDE_BY_ID = new Map(SIDES.map((s) => [s.id, s]));

export const isSide = (value: string): value is Side => SIDE_BY_ID.has(value as Side);
