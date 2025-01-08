/**
 * Features Page
 * 
 * Detailed showcase of all platform features and capabilities.
 * Provides in-depth information about each feature with examples and use cases.
 * 
 * Feature Categories:
 * - Content Creation
 *   - AI-powered generation
 *   - Scene-based creation
 *   - Voice synthesis
 * - Customization
 *   - Style controls
 *   - Voice options
 *   - Music selection
 * - Export & Sharing
 *   - Multiple formats
 *   - Platform optimization
 *   - Direct sharing
 * 
 * Page Structure:
 * - Feature overview grid
 * - Detailed feature sections
 * - Interactive demonstrations
 * - Use case examples
 * - Technical specifications
 * 
 * Integration:
 * - Links to documentation
 * - Connection to pricing plans
 * - Demo request options
 * 
 * @page
 * @example
 * URL: /features
 */

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { 
  Wand2,
  Sparkles,
  Film,
  Share2,
  Clock,
  Layout,
  Palette,
  Music,
  Mic,
  Video,
  Download,
  Settings,
  Layers
} from "lucide-react"

const features = [
  {
    name: "AI-Powered Content Generation",
    description: "Transform your ideas into engaging content with our advanced AI technology. Create compelling narratives and visuals that resonate with your audience.",
    icon: Wand2,
    details: [
      "Natural language processing for story creation",
      "Smart scene composition and transitions",
      "Automated content optimization",
      "Contextual suggestions and improvements"
    ]
  },
  {
    name: "Professional Visuals",
    description: "Generate stunning visuals that capture attention and convey your message effectively. Choose from various styles and customize to match your brand.",
    icon: Palette,
    details: [
      "High-quality image generation",
      "Custom style presets",
      "Brand color integration",
      "Visual consistency across content"
    ]
  },
  {
    name: "Voice & Audio",
    description: "Add professional voiceovers and background music to enhance your content. Multiple voices and styles available for perfect narration.",
    icon: Mic,
    details: [
      "Natural-sounding voice synthesis",
      "Multiple voice options",
      "Emotion and tone control",
      "Background music library"
    ]
  },
  {
    name: "Video Assembly",
    description: "Automatically combine your scenes into a polished video. Add transitions, effects, and optimize for different platforms.",
    icon: Film,
    details: [
      "Smart scene transitions",
      "Platform-specific optimization",
      "Custom aspect ratios",
      "Export quality control"
    ]
  },
  {
    name: "Quick Turnaround",
    description: "Generate content quickly without compromising on quality. Perfect for maintaining consistent social media presence.",
    icon: Clock,
    details: [
      "Parallel processing",
      "Batch content creation",
      "Quick preview generation",
      "Efficient workflow automation"
    ]
  },
  {
    name: "Multi-Platform Export",
    description: "Export your content in formats optimized for different social media platforms. Ensure maximum impact across all channels.",
    icon: Share2,
    details: [
      "Platform-specific formatting",
      "Automatic resizing",
      "Quality optimization",
      "Batch export options"
    ]
  },
  {
    name: "Component Library",
    description: "Access a growing library of pre-made components and templates. Mix and match to create unique content quickly.",
    icon: Layout,
    details: [
      "Reusable components",
      "Custom template creation",
      "Style preservation",
      "Quick modifications"
    ]
  },
  {
    name: "Advanced Customization",
    description: "Fine-tune every aspect of your content. From visual styles to voice parameters, maintain full creative control.",
    icon: Settings,
    details: [
      "Detailed style controls",
      "Voice parameter adjustment",
      "Custom transitions",
      "Brand preset management"
    ]
  }
]

export default function FeaturesPage() {
  return (
    <div className="relative min-h-screen">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-accent/5 to-background">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/10 via-primary/5 to-background blur-3xl opacity-50" />
      </div>

      <div className="container px-4 md:px-6 py-24">
        {/* Page header */}
        <div className="text-center mb-24">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-sm font-medium">Feature Overview</span>
          </motion.div>

          <motion.h1 
            className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Powerful Features for
            <br />
            Content Creation
          </motion.h1>
          <motion.p 
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Explore our comprehensive suite of tools designed to streamline your content creation process
          </motion.p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          {features.map((feature, index) => (
            <motion.div
              key={feature.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <div className="relative p-8 rounded-xl bg-card hover:bg-accent/5 transition-colors border border-border/50">
                {/* Icon */}
                <div className={cn(
                  "w-14 h-14 rounded-xl mb-6 flex items-center justify-center",
                  "bg-gradient-to-br shadow-lg",
                  index % 4 === 0 ? "from-violet-500 to-purple-500" :
                  index % 4 === 1 ? "from-blue-500 to-violet-500" :
                  index % 4 === 2 ? "from-indigo-500 to-blue-500" :
                  "from-purple-500 to-pink-500"
                )}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>

                <h2 className="text-2xl font-semibold mb-4">{feature.name}</h2>
                <p className="text-muted-foreground mb-6">{feature.description}</p>

                {/* Feature details */}
                <ul className="space-y-3">
                  {feature.details.map((detail, i) => (
                    <motion.li
                      key={i}
                      className="flex items-center gap-3 text-sm"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + (i * 0.1) }}
                    >
                      <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{detail}</span>
                    </motion.li>
                  ))}
                </ul>

                {/* Hover decoration */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-accent/20 rounded-xl transition-colors duration-300" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
} 