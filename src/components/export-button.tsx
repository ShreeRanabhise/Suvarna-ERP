'use client'

import { Download } from 'lucide-react'

interface ExportButtonProps {
  data: Record<string, unknown>[]
  fileName: string
  sheetName?: string
  buttonText?: string
}

export default function ExportButton({ 
  data, 
  fileName, 
  sheetName = 'Sheet1', 
  buttonText = 'Export to Excel' 
}: ExportButtonProps) {
  
  async function handleExport() {
    if (!data || data.length === 0) {
      alert('No data available to export')
      return
    }
    
    // Dynamic import to reduce initial bundle size
    const XLSX = await import('xlsx')
    
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    XLSX.writeFile(workbook, `${fileName}.xlsx`)
  }

  return (
    <button 
      onClick={handleExport}
      className="inline-flex items-center gap-2 border border-border hover:bg-background-secondary bg-background text-foreground-secondary px-4 h-9 rounded-md font-medium text-sm transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={buttonText}
    >
      <Download className="h-4 w-4 text-foreground-muted" />
      <span>{buttonText}</span>
    </button>
  )
}
