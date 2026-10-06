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
