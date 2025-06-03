document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const emailElement = document.getElementById("user-email");
  const accessDurationElement = document.getElementById("access-duration");
  const timeRemainingElement = document.getElementById("time-remaining");
  const modelLinksContainer = document.getElementById("modelLinks");
  const errorDiv = document.getElementById("dashboard-error");

  // Protect dashboard access
  if (!token) {
    window.location.href = "/login.html";
    return;
  }

  let decodedPayload;
  try {
    const payloadBase64 = token.split(".")[1];
    decodedPayload = JSON.parse(atob(payloadBase64));
  } catch (err) {
    console.error("Token decode error:", err);
    localStorage.removeItem("token");
    window.location.href = "/login.html";
    return;
  }

  console.log("Decoded Payload:", decodedPayload); // ✅ Add this

  const { email, plan, accessDuration, models } = decodedPayload;
  const expiryDate = new Date(accessDuration);
  const now = new Date();

  if (now > expiryDate) {
    localStorage.removeItem("token");
    window.location.href = "/login.html";
    return;
  }

  // ✅ Authorized: Proceed to render dashboard content

  emailElement.textContent = email;
  accessDurationElement.textContent = expiryDate.toDateString();

  // Display user plan 
  const planElement = document.getElementById("active-plan");
  planElement.textContent = plan || "Not Assigned";
  


  // Countdown timer
  function updateTimer() {
    const now = new Date();
    const diff = expiryDate - now;

    if (diff <= 0) {
      timeRemainingElement.textContent = "Access expired";
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    timeRemainingElement.textContent =
      `Time left: ${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  updateTimer();
  setInterval(updateTimer, 1000);

  const allModelCards = {
    turnitin1: {
      id: "model-turnitin-1",
      href: "https://turnitindetect.org/login",
      img: "images/turnitin-logo.png",
      title: "Turnitin 1",
      description: "Plagiarism Check & AI Detection",
      model: "Turnitin",
    },
    turnitin2: {
      id: "model-turnitin-2",
      href: "https://turnitindetect.org/login",
      img: "images/turnitin-logo.png",
      title: "Turnitin 2",
      description: "Plagiarism Check & AI Detection",
      model: "Turnitin",
    },
    turnitin3: {
      id: "model-turnitin-3",
      href: "https://turnitindetect.org/login",
      img: "images/turnitin-logo.png",
      title: "Turnitin 3",
      description: "Plagiarism Check & AI Detection",
      model: "Turnitin",
    },
    turnitin4: {
      id: "model-turnitin-4",
      href: "https://turnitindetect.org/login",
      img: "images/turnitin-logo.png",
      title: "Turnitin 4",
      description: "Plagiarism Check & AI Detection",
      model: "Turnitin",
    },
    quillbot1: {
      id: "model-quillbot-1",
      href: "/model/quillbot1",
      img: "images/quilbot-logo.png",
      title: "Quillbot 1",
      description: "Paraphrasing Tool",
      model: "Quillbot",
    },
    quillbot2: {
      id: "model-quillbot-2",
      href: "/model/quillbot2",
      img: "images/quilbot-logo.png",
      title: "Quillbot 2",
      description: "Paraphrasing Tool",
      model: "Quillbot",
    },
    quillbot3: {
      id: "model-quillbot-3",
      href: "/model/quillbot3",
      img: "images/quilbot-logo.png",
      title: "Quillbot 3",
      description: "Paraphrasing Tool",
      model: "Quillbot",
    },
    grammarly1: {
      id: "model-grammarly-1",
      href: "/model/grammarly1",
      img: "images/grammarly-logo.png",
      title: "Grammarly 1",
      description: "Grammar Checker",
      model: "Grammarly",
    },
    grammarly2: {
      id: "model-grammarly-2",
      href: "/model/grammarly2",
      img: "images/grammarly-logo.png",
      title: "Grammarly 2",
      description: "Grammar Checker",
      model: "Grammarly",
    },
    grammarly3: {
      id: "model-grammarly-3",
      href: "/model/grammarly3",
      img: "images/grammarly-logo.png",
      title: "Grammarly 3",
      description: "Grammar Checker",
      model: "Grammarly",
    },
    dummy1: {
      id: "model-dummy-1",
      href: "/model/dummy1",
      img: "images/dummy-model-icon.png",
      title: "Dummy Model 1",
      description: "Coming Soon",
      model: "Dummy",
    },
    dummy2: {
      id: "model-dummy-2",
      href: "/model/dummy2",
      img: "images/dummy-model-icon.png",
      title: "Dummy Model 2",
      description: "Coming Soon",
      model: "Dummy",
    },
    dummy3: {
      id: "model-dummy-3",
      href: "/model/dummy3",
      img: "images/dummy-model-icon.png",
      title: "Dummy Model 3",
      description: "Coming Soon",
      model: "Dummy",
    },
  };


  // Filter models based on user access
  // Email, Password buttons in turnitin1 card 
models.forEach((modelKey) => {
  const model = allModelCards[modelKey];
  if (model) {
    const cardDiv = document.createElement("div");
    cardDiv.className = "card";
    cardDiv.id = model.id;
    cardDiv.dataset.model = model.model;

    const img = document.createElement("img");
    img.src = model.img;
    img.alt = `${model.model} Icon`;
    img.className = "card-icon";

    const title = document.createElement("h2");
    const cleanTitle = model.title.replace(/\s\d+$/, "");
    title.textContent = cleanTitle;

    const desc = document.createElement("p");
    desc.textContent = model.description;

    cardDiv.appendChild(img);
    cardDiv.appendChild(title);
    cardDiv.appendChild(desc);

    if (modelKey === "turnitin1") {
      // Disable pointer/hover on the entire card
      cardDiv.style.cursor = "default";
      cardDiv.onmouseenter = null;
      cardDiv.onmouseleave = null;

      // --- Custom: Two copy buttons with tooltip, pulse, checkmark, and blur feedback ---
      const btnEmail = document.createElement("button");
      btnEmail.textContent = "Copy Email";
      btnEmail.className = "copy-btn";
      btnEmail.title = "Click to copy";                  // Tooltip on hover
      btnEmail.dataset.value = "tabishmalik0049@gmail.com"; // (Replace dynamically as needed)

      btnEmail.addEventListener("click", () => {
        navigator.clipboard.writeText(btnEmail.dataset.value);

        // 1) Change text + add checkmark
        btnEmail.textContent = "Copied Email! ✅";

        // 2) Add darker‐on‐click + pulse animation
        btnEmail.classList.add("clicked", "pulse");

        // 3) Blur the card briefly
        cardDiv.classList.add("blur");

        // 4) After 1 second, revert everything
        setTimeout(() => {
          btnEmail.classList.remove("clicked", "pulse");
          cardDiv.classList.remove("blur");
          btnEmail.textContent = "Copy Email";
        }, 1000);
      });

      const btnPass = document.createElement("button");
      btnPass.textContent = "Copy Password";
      btnPass.className = "copy-btn";
      btnPass.title = "Click to copy";                    // Tooltip on hover
      btnPass.dataset.value = "Plag@123";                  // (Replace dynamically as needed)

      btnPass.addEventListener("click", () => {
        navigator.clipboard.writeText(btnPass.dataset.value);

        // 1) Change text + add checkmark
        btnPass.textContent = "Copied Password! ✅";

        // 2) Add darker‐on‐click + pulse animation
        btnPass.classList.add("clicked", "pulse");

        // 3) Blur the card briefly
        cardDiv.classList.add("blur");

        // 4) After 1 second, revert everything
        setTimeout(() => {
          btnPass.classList.remove("clicked", "pulse");
          cardDiv.classList.remove("blur");
          btnPass.textContent = "Copy Password";
        }, 1000);
      });

      cardDiv.appendChild(btnEmail);
      cardDiv.appendChild(btnPass);

      const singleLink = document.createElement("a");
      singleLink.href = model.href;
      singleLink.target = "_blank";
      singleLink.rel = "noopener noreferrer";
      singleLink.className = "model-link";
      singleLink.textContent = "Go to Turnitin Tool";

      cardDiv.appendChild(singleLink);
      modelLinksContainer.appendChild(cardDiv);
    } else {
      // --- Default card with full link (unchanged) ---
      const note = document.createElement("p");
      note.textContent = "Use your Snip Text login to access this tool.";
      note.className = "card-note";

      const cardLink = document.createElement("a");
      cardLink.href = model.href;
      cardLink.target = "_blank";
      cardLink.rel = "noopener noreferrer";
      cardLink.className = "card-link";

      cardDiv.appendChild(note);
      cardLink.appendChild(cardDiv);
      modelLinksContainer.appendChild(cardLink);
    }
  }
});

});
