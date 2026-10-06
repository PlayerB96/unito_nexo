import { ClipboardList, LayoutDashboard, MapPin, Settings } from 'lucide-vue-next'
import type { Component } from 'vue'
import type { Acceso, Rol } from '../features/picking/types'

export type EntradaNav = {
  nombre: string
  titulo: string
  accesos: Acceso[]
  icono: Component
}

export const entradas: EntradaNav[] = [
  { nombre: 'extraccion', titulo: 'Extracción', accesos: ['ejecutar'], icono: MapPin },
  { nombre: 'asignacion', titulo: 'Asignación', accesos: ['asignar', 'reasignar'], icono: ClipboardList },
  { nombre: 'reportes', titulo: 'Dashboard', accesos: ['reportar'], icono: LayoutDashboard },
  { nombre: 'administracion', titulo: 'Administración', accesos: ['administrar'], icono: Settings },
]

const inicioPorRol: Record<Rol, string> = {
  operario: 'extraccion',
  auxiliar: 'asignacion',
  supervisor: 'reportes',
  administrador: 'extraccion',
}

export function inicioDeRol(rol: Rol) {
  return inicioPorRol[rol]
}
