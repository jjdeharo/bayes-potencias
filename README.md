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
- seis factores de error independientes con prior informativo `P(error) = 0,25`.

Incluye dos modos separados:

- **Diagnóstico:** sin olvido, entre 10 y 18 preguntas, con cierre cuando el nivel y los factores alcanzan suficiente evidencia. Si no convergen, el resultado se marca como provisional.
- **Práctica:** abierta y sin criterio de parada. Si existe un diagnóstico completado, una práctica nueva parte de él: hereda sus distribuciones (que actúan como prior y como ancla del olvido) y su evidencia, con marcas de tiempo anteriores al inicio para que envejezca con normalidad. Sin diagnóstico, primero obtiene dos evidencias recientes por familia y después prioriza la menos dominada. Aplica olvido exponencial anclado al prior, con memoria efectiva de 20 intentos propios por distribución. La práctica guardada puede reiniciarse desde la pantalla de selección sin borrar el diagnóstico.

La probabilidad de acierto se genera mediante IRT 3PL. Cada pregunta tiene cuatro opciones (`c = 0,25`), discriminación nominal `a = 1,25 / (1 − c)` y techo de dominio `0,95`. Las dificultades `−1,5; −0,75; 0; 0,75; 1,5` quedan en la mitad central de la escala theta.

Las pistas convierten un acierto en crédito parcial (`s = 0,55`). Un ejercicio repetido después de mostrar la solución recibe el mismo tratamiento: acertarlo otorga crédito parcial (puede ser memoria de la corrección) y fallarlo cuenta completo. Con las variantes parametrizadas esto es ya un caso residual: solo cuenta como repaso el retorno de una variante idéntica dentro de una ventana reciente de 30 ejercicios, no el de la plantilla. La memoria de la corrección de un ejercicio concreto caduca en pocas decenas de ejercicios, así que pasada esa ventana la variante vuelve a ser evidencia plena; el selector, además, prefiere variantes no vistas recientemente. Como la ventana es reciente y no acumulada, la tasa de repaso no crece aunque el progreso se guarde y se retome a lo largo de varios días. En el diagnóstico los ítems no se repiten.

## Contenido

El banco contiene 51 plantillas repartidas en seis familias:

1. producto y cociente con la misma base;
2. potencia de una potencia;
3. distribución sobre productos y cocientes, y contraste con sumas;
4. exponentes cero y negativos;
5. exponentes racionales y radicales;
6. expresiones combinadas.

Cada familia cubre las cinco dificultades (`d0`–`d4`), de modo que el selector siempre encuentra un ejercicio cercano al nivel estimado, tanto en el extremo bajo como en el alto. Cada plantilla incluye pista, explicación y un distractor asociado a un posible error conceptual.

Las plantillas no son ejercicios fijos: cada aparición genera una **variante parametrizada** con datos distintos (bases, exponentes y letras), de modo que una sesión larga de práctica no agota el banco. La respuesta correcta se deriva aplicando la propia regla que el ítem enseña, no se transcribe a mano, y `scripts/verify-variants.js` comprueba en cada variante que coincide numéricamente con la expresión del enunciado, que las cuatro opciones son distintas y que el LaTeX compila.

Los seis factores de error modelados son: operar los exponentes según la operación exterior equivocada; no aplicar el exponente a todos los factores de una potencia de potencia; distribuir una potencia sobre una suma; leer un exponente negativo como signo; intercambiar índice y potencia en un exponente racional; y confundir `(−a)^n` con `−a^n` ignorando la paridad del exponente.

Los metadatos que alimentan el modelo (dificultad `b_q`, número de opciones, factor de error e índice del distractor) son fijos por plantilla, así que todas sus variantes son equivalentes bajo el modelo IRT y la validación Monte Carlo sigue siendo aplicable. El diagnóstico no repite plantillas; la práctica sí las reutiliza, pero con datos nuevos cada vez.

## Comprobación

```bash
npm test
npm run validate
npm run verify:variants
```

`validation.html` ofrece la misma validación Monte Carlo desde el navegador. Es una herramienta docente y no aparece durante la actividad del alumno. La simulación mide separabilidad bajo el propio modelo, no validez empírica.

La ejecución reproducible de 500 simulaciones por estado con semilla `20260710` obtuvo:

- exactitud equilibrada global: **91,2 %**;
- acierto por nivel: **91,4 %**, **88,2 %**, **90,8 %** y **94,4 %**;
- resultados provisionales: **4,7 %**;
- longitud media: **15,77 preguntas**;
- exactitud equilibrada de los seis factores de error: entre **82,8 %** y **92,8 %**;
- ningún nivel ni estado de error por debajo del umbral orientativo del 70 %.

## Archivos principales

- `index.html`: interfaz del alumno y resultado docente desplegable.
- `styles.css`: presentación adaptable, modo oscuro y accesibilidad.
- `questions.js`: plantillas del banco, generador de variantes y metadatos pedagógicos.
- `variants.js`: utilidades de aritmética y de composición de LaTeX para las variantes.
- `engine.js`: actualización bayesiana, IRT, información esperada, olvido y person-fit.
- `app.js`: flujo de diagnóstico y práctica.
- `validation-core.js`: simulación reproducible.
- `validation.html`: informe ejecutable para el creador.
- `vendor/katex/`: librería KaTeX alojada localmente para renderizar las fórmulas en LaTeX sin depender de conexión a Internet.

Las fórmulas del banco de preguntas se escriben en LaTeX (delimitadores `\( … \)`) y se renderizan con KaTeX en tiempo de ejecución.

## Revisión docente recomendada

- ¿Los errores modelados aparecen realmente en el alumnado?
- ¿Alguna pregunta queda fuera de la dificultad esperable?
- ¿Son correctas las soluciones y explicaciones de cada plantilla (basta revisarla una vez: todas sus variantes aplican la misma regla)?
- ¿Falta algún caso importante del tema?
- ¿El lenguaje es adecuado para el grupo?

El generador IRT aporta verosimilitudes iniciales, pero no sustituye una calibración con respuestas reales.
