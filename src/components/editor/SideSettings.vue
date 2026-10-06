<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Rules } from '@/shared';
import { shiftDesc, shiftName } from '@/i18n';
import ShiftChip from '@/components/ShiftChip.vue';
import { useEditor } from '@/stores/editor';

const { t } = useI18n();
const ed = useEditor();
const ks = ['M', 'T', 'N'] as const;
type Toggle = 'seq' | 'restAfterN' | 'weekends' | 'balance';
const toggles = computed<{ k: Toggle; label: string; sub: string }[]>(() => [
  { k: 'seq', label: t('editor.settings.seq'), sub: t('editor.settings.seqSub') },
  { k: 'restAfterN', label: t('editor.settings.restAfterN'), sub: t('editor.settings.restAfterNSub') },
  { k: 'weekends', label: t('editor.settings.weekends'), sub: '' },
  { k: 'balance', label: t('editor.settings.balance'), sub: t('editor.settings.balanceSub') }
]);
const maxConsec = (d: number) => ed.setRules({ maxConsec: Math.max(2, Math.min(7, ed.s!.rules.maxConsec + d)) });
const toggle = (k: Toggle, e: Event) => ed.setRules({ [k]: (e.target as HTMLInputElement).checked } as Partial<Rules>);
</script>
<template>
  <div class="panel">
    <h3>{{ t('editor.settings.supportUse') }}</h3>
    <div class="seg">
      <button :aria-pressed="ed.s!.rules.support === 'need'" @click="ed.setRules({ support: 'need' })">{{ t('editor.settings.onlyIfNeeded') }}</button>
      <button :aria-pressed="ed.s!.rules.support === 'equal'" @click="ed.setRules({ support: 'equal' })">{{ t('editor.settings.allEqual') }}</button>
    </div>
    <p class="note">{{ ed.s!.rules.support === 'need' ? t('editor.settings.noteNeed') : t('editor.settings.noteEqual') }}</p>
  </div>
  <details class="panel">
    <summary>{{ t('editor.settings.coverage') }}</summary>
    <div class="row" v-for="k in ks" :key="k">
      <div><ShiftChip :code="k" /> {{ shiftName(k) }}<small>{{ shiftDesc(k).split(' · ').slice(1).join(' · ') }}</small></div>
      <div class="step"><button :aria-label="t('editor.settings.less', { k })" @click="ed.setCoverage(k, -1)">−</button><output>{{ ed.s!.coverage[k] }}</output><button :aria-label="t('editor.settings.more', { k })" @click="ed.setCoverage(k, 1)">+</button></div>
    </div>
    <p class="note">{{ t('editor.settings.coverageNote', { n: ed.s!.coverage.M + ed.s!.coverage.T + 2 * ed.s!.coverage.N }) }}</p>
  </details>
  <details class="panel">
    <summary>{{ t('editor.settings.rules') }}</summary>
    <div class="row" v-for="tg in toggles" :key="tg.k">
      <div>{{ tg.label }}<small v-if="tg.sub">{{ tg.sub }}</small></div>
      <label class="sw"><input type="checkbox" :checked="ed.s!.rules[tg.k]" :aria-label="tg.label" @change="toggle(tg.k, $event)"><i></i></label>
    </div>
    <div class="row"><div>{{ t('editor.settings.maxConsec') }}</div>
      <div class="step"><button :aria-label="t('editor.settings.lessPlain')" @click="maxConsec(-1)">−</button><output>{{ ed.s!.rules.maxConsec }}</output><button :aria-label="t('editor.settings.morePlain')" @click="maxConsec(1)">+</button></div></div>
  </details>
</template>
