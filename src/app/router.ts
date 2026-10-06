import { createRouter, createWebHistory } from 'vue-router'
import { usePickingStore } from '../features/picking/store'
import type { Acceso } from '../features/picking/types'
import LoginView from '../features/picking/auth/LoginView.vue'
import AdministracionView from '../features/picking/piso/AdministracionView.vue'
import AsignacionView from '../features/picking/piso/AsignacionView.vue'
import ReportesView from '../features/picking/piso/ReportesView.vue'
import ExtraccionView from '../features/picking/extraccion/ExtraccionView.vue'
import { inicioDeRol } from './navegacion'

const accesos = ['ejecutar', 'asignar', 'reasignar', 'reportar', 'administrar']

function esAcceso(valor: unknown): valor is Acceso {
  return typeof valor === 'string' && accesos.includes(valor)
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'login', component: LoginView },
    {
      path: '/extraccion',
      name: 'extraccion',
      component: ExtraccionView,
      meta: { requiereSesion: true, acceso: 'ejecutar' },
    },
    {
      path: '/asignacion',
      name: 'asignacion',
      component: AsignacionView,
      meta: { requiereSesion: true, accesos: ['asignar', 'reasignar'] },
    },
    { path: '/reasignacion', redirect: { name: 'asignacion' } },
    {
      path: '/reportes',
      name: 'reportes',
      component: ReportesView,
      meta: { requiereSesion: true, acceso: 'reportar' },
    },
    {
      path: '/administracion',
      name: 'administracion',
      component: AdministracionView,
      meta: { requiereSesion: true, acceso: 'administrar' },
    },
  ],
})

router.beforeEach((to) => {
  const picking = usePickingStore()
  if (to.meta.requiereSesion && !picking.sesion) return { name: 'login' }
  if (to.name === 'login' && picking.sesion) return { name: inicioDeRol(picking.sesion.rol) }
  const pedidos = Array.isArray(to.meta.accesos) ? to.meta.accesos.filter(esAcceso) : []
  const accesoUnico = esAcceso(to.meta.acceso) ? [to.meta.acceso] : []
  const requeridos = pedidos.length > 0 ? pedidos : accesoUnico
  if (requeridos.length > 0 && picking.sesion && !requeridos.some((acceso) => picking.permite(acceso))) {
    return { name: inicioDeRol(picking.sesion.rol) }
  }
})
