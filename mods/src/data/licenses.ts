// License families (the shared contract's A5: the launchers mirror this table
// and these functions). The JSON carries the SPDX id GitHub reports; only
// frontends sort it into a family, after the overrides below.
import type { Labels } from "./sprites.ts";

export type LicenseFamilyId = "permissive" | "weak-copyleft" | "copyleft" | "other" | "none";

export interface LicenseFamily {
  id: LicenseFamilyId;
  label: Labels;
}

/** In the order filters list them. */
export const LICENSE_FAMILIES: readonly LicenseFamily[] = [
  { id: "permissive", label: { en: "Permissive", "zh-CN": "宽松", "zh-Hant": "寬鬆" } },
  { id: "weak-copyleft", label: { en: "Weak copyleft", "zh-CN": "弱著佐权", "zh-Hant": "弱著佐權" } },
  { id: "copyleft", label: { en: "Copyleft", "zh-CN": "著佐权", "zh-Hant": "著佐權" } },
  { id: "other", label: { en: "Other", "zh-CN": "其他", "zh-Hant": "其他" } },
  { id: "none", label: { en: "No license", "zh-CN": "无许可证", "zh-Hant": "無授權條款" } },
];

export const LICENSE_FAMILY_BY_ID = new Map(LICENSE_FAMILIES.map((f) => [f.id, f]));

export const isLicenseFamily = (value: string): value is LicenseFamilyId => LICENSE_FAMILY_BY_ID.has(value as LicenseFamilyId);

/**
 * Licenses GitHub cannot tell (it reports NOASSERTION), read from the
 * repositories' license files, by lower-case `owner/repo`.
 */
export const LICENSE_OVERRIDES: Readonly<Record<string, string>> = {
  "copper-lamp/bschat": "AGPL-3.0",
  "ieckseyr/hologramlib": "MIT",
};

/** SPDX ids (upper case) and id patterns of each family; anything else is "other". */
const FAMILY_IDS: readonly [LicenseFamilyId, RegExp][] = [
  ["permissive", /^(?:MIT|APACHE-2\.0|BSD-.+|ISC|ZLIB|CC0-1\.0|UNLICENSE|0BSD)$/],
  ["weak-copyleft", /^(?:LGPL-.+|MPL-2\.0|EPL-2\.0)$/],
  ["copyleft", /^(?:A?GPL-.+)$/],
];

/** The family of an SPDX id (any case); `none` without one. */
export function licenseFamily(spdx: string | undefined): LicenseFamilyId {
  if (!spdx) return "none";
  const id = spdx.toUpperCase();
  return FAMILY_IDS.find(([, re]) => re.test(id))?.[0] ?? "other";
}

/** `github.com/Owner/Repo` (or `Owner/Repo`) → `owner/repo`. */
const repoKey = (id: string) => id.toLowerCase().split("/").slice(-2).join("/");

/** A mod's license as the listing shows it: the override for its repository, else the SPDX id GitHub reports. */
export function licenseOf(mod: { id: string; license?: string | undefined }): string | undefined {
  return LICENSE_OVERRIDES[repoKey(mod.id)] ?? (mod.license || undefined);
}
