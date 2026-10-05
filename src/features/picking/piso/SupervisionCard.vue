<script setup lang="ts">
import { usePickingStore } from '../store'
import RepartoCard from './RepartoCard.vue'

const picking = usePickingStore()
</script>

<template>
  <n-space vertical :size="16">
    <n-grid cols="2 tablet:4" responsive="screen" :x-gap="12" :y-gap="12">
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
    <n-card title="Pendientes y faltantes" size="small">
      <n-space vertical :size="8">
        <n-text v-for="item in picking.pendientes" :key="item.id" tag="div">
          {{ item.descripcion }} · {{ item.motivo }}
        </n-text>
        <n-text v-if="picking.faltantes.length === 0" depth="3">
          Todavía no hay ubicaciones con faltante.
        </n-text>
        <n-text v-for="faltante in picking.faltantes" :key="faltante.id" tag="div">
          {{ faltante.ubicacion }} · {{ faltante.descripcion }}. No se vuelve a prometer.
        </n-text>
      </n-space>
    </n-card>
    <RepartoCard titulo="Reasignar hoja" accion="Reasignar" />
  </n-space>
</template>
