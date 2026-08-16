/**
 * ==========================================================================
 * WELYQO AI ASSISTANT — ULTIMATE CONCIERGE ENGINE (welyqo-ai.js)
 * ==========================================================================
 */

(function () {
  'use strict';

  // State Management
  const STORAGE_KEY = 'welyqo_ai_chat_v2';
  let chatHistory = [];
  let currentQuizStep = 0;
  let quizData = { type: '', goal: '', timeline: '' };
  let isRecording = false;
  let recognition = null;

  // Initializing Web Speech API if supported
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
  }

  // Quick Prompt Chips (NO PRICES)
  const QUICK_PROMPTS = [
    '⚡ Take 30-Sec Business Quiz',
    '📋 Custom Solution Builder',
    '🌐 Turnaround & Launch Time',
    '🤖 How does 24/7 AI Chatbot work?',
    '📞 Book a Free 15-Min Call'
  ];

  // DOM Elements Initialization
  function initAI() {
    const fab = document.getElementById('assistantFab');
    const panel = document.getElementById('assistantPanel');
    const body = document.getElementById('assistantBody');
    const quick = document.getElementById('assistantQuick');
    const form = document.getElementById('assistantForm');
    const input = document.getElementById('assistantInput');
    const micBtn = document.getElementById('micBtn');
    const closeBtn = document.getElementById('closeAssistant');
    const resetBtn = document.getElementById('resetAssistant');

    if (!fab || !panel || !body) return;

    // Load persisted chat memory
    loadChatMemory();

    // Render Quick Chips
    renderQuickChips();

    // Toggle FAB
    fab.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.classList.contains('open') ? closePanel() : openPanel();
    });

    // Close Panel Button
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closePanel();
      });
    }

    // Reset Chat Memory Button
    if (resetBtn) {
      resetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearChatMemory();
      });
    }

    // Outside Click to Close
    document.addEventListener('click', (e) => {
      if (panel.classList.contains('open') && !panel.contains(e.target) && !fab.contains(e.target)) {
        closePanel();
      }
    });

    // Form Submission
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        handleUserMessage(text);
        input.value = '';
      });
    }

    // Voice Input Mic Button
    if (micBtn) {
      if (!recognition) {
        micBtn.style.display = 'none'; // Hide if browser doesn't support Web Speech API
      } else {
        micBtn.addEventListener('click', (e) => {
          e.preventDefault();
          toggleSpeechRecognition();
        });

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          input.value = transcript;
          micBtn.classList.remove('recording');
          isRecording = false;
          handleUserMessage(transcript);
          input.value = '';
        };

        recognition.onerror = () => {
          micBtn.classList.remove('recording');
          isRecording = false;
        };

        recognition.onend = () => {
          micBtn.classList.remove('recording');
          isRecording = false;
        };
      }
    }
  }

  function openPanel() {
    const panel = document.getElementById('assistantPanel');
    const input = document.getElementById('assistantInput');
    if (panel) {
      panel.classList.add('open');
      if (input) setTimeout(() => input.focus(), 300);
    }
  }

  function closePanel() {
    const panel = document.getElementById('assistantPanel');
    if (panel) panel.classList.remove('open');
  }

  function toggleSpeechRecognition() {
    const micBtn = document.getElementById('micBtn');
    if (!recognition) return;

    if (isRecording) {
      recognition.stop();
      if (micBtn) micBtn.classList.remove('recording');
      isRecording = false;
    } else {
      try {
        recognition.start();
        if (micBtn) micBtn.classList.add('recording');
        isRecording = true;
      } catch (err) {
        console.error(err);
      }
    }
  }

  function renderQuickChips() {
    const quick = document.getElementById('assistantQuick');
    if (!quick) return;

    quick.innerHTML = QUICK_PROMPTS.map(p => `<button class="qchip" type="button">${p}</button>`).join('');
    quick.querySelectorAll('.qchip').forEach(chip => {
      chip.addEventListener('click', () => {
        const text = chip.textContent;
        handleUserMessage(text);
      });
    });
  }

  function handleUserMessage(text) {
    appendMsg(text, 'user');
    saveMsg(text, 'user');

    const typingEl = showTyping();

    setTimeout(() => {
      typingEl.remove();
      processBotResponse(text);
    }, 600);
  }

  function processBotResponse(text) {
    const lower = text.toLowerCase();

    // Trigger 1: Business Quiz
    if (lower.includes('quiz') || lower.includes('30-sec') || lower.includes('recommend') || lower.includes('audit')) {
      startQuiz();
      return;
    }

    // Trigger 2: Custom Solution Builder (No Price)
    if (lower.includes('calculate') || lower.includes('calculator') || lower.includes('estimate') || lower.includes('cost') || lower.includes('pricing') || lower.includes('package') || lower.includes('solution') || lower.includes('builder')) {
      showSolutionBuilder();
      return;
    }

    // Trigger 3: Launch / Turnaround Time
    if (lower.includes('fast') || lower.includes('time') || lower.includes('launch') || lower.includes('days') || lower.includes('timeline')) {
      const reply = "⏱️ **Fast 7 to 14 Day Delivery**\n\nOur custom business websites and apps are built & launched in just 7 to 14 days! We handle all design, coding, domain setup, and testing for you.";
      appendMsg(reply, 'bot');
      saveMsg(reply, 'bot');
      return;
    }

    // Trigger 4: 24/7 AI Chatbot / WhatsApp
    if (lower.includes('bot') || lower.includes('whatsapp') || lower.includes('chat') || lower.includes('ai')) {
      const reply = "🤖 **24/7 AI WhatsApp & Web Assistant**\n\nOur AI assistant greets visitors on your website & WhatsApp, answers customer FAQs instantly, collects lead contact details, and notifies your team 24 hours a day!";
      appendMsg(reply, 'bot');
      saveMsg(reply, 'bot');
      return;
    }

    // Trigger 5: Booking / Consultation
    if (lower.includes('book') || lower.includes('consultation') || lower.includes('call') || lower.includes('contact')) {
      const cardHtml = `
        <div class="ai-card">
          <h5>📞 Free 15-Minute Video Call</h5>
          <p>Talk directly with our technology team to discuss your business goals, timeline, and exact budget.</p>
          <a href="#contact" class="btn btn-primary btn-sm" onclick="document.getElementById('assistantPanel').classList.remove('open')" style="width:100%;text-align:center;">Book My Free Call Now</a>
        </div>
      `;
      appendMsg("We'd love to help you scale! Click below to select a time for your free 15-minute consultation:", 'bot', cardHtml);
      saveMsg("Book Free Consultation Card", 'bot');
      return;
    }

    // Default Intelligence Matcher (No Prices)
    let replyText = "We specialize in helping businesses get more customers with tailored technology. Would you like to take our 30-second quiz or build your custom feature checklist?";
    if (lower.includes('website') || lower.includes('store')) {
      replyText = "🌐 **Business Websites & Solutions**\n\nWe offer custom-built options designed around your goals:\n- **Starter**: Essential mobile site & Google Maps setup\n- **Growth**: Web App + 24/7 AI WhatsApp lead assistant\n- **Enterprise / E-Commerce**: Full online store & mobile app suite";
    } else if (lower.includes('app') || lower.includes('mobile')) {
      replyText = "📱 **Custom Mobile Apps**\nWe build iOS & Android apps to keep your customers loyal with push notifications, direct ordering, and reward points.";
    } else if (lower.includes('google') || lower.includes('seo') || lower.includes('ranking')) {
      replyText = "🚀 **Google Maps & Local SEO**\nWe get your business listed at the top of local Google search results so customers in your city find you first!";
    }

    appendMsg(replyText, 'bot');
    saveMsg(replyText, 'bot');
  }

  /* ---------- INTERACTIVE QUIZ WIZARD ---------- */
  function startQuiz() {
    currentQuizStep = 1;
    quizData = { type: '', goal: '', timeline: '' };

    const quizStep1 = `
      <div class="ai-card">
        <h5>⚡ Small Business Audit (Step 1 of 3)</h5>
        <p>What type of business do you operate?</p>
        <div class="ai-quiz-options">
          <button type="button" class="ai-quiz-btn" onclick="window.WelyqoAI.answerQuiz('type', 'Gym / Clinic / Salon / Restaurant / Small Business')">🛍️ Gym / Clinic / Salon / Local Shop <span>→</span></button>
          <button type="button" class="ai-quiz-btn" onclick="window.WelyqoAI.answerQuiz('type', 'Growing Business / Agency / Consultant')">💼 Agency / Consultant / Growing Biz <span>→</span></button>
          <button type="button" class="ai-quiz-btn" onclick="window.WelyqoAI.answerQuiz('type', 'Online Store / Fashion / Electronics')">🛒 E-Commerce / Online Store <span>→</span></button>
          <button type="button" class="ai-quiz-btn" onclick="window.WelyqoAI.answerQuiz('type', 'Ad Campaign / Fast Lead Launch')">⚡ Single Page Campaign / Lead Gen <span>→</span></button>
        </div>
      </div>
    `;
    appendMsg("Let's find the perfect solution for your business in 3 quick questions:", 'bot', quizStep1);
  }

  function answerQuiz(key, value) {
    quizData[key] = value;
    if (key === 'type') {
      currentQuizStep = 2;
      const quizStep2 = `
        <div class="ai-card">
          <h5>🎯 Step 2 of 3: Main Goal</h5>
          <p>What is your single biggest priority right now?</p>
          <div class="ai-quiz-options">
            <button type="button" class="ai-quiz-btn" onclick="window.WelyqoAI.answerQuiz('goal', 'Get More New Customers')">📈 Get More New Customers <span>→</span></button>
            <button type="button" class="ai-quiz-btn" onclick="window.WelyqoAI.answerQuiz('goal', 'Automate WhatsApp & Leads 24/7')">🤖 Automate WhatsApp &amp; Leads 24/7 <span>→</span></button>
            <button type="button" class="ai-quiz-btn" onclick="window.WelyqoAI.answerQuiz('goal', 'Build Mobile Site & Online Store')">🌐 Build Mobile Site &amp; Online Store <span>→</span></button>
            <button type="button" class="ai-quiz-btn" onclick="window.WelyqoAI.answerQuiz('goal', 'Automate Invoices & Stock')">📊 Automate Invoices &amp; Stock <span>→</span></button>
          </div>
        </div>
      `;
      appendMsg(`Great! Got **${value}**. Next question:`, 'bot', quizStep2);
    } else if (key === 'goal') {
      currentQuizStep = 3;
      const quizStep3 = `
        <div class="ai-card">
          <h5>⏱️ Step 3 of 3: Timeline</h5>
          <p>When would you like your new digital system ready?</p>
          <div class="ai-quiz-options">
            <button type="button" class="ai-quiz-btn" onclick="window.WelyqoAI.answerQuiz('timeline', 'Express (1 to 3 Days)')">⚡ Express (1 to 3 Days) <span>→</span></button>
            <button type="button" class="ai-quiz-btn" onclick="window.WelyqoAI.answerQuiz('timeline', 'Standard (7 to 15 Days)')">📅 Standard (7 to 15 Days) <span>→</span></button>
            <button type="button" class="ai-quiz-btn" onclick="window.WelyqoAI.answerQuiz('timeline', 'Just Exploring Options')">💡 Just Exploring Options <span>→</span></button>
          </div>
        </div>
      `;
      appendMsg(`Perfect. Goal: **${value}**. Final question:`, 'bot', quizStep3);
    } else if (key === 'timeline') {
      finishQuiz();
    }
  }

  function finishQuiz() {
    const summaryCard = `
      <div class="ai-card" style="border-color:var(--cyan,#0891b2);">
        <h5>🎉 Recommended Solution</h5>
        <p>Based on your responses for a <strong>${quizData.type}</strong> aiming to <strong>${quizData.goal}</strong> (${quizData.timeline}):</p>
        <div style="background:rgba(37,99,235,0.08);padding:12px;border-radius:12px;margin-bottom:12px;">
          <strong style="color:#2563eb;display:block;margin-bottom:4px;">Growth &amp; Automation Suite</strong>
          <span style="font-size:12px;color:#5b6472;">Includes custom web app, 24/7 AI WhatsApp Chatbot, automated billing &amp; 1-year managed support.</span>
        </div>
        <a href="#contact" class="btn btn-primary btn-sm" onclick="document.getElementById('assistantPanel').classList.remove('open')" style="width:100%;text-align:center;">Claim Your Free Strategy Call</a>
      </div>
    `;
    appendMsg("Here is your personalized small business recommendation:", 'bot', summaryCard);
  }

  /* ---------- CUSTOM SOLUTION BUILDER (NO HARDCODED PRICES) ---------- */
  function showSolutionBuilder() {
    const calcCard = `
      <div class="ai-card">
        <h5>📋 Custom Solution Builder</h5>
        <p>Select the features your business needs for a tailored strategy:</p>
        <div class="ai-calc-widget">
          <div class="calc-row">
            <label><input type="checkbox" checked> Mobile-Optimized Website</label>
            <span class="cost" style="color:var(--blue);font-weight:600;">Included</span>
          </div>
          <div class="calc-row">
            <label><input type="checkbox" checked> 24/7 AI WhatsApp Lead Assistant</label>
            <span class="cost" style="color:var(--blue);font-weight:600;">Included</span>
          </div>
          <div class="calc-row">
            <label><input type="checkbox"> Invoicing &amp; Stock Software</label>
            <span class="cost" style="color:var(--blue);font-weight:600;">Optional</span>
          </div>
          <div class="calc-row">
            <label><input type="checkbox"> Branded iOS &amp; Android App</label>
            <span class="cost" style="color:var(--blue);font-weight:600;">Optional</span>
          </div>
        </div>
        <a href="#contact" class="btn btn-primary btn-sm" onclick="document.getElementById('assistantPanel').classList.remove('open')" style="width:100%;text-align:center;margin-top:12px;">Get Tailored Consultation</a>
      </div>
    `;
    appendMsg("Here is your custom solution builder:", 'bot', calcCard);
  }

  function recalcCost() {
    // Legacy helper stub maintained for backwards compatibility
  }

  /* ---------- MESSAGE RENDERERS ---------- */
  function appendMsg(text, who, extraHtml = '') {
    const body = document.getElementById('assistantBody');
    if (!body) return;

    const el = document.createElement('div');
    el.className = 'msg ' + who;

    // Convert markdown bolding (**text**) to <strong>
    const formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    el.innerHTML = formatted + (extraHtml ? extraHtml : '');

    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
  }

  function showTyping() {
    const body = document.getElementById('assistantBody');
    const el = document.createElement('div');
    el.className = 'msg bot typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    if (body) {
      body.appendChild(el);
      body.scrollTop = body.scrollHeight;
    }
    return el;
  }

  /* ---------- MEMORY PERSISTENCE ---------- */
  function saveMsg(text, who) {
    chatHistory.push({ text, who, time: new Date().toISOString() });
    if (chatHistory.length > 30) chatHistory.shift();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory));
    } catch (e) {}
  }

  function loadChatMemory() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        chatHistory = JSON.parse(saved);
        if (chatHistory.length > 0) {
          const body = document.getElementById('assistantBody');
          if (body) body.innerHTML = ''; // Clear default initial greeting
          chatHistory.forEach(item => {
            appendMsg(item.text, item.who);
          });
          return;
        }
      }
    } catch (e) {}

    // Default welcome message if no history
    appendMsg("👋 **Hi! I'm Welyqo AI.**\n\nI help small business owners build custom websites, mobile apps, and 24/7 AI lead assistants. How can I help your business today?", 'bot');
  }

  function clearChatMemory() {
    chatHistory = [];
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    const body = document.getElementById('assistantBody');
    if (body) body.innerHTML = '';
    appendMsg("👋 **Chat memory reset.** How can I help your small business today?", 'bot');
  }

  // Public API Namespace for inline onclick attributes
  window.WelyqoAI = {
    answerQuiz: answerQuiz,
    recalcCost: recalcCost,
    startQuiz: startQuiz,
    showPriceCalculator: showSolutionBuilder,
    openPanel: openPanel,
    closePanel: closePanel
  };

  // Run initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAI);
  } else {
    initAI();
  }
})();
