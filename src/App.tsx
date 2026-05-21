import { useEffect } from 'react'
import { AppLayout } from './components/Layout/AppLayout'
import { registerBuiltinPlugins } from './plugins'

export default function App() {
  useEffect(() => {
    registerBuiltinPlugins()
  }, [])

  return <AppLayout />
}
