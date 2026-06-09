export function enable_submit_btns(context = document) {
  context.querySelectorAll('[type=submit], [type=button]:not([data-disabled])').forEach(btn => {
    btn.disabled = false;
  });
}
