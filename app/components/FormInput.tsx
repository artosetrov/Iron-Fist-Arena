"use client";

const FormInput = ({
  label,
  type,
  value,
  onChange,
  autoComplete,
  required = true,
  minLength,
  maxLength,
  placeholder,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
}) => (
  <label className="flex flex-col gap-2">
    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
      {label}
    </span>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      minLength={minLength}
      maxLength={maxLength}
      autoComplete={autoComplete}
      placeholder={placeholder}
      className="rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
      aria-label={label}
    />
  </label>
);

export default FormInput;
