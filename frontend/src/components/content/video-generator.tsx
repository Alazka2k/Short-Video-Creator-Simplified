"use client";

import { withAuth } from '@/lib/hoc/withAuth';
import { useAuth } from '@/lib/hooks/useAuth';

function VideoGeneratorComponent() {
  const { authFetch } = useAuth();

  const handleGenerate = async () => {
    try {
      const response = await authFetch('/api/video/generate', {
        method: 'POST',
        // ... rest of options
      });
      // Handle response
    } catch (error) {
      // Handle error
    }
  };

  return (
    // ... component JSX
  );
}

export const VideoGenerator = withAuth(VideoGeneratorComponent); 