const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateTrackingCode() {
  let code = 'TRK-';
  for (let i = 0; i < 8; i += 1) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}
