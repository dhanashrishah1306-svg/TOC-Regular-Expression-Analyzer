/* BioRegex Studio — regex testing, validation, glossary, image upload */
'use strict';

const ALPHABETS = {
  protein: {
    chars: 'ACDEFGHIKLMNPQRSTVWY',
    label: 'protein (20 standard amino acids)'
  },
  dna: {
    chars: 'ACGT',
    label: 'DNA (A, C, G, T)'
  },
  rna: {
    chars: 'ACGU',
    label: 'RNA (A, C, G, U)'
  }
};

/** Uppercase and strip all whitespace. */
function normalize(s) {
  return s.toUpperCase().replace(/\s+/g, '');
}

/** Return the sorted unique characters that are not in the alphabet. */
function invalidChars(seq, alpha) {
  const alphabet = ALPHABETS[alpha];
  if (!alphabet) return [...new Set([...seq])];
  return [...new Set([...seq].filter(c => !alphabet.chars.includes(c)))];
}

/** All non-overlapping matches, with 1-based inclusive positions. */
function findMatches(pattern, seq) {
  const re = new RegExp(pattern, 'g');
  return [...seq.matchAll(re)]
    .filter(m => m[0].length > 0)
    .map(m => ({
      text: m[0],
      start: m.index + 1,
      end: m.index + m[0].length
    }));
}

if (typeof module !== 'undefined') {
  module.exports = { ALPHABETS, normalize, invalidChars, findMatches };
}

if (typeof document !== 'undefined') {
  const el = (tag, text, cls) => {
    const e = document.createElement(tag);
    if (text !== undefined) e.textContent = text;
    if (cls) e.className = cls;
    return e;
  };

  /* ---------- Regex testers + image upload, one per application ---------- */
  document.querySelectorAll('.app').forEach(sec => {
    const { regex, alpha, default: def, app } = sec.dataset;
    const input = sec.querySelector('textarea');
    const out = sec.querySelector('.result');

    function find() {
      out.replaceChildren();

      const seq = normalize(input.value);
      if (!seq) {
        out.append(el('p', 'Please enter a sequence first.', 'err'));
        return;
      }

      const bad = invalidChars(seq, alpha);
      if (bad.length) {
        const alphabet = ALPHABETS[alpha];
        const allowed = alphabet ? alphabet.label : 'the configured alphabet';
        out.append(el(
          'p',
          `Invalid character${bad.length > 1 ? 's' : ''}: ${bad.join(', ')}. Only ${allowed} symbols are allowed.`,
          'err'
        ));
        return;
      }

      let hits;
      try {
        hits = findMatches(regex, seq);
      } catch (error) {
        out.append(el('p', 'The regular expression is invalid. Please check the pattern.', 'err'));
        return;
      }

      if (!hits.length) {
        out.append(el('p', `No match found for ${regex} in this sequence.`, 'none'));
        return;
      }

      out.append(el(
        'p',
        `${hits.length} match${hits.length > 1 ? 'es' : ''} found (positions are 1-based):`,
        'ok'
      ));

      const table = el('table');
      const head = el('tr');
      ['Match', 'Start', 'End'].forEach(h => head.append(el('th', h)));
      table.append(head);

      hits.forEach(h => {
        const row = el('tr');
        [h.text, h.start, h.end].forEach(v => row.append(el('td', String(v))));
        table.append(row);
      });

      out.append(table);
    }

    const findButton = sec.querySelector('[data-act=find]');
    const resetButton = sec.querySelector('[data-act=reset]');
    if (findButton) findButton.onclick = find;
    if (resetButton) {
      resetButton.onclick = () => {
        input.value = def || '';
        out.replaceChildren();
      };
    }

    /* Image upload: each app has its own localStorage key */
    const key = 'bioregex-diagram-' + app;
    const file = sec.querySelector('input[type=file]');
    const img = sec.querySelector('.preview img');
    const empty = sec.querySelector('.preview .empty');
    const msg = sec.querySelector('.msg');

    if (!file || !img || !empty || !msg) return;

    const note = msg.textContent;
    const say = (t, warn) => {
      msg.textContent = t;
      msg.classList.toggle('warn', !!warn);
    };
    const show = src => {
      img.src = src;
      img.hidden = !src;
      empty.hidden = !!src;
    };

    try {
      const saved = localStorage.getItem(key);
      if (saved) show(saved);
    } catch (e) {
      say('Browser storage is unavailable, so the image will not be remembered after refresh.', true);
    }

    const chooseButton = sec.querySelector('[data-act=choose]');
    const removeButton = sec.querySelector('[data-act=remove]');

    if (chooseButton) chooseButton.onclick = () => file.click();

    if (removeButton) {
      removeButton.onclick = () => {
        show('');
        try {
          localStorage.removeItem(key);
        } catch (e) {}
        say(note);
      };
    }

    file.onchange = () => {
      const f = file.files[0];
      file.value = '';
      if (!f) return;

      if (!['image/png', 'image/jpeg', 'image/webp'].includes(f.type)) {
        say('Unsupported file. Please choose a PNG, JPG, JPEG or WebP image.', true);
        return;
      }

      const url = URL.createObjectURL(f);
      const im = new Image();

      im.onerror = () => {
        URL.revokeObjectURL(url);
        say('That image could not be read.', true);
      };

      im.onload = () => {
        // Downscale to keep the stored data small (max 1400px wide).
        const scale = Math.min(1, 1400 / im.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(im.width * scale);
        canvas.height = Math.round(im.height * scale);

        const context = canvas.getContext('2d');
        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(im, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);

        let data = canvas.toDataURL('image/webp', 0.85);
        if (!data.startsWith('data:image/webp')) {
          data = canvas.toDataURL('image/jpeg', 0.85);
        }

        show(data);
        try {
          localStorage.setItem(key, data);
          say(note);
        } catch (e) {
          say('Image shown, but browser storage is full or unavailable, so it will not be remembered after refresh. Try a smaller image.', true);
        }
      };

      im.src = url;
    };
  });

  /* ---------- Glossary modal ---------- */
  const dlg = document.getElementById('glossary');
  const openGlossary = document.getElementById('openGlossary');
  const closeGlossary = document.getElementById('closeGlossary');

  if (dlg && openGlossary && closeGlossary) {
    openGlossary.onclick = () => dlg.showModal();
    closeGlossary.onclick = () => dlg.close();
    dlg.addEventListener('click', e => {
      if (e.target === dlg) dlg.close();
    });
  }
}