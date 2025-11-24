"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useVideoStore, type TrimRegion } from "@/store/use-video-store"

export const usePlayback = (
  videoRef: React.RefObject<HTMLVideoElement>,
  trimRegions: TrimRegion[],
  isDragging: boolean,
) => {
  const [isSkipping, setIsSkipping] = useState(false)
  const { isPlaying, setIsPlaying, currentTime, setCurrentTime, duration } = useVideoStore()

  // Handle time updates and auto-skip trimmed regions
  const handleTimeUpdate = () => {
    if (videoRef.current && !isDragging) {
      const newTime = videoRef.current.currentTime
      setCurrentTime(newTime)

      // Check if we need to skip any trimmed regions
      if (isPlaying && !isSkipping) {
        for (const region of trimRegions) {
          if (newTime >= region.startTime && newTime < region.endTime) {
            setIsSkipping(true)
            videoRef.current.currentTime = region.endTime

            // Ensure video keeps playing after skip
            setTimeout(() => {
              if (videoRef.current && !videoRef.current.paused) {
                videoRef.current
                  .play()
                  .then(() => setIsSkipping(false))
                  .catch((error) => {
                    console.error("[v0] Error playing video after skip:", error)
                    setIsSkipping(false)
                  })
              } else {
                setIsSkipping(false)
              }
            }, 50)

            break
          }
        }
      }
    }
  }

  const handlePlay = () => setIsPlaying(true)
  const handlePause = () => {
    if (!isSkipping) {
      setIsPlaying(false)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      useVideoStore.setState({ duration: videoRef.current.duration })
    }
  }

  // Handle spacebar for play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        if (videoRef.current) {
          if (isPlaying) {
            videoRef.current.pause()
          } else {
            videoRef.current.play()
          }
          setIsPlaying(!isPlaying)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isPlaying, setIsPlaying])

  return {
    isSkipping,
    handleTimeUpdate,
    handlePlay,
    handlePause,
    handleLoadedMetadata,
  }
}
