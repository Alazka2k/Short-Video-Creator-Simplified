"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth/AuthContext"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { User } from "lucide-react"
import { useTheme } from "next-themes"
import Image from "next/image"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"

export function SiteHeader() {
  const auth = useAuth()
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    if (auth?.logout) {
      await auth.logout()
      router.push("/")
    }
  }

  const brandSrc = mounted && resolvedTheme === "dark" 
    ? "/branding/dark/brand.svg" 
    : "/branding/white/brand.svg"

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
            {mounted && (
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
            )}
          </Link>
          <div className="hidden md:flex gap-6">
            <NavLink href="/features">
              Features
            </NavLink>
            <NavLink href="/showcase">
              Showcase
            </NavLink>
            <NavLink href="/pricing">
              Pricing
            </NavLink>
            <NavLink href="/blog">
              Blog
            </NavLink>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {auth?.isAuthenticated ? (
            <div className="flex items-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              </motion.div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.div whileHover={{ scale: 1.05 }} className="cursor-pointer">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={auth.user?.picture || ""} alt={auth.user?.name || ""} />
                      <AvatarFallback>{auth.user?.name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="default" size="sm" asChild>
                  <Link href="/signup">Sign up</Link>
                </Button>
              </motion.div>
            </div>
          )}
        </div>
      </nav>
    </motion.header>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group relative px-3 py-1.5">
      <span className="relative z-10 text-sm font-medium text-foreground transition-colors duration-300 group-hover:text-primary">
        {children}
      </span>
      <span className="absolute inset-0 -z-10 scale-x-0 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent opacity-0 transition-all duration-300 group-hover:scale-x-100 group-hover:opacity-100"></span>
    </Link>
  )
} 