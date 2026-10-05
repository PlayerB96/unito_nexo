import { type DBSchema, openDB } from 'idb'

interface AlmacenLocal extends DBSchema {
  hojas: {
    key: string
    value: {
      codigo: string
      guardadaEn: string
    }
  }
  cola: {
    key: number
    value: {
      id?: number
      tipo: string
      ocurridoEn: string
    }
  }
}

export function abrirAlmacenLocal() {
  return openDB<AlmacenLocal>('unito-nexo', 1, {
    upgrade(base) {
      if (!base.objectStoreNames.contains('hojas')) {
        base.createObjectStore('hojas', { keyPath: 'codigo' })
      }
      if (!base.objectStoreNames.contains('cola')) {
        base.createObjectStore('cola', { keyPath: 'id', autoIncrement: true })
      }
    },
  })
}
