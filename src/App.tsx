import { RouterProvider } from 'react-router-dom'
import { AppProvider } from '@/contexts/AppContext'
import { ToastProvider } from '@/components/ui/toast'
import { router } from '@/routes'

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AppProvider>
  )
}
