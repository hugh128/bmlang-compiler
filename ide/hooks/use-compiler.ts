"use client"
import { useState, useCallback } from "react"
import axios, { AxiosError } from "axios"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api",
  headers: { "Content-Type": "application/json" },
})

export interface CompileResult {
  success:  boolean
  output:   string
  errors:   string
  duration: number
}

export function useCompiler() {
  const [result, setResult]   = useState<CompileResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  // Extrae el mensaje de error
  const extractError = (err: unknown): string => {
    if (err instanceof AxiosError)
      return err.response?.data?.message ?? `Error ${err.response?.status}`
    if (err instanceof Error)
      return err.message
    return "Error al conectar con la API"
  }

  // Compila código enviado como texto plano
  const compile = useCallback(async (code: string) => {
    if (!code.trim()) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post<CompileResult>("/compiler/compile", { code })
      setResult(data)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  // Compila un archivo .ml subido por el usuario
  const compileFile = useCallback(async (file: File) => {
    setLoading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append("file", file)

      const { data } = await api.post<CompileResult>("/compiler/compile-file", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      setResult(data)
      return await file.text()
    } catch (err) {
      setError(extractError(err))
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
