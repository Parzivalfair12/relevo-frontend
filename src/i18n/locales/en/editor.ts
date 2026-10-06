export default {
  schedule: {
    tsvTherapist: 'Therapist', tsvHours: 'Hours',
    conflict: '{name}: also works on day {day} in {service}'
  },
  grid: {
    therapist: 'Therapist', hours: 'Hours', staff: 'Permanent staff', support: 'Support and cover',
    coverage: 'Coverage M · T · N', absShort: '{n} d abs.',
    seeDay: 'See who works on day {day}',
    cellTitle: '{name} · day {day}: {desc}', cellLocked: ' (locked)', cellAria: '{name} day {day}: {desc}'
  },
  cellMenu: { title: '{name} · day {day}', release: 'Unlock cell', released: 'Cell unlocked. The schedule was recalculated.' },
  dayPopover: { title: '{letter}, {monthCap} {day}', uncovered: 'Uncovered', absent: 'Absent: {names}' },
  brush: {
    label: 'Brush', select: '☝ Select', erase: '⌫ Eraser',
    titleSelect: 'Tap a cell to see options', titleErase: 'Unlock locked cells',
    hintSelect: 'Tap any cell to change it, or pick a brush and drag across several cells to paint them at once.',
    hintErase: 'Drag across locked cells to unlock them. The schedule is recalculated when you finish.',
    hintShift: '{name} brush: click or drag over the grid to paint. Painted cells stay locked.'
  },
  team: {
    title: 'Schedule team', counts: '({staff} permanent · {support} support)',
    help: 'Tap a name to see details or log an absence.',
    staffGroup: 'Permanent staff', supportGroup: 'Support and cover',
    staffEmpty: 'No permanent therapists', supportEmpty: 'Add support therapists below',
    miniAbsent: ' · {n} d absent', hoursShort: '{n} h',
    addAbsenceTitle: 'Log absence', addAbsenceShort: '＋ Absence', addAbsence: '＋ Log absence',
    directoryAria: 'Therapist from the directory', otherService: ' (other service)', allIn: 'Everyone is already in the schedule',
    groupAria: 'Group', support: 'Support', staffKind: 'Permanent', add: 'Add',
    notListed: 'Not on the list?', registerLink: 'Register them in Team',
    noMore: 'There are no more therapists to add. Register new ones in Team.',
    added: '{name} was added as {kind}', kindStaff: 'permanent staff', kindSupport: 'support'
  },
  person: {
    subStaff: 'Permanent therapist', subSupport: 'Support therapist',
    target: 'Target {n} h', monthHours: 'Hours this month', nights: 'Nights', weekendShifts: 'Weekend shifts',
    freeDays: 'Days off', absenceDays: 'Absence days', workedDays: 'Days worked',
    targetLabel: 'Monthly target hours', targetPlaceholder: 'Automatic', saveTarget: 'Save target',
    targetHelp: 'Empty = split automatically among permanent staff. Saving recalculates the shifts that are not locked.',
    targetInvalid: 'Enter a number from 0 to 744.',
    absences: 'Absences this month', day: 'day {n}', days: 'days {from} to {to}', removeAbsenceAria: 'Remove absence',
    noAbsences: 'No absences logged.', removeFromTeam: 'Remove from team', addAbsence: '＋ Absence', done: 'Done',
    targetAuto: "{name}'s target is split automatically", targetSet: "{name}'s target: {n} h",
    nowKind: '{name} is now {kind}', absenceRemoved: 'Absence removed',
    minTwo: 'At least 2 therapists are needed', left: '{name} left the team'
  },
  absence: {
    title: 'Log absence',
    sub: 'The chosen days are taken out of the schedule. The generator spreads the work and calls in support if needed.',
    therapist: 'Therapist', staffTag: 'permanent', supportTag: 'support', type: 'Absence type',
    from: 'From day', to: 'To day', note: '{n} day(s) of {shift} in {monthCap}.',
    cancel: 'Cancel', submit: 'Log and recalculate',
    toast: 'Absence logged. {detail}', supportIn: 'Support this month: {list}',
    noSupport: 'Permanent staff is enough, no support needed.', shared: 'Hours shared among everyone.'
  },
  settings: {
    supportUse: 'Support usage', onlyIfNeeded: 'Only if someone is missing', allEqual: 'Everyone equally',
    noteNeed: 'Support only steps in to cover shifts when permanent staff falls short because of absences or rest days. Permanent staff hours are evened out among themselves.',
    noteEqual: 'All therapists, permanent and support, share the hours equally.',
    coverage: 'Coverage per shift', less: 'Less {k}', more: 'More {k}', lessPlain: 'Less', morePlain: 'More',
    coverageNote: 'To cover every day with no double shifts and rest after a night, at least {n} therapists must be available.',
    rules: 'Rules', maxConsec: 'Max. days in a row',
    seq: 'Sequence M → T → N → L', seqSub: 'Morning, afternoon, night and rest',
    restAfterN: 'Rest after night', restAfterNSub: 'Never works the next day',
    weekends: 'Spread weekends', balance: 'Even out hours', balanceSub: 'Final adjustment between therapists'
  },
  equity: {
    title: 'Hours equity', nights: '{n} nights', weekend: ' · {n} weekend shifts',
    support: 'support', note: "The dark line is each permanent therapist's target, adjusted for their available days and for what support covers."
  },
  stats: {
    aria: 'Month summary', hours: 'Hours this month', full: 'Full 24 h coverage', off: '{n} h short or over',
    diff: 'Permanent staff gap', diffSub: "Largest gap against each person's target",
    covered: 'Days covered', gaps: '{n} day(s) with uncovered shifts', allCovered: 'Every shift has a therapist',
    support: 'Support this month', supportSome: '{n} support therapist(s) cover shifts', supportNone: 'No support was needed',
    alerts: 'Alerts', alertsSub: '{errs} critical · {warns} warnings'
  },
  alerts: { title: 'Alerts', ok: '✓ No alerts. The schedule meets all the rules.' },
  steps: {
    aria: 'Step by step',
    team: 'Review the team', teamSub: 'Permanent and support',
    absences: 'Log absences', absencesSub: 'Leave, time off, sick leave',
    generate: 'Generate the schedule', generateSub: 'One click and it is built',
    adjust: 'Adjust and copy', adjustSub: 'Paint shifts and paste into Excel'
  }
};
