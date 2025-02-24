'use client';

import { cn } from "@/lib/utils";
import { Download, Loader2 } from "lucide-react";
import { Button } from "./button";

export interface BentoItem {
    title: string;
    description: string;
    icon: React.ReactNode | null;
    services: Array<{
        icon: React.ReactNode;
        label: string;
    }>;
    meta?: string;
    cta?: string;
    gridSpan?: number;
    hasPersistentHover?: boolean;
    previewUrl?: string | null;
    jobId: string;
    aspectRatio?: string;
    onDownload?: () => void;
    isDownloading?: boolean;
}

interface BentoGridProps {
    items: BentoItem[];
}

export function BentoGrid({ items = [] }: BentoGridProps) {
    const getAspectRatioClass = (ratio?: string) => {
        switch (ratio) {
            case "16:9":
                return "aspect-video"
            case "1:1":
                return "aspect-square"
            case "9:16":
                return "aspect-[9/16]"
            default:
                return "aspect-square"
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 max-w-7xl mx-auto">
            {items.map((item) => (
                <div
                    key={item.jobId}
                    className={cn(
                        "group relative p-4 rounded-xl overflow-hidden transition-all duration-300",
                        "border border-gray-100/80 dark:border-white/10 bg-white dark:bg-black",
                        "hover:shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:hover:shadow-[0_2px_12px_rgba(255,255,255,0.03)]",
                        "hover:-translate-y-0.5 will-change-transform",
                        item.gridSpan === 2 ? "md:col-span-2" : "col-span-1",
                        {
                            "shadow-[0_2px_12px_rgba(0,0,0,0.03)] -translate-y-0.5":
                                item.hasPersistentHover,
                            "dark:shadow-[0_2px_12px_rgba(255,255,255,0.03)]":
                                item.hasPersistentHover,
                        }
                    )}
                >
                    <div className="relative flex flex-col space-y-3">
                        {/* Preview container */}
                        <div 
                            className="relative w-full rounded-lg overflow-hidden bg-black/5 dark:bg-white/5 cursor-pointer"
                            onClick={() => window.open(`/workbench/${item.jobId}`, '_blank')}
                        >
                            {item.previewUrl && (
                                <div className={cn(
                                    "w-full",
                                    getAspectRatioClass(item.aspectRatio)
                                )}>
                                    <img
                                        src={item.previewUrl}
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Title and description */}
                        <div className="space-y-2">
                            <h3 className="font-medium text-gray-900 dark:text-gray-100 tracking-tight text-[15px]">
                                {item.title}
                                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 font-normal">
                                    {item.meta}
                                </span>
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-snug font-[425]">
                                {item.description}
                            </p>
                        </div>

                        {/* Services */}
                        <div className="flex flex-wrap gap-2">
                            {item.services.map((service, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/5 dark:bg-white/10 text-xs"
                                >
                                    {service.icon}
                                    <span>{service.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between items-center">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    item.onDownload?.();
                                }}
                                disabled={item.isDownloading}
                                className="border-violet-500/20 hover:border-violet-500/40"
                            >
                                {item.isDownloading ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                    <Download className="h-4 w-4 mr-1" />
                                )}
                                {item.isDownloading ? 'Downloading...' : 'Download'}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(`/workbench/${item.jobId}`, '_blank')}
                                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                            >
                                {item.cta || "View Details →"}
                            </Button>
                        </div>
                    </div>

                    <div
                        className={`absolute inset-0 -z-10 rounded-xl p-px bg-gradient-to-br from-transparent via-gray-100/50 to-transparent dark:via-white/10 ${
                            item.hasPersistentHover
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                        } transition-opacity duration-300`}
                    />
                </div>
            ))}
        </div>
    );
} 