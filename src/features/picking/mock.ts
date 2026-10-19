import type {
  Cobertura,
  EstadoHoja,
  Evento,
  Hoja,
  HojaCola,
  Pendiente,
  UsuarioPrueba,
} from './types'

export const USUARIOS: UsuarioPrueba[] = [
  { dni: '76373169', clave: '123', rol: 'operario', etiqueta: 'Operario' },
  { dni: '70000002', clave: '123', rol: 'auxiliar', etiqueta: 'Auxiliar' },
  { dni: '70000003', clave: '123', rol: 'supervisor', etiqueta: 'Supervisor' },
  { dni: '70000004', clave: '123', rol: 'administrador', etiqueta: 'Administrador' },
]

export type IdPuesto = 'picking' | 'ingresos' | 'distribucion'

export type PuestoAlmacen = {
  id: IdPuesto
  etiqueta: string
  personas: string[]
}

export const PUESTOS: PuestoAlmacen[] = [
  {
    id: 'picking',
    etiqueta: 'Almacenero de picking e inventario',
    personas: [
      'Paola Carmela Castro',
      'Edgar Grisaldo Huaman',
      'Yuliana Mabel Tomapasca',
      'Josue Alonoso Pere',
    ],
  },
  {
    id: 'ingresos',
    etiqueta: 'Almacenero de ingresos',
    personas: ['Juan Jesus Mantilla'],
  },
  {
    id: 'distribucion',
    etiqueta: 'Almacenero de distribución',
    personas: ['Sebastian Williams Cubas'],
  },
]

export const DESTINOS = PUESTOS.flatMap((puesto) => puesto.personas)

export function semanaIso(fecha = new Date()): number {
  const dia = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()))
  const diaSemana = dia.getUTCDay() || 7
  dia.setUTCDate(dia.getUTCDate() + 4 - diaSemana)
  const inicioAnio = new Date(Date.UTC(dia.getUTCFullYear(), 0, 1))
  return Math.ceil(((dia.getTime() - inicioAnio.getTime()) / 86_400_000 + 1) / 7)
}

export function semanasAsignables(fecha = new Date()): [number, number] {
  const actual = semanaIso(fecha)
  return [actual, actual + 1]
}

export function estadoDeHoja(hoja: HojaCola): EstadoHoja {
  if (hoja.porRetirar === 0 && hoja.retiradas > 0) return 'atendida'
  if (hoja.asignadaA) return 'asignada'
  return 'libre'
}

/** Muestra de Mercaderia_202643: un bloque Excel = un estilo con su ubicación. */
const MERCADERIA_MUESTRA: Array<{
  estilo: string
  tipo: string
  segmento: string
  ubicacion: string
  lineas: number
  pedido: number
}> = [
  { estilo: 'GVB-2', tipo: 'POLO', segmento: 'CABALLERO', ubicacion: 'A22-N2-C16-P2', lineas: 1, pedido: 12 },
  { estilo: 'MTM-278', tipo: 'POLO', segmento: 'CABALLERO', ubicacion: 'F30-N2-C1-P4', lineas: 1, pedido: 5 },
  { estilo: 'MTM-272', tipo: 'POLO', segmento: 'NIÑA', ubicacion: 'H19-N4-C1-P4', lineas: 2, pedido: 58 },
  { estilo: 'VGFA-22', tipo: 'POLO', segmento: 'NIÑA', ubicacion: 'H25-N5-C1-P5', lineas: 3, pedido: 90 },
  { estilo: 'THE CULT-117', tipo: 'CAMISA', segmento: 'CABALLERO', ubicacion: 'H30-N5-C1-P5', lineas: 1, pedido: 5 },
  { estilo: 'HWK-764', tipo: 'POLERA', segmento: 'CABALLERO', ubicacion: '3NIVEL 30', lineas: 3, pedido: 8 },
  { estilo: 'HWK-763', tipo: 'POLERA', segmento: 'CABALLERO', ubicacion: '3NIVEL 54', lineas: 1, pedido: 2 },
  { estilo: 'HWK-774', tipo: 'POLERA', segmento: 'CABALLERO', ubicacion: '3NIVEL C01', lineas: 3, pedido: 6 },
  { estilo: 'HWK-773', tipo: 'POLERA', segmento: 'CABALLERO', ubicacion: '3NIVEL C100', lineas: 1, pedido: 2 },
  { estilo: 'HWK-767', tipo: 'CASACA', segmento: 'CABALLERO', ubicacion: '3NIVEL C16', lineas: 1, pedido: 2 },
  { estilo: 'HWK-770', tipo: 'CASACA', segmento: 'CABALLERO', ubicacion: '3NIVEL C62', lineas: 1, pedido: 3 },
  { estilo: 'HWK-768', tipo: 'CASACA', segmento: 'CABALLERO', ubicacion: '3NIVEL C84', lineas: 1, pedido: 2 },
  { estilo: 'GAZO-311', tipo: 'POLO', segmento: 'DAMA', ubicacion: 'A02-N2-C1-P1', lineas: 5, pedido: 1103 },
  { estilo: 'BLAS-57.26', tipo: 'SHORT', segmento: 'DAMA', ubicacion: 'A02-N2-C1-P1', lineas: 2, pedido: 520 },
  { estilo: 'IMCH-64', tipo: 'CASACA', segmento: 'CABALLERO', ubicacion: 'A05-N1-C1-P1', lineas: 2, pedido: 4 },
  { estilo: 'IMCH-40', tipo: 'CASACA', segmento: 'CABALLERO', ubicacion: 'A09-N1-C1-P1', lineas: 1, pedido: 2 },
  { estilo: 'IMCH-51', tipo: 'CHALECO', segmento: 'CABALLERO', ubicacion: 'A11-N3-C1-P1', lineas: 4, pedido: 8 },
  { estilo: 'IMCH-42', tipo: 'CASACA', segmento: 'CABALLERO', ubicacion: 'A12-N4-C1-P1', lineas: 1, pedido: 2 },
  { estilo: 'FLORIDA-1231', tipo: 'PANTALON', segmento: 'CABALLERO', ubicacion: 'A13-N1-C1-P1', lineas: 24, pedido: 805 },
  { estilo: 'ZARAITH-756', tipo: 'POLO', segmento: 'NIÑA', ubicacion: 'J08-N3-C1-P5', lineas: 1, pedido: 2 },
  { estilo: 'ZARAITH-756.1', tipo: 'POLO', segmento: 'NIÑA', ubicacion: 'J08-N3-C1-P5', lineas: 3, pedido: 8 },
  { estilo: 'ZARAITH-744', tipo: 'POLO', segmento: 'NIÑA', ubicacion: 'J13-N3-C2-P5', lineas: 1, pedido: 2 },
  { estilo: 'ZARAITH-744.1', tipo: 'POLO', segmento: 'NIÑA', ubicacion: 'J13-N3-C2-P5', lineas: 4, pedido: 10 },
  { estilo: 'BEST BOY-318', tipo: 'POLO', segmento: 'NIÑO', ubicacion: 'A17-N1-C1-P2', lineas: 5, pedido: 10 },
  { estilo: 'ARV-1828', tipo: 'POLO', segmento: 'NIÑO', ubicacion: 'A18-N2-C03-P2', lineas: 1, pedido: 2 },
  { estilo: 'ARV-1728', tipo: 'POLO', segmento: 'NIÑO', ubicacion: 'A18-N2-C04-P2', lineas: 1, pedido: 2 },
  { estilo: 'ARV-1608', tipo: 'POLO', segmento: 'NIÑO', ubicacion: 'A18-N2-C04-P2', lineas: 1, pedido: 2 },
  { estilo: 'FLORIDA-1137', tipo: 'PANTALON', segmento: 'NIÑO', ubicacion: 'H21-N1-C2-P5', lineas: 2, pedido: 4 },
  { estilo: 'HN-62.24.R12', tipo: 'POLO', segmento: 'CABALLERO', ubicacion: 'A21-N1-C1-P2', lineas: 20, pedido: 1136 },
  { estilo: 'HUACCHO-183', tipo: 'POLO', segmento: 'CABALLERO', ubicacion: 'A22-N2-C14-P2', lineas: 2, pedido: 20 },
]

export function crearCola(): HojaCola[] {
  const [actual, siguiente] = semanasAsignables()
  const cola: HojaCola[] = MERCADERIA_MUESTRA.map((item, indice) => {
    const lineas = item.lineas
    return {
      codigo: `HE-${2000 + indice}`,
      estilo: item.estilo,
      ubicacion: item.ubicacion,
      tipoPrenda: item.tipo,
      segmento: item.segmento,
      lineas,
      pedido: item.pedido,
      semana: actual,
      requisicion: indice % 5 === 0 ? 'R' : 'N',
      asignadaA: null,
      porRetirar: lineas,
      retiradas: 0,
      pendientes: 0,
      faltantes: 0,
    }
  })

  cola.push(
    {
      codigo: 'HE-2090',
      estilo: 'MTM-280',
      ubicacion: 'F30-N2-C1-P4',
      tipoPrenda: 'POLO',
      segmento: 'CABALLERO',
      lineas: 2,
      pedido: 14,
      semana: siguiente,
      requisicion: 'N',
      asignadaA: null,
      porRetirar: 2,
      retiradas: 0,
      pendientes: 0,
      faltantes: 0,
    },
    {
      codigo: 'HE-2091',
      estilo: 'HWK-780',
      ubicacion: '3NIVEL C20',
      tipoPrenda: 'POLERA',
      segmento: 'CABALLERO',
      lineas: 3,
      pedido: 9,
      semana: siguiente,
      requisicion: 'N',
      asignadaA: null,
      porRetirar: 3,
      retiradas: 0,
      pendientes: 0,
      faltantes: 0,
    },
    {
      codigo: 'HE-2092',
      estilo: 'ZARAITH-760',
      ubicacion: 'J08-N3-C1-P5',
      tipoPrenda: 'POLO',
      segmento: 'NIÑA',
      lineas: 4,
      pedido: 16,
      semana: siguiente,
      requisicion: 'R',
      asignadaA: null,
      porRetirar: 4,
      retiradas: 0,
      pendientes: 0,
      faltantes: 0,
    },
  )

  return cola
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
