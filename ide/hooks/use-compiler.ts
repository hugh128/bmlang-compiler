"use client"
import { useState, useCallback } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"

export interface CompileResult {
  success: boolean
  output: string
  errors: string
  duration: number
}

export function useCompiler() {
  const [result, setResult]     = useState<CompileResult | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const compile = useCallback(async (code: string) => {
    if (!code.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/compiler/compile`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ code }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message ?? `Error ${res.status}`)
      }
      const data: CompileResult = await res.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message ?? "Error al conectar con la API")
    } finally {
      setLoading(false)
    }
  }, [])

  const compileFile = useCallback(async (file: File) => {
    setLoading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch(`${API_URL}/compiler/compile-file`, {
        method: "POST",
        body:   form,
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message ?? `Error ${res.status}`)
      }
      const data: CompileResult = await res.json()
      setResult(data)
      // Devolver el contenido del archivo para mostrarlo en el editor
      return await file.text()
    } catch (err: any) {
      setError(err.message ?? "Error al conectar con la API")
    } finally {
      setLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { result, loading, error, compile, compileFile, clear }
}
