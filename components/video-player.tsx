"use client"

import type React from "react"

import { Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface VideoPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement>
  videoSrc: string | null
  currentTime: number
  duration: number
  isPlaying: boolean
  zoomLevel: number
  onPlayPauseClick: () => void
  onSeek: (value: number[]) => void
  onTimeUpdate: () => void
  onLoadedMetadata?: () => void
  onPlay: () => void
  onPause: () => void
}

function formatTime(time: number) {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}

export function VideoPlayer({
  videoRef,
  videoSrc,
  currentTime,
  duration,
  isPlaying,
  zoomLevel,
  onPlayPauseClick,
  onSeek,
  onTimeUpdate,
  onLoadedMetadata,
  onPlay,
  onPause,
}: VideoPlayerProps) {
  return (
    <div className="relative overflow-hidden rounded-lg">
      {videoSrc && (
        <video
          ref={videoRef}
          src={videoSrc}
          className="mx-auto block aspect-video w-full bg-black"
          style={{ transform: `scale(${zoomLevel / 100})` }}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          onClick={onPlayPauseClick}
          onPlay={onPlay}
          onPause={onPause}
        />
      )}
      {videoSrc && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="flex items-center justify-between text-white">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-white hover:bg-white/20"
              onClick={onPlayPauseClick}
              disabled={!videoSrc}
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
            <div className="flex-1 px-4">
              <Slider
                value={[currentTime]}
                min={0}
                max={duration || 100}
                step={0.01}
                onValueChange={onSeek}
                className={`[&>span:first-child]:h-1.5 ${!videoSrc ? "opacity-50 pointer-events-none" : ""}`}
                disabled={!videoSrc}
              />
            </div>
            <span className="text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
