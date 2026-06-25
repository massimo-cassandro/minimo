/**
 * Default configuration for all modal-alert dialog types.
 * Type-specific blocks can override any `globals` setting.
 */
export const defaults = {

  // settings applied to all dialog types; can be overridden per type
  globals: {
    extra_class: null,
    onOpen: null,
    onClose: null,
    cssFile: null,    // css file to be automatically loaded // TODO remove
    animation: true,
    showMarks: true,
    callback: null,
    timer: null,
    mes: null,
    heading_class: null,
    text_class: null,

    // extra btn markup, ignored on confirm
    extra_btn: null,
    extra_btn_selector: null,
    extra_btn_focus: true
  },

  success: {
    title: 'Operazione completata',
    ok_btn_text: 'OK',
    ok_btn_class: 'btn',
    timer: 4000 // ms
  },
  error: {
    title: 'Si è verificato un errore',
    ok_btn_text: 'OK',
    ok_btn_class: 'btn'
  },
  warning: {
    title: 'Attenzione!',
    ok_btn_text: 'OK',
    ok_btn_class: 'btn'
  },
  info: {
    title: null,
    ok_btn_text: 'OK',
    ok_btn_class: 'btn'
  },
  confirm: {
    title: 'Confermi?',
    use_warning_icon: false, // when true, uses the warning icon instead of the confirm icon
    ok_btn_text: 'OK',
    cancel_btn_text: 'Annulla',
    cancel_focus: true, // false to give focus to the ok button
    ok_btn_class: 'btn btn-outline',
    cancel_btn_class: 'btn'
  }

};
