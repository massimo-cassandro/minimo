export function calcTotPages(records, pageRows) {
  return  Math.ceil(records / pageRows);
}

export default function (currentPage, pageRows, records, showed_pages = 11) {


  const pages = calcTotPages(records, pageRows);

  let pages_array = [];

  if (pages <= showed_pages) {
    pages_array = [...Array(pages).fill().map((_, idx) => idx + 1)];

  } else {


    let side_pages = 2, // pagine a dx/sx della pagina corrente

      step_min = Math.max(1, currentPage - side_pages),
      step_max = Math.min(pages, currentPage + side_pages),

      // spazi aggiuntibi a dx/sx da lasciare liberi per '1', '...', <pages>
      slots_left = step_min > 2? 2 : step_min - 1,
      slots_right = step_max < pages - 1? 2 : pages - step_max;

    // console.log(step_min, step_max, slots_left, slots_right);
    // console.log(step_max - step_min + 1 + slots_left + slots_right);

    // fix per avere sempre il numero prefissato di pagine
    while (step_max - step_min + 1 + slots_left + slots_right < showed_pages) {
      step_min = Math.max(1, step_min - 1);
      step_max = Math.min(pages, step_max + 1);

    }

    // console.log(step_max - step_min + 1 + slots_left + slots_right);

    // if(step_max - step_min + 1 + slots_left + slots_right > showed_pages) {
    //   step_min++;
    // }

    pages_array = [
      ...Array(step_max - step_min + 1)
        .fill()
        .map((_, idx) => step_min + idx)
    ];

    // console.log(pages_array.slice(0));

    if(pages_array[0] === 2) {
      pages_array.unshift(1);

    } else if (pages_array[0] === 3) {
      pages_array.unshift(1, 2);

    } else if (pages_array[0] > 3) {
      pages_array.unshift(1, null);
    }

    if(pages_array.at(-1) === pages - 1) {
      pages_array.push(pages);

    } else if(pages_array.at(-1) === pages - 2) {
      pages_array.push(pages -1, pages);

    } else if(pages_array.at(-1) < pages - 2) {
      pages_array.push(null, pages);
    }
  }

  return pages_array;
}
