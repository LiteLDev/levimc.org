import Link from "next/link";
import { Search } from "@/components/search";
import { Suspense } from "react";
import Image from "next/image";

export function Header() {
  return (
    <header className="border-b bg-white dark:bg-gray-950 dark:border-gray-800">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-bold text-xl tracking-tight hover:opacity-80 transition-opacity shrink-0"
        >
          <Image
            src="/icon.png"
            alt="Bedrinth icon"
            width={22}
            height={22}
            className="rounded-md"
          />
          bedrinth
        </Link>
        <div className="flex-1 max-w-md">
          <Suspense>
            <Search />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
