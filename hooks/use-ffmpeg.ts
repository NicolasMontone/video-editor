"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { FFmpeg } from "@ffmpeg/ffmpeg"
import { toBlobURL } from "@ffmpeg/util"

export const useFFmpeg = () => {
  const [ffmpegInstance, setFFmpegInstance] = useState<FFmpeg | null>(null)
  const isInitializing = useRef(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize FFmpeg on mount
  useEffect(() => {
    if (isInitializing.current || isLoaded || ffmpegInstance) return

    const initFFmpeg = async () => {
      if (isInitializing.current) return
      isInitializing.current = true

      try {
        setIsLoading(true)
        const ffmpeg = new FFmpeg()

        const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd"

        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        })

        setFFmpegInstance(ffmpeg)
        setIsLoaded(true)
        setError(null)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load FFmpeg"
        setError(errorMessage)
        console.error("[v0] FFmpeg initialization error:", err)
      } finally {
        setIsLoading(false)
        isInitializing.current = false
      }
    }

    initFFmpeg()
  }, [isLoaded, ffmpegInstance])

  const executeFFmpeg = useCallback(
    async (args: string[]) => {
      if (!ffmpegInstance?.loaded) {
        throw new Error("FFmpeg not loaded")
      }
      return await ffmpegInstance.exec(args)
    },
    [ffmpegInstance],
  )

  const writeFile = useCallback(
    async (name: string, data: Uint8Array | ArrayBuffer) => {
      if (!ffmpegInstance?.loaded) {
        throw new Error("FFmpeg not loaded")
      }
      await ffmpegInstance.writeFile(name, data)
    },
    [ffmpegInstance],
  )

  const readFile = useCallback(
    async (name: string) => {
      if (!ffmpegInstance?.loaded) {
        throw new Error("FFmpeg not loaded")
      }
      return await ffmpegInstance.readFile(name)
    },
    [ffmpegInstance],
  )

  const deleteFile = useCallback(
    async (name: string) => {
      if (!ffmpegInstance?.loaded) {
        throw new Error("FFmpeg not loaded")
      }
      await ffmpegInstance.deleteFile(name)
    },
    [ffmpegInstance],
  )

  return {
    ffmpeg: ffmpegInstance,
    isLoaded,
    isLoading,
    error,
    executeFFmpeg,
    writeFile,
    readFile,
    deleteFile,
  }
}
