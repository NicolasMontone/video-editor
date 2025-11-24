"use client"

import { useRef, useEffect } from "react"
import { useVideoStore } from "@/store/use-video-store"

export function useVideoPlayback(videoSrc: string | null) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { currentTime, setCurrentTime, isPlaying, setIsPlaying, trimRegions } = useVideoStore()
  const isSkippingRef = useRef(false)

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const newTime = videoRef.current.currentTime
      setCurrentTime(newTime)

      // Check if we need to skip any trimmed regions
      if (isPlaying && !isSkippingRef.current) {
        for (const region of trimRegions) {
          if (newTime >= region.startTime && newTime < region.endTime) {
            isSkippingRef.current = true
            videoRef.current.currentTime = region.endTime

            setTimeout(() => {
              if (videoRef.current && !videoRef.current.paused) {
                videoRef.current
                  .play()
                  .then(() => {
                    isSkippingRef.current = false
                  })
                  .catch((error) => {
                    console.error("Error playing video after skip:", error)
                    isSkippingRef.current = false
                  })
              } else {
                isSkippingRef.current = false
              }
            }, 50)

            break
          }
        }
      }
    }
  }

  const handlePlay = () => {
    setIsPlaying(true)
  }

  const handlePause = () => {
    if (!isSkippingRef.current) {
      setIsPlaying(false)
    }
  }

  // Handle spacebar for play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        videoSrc &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault()
        togglePlay()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [videoSrc, isPlaying])

  return {
    videoRef,
    togglePlay,
    handleTimeUpdate,
    handlePlay,
    handlePause,
  }
}
