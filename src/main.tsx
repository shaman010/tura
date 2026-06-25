import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'

// Применяем сохранённую тему до первого рендера, чтобы не было «мигания».
try {
  const saved = JSON.parse(localStorage.getItem('swipd-store') || '{}')
  document.documentElement.dataset.theme = saved?.state?.theme === 'light' ? 'light' : 'dark'
} catch {
  document.documentElement.dataset.theme = 'dark'
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
