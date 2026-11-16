/* Jourdan's Task Manager: v35 add-on.
   Loads AFTER index.html's own script. It adds the new sections and replaces a handful of
   existing functions. Everything saves through the dashboard's existing save and cloud sync. */
const W = window, D = document;
const $ = id => D.getElementById(id);
const uid = () => crypto.randomUUID();
const LS = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v) } catch { return d } };
const LSset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} };
const wrap = (name, fn) => { const o = W[name]; if (typeof o !== 'function') { console.warn('v35: missing', name); return } W[name] = fn(o) };
const safe = (name, fn) => { try { fn() } catch (e) { console.error('v35 add-on part failed:', name, e) } };
const EXPOSE = o => Object.assign(W, o);

const DOC_ID = 'jourdan-17af402cd9529a16976dc839';
const FB_CFG = { apiKey: 'AIzaSyBgTlYK22L9S-fgKFKdE4yNkehMf6Rl5n8', authDomain: 'jourdans-project-dashboard.firebaseapp.com', projectId: 'jourdans-project-dashboard', storageBucket: 'jourdans-project-dashboard.firebasestorage.app', messagingSenderId: '436803410032', appId: '1:436803410032:web:34c30901df7a0f0b27fcb5' };

/* =====================================================================
   STYLES AND FONT
   ===================================================================== */
safe('styles', () => {
  const l = D.createElement('link');
  l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
  l.onload = () => { try { D.fonts.load('800 16px Inter').then(() => { if (typeof fitRows === 'function') fitRows(); if (typeof fitCalendar === 'function' && view === 'calendar') fitCalendar() }) } catch (e) {} };
  D.head.appendChild(l);
  const s = D.createElement('style');
  s.id = 'x35css';
  s.textContent = `
:root{--mont:Inter,"Segoe UI",Arial,sans-serif}
body{font-family:Inter,"Segoe UI",Arial,sans-serif}
.wp-soon h3 small,.wp-group h3 .n{font-family:Inter,"Segoe UI",Arial,sans-serif}
/* three date colours: Draft = blue, Public Launch = orange, End = navy */
.cd.draft:not(.done){background:#dbeafe;border-color:#7fb2f0}.cd.draft:not(.done) span{color:#0b4f8a}
.cd.start:not(.done){background:#ffe3c4;border-color:#ff9936}.cd.start:not(.done) span{color:#8a4a00}
.cd.launch:not(.done){background:#dfe6f0;border-color:#8095b3}.cd.launch:not(.done) span{color:#001F3D}
.pdw.draft{--bg:#dbeafe;--bd:#7fb2f0;--bg2:#b9d6fa}
.pdw.start{--bg:#ffe3c4;--bd:#ff9936;--bg2:#ffc98a}
.pdw.launch{--bg:#dfe6f0;--bd:#8095b3;--bg2:#c3cfe0}
.pdw.draft:not(.done) .ackb{color:#0b2f55}.pdw.launch:not(.done) .ackb{color:#001F3D}
/* new bands */
.band.orange{background:linear-gradient(135deg,#050608,#4a2700 55%,#ff9936 140%)}
.band.green{background:linear-gradient(135deg,#050608,#0c3a1d 55%,#1c8a4a 140%)}
.band.navy2{background:linear-gradient(135deg,#001F3D,#07305c 55%,#0071BF 140%)}
.band-r select,.band-r input[type=date]{border:1px solid #ffffff55;background:#ffffff1c;color:#fff;border-radius:10px;padding:8px 11px;font:700 13px var(--mont)}
.band-r select option{color:#111}
/* workplan: reorder handles and typed channel buttons */
.wp-row{grid-template-columns:minmax(270px,2fr) repeat(12,34px) 430px minmax(260px,1.3fr)}
.wp-group{min-width:1420px}
.wp-name>small{margin-left:84px}
.wp-nm{display:flex;align-items:center;gap:6px;min-width:0;flex-wrap:wrap}
.wp-grip{display:inline-flex;align-items:center;gap:2px;flex:none}
.wp-handle{cursor:grab;color:#8a97ab;font-size:15px;line-height:1;padding:3px 4px;border-radius:6px;user-select:none}
.wp-handle:hover{background:#e7edf4;color:#134a8e}
.wp-name .wp-mv{width:22px;height:22px;border:1px solid #d5d9e2;background:#fff;border-radius:6px;font-size:9px;line-height:1;color:#56657a;padding:0;font-weight:700}
.wp-name .wp-mv:hover{background:#eef5ff;border-color:#9cc2f3;text-decoration:none}
.wp-row.drop-before{box-shadow:0 -3px 0 0 var(--native2)}.wp-row.drop-after{box-shadow:0 3px 0 0 var(--native2)}
.wp-chs{flex-wrap:wrap;gap:5px}
.wp-c{width:auto;height:28px;padding:0 10px;font:700 12px var(--mont);color:#475569;background:#fff;border:1.5px solid #c3ccd9;filter:none;opacity:1;border-radius:99px;white-space:nowrap}
.wp-c:hover{background:#eef5ff;border-color:#9cc2f3;opacity:1}
.wp-c.on{background:var(--c);border-color:var(--c);color:#fff}
/* modals, images */
.x35-panel{width:min(820px,94%)}
.x35-imgs{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-start}
.x35-img{position:relative;width:118px;height:118px;border-radius:10px;overflow:hidden;border:1.5px solid #d3dae5;background:#eef1f5}
.x35-img img{width:100%;height:100%;object-fit:cover;display:block;cursor:zoom-in}
.x35-img img.missing{opacity:.25}
.x35-imgx{position:absolute;top:4px;right:4px;width:26px;height:26px;border-radius:99px;border:0;background:#000b;color:#fff;font-size:16px;line-height:1;padding:0}
.x35-imgx:hover{background:#b42318}
.x35-imgadd{display:inline-flex;align-items:center;justify-content:center;width:118px;height:118px;border:2px dashed #9aa9bf;border-radius:10px;color:#134a8e;font:800 13px var(--mont);text-align:center;cursor:pointer;background:#f7f9fc;padding:8px}
.x35-imgadd:hover{background:#eaf2fc;border-color:var(--native2)}
.x35-light{position:fixed;inset:0;z-index:500;background:#000d;display:none;align-items:center;justify-content:center;padding:20px}
.x35-light.open{display:flex}
.x35-light img{max-width:96%;max-height:94%;object-fit:contain;border-radius:8px;background:#fff}
.x35-note{font:600 12.5px var(--mont);color:#6b7a8e;margin-top:6px}
.x35-chips{display:flex;gap:6px;flex-wrap:wrap}
.x35-chips a,.x35-chips span{font:700 12px var(--mont);background:#eaf2fc;color:#134a8e;border-radius:99px;padding:3px 10px;text-decoration:none;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.x35-chips a:hover{background:#d3e4fa}
/* ideas */
.idea.x35{cursor:pointer}
.idea-title2{font:800 17px/1.25 var(--mont);color:#000;padding:2px 0 6px}
.idea-body2{font:500 14px/1.5 var(--mont);color:#2b3445;white-space:pre-wrap;display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden;margin:0 0 8px}
.idea-notes2{font:500 13px/1.45 var(--mont);color:#6b5a82;border-left:3px solid #e3d6f1;padding-left:9px;margin:8px 0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;white-space:pre-wrap}
.idea-thumbs{display:flex;gap:6px;margin:8px 0}
.idea-thumbs .x35-img{width:64px;height:64px;border-radius:8px}
.idea-more{width:64px;height:64px;border-radius:8px;background:#f3eafa;color:#5e0f8f;font:800 14px var(--mont);display:flex;align-items:center;justify-content:center}
/* campaigns */
.x35c .card-name{font-size:24px}
.x35-sp{display:inline-block;font:800 11px var(--mont);letter-spacing:.3px;text-transform:uppercase;padding:4px 9px;border-radius:6px;background:color-mix(in srgb,var(--c) 16%,white);color:color-mix(in srgb,var(--c) 70%,#000);border-left:4px solid var(--c)}
.x35-sp.none{--c:#94a3b8;font-weight:700}
.cd.crun:not(.done){background:#d9f0f2;border-color:#0e7c86}.cd.crun span{color:#0b5f66}
.x35c .nname{margin-left:0}
.cnext2{margin-bottom:22px}
.cnext2 .empty-n{font:600 13px var(--mont);color:#8190a2;border:1.5px dashed #cfd6e0;border-radius:8px;padding:8px 10px}
.seg-btn.s{--pc:var(--sc)}
/* reporting */
.rpt-bar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px}
.rpt-bar input[type=text]{flex:1;min-width:200px;border:1.5px solid #d3dae5;border-radius:10px;padding:10px 12px;font:500 14px var(--mont);outline:0;background:#fff}
.rpt-chips{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 16px}
.rpt-chip{font:800 12.5px var(--mont);padding:6px 12px;border-radius:99px;background:#fff;border:1.5px solid #d5d9e2;color:#334155}
.rpt-chip b{color:#1c8a4a}
.rpt-month{font:900 15px var(--mont);letter-spacing:.6px;text-transform:uppercase;color:#0d1424;margin:22px 0 10px;padding-bottom:6px;border-bottom:3px solid #1c8a4a;display:flex;gap:10px;align-items:baseline}
.rpt-month small{font:700 12px var(--mont);color:#6b7a8e;text-transform:none;letter-spacing:0}
.rpt-row{background:#fff;border:1.5px solid #dfe5ee;border-left:8px solid var(--c,#1c8a4a);border-radius:12px;margin-bottom:9px;box-shadow:0 2px 8px #1723360d}
.rpt-h{display:flex;gap:12px;align-items:center;padding:11px 14px;cursor:pointer}
.rpt-main{flex:1;min-width:0}
.rpt-t{font:800 15px/1.25 var(--mont);color:#000;overflow-wrap:anywhere}
.rpt-m{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
.rpt-date{font:800 12.5px var(--mont);background:#e3f5ea;color:#14633a;border-radius:7px;padding:5px 10px;white-space:nowrap}
.rpt-b{border-top:1px solid #eef1f5;padding:12px 16px 14px;display:grid;grid-template-columns:1fr 1fr;gap:14px}
.rpt-b h4{margin:0 0 5px;font:800 11px var(--mont);letter-spacing:.7px;text-transform:uppercase;color:#56657a}
.rpt-b p,.rpt-b li{font:500 13.5px/1.45 var(--mont);margin:0;color:#1f2937;white-space:pre-wrap}
.rpt-b ul{margin:0;padding-left:18px}
.rpt-act{grid-column:1/-1;display:flex;gap:7px;flex-wrap:wrap}
/* strategic plan */
.x35-fil{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:0 0 16px;padding:12px 14px;background:#fff;border-radius:16px;box-shadow:0 6px 18px #26313e14}
.x35-fil label{font:800 11px var(--mont);letter-spacing:.6px;text-transform:uppercase;color:#56657a;display:flex;flex-direction:column;gap:4px}
.x35-fil select{border:1.5px solid #d3dae5;border-radius:9px;padding:8px 10px;font:600 13px var(--mont);background:#fff;max-width:300px}
.x35-fil .chk{flex-direction:row;align-items:center;gap:7px;text-transform:none;letter-spacing:0;font:700 13px var(--mont);color:#334155;margin-top:16px}
.spb{--c:#134a8e;border-radius:20px;background:#fff;border:1px solid #d9e1ec;box-shadow:0 6px 18px #1723360d;margin-bottom:18px;overflow:hidden}
.spb-h{display:flex;align-items:center;gap:12px;padding:14px 18px;color:#fff;background:linear-gradient(135deg,color-mix(in srgb,var(--c) 62%,black),var(--c) 85%);cursor:pointer;user-select:none}
.spb-h .chev{font-size:13px;transition:transform .2s}
.spb.collapsed .spb-h .chev{transform:rotate(-90deg)}
.spb-n{font:900 22px var(--mont);opacity:.9}
.spb-t{font:800 17px/1.25 var(--mont);flex:1;min-width:0}
.spb-h .ct{background:#ffffff33;border:1px solid #ffffff55;border-radius:99px;padding:2px 12px;font:800 13px var(--mont);white-space:nowrap}
.spb.collapsed .spb-b{display:none}
.spb-b{padding:6px 18px 16px}
.spc{border-bottom:1px solid #edf0f5;padding:14px 0}
.spc:last-child{border-bottom:0}
.spc.gen{background:color-mix(in srgb,var(--c) 6%,white);border-radius:12px;padding:12px 14px;margin-top:12px;border:1px dashed color-mix(in srgb,var(--c) 45%,white)}
.spc-t{font:700 14.5px/1.45 var(--mont);color:#0d1424;border-left:5px solid var(--c);padding-left:11px}
.spc.gen .spc-t{border-left:0;padding-left:0;font-weight:800}
.spc-l{font:800 11px var(--mont);letter-spacing:.7px;text-transform:uppercase;color:color-mix(in srgb,var(--c) 75%,#000);margin:10px 0 6px 16px}
.spc-ideas{margin-left:16px;display:flex;flex-direction:column;gap:8px}
.spc-empty{font:600 13px var(--mont);color:#8190a2;margin:0 0 2px}
.spc-add{margin:10px 0 0 16px}
.spi{display:flex;gap:12px;align-items:center;flex-wrap:wrap;border:1.5px solid #dfe5ee;border-radius:12px;padding:9px 12px;background:#fff}
.spi.arch{opacity:.6;background:#f6f7f9}
.spi-main{flex:1 1 260px;min-width:0}
.spi-name{border:0;background:transparent;padding:0;text-align:left;font:800 14.5px/1.3 var(--mont);color:#0d1424}
.spi-name:hover{text-decoration:underline}
.spi-tag{display:inline-block;margin-left:8px;font:700 11px var(--mont);background:#eef1f5;color:#475569;border-radius:6px;padding:2px 8px;vertical-align:1px;max-width:100%}
.spi-notes{font:500 13px/1.4 var(--mont);color:#5b6b80;margin-top:3px;white-space:pre-wrap}
.spi-link{display:inline-block;margin-top:5px;font:700 12px var(--mont);background:#eaf2fc;color:#134a8e;border:0;border-radius:99px;padding:3px 10px}
.spi-ctl{display:flex;gap:7px;align-items:center;flex-wrap:wrap}
.spi-sel{border:0;border-radius:7px;padding:6px 24px 6px 10px;font:700 12px var(--mont);appearance:none;-webkit-appearance:none;background-color:#e7edf4;color:#334155;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%23334155' stroke-width='1.8' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 8px center;cursor:pointer}
.spi-sel.st-Idea{background-color:#e7edf4}.spi-sel.st-Planned{background-color:#d6f0ec;color:#00695c}.spi-sel.st-InProgress{background-color:#dbeafe;color:#134a8e}.spi-sel.st-Implemented{background-color:#cdeed9;color:#0f5d2f}.spi-sel.st-Parked{background-color:#fdecc8;color:#7a5200}
.spi-sel.tm{background-color:#f3eafa;color:#5e0f8f}
.spx-group{border-radius:20px;background:#fff;border:1px solid #d9e1ec;box-shadow:0 6px 18px #1723360d;margin-bottom:16px;overflow:hidden}
.spx-group .spb-h{cursor:default}
.spx-body{padding:12px 16px 14px;display:flex;flex-direction:column;gap:8px}
.x35-empty{padding:40px 20px;text-align:center;border:2px dashed #cdd5e0;border-radius:18px;font:700 15px var(--mont);color:#5b6b80;background:#fff}
@media(max-width:720px){.rpt-b{grid-template-columns:1fr}.x35-fil select{max-width:none;width:100%}.spb-h{padding:12px 14px}.spb-b{padding:4px 12px 14px}.spc-ideas,.spc-add,.spc-l{margin-left:0}.x35-panel{width:96%}}
`;
  D.head.appendChild(s);
});

/* =====================================================================
   STORED DATA (lives inside "settings", so it saves, syncs and backs up with everything else)
   ===================================================================== */
const X = () => {
  settings.extra = settings.extra || {};
  const e = settings.extra;
  if (!Array.isArray(e.campaigns)) e.campaigns = [];
  if (!e.strategic || typeof e.strategic !== 'object') e.strategic = {};
  if (!Array.isArray(e.strategic.ideas)) e.strategic.ideas = [];
  return e;
};
const saveX = () => persistSettings();

/* ---- the six strategic priorities and their commitments (Communications Strategic Plan 2026) ---- */
const SP = [
  { id: 'sp1', n: 1, color: '#0071BF', short: 'Public Trust', title: 'Build Public Trust Through Clear and Proactive Communication', items: [
    'Develop plain-language communication materials that explain Council decisions, infrastructure investments, utility costs, taxation, service levels, and major projects.',
    'Create a regular “value for taxes” communication series that shows how municipal services support quality of life, safety, recreation, roads, parks, and long-term sustainability.',
    'Use consistent messaging across the City website, social media, media releases, newsletters, public notices, and Council communications.',
    'Prepare communication plans for major initiatives before public discussion begins, including key messages, audiences, risks, timelines, and spokespersons.'] },
  { id: 'sp2', n: 2, color: '#1c8a4a', short: 'Community Involvement', title: 'Increase Community Involvement and Two-Way Engagement', items: [
    'Establish a coordinated engagement calendar for major City projects, budget discussions, infrastructure priorities, housing, recreation, and community-building initiatives.',
    'Use multiple engagement methods, including surveys, pop-up engagement, digital tools, community partner meetings, and targeted outreach.',
    'Create feedback loops that show residents what was heard, how input was considered, and what decisions were made or what resources already exist that would resolve their issue if it was utilized.',
    'Support Council and Administration with consistent engagement materials, speaking notes, frequently asked questions, and follow-up messaging.'] },
  { id: 'sp3', n: 3, color: '#7900bb', short: 'Inclusion & Belonging', title: 'Strengthen Inclusion, Belonging, and Newcomer Communication', items: [
    'Work with community partners such as settlement agencies, schools, social agencies, businesses, and cultural organizations to improve communication with newcomers and long-time residents.',
    'Develop inclusive communication practices to improve understanding of existing processes, regulations and awareness of City services.',
    'Promote stories, events, and initiatives that reinforce Brooks as the “City of 100 Hellos” and celebrate the community’s diversity.',
    'Provide accessible information about municipal services, recreation, public safety, bylaws, employment supports, housing resources, and community programs.'] },
  { id: 'sp4', n: 4, color: '#d92d20', short: 'Community Safety', title: 'Improve Safety Perceptions and Public Confidence', items: [
    'Coordinate regular public safety communications with policing, enforcement, fire, emergency management, and community partners.',
    'Provide timely, factual, and balanced information about safety initiatives, trends, prevention efforts, and available supports.',
    'Communicate City investments and partnerships that contribute to community safety, including infrastructure, lighting, recreation, youth programming, enforcement, and social supports.',
    'Develop crisis and issue-management protocols to support fast, accurate, and coordinated public communication during emerging issues.'] },
  { id: 'sp5', n: 5, color: '#e8700a', short: 'Brooks Identity & Economy', title: 'Promote Brooks’ Identity, Economic Strengths, and Quality of Life', items: [
    'Develop coordinated messaging that highlights Brooks’ strengths: transportation access, irrigation water, available land, recreation amenities, parks, diversity, small-town atmosphere, tourism assets, and regional partnerships.',
    'Support economic development by promoting Brooks as a location for agriculture, processing, warehousing, data centres, energy industry, tourism, and workforce attraction.',
    'Create a shop local and community advocacy campaign that encourages residents to support local businesses, services, events, and amenities with Newell Proud and Economic Development.'] },
  { id: 'sp6', n: 6, color: '#0e7c86', short: 'Corporate Alignment', title: 'Support Strategic Alignment Across City Departments', items: [
    'Create a corporate communications intake and planning process so departments identify communication needs early.',
    'Develop annual communications priorities aligned with Council’s strategic plan, budget cycle, capital plan, community events, and public engagement schedule.',
    'Provide templates and guidance for reports, public notices, media responses, social media posts, website updates, and project communication plans.',
    'Proactively manage communication risks and opportunities for high-profile topics such as housing, infrastructure, taxation, utilities, safety, recreation, and emergency services.'] }
];
SP.forEach(p => { p.commits = p.items.map((t, i) => ({ id: p.id + 'c' + (i + 1), text: t })) });
const spPri = id => SP.find(p => p.id === id) || null;
const spCommit = id => { for (const p of SP) { const c = p.commits.find(x => x.id === id); if (c) return { p, c } } return null };

/* =====================================================================
   DATES: Draft Date, Public Launch Date, End Date
   (Public Launch Date = the old Kickoff date, End Date = the old Launch date, so no data changes)
   ===================================================================== */
safe('dates', () => {
  ACK_KEY.draft = 'draftDone'; DATE_KEY.draft = 'draftDate';
  DEFAULT_CORE_FIELDS.push({ key: 'draftDate', label: 'Draft Date', type: 'date', options: [], visible: true, onBack: false, backStyle: 'line', core: true, locked: false });
  Object.assign(CH.launch, { label: 'End Date', color: '#001F3D', tc: '#ffffff', icon: '🏁' });
  Object.assign(CH.campaign, { label: 'Public Launch Date', color: '#FF9936', tc: '#1b1000', icon: '📣' });
  CH.draft = { label: 'Draft Date', color: '#0071BF', tc: '#ffffff', icon: '✏️', style: 'solid' };
  CH.cnext = { label: 'Campaign content', color: '#0F766E', tc: '#ffffff', icon: '🎯', style: 'tint' };
  CH.crun = { label: 'Campaign run date', color: '#B45309', tc: '#ffffff', icon: '📆', style: 'outline' };
  if (!CAL_KEYS.includes('draft')) { CAL_KEYS.unshift('draft'); CAL_KEYS.push('cnext', 'crun') }
  ['draft', 'cnext', 'crun'].forEach(k => { calFilters[k] = calFilters[k] !== false });
  Object.assign(AG_GROUP, { draft: 'projects', cnext: 'campaigns', crun: 'campaigns' });
  Object.assign(AG_ORDER, { draft: -1, cnext: 6, crun: 6 });

  EXPOSE({
    dateTagLabel(kind) { return kind === 'draft' ? fieldLabel('draftDate', 'Draft Date') : kind === 'launch' ? fieldLabel('deadline', 'End Date') : fieldLabel('campaignLaunch', 'Public Launch Date') },
    ackLabel(kind) { return kind === 'draft' ? 'Drafted' : kind === 'launch' ? 'Ended' : 'Launched' },
    ackBtnText(kind, done) { const t = { draft: ['Mark drafted', '✓ Drafted'], campaign: ['Mark launched', '✓ Launched'], launch: ['Mark ended', '✓ Ended'] }[kind]; return done ? t[1] : t[0] },
    refreshAck() { ['draft', 'campaign', 'launch'].forEach(kind => { const b = $('ack-' + kind), w = $('pdw-' + kind), d = getDraft(); if (!b || !d) return; const done = !!d[ACK_KEY[kind]]; b.classList.toggle('on', done); if (w) w.classList.toggle('done', done); b.textContent = ackBtnText(kind, done) }) },
    pdGroup(kind, cls, p) {
      const KM = { draft: 'draftDate', campaign: 'campaignLaunch', launch: 'deadline' }, k = KM[kind], done = !!p[ACK_KEY[kind]];
      return `<div class="pdw ${cls}${done ? ' done' : ''}" id="pdw-${kind}"><div class="pd"><span>${esc(dateTagLabel(kind))}</span>${dateInput({ value: p[k] || '', cb: `pmSet('${k}',v)`, title: dateTagLabel(kind) })}</div><button type="button" class="ackb${done ? ' on' : ''}" id="ack-${kind}" onclick="pmAck('${kind}')" title="Once the date has arrived, mark it so it stops showing as overdue">${esc(ackBtnText(kind, done))}</button></div>`
    },
    ackDate(id, kind) {
      const p = projects.find(x => x.id === id); if (!p) return; const k = ACK_KEY[kind]; if (!k) return;
      p[k] = true; persist(); render();
      toastMsg({ draft: 'Marked as drafted', campaign: 'Marked as launched', launch: 'Marked as ended' }[kind] + ': ' + displayName(p.project), { label: 'Undo', fn: () => { const q = projects.find(x => x.id === id); if (q) { q[k] = false; persist(); render() } } })
    },
    dateChips(p) {
      const out = [['draftDate', 'draft', 'draft'], ['campaignLaunch', 'start', 'campaign'], ['deadline', 'launch', 'launch']].map(([k, cls, kind]) => {
        const f = coreField(k); if (f && f.visible === false) return '';
        const done = !!p[ACK_KEY[kind]];
        if (!p[k]) { if (kind !== 'launch') return ''; return `<div class="cd unset"><span>${esc(dateTagLabel(kind))}</span> <b>—</b></div>` }
        const needs = !done && days(p[k]) <= 0 && !(kind === 'launch' && isRepeating(p));
        const lab = done ? '✓ ' + ackLabel(kind) : dateTagLabel(kind);
        return `<div class="cd ${cls}${done ? ' done' : ''}${needs ? ' needs' : ''}"${needs ? ` onclick="event.stopPropagation();ackDate('${p.id}','${kind}')" title="Click to mark this as ${esc(ackLabel(kind).toLowerCase())}"` : ''}><span>${esc(lab)}</span> <b>${dateLabel(p[k])}</b>${needs ? '<i class="ackmark">✓</i>' : ''}</div>`
      });
      if (p.status === 'Waiting') {
        const has = !!p.followUp, needs = has && days(p.followUp) <= 0, who = p.waitingOn && String(p.waitingOn).trim() ? 'Waiting on ' + String(p.waitingOn).trim() : 'Waiting';
        out.push(`<div class="cd wait${needs ? ' needs' : ''}" title="${esc(who)}${has ? '' : '. Set a follow-up date in the project.'}"${needs ? ` onclick="event.stopPropagation();followUpDone('${p.id}')"` : ''}><span>${has ? 'Follow up' : 'Waiting'}</span> <b>${has ? dateLabel(p.followUp) : '—'}</b>${needs ? '<i class="ackmark">✓</i>' : ''}</div>`)
      }
      return out.join('')
    },
    agTag(it) {
      if (it.urgent) return 'Priority 5';
      if (it.type === 'launch' || it.type === 'campaign' || it.type === 'draft') return dateTagLabel(it.type);
      return ({ task: 'Checklist', social: 'Social post', newspaper: 'Newspaper', web: 'Website - News', paid: 'Paid social ad', repeat: 'Recurring', followup: 'Follow up', cnext: 'Campaign content', crun: 'Campaign run date' })[it.type] || it.adType || 'Ad'
    }
  });
  wrap('renderPmHead', o => function (p) {
    o.apply(this, arguments);
    try {
      const f = coreField('draftDate'); if (f && f.visible === false) return;
      let box = D.querySelector('#pmHead .pm-dates');
      if (!box) { box = D.createElement('div'); box.className = 'pm-dates'; $('pmHead').appendChild(box) }
      box.insertAdjacentHTML('afterbegin', pdGroup('draft', 'draft', p))
    } catch (e) { console.warn(e) }
  });
  wrap('pmSet', o => function (k, v) { o.apply(this, arguments); if (k === 'draftDate') { const d = getDraft(); if (d) { resetAckIfFuture(d, 'draft'); refreshAck(); if (v) warnHoliday(v) } } });
  wrap('migrate', o => function (p) { p = o.apply(this, arguments); if (!Array.isArray(p.images)) p.images = []; p.draftDate = p.draftDate || ''; p.draftDone = !!p.draftDone; return p });
  wrap('shiftedClone', o => function (p) { const c = o.apply(this, arguments); c.draftDate = ''; c.draftDone = false; return c });
  wrap('openDrawer', o => function (p, existing) { if (!Array.isArray(p.images)) p.images = []; if (p.draftDate === undefined) p.draftDate = ''; if (p.draftDone === undefined) p.draftDone = false; return o.apply(this, arguments) });
  wrap('calKeyLabel', o => function (k) { return k === 'draft' ? dateTagLabel('draft') : o.apply(this, arguments) });
  wrap('moveItemToDate', o => function (pid, kind, id, iso) {
    if (kind === 'draft') { const p = projects.find(x => x.id === pid); if (!p) return { error: 'Could not find that project' }; if (p.draftDate === iso) return { same: true }; p.draftDate = iso; resetAckIfFuture(p, 'draft'); persist(); return { ok: true, warn: holMsg(iso) } }
    if (kind === 'cnext' || kind === 'crun') { const c = cmpById(pid); if (!c) return { error: 'Could not find that campaign' }; const k = kind === 'cnext' ? 'nextDate' : 'runDate'; if (c[k] === iso) return { same: true }; c[k] = iso; saveX(); return { ok: true, warn: holMsg(iso) } }
    return o.apply(this, arguments)
  });
  wrap('renderCalendar', o => function () {
    o.apply(this, arguments);
    const n = D.querySelector('#calView .cal-note');
    if (n) n.innerHTML = 'Dates on projects: <b>Draft</b> (blue), <b>Public Launch</b> (orange) and <b>End</b> (navy), crossed out once marked done. Purple is a follow-up for a project you are waiting on. Teal items come from your Campaigns. Pink days are Alberta holidays (a lighter peach day is optional). Council meetings that land on a holiday move to the next working day. Drag an item to another day to move it, or click a day to add something.'
  });
  wrap('calEvents', o => function (rs, re, all) {
    const ev = o.apply(this, arguments), today = todayISO();
    const add = (date, e) => { if (!date || date < rs || date > re) return; if (!all && calFilters[e.type] === false) return; (ev[date] = ev[date] || []).push(e) };
    projects.forEach(p => {
      if (p.status === 'Complete' || !p.draftDate) return;
      const name = displayName(p.project), c = CH.draft;
      add(p.draftDate, { pid: p.id, project: p.project || 'Untitled Project', type: 'draft', color: c.color, tc: c.tc, icon: c.icon, style: c.style, tab: 'details', text: name, title: name, sub: calKeyLabel('draft'), done: !!p.draftDone, drag: { kind: 'draft', id: '' } })
    });
    X().campaigns.forEach(cm => {
      const nm = cm.name || 'Untitled campaign';
      if (cm.status === 'Active' && cm.nextDate) { const c = CH.cnext; add(cm.nextDate, { pid: cm.id, project: nm, type: 'cnext', color: c.color, tc: c.tc, icon: c.icon, style: c.style, tab: 'details', text: nm + ' · ' + (cm.nextContent || 'Next content'), title: cm.nextContent || 'Next content', sub: 'Campaign content · ' + nm, done: false, drag: { kind: 'cnext', id: cm.id } }) }
      if (cm.status !== 'Potential' && cm.runDate && !(all && cm.runDate < today)) { const c = CH.crun; add(cm.runDate, { pid: cm.id, project: nm, type: 'crun', color: c.color, tc: c.tc, icon: c.icon, style: c.style, tab: 'details', text: nm + ' · run date', title: 'Campaign run date', sub: 'Campaign run date · ' + nm, done: false, drag: { kind: 'crun', id: cm.id } }) }
    });
    return ev
  });
  wrap('calOpen', o => function (pid, t) { if (cmpById(pid)) { closeDayPanel(); setView('campaigns'); x35CmpOpen(pid); return } return o.apply(this, arguments) });
  /* Coming Up: campaigns get their own filter, plus a Done button on campaign content */
  EXPOSE({
    agRowHTML(it, showWhen) {
      let sub = '', today = todayISO();
      const isDate = ['launch', 'campaign', 'draft'].includes(it.type);
      if (it.urgent) sub = it.date ? 'Next date ' + dateLabel(it.date) : 'No date set';
      else if (it.type === 'repeat') sub = String(it.sub || '').replace(/^(Recurring|Repeats)\s·\s/, '');
      else if (!isDate) sub = it.title || '';
      const canAck = isDate && !it.done && it.date && it.date <= today, canFu = it.type === 'followup' && it.date && it.date <= today;
      const ack = canAck ? `<button type="button" class="ackbtn" onclick="event.stopPropagation();ackDate('${it.pid}','${it.type}')" title="Mark as ${esc(ackLabel(it.type).toLowerCase())}: it will stop showing as overdue">✓ ${esc(ackLabel(it.type))}</button>`
        : canFu ? `<button type="button" class="ackbtn" onclick="event.stopPropagation();followUpDone('${it.pid}')" title="You followed up: clear this reminder">✓ Followed up</button>`
          : it.type === 'cnext' ? `<button type="button" class="ackbtn" onclick="event.stopPropagation();x35CmpDone('${it.pid}')" title="This content is done: clear it from the campaign">✓ Done</button>` : '';
      return `<div class="ri" style="--ic:${it.color}" onclick="event.stopPropagation();calOpen('${it.pid}','${it.tab}')"><div class="ri-top"><span class="rc-tag">${it.icon} ${esc(agTag(it))}</span>${showWhen && it.date && it.date < today ? `<span class="rc-when">${dateLabel(it.date)}</span>` : ''}${ack}</div>${sub ? `<div class="ri-s">${esc(sub)}</div>` : ''}${agChips(it)}</div>`
    },
    agProjectCards(list, showWhen, limit) {
      let groups = groupByProject(list); if (limit) groups = groups.slice(0, limit);
      return groups.map(g => { const p = projects.find(x => x.id === g.pid), col = p ? bucketColor(p.bucket) : (g.items[0].color || '#134a8e'); return `<div class="rc" style="--c:${col}" onclick="calOpen('${g.pid}','details')"><div class="rc-t">${esc(displayName(p ? p.project : g.items[0].project))}</div>${g.items.map(i => agRowHTML(i, showWhen)).join('')}</div>` }).join('')
    }
  });
  wrap('renderAgenda', o => function () {
    o.apply(this, arguments);
    const row = D.querySelector('#comingView .band-r .seg-row');
    if (row) row.insertAdjacentHTML('beforeend', `<button type="button" class="${agFilter === 'campaigns' ? 'on' : ''}" onclick="setAgenda({f:'campaigns'})">Campaigns</button>`)
  });
});

/* =====================================================================
   WORKPLAN: reorder items, typed channel buttons
   ===================================================================== */
safe('workplan', () => {
  const WPL = { social: 'Social', website: 'Website', newspaper: 'Newspaper', radio: 'Radio', print: 'Print', utility: 'Utility Bill' };
  let drag = null, dropId = null, dropBefore = true;
  EXPOSE({
    wpRowHTML(r, now) {
      const ch = WP_CH.map(c => `<button type="button" class="wp-c${r.ch.includes(c.k) ? ' on' : ''}" style="--c:${c.color}" title="${esc(c.label)}" aria-pressed="${r.ch.includes(c.k)}" onclick="wpToggleCh('${r.id}','${c.k}',this)">${esc(WPL[c.k] || c.label)}</button>`).join('');
      return `<div class="wp-row" data-r="${r.id}" ondragover="x35WpOver(event,'${r.id}')" ondragleave="this.classList.remove('drop-before','drop-after')" ondrop="x35WpDrop(event)"><div class="wp-name"><div class="wp-nm"><span class="wp-grip"><span class="wp-handle" draggable="true" ondragstart="x35WpStart(event,'${r.id}')" ondragend="x35WpEnd()" title="Drag to reorder">⠿</span><button type="button" class="wp-mv" title="Move up" aria-label="Move up" onclick="x35WpMove('${r.id}',-1)">▲</button><button type="button" class="wp-mv" title="Move down" aria-label="Move down" onclick="x35WpMove('${r.id}',1)">▼</button></span><button type="button" onclick="openWpEditor('${r.id}')" title="Edit this item">${esc(r.name)}</button>${r.isNew ? '<span class="wp-new">NEW</span>' : ''}</div>${r.notes ? `<small>${esc(r.notes)}</small>` : ''}</div>${r.months.split('').map((c, i) => `<button type="button" class="wp-m${c === '1' ? ' on' : ''}${i === now ? ' now' : ''}" title="${MONTH_NAMES[i]}" aria-label="${MONTH_NAMES[i]}" onclick="wpToggleMonth('${r.id}',${i},this)"></button>`).join('')}<div class="wp-chs">${ch}</div><div class="wp-pr">${wpProjectCell(r)}</div></div>`
    },
    x35WpStart(e, id) { try { e.dataTransfer && e.dataTransfer.setData('text/plain', id); e.dataTransfer.effectAllowed = 'move' } catch (_) { } drag = id; dropId = null },
    x35WpOver(e, id) { if (!drag) return; e.preventDefault(); const el = e.currentTarget, r = el.getBoundingClientRect(); dropBefore = (e.clientY - r.top) < r.height / 2; dropId = id; el.classList.toggle('drop-before', dropBefore); el.classList.toggle('drop-after', !dropBefore) },
    x35WpDrop(e) { e.preventDefault(); e.stopPropagation() },
    x35WpEnd() {
      try {
        if (drag && dropId && drag !== dropId) {
          const a = wpFindInfo(drag), b = wpFindInfo(dropId);
          if (a && b && a.sheet.id === b.sheet.id) {
            const row = a.row; a.group.rows = a.group.rows.filter(x => x.id !== row.id);
            let idx = b.group.rows.findIndex(x => x.id === dropId); if (idx < 0) idx = b.group.rows.length; else if (!dropBefore) idx++;
            b.group.rows.splice(idx, 0, row); persistWorkplan()
          }
        }
      } catch (e) { console.error(e) }
      drag = null; dropId = null; renderWorkplan()
    },
    x35WpMove(id, dir) {
      const info = wpFindInfo(id); if (!info) return; const rows = info.group.rows, i = rows.findIndex(x => x.id === id), j = i + dir;
      if (j < 0 || j >= rows.length) return; [rows[i], rows[j]] = [rows[j], rows[i]]; persistWorkplan(); renderWorkplan()
    }
  });
});

/* =====================================================================
   IMAGES (stored apart from your main data so they never fill the 1,000 KB limit)
   ===================================================================== */
const IMG = { mem: new Map(), db: null, fb: null, warned: false };
const idb = () => IMG.db || (IMG.db = new Promise((res, rej) => { if (!W.indexedDB) return rej(new Error('no idb')); const r = indexedDB.open('jpdImgs', 1); r.onupgradeneeded = () => r.result.createObjectStore('i'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error) }));
const idbGet = async id => { try { const db = await idb(); return await new Promise(res => { const q = db.transaction('i').objectStore('i').get(id); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null) }) } catch { return null } };
const idbPut = async (id, v) => { try { const db = await idb(); await new Promise((res, rej) => { const t = db.transaction('i', 'readwrite'); t.objectStore('i').put(v, id); t.oncomplete = res; t.onerror = rej }) } catch { } };
const idbDel = async id => { try { const db = await idb(); await new Promise(res => { const t = db.transaction('i', 'readwrite'); t.objectStore('i').delete(id); t.oncomplete = res; t.onerror = res }) } catch { } };
const fbLoad = () => IMG.fb || (IMG.fb = (async () => {
  const a = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js'), f = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js');
  let app; try { app = a.getApp() } catch { app = a.initializeApp(FB_CFG) }
  return { f, db: f.getFirestore(app) }
})());
const imgRef = (c, id) => c.f.doc(c.db, 'dashboards', DOC_ID, 'images', id);
async function imgGet(id) {
  if (IMG.mem.has(id)) return IMG.mem.get(id);
  let v = await idbGet(id);
  if (!v) { try { const c = await fbLoad(), s = await c.f.getDoc(imgRef(c, id)); if (s.exists()) { v = s.data().d; idbPut(id, v) } } catch { } }
  if (v) IMG.mem.set(id, v); return v
}
async function imgPut(id, data) {
  IMG.mem.set(id, data); await idbPut(id, data);
  try { const c = await fbLoad(); await c.f.setDoc(imgRef(c, id), { d: data, ts: Date.now() }); return true } catch (e) { console.warn('image cloud save failed', e); return false }
}
async function imgDel(id) { IMG.mem.delete(id); idbDel(id); try { const c = await fbLoad(); await c.f.deleteDoc(imgRef(c, id)) } catch { } }
const imgInUse = id => [...projects, ...archive, ...ideas].some(o => (o.images || []).some(i => i.id === id));
function compress(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader(); fr.onerror = rej;
    fr.onload = () => {
      const im = new Image(); im.onerror = rej;
      im.onload = () => {
        let max = 1400, out = '', w = 0, h = 0;
        for (let tries = 0; tries < 4; tries++) {
          const s = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)); w = Math.max(1, Math.round(im.naturalWidth * s)); h = Math.max(1, Math.round(im.naturalHeight * s));
          const c = D.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(im, 0, 0, w, h);
          let q = .8; out = c.toDataURL('image/jpeg', q); while (out.length > 600000 && q > .45) { q -= .1; out = c.toDataURL('image/jpeg', q) }
          if (out.length <= 700000) break; max = Math.round(max * .75)
        }
        res({ data: out, w, h })
      };
      im.src = fr.result
    };
    fr.readAsDataURL(file)
  })
}
let hyT = false;
function hydrate() { D.querySelectorAll('img[data-img]:not([data-done])').forEach(async el => { el.dataset.done = '1'; const v = await imgGet(el.dataset.img); if (v) el.src = v; else el.classList.add('missing') }) }
new MutationObserver(() => { if (hyT) return; hyT = true; requestAnimationFrame(() => { hyT = false; hydrate() }) }).observe(D.body, { childList: true, subtree: true });

/* each place that can hold images tells us where the list is and what to do when it changes */
const IMGCTX = {
  proj: {
    get: () => (getDraft() || {}).images || [],
    changed() { if (currentId) { const live = projects.find(p => p.id === currentId); if (live) { live.images = structuredClone(getDraft().images); persist() } try { const o = JSON.parse(pmSnap); o.images = structuredClone(getDraft().images); pmSnap = JSON.stringify(o) } catch { } } },
    remove(id) { const d = getDraft(); d.images = d.images.filter(i => i.id !== id); this.changed(); if (!imgInUse(id)) imgDel(id) }
  },
  idea: {
    get: () => (IDM ? IDM.d.images : []),
    changed() { },
    remove(id) { IDM.d.images = IDM.d.images.filter(i => i.id !== id); IDM.removed.push(id) }
  }
};
const imgBoxHTML = ctx => { const L = IMGCTX[ctx].get() || []; return `<div class="x35-imgs">${L.map(i => `<div class="x35-img"><img data-img="${i.id}" alt="${esc(i.name || 'Image')}" onclick="x35Light('${i.id}')"><button type="button" class="x35-imgx" title="Remove image" aria-label="Remove image" onclick="x35ImgRemove('${ctx}','${i.id}')">×</button></div>`).join('')}<label class="x35-imgadd">+ Add images<input type="file" accept="image/*" multiple hidden onchange="x35ImgAdd('${ctx}',this)"></label></div><div class="x35-note">Photos are shrunk automatically. Select a picture to see it larger.</div>` };
const imgBoxRefresh = ctx => { const b = $('x35box-' + ctx); if (b) b.innerHTML = imgBoxHTML(ctx) };
EXPOSE({
  async x35ImgAdd(ctx, input) {
    const files = [...input.files]; input.value = ''; const C = IMGCTX[ctx]; if (!files.length) return;
    for (const f of files) {
      if ((C.get() || []).length >= 12) { toastMsg('Up to 12 images each'); break }
      try {
        toastMsg('Adding ' + (f.name || 'image') + '…');
        const r = await compress(f), id = uid(), ok = await imgPut(id, r.data);
        C.get().push({ id, name: (f.name || 'image').slice(0, 60), w: r.w, h: r.h });
        if (!ok && !IMG.warned) { IMG.warned = true; toastMsg('Saved on this device only. To sync images, add the Firestore rule from the setup steps.') }
      } catch (e) { console.warn(e); toastMsg('Could not read ' + (f.name || 'that file') + '. Try a JPG or PNG.') }
    }
    C.changed(); imgBoxRefresh(ctx)
  },
  x35ImgRemove(ctx, id) { IMGCTX[ctx].remove(id); imgBoxRefresh(ctx) },
  x35Light(id) { ensureModal(); const l = $('x35Light'); l.innerHTML = `<img data-img="${id}" alt="">`; l.classList.add('open') },
  x35LightClose() { const l = $('x35Light'); if (l) { l.classList.remove('open'); l.innerHTML = '' } }
});
safe('proj-images', () => {
  wrap('details', o => function (p) { return o.apply(this, arguments) + `<div class="section">Images</div><div id="x35box-proj">${imgBoxHTML('proj')}</div>` });
  wrap('closeDrawer', o => function () {
    const orphans = (currentId === null && drawer.classList.contains('open') && getDraft()) ? [...(getDraft().images || [])] : [];
    const r = o.apply(this, arguments); orphans.forEach(i => { if (!imgInUse(i.id)) imgDel(i.id) }); return r
  });
  wrap('deleteProject', o => function () {
    const ids = (projects.find(p => p.id === currentId) || {}).images || []; const n = projects.length;
    const r = o.apply(this, arguments); if (projects.length < n) ids.forEach(i => { if (!imgInUse(i.id)) imgDel(i.id) }); return r
  });
});

/* =====================================================================
   SHARED POPUP
   ===================================================================== */
let onClose = null;
function ensureModal() {
  if ($('x35Overlay')) return;
  $('app').insertAdjacentHTML('beforeend', '<div id="x35Overlay" class="daypanel-overlay" onclick="x35Close()"></div><div id="x35Panel" class="daypanel x35-panel"></div><div id="x35Light" class="x35-light" onclick="x35LightClose()"></div>')
}
function openPanel(html, closer) { ensureModal(); $('x35Panel').innerHTML = html; $('x35Overlay').classList.add('open'); $('x35Panel').classList.add('open'); onClose = closer || null; $('x35Panel').scrollTop = 0 }
EXPOSE({
  x35Close() { const o = $('x35Overlay'), p = $('x35Panel'); if (o) o.classList.remove('open'); if (p) p.classList.remove('open'); const c = onClose; onClose = null; if (c) c() }
});
D.addEventListener('keydown', e => { if (e.key !== 'Escape') return; const l = $('x35Light'); if (l && l.classList.contains('open')) { x35LightClose(); return } const p = $('x35Panel'); if (p && p.classList.contains('open')) x35Close() });
const panelHead = t => `<div class="daypanel-head"><h3>${esc(t)}</h3><button class="close" onclick="x35Close()" aria-label="Close">×</button></div>`;
const field = (label, inner) => `<div class="pf"><label class="pl">${label}</label>${inner}</div>`;
const selHTML = (opts, val, onch, cls, label) => `<select class="${cls || ''}" aria-label="${esc(label || '')}" onchange="${onch}">${opts.map(o => { const v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o; return `<option value="${esc(v)}"${v === val ? ' selected' : ''}>${esc(l)}</option>` }).join('')}</select>`;
const keepScroll = fn => { const y = W.scrollY; fn(); W.scrollTo(0, y) };
function linkItems(str) { return String(str || '').split(/[\n,]+/).map(s => s.trim()).filter(Boolean).map(s => { const url = /^[a-z][a-z0-9+.-]*:/i.test(s) ? s : 'https://' + s; let host = s; try { host = new URL(url).hostname.replace(/^www\./, '') } catch { } return { url, host } }) }
const linkChips = str => { const l = linkItems(str); return l.length ? `<div class="x35-chips">${l.map(k => `<a href="${esc(k.url)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">${esc(k.host)}</a>`).join('')}</div>` : '' };

/* =====================================================================
   IDEAS: New Idea popup (Title, Details, Links, Notes, Images)
   ===================================================================== */
let IDM = null;
safe('ideas', () => {
  EXPOSE({
    ideaCardsHTML() {
      const toks = ideaQuery.toLowerCase().split(/\s+/).filter(Boolean);
      const list = [...ideas].filter(i => !toks.length || toks.every(t => [i.title, i.body, i.notes, i.links].join(' ').toLowerCase().includes(t))).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.updated || 0) - (a.updated || 0));
      if (!list.length) return `<div class="ideas-empty">${ideas.length ? 'No ideas match your search.' : 'No ideas yet. Select + New Idea to add one.'}</div>`;
      return list.map(i => {
        const live = i.pid && projects.find(p => p.id === i.pid), done = i.pid && !live && archive.find(p => p.id === i.pid);
        const chip = live ? `<button type="button" class="ichip" onclick="event.stopPropagation();openProject('${i.pid}')">Now a project ›</button>` : (done ? '<span class="ichip">Project completed</span>' : '');
        const imgs = i.images || [], thumbs = imgs.length ? `<div class="idea-thumbs">${imgs.slice(0, 4).map(m => `<div class="x35-img"><img data-img="${m.id}" alt="${esc(m.name || '')}"></div>`).join('')}${imgs.length > 4 ? `<div class="idea-more">+${imgs.length - 4}</div>` : ''}</div>` : '';
        return `<div class="idea x35${i.pinned ? ' pinned' : ''}" data-id="${i.id}" onclick="x35IdeaOpen('${i.id}')"><div class="idea-title2">${esc(i.title || 'Untitled idea')}</div>${i.body ? `<div class="idea-body2">${esc(i.body)}</div>` : ''}${thumbs}${linkChips(i.links)}${i.notes ? `<div class="idea-notes2">${esc(i.notes)}</div>` : ''}<div class="idea-f"><span class="d">${esc(i.created ? dateLabel(i.created) : '')}</span>${chip}<button type="button" class="ibtn${i.pinned ? ' on' : ''}" onclick="event.stopPropagation();ideaPin('${i.id}')">${i.pinned ? 'Pinned' : 'Pin'}</button>${live ? '' : `<button type="button" class="ibtn" onclick="event.stopPropagation();ideaToProject('${i.id}')" title="Create a project from this idea">Make it a project</button>`}<button type="button" class="ibtn ic del" onclick="event.stopPropagation();ideaDelete('${i.id}')" title="Delete" aria-label="Delete"><svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button></div></div>`
      }).join('')
    },
    renderIdeas() {
      ideasView.innerHTML = `<div class="band purple"><div class="band-l"><h1>Ideas</h1><span class="band-sub">${ideas.length} idea${ideas.length === 1 ? '' : 's'}</span></div><div class="band-r"><input class="idea-search" id="ideaSearch" placeholder="Search ideas" value="${esc(ideaQuery)}" oninput="ideaSearch(this.value)"><button type="button" class="btn bprimary" onclick="x35IdeaNew()">+ New Idea</button></div></div><div class="ideas-grid" id="ideasGrid">${ideaCardsHTML()}</div>`
    },
    focusIdeaAdd() { x35IdeaNew() },
    ideaToProject(id) { const it = ideas.find(x => x.id === id); if (!it) return; newProject({ ideaId: id, prefill: { project: it.title || '', goal: [it.body, it.notes, it.links].filter(s => s && String(s).trim()).join('\n\n') } }) },
    x35IdeaNew() { IDM = { removed: [], origIds: [], saved: false, d: { id: uid(), title: '', body: '', links: '', notes: '', images: [], pinned: false, created: todayISO(), updated: Date.now(), pid: '' } }; ideaModal(true) },
    x35IdeaOpen(id) {
      const it = ideas.find(x => x.id === id); if (!it) return;
      const d = structuredClone(it); d.images = Array.isArray(d.images) ? d.images : []; d.links = d.links || ''; d.notes = d.notes || ''; d.body = d.body || '';
      IDM = { removed: [], origIds: d.images.map(i => i.id), saved: false, d }; ideaModal(false)
    },
    x35IdeaSet(k, v) { if (IDM) IDM.d[k] = v },
    x35IdeaSave() {
      const d = IDM.d; if (!d.title.trim()) { toastMsg('Add a title'); const t = $('x35It'); if (t) t.focus(); return }
      d.title = d.title.trim(); d.updated = Date.now();
      const i = ideas.findIndex(x => x.id === d.id); if (i >= 0) ideas[i] = d; else ideas.unshift(d);
      IDM.removed.forEach(id => { if (!imgInUse(id)) imgDel(id) });
      IDM.saved = true; persistNotes(); x35Close(); render(); toastMsg('Idea saved')
    },
    x35IdeaDel() { if (!IDM) return; const id = IDM.d.id; IDM.saved = true; x35Close(); ideaDelete(id) }
  });
  function ideaModal(isNew) {
    const d = IDM.d;
    openPanel(`${panelHead(isNew ? 'New idea' : 'Idea')}<div class="wp-modal-body">
${field('Title', `<input type="text" id="x35It" value="${esc(d.title)}" placeholder="What is the idea?" oninput="x35IdeaSet('title',this.value)" onkeydown="if(event.key==='Enter'){event.preventDefault();x35IdeaSave()}">`)}
${field('Details', `<textarea rows="5" placeholder="Describe it" oninput="x35IdeaSet('body',this.value)">${esc(d.body)}</textarea>`)}
${field('Links', `<textarea rows="2" placeholder="One link per line" oninput="x35IdeaSet('links',this.value)">${esc(d.links)}</textarea>`)}
${field('Notes', `<textarea rows="3" placeholder="Anything to remember" oninput="x35IdeaSet('notes',this.value)">${esc(d.notes)}</textarea>`)}
${field('Images', `<div id="x35box-idea">${imgBoxHTML('idea')}</div>`)}
<div class="wp-modal-actions">${isNew ? '<span></span>' : '<button type="button" class="btn danger" onclick="x35IdeaDel()">Delete</button>'}<span style="display:flex;gap:8px"><button type="button" class="btn light" onclick="x35Close()">Cancel</button><button type="button" class="btn solid" onclick="x35IdeaSave()">Save idea</button></span></div></div>`,
      () => { if (IDM && !IDM.saved) { IDM.d.images.forEach(i => { if (!IDM.origIds.includes(i.id) && !imgInUse(i.id)) imgDel(i.id) }) } IDM = null });
    setTimeout(() => { const t = $('x35It'); if (t && isNew) t.focus() }, 40)
  }
});

/* =====================================================================
   CAMPAIGNS
   ===================================================================== */
const CMP_STATUS = [['Active', 'Active'], ['Between Runs', 'Between Runs'], ['Potential', 'Potential']];
const CMP_COL = { 'Active': '#1c8a4a', 'Between Runs': '#0071BF', 'Potential': '#7900bb' };
const CMP_EMPTY = { 'Active': 'No active campaigns. Drag one here, or add a new campaign.', 'Between Runs': 'Nothing resting. Campaigns that are out of season and come back later live here.', 'Potential': 'No potential campaigns yet. Park ideas here until you decide to run them.' };
let CMP = null, cmpDrag = null;
const cmpById = id => X().campaigns.find(c => c.id === id);
const cmpCollapsed = () => LS('jpdCmpCol', {});
function cmpCard(c) {
  const col = CMP_COL[c.status] || '#134a8e', pr = spPri(c.priority);
  const nd = c.nextDate ? dueState(c.nextDate) : '', pc = nd === 'overdue' ? ' overdue' : nd === 'today' ? ' today' : '';
  const next = c.status === 'Potential' ? '' : `<div class="cnext2"><span class="nlabel">Next content</span><div class="nbody">${c.nextContent || c.nextDate ? `<div class="nrow">${c.nextDate ? `<span class="npill${pc}">${dateLabel(c.nextDate)}</span>` : '<span class="npill">No date</span>'}</div><div class="nname"><span class="elbow"></span><span>${esc(c.nextContent || 'Not set')}</span></div>` : '<div class="empty-n">Nothing planned yet</div>'}</div></div>`;
  return `<div class="card-shell x35c" data-cmp="${c.id}" style="--cardAccent:${col}" draggable="true" ondragstart="x35CmpDragStart(event,'${c.id}')" ondragend="x35CmpDragEnd()"><div class="card-inner"><article class="card card-face" onclick="x35CmpOpen('${c.id}')"><div class="card-bar"></div><div class="card-main">
<div class="ctop">${pr ? `<span class="x35-sp" style="--c:${pr.color}">${pr.n} · ${esc(pr.short)}</span>` : '<span class="x35-sp none">No strategic priority</span>'}</div>
<h3 class="card-name" title="${esc(c.name || '')}">${esc(c.name || 'Untitled campaign')}</h3><div class="cdiv"></div>
<div class="cdates">${c.runDate ? `<div class="cd crun"><span>Run date</span> <b>${dateLabel(c.runDate)}</b></div>` : '<div class="cd unset"><span>Run date</span> <b>—</b></div>'}</div>${next}
<div class="foot"><button class="btn flip" onclick="event.stopPropagation();x35CmpOpen('${c.id}')">Edit</button>${c.status === 'Active' && (c.nextContent || c.nextDate) ? `<button class="btn mark" onclick="event.stopPropagation();x35CmpDone('${c.id}')">Content done</button>` : ''}</div></div></article></div></div>`
}
function renderCampaigns() {
  const list = X().campaigns, col = cmpCollapsed();
  const keep = {}; D.querySelectorAll('#campaignsView .lane-track').forEach(t => { keep[t.dataset.s] = t.scrollLeft });
  const lanes = CMP_STATUS.map(([s, label]) => {
    const rows = list.filter(c => c.status === s).sort((a, b) => (a.nextDate || '9999').localeCompare(b.nextDate || '9999') || (a.name || '').localeCompare(b.name || '')), color = CMP_COL[s], c = !!col[s];
    return `<section class="lane${c ? ' collapsed' : ''}" data-s="${esc(s)}" style="--lc:${color};--lg:${headerGradient(color)}" ondragover="laneDragOver(event,this)" ondragleave="laneDragLeave(event,this)" ondrop="x35CmpDrop(event,this.dataset.s)"><div class="lane-head" onclick="x35CmpToggle(this.parentNode.dataset.s)" title="${c ? 'Show' : 'Hide'} this section"><span class="chev">▾</span><span class="nm">${esc(label.toUpperCase())}</span><span class="cnt">${rows.length}</span><span class="arrows" onclick="event.stopPropagation()"><button type="button" aria-label="Scroll left" onclick="x35LaneScroll(this,-1)">‹</button><button type="button" aria-label="Scroll right" onclick="x35LaneScroll(this,1)">›</button></span></div><div class="lane-track" data-s="${esc(s)}" onscroll="laneScrolled(this)">${rows.map(cmpCard).join('') || `<div class="lane-empty">${CMP_EMPTY[s]}</div>`}</div></section>`
  }).join('');
  $('campaignsView').innerHTML = `<div class="band orange"><div class="band-l"><h1>Campaigns</h1><span class="band-sub">${list.filter(c => c.status === 'Active').length} active · ${list.length} total</span></div><div class="band-r"><button type="button" class="btn bprimary" onclick="x35CmpNew()">+ New Campaign</button></div></div><div class="lanes">${lanes}</div>`;
  D.querySelectorAll('#campaignsView .lane-track').forEach(t => { if (keep[t.dataset.s]) t.scrollLeft = keep[t.dataset.s] });
  updateLaneArrows(); fitRows()
}
function cmpModal(isNew) {
  const d = CMP.d;
  const segs = CMP_STATUS.map(([s, l]) => `<button type="button" class="seg-btn s${d.status === s ? ' on' : ''}" style="--sc:${CMP_COL[s]}" onclick="x35CmpSet('status','${s}');x35CmpSegs()">${l}</button>`).join('');
  openPanel(`${panelHead(isNew ? 'New campaign' : 'Campaign')}<div class="wp-modal-body">
${field('Campaign name', `<input type="text" id="x35Cn" value="${esc(d.name)}" placeholder="e.g. Holiday Train" oninput="x35CmpSet('name',this.value)" onkeydown="if(event.key==='Enter'){event.preventDefault();x35CmpSave()}">`)}
${field('Status', `<div class="seg" id="x35CmpSegs">${segs}</div><div class="x35-note">Active = running or being planned now. Between Runs = out of season, comes back later. Potential = an idea you may run.</div>`)}
<div class="prow">${field('Strategic priority', `<select onchange="x35CmpSet('priority',this.value)"><option value="">Not linked</option>${SP.map(p => `<option value="${p.id}"${d.priority === p.id ? ' selected' : ''}>${p.n}. ${esc(p.short)}</option>`).join('')}</select>`)}
${field('Run date', dateInput({ value: d.runDate || '', cb: "x35CmpSet('runDate',v)", title: 'Run date' }))}</div>
<div class="prow">${field('Next content', `<input type="text" value="${esc(d.nextContent)}" placeholder="e.g. Day-before reminder post" oninput="x35CmpSet('nextContent',this.value)">`)}
${field('Next date', dateInput({ value: d.nextDate || '', cb: "x35CmpSet('nextDate',v)", title: 'Next date' }))}</div>
${field('Goal / description', `<textarea rows="3" placeholder="What is this campaign for?" oninput="x35CmpSet('goal',this.value)">${esc(d.goal)}</textarea>`)}
${field('Plan and notes', `<textarea rows="5" placeholder="Content ideas, timing, reminders" oninput="x35CmpSet('notes',this.value)">${esc(d.notes)}</textarea>`)}
<p class="x35-note" style="margin:0">While a campaign is Active, its Next date shows in Coming Up and on the Calendar until you mark the content done.</p>
<div class="wp-modal-actions">${isNew ? '<span></span>' : '<button type="button" class="btn danger" onclick="x35CmpDel()">Delete</button>'}<span style="display:flex;gap:8px"><button type="button" class="btn light" onclick="x35Close()">Cancel</button><button type="button" class="btn solid" onclick="x35CmpSave()">Save campaign</button></span></div></div>`, () => { CMP = null });
  setTimeout(() => { const t = $('x35Cn'); if (t && isNew) t.focus() }, 40)
}
EXPOSE({
  x35CmpToggle(name) { const c = cmpCollapsed(); if (c[name]) delete c[name]; else c[name] = 1; LSset('jpdCmpCol', c); renderCampaigns() },
  x35LaneScroll(btn, dir) { const t = btn.closest('.lane').querySelector('.lane-track'); if (t) t.scrollBy({ left: dir * Math.max(320, t.clientWidth * .8), behavior: 'smooth' }) },
  x35CmpDragStart(e, id) { cmpDrag = id; try { e.dataTransfer.setData('text/plain', id) } catch (_) { } },
  x35CmpDragEnd() { cmpDrag = null; D.querySelectorAll('#campaignsView .lane.over').forEach(l => l.classList.remove('over')) },
  x35CmpDrop(e, status) { e.preventDefault(); D.querySelectorAll('#campaignsView .lane.over').forEach(l => l.classList.remove('over')); const c = cmpDrag && cmpById(cmpDrag); cmpDrag = null; if (!c || c.status === status) return; c.status = status; saveX(); renderCampaigns(); toastMsg('Moved to ' + status) },
  x35CmpNew() { CMP = { d: { id: uid(), name: '', status: 'Active', priority: '', runDate: '', nextContent: '', nextDate: '', goal: '', notes: '', created: todayISO() }, isNew: true }; cmpModal(true) },
  x35CmpOpen(id) { const c = cmpById(id); if (!c) return; CMP = { d: structuredClone(c), isNew: false }; cmpModal(false) },
  x35CmpSet(k, v) { if (CMP) CMP.d[k] = v },
  x35CmpSegs() { const b = $('x35CmpSegs'); if (!b || !CMP) return; b.querySelectorAll('.seg-btn').forEach((x, i) => x.classList.toggle('on', CMP_STATUS[i][0] === CMP.d.status)) },
  x35CmpSave() {
    const d = CMP.d; if (!d.name.trim()) { toastMsg('Add a campaign name'); const t = $('x35Cn'); if (t) t.focus(); return }
    d.name = d.name.trim(); const l = X().campaigns, i = l.findIndex(x => x.id === d.id); if (i >= 0) l[i] = d; else l.push(d);
    saveX(); x35Close(); render(); toastMsg('Campaign saved')
  },
  x35CmpDel() { if (!CMP) return; const c = cmpById(CMP.d.id); if (!c || !confirm('Delete "' + (c.name || 'this campaign') + '"?')) return; const copy = structuredClone(c); X().campaigns = X().campaigns.filter(x => x.id !== c.id); saveX(); x35Close(); render(); toastMsg('Campaign deleted', { label: 'Undo', fn: () => { X().campaigns.push(copy); saveX(); render() } }) },
  x35CmpDone(id) {
    const c = cmpById(id); if (!c) return; const old = { nextContent: c.nextContent, nextDate: c.nextDate };
    c.nextContent = ''; c.nextDate = ''; saveX(); render();
    toastMsg('Done: ' + (c.name || 'campaign') + '. Set the next content when you know it.', { label: 'Undo', fn: () => { Object.assign(c, old); saveX(); render() } })
  }
});

/* =====================================================================
   REPORTING (completed projects, with a date range)
   ===================================================================== */
const RPT = Object.assign({ range: 'month', from: '', to: '', q: '', hideRec: false, open: {} }, LS('jpdRpt', {}));
RPT.q = ''; RPT.open = {};
const RPT_RANGES = [['month', 'This month'], ['lastmonth', 'Last month'], ['quarter', 'This quarter'], ['lastquarter', 'Last quarter'], ['ytd', 'Year to date'], ['last12', 'Last 12 months'], ['all', 'All time'], ['custom', 'Custom dates']];
function rptBounds() {
  const t = new Date(), y = t.getFullYear(), m = t.getMonth(), q = Math.floor(m / 3), I = isoOf;
  switch (RPT.range) {
    case 'month': return [I(new Date(y, m, 1)), I(new Date(y, m + 1, 0))];
    case 'lastmonth': return [I(new Date(y, m - 1, 1)), I(new Date(y, m, 0))];
    case 'quarter': return [I(new Date(y, q * 3, 1)), I(new Date(y, q * 3 + 3, 0))];
    case 'lastquarter': return [I(new Date(y, q * 3 - 3, 1)), I(new Date(y, q * 3, 0))];
    case 'ytd': return [I(new Date(y, 0, 1)), todayISO()];
    case 'last12': return [addMonths(todayISO(), -12), todayISO()];
    case 'custom': return [RPT.from || '', RPT.to || ''];
    default: return ['', '']
  }
}
function rptList() {
  const [a, b] = rptBounds(), toks = RPT.q.toLowerCase().split(/\s+/).filter(Boolean);
  return archive.filter(p => { const d = p.dateCompleted || ''; if (!d) return false; if (a && d < a) return false; if (b && d > b) return false; if (RPT.hideRec && isRepeating(p)) return false; return !toks.length || toks.every(t => [p.project, p.requestor, p.workType, p.department, p.goal, p.notes, (p.channels || []).join(' ')].join(' ').toLowerCase().includes(t)) })
    .sort((x, y) => (y.dateCompleted || '').localeCompare(x.dateCompleted || '') || (y.archivedAt || 0) - (x.archivedAt || 0))
}
const rptCounts = p => `${(p.tasks || []).filter(t => t.complete).length}/${(p.tasks || []).length} checklist items · ${(p.socialPosts || []).length} social post${(p.socialPosts || []).length === 1 ? '' : 's'} · ${(p.advertisingPosts || []).length} ad${(p.advertisingPosts || []).length === 1 ? '' : 's'}`;
function rptRow(p) {
  const open = !!RPT.open[p.id], col = bucketColor(p.bucket) || '#1c8a4a';
  const chips = [p.workType ? `<span class="mchip">${esc(p.workType)}</span>` : '', p.requestor ? `<span class="mchip">${esc(p.requestor)}</span>` : '', ...(p.channels || []).map(c => `<span class="mchip ch" style="--c:#475569">${esc(c)}</span>`)].join('');
  const body = open ? `<div class="rpt-b">
<div><h4>Description</h4><p>${esc(p.goal || 'None recorded')}</p>${p.notes && p.notes !== 'No Notes' ? `<h4 style="margin-top:10px">Notes</h4><p>${esc(p.notes)}</p>` : ''}</div>
<div><h4>Dates</h4><p>${[p.draftDate ? 'Draft Date: ' + dateLabel(p.draftDate, true) : '', p.campaignLaunch ? 'Public Launch Date: ' + dateLabel(p.campaignLaunch, true) : '', p.deadline ? 'End Date: ' + dateLabel(p.deadline, true) : '', 'Completed: ' + dateLabel(p.dateCompleted, true)].filter(Boolean).join('\n')}</p></div>
${(p.socialPosts || []).length ? `<div><h4>Social posts</h4><ul>${p.socialPosts.map(s => `<li>${esc(s.title || 'Post')}${s.date ? ' · ' + dateLabel(s.date) : ''} · ${esc(s.status || '')}</li>`).join('')}</ul></div>` : ''}
${(p.advertisingPosts || []).length ? `<div><h4>Advertising</h4><ul>${p.advertisingPosts.map(a => `<li>${esc(a.title || a.platform || 'Ad')}${a.runDate ? ' · ran ' + dateLabel(a.runDate) : (a.bookingDeadline ? ' · ' + dateLabel(a.bookingDeadline) : '')} · ${esc(a.status || '')}</li>`).join('')}</ul></div>` : ''}
<div class="rpt-act"><button type="button" class="btn small solid" onclick="restoreFromArchive('${p.id}')" title="Put it back on the board exactly as it was">Restore</button><button type="button" class="btn small outline" onclick="copyFromArchive('${p.id}')" title="Start a fresh copy with the dates cleared">Restore as copy</button><button type="button" class="btn small danger" onclick="deleteFromArchive('${p.id}')">Delete</button></div></div>` : '';
  return `<div class="rpt-row" style="--c:${col}"><div class="rpt-h" onclick="x35RptOpen('${p.id}')"><div class="rpt-main"><div class="rpt-t">${esc(displayName(p.project))}</div><div class="rpt-m">${chips}<span class="mchip none">${esc(rptCounts(p))}</span></div></div><span class="rpt-date">✓ ${dateLabel(p.dateCompleted, true)}</span><button type="button" class="pexp" aria-label="${open ? 'Hide' : 'Show'} details" onclick="event.stopPropagation();x35RptOpen('${p.id}')">${open ? '▲' : '▼'}</button></div>${body}</div>`
}
function renderReporting() {
  const list = rptList(), [a, b] = rptBounds();
  const types = {}; list.forEach(p => { const k = p.workType || 'Other'; types[k] = (types[k] || 0) + 1 });
  const months = []; list.forEach(p => { const k = (p.dateCompleted || '').slice(0, 7); let g = months.find(m => m.k === k); if (!g) { g = { k, items: [] }; months.push(g) } g.items.push(p) });
  const range = a || b ? `${a ? dateLabel(a, true) : 'the beginning'} to ${b ? dateLabel(b, true) : 'today'}` : 'all time';
  const sel = `<select aria-label="Time span" onchange="x35RptRange(this.value)">${RPT_RANGES.map(([v, l]) => `<option value="${v}"${RPT.range === v ? ' selected' : ''}>${l}</option>`).join('')}</select>`;
  const custom = RPT.range === 'custom' ? `<span class="band-sub">From</span>${dateInput({ value: RPT.from, cb: "x35RptDate('from',v)", title: 'From' })}<span class="band-sub">to</span>${dateInput({ value: RPT.to, cb: "x35RptDate('to',v)", title: 'To' })}` : '';
  $('reportingView').innerHTML = `<div class="band green"><div class="band-l"><h1>Reporting</h1><span class="band-sub">${list.length} completed · ${esc(range)}</span></div><div class="band-r">${sel}${custom}<button type="button" class="btn bghost" onclick="x35RptCsv()" title="Download this list as a spreadsheet file">⬇ Download CSV</button></div></div>
<div class="rpt-bar"><input type="text" id="rptQ" placeholder="Search completed projects" value="${esc(RPT.q)}" oninput="x35RptSearch(this.value)"><label class="field-toggle"><input type="checkbox" ${RPT.hideRec ? 'checked' : ''} onchange="x35RptRec(this.checked)">Hide repeating items (weekly ads, scripts)</label></div>
<div class="rpt-chips" id="rptChips">${Object.entries(types).sort((x, y) => y[1] - x[1]).map(([k, n]) => `<span class="rpt-chip">${esc(k)} <b>${n}</b></span>`).join('')}</div>
<div id="rptList">${months.map(g => `<div class="rpt-month">${esc(new Date(g.k + '-01T00:00:00').toLocaleDateString('en-CA', { month: 'long', year: 'numeric' }))}<small>${g.items.length} completed</small></div>${g.items.map(rptRow).join('')}`).join('') || `<div class="x35-empty">${archive.length ? 'Nothing was completed in this time span.' : 'Nothing here yet. Projects you mark complete show up here.'}</div>`}</div>`
}
const rptRefresh = () => { LSset('jpdRpt', { range: RPT.range, from: RPT.from, to: RPT.to, hideRec: RPT.hideRec }); renderReporting() };
EXPOSE({
  x35RptRange(v) { RPT.range = v; rptRefresh() },
  x35RptDate(k, v) { RPT[k] = v; rptRefresh() },
  x35RptRec(v) { RPT.hideRec = !!v; rptRefresh() },
  x35RptSearch(v) { RPT.q = v; const keep = D.activeElement; renderReporting(); const i = $('rptQ'); if (i && keep && keep.id === 'rptQ') { i.focus(); i.setSelectionRange(v.length, v.length) } },
  x35RptOpen(id) { RPT.open[id] = !RPT.open[id]; keepScroll(renderReporting) },
  x35RptCsv() {
    const q = s => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
    const rows = [['Project', 'Completed', 'Work Type', 'Requestor', 'Department', 'Channels', 'Bucket', 'Draft Date', 'Public Launch Date', 'End Date', 'Social posts', 'Ads']].concat(rptList().map(p => [displayName(p.project), p.dateCompleted, p.workType, p.requestor, p.department, (p.channels || []).join('; '), p.bucket, p.draftDate, p.campaignLaunch, p.deadline, (p.socialPosts || []).length, (p.advertisingPosts || []).length]));
    const a = D.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + rows.map(r => r.map(q).join(',')).join('\r\n')], { type: 'text/csv' })); a.download = 'Completed projects.csv'; a.click(); toastMsg('CSV downloaded')
  },
  openArchive() { RPT.range = 'all'; RPT.q = ''; setView('reporting') },
  renderArchive() { RPT.q = archiveQuery || ''; if (view === 'reporting') renderReporting() }
});

/* =====================================================================
   STRATEGIC PLAN
   ===================================================================== */
const SP_STATUS = ['Idea', 'Planned', 'In Progress', 'Implemented', 'Parked'];
const SP_TIMING = ['Anytime', 'Q1', 'Q2', 'Q3', 'Q4', 'TBD'];
const SPV = Object.assign({ view: 'full', pri: '', st: '', tm: '', arch: false }, LS('jpdSp', {}));
const spCollapsed = () => LS('jpdSpCol', {});
const spIdeas = () => X().strategic.ideas;
const spIdea = id => spIdeas().find(i => i.id === id);
const stCls = s => String(s).replace(/\s+/g, '');
const spShow = i => (SPV.arch || !i.archived) && (!SPV.st || i.status === SPV.st) && (!SPV.tm || i.timing === SPV.tm);
function spLinkInfo(i) {
  if (!i.linkType || !i.linkId) return null;
  if (i.linkType === 'campaign') { const c = cmpById(i.linkId); return { label: c ? c.name : 'Campaign (deleted)', kind: 'Campaign' } }
  const p = projects.find(x => x.id === i.linkId); if (p) return { label: displayName(p.project), kind: 'Project' };
  const a = archive.find(x => x.id === i.linkId); return a ? { label: displayName(a.project) + ' (completed)', kind: 'Project' } : { label: 'Project (removed)', kind: 'Project' }
}
function spiRow(i, tag) {
  const lk = spLinkInfo(i);
  return `<div class="spi${i.archived ? ' arch' : ''}" data-id="${i.id}"><div class="spi-main"><button type="button" class="spi-name" onclick="x35SpEdit('${i.id}')">${esc(i.name)}</button>${tag ? `<span class="spi-tag">${esc(tag)}</span>` : ''}${i.archived ? '<span class="spi-tag">Archived</span>' : ''}${i.notes ? `<div class="spi-notes">${esc(i.notes)}</div>` : ''}${lk ? `<button type="button" class="spi-link" onclick="x35SpGo('${i.id}')" title="Open it">${lk.kind}: ${esc(lk.label)} ›</button>` : ''}</div><div class="spi-ctl">${selHTML(SP_STATUS, i.status, `x35SpField('${i.id}','status',this.value)`, 'spi-sel st-' + stCls(i.status), 'Status')}${selHTML(SP_TIMING, i.timing, `x35SpField('${i.id}','timing',this.value)`, 'spi-sel tm', 'Target timing')}<button type="button" class="ibtn" onclick="x35SpEdit('${i.id}')">Edit</button>${i.archived ? `<button type="button" class="ibtn" onclick="x35SpArchive('${i.id}',false)">Restore</button>` : `<button type="button" class="ibtn" onclick="x35SpArchive('${i.id}',true)" title="Hide it without deleting">Archive</button>`}<button type="button" class="ibtn del" onclick="x35SpDel('${i.id}')">Delete</button></div></div>`
}
const addBtn = (pid, cid) => `<button type="button" class="btn small plan-add" onclick="x35SpAdd('${pid}','${cid}')">+ Add Idea</button>`;
function spFilters() {
  return `<div class="x35-fil"><label>Strategic priority<select onchange="x35SpFilter('pri',this.value)"><option value="">All priorities</option>${SP.map(p => `<option value="${p.id}"${SPV.pri === p.id ? ' selected' : ''}>${p.n}. ${esc(p.short)}</option>`).join('')}</select></label><label>Status<select onchange="x35SpFilter('st',this.value)"><option value="">All statuses</option>${SP_STATUS.map(s => `<option${SPV.st === s ? ' selected' : ''}>${s}</option>`).join('')}</select></label><label>Quarter / timing<select onchange="x35SpFilter('tm',this.value)"><option value="">Any timing</option>${SP_TIMING.map(s => `<option${SPV.tm === s ? ' selected' : ''}>${s}</option>`).join('')}</select></label><label class="chk"><input type="checkbox" ${SPV.arch ? 'checked' : ''} onchange="x35SpFilter('arch',this.checked)">Show archived ideas</label>${SPV.pri || SPV.st || SPV.tm ? '<button type="button" class="btn small light" style="margin-top:16px" onclick="x35SpClear()">Clear filters</button>' : ''}</div>`
}
function spFull() {
  const col = spCollapsed(), all = spIdeas().filter(spShow);
  return SP.filter(p => !SPV.pri || p.id === SPV.pri).map(p => {
    const mine = all.filter(i => i.pid === p.id), c = !!col[p.id];
    const gen = mine.filter(i => !i.cid);
    return `<section class="spb${c ? ' collapsed' : ''}" data-p="${p.id}" style="--c:${p.color}"><div class="spb-h" onclick="x35SpToggle('${p.id}')" title="${c ? 'Show' : 'Hide'} this priority"><span class="chev">▾</span><span class="spb-n">${String(p.n).padStart(2, '0')}</span><span class="spb-t">${esc(p.title)}</span><span class="ct">${mine.length} idea${mine.length === 1 ? '' : 's'}</span></div><div class="spb-b">
${p.commits.map(cm => { const r = mine.filter(i => i.cid === cm.id); return `<div class="spc"><div class="spc-t">${esc(cm.text)}</div><div class="spc-l">My Implementation Ideas</div><div class="spc-ideas">${r.map(i => spiRow(i)).join('') || '<div class="spc-empty">No ideas yet.</div>'}</div><div class="spc-add">${addBtn(p.id, cm.id)}</div></div>` }).join('')}
<div class="spc gen"><div class="spc-t">General ideas for this priority</div><div class="spc-l" style="margin-left:0">Ideas that support the priority as a whole</div><div class="spc-ideas" style="margin-left:0">${gen.map(i => spiRow(i)).join('') || '<div class="spc-empty">No general ideas yet.</div>'}</div><div class="spc-add" style="margin-left:0">${addBtn(p.id, '')}</div></div></div></section>`
  }).join('')
}
function spMine() {
  const all = spIdeas().filter(spShow), groups = SP.filter(p => !SPV.pri || p.id === SPV.pri).map(p => ({ p, items: all.filter(i => i.pid === p.id) })).filter(g => g.items.length);
  if (!groups.length) return `<div class="x35-empty">${spIdeas().length ? 'No ideas match these filters.' : 'No implementation ideas yet. Switch to Full Plan and use + Add Idea under any strategic commitment.'}</div>`;
  return groups.map(({ p, items }) => `<section class="spx-group" style="--c:${p.color}"><div class="spb-h"><span class="spb-n">${String(p.n).padStart(2, '0')}</span><span class="spb-t">${esc(p.title)}</span><span class="ct">${items.length}</span></div><div class="spx-body">${items.map(i => { const cm = i.cid && spCommit(i.cid); return spiRow(i, cm ? 'Commitment ' + (p.commits.findIndex(x => x.id === i.cid) + 1) : 'General') }).join('')}<div>${addBtn(p.id, '')}</div></div></section>`).join('')
}
function renderStrategic() {
  const seg = [['full', 'Full Plan'], ['mine', 'My Implementation']].map(([k, l]) => `<button type="button" class="${SPV.view === k ? 'on' : ''}" onclick="x35SpView('${k}')">${l}</button>`).join('');
  $('strategicView').innerHTML = `<div class="band navy2"><div class="band-l"><h1>Strategic Plan</h1><span class="band-sub">How I will put the Communications Strategic Plan into action</span></div><div class="band-r"><div class="seg-row">${seg}</div></div></div>${spFilters()}${SPV.view === 'mine' ? spMine() : spFull()}`
}
const spRefresh = () => { LSset('jpdSp', { view: SPV.view, pri: SPV.pri, st: SPV.st, tm: SPV.tm, arch: SPV.arch }); keepScroll(renderStrategic) };
let SPM = null, lastSpDel = null;
function spModal() {
  const d = SPM.d, locOpts = SP.map(p => `<optgroup label="${p.n}. ${esc(p.short)}"><option value="${p.id}|"${d.pid === p.id && !d.cid ? ' selected' : ''}>General idea for this priority</option>${p.commits.map((c, k) => `<option value="${p.id}|${c.id}"${d.cid === c.id ? ' selected' : ''}>Commitment ${k + 1}: ${esc(c.text.length > 80 ? c.text.slice(0, 78) + '…' : c.text)}</option>`).join('')}</optgroup>`).join('');
  const linkOpts = `<option value="">Not linked</option><optgroup label="Projects">${projects.filter(p => p.status !== 'Complete').sort((a, b) => (a.project || '').localeCompare(b.project || '')).map(p => `<option value="project:${p.id}"${d.linkType === 'project' && d.linkId === p.id ? ' selected' : ''}>${esc(displayName(p.project))}</option>`).join('')}</optgroup><optgroup label="Campaigns">${X().campaigns.map(c => `<option value="campaign:${c.id}"${d.linkType === 'campaign' && d.linkId === c.id ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</optgroup>`;
  openPanel(`${panelHead(SPM.isNew ? 'Add implementation idea' : 'Edit implementation idea')}<div class="wp-modal-body">
${field('Idea name', `<input type="text" id="x35Sn" value="${esc(d.name)}" placeholder="What will you do?" oninput="x35SpSet('name',this.value)" onkeydown="if(event.key==='Enter'){event.preventDefault();x35SpSave()}">`)}
${field('Notes (optional)', `<textarea rows="3" oninput="x35SpSet('notes',this.value)">${esc(d.notes)}</textarea>`)}
<div class="prow">${field('Status', selHTML(SP_STATUS, d.status, "x35SpSet('status',this.value)"))}${field('Target timing (optional)', selHTML(SP_TIMING, d.timing, "x35SpSet('timing',this.value)"))}</div>
${field('Where it belongs', `<select onchange="x35SpLoc(this.value)">${locOpts}</select><div class="x35-note">Put it in the wrong spot? Pick the right commitment here and save.</div>`)}
${field('Linked project or campaign (optional)', `<select onchange="x35SpLink(this.value)">${linkOpts}</select><div class="x35-note">This only adds a reference. It does not create or change anything in Projects or Campaigns.</div>`)}
<div class="wp-modal-actions">${SPM.isNew ? '<span></span>' : '<span style="display:flex;gap:8px"><button type="button" class="btn danger" onclick="x35SpDel(\'' + d.id + '\',true)">Delete</button><button type="button" class="btn light" onclick="x35SpArchive(\'' + d.id + '\',' + (d.archived ? 'false' : 'true') + ',true)">' + (d.archived ? 'Restore' : 'Archive') + '</button></span>'}<span style="display:flex;gap:8px"><button type="button" class="btn light" onclick="x35Close()">Cancel</button><button type="button" class="btn solid" onclick="x35SpSave()">${SPM.isNew ? 'Add idea' : 'Save'}</button></span></div></div>`, () => { SPM = null });
  setTimeout(() => { const t = $('x35Sn'); if (t && SPM && SPM.isNew) t.focus() }, 40)
}
EXPOSE({
  x35SpView(v) { SPV.view = v; spRefresh() },
  x35SpFilter(k, v) { SPV[k] = v; spRefresh() },
  x35SpClear() { SPV.pri = ''; SPV.st = ''; SPV.tm = ''; spRefresh() },
  x35SpToggle(id) { const c = spCollapsed(); if (c[id]) delete c[id]; else c[id] = 1; LSset('jpdSpCol', c); keepScroll(renderStrategic) },
  x35SpAdd(pid, cid) { SPM = { isNew: true, d: { id: uid(), name: '', notes: '', status: 'Idea', timing: 'TBD', pid, cid: cid || '', linkType: '', linkId: '', archived: false, created: todayISO(), updated: Date.now() } }; spModal() },
  x35SpEdit(id) { const i = spIdea(id); if (!i) return; SPM = { isNew: false, d: structuredClone(i) }; spModal() },
  x35SpSet(k, v) { if (SPM) SPM.d[k] = v },
  x35SpLoc(v) { const [p, c] = v.split('|'); SPM.d.pid = p; SPM.d.cid = c || '' },
  x35SpLink(v) { const [t, id] = v ? v.split(':') : ['', '']; SPM.d.linkType = t; SPM.d.linkId = id },
  x35SpSave() {
    const d = SPM.d; if (!d.name.trim()) { toastMsg('Give the idea a name'); const t = $('x35Sn'); if (t) t.focus(); return }
    const wasNew = SPM.isNew;
    d.name = d.name.trim(); d.updated = Date.now(); const l = spIdeas(), i = l.findIndex(x => x.id === d.id); if (i >= 0) l[i] = d; else l.push(d);
    saveX(); x35Close(); render(); toastMsg(wasNew ? 'Idea added' : 'Idea saved')
  },
  x35SpField(id, k, v) { const i = spIdea(id); if (!i) return; i[k] = v; i.updated = Date.now(); saveX(); keepScroll(renderStrategic) },
  x35SpArchive(id, flag, fromModal) { const i = spIdea(id); if (!i) return; i.archived = !!flag; saveX(); if (fromModal) x35Close(); keepScroll(renderStrategic); toastMsg(flag ? 'Archived. Turn on "Show archived ideas" to see it.' : 'Restored', flag ? { label: 'Undo', fn: () => { i.archived = false; saveX(); keepScroll(renderStrategic) } } : undefined) },
  x35SpDel(id, fromModal) {
    const i = spIdea(id); if (!i) return; if (!confirm('Delete "' + i.name + '"? (Archive hides it without deleting.)')) return;
    const copy = structuredClone(i); X().strategic.ideas = spIdeas().filter(x => x.id !== id); saveX(); if (fromModal) x35Close(); keepScroll(renderStrategic);
    toastMsg('Idea deleted', { label: 'Undo', fn: () => { spIdeas().push(copy); saveX(); keepScroll(renderStrategic) } })
  },
  x35SpGo(id) {
    const i = spIdea(id); if (!i) return;
    if (i.linkType === 'campaign') { setView('campaigns'); x35CmpOpen(i.linkId) }
    else if (projects.some(p => p.id === i.linkId)) openProject(i.linkId)
    else { const a = archive.find(x => x.id === i.linkId); if (a) { RPT.range = 'all'; RPT.q = a.project || ''; setView('reporting') } else toastMsg('That project is no longer here') }
  }
});

/* =====================================================================
   NAVIGATION AND WIRING
   ===================================================================== */
safe('nav', () => {
  const SV = {
    campaigns: '<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15 9a4 4 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/>',
    reporting: '<path d="M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8.5 9l1.5 1.5L13 7.5M8.5 15h7"/>',
    strategic: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>'
  };
  const NAME = { campaigns: 'Campaigns', reporting: 'Reporting', strategic: 'Strategic Plan' };
  const btn = k => `<button type="button" class="nb" id="nb-${k}" data-v="${k}" data-tip="${NAME[k]}" aria-label="${NAME[k]}" onclick="setView('${k}')"><svg viewBox="0 0 24 24" aria-hidden="true">${SV[k]}</svg></button>`;
  const after = (id, html) => { const e = $(id); if (e) e.insertAdjacentHTML('afterend', html) };
  if (!$('nb-campaigns')) { after('nb-projects', btn('campaigns')); after('nb-ideas', btn('reporting') + btn('strategic')) }
  ['campaigns', 'reporting', 'strategic'].forEach(k => { if (!$(k + 'View')) { const s = D.createElement('section'); s.id = k + 'View'; s.className = 'sec hidden'; $('zoomWrap').appendChild(s) } });
  [['campaigns', 'Campaigns'], ['reporting', 'Reporting'], ['strategic', 'Strategic Plan']].forEach(([k, n]) => { if (!VIEWS.includes(k)) VIEWS.push(k); ZOOM_NAMES[k] = n; ZOOM_DEF[k] = 100 });
  /* the Archive button leaves Projects: completed work now lives in Reporting */
  const ab = D.querySelector('#projView .band-r button[onclick="openArchive()"]'); if (ab) ab.remove();
  EXPOSE({
    setView(v) {
      if (view === 'notes' && typeof flushNote === 'function') flushNote();
      view = VIEWS.includes(v) ? v : 'home';
      const map = { home: 'homeView', comingup: 'comingView', projects: 'projView', ideas: 'ideasView', calendar: 'calView', workplan: 'wpView', notes: 'notesView', campaigns: 'campaignsView', reporting: 'reportingView', strategic: 'strategicView' };
      VIEWS.forEach(k => { const e = $(map[k]); if (e) e.classList.toggle('hidden', k !== view); const b = $('nb-' + k); if (b) b.classList.toggle('on', k === view) });
      zoomPop.classList.remove('open'); applyZoom(); render(); W.scrollTo(0, 0)
    }
  });
  wrap('renderView', o => function (v) { if (v === 'campaigns') renderCampaigns(); else if (v === 'reporting') renderReporting(); else if (v === 'strategic') renderStrategic(); else return o.apply(this, arguments) });
  wrap('toastMsg', o => function (t, act) { if (t === 'Completed and moved to the Archive') t = 'Completed and moved to Reporting'; return o.call(this, t, act) });
  wrap('wpOpenArchived', o => function (id) { const a = archive.find(x => x.id === id); RPT.range = 'all'; RPT.q = a ? (a.project || '') : ''; setView('reporting') });
});

/* first-time setup of the settings (new Draft Date field, new date labels) */
function migrateV35() {
  let ch = false; settings.migrated = settings.migrated || {};
  const pf = settings.projectFields;
  if (Array.isArray(pf)) {
    let di = pf.findIndex(f => f.key === 'draftDate'), ci = pf.findIndex(f => f.key === 'campaignLaunch');
    if (di < 0) { pf.splice(ci >= 0 ? ci : pf.length, 0, { key: 'draftDate', label: 'Draft Date', type: 'date', options: [], visible: true, onBack: false, backStyle: 'line', core: true, locked: false }); ch = true }
    else if (ci >= 0 && di > ci) { const f = pf.splice(di, 1)[0]; pf.splice(pf.findIndex(x => x.key === 'campaignLaunch'), 0, f); ch = true }
    if (!settings.migrated.datesV35) {
      const cl = pf.find(f => f.key === 'campaignLaunch'), dl = pf.find(f => f.key === 'deadline');
      if (cl && ['Kickoff', 'Kick Off', 'Campaign Start Date'].includes(cl.label)) cl.label = 'Public Launch Date';
      if (dl && ['Launch', 'Launch Date'].includes(dl.label)) dl.label = 'End Date';
      settings.migrated.datesV35 = true; ch = true
    }
  }
  X();
  VIEWS.forEach(v => { if (!(typeof settings.zooms === 'object' && typeof settings.zooms[v] === 'number')) { settings.zooms = settings.zooms || {}; settings.zooms[v] = ZOOM_DEF[v] || 100 } });
  return ch
}
safe('migrate', () => {
  wrap('applyCloud', o => async function () { let changed = await o.apply(this, arguments); if (migrateV35()) { changed = true; try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) } catch { } } return changed });
  if (migrateV35()) { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) } catch { } if (cloudVersion !== null) queueCloudSave() }
  /* some of the page may already be drawn (the first screen), so draw it again with the new code */
  try { applyZoom(); render() } catch (e) { console.warn(e) }
});
W.__x35 = '35';
