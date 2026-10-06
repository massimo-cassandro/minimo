
# Tipi SD

* **Colore** (`$type` value: `color`)
  * Colori in Hex, RGB, HSL o nomi standard.  ("#00ff00" or "rgba(0,0,0,0.5)" )
* **Dimensione** (`dimension`)
  * Misure con unità (px, rem, em, %, ecc.).  ("16px", "1.5rem", "50%" )
* **Numero** (`number`)
  * Valori numerici puri senza unità (es. opacità).  (0.75, 1.2, 100 )
* **Durata** (`duration`)
  * Intervalli di tempo per animazioni e transizioni.  ("200ms", "0.5s" )
* **Curva temporale** (`cubicBezier`)
  * Array di 4 numeri per le curve di easing.  ([0.42, 0, 0.58, 1] )
* **Font family** (`fontFamily`)
  * Nome della font family o elenco (array).  ("Inter", ["Helvetica", "Arial"] )
* **Peso del font** (`fontWeight`)
  * Peso del font (numero o alias testuale).  (700, "bold", "light" )

## composti:

* **bordo** (`border`)
  * Composto: richiede color, width, style.  ({"color": "#000", "width": "1px", "style": "solid"} )
* **Ombra** (`shadow`)
  * Composto: color, offsetX, offsetY, blur, spread, inset.  ({"color": "#0003", "offsetX": "0px", "offsetY": "4px", "blur": "10px"} )
* **Tipografia** (`typography`)
  * Composto: fontFamily, fontSize, fontWeight, lineHeight, letterSpacing.  ({"fontFamily": "Inter", "fontSize": "16px", "fontWeight": 400} )
* **Gradiente** (`gradient`)
  * Composto: array di "stops" (colore e posizione).  ([{"color": "#000", "offset": 0}, {"color": "#fff", "offset": 1}] )
* **Stile del tratto** (`strokeStyle`)
  * Composto: definisce i pattern delle linee (tratteggi).  ({"dashArray": ["4px", "2px"], "lineCap": "round"} )
