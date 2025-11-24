import type { TrimRegion } from "@/store/use-video-store"

type ExportOptions = {
  videoBlob: Blob
  trimRegions: TrimRegion[]
  videoDuration: number
  onProgress?: (progress: number) => void
}

export async function exportVideoWithTrim(
  ffmpeg: any,
  { videoBlob, trimRegions, videoDuration, onProgress }: ExportOptions,
): Promise<Blob> {
  try {
    // Convert blob to array buffer
    const arrayBuffer = await videoBlob.arrayBuffer()

    // Write input video file
    console.log("[v0] Writing input video to FFmpeg filesystem")
    await ffmpeg.writeFile("input.mp4", new Uint8Array(arrayBuffer))

    if (trimRegions.length === 0) {
      // If no trim regions, just copy the original video
      console.log("[v0] No trim regions, copying original video")
      await ffmpeg.exec(["-i", "input.mp4", "-c", "copy", "output.mp4"])
    } else {
      // Sort trim regions by start time
      const sortedRegions = [...trimRegions].sort((a, b) => a.startTime - b.startTime)

      // Build filter complex string to keep only non-trimmed portions
      const filterParts: string[] = []
      let timelinePosition = 0

      for (const region of sortedRegions) {
        if (region.startTime > timelinePosition) {
          // Keep the portion before the trim region
          filterParts.push(`[0:v]trim=start=${timelinePosition}:end=${region.startTime}[v${filterParts.length}]`)
          filterParts.push(`[0:a]atrim=start=${timelinePosition}:end=${region.startTime}[a${filterParts.length}]`)
        }

        timelinePosition = region.endTime
      }

      // Keep the portion after the last trim region
      if (timelinePosition < videoDuration) {
        filterParts.push(`[0:v]trim=start=${timelinePosition}:end=${videoDuration}[v${filterParts.length}]`)
        filterParts.push(`[0:a]atrim=start=${timelinePosition}:end=${videoDuration}[a${filterParts.length}]`)
      }

      // If we have filter parts, concatenate them
      if (filterParts.length > 0) {
        const filterComplex = buildFilterComplex(filterParts)
        console.log("[v0] Applying trim filter:", filterComplex)

        await ffmpeg.exec([
          "-i",
          "input.mp4",
          "-filter_complex",
          filterComplex,
          "-preset",
          "ultrafast",
          "-c:a",
          "aac",
          "output.mp4",
        ])
      } else {
        // Everything is trimmed, create a black frame video
        await ffmpeg.exec(["-i", "input.mp4", "-c", "copy", "output.mp4"])
      }
    }

    onProgress?.(90)

    // Read output file
    console.log("[v0] Reading output video from FFmpeg")
    const data = await ffmpeg.readFile("output.mp4")

    // Clean up
    await ffmpeg.deleteFile("input.mp4")
    await ffmpeg.deleteFile("output.mp4")

    onProgress?.(100)

    // Convert to blob
    const outputBlob = new Blob([data.buffer], { type: "video/mp4" })
    return outputBlob
  } catch (error) {
    console.error("[v0] FFmpeg export error:", error)
    throw error
  }
}

function buildFilterComplex(filterParts: string[]): string {
  if (filterParts.length === 0) return ""

  // Separate video and audio filters
  const videoFilters = filterParts.filter((f) => f.includes("[v"))
  const audioFilters = filterParts.filter((f) => f.includes("[a"))

  // Extract the output labels
  const videoLabels = videoFilters
    .map((f) => f.match(/\[v\d+\]/g)?.[videoFilters.indexOf(f)]?.replace(/[[\]]/g, ""))
    .filter(Boolean)

  const audioLabels = audioFilters
    .map((f) => f.match(/\[a\d+\]/g)?.[audioFilters.indexOf(f)]?.replace(/[[\]]/g, ""))
    .filter(Boolean)

  // Build concatenate filter
  const allFilters = [...videoFilters, ...audioFilters]
  const concatInput = [...(videoLabels as string[]), ...(audioLabels as string[])].map((label) => `[${label}]`).join("")

  const concatFilter = `${concatInput}concat=n=${videoLabels?.length}:v=1:a=1[outv][outa]`

  return `${allFilters.join(";")};${concatFilter}`
}

export async function exportVideoSimple(
  ffmpeg: any,
  videoBlob: Blob,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  try {
    console.log("[v0] Starting simple video export")
    const arrayBuffer = await videoBlob.arrayBuffer()

    await ffmpeg.writeFile("input.mp4", new Uint8Array(arrayBuffer))
    onProgress?.(50)

    // Re-encode for optimization
    await ffmpeg.exec(["-i", "input.mp4", "-preset", "ultrafast", "-c:v", "libx264", "-c:a", "aac", "output.mp4"])

    onProgress?.(90)

    const data = await ffmpeg.readFile("output.mp4")
    await ffmpeg.deleteFile("input.mp4")
    await ffmpeg.deleteFile("output.mp4")

    onProgress?.(100)

    return new Blob([data.buffer], { type: "video/mp4" })
  } catch (error) {
    console.error("[v0] FFmpeg export error:", error)
    throw error
  }
}
