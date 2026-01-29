// imposta lo script analytics GA4 (se l'utente ha dato il consenso)


export function run_analytics() {

  const analytics_id = 'G-NBCMZ18740';

  // purchase_data_element = document.getElementById('ga-purchase-data'); // deinito in landing-acquisti
  // let purchase_obj = null;
  // if(purchase_data_element) {
  //   purchase_obj = JSON.parse(purchase_data_element.dataset.d);
  // }

  let script = document.createElement('script');

  //   <script async src="https://www.googletagmanager.com/gtag/js?id={{ GA_id }}"></script>
  //   <script>
  //     window.dataLayer = window.dataLayer || [];
  //     function gtag(){dataLayer.push(arguments);}
  //     gtag('js', new Date());
  //     gtag('config', '{{ GA_id }}');
  // </script>

  script.onload = function() {
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    gtag('js', new Date());
    gtag('config', analytics_id);

    // if(purchase_obj) {
    //   gtag('event', 'purchase', purchase_obj);
    // }

    // console.log('GA4 onLoad');
  };

  script.classList.add('ga');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${analytics_id}`;
  document.head.appendChild(script);

  // console.log('Google Analytics ON');
  // console.log(document.head.querySelector('script.ga'));
  // console.groupCollapsed('Impostazioni analytics');
  // console.log(`analytics_id: ${analytics_id}`);
  // // if(purchase_obj) {
  // //   console.log('purchase:');
  // //   console.log(purchase_obj);
  // // }
  // console.log($wt.cookie.get('cck1'));
  // console.groupEnd();

}
