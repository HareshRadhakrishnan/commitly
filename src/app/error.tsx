"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw, Home, ServerCrash } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type ErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

const getErrorContext = (error: Error) => {
  const msg = error.message?.toLowerCase() ?? ""
  const isDb =
    msg.includes("database") ||
    msg.includes("supabase") ||
    msg.includes("connection") ||
    msg.includes("fetch failed") ||
    msg.includes("econnrefused") ||
    msg.includes("timeout") ||
    error.name === "FetchError"

  if (isDb) {
    return {
      icon: ServerCrash,
      iconBg: "bg-amber-50 dark:bg-amber-950/30",
      iconColor: "text-amber-600 dark:text-amber-400",
      title: "Database temporarily unavailable",
      description:
        "We're having trouble reaching our database right now. This is usually brief — please try again in a moment. Your data is safe.",
    }
  }

  return {
    icon: AlertTriangle,
    iconBg: "bg-red-50 dark:bg-red-950/30",
    iconColor: "text-destructive",
    title: "Something went wrong",
    description:
      "An unexpected error occurred. Our team has been notified. Please try again, or head back home if the issue persists.",
  }
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[AppError]", error)
  }, [error])

  const ctx = getErrorContext(error)
  const Icon = ctx.icon

  return (
    <div className="flex min-h-[calc(100dvh-80px)] flex-col items-center justify-center px-6">
      <div className="mx-auto w-full max-w-sm text-center">
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

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={reset} className="gap-2 rounded-xl">
            <RefreshCw className="size-3.5" strokeWidth={1.5} />
            Try again
          </Button>

          <Button variant="outline" className="gap-2 rounded-xl" asChild>
            <Link href="/">
              <Home className="size-3.5" strokeWidth={1.5} />
              Go home
            </Link>
          </Button>
        </div>

        {error.digest && (
          <p className="mt-8 font-mono text-[11px] text-muted-foreground/60">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
