import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  Wand2,
  Zap,
  Timer,
  BarChart3,
} from "lucide-react"

const features = [
  {
    name: 'AI-Powered Creation',
    description: 'Create professional videos in minutes using advanced AI technology.',
    icon: Wand2,
  },
  {
    name: 'Lightning Fast',
    description: 'Generate videos quickly with our optimized processing pipeline.',
    icon: Zap,
  },
  {
    name: 'Time Saving',
    description: 'Save hours of editing time with automated video creation.',
    icon: Timer,
  },
  {
    name: 'Analytics',
    description: 'Track performance and optimize your video content.',
    icon: BarChart3,
  },
]

export const dynamic = 'force-static'
export const revalidate = 3600 // Revalidate every hour

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-24 md:py-32">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-6xl lg:text-7xl">
              Create Engaging Videos with{' '}
              <span className="text-brand-primary">AI</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-text-secondary">
              Transform your content into professional videos in minutes. 
              Powered by AI, designed for creators.
            </p>
            <div className="mt-10 flex justify-center gap-6">
              <Link href="/signup">
                <Button size="lg" className="h-12 px-8">Get Started</Button>
              </Link>
              <Link href="/features">
                <Button size="lg" variant="outline" className="h-12 px-8">Learn More</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-bg-card">
        <div className="container">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.name}
                className="group relative rounded-2xl border border-border-primary bg-bg-main p-8 transition-all hover:border-brand-primary/50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-text-primary">
                  {feature.name}
                </h3>
                <p className="mt-2 text-text-secondary">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container">
          <div className="overflow-hidden rounded-3xl bg-brand-primary">
            <div className="relative px-8 py-24 sm:px-12 lg:px-16">
              <div className="relative mx-auto max-w-3xl text-center">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Start Creating Amazing Videos Today
                </h2>
                <p className="mx-auto mt-6 max-w-xl text-lg text-white/90">
                  Join thousands of creators who are already using VideoCreator 
                  to produce engaging content at scale.
                </p>
                <div className="mt-10">
                  <Link href="/signup">
                    <Button
                      size="lg"
                      className="h-12 px-8 bg-white text-brand-primary hover:bg-white/90"
                    >
                      Get Started for Free
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
