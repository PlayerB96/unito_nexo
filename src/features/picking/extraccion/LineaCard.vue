<script setup lang="ts">
import { MapPin, PackageCheck, PackageX } from 'lucide-vue-next'
import type { Linea } from '../types'

defineProps<{
  linea: Linea
  bloqueada: boolean
}>()

const emit = defineEmits<{
  retirar: []
  noEncontrada: []
}>()
</script>

<template>
  <n-card size="small" :title="linea.descripcion">
    <template #header-extra>
      <n-tag v-if="linea.estado === 'retirada'" type="success" size="small">Retirada</n-tag>
      <n-tag v-else-if="linea.reubicada" type="warning" size="small">Nueva ubicación</n-tag>
      <n-tag v-else size="small">Por retirar</n-tag>
    </template>
    <n-space vertical :size="12">
      <n-text depth="3">SKU {{ linea.sku }} · {{ linea.cantidad }} {{ linea.unidad }}</n-text>
      <n-space :size="8" align="center">
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
        cols="1 tablet:2"
        responsive="screen"
        :x-gap="12"
        :y-gap="12"
      >
        <n-gi>
          <n-button type="primary" block :disabled="bloqueada" @click="emit('retirar')">
            <template #icon>
              <PackageCheck :size="18" />
            </template>
            La retiré
          </n-button>
        </n-gi>
        <n-gi>
          <n-button block secondary :disabled="bloqueada" @click="emit('noEncontrada')">
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
