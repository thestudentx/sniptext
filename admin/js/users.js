// Determine backend URL based on environment
const BACKEND = (['127.0.0.1', 'localhost'].some(h => location.hostname.includes(h)))
  ? 'http://localhost:3000'
  : 'https://sniptext.onrender.com';
const API = `${BACKEND}/api/admin/users`;

// ——————————————————————————————
// Load & render user list with numbering
// ——————————————————————————————
async function loadUsers() {
  const token = localStorage.getItem('adminToken');
  const tbody = document.getElementById('userTableBody');
  tbody.innerHTML = '<tr><td colspan="7">Loading...</td></tr>';

  if (!token) {
    showToast('Error', 'Admin access required! Redirecting...', 'error');
    setTimeout(() => window.location.href = 'admin-login.html', 3000);
    return;
  }

  try {
    const res = await fetch(API, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const users = await res.json();
    if (!res.ok) throw new Error(users.message || 'Failed to load users');

    tbody.innerHTML = '';
    if (!users.length) {
      showToast('Info', 'No users found.', 'info');
      tbody.innerHTML = `<tr><td colspan="7">No users found.</td></tr>`;
      return;
    }

    users.forEach((u, i) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td data-label="No.">${i + 1}</td>
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

    window._loadedUsers = users;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7">Error: ${err.message}</td></tr>`;
  }
}

// ——————————————————————————————
// Open “Add User” modal
// ——————————————————————————————
document.getElementById('addUserBtn').addEventListener('click', () => {
  const form = document.getElementById('userForm');
  form.dataset.editingId = '';
  form.reset();
  document.getElementById('userModalTitle').textContent = 'Add User';
  document.getElementById('userSubmitBtn').textContent = 'Add User';

  // ensure required fields
  document.getElementById('password').required = true;
  document.getElementById('access').required = true;
  openModal('userModal');
});

// ——————————————————————————————
// Handle Add/Edit form submit
// ——————————————————————————————
document.getElementById('userForm').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const editingId = form.dataset.editingId;
  const token = localStorage.getItem('adminToken');
  const raw = Object.fromEntries(new FormData(form).entries());

  const submittedEmail = raw.email.trim().toLowerCase();
  const existing = (window._loadedUsers || []).find(
    user => user.email.toLowerCase() === submittedEmail
  );

  // 🔒 Check for duplicate email only on "Add"
  if (!editingId && existing) {
    showToast('Warning', 'Email already exists. Use a different one.', 'warning');
    return;
  }

  // 🛠️ Check for duplicate email on "Edit" (only if changed)
  if (editingId && existing && existing._id !== editingId) {
    showToast('Warning', 'Email already belongs to another user.', 'warning');
    return;
  }

  const data = {
    email: submittedEmail,
    access: raw.access,
    modelsAccess: raw.apis
      .split(',')
      .map(s => s.trim())
      .filter(s => s),
    credits: parseInt(raw.credits, 10) || 0
  };

  // Only send password if new or edited
  if (!editingId || raw.password.trim()) {
    data.password = raw.password;
  }

  try {
    const res = await fetch(editingId ? `${API}/${editingId}` : API, {
      method: editingId ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Request failed');

    showToast('Success', editingId ? 'User updated!' : 'User added!', 'success');
    closeModal('userModal');
    loadUsers();
  } catch (err) {
    showToast('Error', `Error: ${err.message}`, 'error');
  }
});


// ——————————————————————————————
// Populate “Edit User” modal
// ——————————————————————————————
function editUser(index) {
  const u = window._loadedUsers[index];
  const form = document.getElementById('userForm');
  form.dataset.editingId = u._id;
  document.getElementById('userModalTitle').textContent = 'Edit User';
  document.getElementById('userSubmitBtn').textContent = 'Save Changes';

  // prefill fields
  form.email.value = u.email;
  form.access.value = ({
    'Standard': '30',
    'Pro': '90',
    'Business': '180',
    'Premium': '365'
  }[u.plan] || '');
  form.apis.value = (u.modelsAccess || []).join(', ');
  form.credits.value = u.credits || 0;
  document.getElementById('password').required = false;

  openModal('userModal');
  showToast('Info', `Editing user: ${u.email}`, 'info');
}

// ——————————————————————————————
// Delete user with confirmation
// ——————————————————————————————
async function deleteUser(id) {
  const confirmed = await new Promise(resolve => {
    const modal = document.getElementById('confirmModal');
    modal.style.display = 'flex';
    const yes = document.getElementById('confirmYes');
    const no  = document.getElementById('confirmNo');
    yes.onclick = () => { modal.style.display = 'none'; resolve(true); };
    no.onclick  = () => { modal.style.display = 'none'; resolve(false); };
  });
  if (!confirmed) return;

  try {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API}/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Delete failed');

    showToast('Success', '🗑️ User deleted successfully!', 'success');
    loadUsers();
  } catch (err) {
    showToast('Error', 'Error deleting user.', 'error');
  }
}

// ——————————————————————————————
// Search & filter users
// ——————————————————————————————
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');

// Debounce function (core logic)
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// Attach debounced search
searchInput.addEventListener('input', debounce(filterUsers, 300));

// Clear search button
clearSearch.addEventListener('click', () => {
  searchInput.value = '';
  filterUsers();
});


function filterUsers() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  const tbody = document.getElementById('userTableBody');
  const list = window._loadedUsers || [];
  const filtered = list.filter(u =>
    u.email.toLowerCase().includes(q) ||
    u.plan.toLowerCase().includes(q) ||
    (u.modelsAccess || []).some(m => m.toLowerCase().includes(q))
  );

  tbody.innerHTML = filtered.length
    ? filtered.map((u, i) => `
      <tr>
        <td data-label="No.">${i + 1}</td>
        <td data-label="Email">${u.email}</td>
        <td data-label="Access">${u.plan}</td>
        <td data-label="Expiry">${new Date(u.accessDuration).toLocaleDateString()}</td>
        <td data-label="APIs">${(u.modelsAccess || []).join(', ')}</td>
        <td data-label="Credits">${u.credits || 0}</td>
        <td data-label="Actions">
          <button class="btn" onclick="editUser(${list.indexOf(u)})">Edit</button>
          <button class="btn" onclick="deleteUser('${u._id}')">Delete</button>
        </td>
      </tr>`
    ).join('')
    : `<tr><td colspan="7">No users match your search.</td></tr>`;
}

// ——————————————————————————————
// Initial load
// ——————————————————————————————
window.addEventListener('load', loadUsers);

// Expose filter for inline calls (if any)
window.filterUsers = filterUsers;
