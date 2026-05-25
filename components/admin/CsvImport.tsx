'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Upload, FileType, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useCreateUser, userKeys } from '@/lib/queries/users'
import { useQueryClient } from '@tanstack/react-query'
import { useDepartments } from '@/lib/queries/departments'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CsvImportProps {
  isOpen: boolean
  onClose: () => void
}

interface ParsedRow {
  name: string
  email: string
  role: string
  department_name?: string
  isValid: boolean
  errors: string[]
}

export function CsvImport({ isOpen, onClose }: CsvImportProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const { data: departments } = useDepartments()
  const createMutation = useCreateUser()
  const queryClient = useQueryClient()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const parseFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (!text) return

      const lines = text.split('\n').filter(line => line.trim())
      if (lines.length === 0) return
      const headers = lines[0]!.toLowerCase().split(',').map(h => h.trim())
      
      const parsedRows: ParsedRow[] = []
      
      // Expected headers: name, email, role, department_name
      const nameIdx = headers.indexOf('name')
      const emailIdx = headers.indexOf('email')
      const roleIdx = headers.indexOf('role')
      const deptIdx = headers.indexOf('department_name')

      if (nameIdx === -1 || emailIdx === -1) {
        toast.error('CSV must contain at least "name" and "email" headers')
        return
      }

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i]!.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cell => cell.replace(/^"|"$/g, '').trim())
        if (row.length < 2) continue

        const name = row[nameIdx] || ''
        const email = row[emailIdx] || ''
        const role = roleIdx !== -1 ? (row[roleIdx] || 'employee').toLowerCase() : 'employee'
        const department_name = deptIdx !== -1 ? row[deptIdx] : ''

        const errors: string[] = []
        if (!name) errors.push('Name is missing')
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email')
        if (!['admin', 'manager', 'employee'].includes(role)) errors.push('Invalid role')

        parsedRows.push({
          name,
          email,
          role,
          department_name,
          isValid: errors.length === 0,
          errors
        })
      }

      setRows(parsedRows)
      setStep(2)
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      parseFile(e.dataTransfer.files[0]!)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      parseFile(e.target.files[0]!)
    }
  }

  const resetImport = () => {
    setStep(1)
    setRows([])
    setProgress(0)
  }

  const executeImport = async () => {
    const validRows = rows.filter(r => r.isValid)
    if (validRows.length === 0) return

    setIsImporting(true)
    setProgress(0)

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i]!
      
      let department_id: string | null = null
      if (row.department_name && departments) {
        const found = departments.find(d => d.name.toLowerCase() === row.department_name?.toLowerCase())
        if (found) department_id = found.id
      }

      try {
        await createMutation.mutateAsync({
          full_name: row.name,
          email: row.email,
          role: row.role as any,
          department_id
        })
      } catch (err: any) {
        toast.error(`Failed to create ${row.email}: ${err.message}`)
      }
      
      setProgress(i + 1)
      await new Promise(r => setTimeout(r, 100)) // 100ms delay as spec
    }

    setIsImporting(false)
    toast.success(`${validRows.length} members added successfully`)
    queryClient.invalidateQueries({ queryKey: userKeys.all })
    onClose()
    resetImport()
  }

  const validCount = rows.filter(r => r.isValid).length
  const invalidCount = rows.filter(r => !r.isValid).length

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isImporting) { onClose(); resetImport() } }}>
      <DialogContent className="sm:max-w-[600px] bg-[#111111] border-[#2a2a2a] p-0">
        <div className="p-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-white">Import CSV</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Bulk upload team members using a CSV file.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6">
          {step === 1 && (
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-[#2a2a2a] rounded-xl p-12 text-center flex flex-col items-center justify-center transition-colors hover:border-[#3a3a3a] bg-[#0a0a0a]"
            >
              <Upload size={48} className="text-neutral-600 mb-4" />
              <p className="text-sm text-neutral-400 mb-1">Drop a CSV file here</p>
              <label className="text-xs text-indigo-400 cursor-pointer hover:underline">
                or click to browse
                <input type="file" accept=".csv" className="hidden" onChange={handleFileInput} />
              </label>
              <div className="mt-8 text-xs text-neutral-500 font-mono bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-[#2a2a2a]">
                name, email, role, department_name
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex gap-4 mb-4">
                <div className="flex items-center gap-1.5 text-sm text-emerald-400">
                  <CheckCircle2 size={16} />
                  <span>{validCount} valid</span>
                </div>
                {invalidCount > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-rose-400">
                    <AlertCircle size={16} />
                    <span>{invalidCount} errors</span>
                  </div>
                )}
              </div>

              <div className="border border-[#2a2a2a] rounded-lg overflow-hidden bg-[#0a0a0a]">
                <table className="w-full text-sm">
                  <thead className="bg-[#1a1a1a] border-b border-[#2a2a2a]">
                    <tr>
                      <th className="text-left py-2 px-3 text-neutral-400 font-medium">Name</th>
                      <th className="text-left py-2 px-3 text-neutral-400 font-medium">Email</th>
                      <th className="text-left py-2 px-3 text-neutral-400 font-medium">Role</th>
                      <th className="text-left py-2 px-3 text-neutral-400 font-medium">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className={cn("border-b border-[#2a2a2a] last:border-0", !row.isValid && "bg-rose-500/10")}>
                        <td className="py-2 px-3 text-neutral-300">{row.name}</td>
                        <td className="py-2 px-3 text-neutral-300">{row.email}</td>
                        <td className="py-2 px-3 text-neutral-300 capitalize">{row.role}</td>
                        <td className="py-2 px-3 text-rose-400 text-xs">{row.errors.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 5 && (
                  <div className="py-2 text-center text-xs text-neutral-500 bg-[#1a1a1a] border-t border-[#2a2a2a]">
                    + {rows.length - 5} more rows
                  </div>
                )}
              </div>

              {invalidCount > 0 && (
                <p className="text-sm text-amber-400">Please fix the highlighted rows before importing.</p>
              )}

              {isImporting && (
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>Creating users...</span>
                    <span>{progress} / {validCount}</span>
                  </div>
                  <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${(progress / validCount) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {step === 2 && (
          <div className="p-4 border-t border-[#2a2a2a] bg-[#111111] flex justify-end gap-3 rounded-b-xl">
            <button
              onClick={resetImport}
              disabled={isImporting}
              className="text-neutral-400 hover:text-white hover:bg-[#1a1a1a] h-9 px-3 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={executeImport}
              disabled={invalidCount > 0 || validCount === 0 || isImporting}
              className="bg-indigo-600 hover:bg-indigo-500 text-white h-9 px-4 text-sm font-medium rounded-lg transition-colors flex items-center justify-center min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? <Loader2 size={16} className="animate-spin" /> : `Import ${validCount} Members`}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
