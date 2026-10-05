<script setup lang="ts">
import { LogIn } from 'lucide-vue-next'
import { nextTick, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import EstadoRed from '../../../shared/ui/EstadoRed.vue'
import { USUARIOS } from '../mock'
import { loginSchema } from '../schemas'
import { usePickingStore } from '../store'
import type { UsuarioPrueba } from '../types'

const router = useRouter()
const picking = usePickingStore()

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

function limpiarErrores() {
  errores.dni = ''
  errores.clave = ''
  errores.acceso = ''
}

async function entrarComo(usuario: UsuarioPrueba) {
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
  await router.push({ name: 'extraccion' })
}
</script>

<template>
  <n-layout position="absolute">
    <n-layout-content content-style="padding: 24px; display: flex; align-items: center;">
      <n-grid cols="1 tablet:3" responsive="screen" style="width: 100%">
        <n-gi span="1" offset="0 tablet:1">
          <n-card title="Picking del centro de distribución" size="large">
            <template #header-extra>
              <n-space align="center" :size="8">
                <EstadoRed />
                <LogIn :size="20" />
              </n-space>
            </template>
            <n-space vertical :size="16">
              <n-text depth="3">
                Elige un rol. El DNI y la clave se colocan en el formulario y entras a su vista.
              </n-text>
              <n-space vertical :size="8">
                <n-button
                  v-for="usuario in USUARIOS"
                  :key="usuario.dni"
                  block
                  secondary
                  :loading="entrando"
                  @click="entrarComo(usuario)"
                >
                  {{ usuario.etiqueta }} · {{ usuario.dni }}
                </n-button>
              </n-space>
              <n-alert v-if="errores.acceso" type="error" :show-icon="false">
                {{ errores.acceso }}
              </n-alert>
              <n-form @submit.prevent="entrar">
                <n-form-item
                  label="DNI"
                  :validation-status="errores.dni ? 'error' : undefined"
                  :feedback="errores.dni || undefined"
                >
                  <n-input
                    v-model:value="form.dni"
                    placeholder="8 dígitos"
                    inputmode="numeric"
                    maxlength="8"
                    autocomplete="username"
                  />
                </n-form-item>
                <n-form-item
                  label="Clave"
                  :validation-status="errores.clave ? 'error' : undefined"
                  :feedback="errores.clave || undefined"
                >
                  <n-input
                    v-model:value="form.clave"
                    type="password"
                    show-password-on="click"
                    placeholder="Clave"
                    autocomplete="current-password"
                  />
                </n-form-item>
                <n-button type="primary" attr-type="submit" block :loading="entrando">
                  <template #icon>
                    <LogIn :size="18" />
                  </template>
                  Entrar
                </n-button>
              </n-form>
            </n-space>
          </n-card>
        </n-gi>
      </n-grid>
    </n-layout-content>
  </n-layout>
</template>
