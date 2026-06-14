import { cn } from "@/lib/utils";

type FormFieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-white/90">
        {label}
        {required && <span className="ml-1 text-neon-pink">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted/70">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const inputBase =
  "w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 transition-all duration-200 outline-none focus:border-neon-purple/50 focus:bg-white/8 focus:ring-2 focus:ring-neon-purple/20";

export function FormInput({
  error,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return (
    <input
      className={cn(
        inputBase,
        error ? "border-red-400/50" : "border-white/10",
        className
      )}
      {...props}
    />
  );
}

export function FormSelect({
  error,
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) {
  return (
    <select
      className={cn(
        inputBase,
        "appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27rgba(255,255,255,0.4)%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27M19 9l-7 7-7-7%27/%3E%3C/svg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10",
        error ? "border-red-400/50" : "border-white/10",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function FormTextarea({
  error,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  return (
    <textarea
      className={cn(
        inputBase,
        "min-h-[120px] resize-y",
        error ? "border-red-400/50" : "border-white/10",
        className
      )}
      {...props}
    />
  );
}

type FormCheckboxProps = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function FormCheckbox({ id, label, checked, onChange }: FormCheckboxProps) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.06]"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-white/20 bg-white/5 text-neon-pink accent-neon-pink focus:ring-neon-pink/30"
      />
      <span className="text-sm text-white/80">{label}</span>
    </label>
  );
}

type RadioOption = { value: string; label: string };

type FormRadioGroupProps = {
  name: string;
  value: string;
  options: RadioOption[];
  onChange: (value: string) => void;
  error?: boolean;
};

export function FormRadioGroup({
  name,
  value,
  options,
  onChange,
  error,
}: FormRadioGroupProps) {
  return (
    <div
      className={cn(
        "grid gap-2 sm:grid-cols-2",
        error && "rounded-xl ring-1 ring-red-400/40"
      )}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 transition-all duration-200",
            value === option.value
              ? "border-neon-purple/40 bg-neon-purple/10 text-white"
              : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20"
          )}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="h-4 w-4 border-white/20 accent-neon-pink"
          />
          <span className="text-sm font-medium">{option.label}</span>
        </label>
      ))}
    </div>
  );
}
