'use client'

import { useState } from 'react'
import { Button, Input, Textarea, useToast } from '@/components/ui'

export function VideoCreationForm() {
  const [prompt, setPrompt] = useState('')
  const [isAdvancedMode, setIsAdvancedMode] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/job/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          parameters: {
            // Add parameters based on form inputs
          }
        }),
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Video creation started successfully',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start video creation',
        variant: 'destructive',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Video Description
        </label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your video..."
          className="h-32"
          required
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          type="button"
          variant={isAdvancedMode ? 'default' : 'outline'}
          onClick={() => setIsAdvancedMode(!isAdvancedMode)}
        >
          {isAdvancedMode ? 'Simple Mode' : 'Advanced Mode'}
        </Button>
      </div>

      {isAdvancedMode && (
        <div className="space-y-4">
          {/* Add advanced options here */}
        </div>
      )}

      <Button type="submit" className="w-full">
        Create Video
      </Button>
    </form>
  )
} 