"use client"
import { useEffect, useRef }      from "react"
import Editor, { useMonaco }      from "@monaco-editor/react"
import { useTheme }               from "next-themes"
import type { CompileResult }     from "@/hooks/use-compiler"
import type { editor } from "monaco-editor"

export const STARTER_CODE = `/* Programa de ejemplo BMLang */
MAIN{
    DEC x, y, resultado;
    INPUT x;
    INPUT y;
    resultado = x + y * 2;
    IF(resultado > 10){
        OUTPUT resultado
    }
    ELSE{
        resultado = resultado ** 2;
        OUTPUT resultado
    }
}`

function parseErrors(errStr: string) {
  const out: { line: number; message: string }[] = []
  for (const raw of errStr.split("\n")) {
    const m = raw.match(/\(lin[eé]a\s+(\d+)\)\s*:?\s*(.+)/i)
    if (m) out.push({ line: parseInt(m[1], 10), message: m[2].trim() })
  }
  return out
}

function registerBMLang(monaco: NonNullable<ReturnType<typeof useMonaco>>) {
  const LANG = "bmlang"
  if (monaco.languages.getLanguages().some(l => l.id === LANG)) return

  monaco.languages.register({ id: LANG, extensions: [".ml"] })

  monaco.languages.setMonarchTokensProvider(LANG, {
    keywords: ["MAIN", "DEC", "INPUT", "OUTPUT", "IF", "ELSE"],
    tokenizer: {
      root: [
        [/\/\*/,                  "comment", "@comment"],
        [/\d+/,                   "number"],
        [/[a-zA-Z][a-zA-Z0-9]*/, { cases: { "@keywords": "keyword", "@default": "identifier" } }],
        [/\*\*|<=|>=|==|<>|&&|\|\|/, "operator.double"],
        [/[+\-*/=<>]/,            "operator"],
        [/[{}()\[\];,]/,          "delimiter"],
        [/[ \t\r\n]+/,            "white"],
      ],
      comment: [
        [/[^/*]+/, "comment"],
        [/\*\//,   "comment", "@pop"],
        [/[/*]/,   "comment"],
      ],
    },
  })

  /* Tema oscuro */
  monaco.editor.defineTheme("bmlang-dark", {
    base: "vs-dark", inherit: true,
    rules: [
      { token: "keyword",         foreground: "3dd68c", fontStyle: "bold"   },
      { token: "identifier",      foreground: "c9d1d9"                       },
      { token: "number",          foreground: "79c0ff"                       },
      { token: "operator.double", foreground: "2dd4bf"                       },
      { token: "operator",        foreground: "8b949e"                       },
      { token: "delimiter",       foreground: "8b949e"                       },
      { token: "comment",         foreground: "484f58", fontStyle: "italic"  },
    ],
    colors: {
      "editor.background":               "#0d1117",
      "editor.foreground":               "#c9d1d9",
      "editor.lineHighlightBackground":  "#161b22",
      "editor.selectionBackground":      "#264f7840",
      "editorLineNumber.foreground":     "#30363d",
      "editorLineNumber.activeForeground": "#3dd68c",
      "editorGutter.background":         "#0d1117",
      "editorCursor.foreground":         "#3dd68c",
      "editorBracketMatch.background":   "#3dd68c20",
      "editorBracketMatch.border":       "#3dd68c80",
      "editorIndentGuide.background1":   "#21262d",
    },
  })

  /* Tema claro */
  monaco.editor.defineTheme("bmlang-light", {
    base: "vs", inherit: true,
    rules: [
      { token: "keyword",         foreground: "1a9e6e", fontStyle: "bold"   },
      { token: "identifier",      foreground: "1f2328"                       },
      { token: "number",          foreground: "0550ae"                       },
      { token: "operator.double", foreground: "0d8a7a"                       },
      { token: "operator",        foreground: "57606a"                       },
      { token: "delimiter",       foreground: "57606a"                       },
      { token: "comment",         foreground: "8c959f", fontStyle: "italic"  },
    ],
    colors: {
      "editor.background":               "#ffffff",
      "editor.foreground":               "#1f2328",
      "editor.lineHighlightBackground":  "#f6f8fa",
      "editor.selectionBackground":      "#1a9e6e20",
      "editorLineNumber.foreground":     "#d0d7de",
      "editorLineNumber.activeForeground": "#1a9e6e",
      "editorGutter.background":         "#f6f8fa",
      "editorCursor.foreground":         "#1a9e6e",
      "editorBracketMatch.background":   "#1a9e6e18",
      "editorBracketMatch.border":       "#1a9e6e80",
    },
  })

  /* Autocompletado */
  monaco.languages.registerCompletionItemProvider(LANG, {
    provideCompletionItems: (model, pos) => {
      const word  = model.getWordUntilPosition(pos)
      const range = { startLineNumber: pos.lineNumber, endLineNumber: pos.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn }
      return {
        suggestions: [
          { label: "MAIN",   detail: "Bloque principal",     insertText: "MAIN{\n\t$0\n}"                        },
          { label: "DEC",    detail: "Declarar variables",   insertText: "DEC $0;"                                },
          { label: "INPUT",  detail: "Leer variable",        insertText: "INPUT $0;"                              },
          { label: "OUTPUT", detail: "Imprimir variable",    insertText: "OUTPUT $0;"                             },
          { label: "IF",     detail: "Condicional",          insertText: "IF($1){\n\t$0\n}"                       },
          { label: "IFELSE", detail: "Condicional con else", insertText: "IF($1){\n\t$2\n}\nELSE{\n\t$0\n}"      },
        ].map(s => ({
          ...s,
          kind:            monaco.languages.CompletionItemKind.Keyword,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        })),
      }
    },
  })
}

interface BMLangEditorProps {
  value:    string
  onChange: (v: string) => void
  result:   CompileResult | null
}

export function BMLangEditor({ value, onChange, result }: BMLangEditorProps) {
  const monaco         = useMonaco()
  const { resolvedTheme } = useTheme()
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  useEffect(() => { if (monaco) registerBMLang(monaco) }, [monaco])

  useEffect(() => {
    if (!monaco) return
    monaco.editor.setTheme(resolvedTheme === "dark" ? "bmlang-dark" : "bmlang-light")
  }, [monaco, resolvedTheme])

  useEffect(() => {
    if (!monaco || !editorRef.current) return
    const model = editorRef.current.getModel()
    if (!model) return

    if (!result || result.success || !result.errors) {
      monaco.editor.setModelMarkers(model, "bmlang", [])
      return
    }

    const parsed  = parseErrors(result.errors)
    const markers = parsed.map(({ line, message }) => ({
      severity:        monaco.MarkerSeverity.Error,
      message,
      startLineNumber: line,
      endLineNumber:   line,
      startColumn:     1,
      endColumn:       model.getLineMaxColumn(line) || 999,
    }))

    monaco.editor.setModelMarkers(model, "bmlang", markers)
    if (parsed.length > 0) editorRef.current.revealLineInCenter(parsed[0].line)
  }, [monaco, result])

  const monacoTheme = resolvedTheme === "dark" ? "bmlang-dark" : "bmlang-light"

  return (
    <Editor
      height="100%"
      language="bmlang"
      value={value}
      theme={monacoTheme}
      onChange={v => onChange(v ?? "")}
      onMount={ed => { editorRef.current = ed }}
      options={{
        fontSize:                14,
        lineHeight:              22,
        fontFamily:              "'Fira Code', 'Cascadia Code', Consolas, monospace",
        fontLigatures:           true,
        minimap:                 { enabled: false },
        lineNumbers:             "on",
        lineNumbersMinChars:     3,
        scrollBeyondLastLine:    false,
        automaticLayout:         true,
        tabSize:                 4,
        wordWrap:                "on",
        padding:                 { top: 16, bottom: 16 },
        bracketPairColorization: { enabled: true },
        renderLineHighlight:     "gutter",
        cursorBlinking:          "smooth",
        cursorSmoothCaretAnimation: "on",
        smoothScrolling:         true,
        scrollbar:               { verticalScrollbarSize: 5, horizontalScrollbarSize: 5 },
        overviewRulerLanes:      0,
        guides:                  { indentation: true, bracketPairs: false },
        suggest:                 { showKeywords: true },
      }}
    />
  )
}
