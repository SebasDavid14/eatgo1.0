CARPETA DE IMÁGENES - EATGO
===========================

Coloca aquí las imágenes de los productos y otros recursos visuales del proyecto.

Estructura sugerida:
--------------------
IMAGENES/
├── productos/
│   ├── hamburguesa.jpg
│   ├── pizza.jpg
│   ├── malteada.jpg
│   ├── salchipapas.jpg
│   ├── perro-caliente.jpg
│   └── helado.jpg
├── banners/
│   ├── promo-2x1.jpg
│   └── oferta-comida.jpg
├── logo/
│   └── eatgo-logo.png
└── README.txt  (este archivo)

Formatos recomendados:
----------------------
- JPG/JPEG para fotos de productos (mejor compresión)
- PNG para logos y elementos con transparencia
- WebP para máximo rendimiento

Dimensiones sugeridas para productos:
--------------------------------------
- Tarjeta de menú: 400 x 300 px
- Banner promocional: 1200 x 400 px
- Logo: 200 x 200 px

Para usar las imágenes en el proyecto:
---------------------------------------
En el HTML reemplaza los emojis por etiquetas <img>:

Antes:
  <div class="food-card-img-placeholder">🍔</div>

Después:
  <img src="IMAGENES/productos/hamburguesa.jpg" class="food-card-img" alt="Hamburguesa">
