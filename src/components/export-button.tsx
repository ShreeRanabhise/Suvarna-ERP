'use client'

import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'

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
  
  function handleExport() {
    if (!data || data.length === 0) {
      alert('No data available to export')
      return
    }
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    XLSX.writeFile(workbook, `${fileName}.xlsx`)
  }

  return (
    <button 
      onClick={handleExport}
      className="flex items-center gap-2 border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary px-4 py-2 rounded-md font-semibold text-sm transition"
    >
      <Download className="h-4 w-4" />
      <span>{buttonText}</span>
    </button>
  )
}
