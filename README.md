# 🎨 Curator — Galería Fotográfica Portátil

Galería fotográfica portátil con detección de rostros, agrupación por persona, visualización local y organización inteligente. La prioridad principal es Linux y funcionamiento local portable.

## ✨ Características principales

- **Galería** con grilla masonry y modo carrusel.
- **Rostros** con detección automática, agrupación por persona y nombres persistentes.
- **Visor** con panel de información, miniaturas de rostros y metadatos relevantes.
- **Álbumes** manuales e inteligentes.
- **Directorios** para navegar el contenido encontrado.
- **Papelera** para restauración segura.
- **Búsqueda global** por nombre, persona, fecha, lugar y álbum.
- **Mapa** con prioridad secundaria y soporte degradado offline.
- **100% portátil**, sin servidor y con persistencia local.

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| UI | React 18 + TypeScript + Tailwind |
| Shell | Tauri 2 (Rust) |
| IA / Rostros | Python sidecar local |
| Base de datos | SQLite (sqlx) |
| Mapas | Leaflet + caché local de geolocalización |
| Empaquetado | AppImage / Linux primero |

## 📌 Decisiones clave del producto

- Favoritos se guardan en la BD, no en metadatos del archivo.
- El recorte crea un archivo nuevo.
- La rotación sí puede sobrescribir el archivo original.
- La identidad del medio se apoya en hashes, no solo en path o filename.
- El reconocimiento facial es local.
- Linux es prioridad de v1.
- Windows queda preparado para compatibilidad futura.

## 🗂️ Formatos previstos en v1

### Imágenes
PNG, JPG, JPEG, SVG, WEBP, ICO, HEIC, TIFF, RAW, GIF.

### Videos
MP4, AVI, MOV, MKV, WEBM.

## 🧭 Orden recomendado para construir

1. Instalación y estructura base.
2. Escaneo real + EXIF + thumbnails + listado simple.
3. Galería grid funcional.
4. Visor con panel de información.
5. Rostros y agrupación persistente.
6. Corrección manual de rostros.
7. Mapa y álbumes por lugar.
8. Acciones, papelera, búsqueda y empaquetado.

## 📋 Planners principales

- `00_RESUMEN_PARALELO.md`
- `01_instalacion.md`
- `02_base_datos.md`
- `03_escaneo_imagenes.md`
- `04_ui_layout.md`
- `05_galeria_grilla.md`
- `08_rostros_deteccion.md`
- `planners_06_al_15.md`

## 📦 Distribución portable

El ejecutable final busca medios en su propio directorio y en directorios hermanos directos. La carpeta `data/` almacena la BD, miniaturas, rostros, logs y cachés.
