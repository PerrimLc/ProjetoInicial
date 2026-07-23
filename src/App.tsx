import { RouterProvider } from 'react-router-dom'
import { AppProvider } from '@/contexts/AppContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/components/ui/toast'
import { router } from '@/routes'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        {/* AppProvider is kept for pages that still use useApp() during migration */}
        <AppProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
