import "./Table.css" // You could use CSS modules or styled-components instead

export const Table = ({ children, className = "" }) => {
  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y divide-gray-200 ${className}`}>{children}</table>
    </div>
  )
}

export const TableHeader = ({ children }) => {
  return <thead className="bg-gray-50">{children}</thead>
}

export const TableBody = ({ children }) => {
  return <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>
}

export const TableRow = ({ children }) => {
  return <tr>{children}</tr>
}

export const TableHead = ({ children }) => {
  return (
    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      {children}
    </th>
  )
}

export const TableCell = ({ children }) => {
  return <td className="px-6 py-4 whitespace-nowrap">{children}</td>
}
