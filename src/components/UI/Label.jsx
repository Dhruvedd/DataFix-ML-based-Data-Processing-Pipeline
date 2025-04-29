import "./Label.css" // You could use CSS modules or styled-components instead

const Label = ({ htmlFor, children, className = "" }) => {
  const baseClasses = "block text-sm font-medium text-gray-700 mb-1"
  const classes = `${baseClasses} ${className}`

  return (
    <label htmlFor={htmlFor} className={classes}>
      {children}
    </label>
  )
}

export default Label
