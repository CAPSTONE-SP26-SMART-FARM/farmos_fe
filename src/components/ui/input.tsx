import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base
        "w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none",
        // Dark mode background — dùng bg-background thay vì bg-input/30 để tránh autofill override
        "dark:bg-background",
        // Placeholder & selection
        "placeholder:text-muted-foreground/60 selection:bg-primary selection:text-primary-foreground",
        // Focus
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        // Disabled
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // File input
        "file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        // Validation
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        // Fix Chrome autofill xám — override webkit autofill background
        "[&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_hsl(var(--background))]",
        "[&:-webkit-autofill]:[-webkit-text-fill-color:hsl(var(--foreground))]",
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
