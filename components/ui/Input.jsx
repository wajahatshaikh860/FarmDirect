export default function Input({
  name,
  label,
  error,
  type = "text",
  children,
  ...props
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-wrap">
        <input
          name={name}
          type={type}
          aria-invalid={!!error}
          aria-describedby={error ? name + "-error" : undefined}
          {...props}
        />
        {children}
      </div>
      {error && (
        <small id={name + "-error"} className="field-error">
          {error[0]}
        </small>
      )}
    </label>
  );
}
