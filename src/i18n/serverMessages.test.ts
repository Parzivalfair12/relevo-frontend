import { describe, expect, it } from 'vitest';
import { translateServerMessage as t } from './serverMessages';

describe('translateServerMessage', () => {
  it.each([
    ['Escribe un correo válido.', 'Enter a valid email address.'],
    ['Elige al menos un servicio.', 'Choose at least one service.'],
    ['Correo o contraseña incorrectos.', 'Incorrect email or password.'],
    ['La sesión venció', 'Your session has expired'],
    ['Cuadro no encontrado', 'Schedule not found'],
    ['Ya existe un cuadro de este servicio en ese mes.', 'A schedule for this service already exists in that month.'],
    ['El archivo pesa más de 8 MB.', 'The file is larger than 8 MB.'],
    ['Hay terapeutas en dos cuadros el mismo día.', 'Some therapists are in two schedules on the same day.'],
    ['La contraseña debe tener al menos 8 caracteres.', 'The password must be at least 8 characters long.'],
    ['El día 31 no existe en ese mes.', 'Day 31 does not exist in that month.'],
    ['Ese mes tiene 28 días.', 'That month has 28 days.'],
    ['Aparece en 3 cuadro(s). Para retirarla, desactívala.', 'She appears in 3 schedule(s). To remove her, deactivate her instead.'],
    ['Ana María cambió este cuadro mientras lo editabas.', 'Ana María changed this schedule while you were editing it.'],
    ['Día 5: «XX» no se reconoce; quedó libre.', 'Day 5: “XX” not recognized; left as free.'],
    ['ANA PÉREZ: Día 12: «Z» no se reconoce; quedó libre.', 'ANA PÉREZ: Day 12: “Z” not recognized; left as free.'],
    ['2 cuadro(s) en borrador.', '2 schedule(s) in draft.'],
    ['Horas desiguales en UCI.', 'Uneven hours in UCI.'],
    ['Laura 180 h frente a Marta 150.5 h, ya descontando ausencias.', 'Laura 180 h versus Marta 150.5 h, after discounting absences.'],
    ['Luis con 6 noche(s). El promedio de planta es 4.5.', 'Luis with 6 night(s). The permanent staff average is 4.5.'],
    ['ANA: trabaja el 6 después de noche (falta descanso)', 'ANA: works on day 6 after a night shift (missing rest)'],
    ['ANA: trabaja el 1 después de noche del mes anterior (falta descanso)', 'ANA: works on day 1 after a night shift in the previous month (missing rest)'],
    ['ANA: tarde y mañana consecutivas (3→4), solo 12 h de descanso', 'ANA: afternoon followed by morning (3→4), only 12 h of rest'],
    ['ANA: 7 días seguidos de trabajo (máx. 6)', 'ANA: 7 consecutive working days (max. 6)'],
    ['Día 9: falta cubrir turno N (0/1)', 'Day 9: shift N is not covered (0/1)'],
    ['Día 9: sobran terapeutas en turno M (3/2)', 'Day 9: too many therapists on shift M (3/2)'],
    ['ANA: el día 4 también trabaja en Urgencias', 'ANA: on day 4 also works in Urgencias'],
  ])('%s', (es, en) => {
    expect(t(es)).toBe(en);
  });

  it('deja intacto un mensaje desconocido', () => {
    expect(t('Algo raro')).toBe('Algo raro');
  });
});
