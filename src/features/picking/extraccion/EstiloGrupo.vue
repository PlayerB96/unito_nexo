<script setup lang="ts">
import { computed } from 'vue'
import { useEsCompacto } from '../../../shared/ui/useEsCompacto'
import type { Linea } from '../types'
import LineaCard from './LineaCard.vue'

const props = defineProps<{
  estilo: string
  descripcion: string
  lineas: Linea[]
  bloqueada: boolean
  defaultExpandido?: boolean
}>()

const emit = defineEmits<{
  retirar: [lineaId: string, cantidad: number]
  noEncontrada: [linea: Linea]
}>()

const compacto = useEsCompacto()

const pedido = computed(() => props.lineas.reduce((suma, l) => suma + l.pedido, 0))
const quedan = computed(() =>
  props.lineas
    .filter((l) => l.estado === 'asignada')
    .reduce((suma, l) => suma + l.cantidad, 0),
)
const retiradas = computed(() => pedido.value - quedan.value)
const avance = computed(() =>
  pedido.value === 0 ? 0 : Math.round((retiradas.value / pedido.value) * 100),
)
const porTalla = computed(() => {
  const mapa = new Map<string, Linea[]>()
  for (const linea of props.lineas) {
    const lista = mapa.get(linea.talla) ?? []
    lista.push(linea)
    mapa.set(linea.talla, lista)
  }
  return [...mapa.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([talla, lineas]) => ({
      talla,
      lineas: [...lineas].sort((a, b) => a.color.localeCompare(b.color)),
    }))
})

const nombresCollapse = computed(() =>
  props.defaultExpandido === false ? [] : [props.estilo],
)
</script>

<template>
  <n-collapse :default-expanded-names="nombresCollapse" display-directive="show">
    <n-collapse-item :name="estilo">
      <template #header>
        <n-space vertical :size="4" style="width: 100%; padding-right: 8px">
          <n-space justify="space-between" align="center" style="width: 100%; flex-wrap: wrap; gap: 4px">
            <n-text strong style="font-size: 16px">{{ estilo }}</n-text>
            <n-tag size="small" :type="quedan === 0 ? 'success' : 'info'" :bordered="false">
              {{ quedan }} / {{ pedido }} und
            </n-tag>
          </n-space>
          <n-text depth="3" style="font-size: 13px">{{ descripcion }}</n-text>
        </n-space>
      </template>
      <n-space vertical :size="compacto ? 10 : 12">
        <n-progress type="line" :percentage="avance" :height="6" :show-indicator="false" />
        <n-space
          v-for="grupo in porTalla"
          :key="grupo.talla"
          vertical
          :size="compacto ? 8 : 10"
        >
          <n-divider title-placement="left" style="margin: 4px 0">
            <n-text depth="3" style="font-size: 12px; letter-spacing: 0.02em">
              Talla {{ grupo.talla }}
            </n-text>
          </n-divider>
          <LineaCard
            v-for="linea in grupo.lineas"
            :key="linea.id"
            :linea="linea"
            :bloqueada="bloqueada"
            @retirar="(cantidad) => emit('retirar', linea.id, cantidad)"
            @no-encontrada="emit('noEncontrada', linea)"
          />
        </n-space>
      </n-space>
    </n-collapse-item>
  </n-collapse>
</template>
