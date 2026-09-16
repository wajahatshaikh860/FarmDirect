import Link from "next/link";
const variants = {
  primary: "",
  secondary: "secondary",
  outline: "outline",
  danger: "danger",
};
export default function Button({
  href,
  variant = "primary",
  className = "",
  children,
  ...props
}) {
  const classes = ["button", variants[variant], className]
    .filter(Boolean)
    .join(" ");
  return href ? (
    <Link href={href} className={classes} {...props}>
      {children}
    </Link>
  ) : (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
