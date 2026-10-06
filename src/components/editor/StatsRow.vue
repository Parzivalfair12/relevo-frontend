<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { hoursOfRow } from '@/lib/schedule';
import { useEditor } from '@/stores/editor';

const { t } = useI18n();
const ed = useEditor();
const cls = (v: number, good: number, mid: number) => (v <= good ? 'good' : v <= mid ? 'mid' : 'bad');
const k = computed(() => {
  const s = ed.s!, n = ed.n, cov = s.coverage;
  const hs = (days: string[]) => hoursOfRow(days as never);
  const tot = s.members.reduce((a, m) => a + hs(m.days), 0), need = (cov.M * 6 + cov.T * 6 + cov.N * 12) * n;
  const errs = ed.issues.filter(i => i.sev === 'err').length, warns = ed.issues.filter(i => i.sev === 'warn').length;
  const gapDays = new Set(ed.issues.filter(i => i.id === null && i.sev === 'err').map(i => i.day)).size;
  const pool = s.members.filter(m => ed.tg[m.therapistId] != null);
  const maxDev = pool.length ? Math.max(...pool.map(m => Math.abs(hs(m.days) - (ed.tg[m.therapistId] as number)))) : 0;
  const supH = ed.apoyo.reduce((a, m) => a + hs(m.days), 0), supN = ed.apoyo.filter(m => hs(m.days) > 0).length;
  return { tot, need, errs, warns, gapDays, maxDev, supH, supN, n };
});
</script>
<template>
  <section class="stats" :aria-label="t('editor.stats.aria')">
    <div class="stat" :class="k.tot === k.need ? 'good' : 'mid'"><span>{{ t('editor.stats.hours') }}</span><b>{{ k.tot }} / {{ k.need }}</b><small>{{ k.tot === k.need ? t('editor.stats.full') : t('editor.stats.off', { n: Math.abs(k.need - k.tot) }) }}</small></div>
    <div class="stat" :class="cls(k.maxDev, 6, 12)"><span>{{ t('editor.stats.diff') }}</span><b>{{ k.maxDev.toFixed(0) }} h</b><small>{{ t('editor.stats.diffSub') }}</small></div>
    <div class="stat" :class="k.gapDays ? 'bad' : 'good'"><span>{{ t('editor.stats.covered') }}</span><b>{{ k.n - k.gapDays }} / {{ k.n }}</b><small>{{ k.gapDays ? t('editor.stats.gaps', { n: k.gapDays }, k.gapDays) : t('editor.stats.allCovered') }}</small></div>
    <div class="stat"><span>{{ t('editor.stats.support') }}</span><b>{{ k.supH }} h</b><small>{{ k.supN ? t('editor.stats.supportSome', { n: k.supN }, k.supN) : t('editor.stats.supportNone') }}</small></div>
    <div class="stat" :class="k.errs ? 'bad' : k.warns ? 'mid' : 'good'"><span>{{ t('editor.stats.alerts') }}</span><b>{{ k.errs + k.warns }}</b><small>{{ t('editor.stats.alertsSub', { errs: k.errs, warns: k.warns }) }}</small></div>
  </section>
</template>
