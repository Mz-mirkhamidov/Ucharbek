// Variant Switcher for Client Live Preview (Variant A, B, C)
(function() {
  const DEFAULT_VARIANT = 'variant-a';
  const STORAGE_KEY = 'ucharbek_theme_variant';

  // Check URL query param first (?variant=a | b | c), then localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const paramVariant = urlParams.get('variant');
  let currentVariant = DEFAULT_VARIANT;

  if (paramVariant && ['a', 'b', 'c'].includes(paramVariant.toLowerCase())) {
    currentVariant = 'variant-' + paramVariant.toLowerCase();
  } else {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ['variant-a', 'variant-b', 'variant-c'].includes(saved)) {
      currentVariant = saved;
    }
  }

  function applyVariant(variant) {
    document.body.classList.remove('variant-a', 'variant-b', 'variant-c');
    document.body.classList.add(variant);
    localStorage.setItem(STORAGE_KEY, variant);

    // Update active button state
    document.querySelectorAll('.variant-btn').forEach(btn => {
      const target = btn.getAttribute('data-variant');
      if (target === variant) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Initial apply
  applyVariant(currentVariant);

  // Attach button click listeners
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.variant-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const selected = btn.getAttribute('data-variant');
        applyVariant(selected);
      });
    });
  });

  window.ucharbekSetVariant = applyVariant;
})();
