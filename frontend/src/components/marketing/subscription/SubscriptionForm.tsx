/**
 * ============================================================================
 * SUBSCRIPTION FORM COMPONENT - EMAIL NEWSLETTER SIGNUP
 * ============================================================================
 * 
 * This component provides an email subscription form for newsletter signups
 * and waitlist registration. It handles UTM parameter tracking and integrates
 * with email marketing services.
 * 
 * KEY FEATURES:
 * - Email validation and submission
 * - UTM parameter capture for marketing attribution
 * - Success/error state management
 * - Loading states during submission
 * - Optional success callback for parent components
 * 
 * UTM TRACKING:
 * - Captures utm_source, utm_medium, utm_campaign from URL
 * - Tracks referring_site for attribution
 * - Passes tracking data to backend for analytics
 * 
 * FORM STATES:
 * - Initial: Ready for email input
 * - Loading: Submitting email to backend
 * - Success: Confirmation message displayed
 * - Error: Error message with retry option
 * 
 * API INTEGRATION:
 * - POST /api/email-subscription
 * - Sends email and UTM parameters
 * - Handles success/error responses
 * 
 * USER EXPERIENCE:
 * - Simple, single-field form
 * - Clear call-to-action button
 * - Immediate feedback on submission
 * - Professional success confirmation
 * 
 * MARKETING INTEGRATION:
 * - UTM parameter tracking for campaign attribution
 * - Referring site capture for source tracking
 * - Integration with email marketing platforms
 * 
 * DEPENDENCIES:
 * - React hooks for state management
 * - UI button component for consistent styling
 * - Backend email subscription API endpoint
 * 
 * USAGE:
 * ```tsx
 * <SubscriptionForm onSubscriptionSuccess={() => console.log('Subscribed!')} />
 * ```
 * 
 * Last Updated: 2025-06-30
 * Architecture: Marketing Email Subscription Component
 */

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

/**
 * Email subscription form component for newsletter signups and waitlist registration.
 * Captures UTM parameters and provides success/error handling.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onSubscriptionSuccess - Optional callback fired on successful subscription
 * @returns {JSX.Element} Subscription form with email input and submit button
 */
export default function SubscriptionForm({ onSubscriptionSuccess }: { onSubscriptionSuccess?: () => void }) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [utmParams, setUtmParams] = useState<{ utm_source?: string; utm_medium?: string; utm_campaign?: string; referring_site?: string }>({})

  /**
   * Capture UTM parameters and referring site information on component mount.
   * This data is used for marketing attribution and analytics.
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setUtmParams({
      utm_source: params.get("utm_source") || undefined,
      utm_medium: params.get("utm_medium") || undefined,
      utm_campaign: params.get("utm_campaign") || undefined,
      referring_site: window.location.href,
    })
  }, [])

  /**
   * Handle form submission and email subscription.
   * Includes UTM parameters for marketing attribution.
   * 
   * @param {React.FormEvent<HTMLFormElement>} e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Submit email with UTM parameters to backend
      const res = await fetch("/api/email-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, ...utmParams }),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || "Failed to subscribe")
      }
      setSuccess(true)
      // Notify parent component of successful subscription
      if (onSubscriptionSuccess) {
        onSubscriptionSuccess()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center p-4 rounded-lg bg-background/60">
        <p className="text-sm text-foreground font-medium">Thank you! Check your inbox for confirmation.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
      <input
        type="email"
        placeholder="Your Email Address"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        className="w-full p-3 bg-background/70 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent transition-all"
      />
      <Button
        type="submit"
        size="lg"
        disabled={loading}
        className="w-full bg-background text-foreground border border-accent/30 hover:bg-background/90 hover:border-accent transition-all duration-300 hover:shadow-md hover:shadow-accent/10"
      >
        {loading ? "Submitting..." : "Join the Waitlist"}
      </Button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </form>
  )
} 