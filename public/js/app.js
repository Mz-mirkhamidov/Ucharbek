// Main Application Logic for Ucharbek Landing Page
document.addEventListener('DOMContentLoaded', () => {
  let currentLang = 'uz';

  // Record when the form was rendered, used together with the honeypot
  // field to tell real (slow, human) submissions from bot/script submissions.
  // A hidden field is used instead of a plain JS variable so the value
  // survives even if this script re-runs or is read from elsewhere.
  const formRenderedAtInput = document.getElementById('formRenderedAt');
  if (formRenderedAtInput) {
    formRenderedAtInput.value = String(Date.now());
  }

  // -------------------------------------------------------------
  // 1. Language Switcher (i18n)
  // -------------------------------------------------------------
  const langButtons = document.querySelectorAll('.lang-btn');

  function updateSlideTranslations(dict) {
    if (!dict || !dict.slides) return;
    dict.slides.forEach((slideData, idx) => {
      const titleEl = document.querySelector(`[data-slide-title="${idx}"]`);
      const subEl = document.querySelector(`[data-slide-sub="${idx}"]`);
      if (titleEl && slideData.title) titleEl.textContent = slideData.title;
      if (subEl && slideData.sub) subEl.textContent = slideData.sub;
    });
  }

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

    // Update destination slide texts
    updateSlideTranslations(dict);
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
    }).catch(() => {});
  } catch (e) {}

  // -------------------------------------------------------------
    // -------------------------------------------------------------
  // 4. 5-Second Automated Destination Carousel
  // -------------------------------------------------------------
  const carouselEl = document.getElementById('heroCarousel');
  const slides = document.querySelectorAll('.carousel-slide');
  const dots = document.querySelectorAll('.carousel-dot');
  let currentSlideIndex = 0;
  let carouselInterval = null;

  // Preload subsequent slides during browser idle time so initial paint is instantaneous
  const preloadSubsequentSlides = () => {
    slides.forEach((s, idx) => {
      if (idx > 0) {
        const img = s.querySelector('img');
        if (img && img.src) {
          const p = new Image();
          p.src = img.src;
        }
      }
    });
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(preloadSubsequentSlides, { timeout: 2000 });
  } else {
    setTimeout(preloadSubsequentSlides, 1000);
  }

  function goToSlide(index) {
    if (slides.length === 0) return;
    currentSlideIndex = (index + slides.length) % slides.length;

    slides.forEach((slide, idx) => {
      if (idx === currentSlideIndex) {
        slide.classList.add('active');
        slide.style.opacity = '1';
        slide.style.visibility = 'visible';
        slide.style.zIndex = '2';
      } else {
        slide.classList.remove('active');
        slide.style.opacity = '0';
        slide.style.visibility = 'hidden';
        slide.style.zIndex = '1';
      }
    });

    dots.forEach((dot, idx) => {
      if (idx === currentSlideIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  // Ensure initial slide is 100% active and visible
  goToSlide(0);

  function nextSlide() {
    goToSlide(currentSlideIndex + 1);
  }

  function startCarousel() {
    if (carouselInterval) clearInterval(carouselInterval);
    carouselInterval = setInterval(nextSlide, 5000);
  }

  function resetCarouselTimer() {
    startCarousel();
  }


  // Click on dots
  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      const slideIndex = parseInt(dot.getAttribute('data-slide'), 10);
      goToSlide(slideIndex);
      resetCarouselTimer();
    });
  });

  // Touch Swipe support for mobile devices
  if (carouselEl) {
    let startX = 0;
    let endX = 0;

    carouselEl.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });

    carouselEl.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].clientX;
      const diff = startX - endX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) {
          // Swipe left -> next
          goToSlide(currentSlideIndex + 1);
        } else {
          // Swipe right -> prev
          goToSlide(currentSlideIndex - 1);
        }
        resetCarouselTimer();
      }
    }, { passive: true });

    // Optional pause on hover (desktop)
    carouselEl.addEventListener('mouseenter', () => {
      if (carouselInterval) clearInterval(carouselInterval);
    });
    carouselEl.addEventListener('mouseleave', () => {
      startCarousel();
    });
  }

  // Launch the 5-second automated carousel
  startCarousel();

  // -------------------------------------------------------------
  // 5. Uzbekistan Phone Number Mask (+998)
  // -------------------------------------------------------------
  const phoneInput = document.getElementById('leadPhone');

  if (phoneInput) {
    // Simplified, dependency-free mask. The previous version tried to
    // preserve exact cursor position while editing in the middle of the
    // string, using manual character-by-character math on every
    // keystroke — this broke unpredictably on mobile virtual keyboards
    // and especially inside the Instagram/Facebook in-app browser
    // (composition events, autofill, predictive text). This version
    // always formats forward from the raw digits and leaves the cursor
    // at the end, which covers the vast majority of real usage (people
    // type or paste a phone number left-to-right) and is far more
    // robust across browsers/keyboards.
    function cleanUzbekDigits(raw) {
      let digits = (raw || '').replace(/\D/g, '');
      if (digits.startsWith('998')) {
        digits = digits.substring(3);
      } else if (digits.startsWith('8') && digits.length > 9) {
        digits = digits.substring(1);
      }
      return digits.substring(0, 9);
    }

    function formatUzbekPhone(numbers) {
      let res = '+998';
      if (numbers.length > 0) {
        res += ' (' + numbers.substring(0, 2);
      }
      if (numbers.length > 2) {
        res += ') ' + numbers.substring(2, 5);
      } else if (numbers.length === 2) {
        res += ')';
      }
      if (numbers.length > 5) {
        res += '-' + numbers.substring(5, 7);
      }
      if (numbers.length > 7) {
        res += '-' + numbers.substring(7, 9);
      }
      return res;
    }

    phoneInput.addEventListener('focus', () => {
      if (!phoneInput.value.trim()) {
        phoneInput.value = '+998 (';
      }
    });

    phoneInput.addEventListener('blur', () => {
      const digits = cleanUzbekDigits(phoneInput.value);
      if (digits.length === 0) {
        phoneInput.value = '';
      }
    });

    // Prevent deleting the "+998" prefix; every other edit is handled
    // by the 'input' listener below, which re-formats from scratch.
    phoneInput.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && phoneInput.selectionStart <= 5 && phoneInput.selectionEnd <= 5) {
        e.preventDefault();
      }
    });

    phoneInput.addEventListener('input', () => {
      const digits = cleanUzbekDigits(phoneInput.value);
      phoneInput.value = formatUzbekPhone(digits);
    });
  }

  // -------------------------------------------------------------
  // 6. Smooth Scroll to Form
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
  // 7. Sticky Mobile CTA visibility on scroll
  // -------------------------------------------------------------
  const stickyCta = document.querySelector('.sticky-mobile-cta');
  const heroSection = document.querySelector('.hero-section');

  if (stickyCta && heroSection) {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          stickyCta.style.display = entry.isIntersecting ? 'none' : 'block';
        });
      }, { rootMargin: '-60px 0px 0px 0px', threshold: 0 });
      observer.observe(heroSection);
    } else {
      let ticking = false;
      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const heroBottom = heroSection.getBoundingClientRect().bottom;
            stickyCta.style.display = heroBottom < 100 ? 'block' : 'none';
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    }
  }

  // -------------------------------------------------------------
  // 8. Lead Form Validation & AJAX Submission
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

      // Anti-spam check: combine the honeypot with a timing check so that
      // real users are never silently blocked just because a mobile
      // browser/in-app browser autofilled the hidden honeypot field.
      // Only treat the submission as a bot when BOTH signals agree:
      //   1) the honeypot field has a value, AND
      //   2) the form was submitted implausibly fast (a real person
      //      needs at least ~1.5s to read the form and tap into it).
      const honeypot = document.getElementById('hp_check_x7q');
      const honeypotFilled = !!(honeypot && honeypot.value.trim() !== '');
      const renderedAt = parseInt((formRenderedAtInput && formRenderedAtInput.value) || '0', 10);
      const msSinceRender = renderedAt ? (Date.now() - renderedAt) : Infinity;
      const submittedTooFast = msSinceRender < 1500;

      if (honeypotFilled && submittedTooFast) {
        console.warn('Bot submission blocked (honeypot + fast submit)');
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
        submitted_at: new Date().toISOString(),
        // Sent so the server can run the same honeypot+timing check
        // independently, for bots that POST to /api/lead directly and skip
        // this script entirely.
        hp_check_x7q: honeypot ? honeypot.value.trim() : '',
        form_rendered_at: renderedAt || null
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
          if (typeof fbq === 'function') {
            try {
              fbq('track', 'Lead', { content_name: destInput.value.trim() });
            } catch (e) {}
          }
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
  // 9. Success Modal
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
