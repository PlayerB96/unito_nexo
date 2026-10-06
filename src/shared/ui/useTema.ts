import { darkTheme } from 'naive-ui'
import { computed, ref } from 'vue'

const clave = 'unito-nexo-tema'

function leerOscuro() {
  try {
    const guardado = localStorage.getItem(clave)
    if (guardado === 'oscuro') return true
    if (guardado === 'claro') return false
  } catch {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

const oscuro = ref(leerOscuro())

export function useTema() {
  const tema = computed(() => (oscuro.value ? darkTheme : null))

  function alternar() {
    oscuro.value = !oscuro.value
    try {
      localStorage.setItem(clave, oscuro.value ? 'oscuro' : 'claro')
    } catch {
      return
    }
  }

  return { oscuro, tema, alternar }
}
