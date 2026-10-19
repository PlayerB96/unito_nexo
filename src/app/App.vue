<script setup lang="ts">
import { dateEsES, esES } from 'naive-ui'
import { breakpoints } from '../shared/ui/breakpoints'
import { useTema } from '../shared/ui/useTema'

const { tema } = useTema()
</script>

<template>
  <n-config-provider :theme="tema" :locale="esES" :date-locale="dateEsES" :breakpoints="breakpoints">
    <n-global-style />
    <n-message-provider>
      <router-view />
    </n-message-provider>
  </n-config-provider>
</template>

<style>
/* Cambio dark/light instantáneo: Naive UI anima color/fondo ~0.3s por defecto */
html.sin-transicion-tema,
html.sin-transicion-tema *,
html.sin-transicion-tema *::before,
html.sin-transicion-tema *::after {
  transition: none !important;
  animation: none !important;
}
</style>
