import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnalysisStore } from '@/store/analysisStore'
import { AnalysisProgress } from '@/components/analysis/AnalysisProgress'

export function AnalysisPage() {
  const navigate = useNavigate()
  const { pendingUpload, analysisState } = useAnalysisStore()

  useEffect(() => {
    // Guard: if no upload is pending and analysis hasn't started, redirect home
    if (!pendingUpload && !analysisState.currentAgent && analysisState.elapsedMs === 0) {
      navigate('/', { replace: true })
    }
  }, [pendingUpload, analysisState, navigate])

  return <AnalysisProgress />
}
