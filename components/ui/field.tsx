import * as React from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  "data-invalid"?: boolean
  orientation?: "horizontal" | "vertical"
}

export const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  ({ className, orientation = "vertical", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "group relative w-full", 
          orientation === "horizontal" 
            ? "flex items-center gap-6 py-4" 
            : "flex flex-col gap-3 py-2", // GAP-3 ensures label isn't glued to input
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Field.displayName = "Field"

export const FieldLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => (
  <Label
    ref={ref}
    className={cn("text-sm font-medium text-slate-400 uppercase tracking-wider mb-2 block", className)}
    {...props}
  />
))
FieldLabel.displayName = "FieldLabel"

export const FieldDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-[0.8rem] text-slate-500", className)} {...props} />
)

export const FieldError = ({ errors, className }: { errors: any[]; className?: string }) => {
  const error = errors?.[0]
  if (!error) return null
  return (
    <span className={cn("text-[0.8rem] font-medium text-red-400 mt-1 block", className)}>
      {error.message?.toString()}
    </span>
  )
}

export const FieldGroup = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("space-y-8 w-full", className)} {...props} />
)

export const FieldContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex-1", className)} {...props} />
)