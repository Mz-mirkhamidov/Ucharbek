// Main Application Logic for Ucharbek Landing Page
document.addEventListener('DOMContentLoaded', () => {
  let currentLang = 'uz';

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

  // Preload all destination images immediately
  slides.forEach(s => {
    const img = s.querySelector('img');
    if (img && img.src) {
      const p = new Image();
      p.src = img.src;
    }
  });

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
    let lastValue = phoneInput.value || '';

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

    function getCursorPosFromDigitsCount(formattedStr, targetDigits) {
      if (targetDigits <= 0) return 5;
      let count = 0;
      for (let i = 0; i < formattedStr.length; i++) {
        if (/\d/.test(formattedStr[i])) {
          count++;
          if (count === targetDigits + 3) {
            return i + 1;
          }
        }
      }
      return formattedStr.length;
    }

    phoneInput.addEventListener('focus', () => {
      if (!phoneInput.value.trim()) {
        phoneInput.value = '+998 ';
        lastValue = phoneInput.value;
      }
    });

    phoneInput.addEventListener('blur', () => {
      const trimmed = phoneInput.value.trim();
      if (trimmed === '+998' || trimmed === '+998 ' || trimmed === '+998 (' || trimmed === '+998 ()') {
        phoneInput.value = '';
        lastValue = '';
      }
    });

    phoneInput.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        const start = phoneInput.selectionStart;
        const end = phoneInput.selectionEnd;

        // Prevent deleting "+998" prefix
        if (start <= 5 && end <= 5) {
          e.preventDefault();
          phoneInput.setSelectionRange(5, 5);
          return;
        }

        // If single cursor (no text highlighted)
        if (start === end && start > 5) {
          const val = phoneInput.value;
          const charBefore = val[start - 1];

          // If the character immediately before cursor is a separator ( ) - space )
          if (charBefore && /\D/.test(charBefore)) {
            e.preventDefault();

            // Count how many user digits exist before this cursor
            let digitsBefore = 0;
            for (let i = 0; i < start; i++) {
              if (/\d/.test(val[i])) {
                digitsBefore++;
              }
            }

            // Exclude the 3 digits of '998'
            const uzDigitsBefore = digitsBefore - 3;
            if (uzDigitsBefore > 0) {
              const allDigits = cleanUzbekDigits(val);
              // Delete the digit that precedes this separator
              const newDigits = allDigits.substring(0, uzDigitsBefore - 1) + allDigits.substring(uzDigitsBefore);
              const formatted = formatUzbekPhone(newDigits);
              phoneInput.value = formatted;
              lastValue = formatted;
              const newCursor = getCursorPosFromDigitsCount(formatted, uzDigitsBefore - 1);
              phoneInput.setSelectionRange(newCursor, newCursor);
            }
          }
        }
      }
    });

    phoneInput.addEventListener('input', (e) => {
      let val = phoneInput.value;

      // Handle mobile virtual keyboards where keydown might not fire
      // If characters were deleted but digit count stayed identical, a delimiter was deleted
      const prevDigits = cleanUzbekDigits(lastValue);
      let curDigits = cleanUzbekDigits(val);

      if (val.length < lastValue.length && curDigits.length === prevDigits.length && prevDigits.length > 0) {
        // User pressed backspace over a delimiter on mobile: drop the last digit
        curDigits = curDigits.substring(0, curDigits.length - 1);
      }

      // Count digits before current cursor to restore cursor position accurately
      const cursorPos = phoneInput.selectionStart || val.length;
      let digitsBeforeCursor = 0;
      for (let i = 0; i < Math.min(cursorPos, val.length); i++) {
        if (/\d/.test(val[i])) {
          digitsBeforeCursor++;
        }
      }

      let uzDigitsBefore = Math.max(0, digitsBeforeCursor - 3);
      if (uzDigitsBefore > curDigits.length) uzDigitsBefore = curDigits.length;

      const formatted = formatUzbekPhone(curDigits);
      phoneInput.value = formatted;
      lastValue = formatted;

      const newCursor = getCursorPosFromDigitsCount(formatted, uzDigitsBefore);
      phoneInput.setSelectionRange(newCursor, newCursor);
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
