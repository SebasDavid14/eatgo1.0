// =====================================================
// EATGO - Asistente de IA (Google Gemini API)
// =====================================================

const EATGO_AI = {

  API_KEY : 'AIzaSyDbmVx3iJrDgSZunTP_Eg6-YtinDUAHCDM',
  MODEL   : 'gemini-2.0-flash-lite',
  history : [],

  getSystemPrompt() {
    const products = typeof Storage !== 'undefined'
      ? Storage.getProducts()
          .filter(p => p.activo)
          .map(p => `• ${p.nombre} (${p.categoria}): ${Storage.formatPrice(p.precio)} — ${p.descripcion || ''}`)
          .join('\n')
      : '(sin productos)';

    const user      = typeof Storage !== 'undefined' ? Storage.getCurrentUser() : null;
    const userName  = user ? user.nombre : 'cliente';
    const cartCount = typeof Storage !== 'undefined' ? Storage.getCartCount() : 0;

    return `Eres "EatBot", el asistente virtual de EATGO, app de comida rápida a domicilio colombiana.
Personalidad: amigable, divertido, usa emojis de comida con moderación, habla en español colombiano natural.

MENÚ DE HOY:
${products}

USUARIO: ${userName}  |  ITEMS EN CARRITO: ${cartCount}

PUEDES AYUDAR CON:
- Recomendar platos según el antojo del cliente
- Explicar ingredientes y tamaños
- Informar precios y promociones vigentes
- Guiar el proceso: agregar al carrito → confirmar pedido → rastrear
- Resolver dudas de pago y domicilio

PROMOCIONES ACTIVAS:
- 2x1 en malteadas
- Domicilio gratis en pedidos mayores a $50.000

DATOS OPERATIVOS:
- Tiempo de entrega: 25-45 minutos
- Pagos: Efectivo, Tarjeta crédito/débito, Nequi, Daviplata

REGLAS:
- Respuestas cortas (máximo 3-4 oraciones).
- Si hay items en el carrito, anima a confirmar el pedido.
- No inventes productos fuera del menú.
- Redirige amablemente si preguntan algo ajeno a EATGO.`;
  },

  async sendMessage(userText) {
    // Agregar al historial
    this.history.push({ role: 'user', content: userText });

    // Construir contenido en formato Gemini
    // Construir historial con system prompt en el primer turno
    const contents = [];
    // Primer mensaje lleva el contexto del sistema
    contents.push({
      role : 'user',
      parts: [{ text: this.getSystemPrompt() + '\n\n---\nPrimer mensaje del cliente: ' + this.history[0].content }]
    });
    contents.push({ role: 'model', parts: [{ text: '¡Entendido! Estoy listo para ayudarte como EatBot de EATGO. ¿En qué te puedo ayudar?' }] });
    // Resto del historial (sin el primer mensaje que ya fue incluido)
    for (let i = 1; i < this.history.length; i++) {
      const m = this.history[i];
      contents.push({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.MODEL}:generateContent?key=${this.API_KEY}`;

    const response = await fetch(url, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({
        contents,
        generationConfig: { maxOutputTokens: 400, temperature: 0.8 }
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Error HTTP ' + response.status);
    }

    const data     = await response.json();
    const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text
                     || 'No pude responder en este momento.';

    this.history.push({ role: 'assistant', content: botReply });
    if (this.history.length > 20) this.history = this.history.slice(-20);

    return botReply;
  },

  clearHistory() { this.history = []; }
};

// =====================================================
//  UI DEL CHAT
// =====================================================
(function () {

  function buildWidget() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <button id="eatgo-ai-btn" title="Asistente IA" aria-label="Abrir asistente">🤖</button>

      <div id="eatgo-ai-panel" role="dialog" aria-label="EatBot IA">
        <div class="ai-header">
          <div class="ai-avatar">🤖</div>
          <div class="ai-header-info">
            <div class="ai-name">EatBot IA</div>
            <div class="ai-status">En línea · responde al instante</div>
          </div>
          <button class="ai-header-btn" onclick="EATGO_AI_UI.clearChat()" title="Limpiar">🗑️</button>
          <button class="ai-header-btn" onclick="EATGO_AI_UI.toggle()" title="Cerrar">✕</button>
        </div>

        <div class="ai-messages" id="aiMessages"></div>

        <div class="ai-suggestions" id="aiSuggestions">
          <button class="ai-suggest-btn" onclick="EATGO_AI_UI.quickSend(this)">🍔 ¿Qué recomiendas?</button>
          <button class="ai-suggest-btn" onclick="EATGO_AI_UI.quickSend(this)">💰 Lo más económico</button>
          <button class="ai-suggest-btn" onclick="EATGO_AI_UI.quickSend(this)">🎉 Promociones</button>
          <button class="ai-suggest-btn" onclick="EATGO_AI_UI.quickSend(this)">🛵 Tiempo de entrega</button>
        </div>

        <div class="ai-input-row">
          <textarea id="aiInput" placeholder="Escribe tu pregunta..." rows="1"
            onkeydown="EATGO_AI_UI.handleKey(event)"
            oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,90)+'px'"></textarea>
          <button id="aiSendBtn" onclick="EATGO_AI_UI.send()">➤</button>
        </div>
      </div>`;
    document.body.appendChild(wrapper);
  }

  window.EATGO_AI_UI = {
    isOpen   : false,
    isLoading: false,

    toggle() {
      this.isOpen = !this.isOpen;
      const btn   = document.getElementById('eatgo-ai-btn');
      const panel = document.getElementById('eatgo-ai-panel');
      btn.classList.toggle('open', this.isOpen);
      panel.classList.toggle('open', this.isOpen);
      btn.textContent = this.isOpen ? '✕' : '🤖';
      if (this.isOpen) {
        if (!document.getElementById('aiMessages').children.length) this.showWelcome();
        setTimeout(() => document.getElementById('aiInput').focus(), 350);
      }
    },

    showWelcome() {
      const user = typeof Storage !== 'undefined' ? Storage.getCurrentUser() : null;
      const name = user ? ', ' + user.nombre.split(' ')[0] : '';
      this.addBotMsg('¡Hola' + name + '! 👋 Soy **EatBot**, tu asistente de EATGO. ¿Qué se te antoja hoy? 🍔🍕🥤');
    },

    addBotMsg(text) {
      const msgs = document.getElementById('aiMessages');
      const now  = new Date().toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' });
      const html = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
      const div = document.createElement('div');
      div.className = 'ai-msg bot';
      div.innerHTML = '<div class="ai-msg-avatar">🤖</div><div><div class="ai-msg-bubble">'
        + html + '</div><div class="ai-msg-time">' + now + '</div></div>';
      msgs.appendChild(div);
      this.scrollBottom();
    },

    addUserMsg(text) {
      const msgs = document.getElementById('aiMessages');
      const now  = new Date().toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' });
      const div  = document.createElement('div');
      div.className = 'ai-msg user';
      div.innerHTML = '<div class="ai-msg-avatar">👤</div><div><div class="ai-msg-bubble">'
        + this.esc(text) + '</div><div class="ai-msg-time" style="text-align:right">' + now + '</div></div>';
      msgs.appendChild(div);
      this.scrollBottom();
    },

    showTyping() {
      const msgs = document.getElementById('aiMessages');
      const div  = document.createElement('div');
      div.id = 'aiTyping';
      div.className = 'ai-msg bot ai-typing';
      div.innerHTML = '<div class="ai-msg-avatar">🤖</div><div class="typing-dots"><span></span><span></span><span></span></div>';
      msgs.appendChild(div);
      this.scrollBottom();
    },

    hideTyping() {
      const t = document.getElementById('aiTyping');
      if (t) t.remove();
    },

    scrollBottom() {
      const msgs = document.getElementById('aiMessages');
      setTimeout(() => { msgs.scrollTop = msgs.scrollHeight; }, 60);
    },

    handleKey(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
    },

    quickSend(btn) {
      const text = btn.textContent.replace(/^\S+\s/, '').trim();
      document.getElementById('aiInput').value = text;
      document.getElementById('aiSuggestions').style.display = 'none';
      this.send();
    },

    async send() {
      if (this.isLoading) return;
      const input = document.getElementById('aiInput');
      const text  = input.value.trim();
      if (!text) return;

      this.isLoading = true;
      input.value    = '';
      input.style.height = 'auto';
      document.getElementById('aiSendBtn').disabled = true;

      this.addUserMsg(text);
      this.showTyping();

      try {
        const reply = await EATGO_AI.sendMessage(text);
        this.hideTyping();
        this.addBotMsg(reply);
      } catch (err) {
        this.hideTyping();
        let msg = '😕 Error: ' + err.message;
        if (err.message.includes('API_KEY_INVALID')) msg = '🔑 Clave inválida. Verifica tu clave de Google AI Studio.';
        if (err.message.includes('429'))             msg = '⏳ Demasiadas solicitudes. Espera un momento e intenta de nuevo.';
        this.addBotMsg(msg);
        console.error('EatBot:', err);
      } finally {
        this.isLoading = false;
        document.getElementById('aiSendBtn').disabled = false;
        input.focus();
      }
    },

    clearChat() {
      document.getElementById('aiMessages').innerHTML = '';
      document.getElementById('aiSuggestions').style.display = 'flex';
      EATGO_AI.clearHistory();
      this.showWelcome();
    },

    esc(s) {
      return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildWidget);
  } else {
    buildWidget();
  }

  document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'eatgo-ai-btn') EATGO_AI_UI.toggle();
  });

})();
