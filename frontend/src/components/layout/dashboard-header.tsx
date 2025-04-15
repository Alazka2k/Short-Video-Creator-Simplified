'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { motion } from 'framer-motion';

export function DashboardHeader() {
  const { user, logout } = useAuth(); // TODO check the history of useAuth() why it is missing?
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const brandSrc = resolvedTheme === "dark" 
    ? "/branding/dark/brand.svg" 
    : "/branding/white/brand.svg";

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
    >
      <div className="absolute inset-0 border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5"></div>
      </div>
      <nav className="container flex h-16 items-center justify-between px-4 md:px-6 relative">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2 relative group">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
            >
              <Image
                src={brandSrc}
                alt="Narravid"
                width={150}
                height={40}
                className="h-28 w-auto"
                priority
              />
              <div className="absolute -inset-2 -z-10 rounded-lg bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 opacity-0 blur transition duration-300 group-hover:opacity-100"></div>
            </motion.div>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger>
              <motion.div whileHover={{ scale: 1.05 }} className="cursor-pointer">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.picture} alt={user?.name || "User avatar"} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </motion.header>
  );
} 