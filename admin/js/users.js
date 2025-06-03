// Determine backend URL based on where you're running
const BACKEND = location.hostname.includes('127.0.0.1') || location.hostname.includes('localhost')
  ? 'http://localhost:3000'
  : 'https://sniptext.onrender.com';

const API = `${BACKEND}/api/admin/users`;

// ——————————————————————————————
// Load & render user list
// ——————————————————————————————
async function loadUsers() {
  const token = localStorage.getItem('adminToken');
  const tbody = document.getElementById('userTableBody');
  tbody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';

  if (!token) {
    showToast('🚫 Admin access required! Redirecting...', 'error');
    setTimeout(() => {
      window.location.href = 'admin-login.html';
    }, 3000);
    tbody.innerHTML = '<tr><td colspan="6">Not authorized.</td></tr>';
    return;
  }

  try {
    const res = await fetch(API, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const users = await res.json();
    if (!res.ok) throw new Error(users.message || 'Failed to load users');

    tbody.innerHTML = '';
    if (users.length === 0) {
      showToast('ℹ️ No users found.', 'info');
    }

    users.forEach((u, i) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td data-label="Email">${u.email}</td>
        <td data-label="Access">${u.plan}</td>
        <td data-label="Expiry">${new Date(u.accessDuration).toLocaleDateString()}</td>
        <td data-label="APIs">${(u.modelsAccess || []).join(', ')}</td>
        <td data-label="Credits">${typeof u.credits === 'number' ? u.credits : 0}</td>
        <td data-label="Actions">
          <button class="btn" onclick="editUser(${i})">Edit</button>
          <button class="btn" onclick="deleteUser('${u._id}')">Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    });

    // keep users array global for editUser()
    window._loadedUsers = users;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6">Error: ${err.message}</td></tr>`;
  }
}

// ——————————————————————————————
// Open modal for Add User
// ——————————————————————————————
document.getElementById('addUserBtn').addEventListener('click', () => {
  document.getElementById('userModalTitle').textContent = 'Add User';
  document.getElementById('userSubmitBtn').textContent = 'Add User';

  // Re‐apply "required" on password & access (in case they were disabled/hidden on edit)
  document.getElementById('password').required = true;
  document.getElementById('access').required = true;

  // Ensure password & access fields are visible
  document.getElementById('password').parentElement.style.display = 'block';
  document.getElementById('access').parentElement.style.display = 'block';

  const form = document.getElementById('userForm');
  form.reset();
  form.dataset.editingId = ''; // clear any previous edit
  openModal('userModal');
});

// ——————————————————————————————
// Handle form submit (POST or PUT)
// ——————————————————————————————
document.getElementById('userForm').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const editingId = form.dataset.editingId;
  const token = localStorage.getItem('adminToken');

  // Build raw values from form
  const raw = Object.fromEntries(new FormData(form).entries());
  const data = {};

  // 1) Always include email
  data.email = raw.email.trim();

  // 2) Include password only if adding OR if a non‐empty value on edit
  if (!editingId || raw.password.trim() !== '') {
    data.password = raw.password;
  }

  // 3) Always send "access" (we pre‐fill it when editing)
  //    The <select id="access"> values are "30", "90", "180", "365"
  data.access = raw.access;

  // 4) Always include modelsAccess as an array
  data.modelsAccess = raw.apis
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  // 5) Always include credits (parse to int, default to 0)
  data.credits = parseInt(raw.credits, 10) || 0;

  // Determine HTTP method and URL
  const method = editingId ? 'PUT' : 'POST';
  const url = editingId ? `${API}/${editingId}` : API;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Request failed');

    showToast(editingId ? '✅ User updated!' : '✅ User added!', 'success');
    closeModal('userModal');

    // After closing, restore required on password & access so "Add User" works next time
    document.getElementById('password').required = true;
    document.getElementById('access').required = true;

    loadUsers();
  } catch (err) {
    showToast(`❌ ${err.message}`, 'error');
  }
});

// ——————————————————————————————
// Populate form for editing
// ——————————————————————————————
function editUser(index) {
  const u = window._loadedUsers[index];
  const form = document.getElementById('userForm');

  // 1) Switch modal to "Edit User" mode
  document.getElementById('userModalTitle').textContent = 'Edit User';
  document.getElementById('userSubmitBtn').textContent = 'Save Changes';

  // 2) Remove required constraints on password (so it can be left blank)
  document.getElementById('password').required = false;

  // 3) Always pre‐fill the "access" dropdown with the user’s current plan → numeric value
  //
  //    We assume u.plan is one of: "Standard", "Pro", "Business", "Premium".
  //    Map it back to the <select> value: 
  //      Standard → "30", Pro → "90", Business → "180", Premium → "365"
  let numericAccess = '';
  switch (u.plan) {
    case 'Standard':
      numericAccess = '30';
      break;
    case 'Pro':
      numericAccess = '90';
      break;
    case 'Business':
      numericAccess = '180';
      break;
    case 'Premium':
      numericAccess = '365';
      break;
    default:
      numericAccess = '';
  }
  document.getElementById('access').value = numericAccess;
  document.getElementById('access').required = true; // keep it required so it never submits empty

  // 4) Pre-fill other fields
  form.email.value = u.email;
  form.apis.value = (u.modelsAccess || []).join(', ');
  form.credits.value = typeof u.credits === 'number' ? u.credits : 0;

  // 5) Make sure password field is visible (it’s just optional)
  document.getElementById('password').parentElement.style.display = 'block';

  form.dataset.editingId = u._id;
  openModal('userModal');
}

// ——————————————————————————————
// Delete user
// ——————————————————————————————
function showConfirmModal() {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirmModal');
    const yesBtn = document.getElementById('confirmYes');
    const noBtn = document.getElementById('confirmNo');

    modal.style.display = 'flex';

    function cleanup() {
      modal.style.display = 'none';
      yesBtn.removeEventListener('click', onYes);
      noBtn.removeEventListener('click', onNo);
    }

    function onYes() {
      cleanup();
      resolve(true);
    }

    function onNo() {
      cleanup();
      resolve(false);
    }

    yesBtn.addEventListener('click', onYes);
    noBtn.addEventListener('click', onNo);
  });
}

async function deleteUser(id) {
  const confirmed = await showConfirmModal();
  if (!confirmed) return;

  const token = localStorage.getItem('adminToken');

  try {
    const res = await fetch(`${API}/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Delete failed');

    showToast('🗑️ User deleted successfully!', 'success');
    loadUsers();
  } catch (err) {
    console.error(err);
    showToast('Error deleting user.', 'error');
  }
}

// ——————————————————————————————
// Initial load
// ——————————————————————————————
window.addEventListener('load', () => {
  loadUsers();
});

// ——————————————————————————————
// Search Form and Clear Button Events
// ——————————————————————————————
const searchForm  = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const clearBtn    = document.getElementById('clearSearch');

searchForm.addEventListener('submit', e => {
  e.preventDefault();
  filterUsers();
});

clearBtn.addEventListener('click', () => {
  searchInput.value = '';
  filterUsers();
});

// ——————————————————————————————
// Live Search: filter displayed users
// ——————————————————————————————
function filterUsers() {
  const query = document.getElementById('searchInput').value
    .trim()
    .toLowerCase();
  const tbody = document.getElementById('userTableBody');

  if (!Array.isArray(window._loadedUsers)) return;

  const filtered = window._loadedUsers.filter(u =>
    u.email.toLowerCase().includes(query) ||
    u.plan.toLowerCase().includes(query) ||
    (u.modelsAccess || []).some(m => m.toLowerCase().includes(query))
  );

  tbody.innerHTML = '';
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">No users match your search.</td></tr>`;
    return;
  }

  filtered.forEach((u) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td data-label="Email">${u.email}</td>
      <td data-label="Access">${u.plan}</td>
      <td data-label="Expiry">${new Date(u.accessDuration).toLocaleDateString()}</td>
      <td data-label="APIs">${(u.modelsAccess || []).join(', ')}</td>
      <td data-label="Credits">${typeof u.credits === 'number' ? u.credits : 0}</td>
      <td data-label="Actions">
        <button class="btn" onclick="editUser(${window._loadedUsers.indexOf(u)})">Edit</button>
        <button class="btn" onclick="deleteUser('${u._id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}
