"use client"
import { useTheme } from "next-themes"
import { useRef }   from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Play, Sun, Moon, FolderOpen, Save, Trash2, Loader2 } from "lucide-react"

interface ToolbarProps {
  onCompile: () => void
  onOpen:    (file: File) => void
  onSave:    () => void
  onClear:   () => void
  loading:   boolean
  hasCode:   boolean
}

export function Toolbar({ onCompile, onOpen, onSave, onClear, loading, hasCode }: ToolbarProps) {
  const { theme, setTheme } = useTheme()
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <header
      className="flex items-center justify-between px-3 h-11 border-b border-border flex-shrink-0"
      style={{ background: "var(--toolbar-bg)" }}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--c-green)" }}
          >
            <span className="text-white text-[9px] font-black tracking-tight select-none">BM</span>
          </div>
          <div className="flex flex-col leading-none gap-0.5">
            <span className="text-xs font-semibold tracking-wide">BMLang IDE</span>
            <span className="text-[9px] text-muted-foreground leading-none">Compiladores 2026</span>
          </div>
        </div>

        <div className="w-px h-4 bg-border mx-0.5" />

        {/* Acciones */}
        <div className="flex items-center">
          {/* eslint-disable-next-line react-hooks/refs */}
          {[
            { icon: FolderOpen, label: "Abrir",   tip: "Abrir archivo .ml",  onClick: () => fileRef.current?.click(), disabled: false,     danger: false },
            { icon: Save,       label: "Guardar",  tip: "Guardar como .ml",   onClick: onSave,                         disabled: !hasCode,  danger: false },
            { icon: Trash2,     label: "Limpiar",  tip: "Limpiar todo",       onClick: onClear,                        disabled: !hasCode,  danger: true  },
          ].map(({ icon: Icon, label, tip, onClick, disabled, danger }) => (
            <Tooltip key={label}>
              <TooltipTrigger asChild>
                <button
                  onClick={onClick}
                  disabled={disabled}
                  className={[
                    "flex items-center gap-1.5 px-2.5 h-7 rounded text-xs font-medium transition-colors",
                    "disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer",
                    danger
                      ? "text-muted-foreground hover:text-red-500 hover:bg-red-500/8"
                      : "text-muted-foreground hover:text-foreground hover:bg-foreground/6",
                  ].join(" ")}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
                  <span>{label}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">{tip}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* ── Compilar ── */}
      <button
        onClick={onCompile}
        disabled={loading || !hasCode}
        className="flex items-center gap-2 px-4 h-7 rounded-md text-xs font-semibold
          text-white transition-all active:scale-95 cursor-pointer
          disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
        style={{
          background: loading || !hasCode
            ? "hsl(var(--muted-foreground) / 0.3)"
            : "var(--c-green)",
        }}
      >
        {loading
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <Play    className="w-3.5 h-3.5" strokeWidth={2.5} />}
        {loading ? "Compilando…" : "Compilar"}
      </button>

      {/* ── Tema ── */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative w-7 h-7 rounded flex items-center justify-center
              text-muted-foreground hover:text-foreground hover:bg-foreground/6
              transition-colors cursor-pointer"
          >
            <Sun  className="w-3.5 h-3.5 absolute rotate-0 scale-100 dark:-rotate-90 dark:scale-0 transition-all" />
            <Moon className="w-3.5 h-3.5 absolute rotate-90 scale-0 dark:rotate-0 dark:scale-100 transition-all" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {theme === "dark" ? "Modo claro" : "Modo oscuro"}
        </TooltipContent>
      </Tooltip>

      <input ref={fileRef} type="file" accept=".ml" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onOpen(f); e.target.value = "" }} />
    </header>
  )
}
