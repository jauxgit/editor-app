import { useEffect } from 'react'
import { AppLayout } from './components/Layout/AppLayout'
import { ThemeProvider } from './components/ThemeProvider'
import { ToastContainer } from './components/Common/ToastContainer'
import { registerBuiltinPlugins } from './plugins'

export default function App() {
  useEffect(() => {
    registerBuiltinPlugins()
  }, [])

  return (
    <ThemeProvider>
      <AppLayout />
      <ToastContainer />
    </ThemeProvider>
  )
}
