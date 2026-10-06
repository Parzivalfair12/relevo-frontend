/** Tabla de traducción de mensajes que llegan en español desde la API, los esquemas compartidos y el motor de turnos. */
const exact: Record<string, string> = {};
/** Mensajes con datos variables (nombres, días): [expresión, plantilla con $1, $2…] */
const patterns: [RegExp, string][] = [];

export function translateServerMessage(msg: string): string {
  if (exact[msg]) return exact[msg];
  for (const [re, tpl] of patterns) {
    const m = re.exec(msg);
    if (m) return tpl.replace(/\$(\d)/g, (_x, i) => m[Number(i)] ?? '');
  }
  return msg;
}
