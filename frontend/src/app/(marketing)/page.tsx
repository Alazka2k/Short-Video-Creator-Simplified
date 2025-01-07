import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { 
  Wand2,
  Zap,
  Timer,
  BarChart3,
  TrendingUp,
  Clock,
  Layout,
} from "lucide-react"
import { HeroSection } from '@/components/marketing/hero/HeroSection'
import { ProcessSection } from '@/components/marketing/process/ProcessSection'

const features = [
  {
    name: 'AI-Powered Creation',
    description: 'Create professional videos in minutes using advanced AI technology.',
    icon: Wand2,
  },
  {
    name: 'Analytics & Insights',
    description: 'Track performance and optimize your video content strategy.',
    icon: TrendingUp,
  },
  {
    name: 'Fast & Efficient',
    description: 'Generate videos quickly with our optimized processing pipeline.',
    icon: Clock,
  },
  {
    name: 'Customizable Templates',
    description: 'Choose from a variety of templates to match your brand style.',
    icon: Layout,
  },
]

export const dynamic = 'force-static'
export const revalidate = 3600 // Revalidate every hour

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Enhanced Hero Section */}
      <HeroSection />

      {/* How It Works Section */}
      <ProcessSection />

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Powerful Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to create engaging social media content at scale
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.name}
                className="group relative bg-card rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
              >
                <div className="mb-4 p-3 rounded-xl bg-primary/10 w-fit">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.name}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-accent/5">
        <div className="container px-4 md:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-primary to-primary-foreground">
            <div className="absolute inset-0 bg-grid-white/10" />
            <div className="relative px-6 py-24 sm:px-12 lg:px-16">
              <div className="relative mx-auto max-w-3xl text-center">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Start Creating Amazing Videos Today
                </h2>
                <p className="mx-auto mt-6 max-w-xl text-lg text-white/90">
                  Join thousands of creators who are already using our platform 
                  to produce engaging content at scale.
                </p>
                <div className="mt-10">
                  <Link href="/signup">
                    <Button
                      size="lg"
                      variant="secondary"
                      className="h-12 px-8"
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
