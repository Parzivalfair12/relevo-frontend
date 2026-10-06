import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import type { DashboardTherapistRow } from '@/shared';
import { i18n } from '@/i18n';
import WorkloadTable from './WorkloadTable.vue';

const row = (id: string, name: string, over: Partial<DashboardTherapistRow> = {}): DashboardTherapistRow => ({
  id, name, serviceIds: [], kinds: ['fija'], hours: 0, M: 0, T: 0, N: 0, weekendDays: 0, workDays: 0, days: 30, absDays: 0, everyDays: 0, restAvg: 0, maxRun: 0, pattern: ['L', 'M'], ...over
});
const rows = [
  row('a', 'Zoe Mora', { hours: 120, N: 2, workDays: 10, everyDays: 3, restAvg: 1.5, M: 4, T: 4 }),
  row('b', 'Ana Gil', { hours: 180, N: 8, workDays: 15, everyDays: 2, restAvg: 1, M: 3, T: 4 }),
  row('c', 'Mia Paz', { hours: 0, kinds: ['apoyo'] })
];
beforeEach(() => setActivePinia(createPinia()));
const names = (w: ReturnType<typeof mount>) => w.findAll('tbody tr .who2 > div').map(x => x.element.firstChild!.textContent!.trim());

describe('tabla de carga por terapeuta', () => {
  it('abre ordenada por horas, de mayor a menor', () => {
    const w = mount(WorkloadTable, { props: { rows }, global: { plugins: [i18n] } });
    expect(names(w)).toEqual(['Ana Gil', 'Zoe Mora', 'Mia Paz']);
    expect(w.find('th[data-sort]:nth-child(2)').text()).toBe('Horas ↓');
  });
  it('un clic ordena la columna; otro clic invierte; el nombre empieza de la A a la Z', async () => {
    const w = mount(WorkloadTable, { props: { rows }, global: { plugins: [i18n] } });
    await w.findAll('th').find(t => t.text().startsWith('Terapeuta'))!.trigger('click');
    expect(names(w)).toEqual(['Ana Gil', 'Mia Paz', 'Zoe Mora']);
    await w.findAll('th').find(t => t.text().startsWith('Terapeuta'))!.trigger('click');
    expect(names(w)).toEqual(['Zoe Mora', 'Mia Paz', 'Ana Gil']);
    await w.findAll('th').find(t => t.text().startsWith('Noches'))!.trigger('click');
    expect(names(w)).toEqual(['Ana Gil', 'Zoe Mora', 'Mia Paz']); // las noches empiezan de mayor a menor
  });
  it('muestra «cada N días», el descanso medio y guiones si no trabajó; el patrón no se ordena', () => {
    const w = mount(WorkloadTable, { props: { rows }, global: { plugins: [i18n] } });
    const ana = w.findAll('tbody tr')[0].findAll('td');
    expect(ana[5].text()).toBe('cada 2.0 días'); expect(ana[6].text()).toBe('1.0 días'); expect(ana[7].text()).toBe('—');
    const mia = w.findAll('tbody tr')[2].findAll('td');
    expect(mia[5].text()).toBe('—'); expect(mia[6].text()).toBe('—');
    expect(w.findAll('th').at(-1)!.attributes('data-sort')).toBeUndefined();
    expect(w.findAll('tbody tr')[0].findAll('.strip u').map(u => u.classes()[0])).toEqual(['s-L', 's-M']);
  });
  it('marca «Apoyo» solo a quien nunca es de planta y avisa al abrir una fila', async () => {
    const w = mount(WorkloadTable, { props: { rows }, global: { plugins: [i18n] } });
    expect(w.findAll('.pl.apoyo').map(x => x.text())).toEqual(['Apoyo']);
    await w.findAll('tbody tr')[1].trigger('click');
    expect(w.emitted('open')).toEqual([['a']]);
  });
  it('sin filas muestra el estado vacío', () => {
    expect(mount(WorkloadTable, { props: { rows: [] }, global: { plugins: [i18n] } }).find('td.empty').text()).toBe('No hay cuadros en este período.');
  });
});
