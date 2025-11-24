"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { trimAndExportVideo, trimMultipleRegions } from "@/lib/ffmpeg-utils"
import type { TrimRegion } from "@/store/use-video-store"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  videoFile: File | null
  trimRegions: TrimRegion[]
  duration: number
}

export function ExportDialog({ open, onOpenChange, videoFile, trimRegions, duration }: ExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleExport = async () => {
    if (!videoFile) return

    try {
      setIsExporting(true)
      setProgress(0)

      let blob: Blob

      if (trimRegions.length === 0) {
        // Export full video
        blob = videoFile
      } else if (trimRegions.length === 1) {
        // Export single trimmed region
        setProgress(50)
        const region = trimRegions[0]
        blob = await trimAndExportVideo(videoFile, region.startTime, region.endTime)
      } else {
        // Export multiple trimmed regions
        setProgress(50)
        const regions = trimRegions.sort((a, b) => a.startTime - b.startTime)
        blob = await trimMultipleRegions(videoFile, regions)
      }

      setProgress(100)

      // Download the file
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `edited-video-${Date.now()}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      onOpenChange(false)
      setProgress(0)
    } catch (error) {
      console.error("Export failed:", error)
      alert("Failed to export video. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const hasTrimRegions = trimRegions.length > 0
  const totalTrimmedTime = trimRegions.reduce((acc, region) => acc + (region.endTime - region.startTime), 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Video</DialogTitle>
          <DialogDescription>
            {hasTrimRegions
              ? `Export ${trimRegions.length} trimmed segment${trimRegions.length > 1 ? "s" : ""}`
              : "Export the full video"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Original duration:</span>
              <span className="font-medium">{formatTime(duration)}</span>
            </div>
            {hasTrimRegions && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Segments to export:</span>
                  <span className="font-medium">{trimRegions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total trimmed duration:</span>
                  <span className="font-medium">{formatTime(totalTrimmedTime)}</span>
                </div>
              </>
            )}
          </div>

          {isExporting && (
            <div className="space-y-2">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-gray-500 text-center">{progress < 50 ? "Preparing..." : "Encoding..."}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting || !videoFile} className="gap-2">
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export Video
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function formatTime(time: number) {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}
