import { toast } from '@/components/ui/use-toast'
import JSZip from 'jszip'
import { AxiosInstance } from 'axios';

// Custom Error class to pass structured error information
export class DownloadError extends Error {
  public details?: string;

  constructor(message: string, details?: string) {
    super(message);
    this.name = 'DownloadError';
    this.details = details;
  }
}

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

export async function handleMediaDownload(
    api: AxiosInstance,
    type: 'image' | 'video' | 'voice' | 'animation' | 'music', 
    content?: MediaContent, 
    title?: string
) {
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
    api,
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

export async function handleBulkDownload(
    api: AxiosInstance,
    scenes: SceneContent[], 
    jobId: string, 
    title?: string
) {
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
      sceneNum: number,
      totalFiles: number
    ) => {
      if (!content?.storageKey || !content.publicUrl) return

      try {
          const apiUrl = `/api/download/${encodeURIComponent(content.storageKey)}`
          console.log(`Downloading S3 file using API: ${apiUrl}`);
          
          const response = await api.get(apiUrl, {
            responseType: 'blob'
          });

          if (response.status !== 200) {
            console.error(`Failed to download: Status ${response.status}`);
            throw new Error(`Failed to download ${type} (Status: ${response.status})`)
          }

          const blob = response.data;
          
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
        throw error; // Re-throw the error to be caught by Promise.all
      }
    }

    // Download all media types for each scene
    for (const [index, scene] of scenes.entries()) {
      const sceneNum = index + 1
      try {
        await Promise.all([
          scene.image && addToZip(scene.image, 'image', sceneNum, totalFiles),
          scene.video && addToZip(scene.video, 'video', sceneNum, totalFiles),
          scene.animation && addToZip(scene.animation, 'animation', sceneNum, totalFiles),
          scene.voice && addToZip(scene.voice, 'voice', sceneNum, totalFiles)
        ])
      } catch (error) {
        // If any promise in Promise.all rejects, we'll catch it here.
        // The individual error is already toasted inside addToZip.
        // We can stop the whole process.
        console.error(`Bulk download process halted due to an error in scene ${sceneNum}.`);
        return false; // Stop processing further scenes
      }
    }

    if (downloadCount === 0 && totalFiles > 0) {
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "Could not download any files. Please check the console for errors.",
      })
      return false;
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

export async function downloadFile({ api, url, fileName, contentType, type, storageKey, title }: DownloadFileOptions & { api: AxiosInstance }) {
  try {
    if (!url) throw new Error('No URL provided')
    
    console.log('Attempting to download:', { type, fileName, url })

    // If it's an S3 URL, use our API with the user's token via apiClient
    if (url.includes('s3.eu-central-1.amazonaws.com') && storageKey) {
      const apiUrl = `/api/download/${encodeURIComponent(storageKey)}`
      
      const response = await api.get(apiUrl, {
        responseType: 'blob'
      })
      
      // Note: non-2xx statuses will throw and be caught by the catch block
      // due to the axios interceptor. This check is an extra safeguard.
      if (response.status !== 200) {
        throw new Error(`Download failed with status: ${response.status}`)
      }
      
      const blob = response.data;
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
    const response = await fetch(url)
    
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
  } catch (error: any) {
    console.error('Download failed:', error)
    
    // Extract details for the new error
    const defaultMessage = "There was an error downloading the file. Our team has been notified. If you need immediate assistance, please contact support at https://www.narravid.io/contact.";
    let message = defaultMessage;
    let details = error instanceof Error ? error.message : 'An unknown error occurred.';

    if (error.response && error.response.data instanceof Blob) {
      try {
        const errorText = await error.response.data.text();
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) {
          // Use specific message for user-actionable errors
          if (error.response.status === 403 || error.response.status === 404) {
             message = errorJson.error;
          }
          // Always pass the backend error as technical details
          if(errorJson.details) {
            details = `API Error: ${errorJson.error}\nDetails: ${errorJson.details}`;
          } else {
            details = `API Error: ${errorJson.error}`;
          }
        }
      } catch (parseError) {
        console.error('Could not parse download error response:', parseError);
      }
    }
    
    // Instead of toasting, throw a structured error to be handled by the UI component
    throw new DownloadError(message, details);
  }
} 