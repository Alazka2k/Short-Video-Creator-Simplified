/**
 * Prelaunch Landing Page
 * 
 * A simplified landing page focused on lead generation before the official product launch.
 * Showcases the core value proposition and collects email addresses for the waitlist.
 * 
 * Page Sections:
 * - Hero section with main value proposition
 * - Problem statement
 * - Solution highlights
 * - Early access signup form (Beehiiv integration)
 * - Social proof
 * 
 * @page
 * @example
 * URL: /
 */

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export const dynamic = 'force-static'
export const revalidate = 3600 // Revalidate every hour

export default function PrelaunchHome() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container px-4 md:px-6 flex flex-col items-center text-center space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 max-w-4xl"
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
              Die Zukunft der Videoproduktion beginnt hier
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Erstelle professionelle Videos mit künstlicher Intelligenz - in Minuten statt Tagen.
            </p>
          </motion.div>
          
          {/* Beehiiv Newsletter Signup Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-lg mx-auto mt-8 bg-card p-6 rounded-xl border shadow-sm"
          >
            <h3 className="text-xl font-semibold mb-4">Sichere dir deinen Frühzugang</h3>
            {/* Beehiiv Embed Code Placeholder - Replace with actual embed code */}
            <div className="flex flex-col space-y-4">
              <input 
                type="email" 
                placeholder="Deine E-Mail Adresse" 
                className="w-full p-3 border border-muted rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button size="lg" className="w-full">Frühzugang sichern</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Wir behandeln deine Daten vertraulich und senden dir ausschließlich Updates zu unserem Launch.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 bg-accent/5">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl font-bold mb-6">Heute ist Videoproduktion zu komplex</h2>
            <p className="text-lg text-muted-foreground">
              Traditionelle Lösungen sind oft zu teuer, zeitaufwändig und erfordern spezialisierte Kenntnisse.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-bold text-center mb-10">Unsere Lösung</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
            {[
              {
                title: "Automatisch, nicht manuell",
                description: "Reduziere die Produktionszeit von Tagen auf Minuten mit KI-gestützter Automatisierung."
              },
              {
                title: "In Minuten statt Stunden",
                description: "Von der Idee zum fertigen Video in einem Bruchteil der üblichen Zeit."
              },
              {
                title: "Intelligent statt starr",
                description: "Anpassungsfähige KI, die deine Bedürfnisse versteht und umsetzt."
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col items-center text-center p-6 bg-card rounded-xl border shadow-sm"
              >
                <h3 className="text-xl font-semibold mb-4">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Early Access / Social Proof */}
      <section className="py-16 bg-accent/5">
        <div className="container px-4 md:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-6">Schon über 143 warten auf den Start</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
              <div className="p-6 bg-card rounded-xl border shadow-sm">
                <h3 className="text-xl font-semibold mb-2">Wann geht's los?</h3>
                <p className="text-muted-foreground">
                  Unser offizieller Launch ist für Q2 2025 geplant. Frühzugangsnutzer erhalten bereits ab Q1 2025 Zugang.
                </p>
              </div>
              <div className="p-6 bg-card rounded-xl border shadow-sm">
                <h3 className="text-xl font-semibold mb-2">Was passiert mit der E-Mail?</h3>
                <p className="text-muted-foreground">
                  Du erhältst eine Bestätigung und später exklusiven Zugang zum Frühstart mit Sonderkonditionen.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center space-y-6"
          >
            <h2 className="text-3xl font-bold">Sei unter den Ersten</h2>
            <p className="text-lg text-muted-foreground">
              Sichere dir deinen Platz auf der Warteliste und profitiere von exklusiven Vorteilen für Early Adopters.
            </p>
            {/* Duplicate Beehiiv Form - Replace with actual embed code */}
            <div className="w-full max-w-lg mx-auto mt-8 bg-card p-6 rounded-xl border shadow-sm">
              <div className="flex flex-col space-y-4">
                <input 
                  type="email" 
                  placeholder="Deine E-Mail Adresse" 
                  className="w-full p-3 border border-muted rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button size="lg" className="w-full">Frühzugang sichern</Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
} 