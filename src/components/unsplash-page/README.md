# Unsplash page
Single page with random photo from [Unsplash](https://unsplash.com/) to display some messages (useful for error pages).

This component comes from some experiments I did with the Unsplash API. The initial purpose was to display more appealing error pages, but you can use it for any use.

For best results, it is advisable to display images from a photo collection prepared on Unsplash. The demos in this repository use my collection ["World"](https://unsplash.com/collections/3660951/world).

You need to create a server script to retrieve the JSON data of a random image from Unsplash (see [Get a Random Photo](https://unsplash.com/documentation#get-a-random-photo) on Unsplash API docs).

The script also implements [BlurHash](https://blurha.sh/), to show a placeholder of the image until it loads.

For more details and examples take a look at:

* <https://unsplash.com/developers>
* [A Random Image Slideshow With Unsplash and React](https://betterprogramming.pub/a-random-image-slideshow-with-unsplash-and-react-1b6aee698652)
* [Unsplash Random Photo 1](https://github.com/massimo-cassandro/area-test/tree/main/2023-03-unsplash-random-photo-1)
* [Random Unsplash Photos Slideshow](https://github.com/massimo-cassandro/area-test/tree/main/2023-05-unsplash-random-photo-2)
* [A Split Image Effect in React](https://medium.com/better-programming/a-split-image-effect-in-react-beb2baa3fe5f) and [split image](https://github.com/massimo-cassandro/area-test/tree/main/2023-07-split-image)


The SVG icons used in the script are from [Phosphor Icon](https://phosphoricons.com/). At the moment it is not possible to use different ones without modifying the source code.

The `snippets` directory contains an example of implementing Unsplash Page for an error page system in twig/Symfony
