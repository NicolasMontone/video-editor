"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useVideoStore } from "@/store/use-video-store"

export const useTrimDragging = (timelineRef: React.RefObject<HTMLDivElement>, duration: number) => {
  const [isDraggingTrim, setIsDraggingTrim] = useState<{ id: string; edge: "start" | "end" } | null>(null)
  const [isDraggingRegion, setIsDraggingRegion] = useState<string | null>(null)
  const [dragStartX, setDragStartX] = useState<number | null>(null)
  const [initialRegionState, setInitialRegionState] = useState<any>(null)
  const { trimRegions, updateTrimRegion } = useVideoStore()

  const positionToTime = (clientX: number): number => {
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
      setInitialRegionState({ ...region })
    }
    setIsDraggingTrim({ id, edge })
  }

  // Handle mouse move for trim handles
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
      if (isDraggingTrim && initialRegionState) {
        const { id } = isDraggingTrim
        const region = trimRegions.find((r) => r.id === id)
        if (region) {
          updateTrimRegion(id, region.startTime, region.endTime, true)
        }
      }

      setIsDraggingTrim(null)
      setInitialRegionState(null)
    }

    if (isDraggingTrim) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDraggingTrim, trimRegions, updateTrimRegion, initialRegionState])

  const handleRegionDragStart = (region: any) => (e: React.MouseEvent<HTMLElement>) => {
    if (e.target instanceof HTMLElement && !e.target.closest(".cursor-ew-resize") && !e.target.closest("button")) {
      e.preventDefault()
      e.stopPropagation()

      setDragStartX(e.clientX)
      setInitialRegionState({ ...region })
      setIsDraggingRegion(region.id)
    }
  }

  // Handle mouse move for dragging entire regions
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRegion && dragStartX !== null && initialRegionState) {
        const region = trimRegions.find((r) => r.id === isDraggingRegion)

        if (region && timelineRef.current) {
          const rect = timelineRef.current.getBoundingClientRect()
          const pixelMove = e.clientX - dragStartX
          const timeMove = (pixelMove / rect.width) * duration

          const regionDuration = initialRegionState.endTime - initialRegionState.startTime
          let newStartTime = initialRegionState.startTime + timeMove
          let newEndTime = initialRegionState.endTime + timeMove

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
      if (isDraggingRegion && initialRegionState) {
        const region = trimRegions.find((r) => r.id === isDraggingRegion)
        if (region) {
          updateTrimRegion(isDraggingRegion, region.startTime, region.endTime, true)
        }
      }

      setIsDraggingRegion(null)
      setDragStartX(null)
      setInitialRegionState(null)
    }

    if (isDraggingRegion) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDraggingRegion, dragStartX, trimRegions, duration, updateTrimRegion, initialRegionState])

  const isDragging = isDraggingTrim !== null || isDraggingRegion !== null

  return {
    isDraggingTrim,
    isDraggingRegion,
    isDragging,
    handleTrimDragStart,
    handleRegionDragStart,
    positionToTime,
  }
}
