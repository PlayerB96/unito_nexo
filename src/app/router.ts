import { createRouter, createWebHistory } from 'vue-router'
import { usePickingStore } from '../features/picking/store'
import LoginView from '../features/picking/auth/LoginView.vue'
import ExtraccionView from '../features/picking/extraccion/ExtraccionView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'login', component: LoginView },
    {
      path: '/extraccion',
      name: 'extraccion',
      component: ExtraccionView,
      meta: { requiereSesion: true },
    },
  ],
})

router.beforeEach((to) => {
  const picking = usePickingStore()
  if (to.meta.requiereSesion && !picking.sesion) return { name: 'login' }
  if (to.name === 'login' && picking.sesion) return { name: 'extraccion' }
})
