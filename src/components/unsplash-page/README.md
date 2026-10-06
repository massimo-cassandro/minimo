# Unsplash page
Pagina singola con una foto casuale da [Unsplash](https://unsplash.com/) per mostrare alcuni messaggi (utile per le pagine di errore).

Questo componente nasce da alcuni esperimenti fatti con le API di Unsplash. Lo scopo iniziale era mostrare pagine di errore più accattivanti, ma si può usare per qualsiasi altro scopo.

Per ottenere i risultati migliori è consigliabile mostrare immagini da una collezione di foto preparata su Unsplash. Le demo di questo repository usano la mia collezione ["World"](https://unsplash.com/collections/3660951/world).

Serve uno script lato server per recuperare i dati JSON di un'immagine casuale da Unsplash (vedi [Get a Random Photo](https://unsplash.com/documentation#get-a-random-photo) nella documentazione delle API di Unsplash).

Lo script implementa anche [BlurHash](https://blurha.sh/), per mostrare un placeholder dell'immagine fino al suo caricamento.

Per maggiori dettagli ed esempi vedi:

* <https://unsplash.com/developers>
* [A Random Image Slideshow With Unsplash and React](https://betterprogramming.pub/a-random-image-slideshow-with-unsplash-and-react-1b6aee698652)
* [Unsplash Random Photo 1](https://github.com/massimo-cassandro/area-test/tree/main/2023-03-unsplash-random-photo-1)
* [Random Unsplash Photos Slideshow](https://github.com/massimo-cassandro/area-test/tree/main/2023-05-unsplash-random-photo-2)
* [A Split Image Effect in React](https://medium.com/better-programming/a-split-image-effect-in-react-beb2baa3fe5f) and [split image](https://github.com/massimo-cassandro/area-test/tree/main/2023-07-split-image)


Le icone SVG usate nello script provengono da [Phosphor Icon](https://phosphoricons.com/). Al momento non è possibile usarne di diverse senza modificare il codice sorgente.

La directory `snippets` contiene un esempio di implementazione di Unsplash Page per un sistema di pagine di errore in twig/Symfony
