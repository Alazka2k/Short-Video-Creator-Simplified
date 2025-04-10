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

export function SiteHeader() {
  const { isAuthenticated, user, logout } = useAuth() // TODO check the history of useAuth() why it is missing?
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">
              <span className="text-primary">Video Creator</span>
            </span>
          </Link>
          <div className="hidden md:flex gap-6">
            <Link 
              href="/features" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Features
            </Link>
            <Link 
              href="/showcase" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Showcase
            </Link>
            <Link 
              href="/pricing" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Pricing
            </Link>
            <Link 
              href="/blog" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Blog
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push("/dashboard")}
              >
                Dashboard
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.picture} alt={user?.name || "User avatar"} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
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
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
} 