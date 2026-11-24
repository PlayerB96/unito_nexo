<script setup lang="ts">
import { computed, ref } from 'vue'
import PlataformaLayout from '../../../app/PlataformaLayout.vue'
import { useEsCompacto } from '../../../shared/ui/useEsCompacto'
import { useEsMovil } from '../../../shared/ui/useEsMovil'
import type { Linea } from '../types'
import { usePickingStore } from '../store'
import EstiloGrupo from './EstiloGrupo.vue'
import NoEncontradaDialog from './NoEncontradaDialog.vue'

const picking = usePickingStore()
const movil = useEsMovil()
const compacto = useEsCompacto()
const lineaReportada = ref<Linea | null>(null)
const paso = computed(() => (picking.cerrada ? 4 : 2))
const asignadaA = computed(
  () => picking.cola.find((item) => item.codigo === picking.hoja.codigo)?.asignadaA,
)

const gruposEstilo = computed(() => {
  const mapa = new Map<string, Linea[]>()
  for (const linea of picking.lineasEnHoja) {
    const lista = mapa.get(linea.estilo) ?? []
    lista.push(linea)
    mapa.set(linea.estilo, lista)
  }
  return [...mapa.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([estilo, lineas]) => ({
      estilo,
      descripcion: lineas[0]?.descripcion ?? '',
      lineas,
    }))
})

function abrirFaltante(linea: Linea) {
  lineaReportada.value = linea
}

async function confirmarFaltante(ubicacion: string) {
  const linea = lineaReportada.value
  if (!linea) return
  lineaReportada.value = null
  await picking.reportarNoEncontrada(linea.id, ubicacion)
}

async function retirarLinea(lineaId: string, cantidad: number) {
  await picking.confirmarRetiro(lineaId, cantidad)
}
</script>

<template>
  <PlataformaLayout>
    <n-space vertical :size="movil ? 8 : 16">
      <n-space vertical :size="4">
        <n-text strong :style="{ fontSize: movil ? '18px' : '20px' }">Extracción</n-text>
        <n-text depth="3">
          Agrupado por estilo. Dentro, talla y color. Marca cuántas unidades encontraste.
        </n-text>
      </n-space>

      <n-steps
        v-if="!compacto"
        :current="paso"
        size="small"
      >
        <n-step title="Hoja asignada" description="Nació completa" />
        <n-step title="Extracción en piso" description="Retira o reporta" />
        <n-step title="Mercadería retirada" description="Pasa a la mesa" />
      </n-steps>

      <n-alert v-if="picking.ultimoEvento" :type="picking.ultimoEvento.tono" :show-icon="false">
        <n-text strong>{{ picking.ultimoEvento.titulo }}</n-text>
        <div>{{ picking.ultimoEvento.detalle }}</div>
      </n-alert>

      <n-grid cols="2 tablet:4" responsive="screen" :x-gap="8" :y-gap="8">
        <n-gi>
          <n-statistic label="Und. pendientes" :value="picking.unidadesPendientes" />
        </n-gi>
        <n-gi>
          <n-statistic label="Und. retiradas" :value="picking.unidadesRetiradas" />
        </n-gi>
        <n-gi>
          <n-statistic label="Estilos" :value="gruposEstilo.length" />
        </n-gi>
        <n-gi>
          <n-statistic label="Faltantes" :value="picking.faltantes.length" />
        </n-gi>
      </n-grid>

      <n-grid
        cols="1 desktop:3"
        responsive="screen"
        :x-gap="movil ? 8 : 16"
        :y-gap="movil ? 8 : 16"
      >
        <n-gi span="1 desktop:2">
          <n-spin :show="picking.resolviendo">
            <n-card
              :title="`Hoja ${picking.hoja.codigo}`"
              :size="movil ? 'small' : 'medium'"
              :content-style="movil ? 'padding: 8px' : undefined"
              :header-style="movil ? 'padding: 10px 10px 0' : undefined"
            >
              <template v-if="!movil" #header-extra>
                <n-space :size="8">
                  <n-tag v-if="asignadaA" size="small">{{ asignadaA }}</n-tag>
                  <n-tag type="info" size="small">
                    {{ picking.hoja.turno }} · {{ picking.hoja.fecha }}
                  </n-tag>
                </n-space>
              </template>
              <n-space vertical :size="movil ? 10 : 14">
                <n-space v-if="movil" :size="6" style="flex-wrap: wrap">
                  <n-tag v-if="asignadaA" size="small">{{ asignadaA }}</n-tag>
                  <n-tag type="info" size="small">
                    {{ picking.hoja.turno }} · {{ picking.hoja.fecha }}
                  </n-tag>
                  <n-tag size="small" :bordered="false">
                    {{ picking.unidadesPendientes }} und por retirar
                  </n-tag>
                </n-space>
                <n-progress type="line" :percentage="picking.avance" :show-indicator="true" />
                <n-empty
                  v-if="gruposEstilo.length === 0"
                  description="No quedan estilos en esta hoja."
                />
                <EstiloGrupo
                  v-for="(grupo, indice) in gruposEstilo"
                  :key="grupo.estilo"
                  :estilo="grupo.estilo"
                  :descripcion="grupo.descripcion"
                  :lineas="grupo.lineas"
                  :bloqueada="picking.resolviendo || picking.cerrada"
                  :default-expandido="indice === 0 || !compacto"
                  @retirar="retirarLinea"
                  @no-encontrada="abrirFaltante"
                />
                <n-button
                  v-if="!picking.cerrada"
                  type="primary"
                  block
                  :disabled="!picking.puedeRetirar"
                  :style="movil ? 'min-height: 48px' : undefined"
                  @click="picking.retirarMercaderia()"
                >
                  Retirar mercadería
                </n-button>
                <n-alert v-else type="success" :show-icon="false">
                  La mesa de distribución recibe la hoja {{ picking.hoja.codigo }} con
                  {{ picking.unidadesRetiradas }} und. La mesa todavía no está en este mockup.
                </n-alert>
              </n-space>
            </n-card>
          </n-spin>
        </n-gi>
        <n-gi>
          <n-collapse :default-expanded-names="compacto ? [] : ['pendientes', 'faltantes']">
            <n-collapse-item title="Pendiente de producción" name="pendientes">
              <n-space vertical :size="10">
                <n-text v-for="item in picking.pendientes" :key="item.id" tag="div">
                  <n-text strong>{{ item.descripcion }}</n-text>
                  <n-text depth="3" tag="div">
                    SKU {{ item.sku }} · {{ item.cantidad }} {{ item.unidad }} ·
                    {{ item.ordenProduccion }}
                  </n-text>
                  <n-text depth="3" tag="div">{{ item.motivo }}</n-text>
                </n-text>
              </n-space>
            </n-collapse-item>
            <n-collapse-item title="Ubicaciones con faltante" name="faltantes">
              <n-empty
                v-if="picking.faltantes.length === 0"
                description="Todavía no hay ubicaciones marcadas."
              />
              <n-space v-else vertical :size="10">
                <n-text v-for="faltante in picking.faltantes" :key="faltante.id" tag="div">
                  <n-text strong>{{ faltante.ubicacion }}</n-text>
                  <n-text depth="3" tag="div">
                    {{ faltante.descripcion }} · lote {{ faltante.lote }}. No se vuelve a
                    prometer.
                  </n-text>
                </n-text>
              </n-space>
            </n-collapse-item>
            <n-collapse-item title="Bitácora" name="bitacora">
              <n-timeline>
                <n-timeline-item
                  v-for="evento in picking.eventos"
                  :key="evento.id"
                  :type="evento.tono"
                  :title="evento.titulo"
                  :content="evento.detalle"
                />
              </n-timeline>
            </n-collapse-item>
          </n-collapse>
        </n-gi>
      </n-grid>
    </n-space>
    <NoEncontradaDialog
      :show="lineaReportada !== null"
      :linea="lineaReportada"
      @update:show="(valor) => { if (!valor) lineaReportada = null }"
      @confirmar="confirmarFaltante"
    />
  </PlataformaLayout>
</template>
