# Nicolás y Perla — invitación de matrimonio

Sitio estático (HTML + CSS + JS sin dependencias) con confirmación de asistencia
y sugerencias de canciones guardadas en Supabase.

## Estructura

```
index.html            La landing completa (secciones + modales)
css/styles.css        Estilos, mobile first (390px) → 768px → 1024px
js/config.js          ← credenciales de Supabase y fecha del matrimonio
js/main.js            Modales, cuenta regresiva, carrusel y envío de formularios
supabase/schema.sql   Tablas, políticas RLS y vista de resumen
assets/img            Fotos e ilustraciones del diseño
assets/textures       Papel rasgado, encaje
design/               Exportaciones del Figma, solo de referencia
```

## Puesta en marcha

### 1. Crear la base de datos

1. Entra a [supabase.com](https://supabase.com) y crea un proyecto (el plan gratis sobra).
2. Abre **SQL Editor → New query**, pega el contenido de `supabase/schema.sql` y ejecútalo.
3. Ve a **Project Settings → API** y copia `Project URL` y la clave `anon public`.

### 2. Configurar el sitio

Edita `js/config.js`:

```js
window.APP_CONFIG = {
  SUPABASE_URL: "https://xxxxxxxx.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOi...",
  WEDDING_DATE: "2026-12-12T17:30:00-03:00"
};
```

La `anon key` es pública por diseño: va en el navegador de cada invitado. La
seguridad la dan las políticas RLS del schema, que solo permiten **insertar**.
Nadie puede leer, editar ni borrar las respuestas con esa clave.

### 3. Probar en local

```bash
python -m http.server 5173
# http://127.0.0.1:5173
```

(Hay que servirlo por HTTP; abrir `index.html` con doble clic rompe las rutas.)

### 4. Publicar

Cualquier hosting estático sirve. Con Netlify: arrastra la carpeta a
[app.netlify.com/drop](https://app.netlify.com/drop). Con Vercel: `npx vercel`.
Con GitHub Pages: sube el repo y activa Pages sobre la rama `main`.

## Ver las respuestas

En Supabase → **Table Editor** → `rsvps` / `canciones`.
Para un resumen rápido, en el SQL Editor:

```sql
select * from resumen_rsvp;
select * from rsvps order by created_at desc;
select * from canciones order by created_at desc;
```

Ambas tablas se pueden exportar a CSV desde el Table Editor.

## Enlaces externos

- "¿Cómo llegar?" → <https://maps.app.goo.gl/gUkrgZF5ZV2NFM446?g_st=ic>
- "Ver más" de Regalos → <https://milistadenovios.cl/lista/nicoperla>

Ambos abren en pestaña nueva; el de Regalos no tiene modal.

## Notas de implementación

- Los bordes de papel rasgado salen de las hojas originales del Figma. De
  `paper-burgundy-tall.png` y `paper-cream.png` se derivaron dos juegos de
  archivos (script en el historial, no hace falta regenerarlos):
  - `mask-tear-top.png` / `mask-tear-bottom.png`: recortes con la rasgadura, que
    se usan como `mask-image` sobre las capas de fondo. Van en dos capas de
    máscara — la del borde con **altura fija** para que la fibra no se estire al
    alargarse la sección, y un rectángulo sólido que rellena el resto.
  - `paper-*-fill.jpg`: el interior 100 % opaco de cada hoja, que es la textura
    que se repite. Usar las hojas enteras dejaba ver sus bordes transparentes
    como bandas al estirarlas.
- Desktop (≥1024px) cambia hero, torta, dress code, regalos, la foto del lugar y
  la textura burdeo por las versiones apaisadas `*-desktop.jpeg`; móvil y tablet
  usan las verticales del Figma.
- El arco de la fecha y la Y del hero se calibran con **medidas de tinta**, no de
  caja: los `margin` del arco (en `cqw`) igualan los huecos reales entre
  DICIEMBRE / 12 / 2026, y la Y vale `0.945 × --name-size` para que su alto
  coincida con el hueco entre NICOLÁS y PERLA.
- El carrusel anima con un tween propio sobre `scrollLeft`. `scrollTo({behavior:
  "smooth"})` y `scroll-behavior: smooth` no mueven nada en algunos navegadores
  cuando el contenedor tiene `scroll-snap-type: mandatory`. Además hay un
  `setTimeout` de respaldo por si `requestAnimationFrame` está limitado
  (pestaña en segundo plano, ahorro de energía).
- Los modales miden su alto en `dvh`, no en `%`: con `inset: 0` el panel se
  medía contra el viewport de layout, que en móvil incluye la franja bajo la
  barra del navegador, y quedaba descentrado y más alto que la pantalla.
- El bloque de fecha del arco (DICIEMBRE / 12 / 2026) se dimensiona en `cqw`
  contra el ancho del arco, calibrado para que las tres líneas midan lo mismo.
- Tipografías desde Google Fonts: Playfair Display (títulos y textos), Poppins
  (botones) y Ballet (iniciales manuscritas).
- El diseño de Figma solo cubría mobile; tablet y desktop se derivaron con los
  mismos tokens, ampliando el ancho de contenido y los tamaños tipográficos.
