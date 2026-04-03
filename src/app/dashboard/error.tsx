"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw, LayoutDashboard, ServerCrash, Wifi } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type DashboardErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

type ErrorContext = {
  icon: typeof AlertTriangle
  iconBg: string
  iconColor: string
  title: string
  description: string
  hint?: string
}

const getErrorContext = (error: Error): ErrorContext => {
  const msg = error.message?.toLowerCase() ?? ""

  const isDb =
    msg.includes("database") ||
    msg.includes("supabase") ||
    msg.includes("connection") ||
    msg.includes("fetch failed") ||
    msg.includes("econnrefused") ||
    error.name === "FetchError"

  const isTimeout = msg.includes("timeout") || msg.includes("timed out")
  const isNetwork = msg.includes("network") || msg.includes("offline")

  if (isTimeout) {
    return {
      icon: Wifi,
      iconBg: "bg-amber-50 dark:bg-amber-950/30",
      iconColor: "text-amber-600 dark:text-amber-400",
      title: "Request timed out",
      description:
        "The server took too long to respond. This can happen with slow connections or heavy load.",
      hint: "Try refreshing the page — your data is safe.",
    }
  }

  if (isNetwork) {
    return {
      icon: Wifi,
      iconBg: "bg-amber-50 dark:bg-amber-950/30",
      iconColor: "text-amber-600 dark:text-amber-400",
      title: "Network issue detected",
      description: "Check your internet connection and try again.",
    }
  }

  if (isDb) {
    return {
      icon: ServerCrash,
      iconBg: "bg-amber-50 dark:bg-amber-950/30",
      iconColor: "text-amber-600 dark:text-amber-400",
      title: "Database temporarily unavailable",
      description:
        "We're having trouble reaching our database. This outage is usually brief and resolves on its own.",
      hint: "Your projects and drafts are safe. Please try again in a moment.",
    }
  }

  return {
    icon: AlertTriangle,
    iconBg: "bg-red-50 dark:bg-red-950/30",
    iconColor: "text-destructive",
    title: "Something went wrong",
    description:
      "An unexpected error occurred while loading this page. Our team has been notified.",
  }
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    console.error("[DashboardError]", error)
  }, [error])

  const ctx = getErrorContext(error)
  const Icon = ctx.icon

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-120px)] max-w-4xl flex-col items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div
          className={`mx-auto mb-6 inline-flex size-14 items-center justify-center rounded-2xl ${ctx.iconBg}`}
        >
          <Icon className={`size-6 ${ctx.iconColor}`} strokeWidth={1.5} />
        </div>

        <h1 className="text-xl font-semibold leading-[1.2] tracking-[-0.02em] text-foreground">
          {ctx.title}
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {ctx.description}
        </p>

        {ctx.hint && (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground/70">
            {ctx.hint}
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={reset} className="gap-2 rounded-xl">
            <RefreshCw className="size-3.5" strokeWidth={1.5} />
            Try again
          </Button>

          <Button variant="outline" className="gap-2 rounded-xl" asChild>
            <Link href="/dashboard">
              <LayoutDashboard className="size-3.5" strokeWidth={1.5} />
              Back to dashboard
            </Link>
          </Button>
        </div>

        {error.digest && (
          <p className="mt-10 font-mono text-[11px] text-muted-foreground/50">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
