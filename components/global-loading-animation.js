function showLoader() {
  document.getElementById("global-loader").style.display = "flex";
  document.body.classList.add("no-interaction");
}

function hideLoader() {
  document.getElementById("global-loader").style.display = "none";
  document.body.classList.remove("no-interaction");
}

function showLoginMessage(message, isSuccess = true, duration = 3000) {
  const box = document.getElementById('login-message-box');
  box.textContent = message;
  box.style.backgroundColor = isSuccess ? 'var(--color-primary)' : 'var(--color-used-often)';
  box.classList.remove('hide');
  box.classList.add('show');

  setTimeout(() => {
    box.classList.remove('show');
    box.classList.add('hide');
  }, duration);
}
