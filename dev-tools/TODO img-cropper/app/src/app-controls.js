
import { params } from './params.js';
import { domBuilder, classnames } from '@massimo-cassandro/minimo';
// import { nanoid } from 'nanoid';

import * as styles from './app-controls.module.css';

export function appControlsInit(){

  params.appControlPanelWrapper.classList.add(styles.appControlPanelWrapper);


  domBuilder([
    {
      tag: 'fieldset',
      className: classnames(styles.editCropWrapper, styles.fieldset),
      children: [
        'legend Edit Crop parameters',
        {
          className: styles.cropFieldWrapper,
          children: [
            'label.form-label(for=cropName) Crop label',
            'input#cropName.form-control(type=text, placeholder=xl... lg..., maxlength=10)'
          ]
        },

        // ratio width and height
        {
          tag: 'fieldset',
          className: classnames(styles.fieldset),
          children: [
            'legend.form-label Ratio',
            'label.form-label.visually-hidden(for=ratioWidth) Ratio width',
            'input#ratioWidth.form-control(type=number, min=0, step=1, placeholder=Width)',
            'label.form-label.visually-hidden(for=ratioHeight) Ratio height',
            'input#ratioHeight.form-control(type=number, min=0, step=1, placeholder=Height)'
          ]
        },

        // crop min width and height: not mandatory, if present they limit the dimensions of the cropbox
        {
          className: styles.cropFieldWrapper,
          children: [
            'label.form-label(for=cropMinWidth) Min width',
            'input#cropMinWidth.form-control(type=number, min=0, step=1)'
          ]
        },
        {
          className: styles.cropFieldWrapper,
          children: [
            'label.form-label(for=cropMinHeight) Min height',
            'input#cropMinHeight.form-control(type=number, min=0, step=1)'
          ]
        },

        // on save: warning about removing all occurrences of crop if they exist and if the changed values require it
        'button.btn.btn-primary.btn-sm(type=button) Save'

      ]
    },

    {
      tag: 'fieldset',
      className: classnames(styles.fieldset),
      children: [
        'legend Select crop',
        'label.form-label.visually-hidden(for=selectCrop) Select crop',
        'select#selectCrop.form-control',
        'button.btn.btn-primary.btn-sm(type=button) Apply',

        // on click: warning about removing all occurrences of crop if they exist and if the changed values require it
        'button.btn.btn-primary.btn-sm(type=button) Edit'
      ]
    },

    {
      tag: 'fieldset',
      className: classnames(styles.fieldset),
      children: [
        'legend Output',

        {
          className: styles.cropFieldWrapper,
          children: [
            'label.form-label(for=outputFormat) Format',
            {
              tag: 'select',
              id: 'outputFormat',
              className: 'form-control',
              children: [
                'option',
                'option(value=json) json',
                'option(value=javascript) javascript',
                'option(value=twig) twig',
                'option(value=php) php',
              ]
            },

            // add to output array
            {
              className: styles.cropFieldWrapper,
              children: [
                'label.form-label(for=outputOrigSize) Add original size',
                'input#outputOrigSize.form-control(type=checkbox)'
              ]
            },
            {
              className: styles.cropFieldWrapper,
              children: [
                'label.form-label(for=outputCroppedSize) Add cropped size',
                'input#outputCroppedSize.form-control(type=checkbox)'
              ]
            },
            {
              className: styles.cropFieldWrapper,
              children: [
                'label.form-label(for=outputCroppedRatio) Add cropped ratio',
                'input#outputCroppedRatio.form-control(type=checkbox)'
              ]
            },
          ]
        },


      ]
    },

    // config export -> complete json with all data, including base64 of img and thumbnail (zip?)
    {
      tag: 'fieldset',
      className: classnames(styles.fieldset),
      children: [
        'legend Import / Export config &amp; images data',

        // TODO import
        'button.btn.btn-primary.btn-sm(type=button) Import config',

        // TODO export (vedi esempio funzione sotto)
        {
          className: styles.cropFieldWrapper,
          children: [
            'label.form-label(for=configProjectName) Project name',
            'input#configProjectName.form-control(type=text)'
          ]
        },
        'button.btn.btn-primary.btn-sm(type=button) Save'


      ]
    }


  ], params.appControlPanelWrapper);
}

/*

async function salvaFile() {
  try {
    // 1. Apre il picker di sistema
    const handle = await window.showSaveFilePicker({
      suggestedName: 'nuovo-documento.txt',
      types: [{
        description: 'File di testo',
        accept: {'text/plain': ['.txt']},
      }],
    });

    // 2. Crea uno stream scrivibile
    const writable = await handle.createWritable();

    // 3. Scrive il contenuto
    await writable.write("Ciao! Questo contenuto viene salvato tramite il picker di sistema.");

    // 4. Chiude lo stream e salva effettivamente il file
    await writable.close();

    console.log("File salvato con successo!");
  } catch (err) {
    console.error("Salvataggio annullato o errore:", err);
  }
}

 */
