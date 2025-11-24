"use client"

import { useState } from "react"
import { Download, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useFFmpeg } from "@/hooks/use-ffmpeg"
import { exportVideoWithTrim } from "@/lib/ffmpeg-service"
import { useVideoStore } from "@/store/use-video-store"

interface ExportDialogProps {
  videoBlob: Blob | null
  videoSrc: string | null
}

export function ExportDialog({ videoBlob, videoSrc }: ExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const { ffmpeg, isLoaded, isLoading, error: ffmpegError } = useFFmpeg()
  const { trimRegions, duration, isExporting, exportProgress, setIsExporting, setExportProgress } = useVideoStore()

  const handleExport = async () => {
    if (!videoBlob) {
      setExportError("No video loaded")
      return
    }

    if (!ffmpeg.loaded) {
      setExportError("FFmpeg is not ready. Please try again.")
      return
    }

    try {
      setExportError(null)
      setIsExporting(true)
      setExportProgress(10)

      console.log("[v0] Starting video export with", trimRegions.length, "trim regions")

      const exportedBlob = await exportVideoWithTrim(ffmpeg, {
        videoBlob,
        trimRegions,
        videoDuration: duration,
        onProgress: (progress) => setExportProgress(progress),
      })

      // Create download link
      const url = URL.createObjectURL(exportedBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = `video-export-${Date.now()}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      console.log("[v0] Video export completed successfully")
      setIsExporting(false)
      setExportProgress(0)
      setIsOpen(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Export failed"
      setExportError(errorMessage)
      console.error("[v0] Export error:", err)
      setIsExporting(false)
    }
  }

  const isFFmpegReady = isLoaded && !isLoading && !ffmpegError
  const canExport = videoSrc && isFFmpegReady && !isExporting

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 h-9" disabled={!videoSrc}>
          <Download className="size-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Video</DialogTitle>
          <DialogDescription>
            {trimRegions.length > 0
              ? `Your video will be exported with ${trimRegions.length} trim region${trimRegions.length !== 1 ? "s" : ""} applied.`
              : "Your video will be exported without any modifications."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {ffmpegError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>FFmpeg initialization failed: {ffmpegError}</AlertDescription>
            </Alert>
          )}

          {exportError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{exportError}</AlertDescription>
            </Alert>
          )}

          {isLoading && !isExporting && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Loading FFmpeg... This may take a moment on first use.</AlertDescription>
            </Alert>
          )}

          {isExporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Exporting...</span>
                <span>{Math.round(exportProgress)}%</span>
              </div>
              <Progress value={exportProgress} className="h-2" />
            </div>
          )}

          {trimRegions.length > 0 && (
            <div className="space-y-2 bg-gray-50 rounded p-3">
              <p className="text-sm font-medium">Trim Regions:</p>
              <div className="space-y-1">
                {trimRegions.map((region, index) => (
                  <div key={region.id} className="text-xs text-gray-600">
                    Trim {index + 1}: {formatTime(region.startTime)} - {formatTime(region.endTime)}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleExport} disabled={!canExport} className="flex-1">
              Export Video
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isExporting}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function formatTime(time: number): string {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}
