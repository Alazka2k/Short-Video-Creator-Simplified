import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { FileText, Clock, User, MessageSquare } from "lucide-react"

interface ScriptPreviewPanelProps {
  settings: {
    characterPerspective: string | null
    pacingStructure: string | null
    scriptTone: string | null
    vocabulary: string | null
  }
  characterData: any // We'll type this properly once we update the data structure
  pacingData: any
  toneData: any
  vocabularyData: any
}

export function ScriptPreviewPanel({
  settings,
  characterData,
  pacingData,
  toneData,
  vocabularyData
}: ScriptPreviewPanelProps) {
  // Find the selected options from the data
  const character = characterData?.categories
    .flatMap((cat: any) => cat.options)
    .find((opt: any) => opt.id === settings.characterPerspective)

  const pacing = pacingData?.categories
    .flatMap((cat: any) => cat.options)
    .find((opt: any) => opt.id === settings.pacingStructure)

  const tone = toneData?.categories
    .flatMap((cat: any) => cat.options)
    .find((opt: any) => opt.id === settings.scriptTone)

  const vocabulary = vocabularyData?.categories
    .flatMap((cat: any) => cat.options)
    .find((opt: any) => opt.id === settings.vocabulary)

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <h3 className="text-lg font-semibold mb-4">Script Preview</h3>
      
      <div className="space-y-4">
        {/* Character Perspective */}
        <motion.div 
          className="flex items-start gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <User className="w-5 h-5 mt-1 text-primary" />
          <div>
            <div className="font-medium">Character Voice</div>
            {character ? (
              <div className="text-sm text-muted-foreground">
                Speaking as a {character.name.toLowerCase()}, {character.description.toLowerCase()}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground/50 italic">
                Select a character perspective to see how your script will be voiced
              </div>
            )}
          </div>
        </motion.div>

        {/* Pacing Structure */}
        <motion.div 
          className="flex items-start gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Clock className="w-5 h-5 mt-1 text-primary" />
          <div>
            <div className="font-medium">Pacing & Flow</div>
            {pacing ? (
              <div className="text-sm text-muted-foreground">
                {pacing.description}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground/50 italic">
                Choose a pacing structure to define your script's rhythm
              </div>
            )}
          </div>
        </motion.div>

        {/* Script Tone */}
        <motion.div 
          className="flex items-start gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <MessageSquare className="w-5 h-5 mt-1 text-primary" />
          <div>
            <div className="font-medium">Tone & Style</div>
            {tone ? (
              <div className="text-sm text-muted-foreground">
                {tone.description}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground/50 italic">
                Pick a tone to set the mood of your script
              </div>
            )}
          </div>
        </motion.div>

        {/* Vocabulary */}
        <motion.div 
          className="flex items-start gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <FileText className="w-5 h-5 mt-1 text-primary" />
          <div>
            <div className="font-medium">Language & Vocabulary</div>
            {vocabulary ? (
              <div className="text-sm text-muted-foreground">
                {vocabulary.description}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground/50 italic">
                Select vocabulary style to define the language level
              </div>
            )}
          </div>
        </motion.div>

        {/* Progress Indicator */}
        {(settings.characterPerspective || settings.pacingStructure || 
          settings.scriptTone || settings.vocabulary) && (
          <motion.div 
            className="mt-6 pt-4 border-t"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Script Settings Complete
              </div>
              <div className="text-sm font-medium">
                {[
                  settings.characterPerspective,
                  settings.pacingStructure,
                  settings.scriptTone,
                  settings.vocabulary
                ].filter(Boolean).length} / 4
              </div>
            </div>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ 
                  width: `${[
                    settings.characterPerspective,
                    settings.pacingStructure,
                    settings.scriptTone,
                    settings.vocabulary
                  ].filter(Boolean).length * 25}%` 
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>
        )}
      </div>
    </Card>
  )
} 