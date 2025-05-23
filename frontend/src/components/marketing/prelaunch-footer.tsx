"use client"

import Link from "next/link"
import { motion } from "framer-motion"

export function PrelaunchFooter() {
  const currentYear = new Date().getFullYear()
  
  return (
    <motion.footer 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="border-t border-border/40 bg-background/80 backdrop-blur-sm relative overflow-hidden"
    >
      <div className="absolute inset-0 border-t border-border/40">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5"></div>
      </div>
      
      <div className="container px-4 md:px-6 py-12 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-base font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">About</h3>
            <div className="mt-4 text-sm text-muted-foreground max-w-xs">
              <p>Narravid is an AI storytelling engine that transforms prompts into complete videos with voice, visuals, and music—in any style you imagine.</p>
              <div className="mt-4 font-semibold text-foreground/90">
                Effortless. Visual. Powerful.
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-base font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">Product</h3>
            <ul className="mt-4 space-y-3">
              <FooterLink href="/features">Features</FooterLink>
              <FooterLink href="/contact">Contact</FooterLink>
            </ul>
          </div>
          
          <div>
            <h3 className="text-base font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">Legal</h3>
            <ul className="mt-4 space-y-3">
              <FooterLink href="/imprint">Imprint</FooterLink>
              <FooterLink href="/privacy-policy">Privacy Policy</FooterLink>
              <FooterLink href="/cookie-policy">Cookie Policy</FooterLink>
              <FooterLink href="/terms-of-service">Terms of Service</FooterLink>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-border/40 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground order-2 md:order-1">
            © {currentYear} Narravid. All rights reserved.
          </p>
          <div className="order-1 md:order-2">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="inline-flex items-center rounded-full border bg-background/30 backdrop-blur-sm px-4 py-1.5 text-sm"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary font-medium">
                Coming Soon
              </span>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.footer>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link 
        href={href} 
        className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex group"
      >
        <span className="relative">
          {children}
          <span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-primary transition-all duration-300 group-hover:w-full"></span>
        </span>
      </Link>
    </li>
  )
} 