/**
 * Detect audio MIME type from file content magic bytes.
 *
 * This avoids trusting the client-provided Content-Type header,
 * which can be trivially forged. Instead we inspect the first bytes
 * of the buffer for well-known audio signatures.
 *
 * Supported formats: MP4/M4A, WAV, OGG, MP3 (MPEG).
 */

const SIGNATURES: { mime: string; check: (buf: Buffer) => boolean }[] = [
  {
    mime: "audio/mp4",
    // MP4/M4A: has "ftyp" at offset 4
    check: (buf) =>
      buf.length >= 8 &&
      buf[4] === 0x66 && // f
      buf[5] === 0x74 && // t
      buf[6] === 0x79 && // y
      buf[7] === 0x70, // p
  },
  {
    mime: "audio/wav",
    // WAV: RIFF header (52 49 46 46) + WAVE at offset 8
    check: (buf) =>
      buf.length >= 12 &&
      buf[0] === 0x52 &&
      buf[1] === 0x49 &&
      buf[2] === 0x46 &&
      buf[3] === 0x46 &&
      buf[8] === 0x57 &&
      buf[9] === 0x41 &&
      buf[10] === 0x56 &&
      buf[11] === 0x45,
  },
  {
    mime: "audio/ogg",
    // OGG: starts with "OggS" (4F 67 67 53)
    check: (buf) =>
      buf.length >= 4 &&
      buf[0] === 0x4f &&
      buf[1] === 0x67 &&
      buf[2] === 0x67 &&
      buf[3] === 0x53,
  },
  {
    mime: "audio/mpeg",
    // MP3: starts with FF FB, FF F3, or FF F2 (MPEG frame sync)
    check: (buf) =>
      buf.length >= 2 &&
      buf[0] === 0xff &&
      (buf[1] === 0xfb || buf[1] === 0xf3 || buf[1] === 0xf2),
  },
  {
    mime: "audio/aac",
    // AAC ADTS: starts with FF F1 or FF F9
    check: (buf) =>
      buf.length >= 2 &&
      buf[0] === 0xff &&
      (buf[1] === 0xf1 || buf[1] === 0xf9),
  },
];

/**
 * Inspect the magic bytes of a buffer and return the detected MIME type,
 * or `null` if the content does not match any supported audio format.
 */
export function detectAudioMimeType(buffer: Buffer): string | null {
  for (const sig of SIGNATURES) {
    if (sig.check(buffer)) {
      return sig.mime;
    }
  }
  return null;
}
