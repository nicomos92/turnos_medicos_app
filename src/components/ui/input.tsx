import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Input({ label, className, ...props }: InputProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-700">
      {label ? <span className="text-xs uppercase tracking-[0.2em]">{label}</span> : null}
      <input
        className={cn(
          "input-surface h-11 rounded-2xl px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-ring",
          className
        )}
        {...props}
      />
    </label>
  );
}
