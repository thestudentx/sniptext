const sampleCredits = [
  { userEmail: 'jane@sniptext.com', model: 'Turnitin', credits: 40 },
  { userEmail: 'bob@sniptext.com', model: 'Quillbot', credits: 60 }
];

function loadCredits(credits = sampleCredits) {
  const tbody = document.getElementById('creditTableBody');
  tbody.innerHTML = '';
  credits.forEach((entry, i) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td data-label="User">${entry.userEmail}</td>
      <td data-label="API Model">${entry.model}</td>
      <td data-label="Remaining Credits">${entry.credits}</td>
      <td data-label="Actions">
        <button class="btn" onclick="editCredit(${i})">Edit</button>
        <button class="btn" onclick="deleteCredit(${i})">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function editCredit(index) {
  const credit = sampleCredits[index];
  const form = document.getElementById('creditForm');
  form.userEmail.value = credit.userEmail;
  form.model.value = credit.model;
  form.credits.value = credit.credits;
  openModal('creditModal');
}

function deleteCredit(index) {
  if (confirm('Delete this credit assignment?')) {
    sampleCredits.splice(index, 1);
    loadCredits();
  }
}

loadCredits();
