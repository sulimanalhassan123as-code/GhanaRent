// Database Initialization
const initDB = () => {
    if (!localStorage.getItem('ghanaRentDB')) {
        const dummyData = {
            properties: [
                { id: 1, name: "East Legon Villa", type: "2 Bedroom", address: "Accra", rent: 2000, advance: 1, status: "Vacant" },
                { id: 2, name: "Tamale Compound", type: "Single Room", address: "Tamale", rent: 500, advance: 2, status: "Occupied" }
            ],
            tenants: [
                { id: 1, name: "Kwame Mensah", phone: "233550000000", propId: 2, status: "Paid", balance: 0 },
                { id: 2, name: "Ama Serwaa", phone: "233240000000", propId: null, status: "Owing", balance: 1500 }
            ]
        };
        localStorage.setItem('ghanaRentDB', JSON.stringify(dummyData));
    }
    return JSON.parse(localStorage.getItem('ghanaRentDB'));
};

const db = initDB();

// Routing Logic
const urlParams = new URLSearchParams(window.location.search);
const isVisitor = urlParams.get('mode') === 'visitor';
const appContent = document.getElementById('app-content');
const headerTitle = document.getElementById('header-title');

const renderApp = () => {
    if (isVisitor) {
        headerTitle.innerText = "🏠 Available Houses";
        renderVisitorView();
    } else {
        headerTitle.innerText = "👨🏽‍💼 Landlord Dashboard";
        renderLandlordView();
    }
};

// Landlord View (Admin)
const renderLandlordView = () => {
    const totalOwing = db.tenants.filter(t => t.status === "Owing").reduce((sum, t) => sum + t.balance, 0);
    const paidCount = db.tenants.filter(t => t.status === "Paid").length;

    let html = `
        <div class="stat-grid">
            <div class="stat-card green">
                <h3>${paidCount}</h3><p>Paid Tenants</p>
            </div>
            <div class="stat-card red">
                <h3>GH₵ ${totalOwing}</h3><p>Total Owing</p>
            </div>
        </div>

        <button class="btn-blue" onclick="showAddHouseForm()">➕ Add New House</button>
        <button class="btn-blue" onclick="shareVisitorLink()">📲 Share Visitor Link</button>

        <h2 style="margin-top:20px;">🚨 Red List (Owing)</h2>
    `;

    db.tenants.filter(t => t.status === "Owing").forEach(t => {
        html += `
            <div class="card" style="border-left: 5px solid var(--red);">
                <h3>${t.name}</h3>
                <p>Owes: GH₵ ${t.balance}</p>
                <button class="btn-red" onclick="sendWhatsApp('${t.phone}', 'Hello ${t.name}, this is a gentle reminder regarding your outstanding rent balance of GH₵ ${t.balance}.')">Send WhatsApp Reminder</button>
            </div>
        `;
    });

    html += `<h2 style="margin-top:20px;">✅ Green List (Paid)</h2>`;
    db.tenants.filter(t => t.status === "Paid").forEach(t => {
        html += `
            <div class="card" style="border-left: 5px solid var(--green);">
                <h3>${t.name}</h3>
                <p>Status: Up to date</p>
                <button class="btn-green" onclick="sendWhatsApp('${t.phone}', 'Hello ${t.name}, thank you for keeping your rent up to date!')">Send Thank You message</button>
            </div>
        `;
    });

    appContent.innerHTML = html;
};

// Visitor View (Tenant)
const renderVisitorView = () => {
    let html = `<p style="text-align:center;">Find your next home below.</p>`;
    const vacantProps = db.properties.filter(p => p.status === "Vacant");

    if(vacantProps.length === 0) {
        html += `<div class="card"><p>No houses available right now. Check back later!</p></div>`;
    }

    vacantProps.forEach(p => {
        html += `
            <div class="card">
                <div class="img-placeholder">📸</div>
                <h2>${p.name}</h2>
                <p><strong>Type:</strong> ${p.type} | <strong>Location:</strong> ${p.address}</p>
                <p><strong>Rent:</strong> GH₵ ${p.rent} / month</p>
                <p><strong>Advance Required:</strong> ${p.advance} years</p>
                <button class="btn-blue" onclick="sendWhatsApp('233000000000', 'Hello, I am interested in renting the ${p.name} property I saw on GhanaRent.')">Chat Landlord on WhatsApp</button>
            </div>
        `;
    });

    appContent.innerHTML = html;
};

// Utilities
const sendWhatsApp = (phone, msg) => {
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
};

const shareVisitorLink = () => {
    const link = window.location.origin + window.location.pathname + "?mode=visitor";
    showAIHelper(`Send this link to tenants:<br><br><a href="${link}">${link}</a>`);
};

const showAIHelper = (msg) => {
    document.getElementById('ai-tip').innerHTML = msg;
    document.getElementById('ai-modal').classList.remove('hidden');
};

const showAddHouseForm = () => {
    appContent.innerHTML = `
        <div class="card">
            <h2>Add New House</h2>
            <input type="text" id="h-name" placeholder="House Name (e.g., Safa Villa)">
            <input type="text" id="h-type" placeholder="Type (e.g., Chamber & Hall)">
            <input type="number" id="h-rent" placeholder="Monthly Rent (GH₵)">
            <button class="btn-blue" onclick="saveHouse()">Save House</button>
            <button class="btn-red" onclick="renderApp()">Cancel</button>
        </div>
    `;
};

const saveHouse = () => {
    const name = document.getElementById('h-name').value;
    const type = document.getElementById('h-type').value;
    const rent = document.getElementById('h-rent').value;
    
    if(!name || !rent) return alert("Please fill details");

    db.properties.push({ id: Date.now(), name, type, address: "TBD", rent, advance: 1, status: "Vacant" });
    localStorage.setItem('ghanaRentDB', JSON.stringify(db));
    showAIHelper("House Added Successfully! 🏠✅");
    renderApp();
};

// PWA Install Prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('install-btn').classList.remove('hidden');
});

document.getElementById('install-btn').addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            document.getElementById('install-btn').classList.add('hidden');
        }
        deferredPrompt = null;
    }
});

// Start App
renderApp();
