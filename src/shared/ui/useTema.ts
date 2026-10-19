import { darkTheme } from 'naive-ui'
import { computed, ref } from 'vue'

const clave = 'unito-nexo-tema'
const claseSinTransicion = 'sin-transicion-tema'

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

function sinTransicionTema(accion: () => void) {
  const root = document.documentElement
  root.classList.add(claseSinTransicion)
  accion()
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      root.classList.remove(claseSinTransicion)
    })
  })
}

export function useTema() {
  const tema = computed(() => (oscuro.value ? darkTheme : null))

  function alternar() {
    sinTransicionTema(() => {
      oscuro.value = !oscuro.value
      try {
        localStorage.setItem(clave, oscuro.value ? 'oscuro' : 'claro')
      } catch {
        return
      }
    })
  }

  return { oscuro, tema, alternar }
}
