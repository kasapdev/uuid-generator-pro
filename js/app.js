/* =====================================================================
   UUID / ULID Generator Pro — app.js
   Generates UUID v4 (native crypto.randomUUID, or a manual RFC4122 v4
   fallback/education mode) and ULID (real from-scratch implementation).
   Classic script (no modules). Depends on window.WUS (core.js).
   ===================================================================== */
(function () {
  'use strict';

  var WUS = window.WUS;
  var STORE_KEY = 'uuidgen.settings';

  /* ----------------------------- DOM refs ---------------------------- */
  var modeUuidBtn  = document.getElementById('mode-uuid');
  var modeUlidBtn  = document.getElementById('mode-ulid');
  var uuidOptionsRow = document.getElementById('uuidOptionsRow');
  var modeHint     = document.getElementById('modeHint');

  var countInput   = document.getElementById('countInput');
  var manualUuidEl = document.getElementById('manualUuid');
  var optHyphens   = document.getElementById('optHyphens');
  var optUppercase = document.getElementById('optUppercase');
  var optBraces    = document.getElementById('optBraces');

  var btnGenerate      = document.getElementById('btnGenerate');
  var btnGenerateEmpty = document.getElementById('btnGenerateEmpty');
  var btnCopyAll   = document.getElementById('btnCopyAll');
  var btnDownload  = document.getElementById('btnDownload');
  var btnClear     = document.getElementById('btnClear');

  var output       = document.getElementById('output');
  var outputStats  = document.getElementById('outputStats');
  var emptyState   = document.getElementById('emptyState');

  var listPanel    = document.getElementById('listPanel');
  var idList       = document.getElementById('idList');
  var listCount    = document.getElementById('listCount');

  var statusBadge  = document.getElementById('statusBadge');
  var statusText   = document.getElementById('statusText');

  var MAX_COUNT = 1000;

  /* Canonical (unformatted) values from the most recent batch. */
  var items = []; // [{ type: 'uuid'|'ulid', value: string }]

  /* =================================================================
     CROCKFORD BASE32 (ULID alphabet — excludes I, L, O, U)
     ================================================================= */
  var CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

  /* Encode a non-negative integer (safe up to 2^53-1) into `len` base32
     chars, most-significant digit first, using division/modulo (avoids
     32-bit bitwise truncation for the 48-bit ULID timestamp). */
  function encodeTimeBase32(time, len) {
    var str = '';
    var now = time;
    for (var i = len; i > 0; i--) {
      var mod = now % 32;
      str = CROCKFORD.charAt(mod) + str;
      now = (now - mod) / 32;
    }
    return str;
  }

  /* Encode a Uint8Array's bits (MSB-first) into base32 chars. For ULID's
     80-bit randomness this yields exactly 16 chars with no padding. */
  function encodeBytesBase32(bytes, charCount) {
    var out = '';
    var bitBuffer = 0;
    var bitCount = 0;
    for (var i = 0; i < bytes.length && out.length < charCount; i++) {
      bitBuffer = ((bitBuffer & ((1 << bitCount) - 1)) << 8) | bytes[i];
      bitCount += 8;
      while (bitCount >= 5 && out.length < charCount) {
        bitCount -= 5;
        out += CROCKFORD.charAt((bitBuffer >> bitCount) & 0x1f);
      }
    }
    if (out.length < charCount && bitCount > 0) {
      out += CROCKFORD.charAt((bitBuffer << (5 - bitCount)) & 0x1f);
    }
    return out;
  }

  function generateUlid() {
    var timePart = encodeTimeBase32(Date.now(), 10);
    var randBytes = crypto.getRandomValues(new Uint8Array(10)); // 80 bits
    var randPart = encodeBytesBase32(randBytes, 16);
    return timePart + randPart;
  }

  /* =================================================================
     UUID v4
     ================================================================= */
  function toHex2(n) { return n.toString(16).padStart(2, '0'); }

  /* Manual RFC4122 v4: 16 random bytes, version nibble set to 4,
     variant bits set to 10xxxxxx on byte 8. */
  function uuidV4Manual() {
    var b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    var h = [];
    for (var i = 0; i < 16; i++) h.push(toHex2(b[i]));
    return h[0] + h[1] + h[2] + h[3] + '-' +
           h[4] + h[5] + '-' +
           h[6] + h[7] + '-' +
           h[8] + h[9] + '-' +
           h[10] + h[11] + h[12] + h[13] + h[14] + h[15];
  }

  function generateUuid() {
    if (!manualUuidEl.checked && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return uuidV4Manual();
  }

  /* =================================================================
     MODE
     ================================================================= */
  function currentMode() {
    return modeUlidBtn.classList.contains('is-active') ? 'ulid' : 'uuid';
  }

  function setMode(mode) {
    var isUuid = mode === 'uuid';
    modeUuidBtn.classList.toggle('is-active', isUuid);
    modeUuidBtn.setAttribute('aria-selected', String(isUuid));
    modeUlidBtn.classList.toggle('is-active', !isUuid);
    modeUlidBtn.setAttribute('aria-selected', String(!isUuid));
    uuidOptionsRow.hidden = !isUuid;
    modeHint.textContent = isUuid
      ? 'RFC 4122 version 4 — 128-bit, random, hyphenated hex. Uses crypto.randomUUID() unless the manual mode is enabled.'
      : 'ULID — 26-char Crockford Base32: 48-bit millisecond timestamp + 80 bits of crypto-random entropy, lexicographically sortable.';
    persist();
    renderFromItems(); // re-apply (no-op for ulid) formatting if items match mode
  }

  /* =================================================================
     FORMATTING (UUID only — hyphens / case / braces)
     ================================================================= */
  function formatValue(item) {
    if (item.type === 'ulid') return item.value;
    var s = item.value;
    if (!optHyphens.checked) s = s.replace(/-/g, '');
    if (optUppercase.checked) s = s.toUpperCase();
    if (optBraces.checked) s = '{' + s + '}';
    return s;
  }

  /* =================================================================
     RENDER
     ================================================================= */
  function humanCount(n, label) { return n.toLocaleString() + ' ' + label + (n === 1 ? '' : 's'); }

  function renderFromItems() {
    if (!items.length) {
      output.value = '';
      outputStats.textContent = '';
      emptyState.classList.remove('is-hidden');
      listPanel.hidden = true;
      idList.innerHTML = '';
      return;
    }
    var lines = items.map(formatValue);
    output.value = lines.join('\n');
    emptyState.classList.add('is-hidden');
    outputStats.textContent = humanCount(items.length, items[0].type === 'ulid' ? 'ULID' : 'UUID');

    var frag = document.createDocumentFragment();
    for (var i = 0; i < lines.length; i++) {
      var li = document.createElement('li');
      var span = document.createElement('span');
      span.className = 'id-value';
      span.textContent = lines[i];
      var btn = document.createElement('button');
      btn.className = 'btn btn--icon id-copy';
      btn.type = 'button';
      btn.title = 'Copy';
      btn.setAttribute('aria-label', 'Copy this ID');
      btn.dataset.value = lines[i];
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
      li.appendChild(span);
      li.appendChild(btn);
      frag.appendChild(li);
    }
    idList.innerHTML = '';
    idList.appendChild(frag);
    listCount.textContent = items.length.toLocaleString() + ' item' + (items.length === 1 ? '' : 's');
    listPanel.hidden = false;
  }

  idList.addEventListener('click', function (e) {
    var btn = e.target.closest('.id-copy');
    if (!btn) return;
    WUS.copy(btn.dataset.value, 'ID copied to clipboard');
  });

  function setStatus(count, type) {
    statusBadge.classList.remove('is-valid');
    if (count > 0) {
      statusBadge.classList.add('is-valid');
      statusText.textContent = humanCount(count, type === 'ulid' ? 'ULID' : 'UUID') + ' generated';
    } else {
      statusText.textContent = 'Ready';
    }
  }

  /* =================================================================
     ACTIONS
     ================================================================= */
  function clampCount() {
    var n = parseInt(countInput.value, 10);
    if (isNaN(n) || n < 1) n = 1;
    if (n > MAX_COUNT) n = MAX_COUNT;
    countInput.value = n;
    return n;
  }

  function generate() {
    var n = clampCount();
    var mode = currentMode();
    var out = new Array(n);
    for (var i = 0; i < n; i++) {
      out[i] = { type: mode, value: mode === 'uuid' ? generateUuid() : generateUlid() };
    }
    items = out;
    renderFromItems();
    setStatus(n, mode);
    WUS.toast('Generated ' + humanCount(n, mode === 'ulid' ? 'ULID' : 'UUID'));
    persist();
  }

  function copyAll() {
    if (!items.length) { WUS.toast('Nothing to copy yet', 'error'); return; }
    WUS.copy(items.map(formatValue).join('\n'), 'All IDs copied to clipboard');
  }

  function downloadAll() {
    if (!items.length) { WUS.toast('Nothing to download yet', 'error'); return; }
    var mode = items[0].type;
    var name = (mode === 'ulid' ? 'ulids' : 'uuids') + '-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.txt';
    WUS.download(name, items.map(formatValue).join('\n') + '\n', 'text/plain;charset=utf-8');
    WUS.toast('Downloaded ' + name);
  }

  function clearAll() {
    items = [];
    renderFromItems();
    setStatus(0);
    WUS.toast('Cleared');
  }

  /* =================================================================
     PERSISTENCE — settings only (not generated content)
     ================================================================= */
  function persist() {
    WUS.store.set(STORE_KEY, {
      mode: currentMode(),
      count: countInput.value,
      manualUuid: manualUuidEl.checked,
      hyphens: optHyphens.checked,
      uppercase: optUppercase.checked,
      braces: optBraces.checked
    });
  }

  function restore() {
    var saved = WUS.store.get(STORE_KEY, null);
    if (!saved) return;
    if (saved.count) countInput.value = saved.count;
    manualUuidEl.checked = !!saved.manualUuid;
    optHyphens.checked = saved.hyphens !== false;
    optUppercase.checked = !!saved.uppercase;
    optBraces.checked = !!saved.braces;
    setMode(saved.mode === 'ulid' ? 'ulid' : 'uuid');
  }

  /* =================================================================
     SHORTCUTS HELP MODAL
     ================================================================= */
  var helpBackdrop = document.getElementById('helpBackdrop');
  var helpClose    = document.getElementById('helpClose');
  var shortcutRows = document.getElementById('shortcutRows');

  var SHORTCUTS = [
    { keys: ['mod', '⏎'], desc: 'Generate' },
    { keys: ['mod', 'S'], desc: 'Download as .txt' },
    { keys: ['?'], desc: 'Show this help' },
    { keys: ['Esc'], desc: 'Close dialog' }
  ];

  function buildShortcutTable() {
    var html = '';
    SHORTCUTS.forEach(function (s) {
      var kbds = s.keys.map(function (k) { return '<kbd>' + WUS.escapeHtml(k) + '</kbd>'; }).join('');
      html += '<tr><td>' + WUS.escapeHtml(s.desc) + '</td><td>' + kbds + '</td></tr>';
    });
    shortcutRows.innerHTML = html;
  }

  function openHelp() { helpBackdrop.hidden = false; helpClose.focus(); }
  function closeHelp() { helpBackdrop.hidden = true; }

  helpClose.addEventListener('click', closeHelp);
  helpBackdrop.addEventListener('click', function (e) {
    if (e.target === helpBackdrop) closeHelp();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !helpBackdrop.hidden) closeHelp();
  });

  var helpBtns = document.querySelectorAll('[data-shortcut-help]');
  for (var i = 0; i < helpBtns.length; i++) helpBtns[i].addEventListener('click', openHelp);

  /* =================================================================
     WIRING
     ================================================================= */
  modeUuidBtn.addEventListener('click', function () { setMode('uuid'); });
  modeUlidBtn.addEventListener('click', function () { setMode('ulid'); });

  btnGenerate.addEventListener('click', generate);
  btnGenerateEmpty.addEventListener('click', generate);
  btnCopyAll.addEventListener('click', copyAll);
  btnDownload.addEventListener('click', downloadAll);
  btnClear.addEventListener('click', clearAll);

  countInput.addEventListener('change', function () { clampCount(); persist(); });
  manualUuidEl.addEventListener('change', function () { persist(); if (currentMode() === 'uuid' && items.length) generate(); });
  [optHyphens, optUppercase, optBraces].forEach(function (el) {
    el.addEventListener('change', function () { persist(); renderFromItems(); });
  });

  countInput.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); generate(); }
  });

  WUS.registerShortcut('mod+enter', function () { generate(); }, 'Generate');
  WUS.registerShortcut('mod+s', function () { downloadAll(); }, 'Download .txt');
  WUS.registerShortcut('?', function () { openHelp(); }, 'Show shortcuts');

  /* =================================================================
     INIT
     ================================================================= */
  buildShortcutTable();
  restore();
  generate();
})();
