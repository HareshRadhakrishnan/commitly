import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function AuthCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className={cn("w-full max-w-sm space-y-8", className)}>
        {/* Brand mark */}
        <Link href="/" className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-hover shadow-[0_4px_12px_rgba(139,92,246,0.25)]">
            <Sparkles className="size-5 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-foreground">Commitly AI</p>
          </div>
        </Link>

        {/* Heading */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        {/* Form area */}
        {children}
      </div>
    </div>
  );
}
