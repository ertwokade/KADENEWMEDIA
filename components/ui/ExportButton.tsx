'use client'

import { useState } from 'react'
import { Download, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExportButtonProps {
  content: string
  filename?: string
  className?: string
}

export default function ExportButton({ content, filename = 'contentai-export', className }: ExportButtonProps) {
  const [open, setOpen] = useState(false)

  const downloadMarkdown = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.md`
    a.click()
    URL.revokeObjectURL(url)
    setOpen(false)
  }

  const downloadTxt = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.txt`
    a.click()
    URL.revokeObjectURL(url)
    setOpen(false)
  }

  const copyAll = async () => {
    await navigator.clipboard.writeText(content)
    setOpen(false)
  }

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-700 text-zinc-300 text-xs font-medium hover:bg-zinc-600 transition-colors border border-zinc-600"
      >
        <Download className="w-3.5 h-3.5" />
        Dışa Aktar
        <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden min-w-36">
            {[
              { label: 'Tümünü Kopyala', action: copyAll },
              { label: 'Markdown İndir (.md)', action: downloadMarkdown },
              { label: 'Metin İndir (.txt)', action: downloadTxt },
            ].map(({ label, action }) => (
              <button
                key={label}
                onClick={action}
                className="w-full text-left px-4 py-2.5 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
