const API_BASE = 'http://127.0.0.1:8000';
const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');
console.log('scanner token:', token);
console.log('scanner role:', localStorage.getItem('userRole'));
// get elements from the page
const form = document.getElementById('scanner-form');
const fileInput = document.getElementById('scan_file');
const fileText = document.getElementById("file-text");
const imagePreview = document.getElementById('image-preview');
const scanBtn = document.getElementById('scan-btn');
const errorEl = document.getElementById('scanner-error');
const resultCard = document.getElementById('result-card');

// results field
const resultPrediction = document.getElementById('result-prediction');
const resultConfidence = document.getElementById('result-confidence');
const resultCrop = document.getElementById('result-crop');
const resultSite = document.getElementById('result-site');
const resultReason = document.getElementById('result-reason-text');

// recent scans area
const myScansContainer = document.getElementById('my-scans-container');

// show the uploaded image before sending it
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];

  // update file name text
  if (file) {
    fileText.textContent = file.name;
  } else {
    fileText.textContent = "Choose Image";
  }

  // preview image
  if (!file) {
    imagePreview.classList.add('f-hidden');
    imagePreview.src = '';
    return;
  }

  const url = URL.createObjectURL(file);
  imagePreview.src = url;
  imagePreview.classList.remove('f-hidden');
});

// load farmer's own recent scans
async function loadMyScans() {
  const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');

  if (!token) {
    myScansContainer.innerHTML = '<p class="empty-scans-text">log in to see your scan history</p>';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/scanner/my-scans`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const scans = await res.json();

    if (!res.ok) {
      myScansContainer.innerHTML = '<p class="empty-scans-text">could not load your scans</p>';
      return;
    }

    if (!Array.isArray(scans) || scans.length === 0) {
      myScansContainer.innerHTML = '<p class="empty-scans-text">no scans yet</p>';
      return;
    }

    myScansContainer.innerHTML = '';

    scans.forEach(scan => {
      const card = document.createElement('div');
      card.className = 'scan-history-card';

      card.innerHTML = `
        <img src="${scan.image_url}" alt="scan image" class="scan-history-img">
        <div class="scan-history-body">
          <div class="scan-history-top">
            <span class="scan-badge">${scan.prediction}</span>
            <span class="scan-time">${formatScanDate(scan.created_at)}</span>
          </div>
          <p><strong>crop:</strong> ${scan.crop_type}</p>
          <p><strong>site:</strong> ${scan.site_id}</p>
          <p><strong>confidence:</strong> ${Math.round(scan.confidence * 100)}%</p>
          <p><strong>reason:</strong> ${scan.reason}</p>
        </div>
      `;

      myScansContainer.appendChild(card);
    });
  } catch (err) {
    console.error('failed to load scans:', err);
    myScansContainer.innerHTML = '<p class="empty-scans-text">could not connect to scan history</p>';
  }
}

// format date a bit nicer
function formatScanDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch {
    return dateString;
  }
}

// handle form submit
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  errorEl.textContent = '';
  resultCard.classList.add('hidden');

  const cropType = document.getElementById('crop_type').value;
  const siteId = document.getElementById('site_id').value.trim();
  const file = fileInput.files[0];

  const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');

  if (!cropType || !siteId || !file) {
    errorEl.textContent = 'please complete all fields and choose an image.';
    return;
  }

  if (!token) {
    errorEl.textContent = 'you need to log in first before scanning.';
    return;
  }

  const formData = new FormData();
  formData.append('crop_type', cropType);
  formData.append('site_id', siteId);
  formData.append('file', file);

  scanBtn.disabled = true;
  scanBtn.textContent = 'scanning...';

  try {
    const res = await fetch(`${API_BASE}/api/scanner/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.detail || 'scan failed.';
      return;
    }

    resultPrediction.textContent = data.prediction || '-';
    resultConfidence.textContent =
      data.confidence != null ? `${Math.round(data.confidence * 100)}%` : '-';
    resultCrop.textContent = data.crop_type || '-';
    resultSite.textContent = data.site_id || '-';
    resultReason.textContent = data.reason || '-';

    resultCard.classList.remove('hidden');

    loadMyScans();
  } catch (err) {
    console.error('scanner error:', err);
    errorEl.textContent = 'could not connect to the scanner service.';
  } finally {
    scanBtn.disabled = false;
    scanBtn.textContent = 'scan plant';
  }
});



loadMyScans();