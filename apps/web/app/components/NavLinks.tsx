"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/history", label: "History" },
  { href: "/pricing", label: "Pricing" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-6 sm:gap-8">
      {LINKS.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={
              "-m-2 rounded-lg p-2 text-sm font-medium transition-colors " +
              (active ? "text-stone-900" : "text-stone-500 hover:text-stone-900")
            }
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
