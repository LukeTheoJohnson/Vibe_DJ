// lyrics.js — the words the DJ sings. A seeded lyric line per song + vocal
// variant, drawn from small word banks per mood, and the ONE sanitiser every
// word passes through before it reaches rendered code or Shabda's text-to-
// speech (generated lines, `sing:` from the direction box, share links).
// Lines are always 2+ words joined by "_" — one Shabda sample per line, and a
// multi-word name can't collide with a dirt-samples bank ("yeah", "ho").
(function (SDJ) {
  'use strict';

  const Rng = SDJ.Rng;

  const BANKS = {
    bright: {
      adj: ['golden', 'sunny', 'sweet', 'bright', 'lucky', 'easy', 'shining', 'warm', 'brand new'],
      noun: ['summer', 'sunrise', 'daylight', 'heart', 'feeling', 'morning', 'colour', 'sky', 'weekend'],
      verb: ['chase', 'feel', 'hold', 'find', 'light up', 'keep', 'sing', 'wake'],
    },
    dark: {
      adj: ['cold', 'hollow', 'broken', 'silent', 'heavy', 'faded', 'lonely', 'endless'],
      noun: ['shadow', 'midnight', 'ashes', 'winter', 'echo', 'static', 'ghost', 'rain'],
      verb: ['fall', 'lose', 'burn', 'drown', 'fade', 'run', 'wait', 'hide'],
    },
    dreamy: {
      adj: ['neon', 'velvet', 'drifting', 'electric', 'slow', 'hazy', 'distant', 'midnight'],
      noun: ['lights', 'city', 'ocean', 'stars', 'signal', 'memory', 'highway', 'satellite'],
      verb: ['drift', 'float', 'glow', 'dream', 'ride', 'fly', 'shine', 'stay'],
    },
    hype: {
      adj: ['wild', 'loud', 'heavy', 'fast', 'crazy', 'fearless', 'restless', 'unstoppable'],
      noun: ['fire', 'crowd', 'bass', 'thunder', 'rhythm', 'night', 'floor', 'hands'],
      verb: ['move', 'jump', 'run', 'shake', 'break', 'rise', 'go', 'turn it up'],
    },
  };

  // Line shapes — A adj, N noun, V verb; anything else is a literal word.
  const TEMPLATES = [
    ['A', 'N'],
    ['N', 'of', 'N'],
    ['we', 'V', 'the', 'N'],
    ['into', 'the', 'N'],
    ['V', 'all', 'night'],
    ['A', 'A', 'N'],
    ['you', 'and', 'the', 'N'],
    ['V', 'with', 'me'],
    ['no', 'more', 'N'],
    ['A', 'N', 'tonight'],
    ['we', 'V'],
    ['out', 'in', 'the', 'A', 'N'],
  ];

  // Which bank a song draws from: the genre sets the energy, the scale the colour.
  function moodFor(genreId, scaleType) {
    if (genreId === 'trap' || genreId === 'drill' || genreId === 'metal' || genreId === 'rock') return 'hype';
    if (genreId === 'synthwave' || genreId === 'loFi' || genreId === 'rb') return 'dreamy';
    const st = String(scaleType || '');
    if (/major|lydian|mixolydian/.test(st) && !/minor/.test(st)) return 'bright';
    return 'dark';
  }

  // Lowercase letters and digits only, words joined by "_", at most 6 words /
  // 40 characters. Null for fewer than 2 words — a lone word can collide with a
  // sample bank name, and nothing else can reach the code.
  function sanitise(text) {
    const words = String(text == null ? '' : text)
      .toLowerCase()
      .replace(/['’]/g, '')          // don't → dont (not "don t")
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean)
      .slice(0, 6);
    while (words.length > 2 && words.join('_').length > 40) words.pop();
    if (words.length < 2) return null;
    const out = words.join('_');
    return out.length > 40 ? null : out;
  }

  // The seeded lyric line for a song's vocal at this variant — same inputs, same words.
  function line(seed, variant, mood) {
    const bank = BANKS[mood] || BANKS.dark;
    const r = Rng.make(((seed >>> 0) ^ 0x51c0ffee ^ Math.imul((variant | 0) + 1, 0x9e3779b1)) >>> 0);
    const tpl = Rng.pick(r, TEMPLATES);
    const words = tpl.map((t) => (t === 'A' ? Rng.pick(r, bank.adj) : t === 'N' ? Rng.pick(r, bank.noun) : t === 'V' ? Rng.pick(r, bank.verb) : t));
    return sanitise(words.join(' ')) || 'oh_yeah';
  }

  // The vocal sample names in a rendered program (s("two_words") lines), so
  // the app can register them with Shabda before they play. Only sanitiser-
  // shaped names match.
  function namesIn(code) {
    const out = [];
    const re = /s\("([a-z0-9]+(?:_[a-z0-9]+)+)"\)/g;
    let m;
    while ((m = re.exec(String(code || '')))) if (out.indexOf(m[1]) < 0) out.push(m[1]);
    return out;
  }

  // The Shabda load line for a vocal name (default voice: en-GB, female).
  function loadLine(name) {
    return "samples('shabda/speech:" + name + "')";
  }

  SDJ.Lyrics = { line: line, sanitise: sanitise, moodFor: moodFor, namesIn: namesIn, loadLine: loadLine, BANKS: BANKS };
})(window.SDJ = window.SDJ || {});
