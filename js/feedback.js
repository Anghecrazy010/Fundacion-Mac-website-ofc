(function () {
  var form = document.getElementById('feedback-form');
  var button = document.getElementById('feedback-submit');
  var status = document.getElementById('feedback-status');
  var pending = null;
  function inform(message, state) { status.textContent = message; status.dataset.state = state; }
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (button.disabled || !form.reportValidity()) return;
    var endpoint = (window.MAC_CONFIG || {}).feedbackEndpoint;
    if (!endpoint) { inform('El buzón todavía no está configurado. Inténtalo más adelante.', 'error'); return; }
    var fields = new FormData(form);
    var payload = { nombre: fields.get('nombre').trim(), categoria: fields.get('categoria'), mensaje: fields.get('mensaje').trim(), website: fields.get('website') };
    if (payload.mensaje.length < 10) { inform('Escribe al menos 10 caracteres, sin contar espacios al inicio o al final.', 'error'); return; }
    var fingerprint = JSON.stringify(payload);
    if (!pending || pending.fingerprint !== fingerprint) pending = { fingerprint: fingerprint, id: crypto.randomUUID() };
    payload.id = pending.id;
    button.disabled = true; button.textContent = 'Enviando…'; form.setAttribute('aria-busy', 'true');
    inform('Estamos guardando tu sugerencia…', 'pending');
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 25000);
    try {
      var response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal, credentials: 'omit' });
      var data = await response.json();
      if (!response.ok || data.ok !== true) {
        var messages = { not_configured: 'El buzón todavía no está configurado.', invalid_input: 'Revisa los campos e inténtalo de nuevo.', forbidden: 'Este sitio no está autorizado para enviar sugerencias.' };
        throw new Error(messages[data.error] || 'No pudimos confirmar el guardado. Puedes reintentar con el mismo mensaje sin duplicarlo.');
      }
      form.reset(); pending = null;
      inform('¡Gracias! Tu sugerencia quedó guardada.', 'success');
    } catch (error) {
      inform(error.name === 'AbortError' || error instanceof TypeError ? 'No pudimos confirmar el envío. Revisa tu conexión y reintenta; conservamos tu mensaje.' : error.message, 'error');
    } finally {
      clearTimeout(timeout); button.disabled = false; button.textContent = 'Enviar sugerencia'; form.removeAttribute('aria-busy');
    }
  });
})();
