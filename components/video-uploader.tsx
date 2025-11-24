"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { Crop, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useVideoStore } from "@/store/use-video-store"
import { ExportDialog } from "./export-dialog"
import { useVideoUpload } from "@/hooks/use-video-upload"
import { useVideoPlayback } from "@/hooks/use-video-playback"
import { useTimelineDrag } from "@/hooks/use-timeline-drag"
import { VideoPlayer } from "./video-player"
import { UploadArea } from "./upload-area"
import { Timeline } from "./timeline"

export default function VideoUploader() {
  const {
    videoSrc,
    videoFile,
    uploadProgress,
    isUploading,
    isDraggingOver,
    fileInputRef,
    handleFileChange,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    triggerFileInput,
  } = useVideoUpload()

  const videoRef = useRef<HTMLVideoElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    isPlaying,
    setIsPlaying,
    trimRegions,
    addTrimRegion,
    removeTrimRegion,
  } = useVideoStore()

  const { togglePlay, handleTimeUpdate, handlePlay, handlePause } = useVideoPlayback(videoSrc)

  useEffect(() => {
    if (videoRef.current && togglePlay) {
      // Sync the hook's internal videoRef to our ref
    }
  }, [videoSrc])

  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [isDraggingRegion, setIsDraggingRegion] = useState<string | null>(null)

  const { isDraggingTrim, hoveredRegion, setHoveredRegion, handleTrimDragStart, handleRegionDragStart } =
    useTimelineDrag(timelineRef, isDraggingRegion, duration)

  const handleSeek = useCallback(
    (value: number[]) => {
      if (videoRef.current) {
        videoRef.current.currentTime = value[0]
        setCurrentTime(value[0])
      }
    },
    [setCurrentTime],
  )

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }, [setDuration])

  const handleTrimClick = useCallback(() => {
    addTrimRegion(currentTime)
  }, [currentTime, addTrimRegion])

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (videoRef.current && videoSrc && timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect()
        const clickPosition = (e.clientX - rect.left) / rect.width
        const newTime = clickPosition * duration

        const isInTrimRegion = trimRegions.some((region) => newTime >= region.startTime && newTime <= region.endTime)

        if (!isInTrimRegion && !isDraggingTrim && !isDraggingRegion) {
          videoRef.current.currentTime = newTime
          setCurrentTime(newTime)
        }
      }
    },
    [videoSrc, duration, trimRegions, isDraggingTrim, isDraggingRegion, setCurrentTime],
  )

  return (
    <div className="space-y-6" ref={containerRef}>
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-lg">
          {!videoSrc ? (
            <UploadArea
              isDraggingOver={isDraggingOver}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onUploadClick={triggerFileInput}
            />
          ) : (
            <VideoPlayer
              videoRef={videoRef}
              videoSrc={videoSrc}
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              zoomLevel={100}
              onPlayPauseClick={togglePlay}
              onSeek={handleSeek}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={handlePlay}
              onPause={handlePause}
            />
          )}
        </div>

        <div className={`space-y-4 ${!videoSrc ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="flex items-center gap-2 border-b pb-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 h-9 bg-transparent"
              onClick={handleTrimClick}
              disabled={!videoSrc}
            >
              <Crop className="size-4" /> Trim
            </Button>
          </div>

          <Timeline
            timelineRef={timelineRef}
            duration={duration}
            currentTime={currentTime}
            trimRegions={trimRegions}
            hoveredRegion={hoveredRegion}
            isDraggingTrim={isDraggingTrim}
            isDraggingRegion={isDraggingRegion}
            onTimelineClick={handleTimelineClick}
            onRegionMouseEnter={setHoveredRegion}
            onRegionMouseLeave={() => setHoveredRegion(null)}
            onRegionMouseDown={(region) => {
              return (e) => {
                handleRegionDragStart(region)(e)
                setIsDraggingRegion(region.id)
              }
            }}
            onTrimDragStart={handleTrimDragStart}
            onRegionDelete={removeTrimRegion}
          />
        </div>

        {videoSrc && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {trimRegions.length} trim region{trimRegions.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-gray-500">
                    {trimRegions.length > 0
                      ? `Ready to export ${trimRegions.length} segment${trimRegions.length > 1 ? "s" : ""}`
                      : "Add trim regions or export the full video"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={triggerFileInput}>
                    Upload New Video
                  </Button>
                  <Button onClick={() => setExportDialogOpen(true)} className="gap-2 bg-[#0096FF] hover:bg-[#0078CC]">
                    <Download className="h-4 w-4" />
                    Export Video
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" className="hidden" />

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        videoFile={videoFile}
        trimRegions={trimRegions}
        duration={duration}
      />

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
