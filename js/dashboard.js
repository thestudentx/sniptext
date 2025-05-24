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

  const { email, accessDuration, models } = decodedPayload;
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
      href: "/model/turnitin1",
      img: "images/turnitin-logo.png",
      title: "Turnitin 1",
      description: "Plagiarism Check & Remove",
      model: "Turnitin",
    },
    turnitin2: {
      id: "model-turnitin-2",
      href: "/model/turnitin2",
      img: "images/turnitin-logo.png",
      title: "Turnitin 2",
      description: "Plagiarism Check & Remove",
      model: "Turnitin",
    },
    turnitin3: {
      id: "model-turnitin-3",
      href: "/model/turnitin3",
      img: "images/turnitin-logo.png",
      title: "Turnitin 3",
      description: "Plagiarism Check & Remove",
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

  models.forEach((modelKey) => {
    const model = allModelCards[modelKey];
    if (model) {
      const cardLink = document.createElement("a");
      cardLink.href = model.href;
      cardLink.className = "card-link";

      const cardDiv = document.createElement("div");
      cardDiv.className = "card";
      cardDiv.id = model.id;
      cardDiv.dataset.model = model.model;

      const img = document.createElement("img");
      img.src = model.img;
      img.alt = `${model.model} Icon`;
      img.className = "card-icon";

      const title = document.createElement("h2");
      title.textContent = model.title;

      const desc = document.createElement("p");
      desc.textContent = model.description;

      cardDiv.appendChild(img);
      cardDiv.appendChild(title);
      cardDiv.appendChild(desc);
      cardLink.appendChild(cardDiv);
      modelLinksContainer.appendChild(cardLink);
    }
  });
});
