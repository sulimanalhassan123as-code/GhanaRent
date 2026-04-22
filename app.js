// Simple localStorage keys
const STORAGE_KEY_PROPERTIES = 'ghanarent_properties';
const STORAGE_KEY_PAYMENTS = 'ghanarent_payments';

// In-memory state
let properties = [];
let payments = [];

// DOM elements
const landlordSection = document.getElementById('landlordSection');
const visitorSection = document.getElementById('visitorSection');
const landlordModeBtn = document.getElementById('landlordModeBtn');
const visitorModeBtn = document.getElementById('visitorModeBtn');

const totalHousesEl = document.getElementById('totalHouses');
const totalTenantsEl = document.getElementById('totalTenants');
const thisMonthCollectedEl = document.getElementById('thisMonthCollected');
const stillOwingEl = document.getElementById('stillOwing');
const owingListEl = document.getElementById('owingList');
const paidListEl = document.getElementById('paidList');
const visitorPropertyListEl = document.getElementById('visitorPropertyList');

const addHouseBtn = document.getElementById('addHouseBtn');
const houseFormModal = document.getElementById('houseFormModal');
const houseNameInput = document.getElementById('houseNameInput');
const houseAreaInput = document.getElementById('houseAreaInput');
const houseTypeInput = document.getElementById('houseTypeInput');
const houseAddressInput = document.getElementById('houseAddressInput');
const houseRentInput = document.getElementById('houseRentInput');
const houseAdvanceInput = document.getElementById('houseAdvanceInput');
const houseDepositInput = document.getElementById('houseDepositInput');
const houseImagesInput = document.getElementById('houseImagesInput');
const saveHouseBtn = document.getElementById('saveHouseBtn');
const cancelHouseBtn = document.getElementById('cancelHouseBtn');

// --- UTILITIES ---

function loadData() {
  const p = localStorage.getItem(STORAGE_KEY_PROPERTIES);
  const pay = localStorage.getItem(STORAGE_KEY_PAYMENTS);
  properties = p ? JSON.parse(p) : [];
  payments = pay ? JSON.parse(pay) : [];
}

function saveData() {
  localStorage.setItem(STORAGE_KEY_PROPERTIES, JSON.stringify(properties));
  localStorage.setItem(STORAGE_KEY_PAYMENTS, JSON.stringify(payments));
}

// Generate property ID: HSE + Area3letters + 001
function generatePropertyId(area) {
  const areaPart = (area || 'GEN').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || 'GEN';
  const countForArea = properties.filter(p => p.id.startsWith(`HSE-${areaPart}`)).length + 1;
  const numPart = String(countForArea).padStart(3, '0');
  return `HSE-${areaPart}-${numPart}`;
}

// Simple currency format
function formatMoney(amount) {
  return '₵' + (amount || 0).toLocaleString();
}

// --- RENDER FUNCTIONS ---

function renderDashboard() {
  totalHousesEl.textContent = properties.length.toString();

  // For now, tenants count = number of properties with status Occupied (simple)
  const tenantsCount = properties.filter(p => p.status === 'Occupied').length;
  totalTenantsEl.textContent = tenantsCount.toString();

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  let thisMonthCollected = 0;
  payments.forEach(pay => {
    const d = new Date(pay.datePaid);
    if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
      thisMonthCollected += pay.amount;
    }
  });
  thisMonthCollectedEl.textContent = formatMoney(thisMonthCollected);

  // For now, Still Owing = sum of all properties with status "OwingAmount" field (if we add later)
  // To keep it simple, we just show 0 for now
  stillOwingEl.textContent = formatMoney(0);

  // RED LIST / GREEN LIST (simple demo)
  owingListEl.innerHTML = '';
  paidListEl.innerHTML = '';

  properties.forEach(p => {
    const item = document.createElement('div');
    item.className = 'list-item';
    const left = document.createElement('div');
    left.textContent = p.name + ' (' + p.area + ')';

    const right = document.createElement('div');
    const badge = document.createElement('span');
    badge.className = 'badge';

    // For now, if status is Vacant => Paid (no tenant owing)
    // If Occupied => we mark as Paid (you can later add real logic)
    if (p.status === 'Vacant') {
      badge.classList.add('green');
      badge.textContent = 'No Tenant';
      right.appendChild(badge);
      item.appendChild(left);
      item.appendChild(right);
      paidListEl.appendChild(item);
    } else {
      badge.classList.add('green');
      badge.textContent = 'Paid'; // placeholder
      right.appendChild(badge);
      item.appendChild(left);
      item.appendChild(right);
      paidListEl.appendChild(item);
    }
  });
}

function renderVisitorView() {
  visitorPropertyListEl.innerHTML = '';

  const vacantProps = properties.filter(p => p.status === 'Vacant' || !p.status);

  if (vacantProps.length === 0) {
    visitorPropertyListEl.innerHTML = '<p>No vacant house now. Please check again later.</p>';
    return;
  }

  vacantProps.forEach(p => {
    const card = document.createElement('div');
    card.className = 'property-card';

    const title = document.createElement('div');
    title.textContent = p.name + ' - ' + p.type;
    title.style.fontWeight = '600';

    const addr = document.createElement('div');
    addr.textContent = p.address;

    const rent = document.createElement('div');
    rent.textContent = 'Rent: ' + formatMoney(p.monthlyRent) + ' / month';

    const advance = document.createElement('div');
    advance.textContent = 'Advance: ' + p.advanceRequired;

    const imagesWrap = document.createElement('div');
    imagesWrap.className = 'property-images';

    (p.images || []).forEach(src => {
      const img = document.createElement('img');
      img.src = src;
      imagesWrap.appendChild(img);
    });

    card.appendChild(title);
    card.appendChild(addr);
    card.appendChild(rent);
    card.appendChild(advance);
    if ((p.images || []).length > 0) {
      card.appendChild(imagesWrap);
    }

    visitorPropertyListEl.appendChild(card);
  });
}

// --- EVENT HANDLERS ---

landlordModeBtn.addEventListener('click', () => {
  landlordModeBtn.classList.add('active');
  visitorModeBtn.classList.remove('active');
  landlordSection.classList.remove('hidden');
  visitorSection.classList.add('hidden');
});

visitorModeBtn.addEventListener('click', () => {
  visitorModeBtn.classList.add('active');
  landlordModeBtn.classList.remove('active');
  visitorSection.classList.remove('hidden');
  landlordSection.classList.add('hidden');
  renderVisitorView();
});

addHouseBtn.addEventListener('click', () => {
  houseFormModal.classList.remove('hidden');
});

cancelHouseBtn.addEventListener('click', () => {
  houseFormModal.classList.add('hidden');
  clearHouseForm();
});

function clearHouseForm() {
  houseNameInput.value = '';
  houseAreaInput.value = '';
  houseTypeInput.value = 'Single Room';
  houseAddressInput.value = '';
  houseRentInput.value = '';
  houseAdvanceInput.value = '6 Months';
  houseDepositInput.value = '';
  houseImagesInput.value = '';
}

saveHouseBtn.addEventListener('click', () => {
  const name = houseNameInput.value.trim();
  const area = houseAreaInput.value.trim();
  const type = houseTypeInput.value;
  const address = houseAddressInput.value.trim();
  const rent = Number(houseRentInput.value || 0);
  const advanceRequired = houseAdvanceInput.value;
  const deposit = Number(houseDepositInput.value || 0);

  if (!name || !area || !address || !rent) {
    alert('Please fill all main fields.');
    return;
  }

  const id = generatePropertyId(area);

  // Read images as base64 so they work offline
  const files = Array.from(houseImagesInput.files || []);
  if (files.length > 0) {
    const readers = files.map(file => {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(imgDataList => {
      const newProp = {
        id,
        name,
        type,
        address,
        area,
        bedrooms: null,
        bathrooms: null,
        monthlyRent: rent,
        advanceRequired,
        damageDeposit: deposit,
        depositRefundable: true,
        agentFee: 0,
        images: imgDataList,
        status: 'Vacant'
      };
      properties.push(newProp);
      saveData();
      renderDashboard();
      houseFormModal.classList.add('hidden');
      clearHouseForm();
    });
  } else {
    const newProp = {
      id,
      name,
      type,
      address,
      area,
      bedrooms: null,
      bathrooms: null,
      monthlyRent: rent,
      advanceRequired,
      damageDeposit: deposit,
      depositRefundable: true,
      agentFee: 0,
      images: [],
      status: 'Vacant'
    };
    properties.push(newProp);
    saveData();
    renderDashboard();
    houseFormModal.classList.add('hidden');
    clearHouseForm();
  }
});

// --- INIT ---

loadData();
renderDashboard();
