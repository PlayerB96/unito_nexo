<script setup lang="ts">
import { MapPin } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import { faltanteSchema } from '../schemas'
import type { Linea } from '../types'

const props = defineProps<{
  show: boolean
  linea: Linea | null
}>()

const emit = defineEmits<{
  'update:show': [valor: boolean]
  confirmar: [ubicacion: string]
}>()

const ubicacion = ref('')
const error = ref('')

watch(
  () => props.linea,
  (linea) => {
    ubicacion.value = linea?.ubicacion ?? ''
    error.value = ''
  },
)

function cerrar() {
  emit('update:show', false)
}

function confirmar() {
  const validacion = faltanteSchema.safeParse({ ubicacion: ubicacion.value })
  if (!validacion.success) {
    error.value = validacion.error.issues[0]?.message ?? 'Indica la ubicación donde buscaste.'
    return
  }
  emit('confirmar', validacion.data.ubicacion)
}
</script>

<template>
  <n-modal
    :show="show"
    preset="card"
    title="No está en la ubicación"
    style="width: min(440px, calc(100vw - 32px))"
    @update:show="emit('update:show', $event)"
  >
    <n-space v-if="linea" vertical :size="16">
      <n-text>
        {{ linea.descripcion }}, {{ linea.cantidad }} {{ linea.unidad }}. Indica dónde buscaste. El
        sistema suelta la reserva y busca otra cobertura de producción.
      </n-text>
      <n-form-item
        label="Ubicación donde busqué"
        :validation-status="error ? 'error' : undefined"
        :feedback="error || undefined"
      >
        <n-input v-model:value="ubicacion" placeholder="Ejemplo: B-04-01">
          <template #prefix>
            <MapPin :size="16" />
          </template>
        </n-input>
      </n-form-item>
      <n-space justify="end">
        <n-button @click="cerrar">Cancelar</n-button>
        <n-button type="primary" @click="confirmar">Registrar faltante</n-button>
      </n-space>
    </n-space>
  </n-modal>
</template>
