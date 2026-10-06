<script setup lang="ts">
import { MapPin, PackageCheck, PackageX } from 'lucide-vue-next'
import { useEsMovil } from '../../../shared/ui/useEsMovil'
import type { Linea } from '../types'

defineProps<{
  linea: Linea
  bloqueada: boolean
}>()

const movil = useEsMovil()

const emit = defineEmits<{
  retirar: []
  noEncontrada: []
}>()
</script>

<template>
  <n-card
    size="small"
    :title="linea.descripcion"
    :content-style="movil ? 'padding: 4px 8px 8px' : undefined"
    :header-style="movil ? 'padding: 8px 8px 0' : undefined"
  >
    <template #header-extra>
      <n-tag v-if="linea.estado === 'retirada'" type="success" size="small">Retirada</n-tag>
      <n-tag v-else-if="linea.reubicada" type="warning" size="small">Nueva ubicación</n-tag>
      <n-tag v-else size="small">Por retirar</n-tag>
    </template>
    <n-space vertical :size="movil ? 8 : 12">
      <n-text depth="3">SKU {{ linea.sku }} · {{ linea.cantidad }} {{ linea.unidad }}</n-text>
      <n-space :size="movil ? 6 : 8" align="center">
        <MapPin :size="16" />
        <n-text strong>{{ linea.ubicacion }}</n-text>
        <n-text depth="3">Lote {{ linea.lote }}</n-text>
        <n-text depth="3">{{ linea.ordenProduccion }}</n-text>
      </n-space>
      <n-alert v-if="linea.reubicada && linea.ubicacionAnterior" type="warning" :show-icon="false">
        Antes estaba en {{ linea.ubicacionAnterior }}, lote {{ linea.loteAnterior }}. La hoja se
        actualizó con esta ubicación.
      </n-alert>
      <n-grid
        v-if="linea.estado === 'asignada'"
        cols="2"
        :x-gap="movil ? 8 : 12"
        :y-gap="8"
      >
        <n-gi>
          <n-button
            type="primary"
            block
            :disabled="bloqueada"
            :style="movil ? 'white-space: normal; height: auto; padding: 8px 6px' : undefined"
            @click="emit('retirar')"
          >
            <template #icon>
              <PackageCheck :size="18" />
            </template>
            La retiré
          </n-button>
        </n-gi>
        <n-gi>
          <n-button
            block
            secondary
            :disabled="bloqueada"
            :style="movil ? 'white-space: normal; height: auto; padding: 8px 6px' : undefined"
            @click="emit('noEncontrada')"
          >
            <template #icon>
              <PackageX :size="18" />
            </template>
            No está aquí
          </n-button>
        </n-gi>
      </n-grid>
    </n-space>
  </n-card>
</template>
