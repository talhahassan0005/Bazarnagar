"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Globe, Heart, LogOut, Menu, MessageCircle, PackageSearch,
  Search, Store as StoreIcon, Tag, X, ChevronRight,
} from "lucide-react";
import { Logo } from "./Logo";
import { CartLink } from "./CartLink";
import { Button } from "@/components/ui";
import { CreateStoreButton } from "@/components/marketing/CreateStoreButton";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/authSlice";
import { clearToken } from "@/lib/api";
import { disconnectChatSocket } from "@/lib/socket";
import { useCountry } from "@/lib/useCountry";
import { COUNTRY_OPTIONS } from "@/lib/countries";

const COUNTRY_PICKER_PATHS = new Set(["/", "/search", "/shops"]);

function NavCountryPicker() {
  const { country, setCountry } = useCountry();
  const customer = useAppSelector((s) => s.auth.customer);
  const pathname = usePathname();
  if (customer) return null;
  if (!COUNTRY_PICKER_PATHS.has(pathname)) return null;
  return (
    <div className="relative hidden items-center sm:flex">
      <Globe className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-slate-400" />
      <select
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        className="appearance-none rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-5 text-xs font-medium text-slate-600 outline-none transition-colors hover:border-brand-300 hover:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        title="Select your country"
      >
        {COUNTRY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-1.5 text-[10px] text-slate-400">▾</span>
    </div>
  );
}

/** Top navigation for public/customer-facing pages. */
export function PublicNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const role = useAppSelector((s) => s.auth.role);
  const customer = useAppSelector((s) => s.auth.customer);
  const isCustomer = role === "customer";
  const { country, setCountry } = useCountry();
  const showCountryPicker = !customer && COUNTRY_PICKER_PATHS.has(pathname);

  const [drawerOpen, setDrawerOpen] = useState(false);

  function handleLogout() {
    clearToken();
    disconnectChatSocket();
    dispatch(logout());
    setDrawerOpen(false);
    router.push("/");
  }

  const navLink = (href: string, label: string, Icon: React.ElementType) => (
    <Link
      href={href}
      onClick={() => setDrawerOpen(false)}
      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="h-4 w-4" />
      </span>
      {label}
      <ChevronRight className="ml-auto h-4 w-4 text-slate-300" />
    </Link>
  );

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Logo />

          {/* Search bar — desktop only, hidden on /search page */}
          {pathname !== "/search" && (
            <Link
              href="/search"
              className="group hidden flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-400 transition-colors hover:border-brand-300 hover:bg-white sm:flex sm:max-w-md"
            >
              <Search className="h-4 w-4 transition-colors group-hover:text-brand-500" />
              Search products…
            </Link>
          )}

          {/* Desktop right links */}
          <nav className="hidden items-center gap-1 sm:flex">
            <Link href="/shops" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100">Shops</Link>
            <Link href="/search" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100">Products</Link>
            <Link href="/pricing" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100">Pricing</Link>
            {isCustomer && <Link href="/wishlist" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100">Wishlist</Link>}
            {isCustomer && <Link href="/chats" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100">Chats</Link>}
            <Link href="/orders" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100">My Orders</Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
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
                  className="hidden rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 sm:block"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <Button href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
                Login
              </Button>
            )}

            {role === "seller" ? (
              <Button href="/dashboard" variant="accent" size="sm" className="hidden lg:inline-flex">
                My dashboard
              </Button>
            ) : (
              role !== "admin" && (
                <CreateStoreButton
                  size="sm"
                  className="hidden rounded-full px-4 shadow-md shadow-accent-500/25 lg:inline-flex"
                />
              )
            )}

            {/* Hamburger — mobile only */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 sm:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
              <Logo />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User greeting */}
            {isCustomer && (
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-xs text-slate-400">Signed in as</p>
                <p className="text-sm font-semibold text-slate-800">{customer?.name}</p>
              </div>
            )}

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              <Link
                href="/search"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <Search className="h-4 w-4" />
                </span>
                Search Products
                <ChevronRight className="ml-auto h-4 w-4 text-slate-300" />
              </Link>
              {navLink("/shops", "Browse Shops", StoreIcon)}
              {navLink("/pricing", "Pricing", Tag)}
              {navLink("/orders", "My Orders", PackageSearch)}
              {isCustomer && navLink("/wishlist", "Wishlist", Heart)}
              {isCustomer && navLink("/chats", "Chats", MessageCircle)}

              {/* Country picker inside drawer */}
              {showCountryPicker && (
                <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Shopping in</p>
                  <div className="relative">
                    <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm text-slate-700 outline-none focus:border-brand-500"
                    >
                      {COUNTRY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">▾</span>
                  </div>
                </div>
              )}
            </nav>

            {/* Footer actions */}
            <div className="border-t border-slate-100 px-4 py-4 space-y-2">
              {isCustomer ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              ) : (
                <Button href="/login" variant="outline" className="w-full" onClick={() => setDrawerOpen(false)}>
                  Login
                </Button>
              )}

              {role === "seller" ? (
                <Button href="/dashboard" variant="accent" className="w-full" onClick={() => setDrawerOpen(false)}>
                  My dashboard
                </Button>
              ) : (
                role !== "admin" && role !== "customer" && (
                  <CreateStoreButton className="w-full rounded-full" />
                )
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
