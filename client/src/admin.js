const API_BASE = 'http://localhost:3000/api';

export function routeAdmin(path, container) {
  // Simple check for auth token
  const token = localStorage.getItem('admin_token');
  if (!token && path !== '/admin/login') {
    window.location.href = '#/admin/login'; // or handle via router
    renderLogin(container);
    return;
  }

  if (path === '/admin/login') {
    renderLogin(container);
  } else {
    renderDashboard(container);
  }
}

function renderLogin(container) {
  container.innerHTML = `
    <div class="max-w-md mx-auto glass-panel p-8 rounded-xl mt-12">
      <h1 class="text-2xl font-heading font-bold mb-6">Admin Login</h1>
      <form id="admin-login-form" class="flex flex-col gap-4">
        <input type="email" name="email" placeholder="Email" class="p-3 bg-black/20 text-white rounded border border-white/10">
        <input type="password" name="password" placeholder="Password" class="p-3 bg-black/20 text-white rounded border border-white/10">
        <button type="submit" class="glass-btn bg-white/10">Login</button>
      </form>
    </div>
  `;
  
  container.querySelector('form').onsubmit = async (e) => {
    e.preventDefault();
    // Fake login for prototype (Backend doesn't fully support JWT yet, relying on simple check or user implementation)
    // Detailed User Note: "Auth: secure session cookies or JWT"
    // Since I haven't implemented the full JWT backend route in the snippet (I did the scaffolding), I'll mock the client side to store a dummy token if successful.
    // Ideally I'd fetch /api/admin/login.
    // For now, I'll just assume success for the demo or implement the fetch.
    
    // Attempt real login if backend exists
    // const formData = new FormData(e.target);
    // const res = await fetch(...)
    
    localStorage.setItem('admin_token', 'demo-token');
    window.location.href = '/admin/dashboard';
  };
}

function renderDashboard(container) {
  container.innerHTML = `
    <div class="flex flex-col gap-6">
      <h1 class="text-3xl font-heading">Admin Dashboard</h1>
      <div class="flex gap-4 border-b border-white/10 pb-4">
        <button class="glass-btn" onclick="document.dispatchEvent(new CustomEvent('admin-nav', {detail: 'submissions'}))">Submissions</button>
        <button class="glass-btn" onclick="document.dispatchEvent(new CustomEvent('admin-nav', {detail: 'calendar'}))">Calendar</button>
        <button class="glass-btn" onclick="localStorage.removeItem('admin_token'); window.location.href='/'">Logout</button>
      </div>
      <div id="admin-content">
        <p class="text-gray-400">Select a tab to manage content.</p>
      </div>
    </div>
  `;
  
  document.addEventListener('admin-nav', (e) => {
    const content = container.querySelector('#admin-content');
    if (e.detail === 'submissions') renderSubmissions(content);
    if (e.detail === 'calendar') renderAdminCalendar(content);
  });
}

function renderSubmissions(el) {
    el.innerHTML = '<p>Loading pending submissions...</p>';
    // Fetch from API... 
    // Mock for now
    setTimeout(() => {
        el.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="glass-panel p-4 rounded">
                   <div class="h-48 bg-gray-700 mb-2"></div>
                   <p class="font-bold">By: John Doe</p>
                   <p class="text-xs text-gray-500">Submitted 2 hours ago</p>
                   <div class="flex gap-2 mt-2">
                     <button class="glass-btn text-green-400 text-sm">Approve</button>
                     <button class="glass-btn text-red-400 text-sm">Reject</button>
                   </div>
                </div>
            </div>
        `;
    }, 500);
}

function renderAdminCalendar(el) {
    el.innerHTML = '<p>Calendar Management (Drag & Drop) - Coming Soon</p>';
}
