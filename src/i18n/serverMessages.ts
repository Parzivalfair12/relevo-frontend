/** Tabla de traducción de mensajes que llegan en español desde la API, los esquemas compartidos y el motor de turnos. */
const exact: Record<string, string> = {
  // Middleware, límites y errores generales
  'Ruta no encontrada': 'Route not found',
  'Datos inválidos': 'Invalid data',
  'Ya existe un registro con esos datos.': 'A record with that data already exists.',
  'El contenido enviado es demasiado grande.': 'The submitted content is too large.',
  'JSON inválido': 'Invalid JSON',
  'Error interno': 'Internal error',
  'No se pudo conectar con el servidor': 'Could not reach the server',
  'Inicia sesión para continuar': 'Sign in to continue',
  'La sesión venció': 'Your session has expired',
  'No tienes permiso para hacer esto': 'You do not have permission to do this',
  'No tienes permiso sobre los cuadros de este servicio': 'You do not have permission over this service’s schedules',
  'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.': 'Too many attempts. Wait a few minutes and try again.',
  'Demasiadas solicitudes seguidas. Espera unos minutos e inténtalo de nuevo.': 'Too many requests in a row. Wait a few minutes and try again.',
  'Origen no permitido': 'Origin not allowed',
  'No encontrado': 'Not found',
  'Alguno de los servicios no existe.': 'One of the services does not exist.',
  // Autenticación y usuarios
  'Ya existe una cuenta con ese correo.': 'An account with that email already exists.',
  'Correo o contraseña incorrectos.': 'Incorrect email or password.',
  'Tu cuenta está pendiente de aprobación por un administrador.': 'Your account is pending approval by an administrator.',
  'Ese correo ya tiene una cuenta.': 'That email already has an account.',
  'Usuario no encontrado': 'User not found',
  'No puedes cambiar tu propio rol.': 'You cannot change your own role.',
  'Esta solicitud ya fue atendida.': 'This request has already been handled.',
  'No puedes eliminar tu propia cuenta.': 'You cannot delete your own account.',
  // Servicios y terapeutas
  'Ese servicio ya existe': 'That service already exists',
  'Servicio no encontrado': 'Service not found',
  'Ya existe una terapeuta con ese nombre.': 'A therapist with that name already exists.',
  'Ese documento ya está registrado.': 'That document is already registered.',
  'Terapeuta no encontrada': 'Therapist not found',
  'Esa terapeuta no tiene turnos en el período.': 'That therapist has no shifts in the period.',
  // Cuadros
  'Cuadro no encontrado': 'Schedule not found',
  'Esa terapeuta no está en este cuadro.': 'That therapist is not in this schedule.',
  'El servicio no existe.': 'The service does not exist.',
  'Ya existe un cuadro de este servicio en ese mes.': 'A schedule for this service already exists in that month.',
  'Este servicio necesita al menos 2 terapeutas activas. Regístralas en Equipo.': 'This service needs at least 2 active therapists. Register them under Team.',
  'Hay terapeutas repetidas: cada persona del directorio solo puede salir una vez.': 'Some therapists are repeated: each person in the directory can appear only once.',
  'Alguna terapeuta no existe o está inactiva.': 'A therapist does not exist or is inactive.',
  'Hay terapeutas repetidas en el equipo.': 'Some therapists are repeated in the team.',
  // Importación
  'Sube un archivo .xlsx o .ods.': 'Upload an .xlsx or .ods file.',
  'No encontré ninguna tabla de turnos. Busco una fila «FECHA» seguida de los días 1, 2, 3… y debajo una fila por persona.':
    'I could not find any shift table. I look for a “FECHA” row followed by days 1, 2, 3… with one row per person below it.',
  'El archivo está dañado.': 'The file is damaged.',
  'El archivo tiene demasiadas partes para ser un cuadro.': 'The file has too many parts to be a schedule.',
  'El archivo es demasiado grande al abrirlo.': 'The file is too large once opened.',
  'El archivo está vacío.': 'The file is empty.',
  'El archivo pesa más de 8 MB.': 'The file is larger than 8 MB.',
  'No se pudo leer el archivo. Sube un cuadro en formato .xlsx o .ods.': 'The file could not be read. Upload a schedule in .xlsx or .ods format.',
  // Generación
  'Falló la generación': 'Generation failed',
  'El generador se detuvo': 'The generator stopped',
  'La generación tardó demasiado': 'Generation took too long',
  // Esquemas Zod compartidos
  'Escribe un correo válido.': 'Enter a valid email address.',
  'Identificador inválido': 'Invalid identifier',
  'Escribe tu nombre completo.': 'Enter your full name.',
  'Escribe el nombre del servicio.': 'Enter the service name.',
  'Escribe el nombre completo.': 'Enter the full name.',
  'Elige al menos un servicio.': 'Choose at least one service.',
  'Escribe el nombre.': 'Enter the name.',
  'Asigna al menos un servicio.': 'Assign at least one service.',
  'Se necesitan al menos 2 terapeutas': 'At least 2 therapists are needed',
  'El día final no puede ser anterior al inicial.': 'The end day cannot be before the start day.',
  'Elige al menos una tabla.': 'Choose at least one table.',
  'El período debe ser AAAA-MM (por ejemplo 2026-09).': 'The period must be YYYY-MM (for example 2026-09).',
  'El período inicial no puede ser posterior al final.': 'The start period cannot be after the end period.',
  // Resumen: tarjetas fijas
  'Falta publicarlos para que el equipo los vea.': 'They still need to be published for the team to see them.',
  'Hay terapeutas en dos cuadros el mismo día.': 'Some therapists are in two schedules on the same day.',
  'Horas parejas en planta.': 'Even hours among permanent staff.',
  'Más noches:': 'Most nights:',
  'Sin turnos:': 'No shifts:',
};
/** Mensajes con datos variables (nombres, días): [expresión, plantilla con $1, $2…] */
const patterns: [RegExp, string][] = [
  // Esquemas y rutas con números
  [/^La contraseña debe tener al menos (\d+) caracteres\.$/, 'The password must be at least $1 characters long.'],
  [/^El día (\d+) no existe en ese mes\.$/, 'Day $1 does not exist in that month.'],
  [/^Ese mes tiene (\d+) días\.$/, 'That month has $1 days.'],
  [/^Aparece en (\d+) cuadro\(s\)\. Para retirarla, desactívala\.$/, 'She appears in $1 schedule(s). To remove her, deactivate her instead.'],
  [/^El servicio tiene (\d+) cuadro\(s\) y no se puede eliminar\.$/, 'The service has $1 schedule(s) and cannot be deleted.'],
  [/^(.+) cambió este cuadro mientras lo editabas\.$/, '$1 changed this schedule while you were editing it.'],
  [/^Pendiente: (.+)$/, 'Pending: $1'],
  // Importación (con y sin el prefijo «Nombre: »)
  [/^Día (\d+): «(.*)» no se reconoce; quedó libre\.$/, 'Day $1: “$2” not recognized; left as free.'],
  [/^(.+): Día (\d+): «(.*)» no se reconoce; quedó libre\.$/, '$1: Day $2: “$3” not recognized; left as free.'],
  // Resumen: tarjetas con datos
  [/^(\d+) cuadro\(s\) en borrador\.$/, '$1 schedule(s) in draft.'],
  [/^(\d+) cruce\(s\) entre servicios\.$/, '$1 overlap(s) between services.'],
  [/^Horas desiguales en (.+)\.$/, 'Uneven hours in $1.'],
  [/^(.+) (\d+(?:\.\d+)?) h frente a (.+) (\d+(?:\.\d+)?) h, ya descontando ausencias\.$/, '$1 $2 h versus $3 $4 h, after discounting absences.'],
  [/^La diferencia máxima, descontando ausencias, es de (\d+) h dentro de cada servicio\.$/, 'The maximum difference, after discounting absences, is $1 h within each service.'],
  [/^(.+) con (\d+) noche\(s\)\. El promedio de planta es (\d+(?:\.\d+)?)\.$/, '$1 with $2 night(s). The permanent staff average is $3.'],
  // Motor de turnos
  [/^(.+): trabaja el 1 después de noche del mes anterior \(falta descanso\)$/, '$1: works on day 1 after a night shift in the previous month (missing rest)'],
  [/^(.+): trabaja el (\d+) después de noche \(falta descanso\)$/, '$1: works on day $2 after a night shift (missing rest)'],
  [/^(.+): tarde y mañana consecutivas \((\d+)→(\d+)\), solo 12 h de descanso$/, '$1: afternoon followed by morning ($2→$3), only 12 h of rest'],
  [/^(.+): (\d+) días seguidos de trabajo \(máx\. (\d+)\)$/, '$1: $2 consecutive working days (max. $3)'],
  [/^Día (\d+): falta cubrir turno ([MTN]) \((\d+)\/(\d+)\)$/, 'Day $1: shift $2 is not covered ($3/$4)'],
  [/^Día (\d+): sobran terapeutas en turno ([MTN]) \((\d+)\/(\d+)\)$/, 'Day $1: too many therapists on shift $2 ($3/$4)'],
  [/^(.+): el día (\d+) también trabaja en (.+)$/, '$1: on day $2 also works in $3'],
];

export function translateServerMessage(msg: string): string {
  if (exact[msg]) return exact[msg];
  for (const [re, tpl] of patterns) {
    const m = re.exec(msg);
    if (m) return tpl.replace(/\$(\d)/g, (_x, i) => m[Number(i)] ?? '');
  }
  return msg;
}
