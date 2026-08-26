/**
 * Image Cropper Tool - V3.1
 * Gestione Separata LocalStorage: Preset persistenti vs Dati volatili
 */

const DEFAULT_LABELS = [ 'desktop_crop', 'mobile_crop', 'tablet', 'hero', 'thumbnail', 'og-image' ];
let cropper = null;
let currentImageId = null;
let appData = {};
let labelPresets = {};

window.onload = () => {
  loadPresets();      // Carica i rapporti W/H
  initLabelSelect();  // Popola la tendina
  loadAppData();      // Carica le immagini e i ritagli
  setupEventListeners();
};

// --- GESTIONE PRESET (Configurazione Rapporti) ---

function loadPresets() {
  const saved = localStorage.getItem('cropper_presets');
  if (saved) {
    labelPresets = JSON.parse(saved);
  } else {
    // Inizializzazione la prima volta in assoluto
    DEFAULT_LABELS.forEach(l => labelPresets[ l ] = { w: 0, h: 0 });
    savePresetsToStorage();
  }
}

function savePresetsToStorage() {
  localStorage.setItem('cropper_presets', JSON.stringify(labelPresets));
}

function initLabelSelect() {
  const sel = document.getElementById('label-selector');
  sel.innerHTML = "";
  Object.keys(labelPresets).forEach(l => {
    const opt = document.createElement('option');
    opt.value = l;
    opt.textContent = l.toUpperCase();
    sel.appendChild(opt);
  });
  applyLabelPreset();
}

function saveLabelPreset() {
  const label = document.getElementById('label-selector').value;
  const w = parseFloat(document.getElementById('setup-w').value) || 0;
  const h = parseFloat(document.getElementById('setup-h').value) || 0;

  labelPresets[ label ] = { w, h };
  savePresetsToStorage();
  applyLabelPreset();
  // Feedback visivo rapido senza alert bloccanti se preferito,
  // ma lo lasciamo per conferma salvataggio preset
  console.log(`Preset ${label} aggiornato a ${w}:${h}`);
}

function applyLabelPreset() {
  const label = document.getElementById('label-selector').value;
  const preset = labelPresets[ label ];

  document.getElementById('setup-w').value = preset.w || "";
  document.getElementById('setup-h').value = preset.h || "";

  if (cropper) {
    const ratio = (preset.w > 0 && preset.h > 0) ? preset.w / preset.h : NaN;
    cropper.setAspectRatio(ratio);
    syncCropboxToLabel();
  }
}

      // --- LOGICA CORE (Cropping & Files) ---

      function setupEventListeners() {
        document.getElementById('file-input').onchange = (e) => handleFile(e.target.files[ 0 ]);
        const dz = document.getElementById('drop-zone');
        dz.ondragover = (e) => e.preventDefault();
        dz.ondrop = (e) => { e.preventDefault(); handleFile(e.dataTransfer.files[ 0 ]); };
      }

      function handleFile(file) {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target.result;
          if (!appData[ file.name ]) {
            appData[ file.name ] = { data: base64, crops: {}, info: { name: file.name, size: file.size, type: file.type } };
          }
          currentImageId = file.name;
          initCropper(base64, appData[ file.name ].info);
          renderGallery();
          saveAppData();
        };
        reader.readAsDataURL(file);
      }

      function initCropper(src, info) {
        if (cropper) cropper.destroy();
        const mainImg = document.getElementById('main-image');
        const badge = document.getElementById('crop-dimension-badge');
        mainImg.src = src; mainImg.style.display = 'block';
        document.getElementById('placeholder-text').style.display = 'none';

        document.getElementById('info-name').innerText = info.name;

        cropper = new Cropper(mainImg, {
          viewMode: 1,
          zoomable: false,
          autoCropArea: 0.8,
          ready() {
            const data = cropper.getImageData();
            document.getElementById('info-size').innerText = `${Math.round(data.naturalWidth)}x${Math.round(data.naturalHeight)}px`;
            applyLabelPreset();
          },
          crop(event) {
            const w = Math.round(event.detail.width);
            const h = Math.round(event.detail.height);
            badge.innerText = `${w} x ${h}`;
            badge.style.display = 'block';
            const box = cropper.getCropBoxData();
            badge.style.left = (box.left + (box.width / 2) - (badge.offsetWidth / 2)) + "px";
            badge.style.top = (box.top + box.height + 10) + "px";
          },
          cropend() {
            autoSaveCurrentCrop();
          }
        });
      }

function syncCropboxToLabel() {
  if (!cropper || !currentImageId) return;
  const label = document.getElementById('label-selector').value;
  const saved = appData[ currentImageId ].crops[ label ];
  if (saved) {
    cropper.setData({ x: saved[ 0 ], y: saved[ 1 ], width: saved[ 2 ], height: saved[ 3 ] });
  }
}

function autoSaveCurrentCrop() {
  if (!cropper || !currentImageId) return;
  const label = document.getElementById('label-selector').value;
  const data = cropper.getData();

  appData[ currentImageId ].crops[ label ] = [
    Math.round(data.x), Math.round(data.y), Math.round(data.width), Math.round(data.height)
  ];

  saveAppData();
  renderOutputArea();
}

// --- RENDERING & ELIMINAZIONE ---

function renderOutputArea() {
  const list = document.getElementById('output-list');
  const codeArea = document.getElementById('code-preview');
  const format = document.getElementById('output-format-selector').value;
  list.innerHTML = "";

  const groupedResults = [];

  Object.keys(appData).forEach(fname => {
    const crops = appData[ fname ].crops;
    const labels = Object.keys(crops);
    if (labels.length === 0) return;

    const entry = { img: fname };
    labels.forEach(label => {
      const coords = crops[ label ];
      entry[ label ] = coords;
      list.appendChild(createCropCard(fname, label, coords));
    });
    groupedResults.push(entry);
  });

  if (groupedResults.length === 0) { codeArea.value = ""; return; }

  let out = "";
  if (format === 'twig') {
    out = "{% set crops = [\n" + groupedResults.map(item => {
      let inner = Object.entries(item).map(([ k, v ]) => k === 'img' ? `    img: '${v}'` : `    ${k}: [${v.join(", ")}]`).join(",\n");
      return `  {\n${inner}\n  }`;
    }).join(",\n") + "\n] %}";
  } else if (format === 'php') {
    out = "$crops = [\n" + groupedResults.map(item => {
      let inner = Object.entries(item).map(([ k, v ]) => k === 'img' ? `    "img" => "${v}"` : `    "${k}" => [${v.join(", ")}]`).join(",\n");
      return `  [\n${inner}\n  ]`;
    }).join(",\n") + "\n];";
  } else if (format === 'json') {
    out = JSON.stringify(groupedResults, null, 2);
  } else {
    out = "const crops = " + JSON.stringify(groupedResults, null, 2) + ";";
  }
  codeArea.value = out;
}

function createCropCard(fname, label, c) {
  const div = document.createElement('div');
  div.className = 'crop-card';
  div.innerHTML = `
        <div class="crop-card-left" id="th-${fname}-${label}"></div>
        <div class="crop-card-right">
            <b>${label}</b><br><small>${fname}</small><br>${c[ 2 ]}x${c[ 3 ]}px
        </div>
        <span class="delete-crop">×</span>
    `;

  // Listener eliminazione specifico
  div.querySelector('.delete-crop').onclick = () => deleteSingleCrop(fname, label);

  setTimeout(() => {
    const container = document.getElementById(`th-${fname}-${label}`);
    if (!container) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = appData[ fname ].data;
    img.onload = () => {
      canvas.width = 100; canvas.height = 100;
      ctx.drawImage(img, c[ 0 ], c[ 1 ], c[ 2 ], c[ 3 ], 0, 0, 100, 100);
      container.appendChild(canvas);
      container.onmouseenter = (ev) => showZoom(ev, img, c);
      container.onmousemove = (ev) => moveZoom(ev);
      container.onmouseleave = () => document.getElementById('zoom-preview').style.display = 'none';
    };
  }, 50);

  return div;
}

function showZoom(e, img, c) {
  const zp = document.getElementById('zoom-preview');
  const zc = document.getElementById('zoom-canvas');
  const zctx = zc.getContext('2d');
  const zoomW = 400;
  zc.width = zoomW; zc.height = (c[ 3 ] / c[ 2 ]) * zoomW;
  zctx.drawImage(img, c[ 0 ], c[ 1 ], c[ 2 ], c[ 3 ], 0, 0, zoomW, zc.height);
  zp.style.display = 'block';
  moveZoom(e);
}

function moveZoom(e) {
  const zp = document.getElementById('zoom-preview');
  zp.style.left = (e.clientX + 15) + 'px'; zp.style.top = (e.clientY + 15) + 'px';
}

function deleteSingleCrop(fname, label) {
  if (appData[ fname ] && appData[ fname ].crops[ label ]) {
    delete appData[ fname ].crops[ label ];
    saveAppData();
    renderOutputArea();
  }
}

function renderGallery() {
  const sb = document.getElementById('history-sidebar');
  sb.innerHTML = '<h3>STORICO</h3>';
  Object.keys(appData).forEach(n => {
    const d = document.createElement('div'); d.className = 'thumb-container';
    d.innerHTML = `<img src="${appData[ n ].data}"><span>${n}</span>`;
    d.onclick = () => { currentImageId = n; initCropper(appData[ n ].data, appData[ n ].info); };
    sb.appendChild(d);
  });
}

// --- STORAGE SEPARATO ---

function saveAppData() {
  try {
    localStorage.setItem('cropper_app_data', JSON.stringify(appData));
  } catch (e) {
    console.error("Storage pieno");
  }
}

function loadAppData() {
  const saved = localStorage.getItem('cropper_app_data');
  if (saved) {
    appData = JSON.parse(saved);
    renderGallery();
    renderOutputArea();
  }
}

function clearAllLocalStorage() {
  if (confirm("Vuoi cancellare tutte le immagini e i ritagli? (I preset dei rapporti rimarranno salvati)")) {
    localStorage.removeItem('cropper_app_data'); // Rimuove solo i dati, NON i preset
    appData = {};
    location.reload();
  }
}

function copyArrayToClipboard() {
  const codeArea = document.getElementById('code-preview');
  codeArea.select();
  document.execCommand('copy');
  alert("Codice copiato negli appunti!");
}
