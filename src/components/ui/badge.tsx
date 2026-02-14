import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "success" | "warning" | "info" | "muted";
};

export function Badge({ variant = "muted", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        variant === "success" && "bg-emerald-100 text-emerald-700",
        variant === "warning" && "bg-amber-100 text-amber-700",
        variant === "info" && "bg-sky-100 text-sky-700",
        variant === "muted" && "bg-slate-100 text-slate-600",
        className
      )}
      {...props}
    />
  );
}
