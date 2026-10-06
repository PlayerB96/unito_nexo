<script setup lang="ts">
import { reactive } from 'vue'
import PlataformaLayout from '../../../app/PlataformaLayout.vue'
import { cuentaSchema } from '../schemas'
import { usePickingStore } from '../store'
import type { Rol } from '../types'
import CuentasCard from './CuentasCard.vue'

const areas = ['Picking', 'Avíos', 'Telas', 'Ingresos']

const roles: { label: string; value: Rol }[] = [
  { label: 'Operario', value: 'operario' },
  { label: 'Auxiliar', value: 'auxiliar' },
  { label: 'Supervisor', value: 'supervisor' },
  { label: 'Administrador', value: 'administrador' },
]

const picking = usePickingStore()
const form = reactive({
  nombre: '',
  dni: '',
  clave: '',
  rol: null as Rol | null,
})
const errores = reactive({
  nombre: '',
  dni: '',
  clave: '',
  rol: '',
  cuenta: '',
})
const creada = reactive({ visible: false, nombre: '' })

function limpiarErrores() {
  errores.nombre = ''
  errores.dni = ''
  errores.clave = ''
  errores.rol = ''
  errores.cuenta = ''
}

function crear() {
  limpiarErrores()
  creada.visible = false
  const validacion = cuentaSchema.safeParse(form)
  if (!validacion.success) {
    for (const issue of validacion.error.issues) {
      const campo = issue.path[0]
      if (campo === 'nombre' || campo === 'dni' || campo === 'clave' || campo === 'rol') {
        errores[campo] = issue.message
      }
    }
    return
  }
  const fallo = picking.crearCuenta(validacion.data)
  if (fallo) {
    errores.cuenta = fallo
    return
  }
  creada.nombre = validacion.data.nombre
  creada.visible = true
  form.nombre = ''
  form.dni = ''
  form.clave = ''
  form.rol = null
}
</script>

<template>
  <PlataformaLayout>
    <n-space vertical :size="16">
      <n-space vertical :size="4">
        <n-text strong style="font-size: 20px">Administración</n-text>
        <n-text depth="3">Cuentas del centro de distribución y áreas de la hoja.</n-text>
      </n-space>
      <n-grid cols="1 desktop:2" responsive="screen" :x-gap="16" :y-gap="16">
        <n-gi>
          <n-card title="Crear cuenta">
            <n-space vertical :size="12">
              <n-alert v-if="errores.cuenta" type="error">{{ errores.cuenta }}</n-alert>
              <n-alert v-if="creada.visible" type="success" :show-icon="false">
                {{ creada.nombre }} ya puede entrar con su DNI y su clave.
              </n-alert>
              <n-form @submit.prevent="crear">
                <n-form-item
                  label="Nombre"
                  :validation-status="errores.nombre ? 'error' : undefined"
                  :feedback="errores.nombre || undefined"
                >
                  <n-input v-model:value="form.nombre" placeholder="Nombre de quien opera" />
                </n-form-item>
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
                    placeholder="Clave de ingreso"
                  />
                </n-form-item>
                <n-form-item
                  label="Rol"
                  :validation-status="errores.rol ? 'error' : undefined"
                  :feedback="errores.rol || undefined"
                >
                  <n-select v-model:value="form.rol" :options="roles" placeholder="Elige un rol" />
                </n-form-item>
                <n-button type="primary" attr-type="submit">Crear cuenta</n-button>
              </n-form>
            </n-space>
          </n-card>
        </n-gi>
        <n-gi>
          <n-space vertical :size="16">
            <CuentasCard />
            <n-card title="Áreas de la hoja" size="small">
              <n-space vertical :size="8">
                <n-text depth="3">
                  Avíos, telas e ingresos son áreas de la hoja. No son roles.
                </n-text>
                <n-space :size="8">
                  <n-tag v-for="area in areas" :key="area">{{ area }}</n-tag>
                </n-space>
              </n-space>
            </n-card>
          </n-space>
        </n-gi>
      </n-grid>
    </n-space>
  </PlataformaLayout>
</template>
