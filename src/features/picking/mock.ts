import surtidoSem44Infantil from './data/surtido-sem44-infantil.json'
import type {
  Cobertura,
  EstadoHoja,
  Evento,
  Hoja,
  HojaCola,
  Linea,
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
      'Rosa Elena Quispe',
      'Luis Alberto Vargas',
      'Carmen Rosa Delgado',
      'Miguel Angel Rojas',
      'Ana Patricia Flores',
      'Carlos Enrique Soto',
      'Diana Marisol Peña',
      'Victor Hugo Salas',
      'Gloria Beatriz León',
      'Ricardo Javier Paredes',
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

/**
 * Familia = marca del EstiloProd (texto antes del número).
 * ARV-1912 → ARV, GUGGI-1115 → GUGGI, BEST BOY-318 → BEST BOY, ESSIE-792.S → ESSIE.
 */
export function familiaDeEstilo(estilo: string): string {
  const texto = estilo.trim().toUpperCase()
  const match = texto.match(/^(.+?)-\d+/)
  if (match) return match[1].trim()
  return texto.split(/[.\s]/)[0] ?? texto
}

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

type FilaSurtido = {
  estilo: string
  tipo: string
  segmento: string
  ubicacion: string
  lineas: number
  pedido: number
  requisicion: 'N' | 'R'
}

/** Formato de surtido SEM 44 infantil: un estilo = un ítem de cola (tallas agregadas). */
const MERCADERIA_SURTIDO = surtidoSem44Infantil as FilaSurtido[]

export function crearCola(): HojaCola[] {
  const [actual, siguiente] = semanasAsignables()
  const cola: HojaCola[] = MERCADERIA_SURTIDO.map((item, indice) => {
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
      requisicion: item.requisicion,
      asignadaA: null,
      porRetirar: lineas,
      retiradas: 0,
      pendientes: 0,
      faltantes: 0,
    }
  })

  // Semana siguiente: muestra corta para probar cambio de semana
  const muestraSiguiente = MERCADERIA_SURTIDO.filter((item) => item.pedido > 0).slice(0, 8)
  for (const [indice, item] of muestraSiguiente.entries()) {
    cola.push({
      codigo: `HE-${9000 + indice}`,
      estilo: item.estilo,
      ubicacion: item.ubicacion,
      tipoPrenda: item.tipo,
      segmento: item.segmento,
      lineas: item.lineas,
      pedido: item.pedido,
      semana: siguiente,
      requisicion: item.requisicion,
      asignadaA: null,
      porRetirar: item.lineas,
      retiradas: 0,
      pendientes: 0,
      faltantes: 0,
    })
  }

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

function lineaHoja(parte: {
  id: string
  sku: string
  estilo: string
  color: string
  talla: string
  descripcion: string
  pedido: number
  ubicacion: string
  lote: string
  ordenProduccion: string
}): Linea {
  return {
    ...parte,
    cantidad: parte.pedido,
    unidad: 'und',
    estado: 'asignada',
    reubicada: false,
    ubicacionAnterior: null,
    loteAnterior: null,
  }
}

export function crearHoja(): Hoja {
  return {
    codigo: 'HE-1042',
    turno: 'Mañana',
    fecha: '5 oct 2026',
    lineas: [
      lineaHoja({
        id: 'ln-essie-6-bl',
        sku: '80706101',
        estilo: 'ESSIE-807',
        color: 'BLANCO',
        talla: '6',
        descripcion: 'ENTERIZO NIÑA',
        pedido: 12,
        ubicacion: 'A-12-03',
        lote: 'L-441',
        ordenProduccion: 'OP-3108',
      }),
      lineaHoja({
        id: 'ln-essie-8-bl',
        sku: '80708101',
        estilo: 'ESSIE-807',
        color: 'BLANCO',
        talla: '8',
        descripcion: 'ENTERIZO NIÑA',
        pedido: 18,
        ubicacion: 'A-12-04',
        lote: 'L-441',
        ordenProduccion: 'OP-3108',
      }),
      lineaHoja({
        id: 'ln-essie-6-rs',
        sku: '80706102',
        estilo: 'ESSIE-807',
        color: 'ROSA',
        talla: '6',
        descripcion: 'ENTERIZO NIÑA',
        pedido: 10,
        ubicacion: 'A-12-05',
        lote: 'L-442',
        ordenProduccion: 'OP-3108',
      }),
      lineaHoja({
        id: 'ln-essie-10-rs',
        sku: '80710102',
        estilo: 'ESSIE-807',
        color: 'ROSA',
        talla: '10',
        descripcion: 'ENTERIZO NIÑA',
        pedido: 8,
        ubicacion: 'A-12-06',
        lote: 'L-442',
        ordenProduccion: 'OP-3108',
      }),
      lineaHoja({
        id: 'ln-arv-4-az',
        sku: '19120403',
        estilo: 'ARV-1912',
        color: 'AZUL',
        talla: '4',
        descripcion: 'POLO NIÑO',
        pedido: 20,
        ubicacion: 'B-04-01',
        lote: 'L-118',
        ordenProduccion: 'OP-3114',
      }),
      lineaHoja({
        id: 'ln-arv-6-az',
        sku: '19120603',
        estilo: 'ARV-1912',
        color: 'AZUL',
        talla: '6',
        descripcion: 'POLO NIÑO',
        pedido: 24,
        ubicacion: 'B-04-02',
        lote: 'L-118',
        ordenProduccion: 'OP-3114',
      }),
      lineaHoja({
        id: 'ln-arv-4-ng',
        sku: '19120401',
        estilo: 'ARV-1912',
        color: 'NEGRO',
        talla: '4',
        descripcion: 'POLO NIÑO',
        pedido: 15,
        ubicacion: 'B-04-03',
        lote: 'L-119',
        ordenProduccion: 'OP-3114',
      }),
      lineaHoja({
        id: 'ln-gazo-s-bl',
        sku: '31101501',
        estilo: 'GAZO-311',
        color: 'BLANCO',
        talla: 'S',
        descripcion: 'POLO DAMA',
        pedido: 30,
        ubicacion: 'C-02-07',
        lote: 'L-205',
        ordenProduccion: 'OP-3095',
      }),
      lineaHoja({
        id: 'ln-gazo-m-bl',
        sku: '31102501',
        estilo: 'GAZO-311',
        color: 'BLANCO',
        talla: 'M',
        descripcion: 'POLO DAMA',
        pedido: 28,
        ubicacion: 'C-02-08',
        lote: 'L-205',
        ordenProduccion: 'OP-3095',
      }),
      lineaHoja({
        id: 'ln-gazo-m-ng',
        sku: '31102502',
        estilo: 'GAZO-311',
        color: 'NEGRO',
        talla: 'M',
        descripcion: 'POLO DAMA',
        pedido: 16,
        ubicacion: 'C-02-09',
        lote: 'L-206',
        ordenProduccion: 'OP-3095',
      }),
    ],
  }
}

export const coberturas: Record<string, Cobertura | null> = {
  'ln-essie-6-bl': null,
  'ln-essie-8-bl': {
    ubicacion: 'A-14-01',
    lote: 'L-450',
    ordenProduccion: 'OP-3108',
  },
  'ln-essie-6-rs': null,
  'ln-essie-10-rs': null,
  'ln-arv-4-az': {
    ubicacion: 'B-05-01',
    lote: 'L-130',
    ordenProduccion: 'OP-3114',
  },
  'ln-arv-6-az': null,
  'ln-arv-4-ng': null,
  'ln-gazo-s-bl': null,
  'ln-gazo-m-bl': null,
  'ln-gazo-m-ng': null,
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
