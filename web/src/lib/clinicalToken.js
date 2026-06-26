const TOKEN_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Generate a 6-character clinical token (no ambiguous characters). */
export function generateClinicalToken() {
  let token = '';
  const array = new Uint32Array(6);
  crypto.getRandomValues(array);
  for (let i = 0; i < 6; i++) {
    token += TOKEN_CHARS[array[i] % TOKEN_CHARS.length];
  }
  return token;
}
