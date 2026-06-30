import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Upload, FileText, MoreHorizontal, Search,
  Plus, Folder, CheckCircle2, Clock, AlertCircle, Tag, Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ConfirmModal } from '@/components/ui/modal'
import { useApp } from '@/contexts/AppContext'
import { useToast } from '@/components/ui/toast'

const categories = ['Todos', 'Produto', 'Vendas', 'Suporte', 'FAQ', 'Treinamento', 'Jurídico']

const statusConfig = {
  processed: { icon: CheckCircle2, color: 'text-emerald-400', label: 'Processado' },
  processing: { icon: Clock, color: 'text-amber-400', label: 'Processando' },
  error: { icon: AlertCircle, color: 'text-red-400', label: 'Erro' },
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function Knowledge() {
  const { knowledgeFiles, addKnowledgeFile, deleteKnowledgeFile } = useApp()
  const { success, error: toastError } = useToast()

  const [activeCategory, setActiveCategory] = useState('Todos')
  const [dragging, setDragging] = useState(false)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filtered = knowledgeFiles.filter(f => {
    const matchCat = activeCategory === 'Todos' || f.category === activeCategory
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(file => {
      if (file.size > 50 * 1024 * 1024) {
        toastError('Arquivo muito grande', 'Máximo 50 MB por arquivo.')
        return
      }
      addKnowledgeFile({
        name: file.name,
        size: formatFileSize(file.size),
        category: 'Produto',
      })
      success('Upload iniciado', `${file.name} está sendo processado.`)
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const stats = {
    total: knowledgeFiles.length,
    processed: knowledgeFiles.filter(f => f.status === 'processed').length,
    chunks: knowledgeFiles.filter(f => f.status === 'processed').reduce((s, f) => s + f.chunks, 0),
    cats: new Set(knowledgeFiles.map(f => f.category)).size,
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.doc,.txt,.xlsx,.csv,.pptx"
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de Arquivos', value: stats.total, color: 'text-violet-400' },
          { label: 'Processados', value: stats.processed, color: 'text-emerald-400' },
          { label: 'Chunks Indexados', value: stats.chunks, color: 'text-blue-400' },
          { label: 'Categorias', value: stats.cats, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Upload + Categories */}
        <div className="space-y-4">
          {/* Upload zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all duration-200 cursor-pointer ${
              dragging
                ? 'border-primary bg-primary/10 scale-[1.01]'
                : 'border-border hover:border-primary/50 hover:bg-primary/5'
            }`}
          >
            <motion.div
              animate={{ y: dragging ? -4 : 0 }}
              className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center"
            >
              <Upload className="w-6 h-6 text-primary" />
            </motion.div>
            <div className="text-center">
              <p className="text-sm font-semibold">{dragging ? 'Solte para enviar' : 'Soltar arquivos aqui'}</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT, XLSX, CSV, PPTX (máx. 50 MB)</p>
            </div>
            <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}>
              <Plus className="w-3.5 h-3.5" /> Selecionar Arquivo
            </Button>
          </div>

          {/* Categories */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Folder className="w-4 h-4 text-muted-foreground" /> Categorias
            </h3>
            <div className="space-y-1">
              {categories.map((cat) => {
                const count = cat === 'Todos' ? knowledgeFiles.length : knowledgeFiles.filter(f => f.category === cat).length
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeCategory === cat ? 'bg-primary/10 text-primary' : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5" /> {cat}
                    </div>
                    {count > 0 && <span className="text-xs font-medium">{count}</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Files list */}
        <div className="xl:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar arquivo..." className="pl-9 h-8 text-xs" />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <FileText className="w-10 h-10 opacity-20" />
              <p className="text-sm">Nenhum arquivo encontrado</p>
              <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => fileInputRef.current?.click()}>
                <Plus className="w-3.5 h-3.5" /> Adicionar arquivo
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((file, i) => {
                const status = statusConfig[file.status]
                const StatusIcon = status.icon
                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">{file.size}</span>
                        <span className="text-xs text-muted-foreground">· {file.date}</span>
                        {file.status === 'processing' && (
                          <div className="flex items-center gap-2">
                            <Progress value={file.progress ?? 0} className="h-1 w-20" />
                            <span className="text-[10px] text-muted-foreground">{file.progress ?? 0}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="info" className="text-[10px] shrink-0">{file.category}</Badge>
                    <div className={`flex items-center gap-1 text-xs shrink-0 ${status.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span className="hidden sm:block">
                        {file.status === 'processed' ? `${file.chunks} chunks` : status.label}
                      </span>
                    </div>
                    <div className="relative">
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                        onClick={() => setOpenMenu(openMenu === file.id ? null : file.id)}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                      {openMenu === file.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                          <div className="absolute right-0 top-8 z-20 bg-card border border-border rounded-lg shadow-xl w-36 overflow-hidden">
                            <button
                              onClick={() => { setDeleteId(file.id); setOpenMenu(null) }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-red-500/10 text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Excluir
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) { deleteKnowledgeFile(deleteId); setDeleteId(null) } }}
        title="Excluir arquivo"
        message="O arquivo será removido da base de conhecimento."
        confirmLabel="Excluir"
        danger
      />
    </motion.div>
  )
}
