"use client";
import {
  useMotionValueEvent,
  useScroll,
  useTransform,
  motion,
} from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface TimelineEntry {
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  imagePath?: string;
}

export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <div className="w-full py-12">
      <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {data.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="group relative"
            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
          >
            <div className="relative p-6 rounded-xl bg-card hover:bg-accent/5 transition-all duration-300 border border-border/50 group-hover:border-primary/20 group-hover:shadow-lg cursor-pointer">
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-primary/10 text-primary">
                {item.icon}
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-foreground mb-4">
                {item.title}
              </h3>

              {/* Content */}
              <div className="text-muted-foreground">
                {item.content}
              </div>

              {/* Image Preview (if available) */}
              {item.imagePath && (
                <motion.div 
                  className={`mt-4 rounded-lg overflow-hidden transition-all duration-300 ${
                    expandedIndex === index ? 'h-48' : 'h-0'
                  }`}
                  initial={false}
                >
                  <Image
                    src={item.imagePath}
                    alt={`${item.title} preview`}
                    width={400}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              )}

              {/* Hover/Active decoration */}
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/20 rounded-xl transition-colors duration-300" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}; 