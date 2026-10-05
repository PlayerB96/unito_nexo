<script setup lang="ts">
import { ref } from 'vue'
import { DESTINOS } from '../mock'
import { asignacionSchema } from '../schemas'
import { usePickingStore } from '../store'

defineProps<{
  titulo: string
  accion: string
}>()

const picking = usePickingStore()
const destino = ref<string | null>(null)
const error = ref('')

const opciones = DESTINOS.map((nombre) => ({ label: nombre, value: nombre }))

function repartir(codigo: string) {
  const validacion = asignacionSchema.safeParse({
    codigo,
    destino: destino.value ?? '',
  })
  if (!validacion.success) {
    error.value = validacion.error.issues[0]?.message ?? 'Elige un operario.'
    return
  }
  error.value = ''
  picking.asignarHoja(validacion.data.codigo, validacion.data.destino)
}
</script>

<template>
  <n-card :title="titulo" size="small">
    <n-space vertical :size="12">
      <n-form-item
        label="Operario"
        :validation-status="error ? 'error' : undefined"
        :feedback="error || undefined"
      >
        <n-select v-model:value="destino" :options="opciones" placeholder="Elige un operario" />
      </n-form-item>
      <n-space v-for="hojaCola in picking.cola" :key="hojaCola.codigo" vertical :size="4">
        <n-text strong>{{ hojaCola.codigo }} · {{ hojaCola.area }}</n-text>
        <n-text depth="3" tag="div">
          {{ hojaCola.lineas }} líneas ·
          {{ hojaCola.asignadaA ? `Asignada a ${hojaCola.asignadaA}` : 'Sin asignar' }}
        </n-text>
        <n-button size="small" :disabled="!destino" @click="repartir(hojaCola.codigo)">
          {{ accion }} {{ hojaCola.codigo }}
        </n-button>
      </n-space>
    </n-space>
  </n-card>
</template>
