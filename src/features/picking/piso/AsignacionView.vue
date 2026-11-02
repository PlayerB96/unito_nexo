<script setup lang="ts">
import {
  Boxes,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Filter,
  Layers,
  MapPin,
  Package,
  PackagePlus,
  Search,
  Shirt,
  User,
  UserCheck,
  Users,
} from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import PlataformaLayout from '../../../app/PlataformaLayout.vue'
import { useEsMovil } from '../../../shared/ui/useEsMovil'
import {
  PUESTOS,
  estadoDeHoja,
  familiaDeEstilo,
  semanasAsignables,
  type IdPuesto,
} from '../mock'
import { asignacionSchema } from '../schemas'
import { usePickingStore } from '../store'
import type { EstadoHoja, HojaCola, Requisicion } from '../types'

type CargaPersona = {
  nombre: string
  puestoId: IdPuesto
  estilos: number
  familias: number
  lineas: number
  pedido: number
  enPiso: number
  atendidas: number
  avance: number
}

type GrupoFamilia = {
  familia: string
  items: HojaCola[]
  estilos: number
  pedido: number
  lineas: number
  libres: number
  asignadas: number
  atendidas: number
  usuarios: string[]
  tipos: string[]
}

type DetalleEstilo = {
  estilo: string
  pedido: number
  lineas: number
  ubicacion: string
  tipoPrenda: string
  usuario: string
  estado: EstadoHoja
}

type DetalleFamilia = {
  familia: string
  pedido: number
  lineas: number
  estilos: DetalleEstilo[]
}

const picking = usePickingStore()
const movil = useEsMovil()

const [semanaActual, semanaSiguiente] = semanasAsignables()
const semana = ref<number>(semanaActual)
const puestoId = ref<IdPuesto | null>(null)
const destino = ref<string | null>(null)
const busqueda = ref('')
const filtroFamilia = ref<string | null>(null)
const filtroUsuario = ref<string | null>(null)
const filtroTipo = ref<string | null>(null)
const requisiciones = ref<Requisicion[]>(['N', 'R'])
/** Por defecto solo libres: al asignar salen de la grilla. */
const estadosFiltro = ref<EstadoHoja[]>(['libre'])
const seleccion = ref<string[]>([])
const aviso = ref('')
const drawerCarga = ref(false)
const modalDetalle = ref(false)
const expandida = ref<string | null>(null)
/** Familias del modal con listado completo expandido (Ver más). */
const detalleFamiliasAbiertas = ref<string[]>([])
const ESTILOS_DETALLE_VISIBLE = 5

watch(semana, () => {
  seleccion.value = []
  aviso.value = ''
  filtroFamilia.value = null
  filtroUsuario.value = null
  filtroTipo.value = null
  expandida.value = null
  detalleFamiliasAbiertas.value = []
})

watch(puestoId, () => {
  destino.value = null
  expandida.value = null
  detalleFamiliasAbiertas.value = []
})

watch(modalDetalle, (abierto) => {
  if (!abierto) detalleFamiliasAbiertas.value = []
})

const opcionesSemana = [
  { label: `Semana ${semanaActual} (actual)`, value: semanaActual },
  { label: `Semana ${semanaSiguiente} (siguiente)`, value: semanaSiguiente },
]

const opcionesPuesto = PUESTOS.map((puesto) => ({
  label: puesto.etiqueta,
  value: puesto.id,
}))

const puestoActivo = computed(() => PUESTOS.find((puesto) => puesto.id === puestoId.value) ?? null)

const opcionesDestino = computed(() =>
  (puestoActivo.value?.personas ?? []).map((nombre) => ({ label: nombre, value: nombre })),
)

const personasVisibles = computed(() => puestoActivo.value?.personas ?? [])

const deLaSemana = computed(() => picking.cola.filter((item) => item.semana === semana.value))

const opcionesFamilia = computed(() => {
  const familias = [
    ...new Set(deLaSemana.value.map((item) => familiaDeEstilo(item.estilo))),
  ].sort((a, b) => a.localeCompare(b))
  return familias.map((familia) => ({ label: familia, value: familia }))
})

const opcionesUsuario = computed(() => {
  const usuarios = [...new Set(deLaSemana.value.map((item) => item.segmento))].sort((a, b) =>
    a.localeCompare(b),
  )
  return usuarios.map((usuario) => ({ label: usuario, value: usuario }))
})

const opcionesTipo = computed(() => {
  const tipos = [...new Set(deLaSemana.value.map((item) => item.tipoPrenda))].sort((a, b) =>
    a.localeCompare(b),
  )
  return tipos.map((tipo) => ({ label: tipo, value: tipo }))
})

const visibles = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()
  return deLaSemana.value.filter((item) => {
    const familia = familiaDeEstilo(item.estilo)
    const coincide =
      texto.length === 0 ||
      item.estilo.toLowerCase().includes(texto) ||
      item.ubicacion.toLowerCase().includes(texto) ||
      item.tipoPrenda.toLowerCase().includes(texto) ||
      item.segmento.toLowerCase().includes(texto) ||
      familia.toLowerCase().includes(texto) ||
      (item.asignadaA ?? '').toLowerCase().includes(texto)
    const mismaFamilia = filtroFamilia.value == null || familia === filtroFamilia.value
    const mismoUsuario = filtroUsuario.value == null || item.segmento === filtroUsuario.value
    const mismoTipo = filtroTipo.value == null || item.tipoPrenda === filtroTipo.value
    return (
      coincide &&
      mismaFamilia &&
      mismoUsuario &&
      mismoTipo &&
      requisiciones.value.includes(item.requisicion) &&
      estadosFiltro.value.includes(estadoDeHoja(item))
    )
  })
})

const gruposFamilia = computed((): GrupoFamilia[] => {
  const mapa = new Map<string, HojaCola[]>()
  for (const item of visibles.value) {
    const familia = familiaDeEstilo(item.estilo)
    const lista = mapa.get(familia) ?? []
    lista.push(item)
    mapa.set(familia, lista)
  }
  return [...mapa.entries()]
    .map(([familia, items]) => {
      const estilos = new Set(items.map((item) => item.estilo))
      let libres = 0
      let asignadas = 0
      let atendidas = 0
      for (const item of items) {
        const estado = estadoDeHoja(item)
        if (estado === 'libre') libres += 1
        else if (estado === 'asignada') asignadas += 1
        else atendidas += 1
      }
      return {
        familia,
        items: [...items].sort((a, b) => b.pedido - a.pedido || a.estilo.localeCompare(b.estilo)),
        estilos: estilos.size,
        pedido: items.reduce((suma, item) => suma + item.pedido, 0),
        lineas: items.reduce((suma, item) => suma + item.lineas, 0),
        libres,
        asignadas,
        atendidas,
        usuarios: [...new Set(items.map((item) => item.segmento))].sort((a, b) =>
          a.localeCompare(b),
        ),
        tipos: [...new Set(items.map((item) => item.tipoPrenda))].sort((a, b) =>
          a.localeCompare(b),
        ),
      }
    })
    .sort((a, b) => b.pedido - a.pedido || a.familia.localeCompare(b.familia))
})

const loteSeleccion = computed(() => {
  const items = deLaSemana.value.filter((item) => seleccion.value.includes(item.codigo))
  const familias = new Set(items.map((item) => familiaDeEstilo(item.estilo)))
  const estilos = new Set(items.map((item) => item.estilo))
  return {
    familias: familias.size,
    estilos: estilos.size,
    pedido: items.reduce((suma, item) => suma + item.pedido, 0),
    lineas: items.reduce((suma, item) => suma + item.lineas, 0),
  }
})

const conteo = computed(() => {
  const base = { total: deLaSemana.value.length, libres: 0, asignadas: 0, atendidas: 0 }
  for (const item of deLaSemana.value) {
    const estado = estadoDeHoja(item)
    if (estado === 'libre') base.libres += 1
    else if (estado === 'asignada') base.asignadas += 1
    else base.atendidas += 1
  }
  return base
})

const carga = computed(() => {
  const mapaPersona = new Map<string, IdPuesto>()
  for (const puesto of PUESTOS) {
    for (const persona of puesto.personas) mapaPersona.set(persona, puesto.id)
  }

  const mapa = new Map<string, CargaPersona>()
  for (const nombre of personasVisibles.value) {
    const puesto = mapaPersona.get(nombre)
    if (!puesto) continue
    mapa.set(nombre, {
      nombre,
      puestoId: puesto,
      estilos: 0,
      familias: 0,
      lineas: 0,
      pedido: 0,
      enPiso: 0,
      atendidas: 0,
      avance: 0,
    })
  }

  const estilosPorPersona = new Map<string, Set<string>>()
  const familiasPorPersona = new Map<string, Set<string>>()

  for (const item of deLaSemana.value) {
    if (!item.asignadaA) continue
    const actual = mapa.get(item.asignadaA)
    if (!actual) continue
    actual.lineas += item.lineas
    actual.pedido += item.pedido
    if (estadoDeHoja(item) === 'atendida') actual.atendidas += 1
    else actual.enPiso += 1

    const estilos = estilosPorPersona.get(item.asignadaA) ?? new Set<string>()
    estilos.add(item.estilo)
    estilosPorPersona.set(item.asignadaA, estilos)

    const familias = familiasPorPersona.get(item.asignadaA) ?? new Set<string>()
    familias.add(familiaDeEstilo(item.estilo))
    familiasPorPersona.set(item.asignadaA, familias)
  }

  return [...mapa.values()]
    .map((persona) => {
      const estilos = estilosPorPersona.get(persona.nombre)?.size ?? 0
      const familias = familiasPorPersona.get(persona.nombre)?.size ?? 0
      const total = persona.enPiso + persona.atendidas
      return {
        ...persona,
        estilos,
        familias,
        avance: total === 0 ? 0 : Math.round((persona.atendidas / total) * 100),
      }
    })
    .sort(
      (a, b) =>
        b.pedido - a.pedido || b.estilos - a.estilos || a.nombre.localeCompare(b.nombre),
    )
})

const pedidoCargaMax = computed(() => Math.max(1, ...carga.value.map((persona) => persona.pedido)))

const cargaDestino = computed(() => carga.value.find((persona) => persona.nombre === destino.value) ?? null)

const detalleDestino = computed((): DetalleFamilia[] => {
  if (!destino.value) return []
  const items = deLaSemana.value.filter((item) => item.asignadaA === destino.value)
  const mapa = new Map<string, HojaCola[]>()
  for (const item of items) {
    const familia = familiaDeEstilo(item.estilo)
    const lista = mapa.get(familia) ?? []
    lista.push(item)
    mapa.set(familia, lista)
  }
  return [...mapa.entries()]
    .map(([familia, filas]) => ({
      familia,
      pedido: filas.reduce((suma, item) => suma + item.pedido, 0),
      lineas: filas.reduce((suma, item) => suma + item.lineas, 0),
      estilos: [...filas]
        .sort((a, b) => b.pedido - a.pedido || a.estilo.localeCompare(b.estilo))
        .map((item) => ({
          estilo: item.estilo,
          pedido: item.pedido,
          lineas: item.lineas,
          ubicacion: item.ubicacion,
          tipoPrenda: item.tipoPrenda,
          usuario: item.segmento,
          estado: estadoDeHoja(item),
        })),
    }))
    .sort((a, b) => b.pedido - a.pedido || a.familia.localeCompare(b.familia))
})

function codigosSeleccionables(grupo: GrupoFamilia) {
  return grupo.items
    .filter((item) => estadoDeHoja(item) !== 'atendida')
    .map((item) => item.codigo)
}

function familiaMarcada(grupo: GrupoFamilia) {
  const codigos = codigosSeleccionables(grupo)
  return codigos.length > 0 && codigos.every((codigo) => seleccion.value.includes(codigo))
}

function familiaParcial(grupo: GrupoFamilia) {
  const codigos = codigosSeleccionables(grupo)
  if (codigos.length === 0) return false
  const marcados = codigos.filter((codigo) => seleccion.value.includes(codigo)).length
  return marcados > 0 && marcados < codigos.length
}

function alternarFamilia(grupo: GrupoFamilia, activa: boolean) {
  const codigos = codigosSeleccionables(grupo)
  if (codigos.length === 0) return
  if (activa) {
    seleccion.value = [...new Set([...seleccion.value, ...codigos])]
    return
  }
  const quitar = new Set(codigos)
  seleccion.value = seleccion.value.filter((codigo) => !quitar.has(codigo))
}

function elegirFamilia(grupo: GrupoFamilia) {
  alternarFamilia(grupo, !familiaMarcada(grupo))
}

function marcada(codigo: string) {
  return seleccion.value.includes(codigo)
}

function alternarEstilo(codigo: string, activa: boolean) {
  const item = picking.cola.find((fila) => fila.codigo === codigo)
  if (!item || estadoDeHoja(item) === 'atendida') return
  seleccion.value = activa
    ? [...new Set([...seleccion.value, codigo])]
    : seleccion.value.filter((fila) => fila !== codigo)
}

function toggleExpandida(familia: string) {
  expandida.value = expandida.value === familia ? null : familia
}

function seleccionarLibres() {
  const libres = visibles.value
    .filter((item) => estadoDeHoja(item) === 'libre')
    .map((item) => item.codigo)
  seleccion.value = [...new Set([...seleccion.value, ...libres])]
}

function seleccionarVisibles() {
  const codigos = visibles.value
    .filter((item) => estadoDeHoja(item) !== 'atendida')
    .map((item) => item.codigo)
  seleccion.value = [...new Set([...seleccion.value, ...codigos])]
}

function limpiar() {
  seleccion.value = []
}

function setRequisicion(valor: Requisicion, activa: boolean) {
  if (activa) {
    if (!requisiciones.value.includes(valor)) {
      requisiciones.value = [...requisiciones.value, valor]
    }
    return
  }
  requisiciones.value = requisiciones.value.filter((item) => item !== valor)
}

function setEstado(valor: EstadoHoja, activa: boolean) {
  if (activa) {
    if (!estadosFiltro.value.includes(valor)) {
      estadosFiltro.value = [...estadosFiltro.value, valor]
    }
    return
  }
  estadosFiltro.value = estadosFiltro.value.filter((item) => item !== valor)
}

function elegirPersona(nombre: string) {
  const puesto = PUESTOS.find((item) => item.personas.includes(nombre))
  if (puesto) puestoId.value = puesto.id
  destino.value = nombre
  drawerCarga.value = false
}

function abrirDetalleDestino() {
  if (!destino.value || !cargaDestino.value) return
  detalleFamiliasAbiertas.value = []
  modalDetalle.value = true
}

function detalleFamiliaAbierta(familia: string) {
  return detalleFamiliasAbiertas.value.includes(familia)
}

function alternarDetalleFamilia(familia: string) {
  if (detalleFamiliaAbierta(familia)) {
    detalleFamiliasAbiertas.value = detalleFamiliasAbiertas.value.filter(
      (item) => item !== familia,
    )
    return
  }
  detalleFamiliasAbiertas.value = [...detalleFamiliasAbiertas.value, familia]
}

function estilosDetalleVisibles(familia: DetalleFamilia) {
  if (detalleFamiliaAbierta(familia.familia)) return familia.estilos
  return familia.estilos.slice(0, ESTILOS_DETALLE_VISIBLE)
}

const estiloModal = computed(() =>
  movil.value
    ? { width: '96vw', maxHeight: '90vh' }
    : { width: '640px', maxHeight: '90vh' },
)

function asignar() {
  const validacion = asignacionSchema.safeParse({
    codigos: seleccion.value,
    destino: destino.value ?? '',
  })
  if (!validacion.success) {
    aviso.value = validacion.error.issues[0]?.message ?? 'Revisa la asignación.'
    return
  }
  const resultado = picking.asignarHojas(validacion.data.codigos, validacion.data.destino)
  const familias = new Set(
    [...resultado.asignadas, ...resultado.reasignadas].map((codigo) => {
      const item = picking.cola.find((fila) => fila.codigo === codigo)
      return item ? familiaDeEstilo(item.estilo) : ''
    }),
  )
  const partes = [
    resultado.asignadas.length > 0
      ? `Asignados ${resultado.asignadas.length} estilos (${familias.size} familias).`
      : '',
    resultado.reasignadas.length > 0
      ? `Reasignados ${resultado.reasignadas.length} estilos.`
      : '',
    resultado.omitidas.length > 0 ? `Sin cambio: ${resultado.omitidas.length}.` : '',
  ].filter(Boolean)
  aviso.value = partes.join(' ')
  seleccion.value = []
}

function anular() {
  if (seleccion.value.length === 0) {
    aviso.value = 'Elige al menos una familia o estilo.'
    return
  }
  const anuladas = picking.anularHojas(seleccion.value)
  aviso.value =
    anuladas.length > 0
      ? `Quedaron libres ${anuladas.length} estilos.`
      : 'No hay estilos asignados que puedas anular. Los atendidos no cambian.'
  seleccion.value = []
}

function textoEstado(estado: EstadoHoja) {
  if (estado === 'libre') return 'Libre'
  if (estado === 'asignada') return 'Asignado'
  return 'Atendido'
}

function tonoEstado(estado: EstadoHoja): 'default' | 'warning' | 'success' {
  if (estado === 'atendida') return 'success'
  if (estado === 'asignada') return 'warning'
  return 'default'
}

function porcentajeCarga(pedido: number) {
  return Math.round((pedido / pedidoCargaMax.value) * 100)
}

function tonoCarga(pedido: number): 'success' | 'warning' | 'error' | 'info' {
  const pct = porcentajeCarga(pedido)
  if (pct >= 85) return 'error'
  if (pct >= 55) return 'warning'
  if (pct > 0) return 'info'
  return 'success'
}
</script>

<template>
  <PlataformaLayout>
    <n-space vertical :size="movil ? 10 : 14">
      <n-space vertical :size="4">
        <n-text strong style="font-size: 20px">Asignación</n-text>
        <n-text depth="3">
          Asigna por familia (marca del EstiloProd). Expande solo si necesitas partir estilos de
          una familia grande.
        </n-text>
      </n-space>

      <n-card size="small" :content-style="movil ? 'padding: 8px' : 'padding: 12px'">
        <n-space vertical :size="10">
          <n-grid cols="1 tablet:2 desktop:3" responsive="screen" :x-gap="12" :y-gap="8">
            <n-gi>
              <n-form-item label="Semana" :show-feedback="false">
                <n-select v-model:value="semana" :options="opcionesSemana" />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item label="Puesto" :show-feedback="false">
                <n-select
                  v-model:value="puestoId"
                  :options="opcionesPuesto"
                  clearable
                  placeholder="Elige un puesto"
                />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item label="Colaborador" :show-feedback="false">
                <n-select
                  v-model:value="destino"
                  :options="opcionesDestino"
                  :disabled="!puestoId"
                  placeholder="Elige un colaborador"
                />
              </n-form-item>
            </n-gi>
          </n-grid>

          <n-space align="center" :size="8" :wrap="true">
            <n-text depth="3">
              Selección · {{ loteSeleccion.familias }} familias · {{ loteSeleccion.estilos }}
              estilos · {{ loteSeleccion.pedido }} und
            </n-text>
            <n-button type="primary" :disabled="seleccion.length === 0" @click="asignar">
              Asignar
            </n-button>
            <n-popconfirm
              v-if="picking.puedeReasignar"
              positive-text="Anular"
              negative-text="Cancelar"
              @positive-click="anular"
            >
              <template #trigger>
                <n-button type="error" secondary :disabled="seleccion.length === 0">
                  Anular
                </n-button>
              </template>
              Se quita el colaborador de la selección. Los atendidos no cambian.
            </n-popconfirm>
            <n-button quaternary :disabled="!picking.puedeAsignar" @click="seleccionarLibres">
              Seleccionar libres
            </n-button>
            <n-button quaternary :disabled="!picking.puedeAsignar" @click="seleccionarVisibles">
              Seleccionar visibles
            </n-button>
            <n-button quaternary :disabled="seleccion.length === 0" @click="limpiar">
              Limpiar
            </n-button>
            <n-button secondary :disabled="!puestoId" @click="drawerCarga = true">
              <template #icon>
                <Users :size="16" />
              </template>
              Carga del equipo
            </n-button>
            <n-tag
              v-if="destino && cargaDestino"
              type="success"
              size="small"
              class="tag-destino"
              @click="abrirDetalleDestino"
            >
              <n-space :size="6" align="center" :wrap="false">
                <User :size="12" />
                <span>
                  {{ destino }} · {{ cargaDestino.familias }} familias ·
                  {{ cargaDestino.estilos }} estilos · {{ cargaDestino.pedido }} und
                </span>
              </n-space>
            </n-tag>
            <n-tag v-else-if="destino" type="success" size="small">Destino: {{ destino }}</n-tag>
            <n-tag v-else type="warning" size="small">Sin colaborador elegido</n-tag>
            <n-tag size="small">
              Semana · {{ conteo.total }} · libres {{ conteo.libres }} · asignados
              {{ conteo.asignadas }} · atendidos {{ conteo.atendidas }}
            </n-tag>
          </n-space>

          <n-alert v-if="aviso" type="info" :show-icon="false">{{ aviso }}</n-alert>
        </n-space>
      </n-card>

      <n-card size="small" :content-style="movil ? 'padding: 8px' : 'padding: 10px'">
        <n-space vertical :size="8">
          <n-space align="center" :size="8" :wrap="false">
            <Filter :size="16" style="flex-shrink: 0" />
            <n-text strong>Filtros</n-text>
            <n-text depth="3" style="font-size: 12px">Por defecto solo libres</n-text>
          </n-space>

          <n-input
            v-model:value="busqueda"
            clearable
            size="small"
            placeholder="Buscar familia, estilo, usuario o tipo"
          >
            <template #prefix>
              <Search :size="16" />
            </template>
          </n-input>

          <n-grid cols="1 tablet:3" responsive="screen" :x-gap="8" :y-gap="6">
            <n-gi>
              <n-form-item label="Familia" :show-feedback="false" size="small">
                <n-select
                  v-model:value="filtroFamilia"
                  :options="opcionesFamilia"
                  clearable
                  filterable
                  size="small"
                  placeholder="GUGGI, ARV…"
                />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item label="Usuario" :show-feedback="false" size="small">
                <n-select
                  v-model:value="filtroUsuario"
                  :options="opcionesUsuario"
                  clearable
                  filterable
                  size="small"
                  placeholder="NIÑA, NIÑO…"
                />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item label="Tipo de prenda" :show-feedback="false" size="small">
                <n-select
                  v-model:value="filtroTipo"
                  :options="opcionesTipo"
                  clearable
                  filterable
                  size="small"
                  placeholder="POLO, BLUSA…"
                />
              </n-form-item>
            </n-gi>
          </n-grid>

          <div class="filtro-grupo">
            <div class="filtro-grupo__titulo">
              <PackagePlus :size="14" />
              <span>Requisición</span>
            </div>
            <div class="filtro-grupo__opciones">
              <div
                class="filtro-opcion"
                :class="{ 'filtro-opcion--activa': requisiciones.includes('N') }"
              >
                <n-checkbox
                  :checked="requisiciones.includes('N')"
                  @update:checked="(activa: boolean) => setRequisicion('N', activa)"
                >
                  Nuevas
                </n-checkbox>
              </div>
              <div
                class="filtro-opcion"
                :class="{ 'filtro-opcion--activa': requisiciones.includes('R') }"
              >
                <n-checkbox
                  :checked="requisiciones.includes('R')"
                  @update:checked="(activa: boolean) => setRequisicion('R', activa)"
                >
                  Reposición
                </n-checkbox>
              </div>
            </div>
          </div>

          <div class="filtro-grupo">
            <div class="filtro-grupo__titulo">
              <UserCheck :size="14" />
              <span>Estado</span>
            </div>
            <div class="filtro-grupo__opciones">
              <div
                class="filtro-opcion"
                :class="{ 'filtro-opcion--activa': estadosFiltro.includes('libre') }"
              >
                <n-checkbox
                  :checked="estadosFiltro.includes('libre')"
                  @update:checked="(activa: boolean) => setEstado('libre', activa)"
                >
                  Libres
                </n-checkbox>
              </div>
              <div
                class="filtro-opcion"
                :class="{ 'filtro-opcion--activa': estadosFiltro.includes('asignada') }"
              >
                <n-checkbox
                  :checked="estadosFiltro.includes('asignada')"
                  @update:checked="(activa: boolean) => setEstado('asignada', activa)"
                >
                  Asignados
                </n-checkbox>
              </div>
              <div
                class="filtro-opcion"
                :class="{ 'filtro-opcion--activa': estadosFiltro.includes('atendida') }"
              >
                <n-checkbox
                  :checked="estadosFiltro.includes('atendida')"
                  @update:checked="(activa: boolean) => setEstado('atendida', activa)"
                >
                  Atendidos
                </n-checkbox>
              </div>
            </div>
          </div>
        </n-space>
      </n-card>

      <n-space align="center" :size="8" :wrap="false">
        <Boxes :size="18" />
        <n-space vertical :size="2">
          <n-text strong>Familias</n-text>
          <n-text depth="3" style="font-size: 12px">
            {{ gruposFamilia.length }} familias · {{ visibles.length }} estilos · mayor volumen
            primero
          </n-text>
        </n-space>
      </n-space>

      <n-empty
        v-if="!puestoId"
        description="Elige un puesto y un colaborador para asignar familias."
      />
      <n-empty
        v-else-if="gruposFamilia.length === 0"
        description="No hay familias con ese filtro. Si ya asignaste, activa «Asignados»."
      />
      <n-grid
        v-else
        cols="1 tablet:2 desktop:3"
        responsive="screen"
        :x-gap="10"
        :y-gap="10"
      >
        <n-gi v-for="grupo in gruposFamilia" :key="grupo.familia">
          <n-card
            size="small"
            hoverable
            :bordered="!familiaMarcada(grupo)"
            class="card-familia"
            :content-style="movil ? 'padding: 10px' : undefined"
          >
            <n-space vertical :size="8">
              <n-space justify="space-between" align="center" :wrap="false" :size="8">
                <n-checkbox
                  :checked="familiaMarcada(grupo)"
                  :indeterminate="familiaParcial(grupo)"
                  :disabled="codigosSeleccionables(grupo).length === 0 || !picking.puedeAsignar"
                  @click.stop
                  @update:checked="(activa: boolean) => alternarFamilia(grupo, activa)"
                >
                  <n-space :size="6" align="center" :wrap="false">
                    <Layers :size="14" />
                    <n-text strong>{{ grupo.familia }}</n-text>
                  </n-space>
                </n-checkbox>
                <n-button size="tiny" quaternary @click.stop="toggleExpandida(grupo.familia)">
                  <template #icon>
                    <ChevronDown v-if="expandida === grupo.familia" :size="14" />
                    <ChevronRight v-else :size="14" />
                  </template>
                  Estilos
                </n-button>
              </n-space>

              <div class="card-familia__meta" @click="elegirFamilia(grupo)">
                <n-space :size="10" :wrap="true">
                  <n-space :size="4" align="center">
                    <Shirt :size="13" />
                    <n-text depth="3">{{ grupo.estilos }} estilos</n-text>
                  </n-space>
                  <n-space :size="4" align="center">
                    <Package :size="13" />
                    <n-text depth="3">{{ grupo.pedido }} und</n-text>
                  </n-space>
                  <n-space :size="4" align="center">
                    <Boxes :size="13" />
                    <n-text depth="3">{{ grupo.lineas }} líneas</n-text>
                  </n-space>
                </n-space>
                <n-space :size="6" :wrap="true" style="margin-top: 6px">
                  <n-tag v-for="usuario in grupo.usuarios.slice(0, 3)" :key="usuario" size="tiny">
                    {{ usuario }}
                  </n-tag>
                  <n-tag v-for="tipo in grupo.tipos.slice(0, 3)" :key="tipo" size="tiny" type="info">
                    {{ tipo }}
                  </n-tag>
                </n-space>
                <n-text depth="3" style="font-size: 12px; margin-top: 4px" tag="div">
                  Libres {{ grupo.libres }} · Asignados {{ grupo.asignadas }} · Atendidos
                  {{ grupo.atendidas }}
                </n-text>
              </div>

              <n-space v-if="expandida === grupo.familia" vertical :size="6">
                <n-text depth="3" style="font-size: 12px">
                  Parte la familia eligiendo estilos sueltos
                </n-text>
                <div
                  v-for="item in grupo.items"
                  :key="item.codigo"
                  class="fila-estilo"
                  @click.stop="
                    estadoDeHoja(item) !== 'atendida' &&
                      alternarEstilo(item.codigo, !marcada(item.codigo))
                  "
                >
                  <n-checkbox
                    :checked="marcada(item.codigo)"
                    :disabled="estadoDeHoja(item) === 'atendida'"
                    @click.stop
                    @update:checked="(activa: boolean) => alternarEstilo(item.codigo, activa)"
                  >
                    <n-text strong>{{ item.estilo }}</n-text>
                  </n-checkbox>
                  <n-text depth="3" style="font-size: 12px">
                    {{ item.pedido }} und · {{ item.lineas }} líneas · {{ item.ubicacion }}
                  </n-text>
                  <n-tag size="tiny" :type="tonoEstado(estadoDeHoja(item))">
                    {{ textoEstado(estadoDeHoja(item)) }}
                  </n-tag>
                </div>
              </n-space>
            </n-space>
          </n-card>
        </n-gi>
      </n-grid>
    </n-space>

    <n-drawer v-model:show="drawerCarga" :width="movil ? '100%' : 380" placement="right">
      <n-drawer-content
        :title="puestoActivo ? `Carga · ${puestoActivo.etiqueta}` : 'Carga del equipo'"
        closable
      >
        <n-space vertical :size="10">
          <n-text depth="3" style="font-size: 12px">
            Und relativas al más cargado del puesto. Toca una fila para elegir destino.
          </n-text>
          <n-empty v-if="carga.length === 0" description="Elige un puesto para ver la carga." />
          <n-space v-else vertical :size="8">
            <div
              v-for="persona in carga"
              :key="persona.nombre"
              class="fila-carga"
              :class="{ 'fila-carga--activa': destino === persona.nombre }"
              @click="elegirPersona(persona.nombre)"
            >
              <n-space justify="space-between" align="center" :wrap="false" :size="8">
                <n-text strong>{{ persona.nombre }}</n-text>
                <n-tag v-if="destino === persona.nombre" size="tiny" type="success">Activo</n-tag>
              </n-space>
              <n-text depth="3" style="font-size: 12px">
                {{ persona.familias }} familias · {{ persona.estilos }} estilos ·
                {{ persona.pedido }} und
              </n-text>
              <n-progress
                type="line"
                :percentage="porcentajeCarga(persona.pedido)"
                :status="tonoCarga(persona.pedido)"
                :height="10"
                :show-indicator="false"
                :border-radius="3"
              />
            </div>
          </n-space>
        </n-space>
      </n-drawer-content>
    </n-drawer>

    <n-modal
      v-model:show="modalDetalle"
      preset="card"
      :title="destino ? `Carga de ${destino}` : 'Detalle'"
      :style="estiloModal"
      :bordered="false"
      size="huge"
      :content-style="{
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(90vh - 72px)',
        paddingBottom: '12px',
      }"
    >
      <n-scrollbar style="max-height: calc(90vh - 96px)">
        <n-space vertical :size="14">
          <n-grid
            v-if="cargaDestino"
            cols="2 tablet:4"
            responsive="screen"
            :x-gap="8"
            :y-gap="8"
          >
            <n-gi>
              <n-tooltip placement="top" trigger="hover">
                <template #trigger>
                  <div class="metrica">
                    <Layers :size="16" />
                    <n-text depth="3" class="metrica__label">
                      Familias
                      <CircleHelp :size="12" />
                    </n-text>
                    <n-text strong class="metrica__valor">{{ cargaDestino.familias }}</n-text>
                  </div>
                </template>
                Marcas distintas asignadas (GUGGI, ARV, ESSIE…). Agrupa estilos de la misma marca.
              </n-tooltip>
            </n-gi>
            <n-gi>
              <n-tooltip placement="top" trigger="hover">
                <template #trigger>
                  <div class="metrica">
                    <Shirt :size="16" />
                    <n-text depth="3" class="metrica__label">
                      Estilos
                      <CircleHelp :size="12" />
                    </n-text>
                    <n-text strong class="metrica__valor">{{ cargaDestino.estilos }}</n-text>
                  </div>
                </template>
                Códigos de producto distintos asignados (por ejemplo ESSIE-807, ARV-1912).
              </n-tooltip>
            </n-gi>
            <n-gi>
              <n-tooltip placement="top" trigger="hover">
                <template #trigger>
                  <div class="metrica">
                    <Package :size="16" />
                    <n-text depth="3" class="metrica__label">
                      Volumen
                      <CircleHelp :size="12" />
                    </n-text>
                    <n-text strong class="metrica__valor">{{ cargaDestino.pedido }}</n-text>
                  </div>
                </template>
                Unidades totales a retirar o surtir. Es la carga principal para equilibrar personas.
              </n-tooltip>
            </n-gi>
            <n-gi>
              <n-tooltip placement="top" trigger="hover">
                <template #trigger>
                  <div class="metrica">
                    <Boxes :size="16" />
                    <n-text depth="3" class="metrica__label">
                      Líneas
                      <CircleHelp :size="12" />
                    </n-text>
                    <n-text strong class="metrica__valor">{{ cargaDestino.lineas }}</n-text>
                  </div>
                </template>
                Ítems de picking: cada posición a atender (estilo/SKU con talla o detalle y ubicación).
              </n-tooltip>
            </n-gi>
          </n-grid>

          <n-empty
            v-if="detalleDestino.length === 0"
            description="Este colaborador aún no tiene familias asignadas."
          />
          <n-space v-else vertical :size="12">
            <div
              v-for="familia in detalleDestino"
              :key="familia.familia"
              class="detalle-familia"
              :class="{
                'detalle-familia--abierta': detalleFamiliaAbierta(familia.familia),
              }"
            >
              <div class="detalle-familia__cabecera">
                <n-space justify="space-between" align="center" :wrap="true" :size="8">
                  <n-space :size="8" align="center">
                    <Layers :size="16" />
                    <n-text strong>{{ familia.familia }}</n-text>
                  </n-space>
                  <n-text depth="3">
                    {{ familia.estilos.length }} estilos · {{ familia.pedido }} und ·
                    {{ familia.lineas }} líneas
                  </n-text>
                </n-space>
              </div>
              <n-scrollbar
                v-if="detalleFamiliaAbierta(familia.familia)"
                class="detalle-familia__scroll"
                style="max-height: 280px"
              >
                <n-space vertical :size="6">
                  <div
                    v-for="estilo in estilosDetalleVisibles(familia)"
                    :key="estilo.estilo"
                    class="detalle-estilo"
                  >
                    <n-space justify="space-between" align="center" :wrap="true" :size="6">
                      <n-space :size="6" align="center">
                        <Shirt :size="14" />
                        <n-text strong>{{ estilo.estilo }}</n-text>
                      </n-space>
                      <n-tag size="tiny" :type="tonoEstado(estilo.estado)">
                        {{ textoEstado(estilo.estado) }}
                      </n-tag>
                    </n-space>
                    <n-space :size="10" :wrap="true" style="margin-top: 4px">
                      <n-space :size="4" align="center">
                        <Package :size="12" />
                        <n-text depth="3" style="font-size: 12px">{{ estilo.pedido }} und</n-text>
                      </n-space>
                      <n-space :size="4" align="center">
                        <Boxes :size="12" />
                        <n-text depth="3" style="font-size: 12px"
                          >{{ estilo.lineas }} líneas</n-text
                        >
                      </n-space>
                      <n-space :size="4" align="center">
                        <MapPin :size="12" />
                        <n-text depth="3" style="font-size: 12px">{{ estilo.ubicacion }}</n-text>
                      </n-space>
                      <n-space :size="4" align="center">
                        <User :size="12" />
                        <n-text depth="3" style="font-size: 12px">{{ estilo.usuario }}</n-text>
                      </n-space>
                      <n-text depth="3" style="font-size: 12px">{{ estilo.tipoPrenda }}</n-text>
                    </n-space>
                  </div>
                </n-space>
              </n-scrollbar>
              <n-space v-else vertical :size="6" style="margin-top: 8px">
                <div
                  v-for="estilo in estilosDetalleVisibles(familia)"
                  :key="estilo.estilo"
                  class="detalle-estilo"
                >
                  <n-space justify="space-between" align="center" :wrap="true" :size="6">
                    <n-space :size="6" align="center">
                      <Shirt :size="14" />
                      <n-text strong>{{ estilo.estilo }}</n-text>
                    </n-space>
                    <n-tag size="tiny" :type="tonoEstado(estilo.estado)">
                      {{ textoEstado(estilo.estado) }}
                    </n-tag>
                  </n-space>
                  <n-space :size="10" :wrap="true" style="margin-top: 4px">
                    <n-space :size="4" align="center">
                      <Package :size="12" />
                      <n-text depth="3" style="font-size: 12px">{{ estilo.pedido }} und</n-text>
                    </n-space>
                    <n-space :size="4" align="center">
                      <Boxes :size="12" />
                      <n-text depth="3" style="font-size: 12px"
                        >{{ estilo.lineas }} líneas</n-text
                      >
                    </n-space>
                    <n-space :size="4" align="center">
                      <MapPin :size="12" />
                      <n-text depth="3" style="font-size: 12px">{{ estilo.ubicacion }}</n-text>
                    </n-space>
                    <n-space :size="4" align="center">
                      <User :size="12" />
                      <n-text depth="3" style="font-size: 12px">{{ estilo.usuario }}</n-text>
                    </n-space>
                    <n-text depth="3" style="font-size: 12px">{{ estilo.tipoPrenda }}</n-text>
                  </n-space>
                </div>
              </n-space>
              <n-button
                v-if="familia.estilos.length > ESTILOS_DETALLE_VISIBLE"
                size="tiny"
                quaternary
                style="margin-top: 8px"
                @click="alternarDetalleFamilia(familia.familia)"
              >
                {{
                  detalleFamiliaAbierta(familia.familia)
                    ? 'Ver menos'
                    : `Ver más · ${familia.estilos.length - ESTILOS_DETALLE_VISIBLE} estilos`
                }}
              </n-button>
            </div>
          </n-space>
        </n-space>
      </n-scrollbar>
    </n-modal>
  </PlataformaLayout>
</template>

<style scoped>
.filtro-grupo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--n-color-embedded, rgba(127, 127, 127, 0.08));
  border: 1px solid var(--n-border-color, rgba(127, 127, 127, 0.2));
}

.filtro-grupo__titulo {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  opacity: 0.72;
}

.filtro-grupo__opciones {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filtro-opcion {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px 2px 6px;
  border-radius: 6px;
  font-size: 13px;
  border: 1px dashed var(--n-border-color, rgba(127, 127, 127, 0.35));
  background: transparent;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.filtro-opcion--activa {
  border-style: solid;
  border-color: var(--n-primary-color, #63e2b7);
  background: color-mix(in srgb, var(--n-primary-color, #63e2b7) 12%, transparent);
}

.card-familia {
  height: 100%;
}

.card-familia__meta {
  cursor: pointer;
}

.fila-estilo {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid var(--n-border-color, rgba(127, 127, 127, 0.2));
  cursor: pointer;
}

.fila-carga {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--n-border-color, rgba(127, 127, 127, 0.25));
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.fila-carga:hover {
  border-color: var(--n-primary-color, #63e2b7);
}

.fila-carga--activa {
  border-color: var(--n-primary-color, #63e2b7);
  background: color-mix(in srgb, var(--n-primary-color, #63e2b7) 10%, transparent);
}

.tag-destino {
  cursor: pointer;
}

.detalle-familia {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--n-border-color, rgba(127, 127, 127, 0.25));
  background: var(--n-color-embedded, rgba(127, 127, 127, 0.05));
}

.detalle-familia--abierta {
  max-height: 380px;
  display: flex;
  flex-direction: column;
}

.detalle-familia__cabecera {
  flex-shrink: 0;
  padding-bottom: 8px;
  margin-bottom: 2px;
  background: var(--n-color-embedded, rgba(127, 127, 127, 0.05));
  border-bottom: 1px solid var(--n-border-color, rgba(127, 127, 127, 0.18));
}

.detalle-familia__scroll {
  flex: 1;
  min-height: 0;
}

.detalle-estilo {
  padding: 8px;
  border-radius: 6px;
  border: 1px solid var(--n-border-color, rgba(127, 127, 127, 0.18));
}

.metrica {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 84px;
  padding: 10px 8px;
  border-radius: 8px;
  border: 1px solid var(--n-border-color, rgba(127, 127, 127, 0.22));
  background: var(--n-color-embedded, rgba(127, 127, 127, 0.05));
  text-align: center;
  cursor: default;
}

.metrica__label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
}

.metrica__valor {
  font-size: 22px;
  line-height: 1.1;
}
</style>
