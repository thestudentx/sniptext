document.addEventListener("DOMContentLoaded", () => {
  const apiTableBody = document.getElementById("apiTableBody");
  const addApiBtn = document.getElementById("addApiBtn");
  const apiModal = document.getElementById("apiModal");
  const apiForm = document.getElementById("apiForm");
  const apiModalTitle = document.getElementById("apiModalTitle");

  let apiModels = [
    { id: 1, model: "Turnitin", status: "active" },
    { id: 2, model: "Quillbot", status: "inactive" },
    { id: 3, model: "Grammarly", status: "active" }
  ];

  let editingApiId = null;

  function renderApiTable() {
    apiTableBody.innerHTML = "";
    apiModels.forEach((api) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${api.model}</td>
        <td>${api.status}</td>
        <td>
          <button class="btn edit-btn" data-id="${api.id}">Edit</button>
          <button class="btn delete-btn" data-id="${api.id}">Delete</button>
        </td>
      `;
      apiTableBody.appendChild(row);
    });
    attachApiActionEvents();
  }

  function attachApiActionEvents() {
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const api = apiModels.find(a => a.id == btn.dataset.id);
        if (api) {
          editingApiId = api.id;
          apiModalTitle.textContent = "Edit API Model";
          apiForm.model.value = api.model;
          apiForm.status.value = api.status;
          openModal(apiModal);
        }
      });
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        apiModels = apiModels.filter(api => api.id !== id);
        renderApiTable();
      });
    });
  }

  addApiBtn.addEventListener("click", () => {
    editingApiId = null;
    apiModalTitle.textContent = "Add API Model";
    apiForm.reset();
    openModal(apiModal);
  });

  apiForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const model = apiForm.model.value.trim();
    const status = apiForm.status.value;

    if (editingApiId) {
      const api = apiModels.find(a => a.id === editingApiId);
      api.model = model;
      api.status = status;
    } else {
      const newApi = {
        id: Date.now(),
        model,
        status
      };
      apiModels.push(newApi);
    }

    renderApiTable();
    closeModal(apiModal);
    apiForm.reset();
  });

  // Cancel modal button logic
  document.querySelectorAll('[data-modal-close="userModal"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      closeModal(apiModal);
      apiForm.reset();
    });
  });

  function openModal(modal) {
    modal.classList.remove("hidden");
  }

  function closeModal(modal) {
    modal.classList.add("hidden");
  }

  // Initial render
  renderApiTable();
});
