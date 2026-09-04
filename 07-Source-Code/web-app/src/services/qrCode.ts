/**
 * Standalone offline QR Code generator (ISO/IEC 18004 compliant, Byte mode, Error Correction Level M).
 * Supports QR Versions 1 to 10 with zero external dependencies.
 */

const EXP_TABLE = new Uint8Array(256)
const LOG_TABLE = new Uint8Array(256)

let x = 1
for (let i = 0; i < 255; i++) {
  EXP_TABLE[i] = x
  LOG_TABLE[x] = i
  x <<= 1
  if (x & 0x100) x ^= 0x11d
}
EXP_TABLE[255] = EXP_TABLE[0] ?? 1

function gmult(a: number, b: number): number {
  if (a === 0 || b === 0) return 0
  const logA = LOG_TABLE[a] ?? 0
  const logB = LOG_TABLE[b] ?? 0
  return EXP_TABLE[(logA + logB) % 255] ?? 0
}

function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1])
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1)
    const factor = EXP_TABLE[i] ?? 0
    for (let j = 0; j < poly.length; j++) {
      const pVal = poly[j] ?? 0
      next[j] = (next[j] ?? 0) ^ pVal
      next[j + 1] = (next[j + 1] ?? 0) ^ gmult(pVal, factor)
    }
    poly = next
  }
  return poly
}

function rsRemainder(data: Uint8Array, numEc: number): Uint8Array {
  const gen = rsGeneratorPoly(numEc)
  const res = new Uint8Array(data.length + numEc)
  res.set(data)
  for (let i = 0; i < data.length; i++) {
    const coef = res[i] ?? 0
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        const targetIdx = i + j
        res[targetIdx] = (res[targetIdx] ?? 0) ^ gmult(gen[j] ?? 0, coef)
      }
    }
  }
  return res.slice(data.length)
}

interface VersionEntry {
  totalCodewords: number
  totalDataCodewords: number
  ecPerBlock: number
  numBlocksG1: number
  dataG1: number
  numBlocksG2: number
  dataG2: number
}

// Table for Error Correction Level M (Versions 1 to 10)
const EC_M_ENTRIES: readonly VersionEntry[] = [
  { totalCodewords: 0, totalDataCodewords: 0, ecPerBlock: 0, numBlocksG1: 0, dataG1: 0, numBlocksG2: 0, dataG2: 0 },
  { totalCodewords: 26, totalDataCodewords: 16, ecPerBlock: 10, numBlocksG1: 1, dataG1: 16, numBlocksG2: 0, dataG2: 0 }, // V1: 21x21
  { totalCodewords: 44, totalDataCodewords: 28, ecPerBlock: 16, numBlocksG1: 1, dataG1: 28, numBlocksG2: 0, dataG2: 0 }, // V2: 25x25
  { totalCodewords: 70, totalDataCodewords: 44, ecPerBlock: 26, numBlocksG1: 1, dataG1: 44, numBlocksG2: 0, dataG2: 0 }, // V3: 29x29
  { totalCodewords: 100, totalDataCodewords: 64, ecPerBlock: 18, numBlocksG1: 2, dataG1: 32, numBlocksG2: 0, dataG2: 0 }, // V4: 33x33
  { totalCodewords: 134, totalDataCodewords: 86, ecPerBlock: 24, numBlocksG1: 2, dataG1: 43, numBlocksG2: 0, dataG2: 0 }, // V5: 37x37
  { totalCodewords: 172, totalDataCodewords: 108, ecPerBlock: 16, numBlocksG1: 4, dataG1: 27, numBlocksG2: 0, dataG2: 0 }, // V6: 41x41
  { totalCodewords: 196, totalDataCodewords: 124, ecPerBlock: 18, numBlocksG1: 4, dataG1: 31, numBlocksG2: 0, dataG2: 0 }, // V7: 45x45
  { totalCodewords: 242, totalDataCodewords: 154, ecPerBlock: 22, numBlocksG1: 2, dataG1: 38, numBlocksG2: 2, dataG2: 39 }, // V8: 49x49
  { totalCodewords: 292, totalDataCodewords: 182, ecPerBlock: 22, numBlocksG1: 3, dataG1: 36, numBlocksG2: 2, dataG2: 37 }, // V9: 53x53
  { totalCodewords: 346, totalDataCodewords: 216, ecPerBlock: 26, numBlocksG1: 4, dataG1: 43, numBlocksG2: 1, dataG2: 44 }, // V10: 57x57
]

const ALIGNMENT_PATTERNS: readonly (readonly number[])[] = [
  [],
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
]

// Precalculated 15-bit format info for Level M (BCH error correction + XOR 0x5412)
const FORMAT_INFO_M: readonly number[] = [
  0b101010000010010, // Mask 0
  0b101000100100101, // Mask 1
  0b101111001111100, // Mask 2
  0b101101101001011, // Mask 3
  0b100010111111001, // Mask 4
  0b100000011001110, // Mask 5
  0b100111110010111, // Mask 6
  0b100101010100000, // Mask 7
]

function selectVersion(dataLen: number): number {
  for (let v = 1; v <= 10; v++) {
    const entry = EC_M_ENTRIES[v]
    if (!entry) continue
    const headerBits = 4 + (v <= 9 ? 8 : 16)
    if (dataLen * 8 + headerBits <= entry.totalDataCodewords * 8) {
      return v
    }
  }
  throw new Error(`ข้อความยาวเกินความจุ QR Code รุ่น 1-10 (${dataLen} ไบต์)`)
}

export interface QrMatrixResult {
  version: number
  size: number
  matrix: boolean[][]
}

export function generateQrMatrix(text: string): QrMatrixResult {
  const utf8 = new TextEncoder().encode(text)
  const version = selectVersion(utf8.length)
  const entry = EC_M_ENTRIES[version]
  if (!entry) throw new Error('ไม่พบข้อมูลขนาด QR Code')

  const { totalCodewords, totalDataCodewords, ecPerBlock, numBlocksG1, dataG1, numBlocksG2, dataG2 } =
    entry

  const bits: number[] = []
  function pushBits(val: number, num: number): void {
    for (let i = num - 1; i >= 0; i--) {
      bits.push((val >> i) & 1)
    }
  }

  // Byte mode indicator: 0100
  pushBits(0b0100, 4)
  // Character count
  pushBits(utf8.length, version <= 9 ? 8 : 16)
  // Data bytes
  for (let i = 0; i < utf8.length; i++) {
    pushBits(utf8[i] ?? 0, 8)
  }

  // Terminator (up to 4 zeroes)
  const maxBits = totalDataCodewords * 8
  const termLen = Math.min(4, maxBits - bits.length)
  pushBits(0, termLen)

  // Pad to multiple of 8
  if (bits.length % 8 !== 0) {
    pushBits(0, 8 - (bits.length % 8))
  }

  // Pad bytes 0xEC, 0x11
  const dataCodewords = new Uint8Array(totalDataCodewords)
  let byteIdx = 0
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | (bits[i + j] ?? 0)
    }
    dataCodewords[byteIdx++] = b
  }
  let padToggle = false
  while (byteIdx < totalDataCodewords) {
    dataCodewords[byteIdx++] = padToggle ? 0x11 : 0xec
    padToggle = !padToggle
  }

  // Split into blocks and compute Reed-Solomon EC
  interface Block {
    data: Uint8Array
    ec: Uint8Array
  }
  const blocks: Block[] = []
  let offset = 0
  for (let b = 0; b < numBlocksG1; b++) {
    const d = dataCodewords.slice(offset, offset + dataG1)
    offset += dataG1
    const ec = rsRemainder(d, ecPerBlock)
    blocks.push({ data: d, ec })
  }
  for (let b = 0; b < numBlocksG2; b++) {
    const d = dataCodewords.slice(offset, offset + dataG2)
    offset += dataG2
    const ec = rsRemainder(d, ecPerBlock)
    blocks.push({ data: d, ec })
  }

  // Interleave data codewords
  const finalCodewords = new Uint8Array(totalCodewords)
  let finalIdx = 0
  const maxBlockData = Math.max(dataG1, dataG2)
  for (let i = 0; i < maxBlockData; i++) {
    for (const blk of blocks) {
      if (i < blk.data.length) {
        finalCodewords[finalIdx++] = blk.data[i] ?? 0
      }
    }
  }
  // Interleave EC codewords
  for (let i = 0; i < ecPerBlock; i++) {
    for (const blk of blocks) {
      finalCodewords[finalIdx++] = blk.ec[i] ?? 0
    }
  }

  // Build matrix
  const size = 4 * version + 17
  const matrix: boolean[][] = Array.from({ length: size }, () => Array.from({ length: size }, () => false))
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array.from({ length: size }, () => false))

  function setFunction(r: number, c: number, val: boolean): void {
    const row = matrix[r]
    const fnRow = isFunction[r]
    if (row && fnRow) {
      row[c] = val
      fnRow[c] = true
    }
  }

  function getFunction(r: number, c: number): boolean {
    return isFunction[r]?.[c] ?? false
  }

  // Finder pattern
  function drawFinder(startR: number, startC: number): void {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBlack =
          r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        setFunction(startR + r, startC + c, isBlack)
      }
    }
    // Separator
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        if (r === -1 || r === 7 || c === -1 || c === 7) {
          const row = startR + r
          const col = startC + c
          if (row >= 0 && row < size && col >= 0 && col < size) {
            setFunction(row, col, false)
          }
        }
      }
    }
  }

  // 3 Finders
  drawFinder(0, 0)
  drawFinder(0, size - 7)
  drawFinder(size - 7, 0)

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (!getFunction(6, i)) setFunction(6, i, i % 2 === 0)
    if (!getFunction(i, 6)) setFunction(i, 6, i % 2 === 0)
  }

  // Alignment patterns
  const alignCoords = ALIGNMENT_PATTERNS[version] ?? []
  for (const r of alignCoords) {
    for (const c of alignCoords) {
      if (getFunction(r, c)) continue
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const isBlack = Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0)
          setFunction(r + dr, c + dc, isBlack)
        }
      }
    }
  }

  // Dark module
  setFunction(4 * version + 9, 8, true)

  // Reserve format info modules
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      setFunction(8, i, false)
      setFunction(i, 8, false)
    }
  }
  for (let i = 0; i < 8; i++) {
    setFunction(8, size - 1 - i, false)
    setFunction(size - 1 - i, 8, false)
  }

  // Place data bits in zig-zag
  const allBits: number[] = []
  for (let i = 0; i < finalCodewords.length; i++) {
    const cw = finalCodewords[i] ?? 0
    for (let b = 7; b >= 0; b--) {
      allBits.push((cw >> b) & 1)
    }
  }

  let bitIdx = 0
  let upward = true
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right-- // skip timing column
    const rows = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i)

    for (const r of rows) {
      for (const c of [right, right - 1]) {
        if (!getFunction(r, c)) {
          const bit = bitIdx < allBits.length ? (allBits[bitIdx++] ?? 0) : 0
          const row = matrix[r]
          if (row) row[c] = bit === 1
        }
      }
    }
    upward = !upward
  }

  // Masking: Mask pattern 0: (r + c) % 2 === 0
  const mask = 0
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!getFunction(r, c)) {
        if ((r + c) % 2 === 0) {
          const row = matrix[r]
          if (row) row[c] = !(row[c] ?? false)
        }
      }
    }
  }

  // Format info placement
  const formatBits = FORMAT_INFO_M[mask] ?? 0
  const formatCoords: readonly (readonly [number, number])[] = [
    [8, 0],
    [8, 1],
    [8, 2],
    [8, 3],
    [8, 4],
    [8, 5],
    [8, 7],
    [8, 8],
    [7, 8],
    [5, 8],
    [4, 8],
    [3, 8],
    [2, 8],
    [1, 8],
    [0, 8],
  ]
  for (let i = 0; i < 15; i++) {
    const bit = ((formatBits >> (14 - i)) & 1) === 1
    const coord = formatCoords[i]
    if (coord) {
      const [r, c] = coord
      const row = matrix[r]
      if (row) row[c] = bit
    }
  }
  for (let i = 0; i < 7; i++) {
    const bit = ((formatBits >> i) & 1) === 1
    const row = matrix[size - 1 - i]
    if (row) row[8] = bit
  }
  for (let i = 7; i < 15; i++) {
    const bit = ((formatBits >> i) & 1) === 1
    const row = matrix[8]
    if (row) row[size - 15 + i] = bit
  }

  return { version, size, matrix }
}

export interface QrSvgOptions {
  margin?: number
  size?: number
  /** Human-readable text rendered below the QR code, e.g. a TAG code. */
  label?: string
  labelFontSize?: number
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      default:
        return '&apos;'
    }
  })
}

/**
 * Generate a standalone SVG string for the given text.
 */
export function generateQrSvg(text: string, options: QrSvgOptions = {}): string {
  const { matrix, size } = generateQrMatrix(text)
  const margin = options.margin ?? 4
  const viewBoxSize = size + margin * 2
  const label = options.label?.trim()
  const labelFontSize = label
    ? Math.min(options.labelFontSize ?? 3.2, Math.max(1.5, (viewBoxSize - 1) / (label.length * 0.62)))
    : 0
  const labelHeight = label ? Math.max(5.5, labelFontSize + 2) : 0
  const viewBoxHeight = viewBoxSize + labelHeight

  let pathData = ''
  for (let r = 0; r < size; r++) {
    const row = matrix[r]
    if (!row) continue
    for (let c = 0; c < size; c++) {
      if (row[c]) {
        let w = 1
        while (c + w < size && row[c + w]) {
          w++
        }
        pathData += `M${c + margin},${r + margin}h${w}v1h-${w}z `
        c += w - 1
      }
    }
  }

  const labelMarkup = label
    ? `<text x="${viewBoxSize / 2}" y="${viewBoxSize + labelFontSize + 0.35}" text-anchor="middle" font-family="monospace" font-size="${labelFontSize}" font-weight="700" fill="#000000">${escapeXml(label)}</text>`
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxHeight}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#ffffff"/><path d="${pathData.trim()}" fill="#000000"/>${labelMarkup}</svg>`
}

/**
 * Generate an inline Data URL (data:image/svg+xml;utf8,...) for use directly in <img src="...">.
 */
export function generateQrDataUrl(text: string, options: QrSvgOptions = {}): string {
  const svg = generateQrSvg(text, options)
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
