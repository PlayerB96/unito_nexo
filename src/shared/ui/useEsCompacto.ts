import { onUnmounted, ref } from 'vue'
import { breakpoints } from './breakpoints'

/** Celular y tablet: por debajo del desktop del proyecto. */
export function useEsCompacto() {
  const consulta = window.matchMedia(`(max-width: ${breakpoints.desktop - 1}px)`)
  const compacto = ref(consulta.matches)
  const actualizar = () => {
    compacto.value = consulta.matches
  }
  consulta.addEventListener('change', actualizar)
  onUnmounted(() => {
    consulta.removeEventListener('change', actualizar)
  })
  return compacto
}
