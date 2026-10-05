import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  USUARIOS,
  coberturas,
  crearCola,
  crearHoja,
  eventoInicial,
  pendientesIniciales,
} from './mock'
import type { Evento, Faltante, HojaCola, Sesion } from './types'

function esperar(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export const usePickingStore = defineStore('picking', () => {
  const sesion = ref<Sesion | null>(null)
  const hoja = ref(crearHoja())
  const cola = ref<HojaCola[]>(crearCola())
  const faltantes = ref<Faltante[]>([])
  const eventos = ref<Evento[]>([eventoInicial()])
  const cerrada = ref(false)
  const resolviendo = ref(false)
  let secuencia = 1

  const lineasEnHoja = computed(() =>
    hoja.value.lineas.filter((linea) => linea.estado !== 'pendiente_produccion'),
  )
  const porRetirar = computed(() =>
    lineasEnHoja.value.filter((linea) => linea.estado === 'asignada'),
  )
  const retiradas = computed(() =>
    hoja.value.lineas.filter((linea) => linea.estado === 'retirada'),
  )
  const pendientes = computed(() => [
    ...pendientesIniciales,
    ...hoja.value.lineas
      .filter((linea) => linea.estado === 'pendiente_produccion')
      .map((linea) => ({
        id: linea.id,
        sku: linea.sku,
        descripcion: linea.descripcion,
        cantidad: linea.cantidad,
        unidad: linea.unidad,
        ordenProduccion: linea.ordenProduccion,
        motivo: 'Salió de la hoja porque no quedó cobertura de producción.',
      })),
  ])
  const puedeRetirar = computed(
    () => !cerrada.value && !resolviendo.value && porRetirar.value.length === 0,
  )
  const ultimoEvento = computed(() => eventos.value[eventos.value.length - 1] ?? null)
  const rol = computed(() => sesion.value?.rol ?? null)
  const puedeEjecutar = computed(() => rol.value === 'operario' || rol.value === 'administrador')
  const puedeAsignar = computed(() => rol.value === 'auxiliar' || rol.value === 'administrador')
  const puedeSupervisar = computed(
    () => rol.value === 'supervisor' || rol.value === 'administrador',
  )
  const puedeAdministrar = computed(() => rol.value === 'administrador')
  const puedeRepartir = computed(() => puedeAsignar.value || puedeSupervisar.value)
  const avance = computed(() => {
    const total = hoja.value.lineas.length
    const resueltas = hoja.value.lineas.filter((linea) => linea.estado !== 'asignada').length
    return Math.round((resueltas / total) * 100)
  })

  function siguienteId() {
    secuencia += 1
    return `ev-${secuencia}`
  }

  function anotar(evento: Omit<Evento, 'id'>) {
    eventos.value.push({ id: siguienteId(), ...evento })
  }

  function login(dni: string, clave: string) {
    const usuario = USUARIOS.find((item) => item.dni === dni && item.clave === clave)
    if (!usuario) return false
    sesion.value = { dni: usuario.dni, rol: usuario.rol, etiqueta: usuario.etiqueta }
    return true
  }

  function reiniciar() {
    hoja.value = crearHoja()
    cola.value = crearCola()
    faltantes.value = []
    eventos.value = [eventoInicial()]
    cerrada.value = false
    resolviendo.value = false
  }

  function logout() {
    sesion.value = null
    reiniciar()
  }

  function asignarHoja(codigo: string, destino: string) {
    if (!puedeRepartir.value) return false
    const hojaCola = cola.value.find((item) => item.codigo === codigo)
    if (!hojaCola) return false
    const anterior = hojaCola.asignadaA
    hojaCola.asignadaA = destino
    anotar({
      tono: 'info',
      titulo: anterior ? 'Hoja reasignada' : 'Hoja asignada',
      detalle: anterior
        ? `${hojaCola.codigo} pasó de ${anterior} a ${destino}.`
        : `${hojaCola.codigo} (${hojaCola.area}) quedó asignada a ${destino}.`,
    })
    return true
  }

  async function confirmarRetiro(lineaId: string) {
    if (!puedeEjecutar.value || resolviendo.value || cerrada.value) return
    const linea = hoja.value.lineas.find((item) => item.id === lineaId)
    if (!linea || linea.estado !== 'asignada') return
    resolviendo.value = true
    await esperar(350)
    linea.estado = 'retirada'
    anotar({
      tono: 'success',
      titulo: 'Línea retirada',
      detalle: `${linea.descripcion}, ${linea.cantidad} ${linea.unidad}, en ${linea.ubicacion}, lote ${linea.lote}.`,
    })
    resolviendo.value = false
  }

  async function reportarNoEncontrada(lineaId: string, ubicacionBuscada: string) {
    if (!puedeEjecutar.value || resolviendo.value || cerrada.value) return
    const linea = hoja.value.lineas.find((item) => item.id === lineaId)
    if (!linea || linea.estado !== 'asignada') return
    resolviendo.value = true
    await esperar(700)
    const reservada = linea.ubicacion
    const loteReservado = linea.lote
    faltantes.value.push({
      id: `fal-${linea.id}-${faltantes.value.length + 1}`,
      ubicacion: reservada,
      sku: linea.sku,
      descripcion: linea.descripcion,
      lote: loteReservado,
    })
    const alterna = linea.reubicada ? null : (coberturas[linea.id] ?? null)
    if (alterna && alterna.ubicacion !== reservada) {
      linea.ubicacionAnterior = reservada
      linea.loteAnterior = loteReservado
      linea.ubicacion = alterna.ubicacion
      linea.lote = alterna.lote
      linea.ordenProduccion = alterna.ordenProduccion
      linea.reubicada = true
      anotar({
        tono: 'warning',
        titulo: 'La misma hoja cambió de ubicación',
        detalle: `Buscaste en ${ubicacionBuscada.trim()} y no estaba ${linea.descripcion}. Se liberó la reserva de ${reservada}, lote ${loteReservado}, y esa ubicación quedó con faltante. Hay otra cobertura en ${alterna.ubicacion}, lote ${alterna.lote}. Sigue en la hoja HE-1042.`,
      })
    } else {
      linea.estado = 'pendiente_produccion'
      anotar({
        tono: 'error',
        titulo: 'La línea salió de la hoja',
        detalle: `Buscaste en ${ubicacionBuscada.trim()} y no estaba ${linea.descripcion}. Se liberó la reserva de ${reservada}, lote ${loteReservado}, y esa ubicación quedó con faltante. No hay otra cobertura de producción. Queda pendiente y entra en una hoja nueva solo cuando producción vuelva a cubrirla.`,
      })
    }
    resolviendo.value = false
  }

  function retirarMercaderia() {
    if (!puedeEjecutar.value || !puedeRetirar.value) return
    cerrada.value = true
    const cantidad = retiradas.value.length
    anotar({
      tono: 'success',
      titulo: 'Mercadería retirada',
      detalle:
        cantidad > 0
          ? `La mesa de distribución recibe la hoja ${hoja.value.codigo} con ${cantidad} ${cantidad === 1 ? 'línea retirada' : 'líneas retiradas'}. Lo pendiente de producción no viaja con esta hoja.`
          : `No quedó mercadería por retirar. La hoja ${hoja.value.codigo} no pasa a la mesa. Las líneas siguen pendientes de producción.`,
    })
  }

  return {
    sesion,
    hoja,
    cola,
    faltantes,
    eventos,
    cerrada,
    resolviendo,
    lineasEnHoja,
    porRetirar,
    retiradas,
    pendientes,
    puedeRetirar,
    ultimoEvento,
    avance,
    puedeEjecutar,
    puedeAsignar,
    puedeSupervisar,
    puedeAdministrar,
    login,
    logout,
    reiniciar,
    asignarHoja,
    confirmarRetiro,
    reportarNoEncontrada,
    retirarMercaderia,
  }
})
