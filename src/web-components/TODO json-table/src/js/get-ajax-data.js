export async function getAjaxData(urlParams = {}){

  urlParams = {
    ...{
      startValue: 0,
      searchValue: null
    },
    ...urlParams
  };


  /* urlParamsKeys: {



    startItem: `start`,


    perPage : 'length',


    search : 'search[value]',

    // TODO columns + order
  },

  urlParams: {

    staticValues: [['draw', 1]],

    perPageValue: 25,


  }, */

  const searchParams = new URLSearchParams({
    [this.params.ajaxConfig.urlParamsKeys.startItem]: urlParams.startValue,
    [this.params.ajaxConfig.urlParamsKeys.perPage]: this.params.ajaxConfig.urlParams.perPageValue,

    ...(urlParams.searchValue != null
      ? {[this.params.ajaxConfig.urlParamsKeys.search]: urlParams.searchValue}
      : {}
    ),

    ...(
      (this.params.ajaxConfig.urlParams.staticValues != null && Array.isArray(this.params.ajaxConfig.urlParams.staticValues))
        ? this.params.ajaxConfig.urlParams.staticValues.map(i => ({[i[0]]: i[1]}))
        : {}
    ),

    '_': Date.now()
  });


  const url = new URL(this.params.ajaxUrl);
  url.search = searchParams.toString();

  try {
    const response = await fetch(url.toString());

    this.params.data = await response.json();


  } catch(err) {
    /* eslint-disable no-console */
    console.error(url);
    console.error(err);
    /* eslint-enable no-console */
  }


}
