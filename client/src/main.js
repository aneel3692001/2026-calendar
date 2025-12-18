import './style.css';

const app = document.getElementById('app');
const API_BASE = '/api'; // Dev Only

// State
let state = {
  view: 'month', // month, day, submit
  currentYear: 2026,
  currentMonth: new Date().getMonth() + 1, // 1-12
  selectedDate: null,
  cache: {}
};

// Utils
const get = (sel) => document.querySelector(sel);
const create = (tag, cls) => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  return el;
};

// Imports
import { routeAdmin } from './admin.js';

// Routing
function initRouter() {
  window.addEventListener('popstate', handleRoute);
  handleRoute();
}

function navigate(path) {
  window.history.pushState({}, '', path);
  handleRoute();
}

function handleRoute() {
  const path = window.location.pathname;
  
  if (path.startsWith('/admin')) {
      const container = create('div', 'p-4 md:p-8 max-w-7xl mx-auto w-full');
      renderLayout(container); // Use wrapper
      // Clear container provided by renderLayout
      container.innerHTML = ''; 
      routeAdmin(path, container);
      return; 
  }

  if (path === '/' || path.match(/^\/month/)) {
    state.view = 'month';
    renderMonthView();
  } else if (path.match(/^\/day\//)) {
    const date = path.split('/day/')[1];
    state.view = 'day';
    state.selectedDate = date;
    renderDayDetail(date);
  } else if (path === '/submit') {
    state.view = 'submit';
    renderSubmitPage();
  } else {
    state.view = 'month';
    renderMonthView();
  }
}

// Data Fetching
async function fetchMonthData(year, month) {
  const key = `${year}-${month}`;
  if (state.cache[key]) return state.cache[key];

  try {
    const res = await fetch(`${API_BASE}/calendar/${year}/${month}`);
    const data = await res.json();
    state.cache[key] = data;
    return data;
  } catch (e) {
    console.error(e);
    return { events: [], assignments: [] };
  }
}

async function fetchDayData(date) {
  try {
    const res = await fetch(`${API_BASE}/day/${date}`);
    return await res.json();
  } catch (e) {
    return { events: [], assignment: null };
  }
}

// Renderers

function renderLayout(content) {
  app.innerHTML = '';
  
  // Header
  const header = create('header', 'p-6 flex justify-between items-center glass-panel backdrop-blur-md sticky top-0 z-50');
  header.innerHTML = `
    <div class="flex items-center gap-4">
      <h1 class="text-xl font-heading font-bold tracking-wide" onclick="window.location.href='/'" style="cursor:pointer">TALES OF WILD</h1>
    </div>
    <nav class="flex gap-4 text-sm">
      <button class="glass-btn" id="nav-today">Today</button>
      <button class="glass-btn" id="nav-submit">Submit Photo</button>
    </nav>
  `;
  
  header.querySelector('#nav-today').onclick = () => {
    state.currentYear = 2026; // Force 2026 context as per app goal
    state.currentMonth = new Date().getMonth() + 1; 
    navigate('/');
  };
  header.querySelector('#nav-submit').onclick = () => navigate('/submit');

  app.appendChild(header);
  
  const main = create('main', 'p-4 md:p-8 max-w-7xl mx-auto w-full');
  main.appendChild(content);
  app.appendChild(main);
}

async function renderMonthView() {
  const container = create('div', 'flex flex-col gap-6');
  
  // Controls
  const controls = create('div', 'flex justify-between items-center');
  const monthName = new Date(state.currentYear, state.currentMonth - 1).toLocaleString('default', { month: 'long' });
  
  controls.innerHTML = `
    <div class="flex items-center gap-4">
      <button id="prev-month" class="glass-btn px-3">&larr;</button>
      <h2 class="text-2xl font-heading font-bold">${monthName} ${state.currentYear}</h2>
      <button id="next-month" class="glass-btn px-3">&rarr;</button>
    </div>
    <div class="text-sm text-gray-400">
      Tap a day to explore
    </div>
  `;
  
  controls.querySelector('#prev-month').onclick = () => changeMonth(-1);
  controls.querySelector('#next-month').onclick = () => changeMonth(1);
  container.appendChild(controls);

  // Grid
  const grid = create('div', 'glass-panel rounded-xl overflow-hidden');
  
  // Days Header
  const daysHeader = create('div', 'grid grid-cols-7 border-b border-[rgba(255,255,255,0.1)]');
  ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].forEach(d => {
    const el = create('div', 'calendar-grid-header text-center');
    el.textContent = d;
    daysHeader.appendChild(el);
  });
  grid.appendChild(daysHeader);

  // Month Cells
  const cellsContainer = create('div', 'grid grid-cols-7');
  
  // Fetch Data
  container.appendChild(create('div', 'p-4 text-center text-gray-500', 'Loading...')); // Temporary
  const data = await fetchMonthData(state.currentYear, state.currentMonth);
  // Remove loading? naive approach above, better to just waiting await
  if (container.lastChild.textContent === 'Loading...') container.removeChild(container.lastChild);

  const firstDay = new Date(state.currentYear, state.currentMonth - 1, 1).getDay();
  const daysInMonth = new Date(state.currentYear, state.currentMonth, 0).getDate();

  // Padding
  for (let i = 0; i < firstDay; i++) {
    cellsContainer.appendChild(create('div', 'day-cell bg-black/10'));
  }

  // Days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${state.currentYear}-${String(state.currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const cell = create('div', 'day-cell cursor-pointer group');
    cell.onclick = () => navigate(`/day/${dateStr}`);

    // Featured Image
    const assignment = data.assignments.find(a => a.date === dateStr);
    if (assignment) {
      cell.classList.add('featured');
      const bgUrl = assignment.image_web_url.startsWith('http') ? assignment.image_web_url : assignment.image_web_url;
      // Direct style injection for background
      const styleEl = document.createElement('style');
      styleEl.innerHTML = `.day-cell[data-date="${dateStr}"]::before { background-image: url('${bgUrl}'); }`;
      document.head.appendChild(styleEl); 
      cell.dataset.date = dateStr;
    }

    const content = create('div', 'day-cell-content flex flex-col justify-between h-full');
    content.innerHTML = `<span class="day-number text-lg">${d}</span>`;
    
    // Events Badges
    const dayEvents = data.events.filter(e => e.date === dateStr);
    const badges = create('div', 'flex flex-wrap gap-1 mt-1');
    dayEvents.forEach(e => {
        const badge = create('span', `badge ${e.type}`);
        badge.textContent = e.type === 'holiday' ? '•' : 'W'; // minimalist badge
        badge.title = e.title;
        badges.appendChild(badge);
    });
    content.appendChild(badges);
    
    // Photographer name if featured (on hover or always?)
    if (assignment) {
        const cred = create('div', 'text-[10px] opacity-0 group-hover:opacity-100 transition-opacity mt-auto bg-black/50 p-1 rounded backdrop-blur-sm');
        cred.textContent = `📷 ${assignment.photographer_name}`;
        content.appendChild(cred);
    }

    cell.appendChild(content);
    cellsContainer.appendChild(cell);
  }

  grid.appendChild(cellsContainer);
  container.appendChild(grid);
  
  renderLayout(container);
}

function changeMonth(delta) {
  state.currentMonth += delta;
  if (state.currentMonth > 12) {
    state.currentMonth = 1;
    state.currentYear++;
  } else if (state.currentMonth < 1) {
    state.currentMonth = 12;
    state.currentYear--;
  }
  renderMonthView();
}

async function renderDayDetail(date) {
  const container = create('div', 'flex flex-col gap-6 max-w-2xl mx-auto');
  
  // Back
  const backBtn = create('button', 'text-gray-400 hover:text-white mb-4 flex items-center gap-2');
  backBtn.innerHTML = '&larr; Back to Month';
  backBtn.onclick = () => {
    state.view = 'month'; // Manual override to prevent re-stack
    window.history.back();
  };
  container.appendChild(backBtn);

  const data = await fetchDayData(date);
  
  // Card
  const card = create('div', 'glass-panel p-0 overflow-hidden rounded-2xl');
  
  // Image (if any)
  if (data.assignment) {
    const imgCont = create('div', 'w-full h-64 md:h-96 bg-gray-800 relative');
    const bgUrl = data.assignment.image_web_url.startsWith('http') ? data.assignment.image_web_url : data.assignment.image_web_url;
    imgCont.innerHTML = `<img src="${bgUrl}" class="w-full h-full object-cover">`;
    
    // Photographer Credit Overlay
    const credit = create('div', 'absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white');
    credit.innerHTML = `
        <p class="font-bold text-lg">${data.assignment.caption_optional || 'Untitled'}</p>
        <p class="text-sm opacity-80">Photo by ${data.assignment.name} (@${data.assignment.instagram_username})</p>
    `;
    imgCont.appendChild(credit);
    card.appendChild(imgCont);
  } else {
    // Placeholder or purely info
    const banner = create('div', 'p-8 bg-gradient-to-r from-green-900 to-gray-900 text-center');
    banner.innerHTML = `<h2 class="text-3xl font-heading font-light text-white/50">No Featured Image</h2>`;
    card.appendChild(banner);
  }

  // Info
  const info = create('div', 'p-6 md:p-8');
  const dObj = new Date(date);
  const prettyDate = dObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  info.innerHTML = `
    <h1 class="text-3xl font-heading font-bold mb-6">${prettyDate}</h1>
  `;
  
  if (data.events.length > 0) {
      const eventList = create('div', 'flex flex-col gap-4');
      data.events.forEach(e => {
          const row = create('div', 'p-4 rounded-lg bg-white/5 border border-white/10');
          row.innerHTML = `
             <div class="flex items-center gap-2 mb-1">
                <span class="badge ${e.type}">${e.type.toUpperCase()}</span>
                <span class="text-sm text-gray-400">${e.region || 'Global'}</span>
             </div>
             <h3 class="text-xl font-bold">${e.title}</h3>
             ${e.source ? `<p class="text-xs text-gray-500 mt-2">Source: ${e.source}</p>` : ''}
          `;
          eventList.appendChild(row);
      });
      info.appendChild(eventList);
  } else {
      info.appendChild(create('p', 'text-gray-500 italic', 'No special observances today.'));
  }

  // Share Button
  const shareBtn = create('button', 'mt-8 w-full glass-btn py-3 text-center font-bold flex items-center justify-center gap-2');
  shareBtn.textContent = 'Share this Day';
  shareBtn.onclick = () => alert('Screenshot generation would trigger here!');
  info.appendChild(shareBtn);

  card.appendChild(info);
  container.appendChild(card);
  
  renderLayout(container);
}

function renderSubmitPage() {
    const container = create('div', 'max-w-xl mx-auto glass-panel p-8 rounded-xl');
    container.innerHTML = `
        <h1 class="text-2xl font-heading font-bold mb-6">Submit Your Photography</h1>
        <p class="mb-6 text-gray-400">Be part of the 2026 Tales of Wild Calendar. We are looking for authentic, breathtaking wildlife moments.</p>
        
        <form id="submit-form" class="flex flex-col gap-4">
            <div>
                <label class="block text-sm text-gray-400 mb-1">Photographer Name</label>
                <input type="text" name="name" required class="w-full bg-black/20 border border-white/10 rounded p-3 text-white focus:border-olive-500 outline-none">
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Instagram Username</label>
                <input type="text" name="instagram_username" placeholder="@username" required class="w-full bg-black/20 border border-white/10 rounded p-3 text-white outline-none">
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Email (for notifications)</label>
                <input type="email" name="email" required class="w-full bg-black/20 border border-white/10 rounded p-3 text-white outline-none">
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Photo Upload</label>
                <input type="file" name="image" accept="image/*" required class="w-full bg-black/20 border border-white/10 rounded p-3 text-white outline-none">
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Caption / Story (Optional)</label>
                <textarea name="caption" rows="3" class="w-full bg-black/20 border border-white/10 rounded p-3 text-white outline-none"></textarea>
            </div>
            
            <div class="flex items-start gap-2 mt-2">
                <input type="checkbox" required id="consent" class="mt-1">
                <label for="consent" class="text-xs text-gray-500">I declare that I own this image and grant 'Tales of Wild' permission to feature it in the 2026 digital calendar.</label>
            </div>

            <button type="submit" class="glass-btn bg-white/10 hover:bg-white/20 py-3 font-bold mt-4">Submit Entry</button>
        </form>
    `;

    container.querySelector('form').onsubmit = async (e) => {
        e.preventDefault();
        const btn = container.querySelector('button');
        btn.textContent = 'Uploading...';
        btn.disabled = true;

        const formData = new FormData(e.target);
        
        try {
            const res = await fetch(`${API_BASE}/submit`, {
                method: 'POST',
                body: formData
            });
            
            if (res.ok) {
                container.innerHTML = `
                    <div class="text-center py-12">
                        <h2 class="text-2xl font-bold text-green-400 mb-2">Submission Received</h2>
                        <p class="text-gray-400">Thank you! We will notify you if your photo is selected.</p>
                        <button class="glass-btn mt-6" onclick="window.history.back()">Back to Calendar</button>
                    </div>
                `;
            } else {
                throw new Error('Upload failed');
            }
        } catch (err) {
            btn.textContent = 'Error. Try again.';
            btn.disabled = false;
        }
    };

    renderLayout(container);
}

// Init
initRouter();
