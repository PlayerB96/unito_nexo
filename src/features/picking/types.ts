export type Rol = 'operario' | 'auxiliar' | 'supervisor' | 'administrador'

export type Acceso = 'ejecutar' | 'asignar' | 'reasignar' | 'reportar' | 'administrar'

export type Sesion = {
  dni: string
  rol: Rol
  etiqueta: string
}

export type UsuarioPrueba = {
  dni: string
  clave: string
  rol: Rol
  etiqueta: string
}

export type Requisicion = 'N' | 'R'

export type EstadoHoja = 'libre' | 'asignada' | 'atendida'

export type HojaCola = {
  codigo: string
  area: string
  lineas: number
  semana: number
  requisicion: Requisicion
  asignadaA: string | null
  porRetirar: number
  retiradas: number
  pendientes: number
  faltantes: number
}

export type EstadoLinea = 'asignada' | 'retirada' | 'pendiente_produccion'

export type Linea = {
  id: string
  sku: string
  descripcion: string
  cantidad: number
  unidad: string
  ubicacion: string
  lote: string
  ordenProduccion: string
  estado: EstadoLinea
  reubicada: boolean
  ubicacionAnterior: string | null
  loteAnterior: string | null
}

export type Pendiente = {
  id: string
  sku: string
  descripcion: string
  cantidad: number
  unidad: string
  ordenProduccion: string
  motivo: string
}

export type Faltante = {
  id: string
  ubicacion: string
  sku: string
  descripcion: string
  lote: string
}

export type TonoEvento = 'info' | 'success' | 'warning' | 'error'

export type Evento = {
  id: string
  titulo: string
  detalle: string
  tono: TonoEvento
}

export type Hoja = {
  codigo: string
  turno: string
  fecha: string
  lineas: Linea[]
}

export type Cobertura = {
  ubicacion: string
  lote: string
  ordenProduccion: string
}
