import { toast } from '@/components/ui/use-toast'
import { apiClient } from '@/lib/api/apiClient'
import JSZip from 'jszip'
import { auth0M2MConfig } from '@/lib/auth/config';

// These interfaces are kept for backward compatibility
export interface DownloadFileOptions {
  url: string
  fileName: string
  contentType?: string
  type?: 'image' | 'video' | 'voice' | 'animation' | 'music'
  storageKey?: string
  title?: string
}

export interface MediaContent {
  publicUrl: string
  fileName?: string
  storageKey: string
  metadata?: any
}

export interface Media {
  url: string
  storageKey?: string
}

export interface SceneContent {
  image?: MediaContent
  video?: MediaContent
  animation?: MediaContent
  voice?: MediaContent
}

export function getFileNameFromStorageKey(storageKey: string): string {
  const parts = storageKey.split('/')
  return parts[parts.length - 1]
}

// Helper function to get current timestamp formatted as YYYYMMDD_HHMMSS
function getTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

// Helper function to get a fresh M2M token
async function getFreshM2MToken(): Promise<string> {
  try {
    // Force clear any cached tokens
    localStorage.removeItem('auth_m2m_token');
    localStorage.removeItem('auth_m2m_token_expiry');
    
    // Make direct API call to get M2M token with client credentials
    console.log('Requesting fresh M2M token for download');
    const response = await fetch('/api/auth/proxy?endpoint=/api/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: auth0M2MConfig.m2mClientId,
        client_secret: auth0M2MConfig.m2mClientSecret,
        audience: auth0M2MConfig.audience,
        grant_type: 'client_credentials'
      })
    });
    
    if (!response.ok) {
      console.error('Error getting M2M token:', response.status, response.statusText);
      throw new Error(`Failed to obtain M2M token: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Successfully obtained fresh M2M token');
    
    if (!data.access_token) {
      throw new Error('M2M token response did not include access_token');
    }
    
    // Store token in localStorage for potential reuse
    localStorage.setItem('auth_m2m_token', data.access_token);
    if (data.expires_in) {
      localStorage.setItem('auth_m2m_token_expiry', (Date.now() + (data.expires_in * 1000)).toString());
    }
    
    return data.access_token;
  } catch (error) {
    console.error('Error getting fresh M2M token:', error);
    throw new Error('Authentication failed: Unable to obtain M2M token for download');
  }
}

export async function handleMediaDownload(type: 'image' | 'video' | 'voice' | 'animation' | 'music', content?: MediaContent, title?: string) {
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
  
  const basicFileName = content.fileName || getFileNameFromStorageKey(content.storageKey);
  
  // Get file extension
  const extension = basicFileName.includes('.') ? 
    basicFileName.substring(basicFileName.lastIndexOf('.')) : '';
    
  // Create a better file name using title if provided
  const timestamp = getTimestamp();
  let fileName;
  
  if (title) {
    // Use sanitized title with type and timestamp
    fileName = `${sanitizeFileName(title)}_${type}_scene_1_${timestamp}${extension}`;
  } else {
    // Use default naming with timestamp
    fileName = `${type}_scene_1_${timestamp}${extension}`;
  }
  
  console.log(`Downloading ${type}:`, { fileName, url: content.publicUrl })
  
  return await downloadFile({
    url: content.publicUrl,
    fileName,
    type,
    storageKey: content.storageKey,
    title
  })
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

    // Get a fresh M2M token once for all downloads to avoid rate limiting
    const m2mToken = await getFreshM2MToken();
    console.log('Using M2M token for bulk downloads', { tokenLength: m2mToken.length });

    // Helper function to download and add to zip
    const addToZip = async (
      content: MediaContent | undefined, 
      type: 'image' | 'video' | 'voice' | 'animation',
      sceneNum: number,
      totalFiles: number
    ) => {
      if (!content?.storageKey || !content.publicUrl) return

      try {
        // Only proceed with files that need S3 download
        if (content.publicUrl.includes('s3.eu-central-1.amazonaws.com') && content.storageKey) {
          const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/download/${encodeURIComponent(content.storageKey)}`
          console.log(`Downloading S3 file using API: ${apiUrl} with M2M token`);
          
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${m2mToken}`
            }
          })

          if (!response.ok) {
            console.error(`Failed to download: Status ${response.status}`, await response.text());
            throw new Error(`Failed to download ${type} (Status: ${response.status})`)
          }

          const blob = await response.blob()
          
          // Get file extension
          const origFileName = content.fileName || getFileNameFromStorageKey(content.storageKey);
          const extension = origFileName.includes('.') ? 
            origFileName.substring(origFileName.lastIndexOf('.')) : '';
            
          // Create a consistent naming scheme
          const zipFileName = `${type}_scene_${sceneNum}${extension}`;
          
          // Create folder only when first file of this type is added
          const folderKey = `${type}s` === 'voices' ? 'voice' : `${type}s`
          if (!folders[folderKey]) {
            folders[folderKey] = zip.folder(folderKey)
          }
          
          folders[folderKey]?.file(zipFileName, blob)
        } else {
          // For non-S3 URLs, use direct fetch
          const directResponse = await fetch(content.publicUrl, {
            method: 'GET',
            headers: {
              'Accept': type === 'voice' ? 'audio/mpeg, audio/*' : '*/*',
            }
          })
          
          if (!directResponse.ok) throw new Error(`Failed to download ${type} (Status: ${directResponse.status})`)
          
          const directBlob = await directResponse.blob()
          const finalBlob = type === 'voice' 
            ? new Blob([directBlob], { type: 'audio/mpeg' })
            : directBlob
          
          // Get file extension  
          const origFileName = content.fileName || getFileNameFromStorageKey(content.storageKey);
          const extension = origFileName.includes('.') ? 
            origFileName.substring(origFileName.lastIndexOf('.')) : '';
            
          // Create a consistent naming scheme
          const zipFileName = `${type}_scene_${sceneNum}${extension}`;
          
          // Create folder only when first file of this type is added
          const folderKey = `${type}s` === 'voices' ? 'voice' : `${type}s`
          if (!folders[folderKey]) {
            folders[folderKey] = zip.folder(folderKey)
          }
          
          folders[folderKey]?.file(zipFileName, finalBlob)
        }

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
          description: `Failed to download ${type} for scene ${sceneNum}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
      }
    }

    // Download all media types for each scene
    for (const [index, scene] of scenes.entries()) {
      const sceneNum = index + 1
      await Promise.all([
        scene.image && addToZip(scene.image, 'image', sceneNum, totalFiles),
        scene.video && addToZip(scene.video, 'video', sceneNum, totalFiles),
        scene.animation && addToZip(scene.animation, 'animation', sceneNum, totalFiles),
        scene.voice && addToZip(scene.voice, 'voice', sceneNum, totalFiles)
      ])
    }

    // Generate and download zip file
    const zipContent = await zip.generateAsync({ type: 'blob' })
    const blobUrl = window.URL.createObjectURL(zipContent)
    const link = document.createElement('a')
    link.href = blobUrl
    
    // Add timestamp to zip name
    const timestamp = getTimestamp();
    
    // Create zip filename from title or fallback to jobId
    const zipName = title ? 
      `${sanitizeFileName(title)}_${timestamp}.zip` : 
      `content_${jobId}_${timestamp}.zip`
    
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

export async function downloadFile({ url, fileName, contentType, type, storageKey, title }: DownloadFileOptions) {
  try {
    if (!url) throw new Error('No URL provided')
    
    console.log('Attempting to download:', { type, fileName, url })

    // If it's an S3 URL, use our API proxy with M2M token
    if (url.includes('s3.eu-central-1.amazonaws.com') && storageKey) {
      // Use API endpoint for S3 downloads
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/download/${encodeURIComponent(storageKey)}`
      
      // Get a fresh M2M token
      const m2mToken = await getFreshM2MToken();
      console.log('Using M2M token for download', { 
        tokenFirstChars: m2mToken.substring(0, 20) + '...',
        tokenLength: m2mToken.length
      });

      // Set up headers with M2M token only
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${m2mToken}`
      }

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers
      })
      
      if (!response.ok) {
        console.error(`Download failed with status: ${response.status}`, await response.text());
        throw new Error(`Download failed with status: ${response.status}`)
      }
      
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      
      // We already have timestamp in the filename from handleMediaDownload, don't add another one
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
    
    // We already have timestamp in the filename from handleMediaDownload, don't add another one
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