"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { FFmpeg } from "@ffmpeg/ffmpeg"
import { toBlobURL } from "@ffmpeg/util"

export const useFFmpeg = () => {
  const ffmpegRef = useRef(new FFmpeg())
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize FFmpeg on mount
  useEffect(() => {
    const initFFmpeg = async () => {
      if (ffmpegRef.current.loaded) {
        setIsLoaded(true)
        return
      }

      try {
        setIsLoading(true)
        const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd"

        await ffmpegRef.current.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        })

        setIsLoaded(true)
        setError(null)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load FFmpeg"
        setError(errorMessage)
        console.error("[v0] FFmpeg initialization error:", err)
      } finally {
        setIsLoading(false)
      }
    }

    initFFmpeg()
  }, [])

  const executeFFmpeg = useCallback(async (args: string[]) => {
    if (!ffmpegRef.current.loaded) {
      throw new Error("FFmpeg not loaded")
    }
    return await ffmpegRef.current.exec(args)
  }, [])

  const writeFile = useCallback(async (name: string, data: Uint8Array | ArrayBuffer) => {
    if (!ffmpegRef.current.loaded) {
      throw new Error("FFmpeg not loaded")
    }
    await ffmpegRef.current.writeFile(name, data)
  }, [])

  const readFile = useCallback(async (name: string) => {
    if (!ffmpegRef.current.loaded) {
      throw new Error("FFmpeg not loaded")
    }
    return await ffmpegRef.current.readFile(name)
  }, [])

  const deleteFile = useCallback(async (name: string) => {
    if (!ffmpegRef.current.loaded) {
      throw new Error("FFmpeg not loaded")
    }
    await ffmpegRef.current.deleteFile(name)
  }, [])

  return {
    ffmpeg: ffmpegRef.current,
    isLoaded,
    isLoading,
    error,
    executeFFmpeg,
    writeFile,
    readFile,
    deleteFile,
  }
}
