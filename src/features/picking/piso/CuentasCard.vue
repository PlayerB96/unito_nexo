<script setup lang="ts">
import { USUARIOS } from '../mock'
</script>

<template>
  <n-card title="Cuentas" size="small">
    <n-space vertical :size="8">
      <n-text depth="3">Solo el administrador ve y reconoce estas cuentas.</n-text>
      <n-text v-for="usuario in USUARIOS" :key="usuario.dni" tag="div">
        <n-text strong>{{ usuario.etiqueta }}</n-text>
        <n-text depth="3"> · DNI {{ usuario.dni }}</n-text>
      </n-text>
    </n-space>
  </n-card>
</template>
