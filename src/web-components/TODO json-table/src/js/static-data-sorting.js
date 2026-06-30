

export function staticDataSorting(useDefaultSorting = false) {


  const sortingObj = useDefaultSorting? { ...this.params.defaultSorting?? {} } : { ...this.params.activeSorting?? {} };

  if(Object.keys(sortingObj)) {

    // parsedData is generated into `table-row.js` for static data only
    // return this.parsedData.toSorted( (a, b) => {

    //   let ts = (a.ts === null) - (b.ts === null) || a.ts - b.ts;
    //   let rk = b.rk - a.rk;
    //   return ts || rk;
    // });
    return this.params.data;

  } else {
    return this.params.data;
  }

}
