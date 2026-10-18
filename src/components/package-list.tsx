import { PixelIcon } from "../../kit/components";
import type { Package } from "../types";
import { PackageCard } from "./package-card";

interface PackageListProps {
  packages: Package[];
}

export function PackageList({ packages }: PackageListProps) {
  if (packages.length === 0) {
    return (
      <div className="pkg-empty">
        <span className="kit-slot pkg-empty-slot" aria-hidden="true">
          <PixelIcon name="compass" size={32} />
        </span>
        <p>No packages found.</p>
      </div>
    );
  }

  return (
    <div className="pkg-grid">
      {packages.map((pkg) => (
        <PackageCard key={pkg.tooth} pkg={pkg} />
      ))}
    </div>
  );
}
