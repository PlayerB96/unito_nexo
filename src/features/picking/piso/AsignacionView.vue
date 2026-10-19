<script setup lang="ts">
import {
  Filter,
  LayoutGrid,
  PackagePlus,
  Search,
  UserCheck,
} from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import PlataformaLayout from '../../../app/PlataformaLayout.vue'
import { useEsMovil } from '../../../shared/ui/useEsMovil'
import {
  PUESTOS,
  estadoDeHoja,
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
  ubicaciones: number
  lineas: number
  pedido: number
  enPiso: number
  atendidas: number
  porEstilo: string[]
  porUbicacion: string[]
  avance: number
}

const picking = usePickingStore()
const movil = useEsMovil()

const [semanaActual, semanaSiguiente] = semanasAsignables()
const semana = ref<number>(semanaActual)
const puestoId = ref<IdPuesto | null>(null)
const destino = ref<string | null>(null)
const busqueda = ref('')
const filtroUbicacion = ref<string | null>(null)
const filtroEstilo = ref<string | null>(null)
const requisiciones = ref<Requisicion[]>(['N', 'R'])
/** Por defecto solo libres: al asignar salen de la grilla. */
const estadosFiltro = ref<EstadoHoja[]>(['libre'])
const seleccion = ref<string[]>([])
const aviso = ref('')

watch(semana, () => {
  seleccion.value = []
  aviso.value = ''
  filtroUbicacion.value = null
  filtroEstilo.value = null
})

watch(puestoId, () => {
  destino.value = null
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

const opcionesUbicacion = computed(() => {
  const ubicaciones = [...new Set(deLaSemana.value.map((item) => item.ubicacion))].sort((a, b) =>
    a.localeCompare(b),
  )
  return ubicaciones.map((ubicacion) => ({ label: ubicacion, value: ubicacion }))
})

const opcionesEstilo = computed(() => {
  const estilos = [...new Set(deLaSemana.value.map((item) => item.estilo))].sort((a, b) =>
    a.localeCompare(b),
  )
  return estilos.map((estilo) => ({ label: estilo, value: estilo }))
})

const visibles = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()
  return deLaSemana.value
    .filter((item) => {
      const coincide =
        texto.length === 0 ||
        item.estilo.toLowerCase().includes(texto) ||
        item.ubicacion.toLowerCase().includes(texto) ||
        item.tipoPrenda.toLowerCase().includes(texto) ||
        item.segmento.toLowerCase().includes(texto) ||
        (item.asignadaA ?? '').toLowerCase().includes(texto)
      const mismaUbicacion =
        filtroUbicacion.value == null || item.ubicacion === filtroUbicacion.value
      const mismoEstilo = filtroEstilo.value == null || item.estilo === filtroEstilo.value
      return (
        coincide &&
        mismaUbicacion &&
        mismoEstilo &&
        requisiciones.value.includes(item.requisicion) &&
        estadosFiltro.value.includes(estadoDeHoja(item))
      )
    })
    .sort(
      (a, b) =>
        a.ubicacion.localeCompare(b.ubicacion) ||
        a.estilo.localeCompare(b.estilo),
    )
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
      ubicaciones: 0,
      lineas: 0,
      pedido: 0,
      enPiso: 0,
      atendidas: 0,
      porEstilo: [],
      porUbicacion: [],
      avance: 0,
    })
  }

  const estilosPorPersona = new Map<string, Set<string>>()
  const ubicacionesPorPersona = new Map<string, Set<string>>()

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

    const ubicaciones = ubicacionesPorPersona.get(item.asignadaA) ?? new Set<string>()
    ubicaciones.add(item.ubicacion)
    ubicacionesPorPersona.set(item.asignadaA, ubicaciones)
  }

  return [...mapa.values()]
    .map((persona) => {
      const estilos = [...(estilosPorPersona.get(persona.nombre) ?? [])].sort((a, b) =>
        a.localeCompare(b),
      )
      const ubicaciones = [...(ubicacionesPorPersona.get(persona.nombre) ?? [])].sort((a, b) =>
        a.localeCompare(b),
      )
      const total = persona.enPiso + persona.atendidas
      return {
        ...persona,
        estilos: estilos.length,
        ubicaciones: ubicaciones.length,
        porEstilo: estilos,
        porUbicacion: ubicaciones,
        avance: total === 0 ? 0 : Math.round((persona.atendidas / total) * 100),
      }
    })
    .sort(
      (a, b) =>
        b.pedido - a.pedido || b.estilos - a.estilos || a.nombre.localeCompare(b.nombre),
    )
})

const lineasCargaMax = computed(() => Math.max(1, ...carga.value.map((persona) => persona.lineas)))

const etiquetaPuesto = computed(() => {
  if (puestoActivo.value) return puestoActivo.value.etiqueta
  return 'Todos los puestos'
})

function marcada(codigo: string) {
  return seleccion.value.includes(codigo)
}

function alternar(codigo: string, activa: boolean) {
  const item = picking.cola.find((fila) => fila.codigo === codigo)
  if (!item || estadoDeHoja(item) === 'atendida') return
  seleccion.value = activa
    ? [...new Set([...seleccion.value, codigo])]
    : seleccion.value.filter((fila) => fila !== codigo)
}

function elegir(codigo: string) {
  alternar(codigo, !marcada(codigo))
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
}

function filtrarUbicacionPersona(ubicacion: string) {
  filtroUbicacion.value = ubicacion
}

function filtrarEstiloPersona(estilo: string) {
  filtroEstilo.value = estilo
}

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
  const partes = [
    resultado.asignadas.length > 0
      ? `Asignados ${resultado.asignadas.length} estilos.`
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
    aviso.value = 'Elige al menos un estilo.'
    return
  }
  const anuladas = picking.anularHojas(seleccion.value)
  aviso.value =
    anuladas.length > 0
      ? `Quedaron libres ${anuladas.length} estilos.`
      : 'No hay estilos asignados que puedas anular. Los atendidos no cambian.'
  seleccion.value = []
}

function textoEstado(item: HojaCola) {
  const estado = estadoDeHoja(item)
  if (estado === 'libre') return 'Libre'
  if (estado === 'asignada') return 'Asignado'
  return 'Atendido'
}

function tonoEstado(item: HojaCola): 'default' | 'warning' | 'success' {
  const estado = estadoDeHoja(item)
  if (estado === 'atendida') return 'success'
  if (estado === 'asignada') return 'warning'
  return 'default'
}

function porcentajeCarga(lineas: number) {
  return Math.round((lineas / lineasCargaMax.value) * 100)
}

function tonoCarga(lineas: number): 'success' | 'warning' | 'error' | 'info' {
  const pct = porcentajeCarga(lineas)
  if (pct >= 85) return 'error'
  if (pct >= 55) return 'warning'
  if (pct > 0) return 'info'
  return 'success'
}
</script>

<template>
  <PlataformaLayout>
    <n-space vertical :size="movil ? 10 : 16">
      <n-space vertical :size="4">
        <n-text strong style="font-size: 20px">Asignación</n-text>
        <n-text depth="3">
          Elige colaborador y asígnale estilos con su ubicación del Excel. Ya no se arman hojas: la
          carga se ve al instante por persona, estilo y ubicación.
        </n-text>
      </n-space>

      <n-card size="small" :content-style="movil ? 'padding: 8px' : undefined">
        <n-space vertical :size="12">
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
            <n-text depth="3">{{ seleccion.length }} estilos seleccionados</n-text>
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
              Se quita el colaborador de los estilos seleccionados. Los atendidos no cambian.
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
            <n-tag v-if="destino" type="success" size="small">Destino: {{ destino }}</n-tag>
            <n-tag v-else type="warning" size="small">Sin colaborador elegido</n-tag>
          </n-space>

          <n-alert v-if="aviso" type="info" :show-icon="false">{{ aviso }}</n-alert>
        </n-space>
      </n-card>

      <n-card
        size="small"
        :title="`Carga · ${etiquetaPuesto}`"
        :content-style="movil ? 'padding: 8px' : undefined"
      >
        <n-space vertical :size="12">
          <n-grid cols="2 tablet:4" responsive="screen" :x-gap="8" :y-gap="8">
            <n-gi><n-statistic label="Estilos" :value="conteo.total" /></n-gi>
            <n-gi><n-statistic label="Libres" :value="conteo.libres" /></n-gi>
            <n-gi><n-statistic label="Asignados" :value="conteo.asignadas" /></n-gi>
            <n-gi><n-statistic label="Atendidos" :value="conteo.atendidas" /></n-gi>
          </n-grid>

          <n-empty
            v-if="carga.length === 0"
            description="Elige un puesto para ver la carga de sus colaboradores."
          />
          <n-grid v-else cols="1 tablet:2 desktop:4" responsive="screen" :x-gap="12" :y-gap="12">
            <n-gi v-for="persona in carga" :key="persona.nombre">
              <n-card
                size="small"
                hoverable
                :bordered="destino !== persona.nombre"
                :content-style="movil ? 'padding: 8px' : undefined"
                @click="elegirPersona(persona.nombre)"
              >
                <n-space vertical :size="8">
                  <n-space justify="space-between" align="center" :wrap="false">
                    <n-text strong>{{ persona.nombre }}</n-text>
                    <n-tag v-if="destino === persona.nombre" size="small" type="success">
                      Activo
                    </n-tag>
                  </n-space>
                  <n-text depth="3">
                    {{ persona.estilos }} estilos · {{ persona.ubicaciones }} ubicaciones ·
                    {{ persona.pedido }} und · {{ persona.lineas }} líneas
                  </n-text>
                  <n-text depth="3" style="font-size: 12px">
                    Carga relativa vs el más cargado del puesto (no es avance de retiro)
                  </n-text>
                  <n-progress
                    type="line"
                    :percentage="porcentajeCarga(persona.lineas)"
                    :status="tonoCarga(persona.lineas)"
                    :indicator-placement="persona.lineas > 0 ? 'inside' : 'outside'"
                    :height="18"
                    :border-radius="4"
                    :processing="destino === persona.nombre && seleccion.length > 0"
                  />
                  <n-text v-if="persona.estilos > 0" depth="3" style="font-size: 12px">
                    Avance de retiro · {{ persona.avance }}% ({{ persona.atendidas }}/{{
                      persona.enPiso + persona.atendidas
                    }} estilos)
                  </n-text>
                  <n-space v-if="persona.porUbicacion.length > 0" :size="6" :wrap="true">
                    <n-tag
                      v-for="ubicacion in persona.porUbicacion.slice(0, 6)"
                      :key="ubicacion"
                      size="small"
                      type="info"
                      style="cursor: pointer"
                      @click.stop="filtrarUbicacionPersona(ubicacion)"
                    >
                      {{ ubicacion }}
                    </n-tag>
                  </n-space>
                  <n-space v-if="persona.porEstilo.length > 0" :size="6" :wrap="true">
                    <n-tag
                      v-for="estilo in persona.porEstilo.slice(0, 6)"
                      :key="estilo"
                      size="small"
                      style="cursor: pointer"
                      @click.stop="filtrarEstiloPersona(estilo)"
                    >
                      {{ estilo }}
                    </n-tag>
                  </n-space>
                  <n-text v-if="persona.estilos === 0" depth="3">Sin estilos esta semana</n-text>
                </n-space>
              </n-card>
            </n-gi>
          </n-grid>
        </n-space>
      </n-card>

      <n-card size="small" :content-style="movil ? 'padding: 10px' : undefined">
        <n-space vertical :size="12">
          <n-space vertical :size="2">
            <n-space align="center" :size="8" :wrap="false">
              <Filter :size="18" style="flex-shrink: 0" />
              <n-text strong>Filtros</n-text>
            </n-space>
            <n-text depth="3" style="font-size: 12px; padding-left: 26px">
              Elige qué estilos aparecen en la cola. Por defecto solo libres.
            </n-text>
          </n-space>

          <n-input
            v-model:value="busqueda"
            clearable
            placeholder="Buscar estilo, ubicación, tipo o colaborador"
          >
            <template #prefix>
              <Search :size="16" />
            </template>
          </n-input>

          <n-grid cols="1 tablet:2" responsive="screen" :x-gap="12" :y-gap="8">
            <n-gi>
              <n-form-item label="Estilo" :show-feedback="false">
                <n-select
                  v-model:value="filtroEstilo"
                  :options="opcionesEstilo"
                  clearable
                  filterable
                  placeholder="Filtrar por estilo"
                />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item label="Ubicación" :show-feedback="false">
                <n-select
                  v-model:value="filtroUbicacion"
                  :options="opcionesUbicacion"
                  clearable
                  filterable
                  placeholder="Filtrar por ubicación"
                />
              </n-form-item>
            </n-gi>
          </n-grid>

          <div class="filtro-grupo">
            <div class="filtro-grupo__titulo">
              <PackagePlus :size="14" />
              <span>Mostrar por tipo de requisición</span>
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
              <span>Mostrar por estado de asignación</span>
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
        <LayoutGrid :size="18" />
        <n-space vertical :size="2">
          <n-text strong>Cola de estilos</n-text>
          <n-text depth="3" style="font-size: 12px">
            Cada card = un estilo + ubicación del Excel · {{ visibles.length }} visibles
          </n-text>
        </n-space>
      </n-space>

      <n-empty
        v-if="!puestoId"
        description="Elige un puesto y un colaborador para empezar a asignar estilos."
      />
      <n-empty
        v-else-if="visibles.length === 0"
        description="No hay estilos con ese filtro. Si ya asignaste, activa «Asignados» para verlos o reasignarlos."
      />
      <n-grid
        v-else
        cols="2 tablet:3 desktop:4"
        responsive="screen"
        :x-gap="8"
        :y-gap="8"
      >
        <n-gi v-for="item in visibles" :key="item.codigo">
          <n-card
            size="small"
            :hoverable="estadoDeHoja(item) !== 'atendida'"
            :embedded="estadoDeHoja(item) === 'atendida'"
            :bordered="item.asignadaA !== destino"
            :style="estadoDeHoja(item) === 'atendida' ? undefined : 'cursor: pointer'"
            :content-style="movil ? 'padding: 8px' : undefined"
            @click="elegir(item.codigo)"
          >
            <n-space vertical :size="6">
              <n-checkbox
                :checked="marcada(item.codigo)"
                :disabled="estadoDeHoja(item) === 'atendida'"
                @click.stop
                @update:checked="(activa: boolean) => alternar(item.codigo, activa)"
              >
                <n-text depth="3">Estilo · </n-text>
                <n-text strong>{{ item.estilo }}</n-text>
              </n-checkbox>
              <n-text depth="3" tag="div">
                Ubicación ·
                <n-text>{{ item.ubicacion }}</n-text>
              </n-text>
              <n-space :size="6" :wrap="true">
                <n-tag size="small">Tipo · {{ item.tipoPrenda }}</n-tag>
                <n-tag size="small">Segmento · {{ item.segmento }}</n-tag>
                <n-tag size="small">
                  Requisición · {{ item.requisicion === 'N' ? 'Nueva' : 'Reposición' }}
                </n-tag>
                <n-tag size="small" :type="tonoEstado(item)">
                  Estado · {{ textoEstado(item) }}
                </n-tag>
              </n-space>
              <n-text depth="3" tag="div">
                Carga · {{ item.lineas }} líneas · {{ item.pedido }} und
              </n-text>
              <n-text tag="div">
                Colaborador · {{ item.asignadaA ?? 'Sin colaborador' }}
              </n-text>
            </n-space>
          </n-card>
        </n-gi>
      </n-grid>
    </n-space>
  </PlataformaLayout>
</template>

<style scoped>
.filtro-grupo {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
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
  gap: 8px;
}

.filtro-opcion {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px 4px 8px;
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

</style>
