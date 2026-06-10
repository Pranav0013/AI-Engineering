import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { queryClient } from '@/lib/queryClient'
import { AppLayout } from '@/components/layout/AppLayout'
import { UploadPage } from '@/pages/UploadPage'
import { AnalysisPage } from '@/pages/AnalysisPage'
import { ReportPage } from '@/pages/ReportPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        <ErrorBoundary>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route index element={<UploadPage />} />
                <Route path="/analyze" element={<AnalysisPage />} />
                <Route path="/report/:id" element={<ReportPage />} />
                <Route path="/history" element={<HistoryPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  )
}
