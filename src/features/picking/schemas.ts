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
  codigos: z.array(z.string().trim().min(1)).min(1, 'Elige al menos una hoja.'),
  destino: z.string().trim().min(1, 'Elige un operario.'),
})

export const cuentaSchema = z.object({
  nombre: z.string().trim().min(1, 'Indica el nombre.'),
  dni: z
    .string()
    .trim()
    .regex(/^\d{8}$/, 'El DNI tiene 8 dígitos.'),
  clave: z.string().min(1, 'Ingresa la clave.'),
  rol: z.enum(['operario', 'auxiliar', 'supervisor', 'administrador'], {
    error: 'Elige un rol.',
  }),
})
