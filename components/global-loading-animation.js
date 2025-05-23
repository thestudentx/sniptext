// Show loading overlay
function showLoader() {
  document.getElementById('global-loader').style.display = 'flex';
  document.body.classList.add('no-interaction');
}

// Hide loading overlay
function hideLoader() {
  document.getElementById('global-loader').style.display = 'none';
  document.body.classList.remove('no-interaction');
}
