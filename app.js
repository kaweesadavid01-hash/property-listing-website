// ── APP STATE ──
let roomStyles = {};
let listingsData = {};
let activeSearchCategory = '';
let currentAlbum = [];
let currentAlbumIdx = 0;

// ── FETCH DATA FROM API ──
async function initApp() {
    try {
        // Fetches data from the Express API we created in Step 2
        const res = await fetch('data.json');  
        const data = await res.json();
        
        roomStyles = data.roomStyles;
        listingsData = data.listingsData;
        console.log("✅ Property data loaded from API!");
        
        // Initialize UI interactions after data is ready
        initUI();
    } catch (err) {
        console.error("Failed to load data:", err);
    }
}

function initUI() {
    // Search listener
    const searchLoc = document.getElementById('search-location');
    if(searchLoc) searchLoc.addEventListener('keydown', e => { if(e.key==='Enter') runSearch(); });

    // Custom cursor
    const cursor = document.getElementById('cursor');
    const ring = document.getElementById('cursorRing');
    if(cursor && ring) {
        document.addEventListener('mousemove', e => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
            setTimeout(() => {
                ring.style.left = e.clientX + 'px';
                ring.style.top = e.clientY + 'px';
            }, 60);
        });
        document.querySelectorAll('a,button,.prop-card,.service-card').forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.style.transform = 'translate(-50%,-50%) scale(2.5)';
                ring.style.transform = 'translate(-50%,-50%) scale(1.4)';
            });
            el.addEventListener('mouseleave', () => {
                cursor.style.transform = 'translate(-50%,-50%) scale(1)';
                ring.style.transform = 'translate(-50%,-50%) scale(1)';
            });
        });
    }

    // Sticky nav
    const nav = document.getElementById('mainNav');
    if(nav) {
        window.addEventListener('scroll', () => {
            nav.classList.toggle('scrolled', window.scrollY > 60);
        });
    }

    // Scroll reveal
    const observer = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ── SEARCH & UI LOGIC (Your original logic, unchanged) ──
function setTab(el, cat) {
    document.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    activeSearchCategory = cat;
}

function runSearch() {
    const loc  = document.getElementById('search-location').value.trim().toLowerCase();
    const type = document.getElementById('search-type').value.toLowerCase();
    const cats = activeSearchCategory ? [activeSearchCategory] : ['land','apartments','rentals','shortstays'];
    let results = [];

    cats.forEach(cat => {
        listingsData[cat].items.forEach((item, idx) => {
            let match = true;
            if (loc  && !item.location.toLowerCase().includes(loc) && !item.title.toLowerCase().includes(loc)) match = false;
            if (type && type !== 'all types' && !item.type.toLowerCase().includes(type.replace(/s$/,''))) match = false;
            if (match) results.push({...item, _cat:cat, _idx:idx});
        });
    });

    const grid  = document.getElementById('search-results-grid');
    const title = document.getElementById('search-results-title');
    const count = document.getElementById('search-results-count');
    const noRes = document.getElementById('search-no-results');
    
    title.textContent = loc ? `Results for "${document.getElementById('search-location').value}"` : 'All Properties';
    count.textContent = results.length + ' propert' + (results.length===1?'y':'ies') + ' found';
    
    if (results.length === 0) { grid.innerHTML=''; noRes.style.display='block'; }
    else {
        noRes.style.display='none';
        grid.innerHTML = results.map(item => {
            const bt = item.label==='Per Month'?'For Rent':item.label==='Per Night From'?'Short Stay':'For Sale';
            const bs = item.label==='Per Night From'?'background:var(--tan);color:var(--dark)':'';
            const bc = item.label==='Per Month'?'for-rent':'';
            return `<div class="listing-full-card" onclick="showDetail('${item._cat}',${item._idx})">
                <div class="prop-img"><div class="prop-img-bg ${item.bg}" style="${item.bg2||''};width:100%;height:100%;background-size:contain;background-position:center;background-repeat:no-repeat;margin-top:5px"></div>
                <div class="prop-badnt-pill">📷 ${item.rooms.length} Photos</div></div>
                <div class="prop-bodyge ${bc}" style="${bs}">${bt}</div>
                <div class="album-cou"><div class="prop-type">${item.type}</div><div class="prop-title">${item.title}</div>
                <div class="prop-location">📍 ${item.location}</div>
                <div style="font-family:'Montserrat',sans-serif;font-size:.62rem;color:rgba(26,13,5,.5);margin-bottom:14px">${item.specs.slice(0,3).map(s=>s.k+': '+s.v).join(' · ')}</div>
                <div class="prop-footer"><div class="prop-price"><small>${item.label}</small>${item.price}</div><div class="prop-action">→</div></div></div></div>`;
        }).join('');
    }
    document.getElementById('search-overlay').style.display='block';
    document.getElementById('search-overlay').scrollTop=0;
    document.body.style.overflow='hidden';
}

function closeSearch() {
    document.getElementById('search-overlay').style.display='none';
    document.body.style.overflow='';
}

// ── ALBUM STATE ──
function buildAlbum(rooms) {
    currentAlbum = rooms.map(r => roomStyles[r]||roomStyles.exterior);
    currentAlbumIdx = 0;
    renderAlbumMain();
    document.getElementById('album-thumbs').innerHTML = currentAlbum.map((r,i)=>
        `<div class="album-thumb ${i===0?'active':''}" onclick="goAlbum(${i})"><div class="album-thumb-bg" style="background:${r.grad}"></div></div>`).join('');
    document.getElementById('album-dots').innerHTML = currentAlbum.map((_,i)=>
        `<button class="album-dot ${i===0?'active':''}" onclick="goAlbum(${i})"></button>`).join('');
}

function renderAlbumMain() {
    const r = currentAlbum[currentAlbumIdx];
    document.getElementById('album-main-bg').style.cssText = `width:100%;height:100%;background:${r.grad};background-size:cover;background-position:center;background-repeat:no-repeat;`;
    document.getElementById('album-label').textContent = r.icon+'  '+r.label;
    document.querySelectorAll('.album-thumb').forEach((t,i)=>t.classList.toggle('active',i===currentAlbumIdx));
    document.querySelectorAll('.album-dot').forEach((d,i)=>d.classList.toggle('active',i===currentAlbumIdx));
}

function goAlbum(idx){ currentAlbumIdx=(idx+currentAlbum.length)%currentAlbum.length; renderAlbumMain(); }
function albumNav(dir){ goAlbum(currentAlbumIdx+dir); }

// ── DETAIL MODAL ──
function showDetail(cat, idx) {
    const item = listingsData[cat].items[idx];
    buildAlbum(item.rooms);
    const bc = item.label==='Per Month'?'rent':item.label==='Per Night From'?'short':'sale';
    const bt = item.label==='Per Month'?'For Rent':item.label==='Per Night From'?'Short Stay':'For Sale';
    
    document.getElementById('detail-main').innerHTML = `
        <div class="detail-badge-row"><span class="detail-badge ${bc}">${bt}</span><span class="detail-badge type-tag">${item.type}</span></div>
        <div class="detail-title">${item.title}</div>
        <div class="detail-loc">📍 ${item.location}</div>
        <div class="detail-specs-title">Specifications</div>
        <div class="specs-grid">${item.specs.map(s=>`<div class="spec-item"><span class="spec-icon">${s.i}</span><div class="spec-info"><strong>${s.k}</strong><span>${s.v}</span></div></div>`).join('')}</div>
        <div class="detail-specs-title">Description</div>
        <div class="detail-desc">${item.desc}</div>
        <div class="detail-specs-title">Features & Amenities</div>
        <ul class="features-list">${item.features.map(f=>`<li>${f}</li>`).join('')}</ul>`;
        
    document.getElementById('detail-sidebar').innerHTML = `
        <div class="detail-price-box">
            <div class="detail-price-label">${item.label}</div>
            <div class="detail-price-amt">${item.price}</div>
            ${item.label==='Per Night From'?'<div class="detail-price-sub">Weekly & Monthly Rates Available</div>':item.label==='Per Month'?'<div class="detail-price-sub">Inspection Fee UGX 75,000</div>':'<div class="detail-price-sub">Negotiable · Legal Fees Apply</div>'}
        </div>
        <div><div class="sidebar-section-title">Your Agent</div>
        <div class="sidebar-info-item"><span>👤</span><div><strong>Name</strong><span>${item.agent}</span></div></div>
        <div class="sidebar-info-item"><span>📞</span><div><strong>Phone / WhatsApp</strong><span>${item.phone}</span></div></div>
        <div class="sidebar-info-item"><span>🕐</span><div><strong>Availability</strong><span>Mon – Sat, 8AM – 6PM</span></div></div></div>
        <div class="sidebar-info-item"><span>🏠</span><div><strong>Property No</strong><span>${item.propetyNo}</span></div></div>
        <div><div class="sidebar-section-title">Photo Album</div>
        <div style="font-family:'Montserrat',sans-serif;font-size:.68rem;color:rgba(245,230,208,.5);line-height:1.6">${currentAlbum.length} photos. Use arrows to browse all rooms.</div></div>
        <button class="enquire-btn" onclick="closeDetail();closeSearch();closePage();setTimeout(()=>document.getElementById('contact').scrollIntoView({behavior:'smooth'}),200)">Enquire About This Property</button>
        <a href="https://wa.me/${item.phone.replace(/\s|\+/g,'')}" target="_blank"><button class="wa-btn">💬 WhatsApp Agent</button></a>`;
        
    document.getElementById('detail-modal').style.display='block';
    document.getElementById('detail-modal').scrollTop=0;
    document.body.style.overflow='hidden';
}

function closeDetail(){
    document.getElementById('detail-modal').style.display='none';
    document.body.style.overflow='';
}

// ── LISTINGS PAGE ──
function showPage(category) {
    const data = listingsData[category];
    if(!data) return;
    document.getElementById('page-title').textContent = data.title;
    document.getElementById('listing-filter').innerHTML = data.filterOptions.map(o=>`<option>${o}</option>`).join('');
    document.getElementById('listings-grid').innerHTML = data.items.map((item,idx)=>{
        const bt = item.label==='Per Month'?'For Rent':item.label==='Per Night From'?'Short Stay':'For Sale';
        const bs = item.label==='Per Night From'?'background:var(--tan);color:var(--dark)':'';
        const bc = item.label==='Per Month'?'for-rent':'';
        return `<div class="listing-full-card" onclick="showDetail('${category}',${idx})">
            <div class="prop-img"><div class="prop-img-bg ${item.bg}" style=${item.bg2||''};width:100%;height:100%;background-size:contain;background-position:center;background-repeat:no-repeat;margin-top:5px"></div>
            <div class="prop-badge ${bc}" style="${bs}">${bt}</div>
            <div class="album-count-pill">📷 ${item.rooms.length} Photos</div></div>
            <div class="prop-body"><div class="prop-type">${item.type}</div><div class="prop-title">${item.title}</div>
            <div class="prop-location">📍 ${item.location}</div>
            <div style="font-family:'Montserrat',sans-serif;font-size:.62rem;color:rgb(193, 193, 161);margin-bottom:14px">${item.specs.slice(0,3).map(s=>s.k+': '+s.v).join(' · ')}</div>
            <div class="prop-footer"><div class="prop-price"><small>${item.label}</small>${item.price}</div><div class="prop-action">→</div></div></div></div>`;
    }).join('');
    document.getElementById('listings-overlay').style.display='block';
    document.getElementById('listings-overlay').scrollTop=0;
    document.body.style.overflow='hidden';
}

function closePage(){
    document.getElementById('listings-overlay').style.display='none';
    document.getElementById('detail-modal').style.display='none';
    document.body.style.overflow='';
}

// ── GLOBAL EVENT LISTENERS ──
document.addEventListener('keydown', e=>{
    if(e.key==='Escape'){
        if(document.getElementById('detail-modal').style.display==='block') closeDetail();
        else if(document.getElementById('search-overlay').style.display==='block') closeSearch();
        else closePage();
    }
    if(document.getElementById('detail-modal').style.display==='block'){
        if(e.key==='ArrowLeft') albumNav(-1);
        if(e.key==='ArrowRight') albumNav(1);
    }
});

function toggleMenu() {
    document.getElementById('mobileMenu').classList.toggle('open');
}

function showProcess(id, btn) {
    document.querySelectorAll('.process-steps').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.ptab').forEach(t => t.classList.remove('active'));
    document.getElementById('proc-' + id).classList.add('active');
    btn.classList.add('active');
}

// ── START THE APP ──
document.addEventListener('DOMContentLoaded', initApp);