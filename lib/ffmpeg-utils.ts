import { type FFmpeg, toBlobURL } from "@ffmpeg/ffmpeg"

let ffmpegInstance: FFmpeg | null = null

export async function initFFmpeg() {
  if (ffmpegInstance) return ffmpegInstance

  const FFmpegModule = require("@ffmpeg/ffmpeg").FFmpeg
  const ffmpeg = new FFmpegModule()

  const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm"
  ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  })

  ffmpegInstance = ffmpeg
  return ffmpeg
}

export async function trimAndExportVideo(
  file: File,
  startTime: number,
  endTime: number,
  filename = "edited-video.mp4",
): Promise<Blob> {
  const ffmpeg = await initFFmpeg()

  // Write input file to FFmpeg filesystem
  const inputName = "input.mp4"
  const outputName = "output.mp4"

  const arrayBuffer = await file.arrayBuffer()
  ffmpeg.FS("writeFile", inputName, new Uint8Array(arrayBuffer))

  // Build FFmpeg command to trim video
  const duration = endTime - startTime
  await ffmpeg.run(
    "-i",
    inputName,
    "-ss",
    startTime.toString(),
    "-t",
    duration.toString(),
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "28",
    outputName,
  )

  // Read output file
  const data = ffmpeg.FS("readFile", outputName)
  const blob = new Blob([data.buffer], { type: "video/mp4" })

  // Clean up
  ffmpeg.FS("unlink", inputName)
  ffmpeg.FS("unlink", outputName)

  return blob
}

export async function trimMultipleRegions(
  file: File,
  trimRegions: Array<{ startTime: number; endTime: number }>,
  filename = "edited-video.mp4",
): Promise<Blob> {
  const ffmpeg = await initFFmpeg()

  const inputName = "input.mp4"
  const outputName = "output.mp4"

  const arrayBuffer = await file.arrayBuffer()
  ffmpeg.FS("writeFile", inputName, new Uint8Array(arrayBuffer))

  // Create a concat demuxer file for multiple segments
  let concatContent = ""
  for (let i = 0; i < trimRegions.length; i++) {
    const { startTime, endTime } = trimRegions[i]
    const segmentName = `segment_${i}.mp4`

    // Extract each segment
    const duration = endTime - startTime
    await ffmpeg.run(
      "-i",
      inputName,
      "-ss",
      startTime.toString(),
      "-t",
      duration.toString(),
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-crf",
      "28",
      segmentName,
    )

    concatContent += `file '${segmentName}'\n`
  }

  // Write concat file
  ffmpeg.FS("writeFile", "concat.txt", concatContent)

  // Concatenate all segments
  await ffmpeg.run("-f", "concat", "-safe", "0", "-i", "concat.txt", "-c", "copy", outputName)

  // Read output file
  const data = ffmpeg.FS("readFile", outputName)
  const blob = new Blob([data.buffer], { type: "video/mp4" })

  // Clean up
  ffmpeg.FS("unlink", inputName)
  for (let i = 0; i < trimRegions.length; i++) {
    ffmpeg.FS("unlink", `segment_${i}.mp4`)
  }
  ffmpeg.FS("unlink", "concat.txt")
  ffmpeg.FS("unlink", outputName)

  return blob
}
