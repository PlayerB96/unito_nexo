import { onUnmounted, ref } from 'vue'
import { breakpoints } from './breakpoints'

export function useEsMovil() {
  const consulta = window.matchMedia(`(max-width: ${breakpoints.tablet - 1}px)`)
  const movil = ref(consulta.matches)
  const actualizar = () => {
    movil.value = consulta.matches
  }
  consulta.addEventListener('change', actualizar)
  onUnmounted(() => {
    consulta.removeEventListener('change', actualizar)
  })
  return movil
}
