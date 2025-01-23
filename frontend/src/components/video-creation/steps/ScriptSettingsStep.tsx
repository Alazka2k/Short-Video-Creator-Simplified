'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import characterPerspectives from '@/data/video-creation/script/character-perspective_select-option.json'
import pacingStructures from '@/data/video-creation/script/pacing-structure_select-option.json'
import scriptTones from '@/data/video-creation/script/script-tone_select-option.json'
import vocabularyOptions from '@/data/video-creation/script/vocabulary_select-option.json'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, ChevronDown } from 'lucide-react'

interface ScriptSettingsStepProps {
  scriptParams: {
    characterPerspective: string
    pacingStructure: string
    scriptTone: string
    vocabulary: string
  }
  setScriptParams: React.Dispatch<React.SetStateAction<{
    characterPerspective: string
    pacingStructure: string
    scriptTone: string
    vocabulary: string
  }>>
  isGenerating: boolean
}

export function ScriptSettingsStep({
  scriptParams,
  setScriptParams,
  isGenerating
}: ScriptSettingsStepProps) {
  const [expandedCategories, setExpandedCategories] = useState<{
    character: string | null
    pacing: string | null
    tone: string | null
    vocabulary: string | null
  }>({
    character: null,
    pacing: null,
    tone: null,
    vocabulary: null
  })

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold">Script Settings</h2>

      {/* Character Perspective */}
      <div>
        <h3 className="text-sm font-medium mb-3">Character Perspective</h3>
        <div className="space-y-3">
          {characterPerspectives.categories.map((category) => (
            <Card key={category.id} className="overflow-hidden">
              <button
                className="w-full p-4 flex items-center justify-between hover:bg-accent/5 transition-colors"
                onClick={() => setExpandedCategories(prev => ({
                  ...prev,
                  character: prev.character === category.id ? null : category.id
                }))}
                disabled={isGenerating}
              >
                <span className="font-medium">{category.name}</span>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform",
                  expandedCategories.character === category.id && "transform rotate-180"
                )} />
              </button>
              {expandedCategories.character === category.id && (
                <CardContent className="pt-0">
                  <div className="grid gap-2">
                    {category.options.map((option) => (
                      <button
                        key={option.id}
                        className={cn(
                          "w-full p-4 rounded-lg text-left transition-colors",
                          scriptParams.characterPerspective === option.id
                            ? "bg-primary/20"
                            : "hover:bg-accent/5"
                        )}
                        onClick={() => setScriptParams(prev => ({
                          ...prev,
                          characterPerspective: option.id
                        }))}
                        disabled={isGenerating}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{option.name}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {option.description}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Examples: {option.examples}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {option.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs px-2 py-0.5 rounded-full bg-accent/10"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          {scriptParams.characterPerspective === option.id && (
                            <Check className="w-4 h-4 text-primary shrink-0 ml-4" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Pacing Structure */}
      <div>
        <h3 className="text-sm font-medium mb-3">Pacing Structure</h3>
        <div className="space-y-3">
          {pacingStructures.categories.map((category) => (
            <Card key={category.id} className="overflow-hidden">
              <button
                className="w-full p-4 flex items-center justify-between hover:bg-accent/5 transition-colors"
                onClick={() => setExpandedCategories(prev => ({
                  ...prev,
                  pacing: prev.pacing === category.id ? null : category.id
                }))}
                disabled={isGenerating}
              >
                <span className="font-medium">{category.name}</span>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform",
                  expandedCategories.pacing === category.id && "transform rotate-180"
                )} />
              </button>
              {expandedCategories.pacing === category.id && (
                <CardContent className="pt-0">
                  <div className="grid gap-2">
                    {category.options.map((option) => (
                      <button
                        key={option.id}
                        className={cn(
                          "w-full p-4 rounded-lg text-left transition-colors",
                          scriptParams.pacingStructure === option.id
                            ? "bg-primary/20"
                            : "hover:bg-accent/5"
                        )}
                        onClick={() => setScriptParams(prev => ({
                          ...prev,
                          pacingStructure: option.id
                        }))}
                        disabled={isGenerating}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{option.name}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {option.description}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Examples: {option.examples}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {option.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs px-2 py-0.5 rounded-full bg-accent/10"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          {scriptParams.pacingStructure === option.id && (
                            <Check className="w-4 h-4 text-primary shrink-0 ml-4" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Script Tone */}
      <div>
        <h3 className="text-sm font-medium mb-3">Script Tone</h3>
        <div className="space-y-3">
          {scriptTones.categories.map((category) => (
            <Card key={category.id} className="overflow-hidden">
              <button
                className="w-full p-4 flex items-center justify-between hover:bg-accent/5 transition-colors"
                onClick={() => setExpandedCategories(prev => ({
                  ...prev,
                  tone: prev.tone === category.id ? null : category.id
                }))}
                disabled={isGenerating}
              >
                <span className="font-medium">{category.name}</span>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform",
                  expandedCategories.tone === category.id && "transform rotate-180"
                )} />
              </button>
              {expandedCategories.tone === category.id && (
                <CardContent className="pt-0">
                  <div className="grid gap-2">
                    {category.options.map((option) => (
                      <button
                        key={option.id}
                        className={cn(
                          "w-full p-4 rounded-lg text-left transition-colors",
                          scriptParams.scriptTone === option.id
                            ? "bg-primary/20"
                            : "hover:bg-accent/5"
                        )}
                        onClick={() => setScriptParams(prev => ({
                          ...prev,
                          scriptTone: option.id
                        }))}
                        disabled={isGenerating}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{option.name}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {option.description}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Examples: {option.examples}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {option.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs px-2 py-0.5 rounded-full bg-accent/10"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          {scriptParams.scriptTone === option.id && (
                            <Check className="w-4 h-4 text-primary shrink-0 ml-4" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Vocabulary */}
      <div>
        <h3 className="text-sm font-medium mb-3">Vocabulary Style</h3>
        <div className="space-y-3">
          {vocabularyOptions.categories.map((category) => (
            <Card key={category.id} className="overflow-hidden">
              <button
                className="w-full p-4 flex items-center justify-between hover:bg-accent/5 transition-colors"
                onClick={() => setExpandedCategories(prev => ({
                  ...prev,
                  vocabulary: prev.vocabulary === category.id ? null : category.id
                }))}
                disabled={isGenerating}
              >
                <span className="font-medium">{category.name}</span>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform",
                  expandedCategories.vocabulary === category.id && "transform rotate-180"
                )} />
              </button>
              {expandedCategories.vocabulary === category.id && (
                <CardContent className="pt-0">
                  <div className="grid gap-2">
                    {category.options.map((option) => (
                      <button
                        key={option.id}
                        className={cn(
                          "w-full p-4 rounded-lg text-left transition-colors",
                          scriptParams.vocabulary === option.id
                            ? "bg-primary/20"
                            : "hover:bg-accent/5"
                        )}
                        onClick={() => setScriptParams(prev => ({
                          ...prev,
                          vocabulary: option.id
                        }))}
                        disabled={isGenerating}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{option.name}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {option.description}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Examples: {option.examples}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {option.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs px-2 py-0.5 rounded-full bg-accent/10"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          {scriptParams.vocabulary === option.id && (
                            <Check className="w-4 h-4 text-primary shrink-0 ml-4" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
} 