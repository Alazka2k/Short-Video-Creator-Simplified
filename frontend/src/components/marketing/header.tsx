"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-primary bg-bg-main/75 backdrop-blur supports-[backdrop-filter]:bg-bg-main/75">
      <nav className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-brand-primary">VideoCreator</span>
          </Link>
          <div className="hidden md:flex gap-6">
            <Link 
              href="/features" 
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Features
            </Link>
            <Link 
              href="/pricing" 
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Pricing
            </Link>
            <Link 
              href="/blog" 
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Blog
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </nav>
    </header>
  )
} 