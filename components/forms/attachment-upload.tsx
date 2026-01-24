"use client"

import type React from "react"

import { useRef } from "react"
import { Paperclip, X, FileText, ImageIcon, File, Download, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/lib/locale-context"
import type { Attachment } from "@/lib/types"
import Image from "next/image"

interface AttachmentUploadProps {
  attachments: Attachment[]
  onChange: (attachments: Attachment[]) => void
  maxFiles?: number
  readOnly?: boolean
}

export function AttachmentUpload({ attachments, onChange, maxFiles = 10, readOnly = false }: AttachmentUploadProps) {
  const { t } = useLocale()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newAttachments: Attachment[] = files.map((file) => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
      uploadedAt: new Date(),
    }))

    onChange([...attachments, ...newAttachments].slice(0, maxFiles))
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  const removeAttachment = (id: string) => {
    onChange(attachments.filter((a) => a.id !== id))
  }

  const downloadAttachment = (attachment: Attachment) => {
    const link = document.createElement("a")
    link.href = attachment.url
    link.download = attachment.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return ImageIcon
    if (type.includes("pdf")) return FileText
    return File
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const isImage = (type: string) => type.startsWith("image/")
  const isPdf = (type: string) => type.includes("pdf")

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx"
        onChange={handleFileSelect}
        className="hidden"
      />

      {(attachments || []).length > 0 && (
        <div className="space-y-4">
          {/* Image grid for image attachments */}
          {(attachments || []).some(a => isImage(a.type)) && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">{t("form.attachments")} - {t("field.photos")}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {(attachments || []).map((attachment) => {
                  if (!isImage(attachment.type)) return null
                  return (
                    <div
                      key={attachment.id}
                      className="relative group rounded-lg overflow-hidden border border-border bg-muted/50 aspect-square"
                    >
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30"
                          onClick={() => window.open(attachment.url, "_blank")}
                          title={t("action.view")}
                        >
                          <Eye className="h-4 w-4 text-white" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30"
                          onClick={() => downloadAttachment(attachment)}
                          title={t("action.download")}
                        >
                          <Download className="h-4 w-4 text-white" />
                        </Button>
                        {!readOnly && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30"
                            onClick={() => removeAttachment(attachment.id)}
                            title={t("action.remove")}
                          >
                            <X className="h-4 w-4 text-white" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* List for non-image attachments */}
          {(attachments || []).some(a => !isImage(a.type)) && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">{t("form.attachments")}</p>
              <div className="space-y-2">
                {(attachments || []).map((attachment) => {
                  if (isImage(attachment.type)) return null
                  const Icon = getFileIcon(attachment.type)
                  return (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <button
                          type="button"
                          className="text-sm font-medium truncate hover:underline text-left"
                          onClick={() => window.open(attachment.url, "_blank")}
                          title={t("action.view")}
                        >
                          {attachment.name}
                        </button>
                        <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                      </div>
                      {!readOnly && (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => downloadAttachment(attachment)}
                            title={t("action.download")}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => removeAttachment(attachment.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {readOnly && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => downloadAttachment(attachment)}
                          title={t("action.download")}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {attachments.length < maxFiles && !readOnly && (
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          className="w-full h-12 border-dashed"
        >
          <Paperclip className="h-4 w-4 mr-2" />
          {t("form.addAttachment")}
        </Button>
      )}
    </div>
  )
}
