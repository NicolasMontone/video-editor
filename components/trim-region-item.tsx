"use client"

import type React from "react"

import { X } from "lucide-react"
import type { TrimRegion } from "@/store/use-video-store"
import { useVideoStore } from "@/store/use-video-store"

interface TrimRegionItemProps {
  region: TrimRegion
  duration: number
  onDragStart: (region: TrimRegion) => (e: React.MouseEvent<HTMLElement>) => void
  onTrimDragStart: (id: string, edge: "start" | "end") => (e: React.MouseEvent) => void
  onHover?: (id: string | null) => void
  isHovered?: boolean
}

export function TrimRegionItem({
  region,
  duration,
  onDragStart,
  onTrimDragStart,
  onHover,
  isHovered,
}: TrimRegionItemProps) {
  const { removeTrimRegion } = useVideoStore()

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div
      className="absolute top-0 bottom-0 z-20 cursor-move group"
      style={{
        left: `${(region.startTime / duration) * 100}%`,
        width: `${((region.endTime - region.startTime) / duration) * 100}%`,
        backgroundColor: "#E5EFFF",
        border: "1px solid #0096FF",
      }}
      onMouseDown={onDragStart(region)}
      onMouseEnter={() => onHover?.(region.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Start handle */}
      <div
        className="absolute top-0 bottom-0 w-1 cursor-ew-resize flex items-center justify-center left-0"
        style={{ backgroundColor: "#0096FF" }}
        onMouseDown={onTrimDragStart(region.id, "start")}
      >
        <div
          className="absolute -left-1 -right-1 top-1/2 -translate-y-1/2 h-6 rounded flex items-center justify-center"
          style={{ backgroundColor: "#0096FF" }}
        >
          <span className="text-white text-xs">◀</span>
        </div>
      </div>

      {/* End handle */}
      <div
        className="absolute top-0 bottom-0 w-1 cursor-ew-resize flex items-center justify-center right-0"
        style={{ backgroundColor: "#0096FF" }}
        onMouseDown={onTrimDragStart(region.id, "end")}
      >
        <div
          className="absolute -left-1 -right-1 top-1/2 -translate-y-1/2 h-6 rounded flex items-center justify-center"
          style={{ backgroundColor: "#0096FF" }}
        >
          <span className="text-white text-xs">▶</span>
        </div>
      </div>

      {/* Delete button */}
      <div
        className={`absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-200 ${
          isHovered ? "opacity-100" : ""
        }`}
      >
        <button
          className="flex items-center justify-center w-5 h-5 rounded-full bg-[#0096FF] text-white hover:bg-[#0078CC] shadow-md"
          onClick={(e) => {
            e.stopPropagation()
            removeTrimRegion(region.id)
          }}
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Delete trim region</span>
        </button>
      </div>

      {/* Label */}
      <div className="absolute bottom-1 left-0 right-0 text-center">
        <span className="text-xs text-white px-1 rounded" style={{ backgroundColor: "#0096FF" }}>
          Trim
        </span>
      </div>
    </div>
  )
}
