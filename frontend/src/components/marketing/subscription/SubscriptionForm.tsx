import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function SubscriptionForm({ onSubscriptionSuccess }: { onSubscriptionSuccess?: () => void }) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [utmParams, setUtmParams] = useState<{ utm_source?: string; utm_medium?: string; utm_campaign?: string; referring_site?: string }>({})

  // Capture UTM and referring site on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setUtmParams({
      utm_source: params.get("utm_source") || undefined,
      utm_medium: params.get("utm_medium") || undefined,
      utm_campaign: params.get("utm_campaign") || undefined,
      referring_site: window.location.href,
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
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