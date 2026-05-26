import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { getActiveEditorView } from './lib/commands'

// 暴露插件 API 到 window，第三方插件可通过 window.markeditAPI 访问
;(window as any).markeditAPI = { getActiveEditorView }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
