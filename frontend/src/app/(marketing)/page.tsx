import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { 
  Wand2,
  Zap,
  Timer,
  BarChart3,
  TrendingUpIcon,
  ClockIcon,
  BarChart3Icon,
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
          <div className="mx-auto max-w-3xl text-center animate-in slide-in-from-top">
            <h1 className="mb-8 text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">
                Create Engaging Videos
              </span>
              <br />
              with AI
            </h1>
            <p className="mb-10 text-xl text-muted-foreground">
              Transform your content into professional videos in minutes. Powered by AI, designed for creators.
            </p>
            <div className="flex justify-center gap-6">
              <Button 
                className={cn(
                  "bg-gradient-to-r from-violet-500 to-purple-500",
                  "transition-all duration-200",
                  "hover:shadow-[0_0_15px_rgba(139,92,246,0.3)]",
                  "hover:scale-[1.02]"
                )}
              >
                Get Started
              </Button>
              <Button variant="outline" className="border-2">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
            <div className="group slide-in-from-bottom" style={{ animationDelay: '100ms' }}>
              <div className="p-4 rounded-2xl transition-all duration-200 hover:bg-accent/50">
                <div className="mb-4 p-3 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-xl w-fit">
                  <Wand2 className="h-6 w-6 text-violet-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI-Powered Creation</h3>
                <p className="text-muted-foreground">
                  Create professional videos in minutes using advanced AI technology.
                </p>
              </div>
            </div>
            <div className="group slide-in-from-bottom" style={{ animationDelay: '200ms' }}>
              <div className="p-4 rounded-2xl transition-all duration-200 hover:bg-accent/50">
                <div className="mb-4 p-3 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-xl w-fit">
                  <TrendingUpIcon className="h-6 w-6 text-violet-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Analytics & Insights</h3>
                <p className="text-muted-foreground">
                  Gain valuable insights into your video performance with our advanced analytics tools.
                </p>
              </div>
            </div>
            <div className="group slide-in-from-bottom" style={{ animationDelay: '300ms' }}>
              <div className="p-4 rounded-2xl transition-all duration-200 hover:bg-accent/50">
                <div className="mb-4 p-3 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-xl w-fit">
                  <ClockIcon className="h-6 w-6 text-violet-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Fast & Efficient</h3>
                <p className="text-muted-foreground">
                  Create videos quickly and efficiently with our streamlined process.
                </p>
              </div>
            </div>
            <div className="group slide-in-from-bottom" style={{ animationDelay: '400ms' }}>
              <div className="p-4 rounded-2xl transition-all duration-200 hover:bg-accent/50">
                <div className="mb-4 p-3 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-xl w-fit">
                  <BarChart3Icon className="h-6 w-6 text-violet-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Customizable Templates</h3>
                <p className="text-muted-foreground">
                  Choose from a variety of customizable templates to match your brand's style.
                </p>
              </div>
            </div>
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
