export interface PackageInfo {
  name: string;
  description: string;
  tags: string[];
  avatar_url?: string;
}

export interface RawPackageEntry {
  info: PackageInfo;
  updated_at: string;
  stargazer_count: number;
  variants: Record<string, { versions: string[] }>;
}

export interface Package {
  tooth: string;
  info: PackageInfo;
  stars: number;
  updated: string;
  versions: string[];
}

export interface PackageIndex {
  format_version: number;
  format_uuid: string;
  packages: Record<string, RawPackageEntry>;
}
