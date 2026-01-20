import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAnalyzeCode } from '../hooks/usePlayground'
import { PlaygroundResultSkeleton } from '../components/Skeleton'
import { ErrorState } from '../components/ErrorState'

const languages = ['Python', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'C++', 'Java']

export default function Playground() {
  const [code, setCode] = useState(`def find_duplicates(arr):
    duplicates = []
    for i in range(len(arr)):
        for j in range(i + 1, len(arr)):
            if arr[i] == arr[j] and arr[i] not in duplicates:
                duplicates.append(arr[i])
    return duplicates`)
  const [language, setLanguage] = useState('Python')

  const {
    mutate: analyzeCode,
    data: result,
    isPending,
    error,
    reset,
  } = useAnalyzeCode()

  const handleAnalyze = () => {
    if (code.trim()) {
      analyzeCode({ code, language: language.toLowerCase() })
    }
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value)
    if (result) {
      reset() // Clear previous result when code changes
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-text-primary">Playground</h1>
        <p className="text-text-secondary">
          Paste your code and find optimized versions
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Your Code</h2>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-1 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary focus:outline-none"
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={code}
            onChange={handleCodeChange}
            className="w-full h-80 p-4 bg-bg-secondary border border-bg-tertiary rounded-xl text-text-primary font-mono text-sm resize-none focus:outline-none focus:border-accent-primary"
            placeholder="Paste your code here..."
          />
          <button
            onClick={handleAnalyze}
            disabled={isPending || !code.trim()}
            className="w-full py-3 bg-accent-primary text-white rounded-xl hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <span className="animate-spin">⚙️</span>
                Analyzing...
              </>
            ) : (
              <>🚀 Find Better</>
            )}
          </button>
        </div>

        {/* Output */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">Optimized Version</h2>
          {isPending ? (
            <PlaygroundResultSkeleton />
          ) : error ? (
            <ErrorState
              message="Failed to analyze code. Please try again."
              onRetry={handleAnalyze}
            />
          ) : result ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Speedup Badge */}
              <div className="flex items-center gap-4 p-4 bg-accent-success/10 border border-accent-success/30 rounded-xl">
                <span className="text-4xl font-bold text-accent-success">
                  {result.speedup.toFixed(0)}x
                </span>
                <div>
                  <div className="text-text-primary font-medium">Faster</div>
                  <div className="text-sm text-text-secondary">
                    Time: {result.complexity.time} | Space: {result.complexity.space}
                  </div>
                </div>
              </div>

              {/* Optimized Code */}
              <pre className="p-4 bg-bg-secondary border border-bg-tertiary rounded-xl text-text-primary font-mono text-sm overflow-x-auto h-48">
                {result.optimized_code}
              </pre>

              {/* Suggestions */}
              <div className="p-4 bg-bg-secondary border border-bg-tertiary rounded-xl">
                <h3 className="text-sm font-medium text-text-primary mb-2">
                  Optimizations Applied
                </h3>
                <ul className="space-y-1">
                  {result.suggestions.map((suggestion, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-text-secondary"
                    >
                      <span className="text-accent-success">✓</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ) : (
            <div className="h-80 flex items-center justify-center bg-bg-secondary border border-bg-tertiary rounded-xl">
              <p className="text-text-muted">
                Paste code and click "Find Better" to see optimizations
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
