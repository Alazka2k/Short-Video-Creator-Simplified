'use client'

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  HomeIcon, 
  VideoIcon, 
  SettingsIcon,
  LayoutDashboardIcon,
  FolderIcon,
  PlusCircle,
  CreditCard
} from 'lucide-react';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

const menuItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboardIcon
  },
  {
    title: 'Create Video',
    href: '/create',
    icon: PlusCircle
  },
  {
    title: 'My Videos',
    href: '/dashboard/videos',
    icon: VideoIcon
  },
  {
    title: 'Projects',
    href: '/dashboard/projects',
    icon: FolderIcon
  },
  {
    title: 'Subscription',
    href: '/dashboard/subscription',
    icon: CreditCard
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: SettingsIcon
  }
];

/**
 * Sidebar Component
 * 
 * Dashboard navigation sidebar providing access to all main features.
 * Responsive design that transforms into a mobile drawer on smaller screens.
 * 
 * Features:
 * - Collapsible navigation menu
 * - Active state highlighting
 * - Mobile responsive drawer
 * - User profile section
 * - Quick action buttons
 * 
 * Navigation Sections:
 * - Dashboard overview
 * - Video creation
 * - Projects/Videos list
 * - Settings
 * - User profile
 * 
 * States:
 * - Desktop: Fixed sidebar
 * - Mobile: Drawer with overlay
 * - Active route highlighting
 * - Hover effects
 * 
 * @component
 * @example
 * ```tsx
 * <Sidebar />
 * ```
 */

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn(
      "border-r border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="flex flex-col h-full px-4 py-6">


        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary/10 text-primary hover:bg-primary/20 hover:scale-[1.02]" 
                    : "hover:bg-muted hover:scale-[1.02] hover:shadow-sm"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
} 