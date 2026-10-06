<script setup lang="ts">
import { LogOut, Moon, RotateCcw, Sun, Warehouse } from 'lucide-vue-next'
import { computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EstadoRed from '../shared/ui/EstadoRed.vue'
import { useEsMovil } from '../shared/ui/useEsMovil'
import { useTema } from '../shared/ui/useTema'
import { usePickingStore } from '../features/picking/store'
import { entradas } from './navegacion'

const movil = useEsMovil()
const { oscuro, alternar } = useTema()
const etiquetaTema = computed(() => (oscuro.value ? 'Modo claro' : 'Modo oscuro'))

const route = useRoute()
const router = useRouter()
const picking = usePickingStore()

const opciones = computed(() =>
  entradas
    .filter((entrada) => entrada.accesos.some((acceso) => picking.permite(acceso)))
    .map((entrada) => ({
      label: entrada.titulo,
      key: entrada.nombre,
      icon: () => h(entrada.icono, { size: 16 }),
    })),
)

const activo = computed(() => (typeof route.name === 'string' ? route.name : ''))
const relleno = computed(() => (movil.value ? 'padding: 8px 8px 16px' : 'padding: 16px 20px 32px'))
const rellenoIdentidad = computed(() => (movil.value ? 'padding: 8px 10px' : 'padding: 10px 16px'))

function ir(clave: string) {
  if (clave === activo.value) return
  void router.push({ name: clave })
}

function salir() {
  picking.logout()
  void router.push({ name: 'login' })
}
</script>

<template>
  <n-layout position="absolute">
    <n-layout-header bordered style="padding: 0">
      <n-space vertical :size="0">
        <n-space justify="space-between" align="center" :wrap="false" :style="rellenoIdentidad">
          <n-space align="center" :size="10" :wrap="false">
            <n-avatar round :size="34" color="#18a058">
              <Warehouse :size="18" color="#fff" />
            </n-avatar>
            <n-space vertical :size="0">
              <n-text strong>Picking</n-text>
              <n-text depth="3" style="font-size: 12px">
                {{ picking.sesion?.etiqueta }} · {{ picking.sesion?.dni }}
              </n-text>
            </n-space>
          </n-space>
          <n-space align="center" :size="4" :wrap="false">
            <EstadoRed />
            <n-tooltip>
              <template #trigger>
                <n-button
                  quaternary
                  circle
                  :aria-label="etiquetaTema"
                  @click="alternar"
                >
                  <template #icon>
                    <Sun v-if="oscuro" :size="18" />
                    <Moon v-else :size="18" />
                  </template>
                </n-button>
              </template>
              {{ etiquetaTema }}
            </n-tooltip>
            <n-tooltip :disabled="!movil">
              <template #trigger>
                <n-button
                  quaternary
                  :circle="movil"
                  :disabled="picking.resolviendo"
                  aria-label="Reiniciar"
                  @click="picking.reiniciar()"
                >
                  <template #icon>
                    <RotateCcw :size="16" />
                  </template>
                  <template v-if="!movil">Reiniciar</template>
                </n-button>
              </template>
              Reiniciar
            </n-tooltip>
            <n-tooltip :disabled="!movil">
              <template #trigger>
                <n-button quaternary :circle="movil" aria-label="Salir" @click="salir">
                  <template #icon>
                    <LogOut :size="16" />
                  </template>
                  <template v-if="!movil">Salir</template>
                </n-button>
              </template>
              Salir
            </n-tooltip>
          </n-space>
        </n-space>
        <div class="barra-nav">
          <n-menu
            mode="horizontal"
            responsive
            :value="activo"
            :options="opciones"
            @update:value="ir"
          />
        </div>
      </n-space>
    </n-layout-header>
    <n-layout-content :content-style="relleno">
      <slot />
    </n-layout-content>
  </n-layout>
</template>

<style scoped>
.barra-nav {
  background-color: color-mix(in srgb, #18a058 16%, var(--n-color));
  padding: 6px 8px;
}

.barra-nav:deep(.n-menu-item-content) {
  border-bottom-color: transparent !important;
  border-radius: 8px;
}

.barra-nav:deep(.n-menu-item-content::before) {
  display: block !important;
  border-radius: 8px;
}

.barra-nav:deep(.n-menu-item-content:not(.n-menu-item-content--selected):hover::before) {
  background-color: color-mix(in srgb, #18a058 18%, transparent);
}

.barra-nav:deep(.n-menu-item-content--selected::before) {
  background-color: #18a058 !important;
}

.barra-nav:deep(.n-menu-item-content--selected .n-menu-item-content-header),
.barra-nav:deep(.n-menu-item-content--selected .n-menu-item-content__icon) {
  color: #fff !important;
  font-weight: 600;
}
</style>
