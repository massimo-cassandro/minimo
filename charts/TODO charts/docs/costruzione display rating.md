# Display rating

Il **display rating** raffigura un tachimetro la cui scala è suddivisa in un numero predefinito di porzioni uguali, ognuna corrispondente ad un *range* di valori. L'indicatore indica la porzione corrispondente al range di valori da rappresentare.

![esempio](<costruzione display rating imgs/rating-display_esempio.svg>)

> **Figura 1 - esempio**

Dal punto di vista grafico, la scala è generata da tre circonferenze, e si estende su un angolo di 240° rispetto alla circonferenza esterna:

![costruzione grafica](<costruzione display rating imgs/rating-display_costruzione grafica.svg>)

> **Figura 2 - costruzione grafica con suddivisione in 4 o 5 porzioni**

## Costruzione

![costruzione](<costruzione display rating imgs/rating-display_costruzione.svg>)

> **Figura 3 - costruzione scala**

La scala (l'area in giallo) è costruita dall'unione di 3 circonferenze:

* quella esterna, in blu con centro $A$ di coordinate note e raggio noto.  
* Le due circonferenze interne i cui centri $B$ e $C$ sono disposti in modo equidistante lungo un'asse inclinata di $30^\circ$ rispetto all'asse orizzontale che contiene il punto $A$. La lunghezza del segmento $s$ (definito dall'utente) determina l'ampiezza finale della figura.

La scala viene quindi suddivisa in un numero dato di porzioni. Nell'esempio di figura 4 è stata suddivisa in 4 porzioni, ma il numero può variare.

![schema suddivisione in porzioni](<costruzione display rating imgs/rating-display_costruzione porzione.svg>)

> **Figura 4 - porzione**

L'obiettivo è ricavare le coordinate dei punti di ogni porzione ($D$, $E$, $F$ e $G$ nella figura 4), gli archi di cerchio $\overset{\frown}{DE}$ ed $\overset{\frown}{FG}$ e i due segmenti $\overline{EF}$ e $\overline{DG}$. Le rette che contengono i due segmenti passano per il centro $A$.

L'angolo $\gamma$ corrisponde al gap tra una porzione e l'altra.

Opzionalmente, possono essere costruiti dei *ticks* (vedi figura 2), ovvero dei prolungamenti del segmento iniziale di ogni porzione.

## Sviluppo

> NB tutti i valori fanno riferimento al sistema di coordinate SVG, in cui l'origine degli assi è collocata sul vertice in alto a sinistra del *viewbox*. Inoltre, a differenza del piano cartesiano standard, la direzione positiva dell'asse delle ordinate è orientata verso il basso.

### Parametri iniziali


> Il raggio della circonferenza esterna ($r_A$) e le coordinate del centro $A$ sono definite dai valori preimpostati, ovvero le dimensioni del file SVG ($w$ e $h$), l'eventuale padding ($p$) tra l'area del grafico vero e proprio e il *viewbox* del documento e l'eventuale bordo $m$ intorno al display (in grigio in figura 2): 
>
> $r_A$ = $w / 2 - p - m$
>
> $x_A$ = $w / 2$
>
> $y_A$ = $h - (r_A \sin(30^\circ)) - 2p - m$ (\*)
> 
> *(\*) la traccia $m$ non viene rappresentata nella parte inferiore del display, quindi si tiene conto una sola volta del suo spessore. La coordinata $y_A$ del centro è data dall'altezza totale meno traccia e padding meno la parte inferiore del grafico corrispondente a $r_A \sin(30^\circ)$*


* $d_B = d_C$: distanza tra i centri delle circonferenze interne $b$ e $c$ dal centro di quella esterna $a$, lungo un'asse inclinata di 30° rispetto all'asse orizzontale che contiene il centro $r_A$. Sono definiti dall'utente
* $s$: spessore finale del display, impostato dall'utente
* $T_C$: punto di tangenza tra le circonferenze $a$ e $c$, è posizionato esattamente ad un angolo di $210^\circ$
* $T_B$: punto di tangenza tra le circonferenze $b$ e $c$, è posizionato ad un angolo di $-30^\circ$ (o $330^\circ$) 
* $a$: circonferenza esterna (blu)
  * centro in $A$ ($x_A$, $y_A$)
  * raggio $r_A$
* $b$: circonferenza interna a destra (in rosso)
  * centro in $B$  
  * $x_B = x_A + d_B \cos(30^\circ)$
  * $y_B = y_A - d_B \sin(30^\circ)$
  * raggio $r_B = r_A - d_B - s$.
* $c$: circonferenza interna a sinistra (in verde)
  * centro in $C$ 
  * $x_C = x_A + d_C \cos(30^\circ)$
  * $y_C = y_A - d_C \sin(30^\circ)$
  * raggio $r_C = r_A - d_C$

![dettaglio calcolo centri](<costruzione display rating imgs/rating-display_dettaglio calcolo centri.svg>)

### Verifica dei valori definiti dall'utente

Le circonferenze interne $b$ e $c$ non devono mai intersecare quella esterna $a$, l'unico punto di contatto possibile è costituito dal punto di tangenza $T_c$ corrispondente al vertice sinistro della scala.

* lo spessore finale $s$ della scala non deve portare il raggio $r_B$ a valori negativi o incoerenti:
  * $d_B + S < r_A$
* il centro $C$ deve rimanere all'interno della circonferenza $a$ per permettere la tangenza nel punto $T_C$:
  * $d_C < r_A$

### Calcolo delle coordinate di una porzione di scala

> **Figura 5 - calcolo centri circonferenze interne**

L'obiettivo è determinare le coordinate dei punti $D$, $E$, $F$, $G$ per ogni porzione della scala, garantendo che i segmenti laterali siano radiali rispetto al centro $A$ e che la curvatura interna segua l'asimmetria delle circonferenze $b$ e $c$.


![calcolo coordinate](<costruzione display rating imgs/rating-display_calcolo coordinate porzione.svg>)

> **Figura 6 - calcolo coordinate porzione**

Ogni porzione è delimitata da due rette $z$ passanti per il centro $A$ con angolo $\theta$. L'angolo è definito in base al numero di porzioni $n$ e al valore dell'angolo $\gamma$ che corrisponde al gap tra una porzione l'altra.

I punti che delimitando ogni porzione sono inoltre definiti dalla distanza $\rho$ dal centro $A$.




Quindi:

* i due punti esterni, $D$ ed $E$ sono definiti dall'angolo $\theta$ e dalla distanza $\rho$ che in questo caso corrisponde al raggio della circonferenza $A$ ($r_A$)
* per i due punti interni $F$ e $G$ la distanza $\rho$ va calcolata con l'espressione:

$$
\rho(\theta) = d \cdot \cos(\theta - \phi) + \sqrt{r^2 - [d \cdot \sin(\theta - \phi)]^2}
$$


In cui i vari parametri dipendono da quale circonferenza viene utilizzata, in base al valore di $\theta$:

* Se $210^\circ \ge \theta \gt 30^\circ$ (parte verde della curva interna, circonferenza $c$):
  * $\phi = \phi_2 = 210^\circ$
  * $d = d_C$ 
  * $r = r_C = r_A - d_C$
* Se $330^\circ \le \theta \le 30^\circ$ (parte rossa della curva interna, circonferenza $b$) 
  * $\phi = \phi_1 = 330^\circ$
  * $d = d_B$
  * $r = r_B = r_A - d_B - s$

  
Riassumendo, per i punti interni abbiamo un quadro di questo tipo:

![calcolo punto interno](<costruzione display rating imgs/rating-display_esempio calcolo punto interno (c. verde).svg>)

> **Figura 7 - esempio calcolo punto interno (circonferenza verde)**

![calcolo punto interno](<costruzione display rating imgs/rating-display_esempio calcolo punto interno (c. rossa).svg>)

> **Figura 8 - esempio calcolo punto interno (circonferenza rossa) nel punto finale della scala. In questo caso gli angoli $\theta$ e $\phi$ sono uguali**


in cui:

* $\rho = \rho_1 + \rho_2$: distanza dal centro $A$ al punto interno $G$
* $\rho_1 = \sqrt{{r_C}^2 - [d \cdot \sin(\theta - \phi)]^2}$, corrisponde alla seconda parte dell'espressione precedente, ed è l'applicazione del teorema di Pitagora sul triangolo rettangolo la cui ipotenusa corrisponde al raggio $r_C$ passante per $G$, mentre  $\rho_1$ è il cateto maggiore
* $\rho_2 = d \cdot \cos(\theta - \phi)$, corrisponde alla prima parte dell'espressione e corrisponde al cateto minore del triangolo rettangolo avente per ipotenusa la distanza $d$ tra i centri $A$ e $C$
* $\delta$: angolo adiacente al cateto $\rho_2$, corrisponde al valore assoluto di $\theta - \phi$
* $\theta$: angolo della *retta di taglio* definita dall'ampiezza della porzione e dal gap $\gamma$
* $\phi$: angolo fisso del centro di riferimento della circonferenza interna utilizzata, in questo caso $C$, quindi $210^{\circ}$ ($330^{\circ}$ se utilizziamo  $B$)
* $d$: distanza fissa tra il centro $A$ e il centro interno ($d_C$ o $d_B$)
* $r$: raggio della circonferenza interna utilizzata ($r_C$ o $r_B$)
