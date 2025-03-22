import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-[6px]",
          "bg-[#FAFAFA] px-4 py-3",
          "border border-[#E5E7EB]",
          "text-[15px] text-gray-900",
          "placeholder:text-[#9CA3AF]",
          "focus:outline-none focus:border-gray-400 focus:ring-0",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input } 