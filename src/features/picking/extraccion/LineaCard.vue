<script setup lang="ts">
import { MapPin, PackageCheck, PackageX } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useEsCompacto } from '../../../shared/ui/useEsCompacto'
import { retiroSchema } from '../schemas'
import type { Linea } from '../types'

const props = defineProps<{
  linea: Linea
  bloqueada: boolean
}>()

const compacto = useEsCompacto()
const cantidad = ref(props.linea.cantidad)
const error = ref('')

watch(
  () => props.linea.cantidad,
  (valor) => {
    cantidad.value = valor
    error.value = ''
  },
)

const emit = defineEmits<{
  retirar: [cantidad: number]
  noEncontrada: []
}>()

const etiquetaEstado = computed(() => {
  if (props.linea.estado === 'retirada') return { tipo: 'success' as const, texto: 'Completo' }
  if (props.linea.reubicada) return { tipo: 'warning' as const, texto: 'Nueva ubicación' }
  if (props.linea.cantidad < props.linea.pedido)
    return { tipo: 'info' as const, texto: 'Parcial' }
  return { tipo: 'default' as const, texto: 'Por retirar' }
})

function confirmar() {
  const validacion = retiroSchema.safeParse({ cantidad: cantidad.value })
  if (!validacion.success) {
    error.value = validacion.error.issues[0]?.message ?? 'Indica la cantidad.'
    return
  }
  if (validacion.data.cantidad > props.linea.cantidad) {
    error.value = `Solo quedan ${props.linea.cantidad} ${props.linea.unidad}.`
    return
  }
  error.value = ''
  emit('retirar', validacion.data.cantidad)
}
</script>

<template>
  <n-card
    size="small"
    :content-style="compacto ? 'padding: 10px 10px 12px' : 'padding: 12px 14px'"
    :header-style="compacto ? 'padding: 10px 10px 0' : 'padding: 12px 14px 0'"
  >
    <template #header>
      <n-space :size="6" align="center" style="flex-wrap: wrap">
        <n-tag type="primary" size="small" :bordered="false">T/{{ linea.talla }}</n-tag>
        <n-tag size="small" :bordered="false">{{ linea.color }}</n-tag>
        <n-tag :type="etiquetaEstado.tipo" size="small">{{ etiquetaEstado.texto }}</n-tag>
      </n-space>
    </template>
    <n-space vertical :size="compacto ? 10 : 12">
      <n-space justify="space-between" align="center" style="flex-wrap: wrap; gap: 4px">
        <n-text depth="3">
          Quedan
          <n-text strong>{{ linea.cantidad }}</n-text>
          de {{ linea.pedido }} {{ linea.unidad }}
        </n-text>
        <n-text depth="3" style="font-size: 12px">SKU {{ linea.sku }}</n-text>
      </n-space>
      <n-space :size="6" align="center" style="flex-wrap: wrap">
        <MapPin :size="16" />
        <n-text strong>{{ linea.ubicacion }}</n-text>
        <n-text depth="3">Lote {{ linea.lote }}</n-text>
      </n-space>
      <n-alert v-if="linea.reubicada && linea.ubicacionAnterior" type="warning" :show-icon="false">
        Antes en {{ linea.ubicacionAnterior }}, lote {{ linea.loteAnterior }}.
      </n-alert>
      <template v-if="linea.estado === 'asignada'">
        <n-form-item
          label="Cantidad encontrada"
          :validation-status="error ? 'error' : undefined"
          :feedback="error || undefined"
          :show-label="true"
          style="margin-bottom: 0"
        >
          <n-input-number
            v-model:value="cantidad"
            :min="1"
            :max="linea.cantidad"
            :step="1"
            button-placement="both"
            style="width: 100%"
            :disabled="bloqueada"
          />
        </n-form-item>
        <n-grid cols="2" :x-gap="compacto ? 8 : 12" :y-gap="8">
          <n-gi>
            <n-button
              type="primary"
              block
              :disabled="bloqueada"
              :style="compacto ? 'min-height: 44px; white-space: normal; height: auto; padding: 10px 6px' : 'min-height: 40px'"
              @click="confirmar"
            >
              <template #icon>
                <PackageCheck :size="18" />
              </template>
              Encontré
            </n-button>
          </n-gi>
          <n-gi>
            <n-button
              block
              secondary
              :disabled="bloqueada"
              :style="compacto ? 'min-height: 44px; white-space: normal; height: auto; padding: 10px 6px' : 'min-height: 40px'"
              @click="emit('noEncontrada')"
            >
              <template #icon>
                <PackageX :size="18" />
              </template>
              No está
            </n-button>
          </n-gi>
        </n-grid>
      </template>
    </n-space>
  </n-card>
</template>
