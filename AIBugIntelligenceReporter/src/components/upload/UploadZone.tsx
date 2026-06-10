import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileImage, FileVideo, Loader2, X } from 'lucide-react'
import { MediaType, UploadedMedia } from '@/types'
import { MEDIA_TYPE_CONFIG } from '@/lib/constants'
import { formatFileSize } from '@/lib/utils'
import { extractVideoFrames, extractPlaywrightTrace } from '@/lib/videoUtils'
import { cn } from '@/lib/utils'
import { fileToBase64, fileToText } from '@/lib/utils'

interface UploadZoneProps {
  mediaType: MediaType
  onFileReady: (media: UploadedMedia) => void
  currentFile: UploadedMedia | null
  onClear: () => void
}

export function UploadZone({ mediaType, onFileReady, currentFile, onClear }: UploadZoneProps) {
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState<string | null>(null)

  const config = MEDIA_TYPE_CONFIG[mediaType]

  const processFile = useCallback(
    async (file: File) => {
      setProcessing(true)
      setError(null)
      setProgress('Reading file…')

      try {
        let media: UploadedMedia

        if (mediaType === 'screenshot') {
          setProgress('Converting image…')
          const imageData = await fileToBase64(file)
          media = { type: mediaType, filename: file.name, size: file.size, imageData }
        } else if (mediaType === 'video') {
          setProgress('Extracting frames…')
          const frames = await extractVideoFrames(file)
          media = { type: mediaType, filename: file.name, size: file.size, frames }
        } else if (mediaType === 'playwright_trace') {
          setProgress('Unpacking trace…')
          const { traceContent, screenshots } = await extractPlaywrightTrace(file)
          media = {
            type: mediaType,
            filename: file.name,
            size: file.size,
            traceContent,
            traceScreenshots: screenshots,
          }
        } else {
          setProgress('Reading log…')
          const textContent = await fileToText(file)
          media = { type: mediaType, filename: file.name, size: file.size, textContent }
        }

        onFileReady(media)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process file')
      } finally {
        setProcessing(false)
        setProgress('')
      }
    },
    [mediaType, onFileReady]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: config.accept,
    maxSize: config.maxSize,
    multiple: false,
    disabled: processing,
    onDropAccepted: ([file]) => processFile(file),
    onDropRejected: ([rejection]) => {
      const err = rejection.errors[0]
      if (err.code === 'file-too-large') {
        setError(`File exceeds ${formatFileSize(config.maxSize)} limit`)
      } else {
        setError(err.message)
      }
    },
  })

  if (currentFile && !processing) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 rounded-xl border border-violet-500/25 bg-violet-500/5 p-4"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
          {currentFile.type === 'screenshot' ? (
            <FileImage className="h-5 w-5 text-violet-400" />
          ) : (
            <FileVideo className="h-5 w-5 text-violet-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white/90">{currentFile.filename}</p>
          <p className="text-xs text-white/40">{formatFileSize(currentFile.size)}</p>
        </div>
        <button
          onClick={onClear}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/30 hover:bg-white/[0.06] hover:text-white/60 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    )
  }

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-all duration-200 cursor-pointer',
          isDragActive
            ? 'border-violet-500/60 bg-violet-500/5'
            : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.03]',
          processing && 'pointer-events-none opacity-60'
        )}
      >
        <input {...getInputProps()} />

        <AnimatePresence mode="wait">
          {processing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex flex-col items-center gap-2"
            >
              <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
              <p className="text-sm text-white/50">{progress}</p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex flex-col items-center gap-2 text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <Upload className="h-5 w-5 text-white/30" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/60">
                  {isDragActive ? 'Drop to analyze' : 'Drop your file here'}
                </p>
                <p className="mt-0.5 text-xs text-white/30">
                  or click to browse · max {formatFileSize(config.maxSize)}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-400 px-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  )
}
