<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PlataformaLayout from '../../../app/PlataformaLayout.vue'
import { useEsMovil } from '../../../shared/ui/useEsMovil'
import { DESTINOS, estadoDeHoja } from '../mock'
import { asignacionSchema } from '../schemas'
import { usePickingStore } from '../store'
import type { EstadoHoja, HojaCola, Requisicion } from '../types'

const picking = usePickingStore()
const movil = useEsMovil()

const semanas = computed(() =>
  [...new Set(picking.cola.map((hoja) => hoja.semana))].sort((a, b) => b - a),
)
const semana = ref<number | null>(null)
const destino = ref<string | null>(null)
const busqueda = ref('')
const requisiciones = ref<Requisicion[]>(['N', 'R'])
const estadosFiltro = ref<EstadoHoja[]>(['libre', 'asignada', 'atendida'])
const seleccion = ref<string[]>([])
const aviso = ref('')

watch(
  semanas,
  (lista) => {
    if (semana.value == null || !lista.includes(semana.value)) semana.value = lista[0] ?? null
  },
  { immediate: true },
)

watch(semana, () => {
  seleccion.value = []
  aviso.value = ''
})

const opcionesSemana = computed(() =>
  semanas.value.map((numero) => ({ label: `Semana ${numero}`, value: numero })),
)
const opcionesDestino = DESTINOS.map((nombre) => ({ label: nombre, value: nombre }))

const deLaSemana = computed(() => picking.cola.filter((hoja) => hoja.semana === semana.value))

const visibles = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()
  return deLaSemana.value.filter((hoja) => {
    const coincide =
      texto.length === 0 ||
      hoja.codigo.toLowerCase().includes(texto) ||
      (hoja.asignadaA ?? '').toLowerCase().includes(texto)
    return (
      coincide &&
      requisiciones.value.includes(hoja.requisicion) &&
      estadosFiltro.value.includes(estadoDeHoja(hoja))
    )
  })
})

const conteo = computed(() => {
  const base = { total: deLaSemana.value.length, libres: 0, asignadas: 0, atendidas: 0 }
  for (const hoja of deLaSemana.value) {
    const estado = estadoDeHoja(hoja)
    if (estado === 'libre') base.libres += 1
    else if (estado === 'asignada') base.asignadas += 1
    else base.atendidas += 1
  }
  return base
})

const carga = computed(() => {
  const mapa = new Map<string, { nombre: string; enPiso: number; atendidas: number }>()
  for (const hoja of deLaSemana.value) {
    if (!hoja.asignadaA) continue
    const actual = mapa.get(hoja.asignadaA) ?? { nombre: hoja.asignadaA, enPiso: 0, atendidas: 0 }
    if (estadoDeHoja(hoja) === 'atendida') actual.atendidas += 1
    else actual.enPiso += 1
    mapa.set(hoja.asignadaA, actual)
  }
  return [...mapa.values()]
})

function marcada(codigo: string) {
  return seleccion.value.includes(codigo)
}

function alternar(codigo: string, activa: boolean) {
  const hoja = picking.cola.find((item) => item.codigo === codigo)
  if (!hoja || estadoDeHoja(hoja) === 'atendida') return
  seleccion.value = activa
    ? [...new Set([...seleccion.value, codigo])]
    : seleccion.value.filter((item) => item !== codigo)
}

function elegir(codigo: string) {
  alternar(codigo, !marcada(codigo))
}

function seleccionarLibres() {
  const libres = visibles.value
    .filter((hoja) => estadoDeHoja(hoja) === 'libre')
    .map((hoja) => hoja.codigo)
  seleccion.value = [...new Set([...seleccion.value, ...libres])]
}

function limpiar() {
  seleccion.value = []
}

function alternarRequisicion(valor: Requisicion) {
  requisiciones.value = requisiciones.value.includes(valor)
    ? requisiciones.value.filter((item) => item !== valor)
    : [...requisiciones.value, valor]
}

function alternarEstado(valor: EstadoHoja) {
  estadosFiltro.value = estadosFiltro.value.includes(valor)
    ? estadosFiltro.value.filter((item) => item !== valor)
    : [...estadosFiltro.value, valor]
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
    resultado.asignadas.length > 0 ? `Asignadas: ${resultado.asignadas.join(', ')}.` : '',
    resultado.reasignadas.length > 0 ? `Reasignadas: ${resultado.reasignadas.join(', ')}.` : '',
    resultado.omitidas.length > 0 ? `Sin cambio: ${resultado.omitidas.join(', ')}.` : '',
  ].filter(Boolean)
  aviso.value = partes.join(' ')
  seleccion.value = []
}

function anular() {
  if (seleccion.value.length === 0) {
    aviso.value = 'Elige al menos una hoja.'
    return
  }
  const anuladas = picking.anularHojas(seleccion.value)
  aviso.value =
    anuladas.length > 0
      ? `Quedaron libres: ${anuladas.join(', ')}.`
      : 'No hay hojas asignadas que puedas anular. Las atendidas no cambian.'
  seleccion.value = []
}

function textoEstado(hoja: HojaCola) {
  const estado = estadoDeHoja(hoja)
  if (estado === 'libre') return 'Libre'
  if (estado === 'asignada') return 'Asignada'
  return 'Atendida'
}

function tonoEstado(hoja: HojaCola): 'default' | 'warning' | 'success' {
  const estado = estadoDeHoja(hoja)
  if (estado === 'atendida') return 'success'
  if (estado === 'asignada') return 'warning'
  return 'default'
}
</script>

<template>
  <PlataformaLayout>
    <n-space vertical :size="movil ? 8 : 16">
      <n-space vertical :size="4">
        <n-text strong style="font-size: 20px">Asignación</n-text>
        <n-text depth="3">
          Elige la semana y marca las hojas. La misma acción asigna las libres y pasa a otro
          operario las que ya tenían uno. El surtido no se asigna aquí: lo toma cada persona en la
          mesa.
        </n-text>
      </n-space>

      <n-grid cols="1 desktop:4" responsive="screen" :x-gap="16" :y-gap="12">
        <n-gi span="1 desktop:3">
          <n-space vertical :size="12">
            <n-card size="small" :content-style="movil ? 'padding: 8px' : undefined">
              <n-space vertical :size="12">
                <n-grid cols="1 tablet:2" responsive="screen" :x-gap="12" :y-gap="8">
                  <n-gi>
                    <n-form-item label="Semana" :show-feedback="false">
                      <n-select v-model:value="semana" :options="opcionesSemana" />
                    </n-form-item>
                  </n-gi>
                  <n-gi>
                    <n-form-item label="Operario" :show-feedback="false">
                      <n-select
                        v-model:value="destino"
                        :options="opcionesDestino"
                        placeholder="Elige un operario"
                      />
                    </n-form-item>
                  </n-gi>
                </n-grid>

                <n-space align="center" :size="8">
                  <n-text depth="3">{{ seleccion.length }} seleccionadas</n-text>
                  <n-button
                    type="primary"
                    :disabled="seleccion.length === 0"
                    @click="asignar"
                  >
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
                    Se quita el operario de las hojas seleccionadas. Las atendidas no cambian.
                  </n-popconfirm>
                  <n-button quaternary :disabled="!picking.puedeAsignar" @click="seleccionarLibres">
                    Seleccionar libres
                  </n-button>
                  <n-button quaternary :disabled="seleccion.length === 0" @click="limpiar">
                    Limpiar
                  </n-button>
                </n-space>

                <n-alert v-if="aviso" type="info" :show-icon="false">{{ aviso }}</n-alert>
              </n-space>
            </n-card>

            <n-grid cols="2 tablet:4" responsive="screen" :x-gap="8" :y-gap="8">
              <n-gi><n-statistic label="Total" :value="conteo.total" /></n-gi>
              <n-gi><n-statistic label="Libres" :value="conteo.libres" /></n-gi>
              <n-gi><n-statistic label="Asignadas" :value="conteo.asignadas" /></n-gi>
              <n-gi><n-statistic label="Atendidas" :value="conteo.atendidas" /></n-gi>
            </n-grid>

            <n-input v-model:value="busqueda" clearable placeholder="Buscar hoja u operario" />

            <n-space :size="8">
              <n-button
                size="small"
                :type="requisiciones.includes('N') ? 'primary' : 'default'"
                :secondary="!requisiciones.includes('N')"
                @click="alternarRequisicion('N')"
              >
                Nuevas
              </n-button>
              <n-button
                size="small"
                :type="requisiciones.includes('R') ? 'primary' : 'default'"
                :secondary="!requisiciones.includes('R')"
                @click="alternarRequisicion('R')"
              >
                Reposición
              </n-button>
              <n-button
                size="small"
                :type="estadosFiltro.includes('libre') ? 'primary' : 'default'"
                :secondary="!estadosFiltro.includes('libre')"
                @click="alternarEstado('libre')"
              >
                Libres
              </n-button>
              <n-button
                size="small"
                :type="estadosFiltro.includes('asignada') ? 'primary' : 'default'"
                :secondary="!estadosFiltro.includes('asignada')"
                @click="alternarEstado('asignada')"
              >
                Asignadas
              </n-button>
              <n-button
                size="small"
                :type="estadosFiltro.includes('atendida') ? 'primary' : 'default'"
                :secondary="!estadosFiltro.includes('atendida')"
                @click="alternarEstado('atendida')"
              >
                Atendidas
              </n-button>
            </n-space>

            <n-empty
              v-if="visibles.length === 0"
              description="No hay hojas con ese filtro en la semana."
            />
            <n-grid v-else cols="2 tablet:3" responsive="screen" :x-gap="8" :y-gap="8">
              <n-gi v-for="hoja in visibles" :key="hoja.codigo">
                <n-card
                  size="small"
                  :hoverable="estadoDeHoja(hoja) !== 'atendida'"
                  :embedded="estadoDeHoja(hoja) === 'atendida'"
                  :style="estadoDeHoja(hoja) === 'atendida' ? undefined : 'cursor: pointer'"
                  :content-style="movil ? 'padding: 8px' : undefined"
                  @click="elegir(hoja.codigo)"
                >
                  <n-space vertical :size="6">
                    <n-checkbox
                      :checked="marcada(hoja.codigo)"
                      :disabled="estadoDeHoja(hoja) === 'atendida'"
                      @click.stop
                      @update:checked="(activa: boolean) => alternar(hoja.codigo, activa)"
                    >
                      {{ hoja.codigo }}
                    </n-checkbox>
                    <n-space :size="6">
                      <n-tag size="small">{{ hoja.requisicion === 'N' ? 'Nueva' : 'Reposición' }}</n-tag>
                      <n-tag size="small" :type="tonoEstado(hoja)">{{ textoEstado(hoja) }}</n-tag>
                    </n-space>
                    <n-text depth="3" tag="div">
                      {{ hoja.area }} · {{ hoja.lineas }} líneas
                    </n-text>
                    <n-text tag="div">{{ hoja.asignadaA ?? 'Sin operario' }}</n-text>
                  </n-space>
                </n-card>
              </n-gi>
            </n-grid>
          </n-space>
        </n-gi>

        <n-gi>
          <n-card size="small" title="Carga de la semana" :content-style="movil ? 'padding: 8px' : undefined">
            <n-empty v-if="carga.length === 0" description="Nadie tiene hojas esta semana." />
            <n-space v-else vertical :size="10">
              <n-space
                v-for="persona in carga"
                :key="persona.nombre"
                vertical
                :size="2"
              >
                <n-text strong>{{ persona.nombre }}</n-text>
                <n-text depth="3">
                  {{ persona.enPiso }} en piso · {{ persona.atendidas }} atendidas
                </n-text>
              </n-space>
            </n-space>
          </n-card>
        </n-gi>
      </n-grid>
    </n-space>
  </PlataformaLayout>
</template>
