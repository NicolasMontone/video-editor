"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Crop } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useVideoStore } from "@/store/use-video-store"
import { ExportDialog } from "@/components/export-dialog"
import { VideoPlayer } from "@/components/video-player"
import { Timeline } from "@/components/timeline"
import { usePlayback } from "@/hooks/use-playback"
import { useTrimDragging } from "@/hooks/use-trim-dragging"

export default function VideoUploader() {
  // Local state
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Zustand store
  const { currentTime, setCurrentTime, duration, isPlaying, setIsPlaying, trimRegions, addTrimRegion, zoomLevel } =
    useVideoStore()

  // Custom hooks
  const { handleTimeUpdate, handlePlay, handlePause, handleLoadedMetadata } = usePlayback(videoRef, trimRegions, false)

  const { isDraggingTrim, isDraggingRegion, isDragging, handleTrimDragStart, handleRegionDragStart, positionToTime } =
    useTrimDragging(timelineRef, duration)

  // File handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setVideoBlob(file)
      setIsUploading(true)
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            setIsUploading(false)
            return 100
          }
          return prev + 10
        })
      }, 300)

      const url = URL.createObjectURL(file)
      setVideoSrc(url)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("video/")) {
      setVideoBlob(file)
      setIsUploading(true)
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            setIsUploading(false)
            return 100
          }
          return prev + 10
        })
      }, 300)

      const url = URL.createObjectURL(file)
      setVideoSrc(url)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
        handlePause()
      } else {
        videoRef.current.play()
        handlePlay()
      }
    }
  }

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleTrimClick = () => {
    addTrimRegion(currentTime)
  }

  const handleTimelineClick = (newTime: number) => {
    if (!isDragging) {
      const isInTrimRegion = trimRegions.some((region) => newTime >= region.startTime && newTime <= region.endTime)
      if (!isInTrimRegion && videoRef.current) {
        videoRef.current.currentTime = newTime
        setCurrentTime(newTime)
      }
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6" ref={containerRef}>
      <div className="space-y-4">
        <VideoPlayer
          videoRef={videoRef}
          videoSrc={videoSrc}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          zoomLevel={zoomLevel}
          onPlay={handlePlay}
          onPause={handlePause}
          onSeek={handleSeek}
          onUploadClick={triggerFileInput}
          isDraggingOver={isDraggingOver}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onVideoClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          uploadProgress={uploadProgress}
          isUploading={isUploading}
        />

        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" className="hidden" />

        <div className={`space-y-4 ${!videoSrc ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="flex items-center gap-2 border-b pb-2">
            <Button variant="outline" size="sm" className="gap-1 h-9" onClick={handleTrimClick} disabled={!videoSrc}>
              <Crop className="size-4" /> Trim
            </Button>
            <ExportDialog videoBlob={videoBlob} videoSrc={videoSrc} />
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" className="gap-1 h-9" onClick={() => {}} disabled={!videoSrc}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-undo-2"
                >
                  <path d="M9 14 4 9l5-5" />
                  <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
                </svg>
              </Button>
              <Button variant="outline" size="sm" className="gap-1 h-9" onClick={() => {}} disabled={!videoSrc}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-redo-2"
                >
                  <path d="m15 14 5-5-5-5" />
                  <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13" />
                </svg>
              </Button>
            </div>
          </div>

          <Timeline
            duration={duration}
            currentTime={currentTime}
            trimRegions={trimRegions}
            videoSrc={videoSrc}
            isDragging={isDragging}
            hoveredRegion={hoveredRegion}
            onTimlineClick={handleTimelineClick}
            onTrimDragStart={handleTrimDragStart}
            onRegionDragStart={handleRegionDragStart}
            onHover={setHoveredRegion}
            timelineRef={timelineRef}
          />

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {videoSrc ? (
                trimRegions.length > 0 ? (
                  <span>
                    <span className="font-medium">Trim regions: </span>
                    {trimRegions.map((region, index) => (
                      <span key={region.id} className="mr-2">
                        {index + 1}: {formatTime(region.startTime)} - {formatTime(region.endTime)}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span>No trim regions selected</span>
                )
              ) : (
                <span>Upload a video to start editing</span>
              )}
              {videoSrc && zoomLevel > 100 && <span className="ml-2">| Zoom: {zoomLevel}%</span>}
            </div>

            <div className="flex gap-2">
              {videoSrc ? (
                <>
                  <Button variant="outline" onClick={triggerFileInput}>
                    Upload New Video
                  </Button>
                  <Button>Save Changes</Button>
                </>
              ) : (
                <Button onClick={triggerFileInput}>Upload Video</Button>
              )}
            </div>
          </div>

          {videoSrc && (
            <div className="text-center text-xs text-gray-500 mt-2">
              Press <kbd className="px-2 py-1 bg-gray-100 border rounded">Space</kbd> to play/pause
            </div>
          )}
        </div>
      </div>

      {isUploading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 !mt-0">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <h2 className="mb-4 text-xl font-semibold">Uploading video...</h2>
              <Progress value={uploadProgress} className="mb-2 w-full [&>div]:bg-[#0096FF]" />
              <p className="text-sm text-gray-500">{uploadProgress}% complete</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
