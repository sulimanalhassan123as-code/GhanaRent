// Premium DB Structure
const initDB = () => {
    if (!localStorage.getItem('ghanaRentDB_v2')) {
        const dummyData = {
            properties: [
                { id: 1, name: "East Legon Villa", type: "2 Bedroom", address: "Accra", rent: 2000, status: "Vacant" },
            ],
            tenants: [
                { id: 1, name: "Kwame Mensah", phone: "233550000000", propName: "Tamale Compound", status: "Owing", balance: 1500 },
                { id: 2, name: "Ama Serwaa", phone: "233240000000", propName: "Osu Apartment", status: "Paid", balance: 0 }
            ]
        };
        localStorage.setItem('ghanaRentDB_v2', JSON.stringify(dummyData));
    }
    return JSON.parse(localStorage.getItem('ghanaRentDB_v2'));
};

let db = initDB();

// SPA Router System (The "Flash Page" logic without overlaps)
const switchView = (viewId) => {
    document.querySelectorAll('.app-view').forEach(view => view.classList.add('hidden'));
    document.getElementById(`view-${viewId}`).classList.remove('hidden');
    
    const navBtn = document.getElementById('nav-btn');
    if(viewId === 'dashboard' || viewId === 'visitor') {
        navBtn.classList.add('hidden');
    } else {
        navBtn.classList.remove('hidden');
    }
    
    // Instant Updates: Re-render before showing
    if(viewId === 'dashboard') renderDashboard();
    if(viewId === 'visitor') renderVisitor();
};

// Initial Load Setup
const urlParams = new URLSearchParams(window.location.search);
const isVisitor = urlParams.get('mode') === 'visitor';

window.onload = () => {
    if (isVisitor) {
        document.getElementById('header-title').innerText = "🏠 Available Houses";
        switchView('visitor');
    } else {
        document.getElementById('header-title').innerText = "👨🏽‍💼 Landlord Pro";
        switchView('dashboard');
    }
};

// ==========================================
// LANDLORD LOGIC
// ==========================================
const renderDashboard = () => {
    const totalOwing = db.tenants.filter(t => t.status === "Owing").reduce((sum, t) => sum + t.balance, 0);
    const paidCount = db.tenants.filter(t => t.status === "Paid").length;

    const html = `
        <div class="stat-grid">
            <div class="stat-card green">
                <h3>${paidCount}</h3><p>Paid Tenants</p>
            </div>
            <div class="stat-card red">
                <h3>GH₵ ${totalOwing}</h3><p>Total Owing</p>
            </div>
        </div>
        <div class="card">
            <h2>Quick Tools</h2>
            <button class="btn-blue" onclick="renderAddHouse()">➕ Add New House</button>
            <button class="btn-blue" onclick="renderTenantManager()">👥 Manage Tenants & Receipts</button>
            <button class="btn-outline" onclick="shareVisitorLink()">📲 Share Link to WhatsApp</button>
        </div>
        
        <div class="card" style="background: #FFFBEB; border-color: #FBBF24;">
            <h2 style="color: #D97706;">🤖 AI Insight</h2>
            <p>You have <strong>GH₵ ${totalOwing}</strong> locked in unpaid rent. Tap 'Manage Tenants' to generate instant reminders.</p>
        </div>
    `;
    document.getElementById('view-dashboard').innerHTML = html;
};

const renderAddHouse = () => {
    const html = `
        <div class="card">
            <h2>Add New Property</h2>
            <p>Enter the details for your vacant house.</p>
            <input type="text" id="h-name" placeholder="Property Name (e.g., Safa Villa)">
            <input type="text" id="h-type" placeholder="Type (e.g., Chamber & Hall)">
            <input type="number" id="h-rent" placeholder="Monthly Rent (GH₵)">
            <button class="btn-blue" onclick="saveHouse()">✅ Save Property</button>
        </div>
    `;
    document.getElementById('view-add-house').innerHTML = html;
    switchView('add-house');
};

const renderTenantManager = () => {
    let html = `<h2>🚨 Owing Rent</h2>`;
    
    db.tenants.filter(t => t.status === "Owing").forEach(t => {
        html += `
            <div class="card" style="border-left: 6px solid var(--crimson-red);">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <h3 style="margin-bottom:0;">${t.name}</h3>
                        <p style="font-size:0.9rem;">${t.propName}</p>
                    </div>
                    <h3 style="color:var(--crimson-red);">GH₵ ${t.balance}</h3>
                </div>
                <div style="display:flex; gap:10px; margin-top:15px;">
                    <button class="btn-red" style="margin:0;" onclick="sendWhatsApp('${t.phone}', 'Reminder: GH₵ ${t.balance} is outstanding for ${t.propName}.')">Chat</button>
                    <button class="btn-green" style="margin:0;" onclick="markAsPaid(${t.id})">Mark Paid</button>
                </div>
            </div>
        `;
    });

    html += `<h2 style="margin-top:30px;">✅ Rent Cleared</h2>`;
    db.tenants.filter(t => t.status === "Paid").forEach(t => {
        html += `
            <div class="card" style="border-left: 6px solid var(--emerald-green);">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <h3 style="margin-bottom:0;">${t.name}</h3>
                        <p style="font-size:0.9rem;">${t.propName}</p>
                    </div>
                    <button class="btn-outline btn-small" onclick="generateReceipt('${t.name}', '${t.propName}')">📄 PDF Receipt</button>
                </div>
            </div>
        `;
    });

    document.getElementById('view-tenant-manager').innerHTML = html;
    switchView('tenant-manager');
};

// Data Handlers
const saveHouse = () => {
    const name = document.getElementById('h-name').value;
    const type = document.getElementById('h-type').value;
    const rent = document.getElementById('h-rent').value;
    
    if(!name || !rent) return alert("Fill all details.");

    db.properties.push({ id: Date.now(), name, type, address: "Ghana", rent, status: "Vacant" });
    localStorage.setItem('ghanaRentDB_v2', JSON.stringify(db));
    switchView('dashboard');
};

const markAsPaid = (tenantId) => {
    const tenant = db.tenants.find(t => t.id === tenantId);
    if(tenant) {
        tenant.status = "Paid";
        tenant.balance = 0;
        localStorage.setItem('ghanaRentDB_v2', JSON.stringify(db));
        renderTenantManager(); // Instant DOM update
    }
};

// PDF Receipt Generator (Native, Offline, No Plugins)
const generateReceipt = (name, prop) => {
    const date = new Date().toLocaleDateString('en-GB');
    const printHtml = `
        <div class="receipt-box">
            <h1 style="color:#1E3A8A;">GHANARENT</h1>
            <h2>OFFICIAL RENT RECEIPT</h2>
            <hr style="margin: 20px 0;">
            <p style="text-align:left; font-size:1.2rem;"><strong>Date:</strong> ${date}</p>
            <p style="text-align:left; font-size:1.2rem;"><strong>Received From:</strong> ${name}</p>
            <p style="text-align:left; font-size:1.2rem;"><strong>Property:</strong> ${prop}</p>
            <p style="text-align:left; font-size:1.2rem;"><strong>Status:</strong> <span style="color:#10B981;">PAID IN FULL</span></p>
            <hr style="margin: 20px 0;">
            <p><em>Thank you for your business. Generated securely via GhanaRent Pro.</em></p>
        </div>
    `;
    document.getElementById('print-area').innerHTML = printHtml;
    window.print(); // Triggers OS PDF engine
};

// ==========================================
// VISITOR LOGIC
// ==========================================
const renderVisitor = () => {
    let html = `<p style="text-align:center;">Browse premium properties below.</p>`;
    const vacantProps = db.properties.filter(p => p.status === "Vacant");

    vacantProps.forEach(p => {
        html += `
            <div class="card">
                <div style="width:100%; height:180px; background:#E2E8F0; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:3rem; margin-bottom:15px;">🏠</div>
                <h2>${p.name}</h2>
                <p><strong>Type:</strong> ${p.type}</p>
                <h3 style="color:var(--emerald-green); margin: 10px 0;">GH₵ ${p.rent} / month</h3>
                <button class="btn-blue" onclick="sendWhatsApp('233000000000', 'Hello, I want to rent ${p.name}.')">Message Landlord</button>
            </div>
        `;
    });
    document.getElementById('view-visitor').innerHTML = html;
};

// Utils
const sendWhatsApp = (phone, msg) => window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
const shareVisitorLink = () => {
    const link = window.location.origin + window.location.pathname + "?mode=visitor";
    sendWhatsApp('', `View available houses here: ${link}`);
};
