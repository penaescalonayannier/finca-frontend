// src/types/Finca.ts

export interface Finca {
  id?: string
  code: string
  name: string
  description?: string
}

export interface FincaRequest {
  code: string
  name: string
  description?: string
}

export interface FincaResponse {
  id: string
  code: string
  name: string
  description: string
}