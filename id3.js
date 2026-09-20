// Minimal ID3v2.3/2.4 reader + writer. Only what's needed to read/replace the
// front cover (APIC) and show title/artist/album. All other frames are copied
// through untouched.

const latin1 = new TextDecoder('latin1');

function synchsafe(u8, off) {
  return ((u8[off] & 0x7f) << 21) | ((u8[off + 1] & 0x7f) << 14) | ((u8[off + 2] & 0x7f) << 7) | (u8[off + 3] & 0x7f);
}
function u32(u8, off) {
  return ((u8[off] << 24) | (u8[off + 1] << 16) | (u8[off + 2] << 8) | u8[off + 3]) >>> 0;
}
function putSynchsafe(u8, off, n) {
  u8[off] = (n >> 21) & 0x7f; u8[off + 1] = (n >> 14) & 0x7f; u8[off + 2] = (n >> 7) & 0x7f; u8[off + 3] = n & 0x7f;
}
function putU32(u8, off, n) {
  u8[off] = (n >>> 24) & 0xff; u8[off + 1] = (n >> 16) & 0xff; u8[off + 2] = (n >> 8) & 0xff; u8[off + 3] = n & 0xff;
}

/**
 * @returns {{version:number, total:number, frames:Array<{id:string,flags:number,data:Uint8Array}>|null}|null}
 *   frames === null means the tag exists but is in a layout we don't rewrite (v2.2 / unsynchronised).
 */
export function parseTag(buf) {
  const u8 = new Uint8Array(buf);
  if (u8.length < 10 || u8[0] !== 0x49 || u8[1] !== 0x44 || u8[2] !== 0x33) return null;
  const version = u8[3];
  const flags = u8[5];
  const size = synchsafe(u8, 6);
  const total = 10 + size + (flags & 0x10 ? 10 : 0);
  if (version < 3 || version > 4 || flags & 0x80) return { version, total, frames: null };

  let pos = 10;
  if (flags & 0x40) pos += version === 4 ? synchsafe(u8, 10) : u32(u8, 10) + 4;

  const end = Math.min(10 + size, u8.length);
  const frames = [];
  while (pos + 10 <= end) {
    if (u8[pos] === 0) break; // padding
    const id = latin1.decode(u8.subarray(pos, pos + 4));
    const fsize = version === 4 ? synchsafe(u8, pos + 4) : u32(u8, pos + 4);
    const fflags = (u8[pos + 8] << 8) | u8[pos + 9];
    if (fsize < 0 || pos + 10 + fsize > end) break;
    frames.push({ id, flags: fflags, data: u8.slice(pos + 10, pos + 10 + fsize) });
    pos += 10 + fsize;
  }
  return { version, total, frames };
}

export function decodeText(data) {
  if (!data || data.length < 2) return '';
  const enc = data[0];
  const body = data.subarray(1);
  let label = 'utf-8';
  if (enc === 0) label = 'latin1';
  else if (enc === 1) label = 'utf-16';
  else if (enc === 2) label = 'utf-16be';
  try {
    return new TextDecoder(label).decode(body).split('\0')[0].trim();
  } catch {
    return '';
  }
}

export function textFrame(tag, id) {
  const f = tag?.frames?.find((fr) => fr.id === id);
  return f ? decodeText(f.data) : '';
}

/** Returns {mime, type, bytes} for the front cover (or first picture) or null. */
export function findCover(tag) {
  const pics = tag?.frames?.filter((f) => f.id === 'APIC') ?? [];
  if (!pics.length) return null;
  const parsed = pics.map((f) => parseApic(f.data)).filter(Boolean);
  return parsed.find((p) => p.type === 3) ?? parsed[0] ?? null;
}

function parseApic(data) {
  const enc = data[0];
  let p = 1;
  while (p < data.length && data[p] !== 0) p++;
  const mime = latin1.decode(data.subarray(1, p)) || 'image/jpeg';
  p++;
  const type = data[p++];
  if (enc === 1 || enc === 2) {
    while (p + 1 < data.length && !(data[p] === 0 && data[p + 1] === 0)) p += 2;
    p += 2;
  } else {
    while (p < data.length && data[p] !== 0) p++;
    p++;
  }
  if (p >= data.length) return null;
  return { mime, type, bytes: data.subarray(p) };
}

function buildApic(mime, imageBytes) {
  const mimeBytes = new TextEncoder().encode(mime);
  const out = new Uint8Array(1 + mimeBytes.length + 1 + 1 + 1 + imageBytes.length);
  let p = 0;
  out[p++] = 0x03; // UTF-8
  out.set(mimeBytes, p); p += mimeBytes.length;
  out[p++] = 0; // mime terminator
  out[p++] = 0x03; // front cover
  out[p++] = 0; // empty description
  out.set(imageBytes, p);
  return out;
}

// Text frames we manage. Year is TDRC in v2.4 and TYER in v2.3.
const TEXT_IDS = { title: 'TIT2', artist: 'TPE1', album: 'TALB', track: 'TRCK', genre: 'TCON' };
const MANAGED = new Set([...Object.values(TEXT_IDS), 'TDRC', 'TYER']);

function textFrameData(version, value) {
  if (version === 4) return new Uint8Array([3, ...new TextEncoder().encode(value)]);
  // v2.3: UTF-16 with BOM keeps umlauts intact
  const out = new Uint8Array(3 + value.length * 2);
  out[0] = 1; out[1] = 0xff; out[2] = 0xfe;
  for (let i = 0; i < value.length; i++) { const c = value.charCodeAt(i); out[3 + i * 2] = c & 255; out[4 + i * 2] = c >> 8; }
  return out;
}

/** Managed text fields of a parsed tag. */
export function readTags(tag) {
  return {
    title: textFrame(tag, 'TIT2'),
    artist: textFrame(tag, 'TPE1'),
    album: textFrame(tag, 'TALB'),
    year: textFrame(tag, 'TDRC') || textFrame(tag, 'TYER'),
    track: textFrame(tag, 'TRCK'),
    genre: textFrame(tag, 'TCON'),
  };
}

/**
 * Rebuild the file with the given cover (or none) and, when `tags` is given,
 * the managed text fields. Other frames are preserved when the original tag
 * is v2.3/2.4 and not unsynchronised.
 * @param {ArrayBuffer} buf original file
 * @param {{mime:string, bytes:Uint8Array}|null} cover null removes the cover
 * @param {object|null} tags {title, artist, album, year, track, genre}; empty values drop the frame
 * @returns {{blob:Blob, droppedTags:boolean}}
 */
export function writeCover(buf, cover, tags = null) {
  const u8 = new Uint8Array(buf);
  const tag = parseTag(buf);
  const audioStart = tag ? Math.min(tag.total, u8.length) : 0;
  const version = tag && tag.frames ? tag.version : 3;
  const keep = (tag?.frames ?? []).filter((f) => f.id !== 'APIC' && !(tags && MANAGED.has(f.id)));
  const droppedTags = !!tag && tag.frames === null;

  const frames = keep.map((f) => ({ id: f.id, flags: f.flags, data: f.data }));
  if (tags) {
    for (const [key, id] of Object.entries(TEXT_IDS)) {
      const v = (tags[key] ?? '').trim();
      if (v) frames.push({ id, flags: 0, data: textFrameData(version, v) });
    }
    const year = (tags.year ?? '').trim();
    if (year) frames.push({ id: version === 4 ? 'TDRC' : 'TYER', flags: 0, data: textFrameData(version, year) });
  }
  if (cover) frames.push({ id: 'APIC', flags: 0, data: buildApic(cover.mime, cover.bytes) });

  if (!frames.length) {
    return { blob: new Blob([u8.subarray(audioStart)], { type: 'audio/mpeg' }), droppedTags };
  }

  const padding = 1024;
  const bodySize = frames.reduce((n, f) => n + 10 + f.data.length, 0) + padding;
  const head = new Uint8Array(10 + bodySize);
  head.set([0x49, 0x44, 0x33, version, 0, 0]);
  putSynchsafe(head, 6, bodySize);
  let p = 10;
  for (const f of frames) {
    head.set(new TextEncoder().encode(f.id), p);
    if (version === 4) putSynchsafe(head, p + 4, f.data.length);
    else putU32(head, p + 4, f.data.length);
    head[p + 8] = (f.flags >> 8) & 0xff;
    head[p + 9] = f.flags & 0xff;
    head.set(f.data, p + 10);
    p += 10 + f.data.length;
  }
  return { blob: new Blob([head, u8.subarray(audioStart)], { type: 'audio/mpeg' }), droppedTags };
}
