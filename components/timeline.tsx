"use client"

import type React from "react"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { TrimRegion } from "@/store/use-video-store"

interface TimelineProps {
  timelineRef: React.RefObject<HTMLDivElement>
  duration: number
  currentTime: number
  trimRegions: TrimRegion[]
  hoveredRegion: string | null
  isDraggingTrim: { id: string; edge: "start" | "end" } | null
  isDraggingRegion: string | null
  onTimelineClick: (e: React.MouseEvent<HTMLDivElement>) => void
  onRegionMouseEnter: (id: string) => void
  onRegionMouseLeave: () => void
  onRegionMouseDown: (region: TrimRegion) => (e: React.MouseEvent<HTMLElement>) => void
  onTrimDragStart: (id: string, edge: "start" | "end") => (e: React.MouseEvent) => void
  onRegionDelete: (id: string) => void
}

export function Timeline({
  timelineRef,
  duration,
  currentTime,
  trimRegions,
  hoveredRegion,
  isDraggingTrim,
  isDraggingRegion,
  onTimelineClick,
  onRegionMouseEnter,
  onRegionMouseLeave,
  onRegionMouseDown,
  onTrimDragStart,
  onRegionDelete,
}: TimelineProps) {
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
        className={`h-16 bg-gray-100 rounded relative ${duration > 0 ? "cursor-pointer" : "opacity-50"}`}
        ref={timelineRef}
        onClick={onTimelineClick}
      >
        {/* Timeline ruler */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: 17 }).map((_, i) => (
            <div key={i} className="flex-1 border-l border-gray-300 h-full first:border-l-0">
              {i % 2 === 0 && <div className="w-1 h-1 bg-gray-400" />}
            </div>
          ))}
        </div>

        {/* Trim regions */}
        {trimRegions.map((region) => {
          const startPercent = (region.startTime / duration) * 100
          const endPercent = (region.endTime / duration) * 100
          const width = endPercent - startPercent

          return (
            <div
              key={region.id}
              className={`absolute top-0 h-full bg-red-500/30 border border-red-500 cursor-grab active:cursor-grabbing transition-opacity ${
                hoveredRegion === region.id ? "opacity-50" : "opacity-30"
              }`}
              style={{
                left: `${startPercent}%`,
                width: `${width}%`,
              }}
              onMouseEnter={() => onRegionMouseEnter(region.id)}
              onMouseLeave={onRegionMouseLeave}
              onMouseDown={onRegionMouseDown(region)}
            >
              {/* Start handle */}
              <div
                className="absolute left-0 top-0 h-full w-1 bg-red-600 cursor-ew-resize hover:w-1.5 transition-all"
                onMouseDown={onTrimDragStart(region.id, "start")}
              />

              {/* End handle */}
              <div
                className="absolute right-0 top-0 h-full w-1 bg-red-600 cursor-ew-resize hover:w-1.5 transition-all"
                onMouseDown={onTrimDragStart(region.id, "end")}
              />

              {/* Delete button */}
              {hoveredRegion === region.id && (
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRegionDelete(region.id)
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          )
        })}

        {/* Current time indicator */}
        {duration > 0 && (
          <div
            className="absolute top-0 h-full w-0.5 bg-blue-500"
            style={{
              left: `${(currentTime / duration) * 100}%`,
            }}
          />
        )}
      </div>
    </div>
  )
}
