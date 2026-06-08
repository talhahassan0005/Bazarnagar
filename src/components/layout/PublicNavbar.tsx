import Link from "next/link";
import { Search } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui";

/** Top navigation for public/customer-facing pages. */
export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <Link
          href="/search"
          className="group hidden flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-400 transition-colors hover:border-brand-300 hover:bg-white sm:flex sm:max-w-md"
        >
          <Search className="h-4 w-4 transition-colors group-hover:text-brand-500" />
          Search products, shops, cities…
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/search"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 sm:hidden"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Link>
          <Button href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
            Seller Login
          </Button>
          <Button href="/signup" variant="accent" size="sm">
            Sell on Bazaarnagar
          </Button>
        </div>
      </div>
    </header>
  );
}
