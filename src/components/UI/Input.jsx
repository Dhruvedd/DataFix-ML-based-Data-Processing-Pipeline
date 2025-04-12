"use client"
import "./Input.css" // You could use CSS modules or styled-components instead

const Input = ({
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  className = "",
  accept,
  ...props
}) => {
  const baseClasses =
    "px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
  const classes = `${baseClasses} ${disabled ? "bg-gray-100 cursor-not-allowed" : ""} ${className}`

  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className={classes}
      accept={accept}
      {...props}
    />
  )
}

export default Input
