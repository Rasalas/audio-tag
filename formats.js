// Format dispatcher: MP3 (ID3v2), M4A/MP4 (iTunes `covr` atom), FLAC (PICTURE block).
// Each reader returns { title, artist, album, cover: {mime, bytes, width?, height?} | null }.
// Each writer returns { blob, droppedTags }.

import { parseTag, readTags, findCover, writeCover as writeId3Cover } from './id3.js';

export const TAG_KEYS = ['title', 'artist', 'album', 'year', 'track', 'genre'];
const VORBIS_KEYS = { title: 'TITLE', artist: 'ARTIST', album: 'ALBUM', year: 'DATE', track: 'TRACKNUMBER', genre: 'GENRE' };

const ascii = new TextDecoder('latin1');
const utf8 = new TextDecoder('utf-8');
const enc = new TextEncoder();

const u32be = (u8, o) => ((u8[o] << 24) | (u8[o + 1] << 16) | (u8[o + 2] << 8) | u8[o + 3]) >>> 0;
const u32le = (u8, o) => (u8[o] | (u8[o + 1] << 8) | (u8[o + 2] << 16) | (u8[o + 3] << 24)) >>> 0;
const putU32le = (u8, o, n) => { u8[o] = n & 255; u8[o + 1] = (n >>> 8) & 255; u8[o + 2] = (n >>> 16) & 255; u8[o + 3] = (n >>> 24) & 255; };
const putU32be = (u8, o, n) => { u8[o] = (n >>> 24) & 255; u8[o + 1] = (n >>> 16) & 255; u8[o + 2] = (n >>> 8) & 255; u8[o + 3] = n & 255; };
const tag4 = (u8, o) => ascii.decode(u8.subarray(o, o + 4));

function concat(parts) {
  const len = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(len);
  let p = 0;
  for (const part of parts) { out.set(part, p); p += part.length; }
  return out;
}

/* ============================== MP3 ============================== */
const mp3 = {
  kind: 'mp3',
  read(buf) {
    const tag = parseTag(buf);
    const cov = findCover(tag);
    return { ...readTags(tag), cover: cov ? { mime: cov.mime, bytes: cov.bytes } : null };
  },
  write: writeId3Cover,
};

/* ============================== FLAC ============================== */
function flacBlocks(u8) {
  const blocks = [];
  let p = 4;
  while (p + 4 <= u8.length) {
    const last = !!(u8[p] & 0x80);
    const type = u8[p] & 0x7f;
    const len = (u8[p + 1] << 16) | (u8[p + 2] << 8) | u8[p + 3];
    blocks.push({ type, data: u8.subarray(p + 4, p + 4 + len) });
    p += 4 + len;
    if (last) break;
  }
  return { blocks, audioStart: p };
}

function flacPicture(data) {
  let p = 0;
  const type = u32be(data, p); p += 4;
  const mlen = u32be(data, p); p += 4;
  const mime = ascii.decode(data.subarray(p, p + mlen)); p += mlen;
  const dlen = u32be(data, p); p += 4 + dlen;
  const width = u32be(data, p); const height = u32be(data, p + 4); p += 16;
  const len = u32be(data, p); p += 4;
  return { type, mime, width, height, bytes: data.subarray(p, p + len) };
}

function serializeVorbis(vendor, items) {
  const encoded = items.map((s) => enc.encode(s));
  const out = new Uint8Array(4 + vendor.length + 4 + encoded.reduce((n, e) => n + 4 + e.length, 0));
  let p = 0;
  putU32le(out, p, vendor.length); p += 4;
  out.set(vendor, p); p += vendor.length;
  putU32le(out, p, encoded.length); p += 4;
  for (const e of encoded) { putU32le(out, p, e.length); p += 4; out.set(e, p); p += e.length; }
  return out;
}
// Replace the managed keys in a comment list; empty values drop the key.
function mergeVorbisTags(items, tags) {
  const managed = new Set(Object.values(VORBIS_KEYS));
  const keep = items.filter((s) => !managed.has(s.slice(0, s.indexOf('=')).toUpperCase()));
  for (const [key, name] of Object.entries(VORBIS_KEYS)) {
    const v = (tags[key] ?? '').trim();
    if (v) keep.push(`${name}=${v}`);
  }
  return keep;
}
function tagsFromVorbis(tags) {
  return { title: tags.TITLE ?? '', artist: tags.ARTIST ?? '', album: tags.ALBUM ?? '', year: tags.DATE ?? '', track: tags.TRACKNUMBER ?? '', genre: tags.GENRE ?? '' };
}

function vorbisComments(data) {
  const out = {};
  let p = 0;
  const vlen = u32le(data, p); p += 4 + vlen;
  const n = u32le(data, p); p += 4;
  for (let i = 0; i < n && p + 4 <= data.length; i++) {
    const len = u32le(data, p); p += 4;
    const s = utf8.decode(data.subarray(p, p + len)); p += len;
    const eq = s.indexOf('=');
    if (eq > 0) {
      const k = s.slice(0, eq).toUpperCase();
      if (!(k in out)) out[k] = s.slice(eq + 1);
    }
  }
  return out;
}

function buildFlacPicture(cover) {
  const mime = enc.encode(cover.mime);
  const head = new Uint8Array(4 + 4 + mime.length + 4 + 16 + 4);
  let p = 0;
  putU32be(head, p, 3); p += 4; // front cover
  putU32be(head, p, mime.length); p += 4;
  head.set(mime, p); p += mime.length;
  putU32be(head, p, 0); p += 4; // empty description
  putU32be(head, p, cover.width ?? 0); putU32be(head, p + 4, cover.height ?? 0);
  putU32be(head, p + 8, 24); putU32be(head, p + 12, 0); p += 16;
  putU32be(head, p, cover.bytes.length);
  return concat([head, cover.bytes]);
}

const flac = {
  kind: 'flac',
  read(buf) {
    const u8 = new Uint8Array(buf);
    const { blocks } = flacBlocks(u8);
    const vc = blocks.find((b) => b.type === 4);
    const tags = vc ? vorbisComments(vc.data) : {};
    const pics = blocks.filter((b) => b.type === 6).map((b) => flacPicture(b.data));
    const pic = pics.find((x) => x.type === 3) ?? pics[0] ?? null;
    return { ...tagsFromVorbis(tags), cover: pic ? { mime: pic.mime, bytes: pic.bytes, width: pic.width, height: pic.height } : null };
  },
  write(buf, cover, tags = null) {
    const u8 = new Uint8Array(buf);
    const { blocks, audioStart } = flacBlocks(u8);
    const keep = blocks.filter((b) => b.type !== 6);
    if (tags) {
      const i = keep.findIndex((b) => b.type === 4);
      const old = i >= 0 ? parseVorbisList(keep[i].data) : { vendor: enc.encode('audioTag'), items: [] };
      const block = { type: 4, data: serializeVorbis(old.vendor, mergeVorbisTags(old.items, tags)) };
      if (i >= 0) keep[i] = block; else keep.splice(1, 0, block); // after STREAMINFO
    }
    if (cover) keep.push({ type: 6, data: buildFlacPicture(cover) });
    const parts = [enc.encode('fLaC')];
    keep.forEach((b, i) => {
      const h = new Uint8Array(4);
      h[0] = b.type | (i === keep.length - 1 ? 0x80 : 0);
      h[1] = (b.data.length >> 16) & 255; h[2] = (b.data.length >> 8) & 255; h[3] = b.data.length & 255;
      parts.push(h, b.data);
    });
    parts.push(u8.subarray(audioStart));
    return { blob: new Blob(parts, { type: 'audio/flac' }), droppedTags: false };
  },
};

/* ============================== MP4 / M4A ============================== */
const CONTAINERS = new Set(['moov', 'udta', 'trak', 'mdia', 'minf', 'stbl', 'ilst', 'meta']);

// meta is a "full box" (4 bytes version/flags) in iTunes files; detect by peeking.
function headerLen(u8, start, type) {
  if (type !== 'meta') return 8;
  return u8[start + 8] === 0 && /^[a-zA-Z0-9 ©]{4}$/.test(tag4(u8, start + 16)) ? 12 : 8;
}

function* atoms(u8, start, end) {
  let p = start;
  while (p + 8 <= end) {
    let size = u32be(u8, p);
    let hdr = 8;
    if (size === 1) { size = Number((BigInt(u32be(u8, p + 8)) << 32n) | BigInt(u32be(u8, p + 12))); hdr = 16; }
    else if (size === 0) size = end - p;
    if (size < hdr || p + size > end) break;
    const type = tag4(u8, p + 4);
    yield { type, start: p, end: p + size, body: p + hdr };
    p += size;
  }
}

function findPath(u8, start, end, path) {
  let s = start, e = end;
  for (const type of path) {
    let found = null;
    for (const a of atoms(u8, s, e)) if (a.type === type) { found = a; break; }
    if (!found) return null;
    s = found.body + (headerLen(u8, found.start, type) - 8);
    e = found.end;
    if (type === path[path.length - 1]) return { start: found.start, end: found.end, body: s };
  }
  return null;
}

function ilstText(u8, ilst, name) {
  for (const a of atoms(u8, ilst.body, ilst.end)) {
    if (a.type !== name) continue;
    for (const d of atoms(u8, a.body, a.end)) if (d.type === 'data') return utf8.decode(u8.subarray(d.body + 8, d.end));
  }
  return '';
}

function atom(type, ...parts) {
  const body = concat(parts);
  const out = new Uint8Array(8 + body.length);
  putU32be(out, 0, out.length);
  // atom types are 4 single bytes; '©' is 0xA9, not its UTF-8 pair
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i) & 0xff;
  out.set(body, 8);
  return out;
}

function buildCovr(cover) {
  const flag = new Uint8Array(8);
  putU32be(flag, 0, cover.mime === 'image/png' ? 14 : 13);
  return atom('covr', atom('data', flag, cover.bytes));
}

const ILST_TEXT = { title: '©nam', artist: '©ART', album: '©alb', year: '©day', genre: '©gen' };
const ILST_MANAGED = new Set([...Object.values(ILST_TEXT), 'trkn']);
function buildTagAtoms(tags) {
  const out = [];
  for (const [key, name] of Object.entries(ILST_TEXT)) {
    const v = (tags[key] ?? '').trim();
    if (!v) continue;
    const flag = new Uint8Array(8);
    putU32be(flag, 0, 1); // UTF-8 text
    out.push(atom(name, atom('data', flag, enc.encode(v))));
  }
  const m = /^\s*(\d+)(?:\s*\/\s*(\d+))?/.exec(tags.track ?? '');
  if (m) {
    const n = Number(m[1]), total = Number(m[2] ?? 0);
    const body = new Uint8Array(8 + 8);
    body[10] = n >> 8; body[11] = n & 255; body[12] = total >> 8; body[13] = total & 255;
    out.push(atom('trkn', atom('data', body)));
  }
  return out;
}

// Rebuild `moov` with the cover replaced; creates udta/meta/ilst when missing.
function patch(u8, a, path, cover, tags = null) {
  const hdr = headerLen(u8, a.start, a.type);
  const prefix = u8.subarray(a.start + 8, a.start + hdr); // meta version/flags
  const type = a.type;
  const bodyStart = a.start + hdr;
  if (path.length === 0) {
    // we are at ilst: drop old covr, append new
    const kids = [];
    for (const k of atoms(u8, bodyStart, a.end)) {
      if (k.type === 'covr' || (tags && ILST_MANAGED.has(k.type))) continue;
      kids.push(u8.subarray(k.start, k.end));
    }
    if (tags) kids.push(...buildTagAtoms(tags));
    if (cover) kids.push(buildCovr(cover));
    return atom(type, prefix, ...kids);
  }
  const [next, ...rest] = path;
  const kids = [];
  let done = false;
  for (const k of atoms(u8, bodyStart, a.end)) {
    if (k.type === next && !done) { kids.push(patch(u8, k, rest, cover, tags)); done = true; }
    else kids.push(u8.subarray(k.start, k.end));
  }
  if (!done) kids.push(create(next, rest, cover, tags));
  return atom(type, prefix, ...kids);
}

function create(type, rest, cover, tags = null) {
  if (type === 'ilst') return atom('ilst', ...(tags ? buildTagAtoms(tags) : []), ...(cover ? [buildCovr(cover)] : []));
  const inner = rest.length ? create(rest[0], rest.slice(1), cover, tags) : new Uint8Array(0);
  if (type === 'meta') {
    const hdlr = new Uint8Array(8 + 4 + 4 + 4 + 12 + 1);
    putU32be(hdlr, 0, hdlr.length); hdlr.set(enc.encode('hdlr'), 4); hdlr.set(enc.encode('mdir'), 16); hdlr.set(enc.encode('appl'), 20);
    return atom('meta', new Uint8Array(4), hdlr, inner);
  }
  return atom(type, inner);
}

function shiftChunkOffsets(moov, moovStart, delta) {
  // walk trak/mdia/minf/stbl → stco/co64 inside the *new* moov bytes
  const visit = (start, end) => {
    for (const a of atoms(moov, start, end)) {
      if (a.type === 'stco' || a.type === 'co64') {
        const n = u32be(moov, a.body + 4);
        for (let i = 0; i < n; i++) {
          const o = a.body + 8 + i * (a.type === 'stco' ? 4 : 8);
          if (a.type === 'stco') {
            const v = u32be(moov, o);
            if (v > moovStart) putU32be(moov, o, v + delta);
          } else {
            const v = (BigInt(u32be(moov, o)) << 32n) | BigInt(u32be(moov, o + 4));
            if (v > BigInt(moovStart)) {
              const nv = v + BigInt(delta);
              putU32be(moov, o, Number(nv >> 32n)); putU32be(moov, o + 4, Number(nv & 0xffffffffn));
            }
          }
        }
      } else if (CONTAINERS.has(a.type)) visit(a.body + (headerLen(moov, a.start, a.type) - 8), a.end);
    }
  };
  visit(0, moov.length);
}

const mp4 = {
  kind: 'm4a',
  read(buf) {
    const u8 = new Uint8Array(buf);
    const ilst = findPath(u8, 0, u8.length, ['moov', 'udta', 'meta', 'ilst']);
    if (!ilst) return { title: '', artist: '', album: '', year: '', track: '', genre: '', cover: null };
    let cover = null;
    const covr = findPath(u8, ilst.body, ilst.end, ['covr']);
    if (covr) {
      for (const d of atoms(u8, covr.body, covr.end)) {
        if (d.type !== 'data') continue;
        const t = u32be(u8, d.body);
        cover = { mime: t === 14 ? 'image/png' : 'image/jpeg', bytes: u8.subarray(d.body + 8, d.end) };
        break;
      }
    }
    let track = '';
    const trkn = findPath(u8, ilst.body, ilst.end, ['trkn']);
    if (trkn) {
      for (const d of atoms(u8, trkn.body, trkn.end)) {
        if (d.type !== 'data' || d.end - d.body < 14) continue;
        const n = (u8[d.body + 10] << 8) | u8[d.body + 11];
        const total = (u8[d.body + 12] << 8) | u8[d.body + 13];
        track = n ? (total ? `${n}/${total}` : String(n)) : '';
        break;
      }
    }
    return {
      title: ilstText(u8, ilst, '©nam'), artist: ilstText(u8, ilst, '©ART'), album: ilstText(u8, ilst, '©alb'),
      year: ilstText(u8, ilst, '©day'), track, genre: ilstText(u8, ilst, '©gen'), cover,
    };
  },
  write(buf, cover, tags = null) {
    const u8 = new Uint8Array(buf);
    let moov = null;
    for (const a of atoms(u8, 0, u8.length)) if (a.type === 'moov') { moov = a; break; }
    if (!moov) throw new Error('No moov atom');
    const fresh = patch(u8, moov, ['udta', 'meta', 'ilst'], cover, tags);
    const delta = fresh.length - (moov.end - moov.start);
    if (delta !== 0) shiftChunkOffsets(fresh, moov.start, delta);
    const blob = new Blob([u8.subarray(0, moov.start), fresh, u8.subarray(moov.end)], { type: 'audio/mp4' });
    return { blob, droppedTags: false };
  },
};

/* ============================== OGG (Vorbis / Opus) ============================== */
const OGG_CRC = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let r = i << 24;
    for (let j = 0; j < 8; j++) r = r & 0x80000000 ? ((r << 1) ^ 0x04c11db7) >>> 0 : (r << 1) >>> 0;
    t[i] = r;
  }
  return t;
})();
function oggCrc(u8) {
  let c = 0;
  for (let i = 0; i < u8.length; i++) c = ((c << 8) ^ OGG_CRC[((c >>> 24) ^ u8[i]) & 255]) >>> 0;
  return c;
}
function b64encode(u8) {
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
}
function b64decode(str) {
  const b = atob(str.replace(/\s+/g, ''));
  const u = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
  return u;
}

function oggPages(u8) {
  const pages = [];
  let p = 0;
  while (p + 27 <= u8.length && tag4(u8, p) === 'OggS') {
    const nseg = u8[p + 26];
    const segs = u8.subarray(p + 27, p + 27 + nseg);
    let len = 0;
    for (const n of segs) len += n;
    const body = p + 27 + nseg;
    pages.push({ start: p, flags: u8[p + 5], granule: u8.subarray(p + 6, p + 14), serial: u32le(u8, p + 14), seq: u32le(u8, p + 18), segs, body, end: body + len });
    p = body + len;
  }
  return pages;
}

// Packets of one logical stream, with the page index where each starts and ends.
function oggPackets(u8, pages, serial, limitPages = pages.length) {
  const packets = [];
  let cur = [];
  let startPage = -1;
  for (let i = 0; i < limitPages; i++) {
    const pg = pages[i];
    if (pg.serial !== serial) continue;
    let off = pg.body;
    for (const n of pg.segs) {
      if (startPage < 0) startPage = i;
      cur.push(u8.subarray(off, off + n));
      off += n;
      if (n < 255) {
        packets.push({ bytes: concat(cur), startPage, endPage: i });
        cur = [];
        startPage = -1;
      }
    }
  }
  return packets;
}

function oggCommentKind(bytes) {
  if (bytes.length >= 8 && ascii.decode(bytes.subarray(0, 8)) === 'OpusTags') return { prefix: bytes.subarray(0, 8), framing: false };
  if (bytes.length >= 7 && bytes[0] === 3 && ascii.decode(bytes.subarray(1, 7)) === 'vorbis') return { prefix: bytes.subarray(0, 7), framing: true };
  throw new Error('Unsupported Ogg codec');
}

function parseVorbisList(data) {
  let p = 0;
  const vlen = u32le(data, p); p += 4;
  const vendor = data.subarray(p, p + vlen); p += vlen;
  const n = u32le(data, p); p += 4;
  const items = [];
  for (let i = 0; i < n && p + 4 <= data.length; i++) {
    const len = u32le(data, p); p += 4;
    items.push(utf8.decode(data.subarray(p, p + len))); p += len;
  }
  return { vendor, items };
}

function buildComment(oldPacket, cover, tags = null) {
  const kind = oggCommentKind(oldPacket);
  const { vendor, items } = parseVorbisList(oldPacket.subarray(kind.prefix.length));
  let keep = items.filter((s) => !/^(METADATA_BLOCK_PICTURE|COVERART|COVERARTMIME)=/i.test(s));
  if (tags) keep = mergeVorbisTags(keep, tags);
  if (cover) keep.push('METADATA_BLOCK_PICTURE=' + b64encode(buildFlacPicture(cover)));
  const body = serializeVorbis(vendor, keep);
  const out = new Uint8Array(kind.prefix.length + body.length + (kind.framing ? 1 : 0));
  out.set(kind.prefix, 0);
  out.set(body, kind.prefix.length);
  if (kind.framing) out[out.length - 1] = 1;
  return out;
}

function makePage(spec, serial, seq, granule, flags) {
  const dataLen = spec.chunks.reduce((n, c) => n + c.length, 0);
  const page = new Uint8Array(27 + spec.segs.length + dataLen);
  page.set(enc.encode('OggS'), 0);
  page[4] = 0;
  page[5] = flags;
  page.set(granule, 6);
  putU32le(page, 14, serial);
  putU32le(page, 18, seq);
  page[26] = spec.segs.length;
  page.set(spec.segs, 27);
  let p = 27 + spec.segs.length;
  for (const c of spec.chunks) { page.set(c, p); p += c.length; }
  putU32le(page, 22, oggCrc(page));
  return page;
}

// Lay packets out on fresh pages (max 255 segments each), honouring continuation flags.
function pagePackets(packets, serial, firstSeq, lastGranule, lastFlags) {
  const specs = [];
  let segs = [], chunks = [], cont = false;
  const flush = (continues) => { specs.push({ segs: Uint8Array.from(segs), chunks, cont }); segs = []; chunks = []; cont = continues; };
  for (const pk of packets) {
    let off = 0;
    for (;;) {
      const n = Math.min(255, pk.length - off);
      segs.push(n);
      chunks.push(pk.subarray(off, off + n));
      off += n;
      const done = n < 255;
      if (segs.length === 255) flush(!done);
      if (done) break;
    }
  }
  if (segs.length) flush(false);
  const zero = new Uint8Array(8);
  return specs.map((sp, i) => {
    const last = i === specs.length - 1;
    return makePage(sp, serial, firstSeq + i, last ? lastGranule : zero, (sp.cont ? 1 : 0) | (last ? lastFlags & 0x04 : 0));
  });
}

const ogg = {
  kind: 'ogg',
  read(buf) {
    const u8 = new Uint8Array(buf);
    const pages = oggPages(u8);
    if (!pages.length) throw new Error('Not an Ogg file');
    const packets = oggPackets(u8, pages, pages[0].serial, Math.min(pages.length, 8));
    if (packets.length < 2) throw new Error('Ogg comment header not found');
    const kind = oggCommentKind(packets[1].bytes);
    const { items } = parseVorbisList(packets[1].bytes.subarray(kind.prefix.length));
    const tags = {};
    for (const s of items) {
      const eq = s.indexOf('=');
      if (eq > 0) { const k = s.slice(0, eq).toUpperCase(); if (!(k in tags)) tags[k] = s.slice(eq + 1); }
    }
    let cover = null;
    if (tags.METADATA_BLOCK_PICTURE) {
      try {
        const pic = flacPicture(b64decode(tags.METADATA_BLOCK_PICTURE));
        cover = { mime: pic.mime, bytes: pic.bytes, width: pic.width, height: pic.height };
      } catch { /* ignore broken picture */ }
    }
    return { ...tagsFromVorbis(tags), cover };
  },
  write(buf, cover, tags = null) {
    const u8 = new Uint8Array(buf);
    const pages = oggPages(u8);
    const serial = pages[0].serial;
    const packets = oggPackets(u8, pages, serial);
    const comment = packets[1];
    if (!comment) throw new Error('Ogg comment header not found');
    const first = comment.startPage;
    if (pages[first].flags & 1) throw new Error('Unexpected Ogg page layout');
    // Extend the range until no packet straddles its end, so we can re-page freely.
    let last = comment.endPage;
    while (last + 1 < pages.length && pages[last].segs.length && pages[last].segs[pages[last].segs.length - 1] === 255) last++;
    const inRange = packets.filter((pk) => pk.startPage >= first && pk.startPage <= last);
    const fresh = pagePackets(
      inRange.map((pk) => (pk === comment ? buildComment(pk.bytes, cover, tags) : pk.bytes)),
      serial, pages[first].seq, pages[last].granule, pages[last].flags,
    );
    const head = u8.subarray(0, pages[first].start);
    const tail = u8.slice(pages[last].end); // copy: sequence numbers and CRCs get patched
    const delta = fresh.length - (last - first + 1);
    if (delta !== 0) {
      for (const pg of oggPages(tail)) {
        if (pg.serial !== serial) continue;
        putU32le(tail, pg.start + 18, pg.seq + delta);
        putU32le(tail, pg.start + 22, 0);
        putU32le(tail, pg.start + 22, oggCrc(tail.subarray(pg.start, pg.end)));
      }
    }
    return { blob: new Blob([head, ...fresh, tail], { type: 'audio/ogg' }), droppedTags: false };
  },
};

/* ============================== dispatcher ============================== */
export const ACCEPT = 'audio/mpeg,audio/mp4,audio/x-m4a,audio/flac,audio/x-flac,audio/ogg,audio/opus,.mp3,.m4a,.m4b,.mp4,.aac,.flac,.ogg,.oga,.opus';

export function detectFormat(buf, name = '') {
  const u8 = new Uint8Array(buf);
  if (u8.length >= 12 && tag4(u8, 4) === 'ftyp') return mp4;
  if (u8.length >= 4 && tag4(u8, 0) === 'fLaC') return flac;
  if (u8.length >= 4 && tag4(u8, 0) === 'OggS') return ogg;
  if (u8.length >= 3 && tag4(u8, 0).startsWith('ID3')) return mp3;
  if (u8.length >= 2 && u8[0] === 0xff && (u8[1] & 0xe0) === 0xe0) return mp3;
  if (/\.mp3$/i.test(name)) return mp3;
  return null;
}

export const isSupportedName = (name) => /\.(mp3|m4a|m4b|mp4|aac|flac|ogg|oga|opus)$/i.test(name);
