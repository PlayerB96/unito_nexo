<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui'
import { NProgress } from 'naive-ui'
import { computed, h } from 'vue'
import PlataformaLayout from '../../../app/PlataformaLayout.vue'
import { useEsMovil } from '../../../shared/ui/useEsMovil'
import { usePickingStore } from '../store'

type Carga = {
  nombre: string
  hojas: number
  lineas: number
  porRetirar: number
  retiradas: number
  pendientes: number
  faltantes: number
  avance: number
}

const picking = usePickingStore()
const movil = useEsMovil()

const semana = computed(() => Math.max(...picking.cola.map((hoja) => hoja.semana)))
const hojasSemana = computed(() => picking.cola.filter((hoja) => hoja.semana === semana.value))

const carga = computed(() => {
  const mapa = new Map<string, Carga>()
  for (const hoja of hojasSemana.value) {
    const nombre = hoja.asignadaA ?? 'Sin asignar'
    const actual = mapa.get(nombre) ?? {
      nombre,
      hojas: 0,
      lineas: 0,
      porRetirar: 0,
      retiradas: 0,
      pendientes: 0,
      faltantes: 0,
      avance: 0,
    }
    actual.hojas += 1
    actual.lineas += hoja.lineas
    actual.porRetirar += hoja.porRetirar
    actual.retiradas += hoja.retiradas
    actual.pendientes += hoja.pendientes
    actual.faltantes += hoja.faltantes
    mapa.set(nombre, actual)
  }
  return [...mapa.values()].map((persona) => {
    const total = persona.porRetirar + persona.retiradas
    return {
      ...persona,
      avance: total === 0 ? 0 : Math.round((persona.retiradas / total) * 100),
    }
  })
})

const columnas: DataTableColumns<Carga> = [
  { title: 'Persona', key: 'nombre', width: 200, ellipsis: { tooltip: true } },
  { title: 'Hojas', key: 'hojas', width: 80, align: 'right' },
  { title: 'Líneas', key: 'lineas', width: 80, align: 'right' },
  { title: 'Por retirar', key: 'porRetirar', width: 110, align: 'right' },
  { title: 'Retiradas', key: 'retiradas', width: 100, align: 'right' },
  { title: 'Pendientes', key: 'pendientes', width: 110, align: 'right' },
  { title: 'Faltantes', key: 'faltantes', width: 100, align: 'right' },
  {
    title: 'Avance',
    key: 'avance',
    width: 160,
    render: (fila) =>
      h(NProgress, {
        type: 'line',
        percentage: fila.avance,
        indicatorPlacement: 'inside',
      }),
  },
]
</script>

<template>
  <PlataformaLayout>
    <n-space vertical :size="movil ? 8 : 16">
      <n-space vertical :size="4">
        <n-text strong style="font-size: 20px">Dashboard</n-text>
        <n-text depth="3">
          Avance de la extracción, faltantes de piso y carga por persona.
        </n-text>
      </n-space>

      <n-card size="small" title="Extracción" :content-style="movil ? 'padding: 8px' : undefined">
        <n-space vertical :size="8">
          <n-text>
            Hoja {{ picking.hoja.codigo }} · {{ picking.hoja.turno }} · {{ picking.hoja.fecha }}
          </n-text>
          <n-progress type="line" :percentage="picking.avance" :show-indicator="true" />
          <n-grid cols="2 tablet:4" responsive="screen" :x-gap="8" :y-gap="8">
            <n-gi>
              <n-statistic label="Por retirar" :value="picking.porRetirar.length" />
            </n-gi>
            <n-gi>
              <n-statistic label="Retiradas" :value="picking.retiradas.length" />
            </n-gi>
            <n-gi>
              <n-statistic label="Pendientes" :value="picking.pendientes.length" />
            </n-gi>
            <n-gi>
              <n-statistic label="Faltantes" :value="picking.faltantes.length" />
            </n-gi>
          </n-grid>
        </n-space>
      </n-card>

      <n-card size="small" title="Carga por persona" :content-style="movil ? 'padding: 8px' : undefined">
        <n-data-table
          size="small"
          :columns="columnas"
          :data="carga"
          :bordered="false"
          :scroll-x="860"
        />
      </n-card>

      <n-card
        size="small"
        :title="`Hojas en piso · Semana ${semana}`"
        :content-style="movil ? 'padding: 8px' : undefined"
      >
        <n-space vertical :size="8">
          <n-text v-for="hoja in hojasSemana" :key="hoja.codigo" tag="div">
            <n-text strong>{{ hoja.codigo }}</n-text>
            <n-text depth="3">
              · {{ hoja.area }} · {{ hoja.lineas }} líneas ·
              {{ hoja.asignadaA ?? 'Sin asignar' }}
            </n-text>
          </n-text>
        </n-space>
      </n-card>

      <n-card size="small" title="Faltantes de piso" :content-style="movil ? 'padding: 8px' : undefined">
        <n-text v-if="picking.faltantes.length === 0" depth="3">
          Todavía no hay ubicaciones con faltante.
        </n-text>
        <n-space v-else vertical :size="8">
          <n-text v-for="faltante in picking.faltantes" :key="faltante.id" tag="div">
            <n-text strong>{{ faltante.ubicacion }}</n-text>
            <n-text depth="3">
              · {{ faltante.descripcion }} · lote {{ faltante.lote }}. No se vuelve a prometer.
            </n-text>
          </n-text>
        </n-space>
      </n-card>
    </n-space>
  </PlataformaLayout>
</template>
