import { z } from 'zod'

export const loginSchema = z.object({
  dni: z
    .string()
    .trim()
    .regex(/^\d{8}$/, 'El DNI tiene 8 dígitos.'),
  clave: z.string().min(1, 'Ingresa la clave.'),
})

export const faltanteSchema = z.object({
  ubicacion: z.string().trim().min(1, 'Indica la ubicación donde buscaste.'),
})

export const asignacionSchema = z.object({
  codigo: z.string().trim().min(1, 'Elige una hoja.'),
  destino: z.string().trim().min(1, 'Elige un operario.'),
})
