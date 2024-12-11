'use client'

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Video {
  id: string
  title: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
  thumbnail?: string
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // TODO: Fetch videos from API
    setVideos([
      {
        id: '1',
        title: 'Test Video 1',
        status: 'completed',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Test Video 2',
        status: 'processing',
        createdAt: new Date().toISOString(),
      },
    ])
    setIsLoading(false)
  }, [])

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-text-primary">My Videos</h1>
        <Link href="/create">
          <Button>Create New Video</Button>
        </Link>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div
              key={video.id}
              className="bg-bg-card rounded-lg p-4 border border-border-primary"
            >
              <div className="aspect-video bg-bg-element rounded-md mb-4">
                {/* Thumbnail placeholder */}
              </div>
              <h3 className="font-semibold text-text-primary mb-2">{video.title}</h3>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">
                  {new Date(video.createdAt).toLocaleDateString()}
                </span>
                <span
                  className={`text-sm px-2 py-1 rounded-full ${
                    video.status === 'completed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                      : video.status === 'processing'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                  }`}
                >
                  {video.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 