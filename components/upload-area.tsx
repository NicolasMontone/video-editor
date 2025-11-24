"use client"

import type React from "react"

import { Film, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UploadAreaProps {
  isDraggingOver: boolean
  onDrop: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onUploadClick: () => void
}

export function UploadArea({ isDraggingOver, onDrop, onDragOver, onDragLeave, onUploadClick }: UploadAreaProps) {
  return (
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
          Upload a video to start trimming, zooming, and editing. Drag and drop your file here or use the button below.
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
  )
}
