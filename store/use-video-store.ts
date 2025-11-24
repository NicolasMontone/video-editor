import { create } from "zustand"

export type TrimRegion = {
  id: string
  startTime: number
  endTime: number
}

type HistoryState = {
  past: TrimRegion[][]
  future: TrimRegion[][]
}

type VideoState = {
  currentTime: number
  duration: number
  isPlaying: boolean
  trimRegions: TrimRegion[]
  zoomLevel: number
  activeTool: "trim" | "zoom" | null
  history: HistoryState
  isExporting: boolean
  exportProgress: number

  // Actions
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setIsPlaying: (isPlaying: boolean) => void
  setZoomLevel: (level: number) => void
  setActiveTool: (tool: "trim" | "zoom" | null) => void
  setIsExporting: (isExporting: boolean) => void
  setExportProgress: (progress: number) => void

  // Trim actions
  addTrimRegion: (startTime: number) => void
  updateTrimRegion: (id: string, startTime: number, endTime: number, saveToHistory?: boolean) => void
  removeTrimRegion: (id: string) => void

  // History actions
  undo: () => void
  redo: () => void
}

export const useVideoStore = create<VideoState>((set, get) => ({
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  trimRegions: [],
  zoomLevel: 100,
  activeTool: null,
  history: {
    past: [],
    future: [],
  },
  isExporting: false,
  exportProgress: 0,

  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setZoomLevel: (level) => set({ zoomLevel: level }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setIsExporting: (isExporting) => set({ isExporting }),
  setExportProgress: (progress) => set({ exportProgress: progress }),

  addTrimRegion: (startTime) => {
    const state = get()

    const trimDuration = state.duration * 0.1
    const endTime = Math.min(startTime + trimDuration, state.duration)

    const newRegion: TrimRegion = {
      id: Date.now().toString(),
      startTime,
      endTime,
    }

    const newPast = [...state.history.past, [...state.trimRegions]]

    set({
      trimRegions: [...state.trimRegions, newRegion],
      history: {
        past: newPast,
        future: [],
      },
      activeTool: null,
    })
  },

  updateTrimRegion: (id, startTime, endTime, saveToHistory = true) => {
    const state = get()

    const updatedRegions = state.trimRegions.map((region) =>
      region.id === id ? { ...region, startTime, endTime } : region,
    )

    if (saveToHistory) {
      const newPast = [...state.history.past, [...state.trimRegions]]

      set({
        trimRegions: updatedRegions,
        history: {
          past: newPast,
          future: [],
        },
      })
    } else {
      set({ trimRegions: updatedRegions })
    }
  },

  removeTrimRegion: (id) => {
    const state = get()

    const newPast = [...state.history.past, [...state.trimRegions]]

    set({
      trimRegions: state.trimRegions.filter((region) => region.id !== id),
      history: {
        past: newPast,
        future: [],
      },
    })
  },

  undo: () => {
    const state = get()
    const { past, future } = state.history

    if (past.length === 0) return

    const newPast = [...past]
    const previousState = newPast.pop()

    set({
      trimRegions: previousState || [],
      history: {
        past: newPast,
        future: [state.trimRegions, ...future],
      },
    })
  },

  redo: () => {
    const state = get()
    const { past, future } = state.history

    if (future.length === 0) return

    const newFuture = [...future]
    const nextState = newFuture.shift()

    set({
      trimRegions: nextState || [],
      history: {
        past: [...past, state.trimRegions],
        future: newFuture,
      },
    })
  },
}))
