export default {
  schedule: {
    tsvTherapist: 'Terapeuta', tsvHours: 'Horas',
    conflict: '{name}: el día {day} también trabaja en {service}'
  },
  grid: {
    therapist: 'Terapeuta', hours: 'Horas', staff: 'Planta', support: 'Apoyo y reemplazos',
    coverage: 'Cobertura M · T · N', absShort: '{n} d aus.',
    seeDay: 'Ver quién trabaja el día {day}',
    cellTitle: '{name} · día {day}: {desc}', cellLocked: ' (fijado)', cellAria: '{name} día {day}: {desc}'
  },
  cellMenu: { title: '{name} · día {day}', release: 'Quitar fijación', released: 'Casilla liberada. Se recalculó el cuadro.' },
  dayPopover: { title: '{letter} {day} de {month}', uncovered: 'Sin cubrir', absent: 'Ausentes: {names}' },
  brush: {
    label: 'Pincel', select: '☝ Elegir', erase: '⌫ Goma',
    titleSelect: 'Toca una casilla para ver opciones', titleErase: 'Suelta casillas fijadas',
    hintSelect: 'Toca cualquier casilla para cambiarla, o elige un pincel y arrastra sobre varias casillas para pintarlas de una vez.',
    hintErase: 'Arrastra sobre casillas fijadas para soltarlas. Al terminar se recalcula el cuadro.',
    hintShift: 'Pincel {name}: haz clic o arrastra sobre el cuadro para pintar. Lo pintado queda fijado.'
  },
  team: {
    title: 'Equipo del cuadro', counts: '({staff} de planta · {support} de apoyo)',
    help: 'Toca un nombre para ver su detalle o registrar una ausencia.',
    staffGroup: 'Planta (fijas)', supportGroup: 'Apoyo y reemplazos',
    staffEmpty: 'Sin terapeutas de planta', supportEmpty: 'Agrega terapeutas de apoyo abajo',
    miniAbsent: ' · {n} d ausente', hoursShort: '{n} h',
    addAbsenceTitle: 'Registrar ausencia', addAbsenceShort: '＋ Ausencia', addAbsence: '＋ Registrar ausencia',
    directoryAria: 'Terapeuta del directorio', otherService: ' (otro servicio)', allIn: 'Todas ya están en el cuadro',
    groupAria: 'Grupo', support: 'Apoyo', staffKind: 'Planta', add: 'Agregar',
    notListed: '¿No está en la lista?', registerLink: 'Regístrala en Equipo',
    noMore: 'No hay más terapeutas por agregar. Registra nuevas en Equipo.',
    added: '{name} se agregó como {kind}', kindStaff: 'planta', kindSupport: 'apoyo'
  },
  person: {
    subStaff: 'Terapeuta de planta', subSupport: 'Terapeuta de apoyo',
    target: 'Meta {n} h', monthHours: 'Horas del mes', nights: 'Noches', weekendShifts: 'Turnos fin de semana',
    freeDays: 'Días libres', absenceDays: 'Días de ausencia', workedDays: 'Días trabajados',
    targetLabel: 'Meta de horas del mes', targetPlaceholder: 'Automática', saveTarget: 'Guardar meta',
    targetHelp: 'Vacía = se reparte sola entre la planta. Al guardar se recalculan los turnos que no están fijados.',
    targetInvalid: 'Escribe un número de 0 a 744.',
    absences: 'Ausencias del mes', day: 'día {n}', days: 'días {from} al {to}', removeAbsenceAria: 'Quitar ausencia',
    noAbsences: 'Sin ausencias registradas.', removeFromTeam: 'Quitar del equipo', addAbsence: '＋ Ausencia', done: 'Listo',
    targetAuto: 'La meta de {name} se reparte sola', targetSet: 'Meta de {name}: {n} h',
    nowKind: '{name} ahora es de {kind}', absenceRemoved: 'Ausencia eliminada',
    minTwo: 'Se necesitan al menos 2 terapeutas', left: '{name} salió del equipo'
  },
  absence: {
    title: 'Registrar ausencia',
    sub: 'Los días elegidos quedan fuera del cuadro. El generador reparte el trabajo y llama al apoyo si hace falta.',
    therapist: 'Terapeuta', staffTag: 'planta', supportTag: 'apoyo', type: 'Tipo de ausencia',
    from: 'Desde el día', to: 'Hasta el día', note: '{n} día(s) de {shift} en {month}.',
    cancel: 'Cancelar', submit: 'Registrar y recalcular',
    toast: 'Ausencia registrada. {detail}', supportIn: 'Apoyo en el mes: {list}',
    noSupport: 'La planta alcanza, no hizo falta apoyo.', shared: 'Horas repartidas entre todas.'
  },
  settings: {
    supportUse: 'Uso del apoyo', onlyIfNeeded: 'Solo si falta alguien', allEqual: 'Todas por igual',
    noteNeed: 'El apoyo solo entra a cubrir turnos cuando la planta no alcanza por ausencias o descansos. Las horas de planta se igualan entre sí.',
    noteEqual: 'Todas las terapeutas, de planta y de apoyo, se reparten las horas por igual.',
    coverage: 'Cobertura por turno', less: 'Menos {k}', more: 'Más {k}', lessPlain: 'Menos', morePlain: 'Más',
    coverageNote: 'Para cubrir cada día sin dobles y con descanso tras noche se necesitan al menos {n} terapeutas disponibles.',
    rules: 'Reglas', maxConsec: 'Máx. días seguidos',
    seq: 'Secuencia M → T → N → L', seqSub: 'Mañana, tarde, noche y descanso',
    restAfterN: 'Descanso tras noche', restAfterNSub: 'Nunca trabaja el día siguiente',
    weekends: 'Repartir fines de semana', balance: 'Igualar horas', balanceSub: 'Ajuste final entre terapeutas'
  },
  equity: {
    title: 'Equidad de horas', nights: '{n} noches', weekend: ' · {n} turnos en fin de semana',
    support: 'apoyo', note: 'La línea oscura es la meta de cada persona de planta, ajustada por sus días disponibles y por lo que cubre el apoyo.'
  },
  stats: {
    aria: 'Resumen del mes', hours: 'Horas del mes', full: 'Cobertura completa de 24 h', off: 'Faltan o sobran {n} h',
    diff: 'Diferencia en planta', diffSub: 'Máxima frente a la meta de cada persona',
    covered: 'Días cubiertos', gaps: '{n} día(s) con turnos sin cubrir', allCovered: 'Todos los turnos con terapeuta',
    support: 'Apoyo en el mes', supportSome: '{n} persona(s) de apoyo cubren turnos', supportNone: 'Nadie de apoyo fue necesario',
    alerts: 'Alertas', alertsSub: '{errs} críticas · {warns} avisos'
  },
  alerts: { title: 'Alertas', ok: '✓ Sin alertas. El cuadro cumple todas las reglas.' },
  steps: {
    aria: 'Paso a paso',
    team: 'Revisa el equipo', teamSub: 'Planta y apoyo',
    absences: 'Registra ausencias', absencesSub: 'Permisos, licencias, incapacidades',
    generate: 'Genera el cuadro', generateSub: 'Un clic y queda armado',
    adjust: 'Ajusta y copia', adjustSub: 'Pinta turnos y pega en Excel'
  }
};
