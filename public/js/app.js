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
      let numbers = val.replace(/\D/g, '');

      if (!numbers.startsWith('998')) {
        numbers = '998' + numbers;
      }

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
      if (e.key === 'Backspace' && phoneInput.value.length <= 5) {
        e.preventDefault();
      }
    });
  }

  // -------------------------------------------------------------
  // 5. Smooth Scroll to Form
  // -------------------------------------------------------------
  const scrollToFormBtns = document.querySelectorAll('.scroll-to-form');
  const formSection = document.getElementById('leadSection');
  const destInput = document.getElementById('leadDestination');

  scrollToFormBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          if (destInput) destInput.focus();
        }, 450);
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
      if (heroBottom < 100) {
        stickyCta.style.display = 'block';
      } else {
        stickyCta.style.display = 'none';
      }
    });
  }

  // -------------------------------------------------------------
  // 7. Lead Form Validation & AJAX Submission
  // -------------------------------------------------------------
  const leadForm = document.getElementById('leadForm');
  const submitBtn = document.getElementById('submitLeadBtn');
  const nameInput = document.getElementById('leadName');

  const destError = document.getElementById('leadDestinationError');
  const nameError = document.getElementById('leadNameError');
  const phoneError = document.getElementById('leadPhoneError');

  const successModal = document.getElementById('successModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');

  function validateForm() {
    let isValid = true;
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.uz;

    // Validate Destination
    if (!destInput.value.trim()) {
      destInput.classList.add('is-invalid');
      destError.textContent = dict.errorDest;
      destError.classList.add('active');
      isValid = false;
    } else {
      destInput.classList.remove('is-invalid');
      destError.classList.remove('active');
    }

    // Validate Name
    if (!nameInput.value.trim()) {
      nameInput.classList.add('is-invalid');
      nameError.textContent = dict.errorName;
      nameError.classList.add('active');
      isValid = false;
    } else {
      nameInput.classList.remove('is-invalid');
      nameError.classList.remove('active');
    }

    // Validate Phone (+998 XX XXX-XX-XX = 12 digits minimum)
    const phoneDigits = phoneInput.value.replace(/\D/g, '');
    if (phoneDigits.length < 12) {
      phoneInput.classList.add('is-invalid');
      phoneError.textContent = dict.errorPhone;
      phoneError.classList.add('active');
      isValid = false;
    } else {
      phoneInput.classList.remove('is-invalid');
      phoneError.classList.remove('active');
    }

    return isValid;
  }

  // Real-time error clearance on input
  if (destInput) {
    destInput.addEventListener('input', () => {
      if (destInput.value.trim()) {
        destInput.classList.remove('is-invalid');
        destError.classList.remove('active');
      }
    });
  }

  if (nameInput) {
    nameInput.addEventListener('input', () => {
      if (nameInput.value.trim()) {
        nameInput.classList.remove('is-invalid');
        nameError.classList.remove('active');
      }
    });
  }

  if (phoneInput) {
    phoneInput.addEventListener('input', () => {
      const phoneDigits = phoneInput.value.replace(/\D/g, '');
      if (phoneDigits.length === 12) {
        phoneInput.classList.remove('is-invalid');
        phoneError.classList.remove('active');
      }
    });
  }

  // Handle Form Submission
  if (leadForm) {
    leadForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Check Honeypot spam trap
      const honeypot = document.getElementById('hpWebsite');
      if (honeypot && honeypot.value.trim() !== '') {
        console.warn('Bot submission blocked');
        showSuccess();
        return;
      }

      if (!validateForm()) {
        return;
      }

      const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.uz;
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.textContent = dict.formSubmitting;

      const payload = {
        name: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        destination: destInput.value.trim(),
        language: currentLang,
        utm_source: utmData.utm_source || 'direct',
        utm_medium: utmData.utm_medium || '',
        utm_campaign: utmData.utm_campaign || '',
        utm_term: utmData.utm_term || '',
        utm_content: utmData.utm_content || '',
        submitted_at: new Date().toISOString()
      };

      try {
        const response = await fetch('/api/lead', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok && result.success) {
          showSuccess();
          leadForm.reset();
        } else {
          alert(result.error || dict.errorServer);
        }
      } catch (err) {
        console.error('Submission error:', err);
        alert(dict.errorServer);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }

  // -------------------------------------------------------------
  // 8. Success Modal
  // -------------------------------------------------------------
  function showSuccess() {
    if (successModal) {
      successModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function hideSuccess() {
    if (successModal) {
      successModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', hideSuccess);
  }

  if (successModal) {
    successModal.addEventListener('click', (e) => {
      if (e.target === successModal) {
        hideSuccess();
      }
    });
  }
});
