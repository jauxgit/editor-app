import { useEffect } from 'react'
import { AppLayout } from './components/Layout/AppLayout'
import { ThemeProvider } from './components/ThemeProvider'
import { ToastContainer } from './components/Common/ToastContainer'
import { UpdateToast } from './components/Common/UpdateToast'
import { registerBuiltinPlugins } from './plugins'
import { useUpdateStore } from './stores/updateStore'

export default function App() {
  useEffect(() => {
    registerBuiltinPlugins()
  }, [])

  // 启动后自动检查更新（仅 Electron 环境；网络失败静默）
  useEffect(() => {
    if (!window.electronAPI) return
    const timer = window.setTimeout(() => {
      void useUpdateStore.getState().checkForUpdates({ silent: true })
    }, 2500)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <ThemeProvider>
      <AppLayout />
      <ToastContainer />
      <UpdateToast />
    </ThemeProvider>
  )
}
