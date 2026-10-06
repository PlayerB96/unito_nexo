<script setup lang="ts">
import {
  ClipboardCheck,
  ClipboardList,
  Eye,
  LogIn,
  MapPin,
  Package,
  Shield,
  TriangleAlert,
  Warehouse,
} from 'lucide-vue-next'
import type { GlobalThemeOverrides } from 'naive-ui'
import { computed, nextTick, onMounted, reactive, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { inicioDeRol } from '../../../app/navegacion'
import EstadoRed from '../../../shared/ui/EstadoRed.vue'
import { useEsMovil } from '../../../shared/ui/useEsMovil'
import { USUARIOS } from '../mock'
import { loginSchema } from '../schemas'
import { usePickingStore } from '../store'
import type { Rol, UsuarioPrueba } from '../types'

const resumenRol: Record<Rol, string> = {
  operario: 'Retira las líneas en su ubicación.',
  auxiliar: 'Asigna y reasigna las hojas de la semana.',
  supervisor: 'Ve el dashboard y reasigna las hojas de la semana.',
  administrador: 'Entra a toda la operación y a la administración.',
}

const iconoRol: Record<Rol, typeof Package> = {
  operario: Package,
  auxiliar: ClipboardList,
  supervisor: Eye,
  administrador: Shield,
}

const pasos = [
  {
    icono: ClipboardCheck,
    titulo: 'Hoja completa',
    detalle: 'Cada línea ya está cubierta. Lo pendiente no se asigna.',
  },
  {
    icono: MapPin,
    titulo: 'Extracción en piso',
    detalle: 'Retiras en la ubicación y el lote que indica la hoja.',
  },
  {
    icono: TriangleAlert,
    titulo: 'Si no está',
    detalle: 'Marcas la línea y la ubicación. El resto de la hoja sigue.',
  },
]

const temaAcceso: GlobalThemeOverrides = {
  common: {
    borderRadius: '10px',
  },
  Card: {
    borderRadius: '16px',
  },
}

const router = useRouter()
const picking = usePickingStore()
const movil = useEsMovil()
const dniInput = useTemplateRef('dniInput')
const estiloVentana = computed(() => ({
  width: '100%',
  maxWidth: movil.value ? '440px' : '860px',
  overflow: 'hidden',
  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
}))

const form = reactive({
  dni: '',
  clave: '',
})
const errores = reactive({
  dni: '',
  clave: '',
  acceso: '',
})
const entrando = ref(false)

onMounted(() => {
  dniInput.value?.focus()
})

function limpiarErrores() {
  errores.dni = ''
  errores.clave = ''
  errores.acceso = ''
}

async function entrarComo(usuario: UsuarioPrueba) {
  if (entrando.value) return
  form.dni = usuario.dni
  form.clave = usuario.clave
  await nextTick()
  await entrar()
}

async function entrar() {
  limpiarErrores()
  const validacion = loginSchema.safeParse(form)
  if (!validacion.success) {
    for (const issue of validacion.error.issues) {
      const campo = issue.path[0]
      if (campo === 'dni' || campo === 'clave') errores[campo] = issue.message
    }
    return
  }
  entrando.value = true
  const ok = picking.login(validacion.data.dni, validacion.data.clave)
  entrando.value = false
  if (!ok) {
    errores.acceso = 'DNI o clave incorrectos.'
    return
  }
  const rol = picking.sesion?.rol
  if (!rol) return
  await router.push({ name: inicioDeRol(rol) })
}
</script>

<template>
  <n-config-provider :theme-overrides="temaAcceso">
    <n-layout
      embedded
      position="absolute"
      content-style="display: flex; justify-content: center; align-items: safe center; min-height: 100%; box-sizing: border-box; padding: 28px 24px"
    >
        <n-card :bordered="true" content-style="padding: 0" :style="estiloVentana">
          <n-grid :cols="movil ? 1 : 12" :x-gap="0">
            <n-gi v-if="!movil" :span="5">
              <n-card
                embedded
                :bordered="false"
                style="height: 100%"
                content-style="display: flex; align-items: center; height: 100%; box-sizing: border-box; padding: 28px; box-shadow: inset -1px 0 0 var(--n-border-color)"
              >
              <n-space vertical :size="24" style="width: 100%">
                <n-space align="center" :size="10">
                  <Warehouse :size="22" />
                  <n-text strong>La Número Uno</n-text>
                </n-space>
                <n-space vertical :size="8">
                  <n-h2 style="margin: 0">Picking del centro de distribución</n-h2>
                  <n-text depth="3">
                    Extracción de almacén y mesa de distribución. Entras con tu DNI y trabajas la
                    hoja que ya está cubierta.
                  </n-text>
                </n-space>
                <n-space vertical :size="20">
                  <n-thing
                    v-for="paso in pasos"
                    :key="paso.titulo"
                    :title="paso.titulo"
                    :description="paso.detalle"
                  >
                    <template #avatar>
                      <component :is="paso.icono" :size="20" />
                    </template>
                  </n-thing>
                </n-space>
              </n-space>
              </n-card>
            </n-gi>
            <n-gi :span="movil ? 1 : 7" style="padding: 22px 28px 28px">
              <n-space vertical :size="20">
                <n-space justify="space-between" align="center">
                  <n-text strong style="font-size: 18px">Ingresar</n-text>
                  <EstadoRed />
                </n-space>
                <n-space v-if="movil" align="center" :size="8">
                  <Warehouse :size="18" />
                  <n-text depth="3">Picking · La Número Uno</n-text>
                </n-space>
                <n-text depth="3">DNI de 8 dígitos y tu clave.</n-text>
                <n-alert v-if="errores.acceso" type="error">
                  {{ errores.acceso }}
                </n-alert>
                <n-form @submit.prevent="entrar">
                  <n-form-item
                    label="DNI"
                    :validation-status="errores.dni ? 'error' : undefined"
                    :feedback="errores.dni || undefined"
                  >
                    <n-input
                      ref="dniInput"
                      v-model:value="form.dni"
                      size="large"
                      placeholder="8 dígitos"
                      inputmode="numeric"
                      maxlength="8"
                      autocomplete="username"
                      :disabled="entrando"
                      @update:value="errores.dni = ''"
                    />
                  </n-form-item>
                  <n-form-item
                    label="Clave"
                    :validation-status="errores.clave ? 'error' : undefined"
                    :feedback="errores.clave || undefined"
                  >
                    <n-input
                      v-model:value="form.clave"
                      size="large"
                      type="password"
                      show-password-on="click"
                      placeholder="Tu clave"
                      autocomplete="current-password"
                      :disabled="entrando"
                      @update:value="errores.clave = ''"
                    />
                  </n-form-item>
                  <n-button type="primary" size="large" attr-type="submit" block :loading="entrando">
                    <template #icon>
                      <LogIn :size="18" />
                    </template>
                    Entrar
                  </n-button>
                </n-form>
                <n-divider style="margin: 0">Probar un puesto</n-divider>
                <n-text depth="3">Un toque entra directo. Sirve para recorrer cada vista.</n-text>
                <n-space vertical :size="8">
                  <n-button
                    v-for="usuario in USUARIOS"
                    :key="usuario.dni"
                    secondary
                    block
                    :disabled="entrando"
                    style="height: auto; justify-content: flex-start; padding: 10px 12px; white-space: normal"
                    @click="entrarComo(usuario)"
                  >
                    <n-space align="center" :size="10">
                      <component :is="iconoRol[usuario.rol]" :size="18" />
                      <n-space vertical :size="0" align="start">
                        <n-text strong>{{ usuario.etiqueta }} · {{ usuario.dni }}</n-text>
                        <n-text depth="3">{{ resumenRol[usuario.rol] }}</n-text>
                      </n-space>
                    </n-space>
                  </n-button>
                </n-space>
              </n-space>
            </n-gi>
          </n-grid>
        </n-card>
    </n-layout>
  </n-config-provider>
</template>
