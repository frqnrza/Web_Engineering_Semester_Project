import * as React from "react"

// ✅ Named Export: This allows 'import { Progress }' to work
export function Progress({ value, className, ...props }) {
  return (
    <div
      className={`relative h-4 w-full overflow-hidden rounded-full bg-gray-100 ${className || ""}`}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-[#008C7E] transition-all duration-500 ease-in-out"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </div>
  )
}