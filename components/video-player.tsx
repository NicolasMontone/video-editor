"use client"

import type React from "react"

import { Play, Pause, Film, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface VideoPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement>
  videoSrc: string | null
  isPlaying: boolean
  currentTime: number
  duration: number
  zoomLevel: number
  onPlay: () => void
  onPause: () => void
  onSeek: (value: number[]) => void
  onUploadClick: () => void
  isDraggingOver: boolean
  onDrop: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onVideoClick: () => void
  onTimeUpdate: () => void
  onLoadedMetadata: () => void
  uploadProgress: number
  isUploading: boolean
}

export function VideoPlayer({
  videoRef,
  videoSrc,
  isPlaying,
  currentTime,
  duration,
  zoomLevel,
  onPlay,
  onPause,
  onSeek,
  onUploadClick,
  isDraggingOver,
  onDrop,
  onDragOver,
  onDragLeave,
  onVideoClick,
  onTimeUpdate,
  onLoadedMetadata,
  uploadProgress,
  isUploading,
}: VideoPlayerProps) {
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      {!videoSrc ? (
        <div
          className={`mx-auto aspect-video w-full bg-white flex flex-col items-center justify-center border-2 ${
            isDraggingOver ? "border-[#0096FF]" : "border-dashed border-[#0096FF]/50"
          } rounded-lg transition-all duration-200`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
        >
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 p-4 rounded-full bg-[#E5EFFF] text-[#0096FF]">
              <Film className="h-12 w-12" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-gray-800">Ready to edit your video?</h2>
            <p className="mb-6 text-center text-sm text-gray-600 max-w-md">
              Upload a video to start trimming, zooming, and editing. Drag and drop your file here or use the button
              below.
            </p>
            <Button
              className="bg-[#0096FF] hover:bg-[#0078CC] text-white flex items-center gap-2 px-6 py-5"
              onClick={onUploadClick}
              size="lg"
            >
              <Upload className="h-5 w-5" />
              <span>Select Video File</span>
            </Button>
            <p className="mt-4 text-xs text-gray-300">Supported formats: MP4, MOV, AVI, WebM (max 500MB)</p>
          </div>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            src={videoSrc || ""}
            className="mx-auto block aspect-video w-full bg-black"
            style={{ transform: `scale(${zoomLevel / 100})` }}
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
            onClick={onVideoClick}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <div className="flex items-center justify-between text-white">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-white hover:bg-white/20"
                onClick={() => (isPlaying ? onPause() : onPlay())}
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
        </>
      )}
    </div>
  )
}
