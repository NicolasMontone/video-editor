"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Upload, Film, X, Crop } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useVideoStore, type TrimRegion } from "@/store/use-video-store"

export default function VideoUploader() {
  // Local state
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isDraggingTrim, setIsDraggingTrim] = useState<{
    id: string
    edge: "start" | "end"
  } | null>(null)
  const [isSkipping, setIsSkipping] = useState(false)
  const [isDraggingRegion, setIsDraggingRegion] = useState<string | null>(null)
  const [dragStartX, setDragStartX] = useState<number | null>(null)
  const [initialRegionState, setInitialRegionState] = useState<TrimRegion | null>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Zustand store
  const {
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    isPlaying,
    setIsPlaying,
    trimRegions,
    addTrimRegion,
    updateTrimRegion,
    removeTrimRegion,
    zoomLevel,
    activeTool,
    setActiveTool,
    undo,
    redo,
  } = useVideoStore()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Simulate upload progress
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
      // Simulate upload progress
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
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current && !isDraggingTrim && !isDraggingRegion) {
      const newTime = videoRef.current.currentTime
      setCurrentTime(newTime)

      // Check if we need to skip any trimmed regions
      if (isPlaying && !isSkipping) {
        for (const region of trimRegions) {
          // If we just entered a trim region, skip to the end of it
          if (newTime >= region.startTime && newTime < region.endTime) {
            setIsSkipping(true)
            videoRef.current.currentTime = region.endTime

            // Ensure video keeps playing after skip
            setTimeout(() => {
              if (videoRef.current && !videoRef.current.paused) {
                // Sometimes the video pauses after setting currentTime
                videoRef.current
                  .play()
                  .then(() => {
                    setIsSkipping(false)
                  })
                  .catch((error) => {
                    console.error("Error playing video after skip:", error)
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

  // Handle play event to ensure isPlaying state is correct
  const handlePlay = () => {
    setIsPlaying(true)
  }

  // Handle pause event to ensure isPlaying state is correct
  const handlePause = () => {
    // Only update if we're not in the middle of skipping
    if (!isSkipping) {
      setIsPlaying(false)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
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

  // Calculate position on timeline to time
  const positionToTime = (clientX: number) => {
    if (!timelineRef.current) return 0

    const rect = timelineRef.current.getBoundingClientRect()
    const position = (clientX - rect.left) / rect.width
    return Math.max(0, Math.min(position * duration, duration))
  }

  // Handle trim edge drag start
  const handleTrimDragStart = (id: string, edge: "start" | "end") => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const region = trimRegions.find((r) => r.id === id)
    if (region) {
      setInitialRegionState({ ...region })
    }

    setIsDraggingTrim({ id, edge })
  }

  // Handle mouse move for dragging trim handles
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingTrim) {
        const { id, edge } = isDraggingTrim
        const region = trimRegions.find((r) => r.id === id)

        if (region) {
          const newTime = positionToTime(e.clientX)

          if (edge === "start" && newTime < region.endTime) {
            // Update without saving to history during drag
            updateTrimRegion(id, newTime, region.endTime, false)
          } else if (edge === "end" && newTime > region.startTime) {
            // Update without saving to history during drag
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
          // Save to history with initial state on mouse up
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
  }, [isDraggingTrim, trimRegions, updateTrimRegion, setCurrentTime, initialRegionState])

  // Handle trim button click - directly add a trim region without entering trim mode
  const handleTrimClick = () => {
    addTrimRegion(currentTime)
  }

  // Handle zoom button click
  const handleZoomClick = () => {
    if (activeTool === "zoom") {
      setActiveTool(null)
    } else {
      setActiveTool("zoom")
    }
  }

  // Handle region drag start
  const handleRegionDragStart = (region: TrimRegion) => (e: React.MouseEvent<HTMLElement>) => {
    if (e.target instanceof HTMLElement && !e.target.closest(".cursor-ew-resize") && !e.target.closest("button")) {
      e.preventDefault()
      e.stopPropagation()

      setDragStartX(e.clientX)
      setInitialRegionState({ ...region })
      setIsDraggingRegion(region.id)
    }
  }

  // Handle mouse move for dragging entire trim regions
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRegion && dragStartX !== null && initialRegionState) {
        const region = trimRegions.find((r) => r.id === isDraggingRegion)

        if (region && timelineRef.current) {
          const rect = timelineRef.current.getBoundingClientRect()
          const pixelMove = e.clientX - dragStartX
          const timeMove = (pixelMove / rect.width) * duration

          // Calculate new positions based on the initial state plus the movement
          const regionDuration = initialRegionState.endTime - initialRegionState.startTime
          let newStartTime = initialRegionState.startTime + timeMove
          let newEndTime = initialRegionState.endTime + timeMove

          // Ensure we don't go out of bounds
          if (newStartTime < 0) {
            newStartTime = 0
            newEndTime = regionDuration
          } else if (newEndTime > duration) {
            newEndTime = duration
            newStartTime = duration - regionDuration
          }

          // Update without saving to history during drag
          updateTrimRegion(isDraggingRegion, newStartTime, newEndTime, false)
        }
      }
    }

    const handleMouseUp = () => {
      if (isDraggingRegion && initialRegionState) {
        const region = trimRegions.find((r) => r.id === isDraggingRegion)

        if (region) {
          // Save to history with initial state on mouse up
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

  // Handle spacebar for play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle spacebar if we have a video loaded and not typing in an input
      if (
        e.code === "Space" &&
        videoSrc &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault() // Prevent page scrolling
        togglePlay()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [videoSrc, isPlaying])

  return (
    <div className="space-y-6" ref={containerRef}>
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-lg">
          {!videoSrc ? (
            <div
              className={`mx-auto aspect-video w-full bg-white flex flex-col items-center justify-center border-2 ${
                isDraggingOver ? "border-[#0096FF]" : "border-dashed border-[#0096FF]/50"
              } rounded-lg transition-all duration-200`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="mb-4 p-4 rounded-full bg-[#E5EFFF] text-[#0096FF]">
                  <Film className="h-12 w-12" />
                </div>
                <h2 className="mb-2 text-xl font-semibold text-gray-800">Start Editing!</h2>
                <p className="mb-6 text-center text-sm text-gray-600 max-w-md">
                  Upload a video to start trimming, zooming, and editing. Drag and drop your file here or use the button
                  below.
                </p>
                <Button
                  className="bg-[#0096FF] hover:bg-[#0078CC] text-white flex items-center gap-2 px-6 py-5"
                  onClick={triggerFileInput}
                  size="lg"
                >
                  <Upload className="h-5 w-5" />
                  <span>Select Video File</span>
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" className="hidden" />
                <p className="mt-4 text-xs text-gray-300">Supported formats: MP4, MOV, AVI, WebM (max 500MB)</p>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              src={videoSrc || ""}
              className="mx-auto block aspect-video w-full bg-black"
              style={{ transform: `scale(${zoomLevel / 100})` }}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onClick={togglePlay}
              onPlay={handlePlay}
              onPause={handlePause}
            />
          )}
          {videoSrc && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <div className="flex items-center justify-between text-white">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-white hover:bg-white/20"
                  onClick={togglePlay}
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
                    onValueChange={handleSeek}
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
            {/* TODO, add zoom tool
            <Button
              variant={activeTool === 'zoom' ? 'default' : 'outline'}
              size='sm'
              className='gap-1 h-9'
              onClick={handleZoomClick}
              disabled={!videoSrc}
            >
              Zoom
            </Button> */}
            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1 h-9 bg-transparent"
                onClick={undo}
                disabled={!videoSrc}
              >
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
              <Button
                variant="outline"
                size="sm"
                className="gap-1 h-9 bg-transparent"
                onClick={redo}
                disabled={!videoSrc}
              >
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
              className={`h-16 bg-gray-100 rounded relative ${videoSrc ? "cursor-pointer" : "opacity-50"}`}
              ref={timelineRef}
              onClick={(e) => {
                if (videoRef.current && videoSrc) {
                  const rect = timelineRef.current?.getBoundingClientRect()
                  if (rect) {
                    const clickPosition = (e.clientX - rect.left) / rect.width
                    const newTime = clickPosition * duration

                    // Check if click is within any trim region
                    const isInTrimRegion = trimRegions.some(
                      (region) => newTime >= region.startTime && newTime <= region.endTime,
                    )

                    // Only update time if not clicking in a trim region
                    if (!isInTrimRegion && !isDraggingTrim && !isDraggingRegion) {
                      videoRef.current.currentTime = newTime
                      setCurrentTime(newTime)
                    }
                  }
                }
              }}
            >
              {/* Timeline ruler */}
              <div className="absolute inset-0 flex">
                {Array.from({ length: 17 }).map((_, i) => (
                  <div key={i} className="flex-1 border-l border-gray-300 h-full first:border-l-0">
                    {i % 2 === 0 && (
                      <div
                        className="h-2 border-l border-gray-400 absolute"
                        style={{ left: `${(i / 16) * 100}%` }}
                      ></div>
                    )}
                  </div>
                ))}
              </div>

              {/* Current time indicator */}
              {videoSrc && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-[#0096FF] z-10 cursor-ew-resize"
                  style={{ left: `${(currentTime / duration) * 100}%` }}
                />
              )}

              {/* Trim regions */}
              {videoSrc &&
                trimRegions.map((region) => (
                  <div
                    key={region.id}
                    className="absolute top-0 bottom-0 z-20 cursor-move group"
                    style={{
                      left: `${(region.startTime / duration) * 100}%`,
                      width: `${((region.endTime - region.startTime) / duration) * 100}%`,
                      backgroundColor: "#E5EFFF",
                      border: "1px solid #0096FF",
                    }}
                    onMouseDown={handleRegionDragStart(region)}
                    onMouseEnter={() => setHoveredRegion(region.id)}
                    onMouseLeave={() => setHoveredRegion(null)}
                  >
                    {/* Trim start handle */}
                    <div
                      className="absolute top-0 bottom-0 w-1 cursor-ew-resize flex items-center justify-center left-0"
                      style={{ backgroundColor: "#0096FF" }}
                      onMouseDown={handleTrimDragStart(region.id, "start")}
                    >
                      <div
                        className="absolute -left-1 -right-1 top-1/2 -translate-y-1/2 h-6 rounded flex items-center justify-center"
                        style={{ backgroundColor: "#0096FF" }}
                      >
                        <span className="text-white text-xs">◀</span>
                      </div>
                    </div>

                    {/* Trim end handle */}
                    <div
                      className="absolute top-0 bottom-0 w-1 cursor-ew-resize flex items-center justify-center right-0"
                      style={{ backgroundColor: "#0096FF" }}
                      onMouseDown={handleTrimDragStart(region.id, "end")}
                    >
                      <div
                        className="absolute -left-1 -right-1 top-1/2 -translate-y-1/2 h-6 rounded flex items-center justify-center"
                        style={{ backgroundColor: "#0096FF" }}
                      >
                        <span className="text-white text-xs">▶</span>
                      </div>
                    </div>

                    {/* Delete button - only visible on hover */}
                    <div
                      className={`absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-200 ${
                        hoveredRegion === region.id ? "opacity-100" : ""
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
                ))}

              {/* Zoom region
              {videoSrc && zoomLevel > 100 && (
                <div
                  className='absolute h-12 bottom-0 bg-green-200 border border-green-400 rounded-md flex items-center justify-center'
                  style={{
                    left: `${40}%`,
                    width: `${15}%`
                  }}
                >
                  <div className='text-xs text-green-700 font-medium'>
                    Zoom {zoomLevel}%
                  </div>
                </div>
              )}
              */}
            </div>
          </div>

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
