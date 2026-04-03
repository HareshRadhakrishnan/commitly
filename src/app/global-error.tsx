"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

type GlobalErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

const isDbError = (error: Error) => {
  const msg = error.message?.toLowerCase() ?? ""
  return (
    msg.includes("database") ||
    msg.includes("supabase") ||
    msg.includes("connection") ||
    msg.includes("fetch failed") ||
    msg.includes("econnrefused") ||
    msg.includes("timeout") ||
    error.name === "FetchError"
  )
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[GlobalError]", error)
  }, [error])

  const dbError = isDbError(error)

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        style={{
          margin: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          backgroundColor: "#ffffff",
          color: "#000000",
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            maxWidth: "440px",
            width: "100%",
            padding: "0 24px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "52px",
              height: "52px",
              borderRadius: "16px",
              backgroundColor: "#fef2f2",
              marginBottom: "24px",
            }}
          >
            <AlertTriangle
              style={{ width: "24px", height: "24px", color: "#dc2626" }}
              strokeWidth={1.5}
            />
          </div>

          <h1
            style={{
              fontSize: "20px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: "1.2",
              color: "#000000",
              margin: "0 0 8px",
            }}
          >
            {dbError ? "Service temporarily unavailable" : "Something went wrong"}
          </h1>

          <p
            style={{
              fontSize: "14px",
              lineHeight: "1.6",
              color: "#6b7280",
              margin: "0 0 32px",
            }}
          >
            {dbError
              ? "We're having trouble connecting to our database. This is usually brief — please try again in a moment."
              : "An unexpected error occurred. Our team has been notified and we're working on a fix."}
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={reset}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                borderRadius: "10px",
                backgroundColor: "#000000",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                lineHeight: "1",
              }}
            >
              <RefreshCw style={{ width: "14px", height: "14px" }} strokeWidth={1.5} />
              Try again
            </button>

            <a
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                borderRadius: "10px",
                backgroundColor: "transparent",
                color: "#000000",
                fontSize: "14px",
                fontWeight: 500,
                border: "1px solid #e5e7eb",
                cursor: "pointer",
                textDecoration: "none",
                lineHeight: "1",
              }}
            >
              <Home style={{ width: "14px", height: "14px" }} strokeWidth={1.5} />
              Go home
            </a>
          </div>

          {error.digest && (
            <p
              style={{
                marginTop: "32px",
                fontSize: "11px",
                color: "#9ca3af",
                fontFamily: "monospace",
              }}
            >
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
