import type { Cobertura, Evento, Hoja, HojaCola, Pendiente, UsuarioPrueba } from './types'

export const USUARIOS: UsuarioPrueba[] = [
  { dni: '76373169', clave: '123', rol: 'operario', etiqueta: 'Operario' },
  { dni: '70000002', clave: '123', rol: 'auxiliar', etiqueta: 'Auxiliar' },
  { dni: '70000003', clave: '123', rol: 'supervisor', etiqueta: 'Supervisor' },
  { dni: '70000004', clave: '123', rol: 'administrador', etiqueta: 'Administrador' },
]

export const DESTINOS = [
  'Operario de picking',
  'Operario de avíos',
  'Operario de telas',
  'Operario de distribución',
]

export function crearCola(): HojaCola[] {
  return [
    { codigo: 'HE-1042', area: 'Picking', lineas: 4, asignadaA: 'Operario de picking' },
    { codigo: 'HE-1048', area: 'Avíos', lineas: 6, asignadaA: null },
    { codigo: 'HE-1051', area: 'Telas', lineas: 3, asignadaA: null },
  ]
}

export const pendientesIniciales: Pendiente[] = [
  {
    id: 'pen-boton',
    sku: '550012',
    descripcion: 'Botón nácar 18 mm',
    cantidad: 200,
    unidad: 'und',
    ordenProduccion: 'OP-3072',
    motivo: 'Nunca tuvo cobertura de producción, por eso no entró en la hoja.',
  },
]

export function crearHoja(): Hoja {
  return {
    codigo: 'HE-1042',
    turno: 'Mañana',
    fecha: '5 oct 2026',
    lineas: [
      {
        id: 'ln-polo',
        sku: '104582',
        descripcion: 'Polo piqué blanco T/M',
        cantidad: 24,
        unidad: 'und',
        ubicacion: 'A-12-03',
        lote: 'L-441',
        ordenProduccion: 'OP-3108',
        estado: 'asignada',
        reubicada: false,
        ubicacionAnterior: null,
        loteAnterior: null,
      },
      {
        id: 'ln-cierre',
        sku: '220191',
        descripcion: 'Cierre metálico 20 cm',
        cantidad: 80,
        unidad: 'und',
        ubicacion: 'B-04-01',
        lote: 'L-118',
        ordenProduccion: 'OP-3114',
        estado: 'asignada',
        reubicada: false,
        ubicacionAnterior: null,
        loteAnterior: null,
      },
      {
        id: 'ln-hilo',
        sku: '331007',
        descripcion: 'Hilo poliéster negro',
        cantidad: 12,
        unidad: 'conos',
        ubicacion: 'B-07-02',
        lote: 'L-090',
        ordenProduccion: 'OP-3088',
        estado: 'asignada',
        reubicada: false,
        ubicacionAnterior: null,
        loteAnterior: null,
      },
      {
        id: 'ln-etiqueta',
        sku: '118440',
        descripcion: 'Etiqueta tejida de marca',
        cantidad: 500,
        unidad: 'und',
        ubicacion: 'D-01-02',
        lote: 'L-330',
        ordenProduccion: 'OP-3095',
        estado: 'asignada',
        reubicada: false,
        ubicacionAnterior: null,
        loteAnterior: null,
      },
    ],
  }
}

export const coberturas: Record<string, Cobertura | null> = {
  'ln-polo': null,
  'ln-cierre': {
    ubicacion: 'C-02-07',
    lote: 'L-205',
    ordenProduccion: 'OP-3114',
  },
  'ln-hilo': null,
  'ln-etiqueta': null,
}

export function eventoInicial(): Evento {
  return {
    id: 'ev-inicio',
    tono: 'info',
    titulo: 'Hoja HE-1042 asignada',
    detalle:
      'Nació completa: las cuatro líneas ya tenían cobertura de producción. El botón nácar 18 mm sigue pendiente y no entró en esta hoja.',
  }
}
