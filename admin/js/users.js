document.getElementById('addUserBtn').addEventListener('click', () => {
    document.getElementById('userModal').classList.remove('hidden');
  document.getElementById('userModalTitle').textContent = 'Add User';
  document.getElementById('userForm').reset();
  openModal('userModal');
});

document.getElementById('userForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const user = Object.fromEntries(form.entries());
  // TODO: POST to backend: /api/admin/users
  console.log('Adding user:', user);
  closeModal('userModal');
});

// Simulated data load
const sampleUsers = [
  {
    email: 'jane@sniptext.com',
    access: 'premium',
    expiry: '2025-12-31',
    apis: ['Turnitin', 'Quillbot'],
    credits: 100
  }
];

function loadUsers(users = sampleUsers) {
  const tbody = document.getElementById('userTableBody');
  tbody.innerHTML = '';
  users.forEach((u, i) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td data-label="Email">${u.email}</td>
      <td data-label="Access">${u.access}</td>
      <td data-label="Expiry">${u.expiry}</td>
      <td data-label="APIs">${u.apis.join(', ')}</td>
      <td data-label="Credits">${u.credits}</td>
      <td data-label="Actions">
        <button class="btn" onclick="editUser(${i})">Edit</button>
        <button class="btn" onclick="deleteUser(${i})">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function editUser(index) {
  const user = sampleUsers[index];
  const form = document.getElementById('userForm');
  form.email.value = user.email;
  form.access.value = user.access;
  form.expiry.value = user.expiry;
  form.apis.value = user.apis.join(', ');
  form.credits.value = user.credits;
  openModal('userModal');
}

function deleteUser(index) {
  if (confirm('Delete this user?')) {
    sampleUsers.splice(index, 1);
    loadUsers();
  }
}

loadUsers();
