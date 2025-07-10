'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { AlertTriangle, AlertCircle, X, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const errorCardVariants = cva(
  'rounded-lg border p-6 space-y-4 transition-all',
  {
    variants: {
      variant: {
        warning: 'bg-amber-500/10 border-amber-500/50 text-amber-700 dark:text-amber-300',
        destructive: 'bg-destructive/10 border-destructive/50 text-destructive',
      },
    },
    defaultVariants: {
      variant: 'warning',
    },
  }
);

const iconVariants = {
  warning: AlertCircle,
  destructive: AlertTriangle,
};

const titleVariants = {
    warning: 'text-amber-600 dark:text-amber-400',
    destructive: 'text-destructive',
}

export interface ErrorCardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof errorCardVariants> {
  title: string;
  onDismiss?: () => void;
  details?: string | null;
  showAdminDetails?: boolean;
}

export function ErrorCard({
  className,
  variant,
  title,
  children,
  onDismiss,
  details,
  showAdminDetails = false,
  ...props
}: ErrorCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const Icon = variant ? iconVariants[variant] : iconVariants.warning;
  const titleColor = variant ? titleVariants[variant] : titleVariants.warning;

  return (
    <div className={cn(errorCardVariants({ variant }), className)} {...props}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Icon className={cn("h-5 w-5", titleColor)} />
          <h3 className={cn("text-lg font-semibold", titleColor)}>{title}</h3>
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className={cn("h-7 w-7 text-current hover:bg-black/10 dark:hover:bg-white/10")}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        )}
      </div>
      
      <div className="text-sm">
        {children}
      </div>
      
      {showAdminDetails && details && (
        <div className="space-y-2">
           <Button
            variant="link"
            className="p-0 h-auto text-sm font-medium text-current"
            onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          >
            <ChevronsUpDown className="h-4 w-4 mr-2" />
            Technical Details
          </Button>
          {isDetailsOpen && (
            <pre className="text-xs bg-black/10 dark:bg-white/10 p-3 rounded-md whitespace-pre-wrap font-mono">
              {details}
            </pre>
          )}
        </div>
      )}
    </div>
  );
} 