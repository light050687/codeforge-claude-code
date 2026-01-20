import { useState, memo } from 'react'

interface CodeBlockProps {
  code: string
  language?: string
  maxHeight?: string
  className?: string
}

export const CodeBlock = memo(function CodeBlock({
  code,
  language,
  maxHeight = 'max-h-64',
  className = '',
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className={`relative group ${className}`}>
      <pre
        className={`bg-bg-primary rounded-lg p-4 text-sm font-mono text-text-secondary overflow-x-auto ${maxHeight}`}
      >
        {code}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 px-2 py-1 text-xs bg-bg-tertiary hover:bg-bg-secondary text-text-muted hover:text-text-primary rounded transition-all opacity-0 group-hover:opacity-100"
        title="Copy code"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      {language && (
        <span className="absolute bottom-2 right-2 px-2 py-1 text-xs text-text-muted">
          {language}
        </span>
      )}
    </div>
  )
})
