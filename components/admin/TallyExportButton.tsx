'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export function TallyExportButton() {
  const handleExport = () => {
    // Navigating to the API route will trigger the file download
    window.location.href = '/api/export/tally'
  }

  return (
    <Button 
      onClick={handleExport}
      variant="outline"
      className="gap-2 bg-[#1a1c23] border-neutral-800 text-neutral-200 hover:bg-neutral-800"
    >
      <Download className="w-4 h-4" />
      Export for Tally (CSV)
    </Button>
  )
}
