import { toast } from '@/components/ui/use-toast'
import { apiClient } from '@/lib/api/apiClient'

interface DownloadFileOptions {
  url: string
  fileName: string
  contentType?: string
  type?: 'image' | 'video' | 'voice' | 'animation' | 'music'
  storageKey?: string
}

export async function downloadFile({ url, fileName, contentType, type, storageKey }: DownloadFileOptions) {
  try {
    if (!url) throw new Error('No URL provided')
    
    console.log('Attempting to download:', { type, fileName, url })

    // If it's an S3 URL, use our API proxy
    if (url.includes('s3.eu-central-1.amazonaws.com') && storageKey) {
      // Use API endpoint for S3 downloads
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/download/${encodeURIComponent(storageKey)}`
      
      // Use apiClient to get the token and make the authenticated request
      const token = await apiClient.getToken()
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`Download failed with status: ${response.status}`)
      }
      
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)

      toast({
        title: "Download successful",
        description: `Successfully downloaded ${fileName}`,
      })
      
      return true
    }

    // For non-S3 URLs, use direct fetch
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': type === 'voice' || type === 'music' ? 'audio/mpeg, audio/*' : '*/*',
      }
    })
    
    if (!response.ok) {
      throw new Error(`Download failed with status: ${response.status}`)
    }
    
    const blob = await response.blob()
    const finalBlob = type === 'voice' || type === 'music' 
      ? new Blob([blob], { type: 'audio/mpeg' })
      : blob

    const blobUrl = window.URL.createObjectURL(finalBlob)
    
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(blobUrl)

    toast({
      title: "Download successful",
      description: `Successfully downloaded ${fileName}`,
    })
    
    return true
  } catch (error) {
    console.error('Download failed:', error)
    toast({
      variant: "destructive",
      title: "Download failed",
      description: error instanceof Error ? error.message : "There was an error downloading the file. Please try again.",
    })
    return false
  }
}

interface MediaContent {
  publicUrl: string
  fileName?: string
  storageKey: string
  metadata?: any
}

export function getFileNameFromStorageKey(storageKey: string): string {
  const parts = storageKey.split('/')
  return parts[parts.length - 1]
}

export async function handleMediaDownload(type: 'image' | 'video' | 'voice' | 'animation' | 'music', content?: MediaContent) {
  if (!content?.storageKey || !content.publicUrl) {
    const message = !content ? 'No content available' :
                   !content.storageKey ? 'No storage key available' :
                   'No URL available'
    
    toast({
      variant: "destructive",
      title: "Download failed",
      description: `${message} for ${type}.`,
    })
    return false
  }
  
  const fileName = content.fileName || getFileNameFromStorageKey(content.storageKey)
  console.log(`Downloading ${type}:`, { fileName, url: content.publicUrl })
  
  return await downloadFile({
    url: content.publicUrl,
    fileName,
    type,
    storageKey: content.storageKey
  })
} 