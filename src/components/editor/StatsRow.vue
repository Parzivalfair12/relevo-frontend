<script setup lang="ts">
import { computed } from 'vue';
import { hoursOfRow } from '@/lib/schedule';
import { useEditor } from '@/stores/editor';

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
  <section class="stats" aria-label="Resumen del mes">
    <div class="stat" :class="k.tot === k.need ? 'good' : 'mid'"><span>Horas del mes</span><b>{{ k.tot }} / {{ k.need }}</b><small>{{ k.tot === k.need ? 'Cobertura completa de 24 h' : 'Faltan o sobran ' + Math.abs(k.need - k.tot) + ' h' }}</small></div>
    <div class="stat" :class="cls(k.maxDev, 6, 12)"><span>Diferencia en planta</span><b>{{ k.maxDev.toFixed(0) }} h</b><small>Máxima frente a la meta de cada persona</small></div>
    <div class="stat" :class="k.gapDays ? 'bad' : 'good'"><span>Días cubiertos</span><b>{{ k.n - k.gapDays }} / {{ k.n }}</b><small>{{ k.gapDays ? k.gapDays + ' día(s) con turnos sin cubrir' : 'Todos los turnos con terapeuta' }}</small></div>
    <div class="stat"><span>Apoyo en el mes</span><b>{{ k.supH }} h</b><small>{{ k.supN ? k.supN + ' persona(s) de apoyo cubren turnos' : 'Nadie de apoyo fue necesario' }}</small></div>
    <div class="stat" :class="k.errs ? 'bad' : k.warns ? 'mid' : 'good'"><span>Alertas</span><b>{{ k.errs + k.warns }}</b><small>{{ k.errs }} críticas · {{ k.warns }} avisos</small></div>
  </section>
</template>
