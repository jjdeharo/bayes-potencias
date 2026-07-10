# PotenciaLab

Recurso web estático para diagnosticar y practicar las propiedades de las potencias con nivel de 1.º de Bachillerato. Funciona íntegramente en el navegador y no recoge datos personales.

## Uso

Puede abrirse `index.html` directamente. Para trabajar mediante un servidor local:

```bash
npm run serve
```

Después se abre `http://localhost:8000`.

## Diseño pedagógico

El recurso sigue un perfil combinado `A+C`:

- una distribución ordinal global de cuatro niveles (`θ = −3, −1, 1, 3`);
- una distribución ordinal por cada una de las seis familias de contenido;
- cinco factores de error independientes con prior informativo `P(error) = 0,25`.

Incluye dos modos separados:

- **Diagnóstico:** sin olvido, entre 10 y 18 preguntas, con cierre cuando el nivel y los factores alcanzan suficiente evidencia. Si no convergen, el resultado se marca como provisional.
- **Práctica:** abierta y sin criterio de parada. Primero obtiene dos evidencias recientes por familia y después prioriza la menos dominada. Aplica olvido exponencial anclado al prior, con memoria efectiva de 20 intentos propios por distribución.

La probabilidad de acierto se genera mediante IRT 3PL. Cada pregunta tiene cuatro opciones (`c = 0,25`), discriminación nominal `a = 1,25 / (1 − c)` y techo de dominio `0,95`. Las dificultades `−1,5; −0,75; 0; 0,75; 1,5` quedan en la mitad central de la escala theta.

Las pistas convierten un acierto en crédito parcial (`s = 0,55`). Un ejercicio repetido después de mostrar la solución se usa solo como práctica y no actualiza el diagnóstico.

## Contenido

El banco contiene 36 preguntas, seis por familia:

1. producto y cociente con la misma base;
2. potencia de una potencia;
3. distribución sobre productos y cocientes, y contraste con sumas;
4. exponentes cero y negativos;
5. exponentes racionales y radicales;
6. expresiones combinadas.

Cada ítem incluye pista, explicación y un distractor asociado a un posible error conceptual.

## Comprobación

```bash
npm test
npm run validate
```

`validation.html` ofrece la misma validación Monte Carlo desde el navegador. Es una herramienta docente y no aparece durante la actividad del alumno. La simulación mide separabilidad bajo el propio modelo, no validez empírica.

La ejecución reproducible de 500 simulaciones por estado con semilla `20260710` obtuvo:

- exactitud equilibrada global: **86,3 %**;
- acierto por nivel: **87,8 %**, **86,8 %**, **82,8 %** y **88,0 %**;
- resultados provisionales: **6,9 %**;
- longitud media: **15,29 preguntas**;
- exactitud equilibrada de los cinco factores de error: entre **85,7 %** y **92,0 %**;
- ningún nivel ni estado de error por debajo del umbral orientativo del 70 %.

## Archivos principales

- `index.html`: interfaz del alumno y resultado docente desplegable.
- `styles.css`: presentación adaptable, modo oscuro y accesibilidad.
- `questions.js`: banco y metadatos pedagógicos.
- `engine.js`: actualización bayesiana, IRT, información esperada, olvido y person-fit.
- `app.js`: flujo de diagnóstico y práctica.
- `validation-core.js`: simulación reproducible.
- `validation.html`: informe ejecutable para el creador.

## Revisión docente recomendada

- ¿Los errores modelados aparecen realmente en el alumnado?
- ¿Alguna pregunta queda fuera de la dificultad esperable?
- ¿Son correctas todas las soluciones y explicaciones?
- ¿Falta algún caso importante del tema?
- ¿El lenguaje es adecuado para el grupo?

El generador IRT aporta verosimilitudes iniciales, pero no sustituye una calibración con respuestas reales.
