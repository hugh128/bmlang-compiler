"use client"
import {
  CheckCircle2, XCircle, Clock,
  Terminal, AlertTriangle, ChevronRight,
} from "lucide-react"
import type { CompileResult } from "@/hooks/use-compiler"

interface OutputPanelProps {
  result:  CompileResult | null
  error:   string | null
  loading: boolean
}

interface ParsedError {
  line:    number
  message: string
  kind:    string
}
function parseErrors(errStr: string): ParsedError[] {
  const out: ParsedError[] = []
  for (const raw of errStr.split("\n")) {
    const m = raw.match(/\(linea\s+(\d+)\)\s*:?\s*(.+)/i)
    if (m) {
      const kind = /lexico|caracter/i.test(raw) ? "Léxico" : "Sintáctico"
      out.push({ line: parseInt(m[1], 10), message: m[2].trim(), kind })
    }
  }
  return out
}

function Line3Dir({ text }: { text: string }) {
  const t = text.trim()

  if (/^l\d+:$/.test(t))
    return <span style={{ color: "var(--c-amber)" }}>{text}</span>

  if (/^ifZ\b/.test(t)) {
    const m = t.match(/^(ifZ)\s+(\S+)\s+(goto)\s+(\S+)(;?)$/)
    if (m) return <>
      <span style={{ color: "var(--c-teal)" }}>{m[1]}</span>{" "}
      <span>{m[2]}</span>{" "}
      <span style={{ color: "var(--c-teal)" }}>{m[3]}</span>{" "}
      <span style={{ color: "var(--c-amber)" }}>{m[4]}</span>
      <span style={{ color: "var(--c-slate)" }}>{m[5]}</span>
    </>
  }

  if (/^goto\b/.test(t)) {
    const m = t.match(/^(goto)\s+(\S+)(;?)$/)
    if (m) return <>
      <span style={{ color: "var(--c-teal)" }}>{m[1]}</span>{" "}
      <span style={{ color: "var(--c-amber)" }}>{m[2]}</span>
      <span style={{ color: "var(--c-slate)" }}>{m[3]}</span>
    </>
  }

  if (/^(call|push|pop)\b/.test(t)) {
    const m = t.match(/^(call|push|pop)\s*(\S*)(;?)$/)
    if (m) return <>
      <span style={{ color: "var(--c-blue)" }}>{m[1]}</span>
      {m[2] && <>{" "}<span>{m[2]}</span></>}
      <span style={{ color: "var(--c-slate)" }}>{m[3]}</span>
    </>
  }

  if (/^t\d+\s*=/.test(t)) {
    const idx = t.indexOf("=")
    return <>
      <span style={{ color: "var(--c-green)" }}>{t.slice(0, idx).trim()}</span>
      <span style={{ color: "var(--c-slate)" }}> = </span>
      <span>{t.slice(idx + 1).trim()}</span>
    </>
  }

  if (/^[a-zA-Z]\w*\s*=/.test(t)) {
    const idx = t.indexOf("=")
    return <>
      <span>{t.slice(0, idx).trim()}</span>
      <span style={{ color: "var(--c-slate)" }}> = </span>
      <span>{t.slice(idx + 1).trim()}</span>
    </>
  }

  if (t.startsWith("/*"))
    return <span style={{ color: "var(--c-slate)", fontStyle: "italic" }}>{text}</span>

  return <span>{text}</span>
}

export function OutputPanel({ result, error, loading }: OutputPanelProps) {
  const parsedErrors = result?.errors ? parseErrors(result.errors) : []
  const outputLines  = result?.output?.split("\n").filter(Boolean) ?? []

  const isSuccess = result?.success === true
  const isError   = result?.success === false

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--output-bg)" }}>

      {/* ── Tab / header ── */}
      <div className="flex items-center h-9 border-b border-border flex-shrink-0"
        style={{ background: "var(--toolbar-bg)" }}>

        <div className="flex items-center gap-1.5 px-4 h-full border-b-2 text-xs font-medium"
          style={{ borderColor: "var(--c-green)", color: "var(--c-green)" }}>
          <Terminal className="w-3 h-3" strokeWidth={2} />
          Salida — Código 3 Direcciones
        </div>

        <div className="ml-auto px-4 flex items-center gap-3">
          {result && !loading && (
            <>
              {isSuccess && (
                <span className="flex items-center gap-1 text-xs font-medium"
                  style={{ color: "var(--c-green)" }}>
                  <CheckCircle2 className="w-3 h-3" />
                  {outputLines.length} instrucciones generadas
                </span>
              )}
              {isError && (
                <span className="flex items-center gap-1 text-xs font-medium"
                  style={{ color: "var(--c-red)" }}>
                  <XCircle className="w-3 h-3" />
                  {parsedErrors.length > 0
                    ? `${parsedErrors.length} error${parsedErrors.length !== 1 ? "es" : ""}`
                    : "Error de compilación"}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" strokeWidth={1.5} />
                {result.duration}ms
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Cuerpo ── */}
      <div className="flex-1 overflow-auto">

        {/* Placeholder inicial */}
        {!result && !error && !loading && (
          <div className="h-full flex flex-col items-center justify-center gap-3 select-none">
            <Terminal className="w-8 h-8 text-muted-foreground opacity-20" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground mb-1">Sin resultados</p>
              <p className="text-xs text-muted-foreground">
                Presiona{" "}
                <span className="font-semibold" style={{ color: "var(--c-green)" }}>
                  Compilar
                </span>{" "}
                para generar código de 3 direcciones
              </p>
            </div>
          </div>
        )}

        {/* Cargando */}
        {loading && (
          <div className="h-full flex items-center justify-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--c-green)", borderTopColor: "transparent" }} />
            <span className="text-sm text-muted-foreground">Compilando…</span>
          </div>
        )}

        {/* Error de red / conexión */}
        {error && !loading && (
          <div className="m-4 rounded-lg border p-4"
            style={{ borderColor: "var(--c-red-dim)", background: "var(--c-red-dim)" }}>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--c-red)" }}>
              No se pudo conectar con la API
            </p>
            <p className="text-xs font-mono text-muted-foreground mb-3">{error}</p>
            <div className="text-xs text-muted-foreground border-t border-border pt-2">
              Asegúrate de que la API esté corriendo en la carpeta{" "}
              <code className="px-1 py-0.5 rounded" style={{ background: "hsl(var(--muted))" }}>
                api/
              </code>
              :
              <br />
              <code className="text-xs" style={{ color: "var(--c-green)" }}>
                npm run build && npm run start:prod
              </code>
            </div>
          </div>
        )}

        {/* ── ÉXITO: código de 3 direcciones ── */}
        {result && !loading && isSuccess && (
          <div className="p-4">
            <div className="rounded-lg overflow-hidden border border-border">
              {/* Barra de título del bloque de código */}
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border"
                style={{ background: "hsl(var(--muted))" }}>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--c-green)" }} />
                </div>
                <span className="text-xs text-muted-foreground font-mono ml-1">
                  output.3dir
                </span>
              </div>

              {/* Líneas numeradas */}
              <div style={{ background: "var(--editor-bg)" }}>
                {outputLines.map((line, i) => (
                  <div key={i}
                    className="flex hover:bg-foreground/[0.025] transition-colors">
                    <span
                      className="select-none w-10 flex-shrink-0 text-right pr-3 py-0.5
                                 text-xs font-mono leading-6"
                      style={{ color: "var(--c-slate)", opacity: 0.45, background: "var(--gutter-bg)" }}
                    >
                      {i + 1}
                    </span>
                    <span className="px-4 py-0.5 text-sm font-mono leading-6">
                      <Line3Dir text={line} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ERROR: lista de errores del compilador ── */}
        {result && !loading && isError && (
          <div className="p-4 space-y-3">

            {result.output?.trim() && (
              <div className="rounded-lg overflow-hidden border border-border">
                <div className="px-3 py-1.5 border-b border-border text-xs text-muted-foreground"
                  style={{ background: "hsl(var(--muted))" }}>
                  Salida parcial — antes del error
                </div>
                <pre className="p-3 text-xs font-mono text-muted-foreground whitespace-pre-wrap"
                  style={{ background: "var(--editor-bg)" }}>
                  {result.output}
                </pre>
              </div>
            )}

            {/* Bloque de errores */}
            <div className="rounded-lg overflow-hidden border"
              style={{ borderColor: "var(--c-red-dim)" }}>

              {/* Header */}
              <div className="flex items-center gap-2 px-3 py-2 border-b"
                style={{ background: "var(--c-red-dim)", borderColor: "var(--c-red-dim)" }}>
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: "var(--c-red)" }} />
                <span className="text-xs font-semibold" style={{ color: "var(--c-red)" }}>
                  {parsedErrors.length > 0
                    ? `${parsedErrors.length} error${parsedErrors.length !== 1 ? "es" : ""} encontrado${parsedErrors.length !== 1 ? "s" : ""}`
                    : "Error de compilación"}
                </span>
              </div>

              {parsedErrors.length > 0 && (
                <div style={{ background: "var(--output-bg)" }}>
                  {parsedErrors.map(({ line, message, kind }, i) => (
                    <div key={i}
                      className="flex items-start gap-3 px-4 py-3
                                 border-b border-border last:border-0
                                 hover:bg-red-500/5 transition-colors">
                      <ChevronRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                        style={{ color: "var(--c-red)" }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded font-mono"
                            style={{ background: "var(--c-red-dim)", color: "var(--c-red)" }}>
                            Línea {line}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Error {kind}
                          </span>
                        </div>
                        <p className="text-sm font-mono break-all"
                          style={{ color: "var(--c-red)" }}>
                          {message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {parsedErrors.length === 0 && result.errors?.trim() && (
                <pre className="p-4 text-xs font-mono whitespace-pre-wrap"
                  style={{ color: "var(--c-red)", background: "var(--output-bg)" }}>
                  {result.errors}
                </pre>
              )}

              {parsedErrors.length === 0 && !result.errors?.trim() && (
                <div className="p-4" style={{ background: "var(--output-bg)" }}>
                  <p className="text-xs text-muted-foreground mb-2">
                    El compilador terminó con error pero no generó un mensaje específico.
                    Posibles causas:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>El programa está incompleto (falta cerrar una llave o paréntesis)</li>
                    <li>Hay un carácter no reconocido por el lexer</li>
                    <li>La API no tiene el binario compilado — ejecuta{" "}
                      <code className="px-1 py-0.5 rounded"
                        style={{ background: "hsl(var(--muted))" }}>
                        make
                      </code>
                      {" "}en la carpeta{" "}
                      <code className="px-1 py-0.5 rounded"
                        style={{ background: "hsl(var(--muted))" }}>
                        compiler/
                      </code>
                    </li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-3">
                    Revisa la consola de la API para ver el log completo.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
