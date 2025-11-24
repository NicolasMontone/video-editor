"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useVideoStore, type TrimRegion } from "@/store/use-video-store"

interface UseTrimDragReturn {
  isDraggingTrim: { id: string; edge: "start" | "end" } | null
  hoveredRegion: string | null
  setHoveredRegion: (id: string | null) => void
  handleTrimDragStart: (id: string, edge: "start" | "end") => (e: React.MouseEvent) => void
  handleRegionDragStart: (region: TrimRegion) => (e: React.MouseEvent<HTMLElement>) => void
}

export function useTimelineDrag(
  timelineRef: React.RefObject<HTMLDivElement>,
  isDraggingRegion: string | null,
  duration: number,
): UseTrimDragReturn {
  const { trimRegions, updateTrimRegion } = useVideoStore()
  const [isDraggingTrim, setIsDraggingTrim] = useState<{ id: string; edge: "start" | "end" } | null>(null)
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  const [dragStartX, setDragStartX] = useState<number | null>(null)
  const initialRegionStateRef = useRef<TrimRegion | null>(null)

  const positionToTime = (clientX: number) => {
    if (!timelineRef.current) return 0
    const rect = timelineRef.current.getBoundingClientRect()
    const position = (clientX - rect.left) / rect.width
    return Math.max(0, Math.min(position * duration, duration))
  }

  const handleTrimDragStart = (id: string, edge: "start" | "end") => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const region = trimRegions.find((r) => r.id === id)
    if (region) {
      initialRegionStateRef.current = { ...region }
    }

    setIsDraggingTrim({ id, edge })
  }

  // Handle trim edge dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingTrim) {
        const { id, edge } = isDraggingTrim
        const region = trimRegions.find((r) => r.id === id)

        if (region) {
          const newTime = positionToTime(e.clientX)

          if (edge === "start" && newTime < region.endTime) {
            updateTrimRegion(id, newTime, region.endTime, false)
          } else if (edge === "end" && newTime > region.startTime) {
            updateTrimRegion(id, region.startTime, newTime, false)
          }
        }
      }
    }

    const handleMouseUp = () => {
      if (isDraggingTrim && initialRegionStateRef.current) {
        const { id } = isDraggingTrim
        const region = trimRegions.find((r) => r.id === id)

        if (region) {
          updateTrimRegion(id, region.startTime, region.endTime, true)
        }
      }

      setIsDraggingTrim(null)
      initialRegionStateRef.current = null
    }

    if (isDraggingTrim) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDraggingTrim, trimRegions, updateTrimRegion])

  // Handle region dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRegion && dragStartX !== null && initialRegionStateRef.current && timelineRef.current) {
        const region = trimRegions.find((r) => r.id === isDraggingRegion)

        if (region) {
          const rect = timelineRef.current.getBoundingClientRect()
          const pixelMove = e.clientX - dragStartX
          const timeMove = (pixelMove / rect.width) * duration

          const regionDuration = initialRegionStateRef.current.endTime - initialRegionStateRef.current.startTime
          let newStartTime = initialRegionStateRef.current.startTime + timeMove
          let newEndTime = initialRegionStateRef.current.endTime + timeMove

          if (newStartTime < 0) {
            newStartTime = 0
            newEndTime = regionDuration
          } else if (newEndTime > duration) {
            newEndTime = duration
            newStartTime = duration - regionDuration
          }

          updateTrimRegion(isDraggingRegion, newStartTime, newEndTime, false)
        }
      }
    }

    const handleMouseUp = () => {
      if (isDraggingRegion && initialRegionStateRef.current) {
        const region = trimRegions.find((r) => r.id === isDraggingRegion)

        if (region) {
          updateTrimRegion(isDraggingRegion, region.startTime, region.endTime, true)
        }
      }

      setDragStartX(null)
      initialRegionStateRef.current = null
    }

    if (isDraggingRegion) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDraggingRegion, dragStartX, trimRegions, duration, updateTrimRegion])

  const handleRegionDragStart = (region: TrimRegion) => (e: React.MouseEvent<HTMLElement>) => {
    setDragStartX(e.clientX)
    initialRegionStateRef.current = { ...region }

    if (e.target instanceof HTMLElement && !e.target.closest(".cursor-ew-resize") && !e.target.closest("button")) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return {
    isDraggingTrim,
    hoveredRegion,
    setHoveredRegion,
    handleTrimDragStart,
    handleRegionDragStart,
  }
}
