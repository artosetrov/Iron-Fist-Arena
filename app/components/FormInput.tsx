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
      className="border bg-[var(--ds-bg-input)] text-sm text-[var(--ds-text)] placeholder-slate-600 outline-none transition"
      style={{
        borderColor: "var(--ds-border)",
        borderRadius: "var(--ds-input-radius)",
        paddingInline: "var(--ds-input-px)",
        paddingBlock: "var(--ds-input-py)",
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "var(--ds-border-focus)";
        e.currentTarget.style.boxShadow = "0 0 0 1px var(--ds-ring-focus)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "var(--ds-border)";
        e.currentTarget.style.boxShadow = "none";
      }}
      aria-label={label}
    />
  </label>
);

export default FormInput;
