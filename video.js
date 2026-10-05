// Still-image MP4: the cover as H.264 at 1 fps plus the audio re-encoded to AAC,
// both via WebCodecs, muxed by hand. No B-frames, so no composition offsets.
import { atom, buildUdta } from './formats.js';

const SIZE = 1080;
const SAMPLE_RATE = 48000;
const KEY_EVERY = 5; // seconds between keyframes, keeps seeking cheap
const AVC_CODECS = ['avc1.640028', 'avc1.4d0028', 'avc1.420028'];

const videoConfig = (codec) => ({ codec, width: SIZE, height: SIZE, bitrate: 1_000_000, framerate: 1, avc: { format: 'avc' } });
const audioConfig = (channels) => ({ codec: 'mp4a.40.2', sampleRate: SAMPLE_RATE, numberOfChannels: channels, bitrate: 192_000 });

async function pickVideoCodec() {
  for (const codec of AVC_CODECS) {
    try {
      if ((await VideoEncoder.isConfigSupported(videoConfig(codec))).supported) return codec;
    } catch { /* try the next one */ }
  }
  return null;
}

let support;
export function canMakeVideo() {
  support ??= (async () => {
    if (!('VideoEncoder' in window && 'AudioEncoder' in window)) return false;
    try {
      const audio = await AudioEncoder.isConfigSupported(audioConfig(2));
      return audio.supported && !!(await pickVideoCodec());
    } catch { return false; }
  })();
  return support;
}

const u16 = (n) => new Uint8Array([(n >> 8) & 255, n & 255]);
const u32 = (n) => new Uint8Array([(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]);
const zeros = (n) => new Uint8Array(n);
const full = (type, version, flags, ...parts) => atom(type, new Uint8Array([version, (flags >> 16) & 255, (flags >> 8) & 255, flags & 255]), ...parts);
const MATRIX = [0x10000, 0, 0, 0, 0x10000, 0, 0, 0, 0x40000000].map(u32);

async function decodeAudio(buf) {
  const ctx = new OfflineAudioContext(2, 1, SAMPLE_RATE);
  return ctx.decodeAudioData(buf.slice(0)); // decodeAudioData detaches its input
}

async function encodeAudio(audio, onProgress) {
  const channels = Math.min(2, audio.numberOfChannels);
  const samples = [];
  let description = null;
  const enc = new AudioEncoder({
    output: (chunk, meta) => {
      if (meta?.decoderConfig?.description) description ??= new Uint8Array(meta.decoderConfig.description);
      const data = new Uint8Array(chunk.byteLength);
      chunk.copyTo(data);
      samples.push({ data, ts: chunk.timestamp, dur: Math.round(((chunk.duration ?? 0) * SAMPLE_RATE) / 1e6) || 1024 });
    },
    error: (e) => console.warn(e), // flush() rejects with it
  });
  enc.configure(audioConfig(channels));
  const block = 4096;
  const planes = [...Array(channels)].map((_, c) => audio.getChannelData(c));
  for (let at = 0; at < audio.length; at += block) {
    const n = Math.min(block, audio.length - at);
    const data = new Float32Array(n * channels);
    planes.forEach((p, c) => data.set(p.subarray(at, at + n), c * n));
    enc.encode(new AudioData({ format: 'f32-planar', sampleRate: SAMPLE_RATE, numberOfFrames: n, numberOfChannels: channels, timestamp: Math.round((at / SAMPLE_RATE) * 1e6), data }));
    while (enc.encodeQueueSize > 32 && enc.state === 'configured') await new Promise((r) => enc.addEventListener('dequeue', r, { once: true }));
    onProgress(at / audio.length);
  }
  await enc.flush();
  enc.close();
  // AudioSpecificConfig for AAC-LC when the encoder does not hand one out
  if (!description) {
    const fi = SAMPLE_RATE === 48000 ? 3 : 4;
    description = u16((2 << 11) | (fi << 7) | (channels << 3));
  }
  return { samples, description, channels };
}

async function encodeVideo(image, seconds, onProgress) {
  const canvas = new OffscreenCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, SIZE, SIZE);
  const sc = Math.min(SIZE / image.width, SIZE / image.height); // non-square covers are letterboxed
  const w = image.width * sc, h = image.height * sc;
  ctx.drawImage(image, (SIZE - w) / 2, (SIZE - h) / 2, w, h);

  const samples = [];
  let description = null;
  const enc = new VideoEncoder({
    output: (chunk, meta) => {
      if (meta?.decoderConfig?.description) description ??= new Uint8Array(meta.decoderConfig.description);
      const data = new Uint8Array(chunk.byteLength);
      chunk.copyTo(data);
      samples.push({ data, key: chunk.type === 'key' });
    },
    error: (e) => console.warn(e), // flush() rejects with it
  });
  enc.configure(videoConfig(await pickVideoCodec()));
  const frames = Math.max(1, Math.ceil(seconds));
  for (let i = 0; i < frames; i++) {
    const frame = new VideoFrame(canvas, { timestamp: i * 1e6, duration: 1e6 });
    enc.encode(frame, { keyFrame: i % KEY_EVERY === 0 });
    frame.close();
    while (enc.encodeQueueSize > 8 && enc.state === 'configured') await new Promise((r) => enc.addEventListener('dequeue', r, { once: true }));
    onProgress(i / frames);
  }
  await enc.flush();
  enc.close();
  if (!description) throw new Error('H.264 encoder returned no avcC');
  // last frame ends with the audio
  const ms = samples.map((_, i) => Math.max(1, Math.min(1000, Math.round(seconds * 1000) - i * 1000)));
  samples.forEach((s, i) => (s.dur = ms[i]));
  return { samples, description };
}

/* ---------- muxing ---------- */
function runLength(values) {
  const out = [];
  for (const v of values) {
    const last = out[out.length - 1];
    if (last && last[1] === v) last[0]++;
    else out.push([1, v]);
  }
  return out;
}

function stbl(sampleEntry, samples, chunkOffsets, chunkSizes, syncSamples) {
  const stts = runLength(samples.map((s) => s.dur));
  const stsc = [];
  chunkSizes.forEach((n, i) => { if (stsc[stsc.length - 1]?.[1] !== n) stsc.push([i + 1, n]); });
  return atom('stbl',
    full('stsd', 0, 0, u32(1), sampleEntry),
    full('stts', 0, 0, u32(stts.length), ...stts.flatMap(([n, d]) => [u32(n), u32(d)])),
    ...(syncSamples ? [full('stss', 0, 0, u32(syncSamples.length), ...syncSamples.map(u32))] : []),
    full('stsc', 0, 0, u32(stsc.length), ...stsc.flatMap(([first, n]) => [u32(first), u32(n), u32(1)])),
    full('stsz', 0, 0, u32(0), u32(samples.length), ...samples.map((s) => u32(s.data.length))),
    full('stco', 0, 0, u32(chunkOffsets.length), ...chunkOffsets.map(u32)),
  );
}

function trak({ id, handler, timescale, duration, movieDuration, header, sampleEntry, table }) {
  const video = handler === 'vide';
  return atom('trak',
    full('tkhd', 0, 3, u32(0), u32(0), u32(id), zeros(4), u32(movieDuration), zeros(8), u16(0), u16(0), u16(video ? 0 : 0x0100), zeros(2), ...MATRIX, u32(video ? SIZE << 16 : 0), u32(video ? SIZE << 16 : 0)),
    atom('mdia',
      full('mdhd', 0, 0, u32(0), u32(0), u32(timescale), u32(duration), u16(0x55c4), zeros(2)),
      full('hdlr', 0, 0, zeros(4), new TextEncoder().encode(handler), zeros(12), new TextEncoder().encode(video ? 'VideoHandler\0' : 'SoundHandler\0')),
      atom('minf',
        header,
        atom('dinf', full('dref', 0, 0, u32(1), full('url ', 0, 1))),
        stbl(sampleEntry, ...table),
      ),
    ),
  );
}

function avc1(description) {
  const name = zeros(32);
  return atom('avc1', zeros(6), u16(1), zeros(16), u16(SIZE), u16(SIZE), u32(0x480000), u32(0x480000), zeros(4), u16(1), name, u16(0x18), u16(0xffff), atom('avcC', description));
}

function mp4a(description, channels) {
  const desc = (tag, ...parts) => {
    const body = parts.reduce((a, p) => [...a, ...p], []);
    return new Uint8Array([tag, body.length, ...body]); // all our descriptors are < 128 bytes
  };
  const es = desc(3, u16(0), [0],
    desc(4, [0x40, 0x15], [0, 0, 0], u32(192_000), u32(192_000), desc(5, description)),
    desc(6, [2]));
  return atom('mp4a', zeros(6), u16(1), zeros(8), u16(channels), u16(16), zeros(4), u32(SAMPLE_RATE << 16), full('esds', 0, 0, es));
}

function mux(video, audio, udta) {
  // interleave: one video frame, then the audio of that second
  const chunks = [];
  let ai = 0;
  video.samples.forEach((s, i) => {
    chunks.push({ track: 0, samples: [s] });
    const end = (i + 1) * 1e6;
    const last = i === video.samples.length - 1;
    const part = [];
    while (ai < audio.samples.length && (last || audio.samples[ai].ts < end)) part.push(audio.samples[ai++]);
    if (part.length) chunks.push({ track: 1, samples: part });
  });

  const ftyp = atom('ftyp', new TextEncoder().encode('isom'), u32(0x200), new TextEncoder().encode('isomiso2avc1mp41'));
  const vDur = video.samples.reduce((n, s) => n + s.dur, 0);
  const aDur = audio.samples.reduce((n, s) => n + s.dur, 0);
  const movieDur = Math.max(vDur, Math.round((aDur / SAMPLE_RATE) * 1000));
  const vSync = video.samples.flatMap((s, i) => (s.key ? [i + 1] : []));

  const buildMoov = (base) => {
    const offs = [[], []], sizes = [[], []];
    let at = base;
    for (const c of chunks) {
      offs[c.track].push(at);
      sizes[c.track].push(c.samples.length);
      at += c.samples.reduce((n, s) => n + s.data.length, 0);
    }
    return atom('moov',
      full('mvhd', 0, 0, u32(0), u32(0), u32(1000), u32(movieDur), u32(0x10000), u16(0x0100), zeros(10), ...MATRIX, zeros(24), u32(3)),
      trak({ id: 1, handler: 'vide', timescale: 1000, duration: vDur, movieDuration: movieDur, header: full('vmhd', 0, 1, zeros(8)), sampleEntry: avc1(video.description), table: [video.samples, offs[0], sizes[0], vSync] }),
      trak({ id: 2, handler: 'soun', timescale: SAMPLE_RATE, duration: aDur, movieDuration: movieDur, header: full('smhd', 0, 0, zeros(4)), sampleEntry: mp4a(audio.description, audio.channels), table: [audio.samples, offs[1], sizes[1], null] }),
      udta,
    );
  };
  // stco entries are fixed width, so the moov size does not depend on the offsets
  const size = buildMoov(0).length;
  const moov = buildMoov(ftyp.length + size + 8);
  const payload = chunks.flatMap((c) => c.samples.map((s) => s.data));
  const mdatLen = 8 + payload.reduce((n, d) => n + d.length, 0);
  return new Blob([ftyp, moov, u32(mdatLen), new TextEncoder().encode('mdat'), ...payload], { type: 'video/mp4' });
}

// buf: the audio file, cover: { url, bytes, mime }, tags: title/artist/... for the ilst.
export async function makeVideo(buf, cover, tags, onProgress = () => {}) {
  const image = await createImageBitmap(new Blob([cover.bytes], { type: cover.mime }));
  const decoded = await decodeAudio(buf);
  onProgress(0.05);
  const audio = await encodeAudio(decoded, (p) => onProgress(0.05 + p * 0.75));
  const video = await encodeVideo(image, decoded.duration, (p) => onProgress(0.8 + p * 0.18));
  image.close();
  return mux(video, audio, buildUdta(tags, cover));
}
