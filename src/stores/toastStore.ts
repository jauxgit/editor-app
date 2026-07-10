import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  message: string
  detail?: string
  duration?: number
}

interface ToastInput {
  type?: ToastType
  message: string
  detail?: string
  duration?: number
}

interface ToastState {
  toasts: Toast[]
  showToast: (toast: ToastInput) => string
  dismissToast: (id: string) => void
  clearToasts: () => void
}

const DEFAULT_DURATION = 3200

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  showToast: ({ type = 'info', message, detail, duration = DEFAULT_DURATION }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const toast: Toast = { id, type, message, detail, duration }
    set((state) => ({ toasts: [...state.toasts, toast].slice(-5) }))

    if (duration > 0) {
      window.setTimeout(() => {
        useToastStore.getState().dismissToast(id)
      }, duration)
    }

    return id
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  clearToasts: () => set({ toasts: [] }),
}))
