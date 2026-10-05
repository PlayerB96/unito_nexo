<script setup lang="ts">
import { Lock } from 'lucide-vue-next'

defineProps<{
  titulo: string
  motivo: string
}>()
</script>

<template>
  <n-card :title="titulo" size="small">
    <template #header-extra>
      <n-tag size="small">Sin acceso</n-tag>
    </template>
    <n-space align="center" :size="8">
      <Lock :size="16" />
      <n-text depth="3">{{ motivo }}</n-text>
    </n-space>
  </n-card>
</template>
