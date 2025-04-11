import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Button Component
 * 
 * A versatile button component that supports multiple variants and sizes.
 * Built with accessibility and customization in mind.
 * 
 * Features:
 * - Multiple visual variants (primary, secondary, outline, ghost)
 * - Different sizes (sm, md, lg)
 * - Loading state support
 * - Icon support (left and right)
 * - Full width option
 * - Disabled state styling
 * 
 * @component
 * @example
 * ```tsx
 * // Primary button
 * <Button variant="primary">Click me</Button>
 * 
 * // Secondary button with loading state
 * <Button variant="secondary" loading>Processing</Button>
 * 
 * // Ghost button with icon
 * <Button variant="ghost" icon={<Icon />}>With Icon</Button>
 * ```
 * 
 * @prop {string} variant - The visual style variant of the button
 * @prop {string} size - The size of the button
 * @prop {boolean} loading - Whether to show loading state
 * @prop {boolean} fullWidth - Whether the button should take full width
 * @prop {ReactNode} leftIcon - Icon to show on the left
 * @prop {ReactNode} rightIcon - Icon to show on the right
 */

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] transition-all",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border-2 border-primary/20 bg-background hover:border-primary/40 hover:bg-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-all dark:border-primary/30 dark:hover:border-primary/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:scale-[1.02] active:scale-[0.98] transition-all",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants } 