const API_BASE = 'http://127.0.0.1:8000';

const form            = document.getElementById('scanner-form');
const fileInput       = document.getElementById('scan_file');
const fileText        = document.getElementById("file-text");
const imagePreview    = document.getElementById('image-preview');
const scanBtn         = document.getElementById('scan-btn');
const errorEl         = document.getElementById('scanner-error');
const resultCard      = document.getElementById('result-card');

const resultPrediction = document.getElementById('result-prediction');
const resultConfidence = document.getElementById('result-confidence');
const resultCrop       = document.getElementById('result-crop');
const resultSite       = document.getElementById('result-site');
const resultReason     = document.getElementById('result-reason-text');

const myScansContainer = document.getElementById('my-scans-container');

function t(key, fallback) {
  return typeof I18n !== 'undefined' ? I18n.t(key) : fallback;
}

document.addEventListener('languageChanged', () => {
  loadMyScans();
  if (fileInput.files.length === 0) {
    fileText.textContent = t('scan.choose_image', "Choose Image");
  }
  if (scanBtn.disabled) {
    scanBtn.textContent = t('scan.scanning', 'Scanning...');
  } else {
    scanBtn.textContent = t('scan.btn', 'Scan Plant');
  }
});

/* ── preview uploaded image ── */
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  fileText.textContent = file ? file.name : t('scan.choose_image', "Choose Image");

  if (!file) {
    imagePreview.classList.add('f-hidden');
    imagePreview.src = '';
    return;
  }
  imagePreview.src = URL.createObjectURL(file);
  imagePreview.classList.remove('f-hidden');
});

/* ── get severity from prediction label ── */
function predictionSeverity(prediction) {
  if (!prediction) return 'normal';
  const p = prediction.toLowerCase();

  if (p.includes('healthy')) return 'normal';

  if (
    p.includes('blight')    ||
    p.includes('rust')      ||
    p.includes('rot')       ||
    p.includes('mosaic')    ||
    p.includes('mildew')    ||
    p.includes('disease')   ||
    p.includes('infected')  ||
    p.includes('virus')     ||
    p.includes('bacterial') ||
    p.includes('disease_risk')
  ) return 'critical';

  if (
    p.includes('pest')      ||
    p.includes('risk')      ||
    p.includes('stress')    ||
    p.includes('deficiency')
  ) return 'warning';

  return 'warning';
}

/* ── badge class for scan history cards ── */
function badgeClass(prediction) {
  const sev = predictionSeverity(prediction);
  if (sev === 'critical') return 'scan-badge scan-badge--critical';
  if (sev === 'warning')  return 'scan-badge scan-badge--warning';
  return 'scan-badge scan-badge--normal';
}

/* ── load farmer's own recent scans ── */
async function loadMyScans() {
  const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');

  if (!token) {
    myScansContainer.innerHTML = `<p class="empty-scans-text">${t('scan.login_history', 'Log in to see your scan history')}</p>`;
    return;
  }

  try {
    const res   = await fetch(`${API_BASE}/api/scanner/my-scans`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });
    const scans = await res.json();

    if (!res.ok) {
      myScansContainer.innerHTML = `<p class="empty-scans-text">${t('scan.load_err', 'Could not load your scans')}</p>`;
      return;
    }

    if (!Array.isArray(scans) || scans.length === 0) {
      myScansContainer.innerHTML = `<p class="empty-scans-text">${t('scan.no_scans', 'No scans yet')}</p>`;
      return;
    }
  
    myScansContainer.innerHTML = '';
    scans.forEach(scan => {
      const card = document.createElement('div');
      card.className = 'scan-history-card';
      card.innerHTML = `
        <img src="${scan.image_url}" alt="${t('scan.image_alt', 'Scan image')}" class="scan-history-img">
        <div class="scan-history-body">
          <div class="scan-history-top">
            <span class="${badgeClass(scan.prediction)}">${scan.prediction}</span>
            <span class="scan-time">${formatScanDate(scan.created_at)}</span>
          </div>
        <p><strong>${t('scan.crop', 'Crop:')}</strong> ${scan.crop_type}</p>
        <p><strong>${t('scan.site', 'Site:')}</strong> ${scan.site_id}</p>
        <p><strong>${t('scan.confidence', 'Confidence:')}</strong> ${Math.round(scan.confidence * 100)}%</p>
        <p><strong>${t('scan.reason', 'Reason:')}</strong> ${scan.reason}</p>
        </div>
      `;
      myScansContainer.appendChild(card);
    });

  } catch (err) {
    myScansContainer.innerHTML = `<p class="empty-scans-text">${t('scan.err_conn', 'Could not connect to the scanner service.')}</p>`;
  }
}

/* ── format date ── */
function formatScanDate(dateString) {
  try { return new Date(dateString).toLocaleString(); }
  catch { return dateString; }
}

/* ===============================
   SAVE SCAN RESULT TO localStorage
================================ */
function saveScanAsAlert(data) {
  const alertEntry = {
    site_id:               data.site_id   || 'scanner',
    type:                  'scan_result',
    source:                'scanner',
    status:                predictionSeverity(data.prediction),
    prediction:            data.prediction,
    confidence:            data.confidence,
    crop_type:             data.crop_type,
    reason:                data.reason,
    air_temperature_c:     null,
    relative_humidity_pct: null,
    timestamp:             new Date().toISOString(),
  };

  try {
    const existing = JSON.parse(localStorage.getItem('alerts') || '[]');
    const updated  = [alertEntry, ...existing].slice(0, 50);
    localStorage.setItem('alerts', JSON.stringify(updated));
  } catch (err) {
    // silently fail
  }
}

/* ── handle form submit ── */
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  errorEl.textContent = '';
  resultCard.classList.add('f-hidden');
  resultCard.classList.add('hidden');

  const cropType = document.getElementById('crop_type').value;
  const siteId   = document.getElementById('site_id').value.trim();
  const file     = fileInput.files[0];
  const token    = localStorage.getItem('token') || localStorage.getItem('jwt_token');

  if (!cropType || !siteId || !file) {
    errorEl.textContent = t('scan.err_fields', 'Please complete all fields and choose an image.');
    return;
  }
  if (!token) {
    errorEl.textContent = t('scan.err_login', 'You need to log in first before scanning.');
    return;
  }

  const formData = new FormData();
  formData.append('crop_type', cropType);
  formData.append('site_id',   siteId);
  formData.append('file',      file);

  scanBtn.disabled    = true;
  scanBtn.textContent = t('scan.scanning', 'Scanning...');

  try {
    const res  = await fetch(`${API_BASE}/api/scanner/upload`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}` },
      body:    formData
    });

    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.detail || t('scan.err_failed', 'Scan failed.');
      return;
    }

    /* ── populate result card ── */
    resultPrediction.textContent = data.prediction || '-';
    resultConfidence.textContent = data.confidence != null
      ? `${Math.round(data.confidence * 100)}%` : '-';
    resultCrop.textContent   = data.crop_type || '-';
    resultSite.textContent   = data.site_id   || '-';
    resultReason.textContent = data.reason    || '-';

    /* ── colour the result card based on severity ── */
    const sev = predictionSeverity(data.prediction);
    resultCard.className = resultCard.className
      .replace(/result-card--\w+/g, '')
      .trim();
    resultCard.classList.add(`result-card--${sev}`);

    /* ── show result card and scroll to it ── */
    resultCard.classList.remove('f-hidden');
    resultCard.classList.remove('hidden');
    /* resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' }); */
    const contentEl = document.querySelector('.f-content');
    if (contentEl) {
      contentEl.scrollTo({ top: resultCard.offsetTop - 20, behavior: 'smooth' });
    } else {
        const content = document.querySelector('.f-content') || document.querySelector('.sh-content');
        if (content) {
          content.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }    
    }

    /* ── save to localStorage for alerts page ── */
    saveScanAsAlert(data);

    /* ── refresh recent scans after 5 seconds so result stays visible ── */
    setTimeout(() => loadMyScans(), 30000);

  } catch (err) {
    errorEl.textContent = t('scan.err_conn', 'Could not connect to the scanner service.');
  } finally {
    scanBtn.disabled    = false;
    scanBtn.textContent = t('scan.btn', 'Scan Plant');
  }
});

loadMyScans();