<script setup lang="ts">
import { usePickingStore } from '../store'

const picking = usePickingStore()

const nombreRol = {
  operario: 'Operario',
  auxiliar: 'Auxiliar',
  supervisor: 'Supervisor',
  administrador: 'Administrador',
} as const
</script>

<template>
  <n-card title="Cuentas" size="small">
    <n-space vertical :size="8">
      <n-text depth="3">Quien entra con estos DNI usa el rol que figura aquí.</n-text>
      <n-text v-for="usuario in picking.cuentas" :key="usuario.dni" tag="div">
        <n-text strong>{{ usuario.etiqueta }}</n-text>
        <n-text v-if="usuario.etiqueta !== nombreRol[usuario.rol]" depth="3">
          · {{ nombreRol[usuario.rol] }}
        </n-text>
        <n-text depth="3"> · DNI {{ usuario.dni }}</n-text>
      </n-text>
    </n-space>
  </n-card>
</template>
