import { cn } from "@/lib/utils";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export function Select({ label, className, children, ...props }: SelectProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-700">
      {label ? <span className="text-xs uppercase tracking-[0.2em]">{label}</span> : null}
      <select
        className={cn(
          "input-surface h-11 rounded-2xl px-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-ring",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
