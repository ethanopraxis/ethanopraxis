/**
 * Minimal PDF text extractor — plain Node, zero dependencies.
 *
 * Enough of the spec to read the doctrine PDFs faithfully: FlateDecode streams,
 * ToUnicode CMaps (so Vietnamese diacritics survive), and the text-showing
 * operators. Not a general-purpose PDF library; it is deliberately small
 * because the doctrine text is sacred and a black-box dependency is harder to
 * audit than 200 lines we can read.
 */
import zlib from 'node:zlib';

/** Split a PDF into `num gen obj … endobj` records. Latin1 keeps 1 char == 1 byte. */
function parseObjects(buf) {
  const s = buf.toString('latin1');
  const objects = new Map();
  const re = /(\d+)\s+(\d+)\s+obj\b/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    const num = Number(m[1]);
    const bodyStart = m.index + m[0].length;
    const endObj = s.indexOf('endobj', bodyStart);
    if (endObj < 0) continue;
    const body = s.slice(bodyStart, endObj);

    let stream = null;
    const sIdx = body.indexOf('stream');
    if (sIdx >= 0) {
      let dataStart = bodyStart + sIdx + 'stream'.length;
      if (s[dataStart] === '\r') dataStart++;
      if (s[dataStart] === '\n') dataStart++;
      const lenMatch = /\/Length\s+(\d+)(?!\s+\d+\s+R)/.exec(body.slice(0, sIdx));
      let dataEnd;
      if (lenMatch) {
        dataEnd = dataStart + Number(lenMatch[1]);
      } else {
        const e = s.indexOf('endstream', dataStart);
        dataEnd = e < 0 ? dataStart : e;
      }
      stream = buf.subarray(dataStart, dataEnd);
    }
    objects.set(num, { dict: stream ? body.slice(0, body.indexOf('stream')) : body, stream });
  }
  return objects;
}

function inflate(obj) {
  if (!obj?.stream) return Buffer.alloc(0);
  if (!/\/FlateDecode/.test(obj.dict)) return obj.stream;
  try {
    return zlib.inflateSync(obj.stream);
  } catch {
    try {
      return zlib.inflateRawSync(obj.stream.subarray(1));
    } catch {
      return Buffer.alloc(0);
    }
  }
}

const hexToStr = (hex) => {
  let out = '';
  for (let i = 0; i + 3 < hex.length + 1; i += 4) {
    const unit = hex.slice(i, i + 4).padEnd(4, '0');
    out += String.fromCharCode(parseInt(unit, 16));
  }
  return out;
};

/** Content-stream hex strings are raw bytes: 2 hex digits per character code. */
const hexToBytes = (hex) => {
  let out = '';
  for (let i = 0; i + 1 < hex.length; i += 2) out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
  return out;
};

/** Parse a ToUnicode CMap into code -> string, plus the code width in bytes. */
function parseCMap(text) {
  const map = new Map();
  let bytes = 1;

  const csr = /begincodespacerange([\s\S]*?)endcodespacerange/g;
  let m;
  while ((m = csr.exec(text)) !== null) {
    const first = /<([0-9A-Fa-f]+)>/.exec(m[1]);
    if (first) bytes = Math.max(bytes, Math.ceil(first[1].length / 2));
  }

  const bfchar = /beginbfchar([\s\S]*?)endbfchar/g;
  while ((m = bfchar.exec(text)) !== null) {
    const pairs = m[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g);
    for (const [, src, dst] of pairs) map.set(parseInt(src, 16), hexToStr(dst));
  }

  const bfrange = /beginbfrange([\s\S]*?)endbfrange/g;
  while ((m = bfrange.exec(text)) !== null) {
    const body = m[1];
    // <lo> <hi> [<d1> <d2> …]
    for (const [, lo, , arr] of body.matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*\[([\s\S]*?)\]/g)) {
      let code = parseInt(lo, 16);
      for (const [, d] of arr.matchAll(/<([0-9A-Fa-f]+)>/g)) map.set(code++, hexToStr(d));
    }
    // <lo> <hi> <dstStart>
    for (const [, lo, hi, dst] of body.matchAll(
      /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>(?!\s*\[)/g
    )) {
      const start = parseInt(lo, 16);
      const end = parseInt(hi, 16);
      const base = hexToStr(dst);
      const tail = base.charCodeAt(base.length - 1);
      for (let c = start; c <= end && c - start < 65536; c++) {
        map.set(c, base.slice(0, -1) + String.fromCharCode(tail + (c - start)));
      }
    }
  }
  return { map, bytes };
}

/** Decode a PDF string token (already unescaped for literals) through a font's CMap. */
function decodeWithFont(raw, font) {
  if (!font) return raw;
  const { map, bytes } = font;
  let out = '';
  if (bytes === 2) {
    for (let i = 0; i + 1 < raw.length; i += 2) {
      const code = (raw.charCodeAt(i) << 8) | raw.charCodeAt(i + 1);
      out += map.get(code) ?? '';
    }
  } else {
    for (let i = 0; i < raw.length; i++) {
      const code = raw.charCodeAt(i);
      out += map.get(code) ?? raw[i];
    }
  }
  return out;
}

function unescapeLiteral(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== '\\') { out += s[i]; continue; }
    const n = s[++i];
    if (n === 'n') out += '\n';
    else if (n === 'r') out += '\r';
    else if (n === 't') out += '\t';
    else if (n === 'b') out += '\b';
    else if (n === 'f') out += '\f';
    else if (n >= '0' && n <= '7') {
      let oct = n;
      while (oct.length < 3 && s[i + 1] >= '0' && s[i + 1] <= '7') oct += s[++i];
      out += String.fromCharCode(parseInt(oct, 8));
    } else out += n;
  }
  return out;
}

/** Tokenise one content stream into positioned text runs. */
function runsFromContent(content, fonts) {
  const runs = [];
  let font = null;
  let tm = [1, 0, 0, 1, 0, 0];
  let tlm = tm.slice();
  let leading = 0;

  const show = (text) => {
    if (text) runs.push({ x: tm[4], y: tm[5], text });
  };

  // One pass over operands + operator.
  const re =
    /\[((?:[^\]\\]|\\.)*)\]\s*TJ|\((?:[^()\\]|\\.|\((?:[^()\\]|\\.)*\))*\)\s*Tj|<([0-9A-Fa-f\s]*)>\s*Tj|\/(\S+)\s+([\d.]+)\s+Tf|([-\d.]+)\s+([-\d.]+)\s+(TD|Td)|((?:[-\d.]+\s+){6})Tm|T\*|([-\d.]+)\s+TL|BT|ET/g;

  let m;
  while ((m = re.exec(content)) !== null) {
    const tok = m[0];

    if (m[1] !== undefined) {
      // TJ array
      let text = '';
      const parts = m[1].matchAll(/\((?:[^()\\]|\\.)*\)|<([0-9A-Fa-f\s]*)>|(-?[\d.]+)/g);
      for (const p of parts) {
        if (p[0][0] === '(') text += decodeWithFont(unescapeLiteral(p[0].slice(1, -1)), font);
        else if (p[1] !== undefined) text += decodeWithFont(hexToBytes(p[1].replace(/\s/g, '')), font);
        else if (Number(p[2]) < -180) text += ' ';
      }
      show(text);
    } else if (tok.endsWith('Tj') && tok[0] === '(') {
      show(decodeWithFont(unescapeLiteral(tok.slice(1, tok.lastIndexOf(')'))), font));
    } else if (m[2] !== undefined) {
      show(decodeWithFont(hexToBytes(m[2].replace(/\s/g, '')), font));
    } else if (m[3] !== undefined) {
      font = fonts.get(m[3]) ?? null;
    } else if (m[7] !== undefined) {
      const tx = Number(m[5]);
      const ty = Number(m[6]);
      if (m[7] === 'TD') leading = -ty;
      tlm = [tlm[0], tlm[1], tlm[2], tlm[3], tlm[4] + tx, tlm[5] + ty];
      tm = tlm.slice();
    } else if (m[8] !== undefined) {
      tlm = m[8].trim().split(/\s+/).map(Number);
      tm = tlm.slice();
    } else if (tok === 'T*') {
      tlm = [tlm[0], tlm[1], tlm[2], tlm[3], tlm[4], tlm[5] - leading];
      tm = tlm.slice();
    } else if (m[9] !== undefined) {
      leading = Number(m[9]);
    } else if (tok === 'BT') {
      tm = [1, 0, 0, 1, 0, 0];
      tlm = tm.slice();
    }
  }
  return runs;
}

/** Group positioned runs into visual lines, keeping y so callers can see paragraph gaps. */
function runsToLines(runs) {
  const lines = [];
  let current = null;
  for (const r of runs) {
    if (!current || Math.abs(r.y - current.y) > 2) {
      current = { y: r.y, parts: [] };
      lines.push(current);
    }
    current.parts.push(r.text);
  }
  return lines
    .map((l) => ({ y: l.y, text: l.parts.join('').replace(/\s+/g, ' ').trim() }))
    .filter((l) => l.text);
}

/** Every page as positioned lines `{ y, text }`, in page-tree order. */
export function extractPageLines(buf) {
  const objects = parseObjects(buf);
  const dictOf = (n) => objects.get(n)?.dict ?? '';

  /** Value of `key` in `dict`, following one level of indirection. */
  const resolveDict = (dict, key) => {
    const ref = new RegExp(`/${key}\\s+(\\d+)\\s+\\d+\\s+R`).exec(dict);
    if (ref) return dictOf(Number(ref[1]));
    const inline = new RegExp(`/${key}\\s*<<`).exec(dict);
    if (!inline) return '';
    // Walk to the matching >> so nested dictionaries survive.
    let i = inline.index + inline[0].length;
    let depth = 1;
    const start = i;
    while (i < dict.length && depth > 0) {
      if (dict.startsWith('<<', i)) { depth++; i += 2; }
      else if (dict.startsWith('>>', i)) { depth--; i += 2; }
      else i++;
    }
    return dict.slice(start, i - 2);
  };

  const cmapCache = new Map();
  const fontFor = (objNum) => {
    if (cmapCache.has(objNum)) return cmapCache.get(objNum);
    const dict = dictOf(objNum);
    let result = null;
    const tu = /\/ToUnicode\s+(\d+)\s+\d+\s+R/.exec(dict);
    if (tu) result = parseCMap(inflate(objects.get(Number(tu[1]))).toString('latin1'));
    if (result && /\/Subtype\s*\/Type0/.test(dict)) result.bytes = 2;
    cmapCache.set(objNum, result);
    return result;
  };

  // Page order comes from the page tree, not from object numbering.
  const pageNums = [];
  const seen = new Set();
  const walk = (num) => {
    if (seen.has(num)) return;
    seen.add(num);
    const dict = dictOf(num);
    if (/\/Type\s*\/Page[^s]/.test(dict)) { pageNums.push(num); return; }
    const kids = /\/Kids\s*\[([\s\S]*?)\]/.exec(dict);
    if (kids) for (const [, k] of kids[1].matchAll(/(\d+)\s+\d+\s+R/g)) walk(Number(k));
  };
  const catalog = [...objects].find(([, o]) => /\/Type\s*\/Catalog/.test(o.dict));
  const rootPages = catalog && /\/Pages\s+(\d+)\s+\d+\s+R/.exec(catalog[1].dict);
  if (rootPages) walk(Number(rootPages[1]));
  if (pageNums.length === 0) {
    for (const [num, o] of objects) if (/\/Type\s*\/Page[^s]/.test(o.dict)) pageNums.push(num);
  }

  return pageNums.map((num) => {
    const dict = dictOf(num);
    const resources = resolveDict(dict, 'Resources');
    const fontDict = resolveDict(resources, 'Font');

    const fonts = new Map();
    for (const [, name, fnum] of fontDict.matchAll(/\/(\S+)\s+(\d+)\s+\d+\s+R/g)) {
      const f = fontFor(Number(fnum));
      if (f) fonts.set(name, f);
    }

    const refs = [];
    const array = /\/Contents\s*\[([\s\S]*?)\]/.exec(dict);
    const single = /\/Contents\s+(\d+)\s+\d+\s+R/.exec(dict);
    if (array) for (const [, n] of array[1].matchAll(/(\d+)\s+\d+\s+R/g)) refs.push(Number(n));
    else if (single) refs.push(Number(single[1]));

    const content = refs.map((n) => inflate(objects.get(n)).toString('latin1')).join('\n');
    return runsToLines(runsFromContent(content, fonts));
  });
}

/** Page text as plain strings. */
export function extractPages(buf) {
  return extractPageLines(buf).map((lines) => lines.map((l) => l.text).join('\n'));
}
