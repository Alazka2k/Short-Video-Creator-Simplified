import { toast } from '@/components/ui/use-toast'
import { apiClient } from '@/lib/api/apiClient'
import JSZip from 'jszip'

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
      
      // Get both tokens
      const userToken = localStorage.getItem('access_token')
      const m2mToken = await apiClient.getToken()
      
      if (!userToken || !m2mToken) {
        throw new Error('Authentication tokens not available')
      }

      // Set up headers with both tokens
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${m2mToken}`,
        'x-user-token': userToken
      }

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers,
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

interface SceneContent {
  image?: MediaContent
  video?: MediaContent
  animation?: MediaContent
  voice?: MediaContent
}

function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"\/\\|?*\x00-\x1F]/g, '') // Remove invalid Windows filename characters
    .replace(/^\.+/, '') // Remove leading periods
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 255); // Limit length to 255 characters
}

export async function handleBulkDownload(scenes: SceneContent[], jobId: string, title?: string) {
  try {
    const zip = new JSZip()
    let downloadCount = 0
    const totalFiles = scenes.reduce((count, scene) => {
      return count + Object.keys(scene).filter(key => 
        ['image', 'video', 'animation', 'voice'].includes(key) && 
        scene[key as keyof SceneContent]
      ).length
    }, 0)

    toast({
      title: "Starting bulk download",
      description: `Preparing ${totalFiles} files for download...`,
    })

    // Create folders only if content exists
    const folders: { [key: string]: JSZip | null } = {
      images: null,
      videos: null,
      animations: null,
      voice: null
    }

    // Helper function to download and add to zip
    const addToZip = async (
      content: MediaContent | undefined, 
      type: 'image' | 'video' | 'voice' | 'animation',
      sceneNum: number
    ) => {
      if (!content?.storageKey || !content.publicUrl) return

      try {
        const userToken = localStorage.getItem('access_token')
        const m2mToken = await apiClient.getToken()
        
        if (!userToken || !m2mToken) {
          throw new Error('Authentication tokens not available')
        }

        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/download/${encodeURIComponent(content.storageKey)}`
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${m2mToken}`,
            'x-user-token': userToken
          },
          credentials: 'include'
        })

        if (!response.ok) throw new Error(`Failed to download ${type}`)

        const blob = await response.blob()
        const baseFileName = `${type}_scene_${sceneNum}`
        const extension = content.fileName ? `.${content.fileName.split('.').pop()}` : ''
        const zipFileName = `${baseFileName}${extension}`
        
        // Create folder only when first file of this type is added
        const folderKey = `${type}s` === 'voices' ? 'voice' : `${type}s`
        if (!folders[folderKey]) {
          folders[folderKey] = zip.folder(folderKey)
        }
        
        folders[folderKey]?.file(zipFileName, blob)

        downloadCount++
        toast({
          title: "Download progress",
          description: `Downloaded ${downloadCount} of ${totalFiles} files`,
        })
      } catch (error) {
        console.error(`Error downloading ${type} for scene ${sceneNum}:`, error)
        toast({
          variant: "destructive",
          title: "Download error",
          description: `Failed to download ${type} for scene ${sceneNum}`,
        })
      }
    }

    // Download all media types for each scene
    for (const [index, scene] of scenes.entries()) {
      const sceneNum = index + 1
      await Promise.all([
        scene.image && addToZip(scene.image, 'image', sceneNum),
        scene.video && addToZip(scene.video, 'video', sceneNum),
        scene.animation && addToZip(scene.animation, 'animation', sceneNum),
        scene.voice && addToZip(scene.voice, 'voice', sceneNum)
      ])
    }

    // Generate and download zip file
    const content = await zip.generateAsync({ type: 'blob' })
    const blobUrl = window.URL.createObjectURL(content)
    const link = document.createElement('a')
    link.href = blobUrl
    
    // Create zip filename from title or fallback to jobId
    const zipName = title ? 
      `${sanitizeFileName(title)}.zip` : 
      `content_${jobId}.zip`
    
    link.download = zipName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(blobUrl)

    toast({
      title: "Download complete",
      description: `Successfully downloaded ${downloadCount} files`,
    })

    return true
  } catch (error) {
    console.error('Bulk download failed:', error)
    toast({
      variant: "destructive",
      title: "Download failed",
      description: error instanceof Error ? error.message : "Failed to download files",
    })
    return false
  }
} 