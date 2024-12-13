"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

export function GenerateContent() {
  const { authFetch } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authFetch('/api/llm/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputPrompt: 'Your prompt here',
          llmGenParams: {
            // Your params
          }
        }),
      });

      if (!response.ok) throw new Error('Generation failed');
      
      const data = await response.json();
      // Handle successful response
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={handleGenerate}
        disabled={isLoading}
      >
        {isLoading ? 'Generating...' : 'Generate Content'}
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  );
} 