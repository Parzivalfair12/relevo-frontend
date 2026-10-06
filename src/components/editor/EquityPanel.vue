<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ScheduleMemberDTO } from '@/shared';
import { hoursOfRow, nightsOf, shortName, weekendWorkOf } from '@/lib/schedule';
import { useEditor } from '@/stores/editor';

const { t: tr } = useI18n();
const ed = useEditor();
const rows = computed(() => {
  const s = ed.s!, hs = (m: ScheduleMemberDTO) => hoursOfRow(m.days);
  const mx = Math.max(1, ...s.members.map(m => Math.max(hs(m), ed.tg[m.therapistId] || 0)));
  return s.members.map(m => {
    const h = hs(m), t = ed.tg[m.therapistId], dv = t == null ? 0 : h - t;
    return {
      m, h, t, dv, w: h / mx * 100, left: t == null ? 0 : t / mx * 100,
      col: t == null ? '#F0B63B' : Math.abs(dv) <= 6 ? 'var(--accent)' : Math.abs(dv) <= 12 ? 'var(--warn)' : 'var(--err)',
      tip: tr('editor.equity.nights', { n: nightsOf(m.days) }, nightsOf(m.days)) + (t == null ? '' : tr('editor.equity.weekend', { n: weekendWorkOf(m.days, s.year, s.month) }, weekendWorkOf(m.days, s.year, s.month)))
    };
  });
});
</script>
<template>
  <div class="panel"><h3>{{ tr('editor.equity.title') }}</h3>
    <div class="eq">
      <div class="l" v-for="r in rows" :key="r.m.therapistId">
        <span :title="r.m.name">{{ shortName(r.m.name) }}</span>
        <div class="bar" :title="r.tip"><u :style="{ width: r.w + '%', background: r.col }"></u><s v-if="r.t != null" :style="{ left: r.left + '%' }"></s></div>
        <span class="v" v-if="r.t == null"><b>{{ r.h }} h</b> {{ tr('editor.equity.support') }}</span>
        <span class="v" v-else><b>{{ r.h }} h</b> {{ r.dv >= 0 ? '+' : '−' }}{{ Math.abs(r.dv).toFixed(0) }}</span>
      </div>
    </div>
    <p class="note">{{ tr('editor.equity.note') }}</p>
  </div>
</template>
