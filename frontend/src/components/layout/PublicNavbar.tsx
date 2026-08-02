"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Info, LogOut, PackageSearch, Search, Store as StoreIcon } from "lucide-react";
import { Logo } from "./Logo";
import { CartLink } from "./CartLink";
import { Button } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/authSlice";
import { clearToken } from "@/lib/api";

/** Top navigation for public/customer-facing pages. */
export function PublicNavbar() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const role = useAppSelector((s) => s.auth.role);
  const customer = useAppSelector((s) => s.auth.customer);
  const isCustomer = role === "customer";

  function handleLogout() {
    clearToken();
    dispatch(logout());
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        {/* Product search (desktop) */}
        <Link
          href="/search"
          className="group hidden flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-400 transition-colors hover:border-brand-300 hover:bg-white sm:flex sm:max-w-md"
        >
          <Search className="h-4 w-4 transition-colors group-hover:text-brand-500" />
          Search products…
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Desktop nav links */}
          <Link
            href="/shops"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 sm:inline-flex"
          >
            Shops
          </Link>
          <Link
            href="/search"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 sm:inline-flex"
          >
            Products
          </Link>
          <Link
            href="/about"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 sm:inline-flex"
          >
            About
          </Link>
          {isCustomer && (
            <Link
              href="/wishlist"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 sm:inline-flex"
            >
              Wishlist
            </Link>
          )}
          <Link
            href="/orders"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 sm:inline-flex"
          >
            My Orders
          </Link>

          {/* Mobile icons */}
          <Link
            href="/search"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 sm:hidden"
            aria-label="Search products"
          >
            <Search className="h-5 w-5" />
          </Link>
          <Link
            href="/shops"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 sm:hidden"
            aria-label="Browse shops"
          >
            <StoreIcon className="h-5 w-5" />
          </Link>
          <Link
            href="/about"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 sm:hidden"
            aria-label="About"
          >
            <Info className="h-5 w-5" />
          </Link>
          {isCustomer && (
            <Link
              href="/wishlist"
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 sm:hidden"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" />
            </Link>
          )}
          <Link
            href="/orders"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 sm:hidden"
            aria-label="My Orders"
          >
            <PackageSearch className="h-5 w-5" />
          </Link>

          <CartLink />

          {isCustomer ? (
            <>
              <span className="hidden text-sm font-medium text-slate-600 sm:inline">
                Hi, {customer?.name.split(" ")[0]}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Log out"
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </>
          ) : (
            <Button href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
              Login
            </Button>
          )}
          <Button href="/signup?role=seller" variant="accent" size="sm">
            <span className="sm:hidden">Sell</span>
            <span className="hidden sm:inline">Sell on Bazaarnagar</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
