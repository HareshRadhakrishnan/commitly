"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  Search,
  Sun,
  Moon,
  Sparkles,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { signOutAction } from "./actions";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function NavItem({
  href,
  label,
  icon: Icon,
  isActive,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors duration-150",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          isActive ? "text-brand" : "text-muted-foreground",
        )}
        strokeWidth={1.5}
      />
      {label}
    </Link>
  );
}

function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className={cn(
          "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-sidebar-foreground transition-colors duration-150 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
          className,
        )}
      >
        <LogOut className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
        Sign out
      </button>
    </form>
  );
}

export function DashboardShell({
  children,
  userEmail,
  userName,
}: {
  children: React.ReactNode;
  userEmail: string;
  userName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [cmdOpen, setCmdOpen] = React.useState(false);

  const breadcrumb = React.useMemo(() => {
    if (pathname.startsWith("/dashboard/review")) return "Review";
    if (pathname.startsWith("/dashboard/billing")) return "Billing";
    if (pathname.startsWith("/dashboard/settings")) return "Settings";
    return "Dashboard";
  }, [pathname]);

  React.useEffect(() => {
    function down(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  function closeCmd() {
    setCmdOpen(false);
  }

  function navigate(href: string) {
    router.push(href);
    closeCmd();
  }

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
    closeCmd();
  }

  const displayName = userName || userEmail.split("@")[0] || "U";

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex min-h-screen bg-muted/30">
        {/* ── Desktop sidebar ──────────────────────────────── */}
        <aside className="hidden w-[200px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-4 py-5">
            <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-hover shadow-[0_4px_12px_rgba(139,92,246,0.25)]">
              <Sparkles className="size-4 text-white" strokeWidth={1.5} />
            </div>
            <span className="text-[15px] font-semibold text-foreground">Commitly AI</span>
          </div>

          {/* Nav links */}
          <nav className="flex flex-1 flex-col gap-0.5 px-3">
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                isActive={
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href)
                }
              />
            ))}
          </nav>

          {/* User footer */}
          <div className="border-t border-sidebar-border px-3 py-3">
            <div className="mb-1 flex items-center gap-2 px-3 py-1.5">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-muted text-[11px] font-semibold text-brand">
                {displayName[0]?.toUpperCase()}
              </div>
              <span className="max-w-[110px] truncate text-[12px] text-sidebar-foreground">
                {userEmail}
              </span>
            </div>
            <SignOutButton />
          </div>
        </aside>

        {/* ── Mobile sheet ──────────────────────────────────── */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="border-b border-sidebar-border">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-hover shadow-[0_4px_12px_rgba(139,92,246,0.25)]">
                  <Sparkles className="size-4 text-white" strokeWidth={1.5} />
                </div>
                <span className="text-[15px] font-semibold text-foreground">Commitly AI</span>
              </div>
            </SheetHeader>

            <nav className="flex flex-1 flex-col gap-0.5 px-3 pt-2">
              {navItems.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href)
                  }
                  onClick={() => setSheetOpen(false)}
                />
              ))}
            </nav>

            <div className="border-t border-sidebar-border px-3 py-3">
              <SignOutButton />
            </div>
          </SheetContent>
        </Sheet>

        {/* ── Main column ───────────────────────────────────── */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Sticky top bar */}
          <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-sm">
            {/* Left: mobile menu + breadcrumb */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon-sm"
                className="md:hidden"
                onClick={() => setSheetOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="size-5" strokeWidth={1.5} />
              </Button>
              <span className="text-sm font-medium text-foreground">{breadcrumb}</span>
            </div>

            {/* Right: Cmd+K + theme */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden gap-2 border-border text-muted-foreground sm:flex"
                    onClick={() => setCmdOpen(true)}
                  >
                    <Search className="size-3.5" strokeWidth={1.5} />
                    <span className="text-xs">Search</span>
                    <kbd className="ml-1 hidden h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
                      <span className="text-xs">⌘</span>K
                    </kbd>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Open command palette (⌘K)</TooltipContent>
              </Tooltip>

              <Button
                variant="ghost"
                size="icon-sm"
                className="sm:hidden"
                onClick={() => setCmdOpen(true)}
                aria-label="Search"
              >
                <Search className="size-4" strokeWidth={1.5} />
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                  >
                    <Sun className="size-4 rotate-0 scale-100 transition-all duration-150 dark:-rotate-90 dark:scale-0" strokeWidth={1.5} />
                    <Moon className="absolute size-4 rotate-90 scale-0 transition-all duration-150 dark:rotate-0 dark:scale-100" strokeWidth={1.5} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle theme</TooltipContent>
              </Tooltip>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 px-4 py-8 md:px-8 md:py-10">
            {children}
          </main>
        </div>

        {/* ── Command palette ───────────────────────────────── */}
        <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen}>
          <CommandInput placeholder="Search or navigate…" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigate">
              <CommandItem onSelect={() => navigate("/dashboard")}>
                <LayoutDashboard className="text-brand" strokeWidth={1.5} />
                Dashboard
              </CommandItem>
              <CommandItem onSelect={() => navigate("/dashboard/billing")}>
                <CreditCard className="text-brand" strokeWidth={1.5} />
                Billing
              </CommandItem>
              <CommandItem onSelect={() => navigate("/dashboard/settings")}>
                <Settings className="text-brand" strokeWidth={1.5} />
                Settings
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Actions">
              <CommandItem onSelect={toggleTheme}>
                <Monitor strokeWidth={1.5} />
                Toggle theme
                <CommandShortcut>⌘T</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={async () => {
                  closeCmd();
                  await signOutAction();
                }}
              >
                <LogOut strokeWidth={1.5} />
                Sign out
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </div>
    </TooltipProvider>
  );
}
