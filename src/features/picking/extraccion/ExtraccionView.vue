<script setup lang="ts">
import { CircleCheck, Lock, LogOut, RotateCcw, Warehouse } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import EstadoRed from '../../../shared/ui/EstadoRed.vue'
import { useEsMovil } from '../../../shared/ui/useEsMovil'
import type { Linea } from '../types'
import { usePickingStore } from '../store'
import CuentasCard from '../piso/CuentasCard.vue'
import ModuloCerrado from '../piso/ModuloCerrado.vue'
import RepartoCard from '../piso/RepartoCard.vue'
import SupervisionCard from '../piso/SupervisionCard.vue'
import LineaCard from './LineaCard.vue'
import NoEncontradaDialog from './NoEncontradaDialog.vue'

const picking = usePickingStore()
const router = useRouter()
const movil = useEsMovil()
const lineaReportada = ref<Linea | null>(null)
const paso = computed(() => (picking.cerrada ? 4 : 2))
const accesos = computed(() => [
  { titulo: 'Extracción', permite: picking.puedeEjecutar },
  { titulo: 'Asignación', permite: picking.puedeAsignar },
  { titulo: 'Supervisión', permite: picking.puedeSupervisar },
  { titulo: 'Cuentas', permite: picking.puedeAdministrar },
])
const asignadaA = computed(
  () => picking.cola.find((item) => item.codigo === picking.hoja.codigo)?.asignadaA,
)

function salir() {
  picking.logout()
  void router.push({ name: 'login' })
}

function abrirFaltante(linea: Linea) {
  lineaReportada.value = linea
}

async function confirmarFaltante(ubicacion: string) {
  const linea = lineaReportada.value
  if (!linea) return
  lineaReportada.value = null
  await picking.reportarNoEncontrada(linea.id, ubicacion)
}
</script>

<template>
  <n-layout position="absolute">
    <n-layout-header bordered style="padding: 12px 16px">
      <n-space vertical :size="10">
        <n-space justify="space-between" align="center">
          <n-space align="center" :size="8">
            <Warehouse :size="20" />
            <n-text strong>Picking</n-text>
          </n-space>
          <n-space :size="8" align="center">
            <EstadoRed />
            <n-button :disabled="picking.resolviendo" @click="picking.reiniciar()">
              <template #icon>
                <RotateCcw :size="16" />
              </template>
              Reiniciar
            </n-button>
            <n-button quaternary @click="salir">
              <template #icon>
                <LogOut :size="16" />
              </template>
              Salir
            </n-button>
          </n-space>
        </n-space>
        <n-text depth="3">{{ picking.sesion?.etiqueta }} · {{ picking.sesion?.dni }}</n-text>
      </n-space>
    </n-layout-header>
    <n-layout-content content-style="padding: 16px 20px 32px;">
      <n-space vertical :size="16">
        <n-grid cols="2 tablet:4" responsive="screen" :x-gap="12" :y-gap="12">
          <n-gi v-for="acceso in accesos" :key="acceso.titulo">
            <n-card size="small">
              <n-space align="center" :size="8">
                <CircleCheck v-if="acceso.permite" :size="16" />
                <Lock v-else :size="16" />
                <n-text tag="div">
                  <n-text strong>{{ acceso.titulo }}</n-text>
                  <n-text depth="3" tag="div">
                    {{ acceso.permite ? 'Puede ver y usar' : 'No puede usar' }}
                  </n-text>
                </n-text>
              </n-space>
            </n-card>
          </n-gi>
        </n-grid>

        <template v-if="picking.puedeEjecutar">
        <n-steps :current="paso" size="small" :vertical="movil">
          <n-step title="Hoja asignada" description="Nació completa" />
          <n-step title="Extracción en piso" description="Retira o reporta" />
          <n-step title="Mercadería retirada" description="Pasa a la mesa" />
        </n-steps>

        <n-alert v-if="picking.ultimoEvento" :type="picking.ultimoEvento.tono" :show-icon="false">
          <n-text strong>{{ picking.ultimoEvento.titulo }}</n-text>
          <div>{{ picking.ultimoEvento.detalle }}</div>
        </n-alert>

        <n-grid cols="2 tablet:4" responsive="screen" :x-gap="12" :y-gap="12">
          <n-gi>
            <n-statistic label="Por retirar" :value="picking.porRetirar.length" />
          </n-gi>
          <n-gi>
            <n-statistic label="Retiradas" :value="picking.retiradas.length" />
          </n-gi>
          <n-gi>
            <n-statistic label="Pendientes" :value="picking.pendientes.length" />
          </n-gi>
          <n-gi>
            <n-statistic label="Faltantes" :value="picking.faltantes.length" />
          </n-gi>
        </n-grid>

        <n-grid cols="1 desktop:3" responsive="screen" :x-gap="16" :y-gap="16">
          <n-gi span="1 desktop:2">
            <n-spin :show="picking.resolviendo">
              <n-card :title="`Hoja ${picking.hoja.codigo}`">
                <template #header-extra>
                  <n-space :size="8">
                    <n-tag v-if="asignadaA" size="small">{{ asignadaA }}</n-tag>
                    <n-tag type="info" size="small">{{ picking.hoja.turno }} · {{ picking.hoja.fecha }}</n-tag>
                  </n-space>
                </template>
                <n-space vertical :size="16">
                  <n-progress type="line" :percentage="picking.avance" :show-indicator="true" />
                  <n-empty
                    v-if="picking.lineasEnHoja.length === 0"
                    description="No quedan líneas en esta hoja."
                  />
                  <LineaCard
                    v-for="linea in picking.lineasEnHoja"
                    :key="linea.id"
                    :linea="linea"
                    :bloqueada="picking.resolviendo || picking.cerrada"
                    @retirar="picking.confirmarRetiro(linea.id)"
                    @no-encontrada="abrirFaltante(linea)"
                  />
                  <n-button
                    v-if="!picking.cerrada"
                    type="primary"
                    block
                    :disabled="!picking.puedeRetirar"
                    @click="picking.retirarMercaderia()"
                  >
                    Retirar mercadería
                  </n-button>
                  <n-alert v-else type="success" :show-icon="false">
                    La mesa de distribución recibe la hoja {{ picking.hoja.codigo }} con
                    {{ picking.retiradas.length }}
                    {{ picking.retiradas.length === 1 ? 'línea' : 'líneas' }}. La mesa todavía no
                    está en este mockup.
                  </n-alert>
                </n-space>
              </n-card>
            </n-spin>
          </n-gi>
          <n-gi>
            <n-space vertical :size="16">
              <n-card title="Pendiente de producción" size="small">
                <n-space vertical :size="12">
                  <n-text
                    v-for="item in picking.pendientes"
                    :key="item.id"
                    tag="div"
                  >
                    <n-text strong>{{ item.descripcion }}</n-text>
                    <n-text depth="3" tag="div">
                      SKU {{ item.sku }} · {{ item.cantidad }} {{ item.unidad }} ·
                      {{ item.ordenProduccion }}
                    </n-text>
                    <n-text depth="3" tag="div">{{ item.motivo }}</n-text>
                  </n-text>
                </n-space>
              </n-card>
              <n-card title="Ubicaciones con faltante" size="small">
                <n-empty
                  v-if="picking.faltantes.length === 0"
                  description="Todavía no hay ubicaciones marcadas."
                />
                <n-space v-else vertical :size="12">
                  <n-text v-for="faltante in picking.faltantes" :key="faltante.id" tag="div">
                    <n-text strong>{{ faltante.ubicacion }}</n-text>
                    <n-text depth="3" tag="div">
                      {{ faltante.descripcion }} · lote {{ faltante.lote }}. No se vuelve a
                      prometer.
                    </n-text>
                  </n-text>
                </n-space>
              </n-card>
              <n-card title="Bitácora" size="small">
                <n-timeline>
                  <n-timeline-item
                    v-for="evento in picking.eventos"
                    :key="evento.id"
                    :type="evento.tono"
                    :title="evento.titulo"
                    :content="evento.detalle"
                  />
                </n-timeline>
              </n-card>
            </n-space>
          </n-gi>
        </n-grid>
        </template>
        <ModuloCerrado
          v-else
          titulo="Extracción"
          motivo="No retiras mercadería. Esa tarea la ejecuta el operario asignado a la hoja."
        />

        <RepartoCard v-if="picking.puedeAsignar" titulo="Asignar hojas" accion="Asignar" />
        <ModuloCerrado
          v-else
          titulo="Asignación"
          motivo="No asignas hojas. Eso lo hace la auxiliar cuando el backend ya las soltó completas."
        />

        <SupervisionCard v-if="picking.puedeSupervisar" />
        <ModuloCerrado
          v-else
          titulo="Supervisión"
          motivo="No ves el avance de todo el piso ni reasignas hojas."
        />

        <CuentasCard v-if="picking.puedeAdministrar" />
        <ModuloCerrado
          v-else
          titulo="Cuentas"
          motivo="No administras cuentas. El acceso completo es del administrador."
        />
      </n-space>
    </n-layout-content>
    <NoEncontradaDialog
      :show="lineaReportada !== null"
      :linea="lineaReportada"
      @update:show="(valor) => { if (!valor) lineaReportada = null }"
      @confirmar="confirmarFaltante"
    />
  </n-layout>
</template>
