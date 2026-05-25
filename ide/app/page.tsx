"use client"
import { useState, useCallback } from "react"
import { TooltipProvider }                    from "@/components/ui/tooltip"
import { Toolbar }                            from "@/components/ide/toolbar"
import { BMLangEditor, STARTER_CODE }         from "@/components/ide/bmlang-editor"
import { OutputPanel }                        from "@/components/ide/output-panel"
import { useCompiler }                        from "@/hooks/use-compiler"
import { FileCode2 }                          from "lucide-react"

export default function IDEPage() {
  const [code, setCode]         = useState(STARTER_CODE)
  const [fileName, setFileName] = useState("programa.ml")
  const { result, loading, error, compile, compileFile, clear } = useCompiler()

  const handleOpen = useCallback(async (file: File) => {
    setFileName(file.name)
    const content = await compileFile(file)
    if (content !== undefined) setCode(content)
  }, [compileFile])

  const handleSave = useCallback(() => {
    const blob = new Blob([code], { type: "text/plain" })
    const url  = URL.createObjectURL(blob)
    Object.assign(document.createElement("a"), { href: url, download: fileName }).click()
    URL.revokeObjectURL(url)
  }, [code, fileName])

  const handleClear = useCallback(() => {
    setCode("")
    setFileName("programa.ml")
    clear()
  }, [clear])

  const errorCount = (() => {
    if (!result?.errors) return 0
    return (result.errors.match(/\(lin[eé]a\s+\d+\)/gi) ?? []).length
  })()

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col h-screen overflow-hidden">

        <Toolbar
          onCompile={() => compile(code)}
          onOpen={handleOpen}
          onSave={handleSave}
          onClear={handleClear}
          loading={loading}
          hasCode={code.trim().length > 0}
        />

        <main className="flex flex-1 overflow-hidden">

          {/* Editor */}
          <div className="flex flex-col overflow-hidden" style={{ width: "50%", borderRight: "1px solid hsl(var(--border))" }}>
            {/* Tab */}
            <div className="flex items-center h-8 border-b border-border flex-shrink-0"
              style={{ background: "var(--toolbar-bg)" }}>
              <div className="flex items-center gap-1.5 px-4 h-full text-xs border-b-2"
                style={{
                  borderColor:     "var(--c-green)",
                  color:           "var(--c-green)",
                  background:      "var(--tab-active)",
                }}>
                <FileCode2 className="w-3 h-3" strokeWidth={2} />
                {fileName}
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <BMLangEditor value={code} onChange={setCode} result={result} />
            </div>
          </div>

          {/* Salida */}
          <div className="flex flex-col overflow-hidden" style={{ width: "50%" }}>
            <OutputPanel result={result} error={error} loading={loading} />
          </div>

        </main>

        {/* Status bar */}
        <footer
          className="flex items-center justify-between px-4 h-6 border-t border-border flex-shrink-0 text-xs text-muted-foreground"
          style={{ background: "var(--toolbar-bg)" }}
        >
          <span>BMLang IDE — Compiladores 2026</span>
          <div className="flex items-center gap-5">
            {result && (
              <span className="font-medium flex items-center gap-1"
                style={{ color: result.success ? "var(--c-green)" : "var(--c-red)" }}>
                {result.success
                  ? "✓ Compilado correctamente"
                  : `✗ ${errorCount} error${errorCount !== 1 ? "es" : ""}`}
              </span>
            )}
            <span>UTF-8</span>
            <span style={{ color: "var(--c-green)" }}>BMLang</span>
          </div>
        </footer>

      </div>
    </TooltipProvider>
  )
}
