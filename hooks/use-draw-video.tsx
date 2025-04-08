import { useEffect, type RefObject } from 'react'

export const useDrawVideo = (
  videoRef: RefObject<HTMLVideoElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  isPlaying: boolean
) => {
  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number

    const renderFrame = () => {
      if (!video.paused && !video.ended) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        animationFrameId = requestAnimationFrame(renderFrame)
      }
    }

    if (isPlaying) {
      renderFrame()
    }

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [isPlaying])
}
