import { onUnmounted, ref } from 'vue'

export function useConexion() {
  const enLinea = ref(navigator.onLine)

  function actualizar() {
    enLinea.value = navigator.onLine
  }

  window.addEventListener('online', actualizar)
  window.addEventListener('offline', actualizar)
  onUnmounted(() => {
    window.removeEventListener('online', actualizar)
    window.removeEventListener('offline', actualizar)
  })

  return enLinea
}
