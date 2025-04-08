import { create } from 'zustand'

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
  activeTool: 'trim' | 'zoom' | null
  history: HistoryState

  // Actions
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setIsPlaying: (isPlaying: boolean) => void
  setZoomLevel: (level: number) => void
  setActiveTool: (tool: 'trim' | 'zoom' | null) => void

  // Trim actions
  addTrimRegion: (startTime: number) => void
  updateTrimRegion: (
    id: string,
    startTime: number,
    endTime: number,
    saveToHistory?: boolean
  ) => void
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

  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setZoomLevel: (level) => set({ zoomLevel: level }),
  setActiveTool: (tool) => set({ activeTool: tool }),

  addTrimRegion: (startTime) => {
    const state = get()

    // Calculate end time (10% of video duration)
    const trimDuration = state.duration * 0.1
    const endTime = Math.min(startTime + trimDuration, state.duration)

    const newRegion: TrimRegion = {
      id: Date.now().toString(),
      startTime,
      endTime,
    }

    // Save current state to history
    const newPast = [...state.history.past, [...state.trimRegions]]

    set({
      trimRegions: [...state.trimRegions, newRegion],
      history: {
        past: newPast,
        future: [],
      },
      // Don't stay in trim mode
      activeTool: null,
    })
  },

  updateTrimRegion: (id, startTime, endTime, saveToHistory = true) => {
    const state = get()

    // Create updated regions
    const updatedRegions = state.trimRegions.map((region) =>
      region.id === id ? { ...region, startTime, endTime } : region
    )

    // Only save to history if explicitly requested (typically on mouse up)
    if (saveToHistory) {
      // Standard history saving (for non-drag operations)
      const newPast = [...state.history.past, [...state.trimRegions]]

      set({
        trimRegions: updatedRegions,
        history: {
          past: newPast,
          future: [],
        },
      })
    } else {
      // Just update the state without saving to history
      set({ trimRegions: updatedRegions })
    }
  },

  removeTrimRegion: (id) => {
    const state = get()

    // Save current state to history
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
