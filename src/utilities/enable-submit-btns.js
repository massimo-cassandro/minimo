export function enableSubmitBtns(context = document) {
  context.querySelectorAll('[type=submit], [type=button]:not([data-disabled])').forEach(btn => {
    btn.disabled = false;
  });
}
