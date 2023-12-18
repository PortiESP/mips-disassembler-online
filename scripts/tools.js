export function parseSignedInt(str, base) {
  const num = parseInt(str, base)
  const msb = 1 << (str.length - 1)
  return num >= msb ? num - (msb << 1) : num
}
