export default {
  kpi: {
    hours: 'Hours worked', schedules: '{n} schedule(s) in the period',
    activeTherapists: 'Therapists with shifts', idle: '{n} without shifts in the period',
    coverage: 'Days covered', gapDays: '{n} day(s) with uncovered shifts', fullCoverage: 'All shifts have a therapist',
    supportHours: 'Support hours', ofTotal: '{pct}% of total',
    absenceDays: 'Absence days', absenceHint: 'Vacation, sick leave and time off'
  },
  monthly: { title: 'Hours by month' },
  service: { title: 'Hours by service', none: 'No services.', deleted: 'Deleted service' },
  person: {
    sub: '{kind} in {services}', permanent: 'Permanent staff', support: 'Support', and: ' and ',
    dayTitle: 'Day {n}: {name}', unassigned: 'Not assigned',
    hours: 'Hours', everyDays: 'Works every (days)', restAvg: 'Average rest (days)', maxRun: 'Longest streak of days',
    nights: 'Nights', weekend: 'Weekend shifts', rest: 'Rest', absence: 'Absence'
  },
  workload: {
    therapist: 'Therapist', hours: 'Hours', shifts: 'Shifts M · T · N', nights: 'Nights', weekends: 'Weekends',
    every: 'Works every', restAvg: 'Average rest', absences: 'Absences', pattern: 'Pattern',
    everyValue: 'every {n} days', restValue: '{n} days', absValue: '{n} d',
    mbar: '{m} mornings · {t} afternoons · {n} nights', empty: 'There are no schedules in this period.'
  },
  period: { range: '{from} to {to}' }
};
