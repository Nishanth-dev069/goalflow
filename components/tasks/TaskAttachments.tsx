'use client'

import React, { useState, useEffect } from 'react'
import { Upload, File, FileText, Image as ImageIcon, FileArchive, X, Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { TaskAttachment } from '@/types'
import { formatBytes } from '@/lib/utils'
import { UserAvatar } from '@/components/shared/UserAvatar'

export function TaskAttachments({ taskId, currentUser }: { taskId: string, currentUser: any }) {
  const [attachments, setAttachments] = useState<TaskAttachment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const fetchAttachments = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/attachments`)
      if (res.ok) {
        const json = await res.json()
        setAttachments(json.data)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAttachments()
  }, [taskId])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files))
    }
  }

  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large (max 10MB)`)
        continue
      }

      setIsUploading(true)
      const formData = new FormData()
      formData.append('file', file)

      try {
        const res = await fetch(`/api/tasks/${taskId}/attachments`, {
          method: 'POST',
          body: formData
        })
        
        if (!res.ok) {
          const err = await res.json()
          toast.error(err.error || 'Upload failed')
          continue
        }

        const json = await res.json()
        setAttachments(prev => [json.data, ...prev])
        toast.success(`${file.name} uploaded`)
      } catch (err) {
        toast.error(`Failed to upload ${file.name}`)
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Delete this file?')) return

    try {
      const res = await fetch(`/api/tasks/${taskId}/attachments/${attachmentId}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        setAttachments(prev => prev.filter(a => a.id !== attachmentId))
        toast.success('File deleted')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Delete failed')
      }
    } catch (err) {
      toast.error('Delete failed')
    }
  }

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <ImageIcon size={20} className="text-indigo-400" />
    if (type.includes('pdf')) return <FileText size={20} className="text-rose-400" />
    if (type.includes('zip') || type.includes('archive')) return <FileArchive size={20} className="text-amber-400" />
    return <File size={20} className="text-blue-400" />
  }

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-[#111111] border border-[#2a2a2a] rounded-xl" />
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Attachments</h3>
      
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors relative
          ${isDragging ? 'border-indigo-500 bg-indigo-500/5' : 'border-[#2a2a2a] bg-[#111111] hover:border-indigo-500/40'}
        `}
      >
        {isUploading && (
          <div className="absolute inset-0 bg-[#111111]/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
            <Loader2 className="animate-spin text-indigo-400" />
          </div>
        )}
        <Upload size={24} className="mx-auto text-neutral-600 mb-2" />
        <p className="text-sm text-neutral-500">
          Drop files here or{' '}
          <label className="text-indigo-400 cursor-pointer hover:underline">
            browse
            <input type="file" className="hidden" onChange={handleFileSelect} multiple accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xlsx,.txt,.zip" />
          </label>
        </p>
        <p className="text-xs text-neutral-700 mt-1">Max 10MB · PDF, images, docs</p>
      </div>

      {attachments.length > 0 && (
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl overflow-hidden divide-y divide-[#1a1a1a]">
          {attachments.map(att => (
            <div key={att.id} className="p-3 flex items-center gap-3 hover:bg-[#1a1a1a] transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-[#2a2a2a] flex items-center justify-center shrink-0">
                {getFileIcon(att.file_type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{att.file_name}</div>
                <div className="text-xs text-neutral-500 flex items-center gap-2">
                  <span>{formatBytes(att.file_size)}</span>
                  <span>&middot;</span>
                  <div className="flex items-center gap-1">
                    <UserAvatar user={att.uploader as any} className="w-3.5 h-3.5" />
                    {att.uploader?.full_name}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {att.public_url && (
                  <a 
                    href={att.public_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 text-neutral-400 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
                  >
                    <Download size={16} />
                  </a>
                )}
                {(att.uploaded_by === currentUser.id || currentUser.role === 'admin') && (
                  <button 
                    onClick={() => handleDelete(att.id)}
                    className="p-2 text-neutral-400 hover:text-rose-400 hover:bg-[#2a2a2a] rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
