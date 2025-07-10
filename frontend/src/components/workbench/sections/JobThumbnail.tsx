
import {
    ImageIcon,
    Loader2,
    AlertTriangle,
    Music,
    Mic,
  } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
  
interface JobThumbnailProps {
    thumbnailUrl?: string;
    title: string;
    status: 'completed' | 'in_progress' | 'failed' | 'queued';
    serviceSequence: string[];
    jobId: string;
}
  
const ServiceIcon = ({ service }: { service: string }) => {
    switch (service) {
        case 'music':
        return <Music className="w-12 h-12 text-muted-foreground/50" />;
        case 'voice':
        return <Mic className="w-12 h-12 text-muted-foreground/50" />;
        default:
        return <ImageIcon className="w-12 h-12 text-muted-foreground/50" />;
    }
};
  
export function JobThumbnail({
    thumbnailUrl,
    title,
    status,
    serviceSequence,
    jobId,
}: JobThumbnailProps) {
    const [cachedUrl, setCachedUrl] = useState<string | undefined>(undefined);

    useEffect(() => {
        const cacheKey = `thumbnail_${jobId}`;
        if (thumbnailUrl) {
            // If we have a URL, cache it and use it
            sessionStorage.setItem(cacheKey, thumbnailUrl);
            setCachedUrl(thumbnailUrl);
        } else if (status === 'completed') {
            // If job is complete but no URL, check cache anyway (e.g. for non-visual jobs that might have had a temp thumb)
            const storedUrl = sessionStorage.getItem(cacheKey);
            if (storedUrl) {
                setCachedUrl(storedUrl);
            }
        }
    }, [thumbnailUrl, jobId, status]);


    const renderContent = () => {
        if (cachedUrl) {
            return (
                <img
                src={cachedUrl}
                alt={title}
                className="w-full h-full object-cover"
                onError={() => {
                    // If cached URL fails, clear it
                    sessionStorage.removeItem(`thumbnail_${jobId}`);
                    setCachedUrl(undefined);
                }}
                />
            );
        }
    
        if (status === 'in_progress') {
            return <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />;
        }
    
        if (status === 'failed') {
            return <AlertTriangle className="w-10 h-10 text-red-500" />;
        }
    
        // For completed jobs without a thumbnail, show service icon on a nice background
        if (status === 'completed' && serviceSequence.length > 0) {
            return (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <ServiceIcon service={serviceSequence[0]} />
                </div>
            )
        }
    
        // Default fallback
        return <ImageIcon className="w-10 h-10 text-muted-foreground/50" />;
    };

    return (
        <div
        className={cn(
            'aspect-video bg-muted rounded-md mb-4 flex items-center justify-center overflow-hidden relative',
            {
            'bg-background/30 backdrop-blur-sm':
                !cachedUrl && (status === 'in_progress' || status === 'failed'),
            }
        )}
        >
        {renderContent()}
        </div>
    );
} 