import { useEffect, useState, type RefObject } from 'react'

export const useSyncCanvasSize = (
  videoRef: RefObject<HTMLVideoElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>
) => {
  const [videoWidth, setVideoWidth] = useState(0)
  const [videoHeight, setVideoHeight] = useState(0)

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (video && canvas) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
    }
  }, [videoRef, canvasRef])

  return { videoWidth, videoHeight }
}
