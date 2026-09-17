# Contrato de interfaz — RR. HH. y reportes de trabajo

Este módulo no dispone actualmente de un ejecutor de pruebas de componentes.
La comprobación automatizada obligatoria es `npm run type-check`; las siguientes
reglas de interfaz son el contrato verificable de aceptación.

## Reporte y días de trabajo

- La fecha del encabezado y cada día debe pertenecer exactamente al `mes` y
  `year` del reporte. El frontend no transforma fechas con UTC al inicializar
  el formulario, para evitar un desplazamiento de día en Cuba.
- Solo trabajadores activos pueden ser responsables o incorporarse a un día.
  El backend sigue siendo la autoridad para permisos y consistencia.
- `horas` es un decimal entre `0` y `24`; `norma` es un decimal mayor o igual
  que cero. Se acepta coma decimal y se normaliza a punto antes de invocar los
  endpoints existentes de trabajador-día.
- Más de 8 horas conserva la advertencia explícita previa existente; no es una
  autorización implícita ni sustituye las reglas del backend.

## Consulta y métricas

- La lista de reportes filtra por texto en código, bloque, campo y área, y por
  mes/año usando los campos ya expuestos por la búsqueda existente.
- Los tableros de métricas inician en el período local actual y muestran un
  error visible si la consulta falla.
- La interfaz no afirma que exista una exportación cuando el backend no ofrece
  un PDF. Los botones pendientes deben implementarse junto con su contrato
  backend y auditoría de exportación.

## Pruebas manuales mínimas

1. Intente guardar una fecha fuera del mes/año: debe bloquearse en cliente.
2. Intente registrar `-1`, `25`, texto y una norma negativa: debe bloquearse.
3. Verifique que un trabajador inactivo no aparezca en responsable ni en el
   selector diario.
4. Filtre la lista por texto, año y mes; confirme que un fallo de API muestra
   mensaje visible y no una tabla aparentemente vacía.
