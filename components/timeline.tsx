"use client"

import type React from "react"

import type { TrimRegion } from "@/store/use-video-store"
import { TrimRegionItem } from "./trim-region-item"

interface TimelineProps {
  duration: number
  currentTime: number
  trimRegions: TrimRegion[]
  videoSrc: string | null
  isDragging: boolean
  hoveredRegion: string | null
  onTimlineClick: (time: number) => void
  onTrimDragStart: (id: string, edge: "start" | "end") => (e: React.MouseEvent) => void
  onRegionDragStart: (region: TrimRegion) => (e: React.MouseEvent<HTMLElement>) => void
  onHover: (id: string | null) => void
  timelineRef: React.RefObject<HTMLDivElement>
}

export function Timeline({
  duration,
  currentTime,
  trimRegions,
  videoSrc,
  isDragging,
  hoveredRegion,
  onTimlineClick,
  onTrimDragStart,
  onRegionDragStart,
  onHover,
  timelineRef,
}: TimelineProps) {
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="relative border rounded-md p-2">
      <div className="flex justify-between mb-1 text-xs text-gray-500">
        {Array.from({ length: 9 }).map((_, i) => {
          const minutes = Math.floor((duration * i) / 8 / 60)
          const seconds = Math.floor(((duration * i) / 8) % 60)
          return (
            <div key={i} className="text-center">
              {`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`}
            </div>
          )
        })}
      </div>

      <div
        className={`h-16 bg-gray-100 rounded relative ${videoSrc ? "cursor-pointer" : "opacity-50"}`}
        ref={timelineRef}
        onClick={(e) => {
          if (!isDragging && videoSrc) {
            const rect = timelineRef.current?.getBoundingClientRect()
            if (rect) {
              const clickPosition = (e.clientX - rect.left) / rect.width
              const newTime = clickPosition * duration
              onTimlineClick(newTime)
            }
          }
        }}
      >
        {/* Timeline ruler */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: 17 }).map((_, i) => (
            <div key={i} className="flex-1 border-l border-gray-300 h-full first:border-l-0">
              {i % 2 === 0 && (
                <div className="h-2 border-l border-gray-400 absolute" style={{ left: `${(i / 16) * 100}%` }}></div>
              )}
            </div>
          ))}
        </div>

        {/* Current time indicator */}
        {videoSrc && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-[#0096FF] z-10 cursor-ew-resize"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          />
        )}

        {/* Trim regions */}
        {videoSrc &&
          trimRegions.map((region) => (
            <TrimRegionItem
              key={region.id}
              region={region}
              duration={duration}
              onDragStart={onRegionDragStart}
              onTrimDragStart={onTrimDragStart}
              onHover={onHover}
              isHovered={hoveredRegion === region.id}
            />
          ))}
      </div>
    </div>
  )
}
