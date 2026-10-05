<script setup lang="ts">
import { Wifi, WifiOff } from 'lucide-vue-next'
import { useConexion } from './useConexion'

const enLinea = useConexion()
</script>

<template>
  <n-tag :type="enLinea ? 'success' : 'warning'" size="small">
    <template #icon>
      <Wifi v-if="enLinea" :size="14" />
      <WifiOff v-else :size="14" />
    </template>
    {{ enLinea ? 'En línea' : 'Sin red' }}
  </n-tag>
</template>
