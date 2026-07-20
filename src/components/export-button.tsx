'use client'

import { Download } from 'lucide-react'

interface ExportButtonProps {
  data: any[]
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
      className="inline-flex items-center gap-2 border border-slate-200 hover:border-primary/20 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition"
    >
      <Download className="h-4 w-4 text-slate-400" />
      <span>{buttonText}</span>
    </button>
  )
}
