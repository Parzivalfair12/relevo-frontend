import { reactive } from 'vue';

export const toasts = reactive<{ id: number; text: string }[]>([]);
let next = 1;

/** Aviso breve abajo en el centro; desaparece a los 3,2 s, como en el mockup. */
export function toast(text: string) {
  const id = next++;
  toasts.push({ id, text });
  setTimeout(() => { const i = toasts.findIndex(t => t.id === id); if (i >= 0) toasts.splice(i, 1); }, 3200);
}
