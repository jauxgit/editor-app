import { useEffect } from 'react'
import { AppLayout } from './components/Layout/AppLayout'
import { ThemeProvider } from './components/ThemeProvider'
import { registerBuiltinPlugins } from './plugins'

export default function App() {
  useEffect(() => {
    registerBuiltinPlugins()
  }, [])

  return (
    <ThemeProvider>
      <AppLayout />
    </ThemeProvider>
  )
}
