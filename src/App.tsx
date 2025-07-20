import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { Dashboard } from './pages/Dashboard'
import { Products } from './pages/Products'
import { Settings } from './pages/Settings'
import { blink } from './blink/client'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto">
            <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-muted-foreground">Loading Inventory Pro...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-6 max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Inventory Pro</h1>
            <p className="text-muted-foreground">
              Comprehensive inventory management for your business
            </p>
          </div>
          <button
            onClick={() => blink.auth.login()}
            className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/inventory" element={<div className="p-8"><h1 className="text-3xl font-bold">Inventory</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
          <Route path="/suppliers" element={<div className="p-8"><h1 className="text-3xl font-bold">Suppliers</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
          <Route path="/reports" element={<div className="p-8"><h1 className="text-3xl font-bold">Reports</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </Router>
  )
}

export default App