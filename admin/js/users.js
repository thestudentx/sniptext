// Determine backend URL based on where you're running
const BACKEND = location.hostname.includes('127.0.0.1') || location.hostname.includes('localhost')
  ? 'http://localhost:3000'
  : 'https://sniptext.onrender.com';

const API = `${BACKEND}/api/admin/users`; // ✅ this fixes the error

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
  }, 3000); // wait 2 seconds so the toast shows
  tbody.innerHTML = '<tr><td colspan="6">Not authorized.</td></tr>';
  return;
}

  console.log('adminToken:', token);

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
        <td data-label="Credits">${typeof u.credits === 'number' ? u.credits : 0}</td> <!-- Updated to show 0 if no credits -->
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
// Open modal for add/edit
// ——————————————————————————————
document.getElementById('addUserBtn').addEventListener('click', () => {
  document.getElementById('userModalTitle').textContent = 'Add User';
  const form = document.getElementById('userForm');
  form.reset();
  form.dataset.editingId = '';     // clear any previous edit
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

  // build payload
  const data = Object.fromEntries(new FormData(form).entries());

  // Parse modelsAccess from comma-separated string to array
  data.modelsAccess = data.apis.split(',').map(s => s.trim());
  delete data.apis; // remove original field

  // Parse credits as integer and default to 0
  data.credits = parseInt(data.credits, 10) || 0;

  // choose method & URL
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
  document.getElementById('userModalTitle').textContent = 'Edit User';

  form.email.value = u.email;
  form.access.value = u.plan;
  // form.expiry.value = new Date(u.accessDuration).toISOString().slice(0, 10);
  form.apis.value = (u.modelsAccess || []).join(', ');

  // Set credits field with fallback 0
  form.credits.value = typeof u.credits === 'number' ? u.credits : 0;

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

// ——————————————————————————————
// Delete user with confirm modal
// ——————————————————————————————
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

// Search on form submit (Enter key or button)
searchForm.addEventListener('submit', e => {
  e.preventDefault();
  filterUsers();
});

// Clear search
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

  // If no users loaded yet, bail
  if (!Array.isArray(window._loadedUsers)) return;

  // Filter by email, plan, or any model name
  const filtered = window._loadedUsers.filter(u =>
    u.email.toLowerCase().includes(query) ||
    u.plan.toLowerCase().includes(query) ||
    (u.modelsAccess || []).some(m => m.toLowerCase().includes(query))
  );

  // Clear existing rows
  tbody.innerHTML = '';

  // Show “no match” if empty
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">No users match your search.</td></tr>`;
    return;
  }

  // Re-render filtered rows
  filtered.forEach((u, i) => {
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

