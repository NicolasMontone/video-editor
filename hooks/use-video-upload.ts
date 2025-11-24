"use client"

import type React from "react"

import { useState, useRef } from "react"

export interface UseVideoUploadReturn {
  videoSrc: string | null
  videoFile: File | null
  uploadProgress: number
  isUploading: boolean
  isDraggingOver: boolean
  fileInputRef: React.RefObject<HTMLInputElement>
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleDrop: (e: React.DragEvent) => void
  handleDragOver: (e: React.DragEvent) => void
  handleDragLeave: (e: React.DragEvent) => void
  triggerFileInput: () => void
}

export function useVideoUpload(): UseVideoUploadReturn {
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const simulateUploadProgress = () => {
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
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setVideoFile(file)
      simulateUploadProgress()
      const url = URL.createObjectURL(file)
      setVideoSrc(url)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file)
      simulateUploadProgress()
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

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return {
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
  }
}
