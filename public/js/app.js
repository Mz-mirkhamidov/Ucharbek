// Main Application Logic for Ucharbek Landing Page
document.addEventListener('DOMContentLoaded', () => {
  let currentLang = 'uz';

  // -------------------------------------------------------------
  // 1. Language Switcher (i18n)
  // -------------------------------------------------------------
  const langButtons = document.querySelectorAll('.lang-btn');

  function setLanguage(lang) {
    if (!TRANSLATIONS[lang]) lang = 'uz';
    currentLang = lang;
    localStorage.setItem('ucharbek_lang', lang);
    document.documentElement.lang = lang;

    // Update active button state
    langButtons.forEach(btn => {
      if (btn.getAttribute('data-lang') === lang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const dict = TRANSLATIONS[lang];

    // Translate all data-i18n text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key]) {
        el.setAttribute('placeholder', dict[key]);
      }
    });

    // Translate select options
    document.querySelectorAll('[data-i18n-option]').forEach(el => {
      const key = el.getAttribute('data-i18n-option');
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });
  }

  // Check URL query param ?lang= or saved localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const paramLang = urlParams.get('lang');
  const savedLang = localStorage.getItem('ucharbek_lang');
  if (paramLang && ['uz', 'ru', 'en'].includes(paramLang.toLowerCase())) {
    setLanguage(paramLang.toLowerCase());
  } else if (savedLang && ['uz', 'ru', 'en'].includes(savedLang)) {
    setLanguage(savedLang);
  } else {
    setLanguage('uz');
  }

  langButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      setLanguage(btn.getAttribute('data-lang'));
    });
  });

  // -------------------------------------------------------------
  // 2. UTM Parameter Extraction & Storage
  // -------------------------------------------------------------
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  const utmData = {};

  utmKeys.forEach(key => {
    const val = urlParams.get(key);
    if (val) {
      utmData[key] = val;
      sessionStorage.setItem('ucharbek_' + key, val);
    } else {
      const cached = sessionStorage.getItem('ucharbek_' + key);
      if (cached) utmData[key] = cached;
    }
  });

  // -------------------------------------------------------------
  // 3. Log Visit to Backend SQLite Counter
  // -------------------------------------------------------------
  try {
    fetch('/api/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referrer: document.referrer || 'direct',
        utm_source: utmData.utm_source || 'direct',
        utm_campaign: utmData.utm_campaign || '',
        path: window.location.pathname
      })
    }).catch(() => {
      // Background ping, fail silently
    });
  } catch (e) {}

  // -------------------------------------------------------------
  // 4. Uzbekistan Phone Number Mask (+998)
  // -------------------------------------------------------------
  const phoneInput = document.getElementById('leadPhone');

  if (phoneInput) {
    phoneInput.addEventListener('focus', () => {
      if (!phoneInput.value.trim()) {
        phoneInput.value = '+998 ';
      }
    });

    phoneInput.addEventListener('input', (e) => {
      let val = phoneInput.value;
      // Extract digits only
      let numbers = val.replace(/\D/g, '');

      // Ensure it starts with 998
      if (!numbers.startsWith('998')) {
        numbers = '998' + numbers;
      }

      // Max 12 digits (998 + 9 digits)
      numbers = numbers.substring(0, 12);

      let formatted = '+998';
      const rest = numbers.substring(3);

      if (rest.length > 0) {
        formatted += ' (' + rest.substring(0, 2);
      }
      if (rest.length >= 2) {
        formatted += ') ' + rest.substring(2, 5);
      }
      if (rest.length >= 5) {
        formatted += '-' + rest.substring(5, 7);
      }
      if (rest.length >= 7) {
        formatted += '-' + rest.substring(7, 9);
      }

      phoneInput.value = formatted;
    });

    phoneInput.addEventListener('keydown', (e) => {
      // Don't allow deleting "+998 " prefix with backspace if at start
      if (e.key === 'Backspace' && phoneInput.value.length <= 5) {
        e.preventDefault();
      }
    });
  }

  // -------------------------------------------------------------
  // 5. Smooth Scroll to Form & Quick Destination Chips
  // -------------------------------------------------------------
  const scrollToFormBtns = document.querySelectorAll('.scroll-to-form');
  const formSection = document.getElementById('leadSection');
  const destInput = document.getElementById('leadDestination');
  const allDestChips = document.querySelectorAll('.dest-chip, .dest-chip-sm');

  function selectDestination(destName) {
    if (destInput && destName) {
      destInput.value = destName;
      // Remove validation error if active
      destInput.classList.remove('is-invalid');
      const errEl = document.getElementById('leadDestinationError');
      if (errEl) errEl.classList.remove('active');

      // Update active highlight on all chips with matching data-dest
      allDestChips.forEach(c => {
        if (c.getAttribute('data-dest') === destName) {
          c.classList.add('active');
        } else {
          c.classList.remove('active');
        }
      });
    }
  }

  allDestChips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      const destName = chip.getAttribute('data-dest');
      selectDestination(destName);

      // If clicked from hero section, scroll to form and focus name
      if (chip.classList.contains('dest-chip') && formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          const nameInput = document.getElementById('leadName');
          if (nameInput) nameInput.focus();
        }, 450);
      } else {
        // If clicked inside form, focus name input next
        const nameInput = document.getElementById('leadName');
        if (nameInput) nameInput.focus();
      }
    });
  });

  // When user types manually into destination input, clear active chips unless exact match
  if (destInput) {
    destInput.addEventListener('input', () => {
      const val = destInput.value.trim().toLowerCase();
      allDestChips.forEach(c => {
        if (c.getAttribute('data-dest').toLowerCase() === val) {
          c.classList.add('active');
        } else {
          c.classList.remove('active');
        }
      });
    });
  }

  scrollToFormBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          if (destInput) destInput.focus();
        }, 500);
      }
    });
  });

  // -------------------------------------------------------------
  // 6. Sticky Mobile CTA visibility on scroll
  // -------------------------------------------------------------
  const stickyCta = document.querySelector('.sticky-mobile-cta');
  const heroSection = document.querySelector('.hero-section');

  if (stickyCta && heroSection) {
    window.addEventListener('scroll', () => {
      const heroBottom = heroSection.getBoundingClientRect().bottom;
      const formTop = formSection.getBoundingClientRect().top;
      const formBottom = formSection.getBoundingClientRect().bottom;

      // Show after leaving hero, but hide when form is currently in view to avoid duplication
      if (heroBottom < 0 && (formTop > window.innerHeight || formBottom < 0)) {
        stickyCta.style.display = 'block';
      } else {
        stickyCta.style.display = 'none';
      }
    }, { passive: true });
  }

  // -------------------------------------------------------------
  // 7. Lead Form Submission & Validation
  // -------------------------------------------------------------
  const leadForm = document.getElementById('leadForm');
  const submitBtn = document.getElementById('submitLeadBtn');
  const modal = document.getElementById('successModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');

  function clearErrors() {
    document.querySelectorAll('.form-control').forEach(el => el.classList.remove('is-invalid'));
    document.querySelectorAll('.field-error').forEach(el => el.classList.remove('active'));
  }

  function showError(fieldId, errorMsgKey) {
    const field = document.getElementById(fieldId);
    const errorEl = document.getElementById(fieldId + 'Error');
    const dict = TRANSLATIONS[currentLang];

    if (field) field.classList.add('is-invalid');
    if (errorEl) {
      errorEl.textContent = dict[errorMsgKey] || 'Maydonni to\'ldiring';
      errorEl.classList.add('active');
    }
  }

  if (leadForm) {
    leadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors();

      const name = document.getElementById('leadName').value.trim();
      const phone = document.getElementById('leadPhone').value.trim();
      const destination = document.getElementById('leadDestination').value.trim();
      const honeypot = document.getElementById('hpWebsite') ? document.getElementById('hpWebsite').value : '';

      // Check anti-spam honeypot
      if (honeypot) {
        console.warn('Spam detected via honeypot');
        return;
      }

      let hasError = false;

      // Validate Name
      if (!name || name.length < 2) {
        showError('leadName', 'errorName');
        hasError = true;
      }

      // Validate Phone: must have at least 9 digits after +998
      const phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits.length < 12) {
        showError('leadPhone', 'errorPhone');
        hasError = true;
      }

      // Validate Destination
      if (!destination || destination.length < 2) {
        showError('leadDestination', 'errorDest');
        hasError = true;
      }

      if (hasError) return;

      // Submit state
      const dict = TRANSLATIONS[currentLang];
      const originalBtnText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = dict.formSubmitting || 'Yuborilmoqda...';

      const payload = {
        name,
        phone,
        destination,
        language: currentLang,
        utm_source: utmData.utm_source || 'direct',
        utm_medium: utmData.utm_medium || '',
        utm_campaign: utmData.utm_campaign || '',
        utm_content: utmData.utm_content || '',
        utm_term: utmData.utm_term || '',
        referrer: document.referrer || 'direct'
      };

      try {
        const response = await fetch('/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Trigger Meta Pixel if present
          if (typeof window.fbq === 'function') {
            window.fbq('track', 'Lead', {
              content_name: destination,
              status: 'success'
            });
          }

          // Reset form
          leadForm.reset();
          phoneInput.value = '';

          // Show success modal
          if (modal) {
            modal.classList.add('active');
          }
        } else {
          alert(result.error || dict.errorServer);
        }
      } catch (err) {
        console.error('Lead submission error:', err);
        alert(dict.errorServer);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    });
  }

  // Modal Close handler
  if (modalCloseBtn && modal) {
    modalCloseBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  }
});
