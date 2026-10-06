<script setup lang="ts">
import { SHIFT_DESC, SHIFT_NAME, type Rules } from '@/shared';
import ShiftChip from '@/components/ShiftChip.vue';
import { useEditor } from '@/stores/editor';

const ed = useEditor();
const ks = ['M', 'T', 'N'] as const;
type Toggle = 'seq' | 'restAfterN' | 'weekends' | 'balance';
const toggles: { k: Toggle; label: string; sub: string }[] = [
  { k: 'seq', label: 'Secuencia M → T → N → L', sub: 'Mañana, tarde, noche y descanso' },
  { k: 'restAfterN', label: 'Descanso tras noche', sub: 'Nunca trabaja el día siguiente' },
  { k: 'weekends', label: 'Repartir fines de semana', sub: '' },
  { k: 'balance', label: 'Igualar horas', sub: 'Ajuste final entre terapeutas' }
];
const maxConsec = (d: number) => ed.setRules({ maxConsec: Math.max(2, Math.min(7, ed.s!.rules.maxConsec + d)) });
const toggle = (k: Toggle, e: Event) => ed.setRules({ [k]: (e.target as HTMLInputElement).checked } as Partial<Rules>);
</script>
<template>
  <div class="panel">
    <h3>Uso del apoyo</h3>
    <div class="seg">
      <button :aria-pressed="ed.s!.rules.support === 'need'" @click="ed.setRules({ support: 'need' })">Solo si falta alguien</button>
      <button :aria-pressed="ed.s!.rules.support === 'equal'" @click="ed.setRules({ support: 'equal' })">Todas por igual</button>
    </div>
    <p class="note">{{ ed.s!.rules.support === 'need' ? 'El apoyo solo entra a cubrir turnos cuando la planta no alcanza por ausencias o descansos. Las horas de planta se igualan entre sí.' : 'Todas las terapeutas, de planta y de apoyo, se reparten las horas por igual.' }}</p>
  </div>
  <details class="panel">
    <summary>Cobertura por turno</summary>
    <div class="row" v-for="k in ks" :key="k">
      <div><ShiftChip :code="k" /> {{ SHIFT_NAME[k] }}<small>{{ SHIFT_DESC[k].split(' · ').slice(1).join(' · ') }}</small></div>
      <div class="step"><button :aria-label="'Menos ' + k" @click="ed.setCoverage(k, -1)">−</button><output>{{ ed.s!.coverage[k] }}</output><button :aria-label="'Más ' + k" @click="ed.setCoverage(k, 1)">+</button></div>
    </div>
    <p class="note">Para cubrir cada día sin dobles y con descanso tras noche se necesitan al menos {{ ed.s!.coverage.M + ed.s!.coverage.T + 2 * ed.s!.coverage.N }} terapeutas disponibles.</p>
  </details>
  <details class="panel">
    <summary>Reglas</summary>
    <div class="row" v-for="t in toggles" :key="t.k">
      <div>{{ t.label }}<small v-if="t.sub">{{ t.sub }}</small></div>
      <label class="sw"><input type="checkbox" :checked="ed.s!.rules[t.k]" :aria-label="t.label" @change="toggle(t.k, $event)"><i></i></label>
    </div>
    <div class="row"><div>Máx. días seguidos</div>
      <div class="step"><button aria-label="Menos" @click="maxConsec(-1)">−</button><output>{{ ed.s!.rules.maxConsec }}</output><button aria-label="Más" @click="maxConsec(1)">+</button></div></div>
  </details>
</template>
