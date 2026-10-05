<script setup lang="ts">
import { dateEsES, esES } from 'naive-ui'
import { breakpoints } from '../shared/ui/breakpoints'
</script>

<template>
  <n-config-provider :locale="esES" :date-locale="dateEsES" :breakpoints="breakpoints">
    <n-global-style />
    <n-message-provider>
      <router-view />
    </n-message-provider>
  </n-config-provider>
</template>
