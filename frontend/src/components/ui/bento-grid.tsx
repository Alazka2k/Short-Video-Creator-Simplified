'use client';

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

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
    colSpan?: number;
    hasPersistentHover?: boolean;
    previewUrl?: string | null;
    jobId: string;
}

interface BentoGridProps {
    items: BentoItem[];
}

export function BentoGrid({ items = [] }: BentoGridProps) {
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
                        item.colSpan || "col-span-1",
                        item.colSpan === 2 ? "md:col-span-2" : "",
                        {
                            "shadow-[0_2px_12px_rgba(0,0,0,0.03)] -translate-y-0.5":
                                item.hasPersistentHover,
                            "dark:shadow-[0_2px_12px_rgba(255,255,255,0.03)]":
                                item.hasPersistentHover,
                        }
                    )}
                    onClick={() => window.open(`/workbench/${item.jobId}`, '_blank')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="relative flex flex-col space-y-3">
                        {/* Preview image/video if available */}
                        {item.previewUrl && (
                            <div className="relative w-full h-48 rounded-lg overflow-hidden bg-black/5 dark:bg-white/5">
                                {item.previewUrl.endsWith('.mp4') ? (
                                    <video
                                        src={item.previewUrl}
                                        className="w-full h-full object-cover"
                                        controls
                                        muted
                                    />
                                ) : (
                                    <img
                                        src={item.previewUrl}
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                        )}

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

                        {/* CTA */}
                        <div className="flex justify-end">
                            <span className="text-xs text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                {item.cta || "View Details →"}
                            </span>
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