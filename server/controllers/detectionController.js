const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { addHistoryEntry } = require('../models/userStore');

// ── State & RTO Data ─────────────────────────────────────────────────────────
const STATE_CODES = {
  AN: 'Andaman and Nicobar Islands', AP: 'Andhra Pradesh', AR: 'Arunachal Pradesh',
  AS: 'Assam', BR: 'Bihar', CG: 'Chhattisgarh', CH: 'Chandigarh',
  DD: 'Daman and Diu', DL: 'Delhi', DN: 'Dadra and Nagar Haveli',
  GA: 'Goa', GJ: 'Gujarat', HP: 'Himachal Pradesh', HR: 'Haryana',
  JH: 'Jharkhand', JK: 'Jammu and Kashmir', KA: 'Karnataka', KL: 'Kerala',
  LA: 'Ladakh', LD: 'Lakshadweep', MH: 'Maharashtra', ML: 'Meghalaya',
  MN: 'Manipur', MP: 'Madhya Pradesh', MZ: 'Mizoram', NL: 'Nagaland',
  OD: 'Odisha', OR: 'Odisha', PB: 'Punjab', PY: 'Puducherry',
  RJ: 'Rajasthan', SK: 'Sikkim', TG: 'Telangana', TN: 'Tamil Nadu',
  TR: 'Tripura', TS: 'Telangana', UK: 'Uttarakhand', UP: 'Uttar Pradesh',
  WB: 'West Bengal',
};

// Prominent RTO districts for major state codes
const RTO_DISTRICTS = {
  MH: { '01': 'Mumbai (Central)', '02': 'Mumbai (West)', '03': 'Mumbai (East)', '04': 'Thane', '05': 'Kalyan', '06': 'Raigad', '07': 'Pune (City)', '08': 'Pune (Rural)', '09': 'Solapur', '10': 'Nashik', '11': 'Dhule', '12': 'Jalgaon', '14': 'Aurangabad', '15': 'Latur', '20': 'Nagpur', '43': 'Navi Mumbai' },
  DL: { '01': 'Delhi North', '02': 'Delhi South', '03': 'Delhi East', '04': 'Delhi West', '05': 'Delhi Central', '06': 'Delhi Saket', '07': 'Delhi Janakpuri', '08': 'Delhi Loni', '09': 'Delhi Noida Link' },
  KA: { '01': 'Bengaluru (Central)', '02': 'Bengaluru (East)', '03': 'Bengaluru (West)', '04': 'Bengaluru (South)', '05': 'Mysuru', '09': 'Hubballi-Dharwad', '19': 'Mangaluru', '20': 'Belgaum' },
  TN: { '01': 'Chennai (Central)', '02': 'Chennai (North)', '04': 'Coimbatore', '07': 'Madurai', '09': 'Salem', '10': 'Tirunelveli', '11': 'Tiruchirappalli', '19': 'Erode', '22': 'Vellore' },
  GJ: { '01': 'Ahmedabad', '02': 'Surat', '03': 'Vadodara', '04': 'Rajkot', '05': 'Bhavnagar', '06': 'Jamnagar', '07': 'Junagadh', '10': 'Gandhinagar' },
  UP: { '11': 'Agra', '13': 'Allahabad', '14': 'Aligarh', '15': 'Azamgarh', '16': 'Bareilly', '17': 'Budaun', '30': 'Lucknow', '32': 'Mathura', '40': 'Meerut', '41': 'Moradabad', '65': 'Varanasi' },
  WB: { '01': 'Kolkata', '02': 'Howrah', '06': 'Burdwan', '13': 'Durgapur', '14': 'Asansol', '15': 'Siliguri' },
  AP: { '01': 'Kurnool', '02': 'Anantapur', '03': 'Chittoor', '05': 'Guntur', '09': 'Visakhapatnam', '16': 'Vijayawada' },
  TS: { '01': 'Hyderabad', '02': 'Ranga Reddy', '08': 'Warangal', '09': 'Nizamabad', '11': 'Karimnagar' },
  RJ: { '01': 'Ajmer', '02': 'Alwar', '06': 'Bharatpur', '14': 'Jaipur', '20': 'Jodhpur', '21': 'Kota' },
  HR: { '01': 'Ambala', '05': 'Faridabad', '10': 'Gurgaon', '11': 'Hisar', '12': 'Jhajjar', '17': 'Rohtak' },
  PB: { '01': 'Amritsar', '03': 'Bhatinda', '10': 'Jalandhar', '11': 'Ludhiana', '19': 'Mohali', '20': 'Pathankot' },
  MP: { '04': 'Bhopal', '07': 'Gwalior', '09': 'Indore', '16': 'Jabalpur', '30': 'Ujjain', '40': 'Sagar' },
};

// ── Plate Localization (pure-JS edge-density heuristic) ─────────────────────
// There's no OpenCV/GPU detector available in this environment, so this uses
// a classic pre-deep-learning technique: license-plate characters produce a
// dense cluster of vertical edges packed into a small, wide band. We compute
// a vertical-gradient (Sobel Gx) magnitude map, find row bands with unusually
// high edge density, then within each band find the column range with the
// same property and a plausible plate aspect ratio. This is a heuristic, not
// a trained detector — it will miss heavily angled, tiny, or very low-contrast
// plates — but it turns "OCR the whole photo" into "OCR just the plate" for
// the common case, which is the single biggest accuracy lever available here
// without adding a native/ML dependency.

async function getGrayscaleRaw(imagePath, workingWidth) {
  const meta = await sharp(imagePath).metadata();
  const scale = workingWidth / meta.width;
  const workingHeight = Math.max(1, Math.round(meta.height * scale));
  const { data, info } = await sharp(imagePath)
    .resize(workingWidth, workingHeight, { fit: 'fill' })
    .grayscale()
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, origWidth: meta.width, origHeight: meta.height };
}

function sobelVerticalEdges(data, width, height) {
  const mag = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const gx =
        (data[i - width + 1] + 2 * data[i + 1] + data[i + width + 1]) -
        (data[i - width - 1] + 2 * data[i - 1] + data[i + width - 1]);
      mag[i] = Math.abs(gx);
    }
  }
  return mag;
}

function movingAverage(arr, window) {
  const out = new Float32Array(arr.length);
  const half = Math.floor(window / 2);
  let runningSum = 0;
  for (let i = 0; i < Math.min(window, arr.length); i++) runningSum += arr[i];
  for (let i = 0; i < arr.length; i++) {
    const start = Math.max(0, i - half);
    const end = Math.min(arr.length - 1, i + half);
    let s = 0;
    for (let j = start; j <= end; j++) s += arr[j];
    out[i] = s / (end - start + 1);
  }
  return out;
}

function meanOf(arr) {
  let s = 0;
  for (let i = 0; i < arr.length; i++) s += arr[i];
  return s / arr.length;
}

function stddevOf(arr, mean) {
  let s = 0;
  for (let i = 0; i < arr.length; i++) s += (arr[i] - mean) ** 2;
  return Math.sqrt(s / arr.length);
}

function findPlateCandidates(mag, width, height) {
  const gMean = meanOf(mag);
  const gStd = stddevOf(mag, gMean);
  const edgeThreshold = gMean + 0.5 * gStd;

  const rowDensity = new Float32Array(height);
  for (let y = 0; y < height; y++) {
    let count = 0;
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) if (mag[rowOffset + x] > edgeThreshold) count++;
    rowDensity[y] = count;
  }
  const smoothRow = movingAverage(rowDensity, 5);
  const rowMean = meanOf(smoothRow);
  const rowCut = rowMean + 0.4 * stddevOf(smoothRow, rowMean);

  const bands = [];
  let bandStart = -1;
  for (let y = 0; y < height; y++) {
    if (smoothRow[y] > rowCut) {
      if (bandStart === -1) bandStart = y;
    } else if (bandStart !== -1) {
      bands.push([bandStart, y - 1]);
      bandStart = -1;
    }
  }
  if (bandStart !== -1) bands.push([bandStart, height - 1]);

  const merged = [];
  for (const [s, e] of bands) {
    if (merged.length && s - merged[merged.length - 1][1] < 4) merged[merged.length - 1][1] = e;
    else merged.push([s, e]);
  }

  const candidates = [];
  for (const [top, bottom] of merged) {
    const bandHeight = bottom - top + 1;
    if (bandHeight < height * 0.02) continue; // too thin to plausibly hold characters

    const colDensity = new Float32Array(width);
    for (let x = 0; x < width; x++) {
      let count = 0;
      for (let y = top; y <= bottom; y++) if (mag[y * width + x] > edgeThreshold) count++;
      colDensity[x] = count;
    }
    const smoothCol = movingAverage(colDensity, 5);
    const colMean = meanOf(smoothCol);
    const colCut = colMean + 0.4 * stddevOf(smoothCol, colMean);

    const registerCandidate = (left, right) => {
      const w = right - left + 1;
      if (w < width * 0.08) return; // too narrow to be a full plate
      const aspect = w / bandHeight;
      if (aspect < 1.5 || aspect > 7) return; // outside plausible single/two-line plate ratios
      let density = 0;
      for (let y = top; y <= bottom; y++)
        for (let x = left; x <= right; x++) density += mag[y * width + x] > edgeThreshold ? 1 : 0;
      const score = density / (w * bandHeight) - Math.abs(aspect - 4.3) * 0.05;
      candidates.push({ left, top, right, bottom, score });
    };

    // A row band spanning a plate contains one edge-dense run per character,
    // separated by gaps that vary in width (letter spacing isn't uniform,
    // and some gaps are wider than others). Trying to bridge those gaps with
    // a single fixed merge-distance is fragile — some real inter-character
    // gaps end up just over whatever threshold is picked, which fragments
    // one plate into several too-narrow, too-square sub-regions that all
    // fail the width/aspect checks individually. Taking the full left-to-
    // right extent of any above-baseline column activity in the band sides
    // steps that entirely: it doesn't care how many gaps there are or how
    // wide each one is, only where the text-bearing region starts and ends.
    let left = -1, right = -1;
    for (let x = 0; x < width; x++) {
      if (smoothCol[x] > colMean) {
        if (left === -1) left = x;
        right = x;
      }
    }
    if (left !== -1) registerCandidate(left, right);
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, 3);
}

async function locatePlateCrops(imagePath, maxCrops = 2) {
  const workingWidth = 900;
  let region;
  try {
    region = await getGrayscaleRaw(imagePath, workingWidth);
  } catch {
    return [];
  }
  const { data, width, height, origWidth, origHeight } = region;
  const mag = sobelVerticalEdges(data, width, height);
  const candidates = findPlateCandidates(mag, width, height);

  const scaleX = origWidth / width;
  const scaleY = origHeight / height;
  const cropPaths = [];

  for (const cand of candidates.slice(0, maxCrops)) {
    const bandHeight = cand.bottom - cand.top;
    const bandWidth = cand.right - cand.left;
    const padX = Math.round(bandWidth * 0.12);
    const padY = Math.round(bandHeight * 0.3);
    const left = Math.max(0, Math.round((cand.left - padX) * scaleX));
    const top = Math.max(0, Math.round((cand.top - padY) * scaleY));
    const right = Math.min(origWidth, Math.round((cand.right + padX) * scaleX));
    const bottom = Math.min(origHeight, Math.round((cand.bottom + padY) * scaleY));
    const w = right - left, h = bottom - top;
    if (w < 20 || h < 10) continue;

    const outPath = imagePath.replace(/(\.\w+)$/, `_crop${cropPaths.length}$1`);
    try {
      await sharp(imagePath).extract({ left, top, width: w, height: h }).toFile(outPath);
      cropPaths.push(outPath);
    } catch {
      /* skip this candidate */
    }
  }
  return cropPaths;
}

// ── Color Detection ──────────────────────────────────────────────────────────
// Uses a coarse grid of samples + mode-style bucketing instead of a plain
// region average, so a strip of sky/road/chrome in the sampled box doesn't
// wash out the plate's actual color.
async function detectPlateColor(imagePath) {
  try {
    const { data, info } = await sharp(imagePath)
      .resize(240, 240, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const w = info.width, h = info.height;

    const regions = [
      { x0: 0.15, x1: 0.85, y0: 0.6, y1: 0.95 }, // lower center (front plates)
      { x0: 0.25, x1: 0.75, y0: 0.3, y1: 0.7 },  // middle center
      { x0: 0.1, x1: 0.9, y0: 0.4, y1: 0.6 },    // widened middle band
    ];

    const votes = { green: 0, yellow: 0, black: 0, blue: 0, white: 0 };

    for (const reg of regions) {
      const x0 = Math.floor(w * reg.x0), x1 = Math.floor(w * reg.x1);
      const y0 = Math.floor(h * reg.y0), y1 = Math.floor(h * reg.y1);
      const strideX = Math.max(1, Math.floor((x1 - x0) / 24));
      const strideY = Math.max(1, Math.floor((y1 - y0) / 24));

      for (let y = y0; y < y1; y += strideY) {
        for (let x = x0; x < x1; x += strideX) {
          const i = (y * w + x) * 3;
          const cls = classifyPixel(data[i], data[i + 1], data[i + 2]);
          if (cls) votes[cls]++;
        }
      }
    }

    let best = 'white', bestCount = -1;
    for (const [cls, count] of Object.entries(votes)) {
      if (count > bestCount) { best = cls; bestCount = count; }
    }
    if (bestCount < 3) return 'white';
    return best;
  } catch {
    return 'white';
  }
}

function classifyPixel(r, g, b) {
  if (g > 110 && g > r * 1.15 && g > b * 1.1) return 'green';
  if (r > 150 && g > 120 && b < 100 && g > b * 1.4) return 'yellow';
  if (r < 70 && g < 70 && b < 70) return 'black';
  if (b > 120 && b > r * 1.2 && b > g * 1.1) return 'blue';
  if (r > 170 && g > 170 && b > 170) return 'white';
  return null; // ambiguous pixel, don't vote
}

// ── Plate Color → Vehicle Info ───────────────────────────────────────────────
function classifyFromPlateColor(color) {
  const map = {
    green:  { plateType: 'Green Plate',  fuelType: 'Electric',         vehicleCategory: 'Electric Vehicle (EV)',    bodyTypes: ['Car', 'Bus', 'Auto Rickshaw'], colorLabel: 'Green' },
    yellow: { plateType: 'Yellow Plate', fuelType: 'Diesel',           vehicleCategory: 'Commercial Vehicle',       bodyTypes: ['Bus', 'Truck', 'Taxi', 'Auto Rickshaw'], colorLabel: 'Yellow' },
    black:  { plateType: 'Black Plate',  fuelType: 'Petrol / Diesel',  vehicleCategory: 'Private Hire / Rental',   bodyTypes: ['Car', 'SUV'],                 colorLabel: 'Black' },
    blue:   { plateType: 'Blue Plate',   fuelType: 'Petrol / Diesel',  vehicleCategory: 'Diplomatic Vehicle',      bodyTypes: ['Car', 'SUV'],                 colorLabel: 'Blue' },
    white:  { plateType: 'White Plate',  fuelType: 'Petrol / CNG',     vehicleCategory: 'Private Vehicle',         bodyTypes: ['Car', 'Bike', 'Scooter'],     colorLabel: 'White' },
  };
  return map[color] || map.white;
}

// ── Series-Based Refinement ──────────────────────────────────────────────────
function refineBodyType(plate, colorInfo) {
  if (!plate) return colorInfo.bodyTypes;
  const series = plate.replace(/^[A-Z]{2}\d{2}/, '').replace(/\d+$/, '').toUpperCase();
  if (/^T/.test(series) && !colorInfo.vehicleCategory.includes('Electric')) return ['Taxi'];
  if (/^G/.test(series)) return ['Government Vehicle'];
  if (/^E/.test(series)) return ['Electric Vehicle'];
  if (/^(P|TR|BU)/.test(series) && colorInfo.vehicleCategory.includes('Commercial')) return ['Truck / Bus'];
  return colorInfo.bodyTypes;
}

// ── OCR Preprocessing with Sharp ────────────────────────────────────────────
// Produces two variants and lets scoring pick the winner:
//
// "gentle" — grayscale, normalize, a light sharpen only. Verified against a
// clean vector-style plate graphic that a heavier sharpen({sigma:1.2}) +
// linear-contrast-stretch pipeline (the previous approach) actively destroys:
// it merges and distorts strokes on bold, anti-aliased fonts, turning an
// otherwise-clean image into a worse OCR read than doing almost nothing.
// The gentle variant with a generous upscale (relative to the source's own
// resolution, not a fixed absolute width) consistently got within one
// character of ground truth in testing, where the old pipeline was off by
// four or more.
//
// "threshold" — hard binarization. Kept for the opposite failure mode: real
// photos with glare or genuinely low contrast, where gentle normalization
// alone isn't enough and a harder cutoff helps more than it hurts.
//
// Scaling to a multiple of the source's own width (rather than a fixed
// target like 1800px) matters because this preprocessing runs on both full
// photos and small localized crops — a crop that's already 1800px doesn't
// need identical treatment to one that's 200px.
async function preprocessForOCR(inputPath) {
  const gentlePath = inputPath.replace(/(\.\w+)$/, '_ocr_gentle$1');
  const thresholdPath = inputPath.replace(/(\.\w+)$/, '_ocr_threshold$1');
  const results = [];

  let targetWidth = 2600;
  try {
    const meta = await sharp(inputPath).metadata();
    targetWidth = Math.min(4000, Math.max(1200, Math.round(meta.width * 2.75)));
  } catch {
    /* fall back to default targetWidth */
  }

  try {
    await sharp(inputPath)
      .resize({ width: targetWidth, withoutEnlargement: false })
      .grayscale()
      .normalize()
      .sharpen({ sigma: 0.3 })
      .toFile(gentlePath);
    results.push(gentlePath);
  } catch {
    /* skip this variant */
  }

  try {
    await sharp(inputPath)
      .resize({ width: targetWidth, withoutEnlargement: false })
      .grayscale()
      .normalize()
      .sharpen({ sigma: 1.0 })
      .threshold(150) // binarize — helps on glare/low-contrast plates
      .toFile(thresholdPath);
    results.push(thresholdPath);
  } catch {
    /* skip this variant */
  }

  return results; // zero, one, or two paths — caller falls back to original if empty
}

// ── OCR Character Corrections ────────────────────────────────────────────────
// Indian plate: [STATE:AA] [DIST:00] [SERIES:A-ZZZ] [NUM:0000]
// letter positions → fix digit-looking chars to letters
// digit positions  → fix letter-looking chars to digits
const LETTER_TO_DIGIT = {
  O: '0', Q: '0', D: '0', U: '0',
  I: '1', L: '1',
  Z: '2',
  S: '5',
  G: '6',
  B: '8',
  T: '7',
};

const DIGIT_TO_LETTER = {
  0: 'O', 1: 'I', 2: 'Z', 5: 'S', 6: 'G', 7: 'T', 8: 'B',
};

const LETTER_CONFUSIONS = {
  M: ['H', 'N', 'W', 'K'],
  H: ['M', 'N', 'K'],
  K: ['M', 'H', 'X'],
  W: ['M', 'N'],
  N: ['M', 'H'],
  O: ['D', 'Q'],
  D: ['O'],
  C: ['G'],
  G: ['C'],
  B: ['R', '8'],
  R: ['B'],
  S: ['5'],
  Z: ['2'],
  I: ['1', 'L'],
  L: ['I'],
};

function correctPlateCandidate(raw) {
  if (raw.length < 6) return null;
  let corrected = raw;

  corrected = corrected.slice(0, 2).split('').map(c => DIGIT_TO_LETTER[c] || c).join('') + corrected.slice(2);

  corrected = corrected.slice(0, 2)
    + corrected.slice(2, 4).split('').map(c => LETTER_TO_DIGIT[c] || c).join('')
    + corrected.slice(4);

  if (corrected.length >= 6) {
    const tail = corrected.slice(-4).split('').map(c => LETTER_TO_DIGIT[c] || c).join('');
    const series = corrected.slice(4, corrected.length - 4)
      .split('').map(c => DIGIT_TO_LETTER[c] || c).join('');
    corrected = corrected.slice(0, 4) + series + tail;
  }

  return corrected;
}

// BH-series correction: format is [YY][BH][####][XX] — two digits, literal
// "BH", four digits, one or two letters — a different layout from the
// standard plate, so it gets its own corrector rather than being forced
// through the standard state/district/series/number corrector.
function correctBHCandidate(raw) {
  if (raw.length < 8) return null;
  let corrected = raw;

  corrected = corrected.slice(0, 2).split('').map(c => LETTER_TO_DIGIT[c] || c).join('') + corrected.slice(2);
  corrected = corrected.slice(0, 2)
    + corrected.slice(2, 4).split('').map(c => DIGIT_TO_LETTER[c] || c).join('')
    + corrected.slice(4);
  corrected = corrected.slice(0, 4)
    + corrected.slice(4, 8).split('').map(c => LETTER_TO_DIGIT[c] || c).join('')
    + corrected.slice(8);
  corrected = corrected.slice(0, 8)
    + corrected.slice(8).split('').map(c => DIGIT_TO_LETTER[c] || c).join('');

  return corrected;
}

// ── Plate Extraction ─────────────────────────────────────────────────────────
// Standard Indian: XX 00 XX 0000 / XX 00 XXX 0000 / XX 00 X 0000
// BH series:       YY BH 0000 XX   (the BH literal comes AFTER the year
// digits — the original pattern here had the groups in the wrong order and
// could never match a real BH plate)
const PLATE_PATTERNS = [
  /([A-Z]{2})(\d{2})([A-Z]{1,3})(\d{4})/,   // standard
  /([A-Z]{2})(\d{2})([A-Z]{1,2})(\d{1,4})/, // partial last digits
  /([A-Z]{2})(\d{1,2})([A-Z]{1,3})(\d{3,4})/, // relaxed district
];

const BH_PATTERN = /(\d{2})(BH)(\d{4})([A-Z]{1,2})/;

function tryExtractBHPlate(candidate) {
  const corrected = correctBHCandidate(candidate);
  const pool = [...new Set([candidate, corrected])].filter(Boolean);
  for (const c of pool) {
    const m = c.match(BH_PATTERN);
    if (m) return `${m[1]}${m[2]}${m[3]}${m[4]}`;
  }
  return null;
}

function tryExtractPlate(text) {
  const clean = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length < 6) return null;

  const bh = tryExtractBHPlate(clean);
  if (bh) return bh;

  const corrected = correctPlateCandidate(clean);
  const candidates = [...new Set([clean, corrected])].filter(Boolean);

  for (const candidate of candidates) {

    for (const pattern of PLATE_PATTERNS) {
      const m = candidate.match(pattern);

      if (!m) continue;

      const state = chooseBestState(m[1], m[2]);

      if (STATE_CODES[state]) {
        return `${state}${m[2].padStart(2, '0')}${m[3] || ''}${(m[4] || '').padStart(4, '0')}`;
      }
    }

    // fallback if state is still unknown
    for (const pattern of PLATE_PATTERNS) {
      const m = candidate.match(pattern);

      if (!m) continue;

      return `${m[1]}${m[2].padStart(2, '0')}${m[3] || ''}${(m[4] || '').padStart(4, '0')}`;
    }
  }

  return null;
}

// ── Multi-line plate handling ────────────────────────────────────────────────
function extractBestPlate(rawOcrText) {
  const lines = rawOcrText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length >= 2);

  const candidates = [];

  const fullCleaned = rawOcrText.toUpperCase().replace(/[^A-Z0-9]/g, '');
  candidates.push(fullCleaned);

  for (const line of lines) {
    candidates.push(line.toUpperCase().replace(/[^A-Z0-9]/g, ''));
  }

  for (let i = 0; i < lines.length - 1; i++) {
    const combo = (lines[i] + lines[i + 1]).toUpperCase().replace(/[^A-Z0-9]/g, '');
    candidates.push(combo);
    if (i + 2 < lines.length) {
      const skip = (lines[i] + lines[i + 2]).toUpperCase().replace(/[^A-Z0-9]/g, '');
      candidates.push(skip);
    }
  }

  // Bounded sliding window: real plates (stripped of separators) run 8-10
  // chars. Scanning every length 6-11 (as before) generated thousands of
  // mostly-meaningless short candidates that could occasionally out-score
  // the real plate; narrowing to plausible plate lengths cuts that noise.
  if (fullCleaned.length >= 8) {
    for (let start = 0; start <= fullCleaned.length - 8; start++) {
      for (let len = 8; len <= Math.min(10, fullCleaned.length - start); len++) {
        candidates.push(fullCleaned.substring(start, start + len));
      }
    }
  }

  let bestPlate = null;
  let bestScore = -1;

  for (const candidate of candidates) {
    if (!candidate || candidate.length < 6) continue;
    const plate = tryExtractPlate(candidate);
    if (!plate) continue;

    const score = scorePlate(plate);
    if (score > bestScore) {
      bestScore = score;
      bestPlate = plate;
    }
    if (bestScore >= 9) break;
  }

  return bestPlate;
}

// Centralized scoring so both the extraction loop and the cross-OCR-pass
// selection (full image vs. localized crops, multiple PSM modes) rank
// candidates the same way.
function scorePlate(plate) {
  if (!plate) return -1;
  let score = 0;
  const isBH = /^\d{2}BH\d{4}[A-Z]{1,2}$/.test(plate);
  if (isBH) return score + 5; // matched the distinctive BH literal — strong signal

  const stateCode = plate.substring(0, 2);
  if (STATE_CODES[stateCode]) score += 4;
  if (/^[A-Z]{2}\d{2}[A-Z]{1,3}\d{4}$/.test(plate)) score += 3;
  else if (/^[A-Z]{2}\d{2}[A-Z]{1,3}\d{1,4}$/.test(plate)) score += 1;
  if (plate.length >= 8) score += 1;

  // District is a recognized RTO office for this state, not just any two
  // digits — cuts false positives that happen to start with a valid state
  // code but an implausible district.
  const distCode = plate.substring(2, 4);
  if (RTO_DISTRICTS[stateCode]?.[distCode]) score += 1;

  return score;
}

function validatePlate(plate) {
  if (!plate) return false;
  return /^[A-Z]{2}\d{2}[A-Z]{1,3}\d{4}$/.test(plate) || /^\d{2}BH\d{4}[A-Z]{1,2}$/.test(plate);
}

function detectState(plate) {
  if (/^\d{2}BH/.test(plate)) return { code: 'BH', name: 'Bharat Series (multi-state)', found: true };
  const code = plate.substring(0, 2);
  return { code, name: STATE_CODES[code] || 'Unknown State', found: !!STATE_CODES[code] };
}

function getRTOInfo(plate) {
  if (/^\d{2}BH/.test(plate)) {
    return { code: 'BH', district: null, description: 'Bharat Series — not tied to a single RTO' };
  }
  const stateCode = plate.substring(0, 2);
  const distCode  = plate.substring(2, 4);
  const distNum   = parseInt(distCode, 10);

  const districtName = RTO_DISTRICTS[stateCode]?.[distCode]
    || RTO_DISTRICTS[stateCode]?.[String(distNum)]
    || `District ${distNum}`;

  return { code: distCode, district: distNum, description: districtName };
}

// ── OCR Execution ────────────────────────────────────────────────────────────
// Restricting Tesseract to A-Z0-9 removes a whole class of misreads
// (punctuation, accented characters, stray symbols) before the correction
// logic ever sees them.
//
// PSM mode is chosen based on what the image actually contains: a full car
// photo is NOT one line of text, so it gets sparse-text / uniform-block
// modes; a cropped plate region genuinely is one line (or two, for
// stacked-format plates), so it gets single-line / single-word modes.
// Using single-line mode on a full uncropped photo (the previous behavior)
// fights Tesseract's own segmentation and produces worse results than
// letting it find text regions itself.
const WHITELIST = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
// Verified against a test image that was essentially a tight plate render
// with a plain background (not a wider car scene): sparse-text/uniform-block
// modes alone misread it badly, while adding single-line mode to the full-
// image ensemble recovered a near-correct read. Since we can't always tell
// in advance whether "the full image" is a whole scene or already a tight
// plate shot, single-line mode is now included as a hedge for both cases —
// it's one extra OCR call per full-image target, which is cheap next to the
// accuracy gain.
const FULL_IMAGE_PSM_MODES = ['7', '11', '6']; // single line / sparse text / uniform block
const CROP_PSM_MODES = ['7', '8'];              // single line / single word

async function runOCR(imagePath, psmModes) {
  const passes = [];
  for (const psm of psmModes) {
    try {
      const res = await Tesseract.recognize(imagePath, 'eng', {
        logger: () => {},
        tessedit_pageseg_mode: psm,
        tessedit_char_whitelist: WHITELIST,
      });
      passes.push({ text: res.data.text, confidence: res.data.confidence });
    } catch {
      /* skip this config */
    }
  }
  return passes;
}

// ── Main Handler ─────────────────────────────────────────────────────────────
exports.analyzeImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file provided.' });
  }

  const imagePath = req.file.path;
  const tempFiles = [];

  try {
    // Step 1: Locate candidate plate regions and preprocess both the full
    // image and each crop.
    const cropPaths = await locatePlateCrops(imagePath, 2);
    tempFiles.push(...cropPaths);

    const fullVariants = await preprocessForOCR(imagePath);
    tempFiles.push(...fullVariants);

    const cropVariantSets = await Promise.all(cropPaths.map(p => preprocessForOCR(p)));
    cropVariantSets.forEach(v => tempFiles.push(...v));

    // Step 2: Run OCR across every target with the PSM modes appropriate to
    // what that target actually is (full scene vs. localized plate crop),
    // plus color detection — all in parallel.
    const fullTargets = [imagePath, ...fullVariants];
    const cropTargets = cropPaths.flatMap((p, idx) => [p, ...cropVariantSets[idx]]);

    const [fullResults, cropResults, plateColor] = await Promise.all([
      Promise.all(fullTargets.map(t => runOCR(t, FULL_IMAGE_PSM_MODES))),
      Promise.all(cropTargets.map(t => runOCR(t, CROP_PSM_MODES))),
      detectPlateColor(imagePath),
    ]);

    // Step 3: Pick a plate using format score first, then CONSENSUS across
    // passes as the tie-breaker — not Tesseract's own confidence score.
    // Different preprocessing variants, PSM modes, and localized crops are
    // independent-ish reads of the same plate; when several of them agree
    // on the exact same string, that agreement is a stronger signal than
    // any single pass's self-reported confidence, which just reflects how
    // sure Tesseract was about a given misread — not whether that misread
    // is actually closer to correct. (Verified: for a genuinely ambiguous
    // font, confidence-based tie-breaking picked a 4-characters-wrong result
    // over a 2-characters-wrong one that simply had lower self-reported
    // confidence but showed up in more independent passes.)
    const tally = new Map(); // plate -> { count, score, bestConfidence, bestText }
    for (const passes of [...fullResults, ...cropResults]) {
      for (const pass of passes) {
        const plate = extractBestPlate(pass.text);
        if (!plate) continue;
        const score = scorePlate(plate);
        const entry = tally.get(plate) || { count: 0, score, bestConfidence: -1, bestText: '' };
        entry.count += 1;
        if (pass.confidence > entry.bestConfidence) {
          entry.bestConfidence = pass.confidence;
          entry.bestText = pass.text;
        }
        tally.set(plate, entry);
      }
    }

    let bestPlate = null;
    let bestScore = -1;
    let bestCount = -1;
    let bestConfidence = 0;
    let bestText = '';

    for (const [plate, entry] of tally.entries()) {
      const better =
        entry.score > bestScore ||
        (entry.score === bestScore && entry.count > bestCount) ||
        (entry.score === bestScore && entry.count === bestCount && entry.bestConfidence > bestConfidence);
      if (better) {
        bestPlate = plate;
        bestScore = entry.score;
        bestCount = entry.count;
        bestConfidence = entry.bestConfidence;
        bestText = entry.bestText;
      }
    }

    const detectedPlate = bestPlate;
    const isValid = validatePlate(detectedPlate);
    const state   = detectedPlate ? detectState(detectedPlate) : null;
    const rto     = detectedPlate ? getRTOInfo(detectedPlate) : null;

    const colorInfo = classifyFromPlateColor(plateColor);
    const bodyTypes = refineBodyType(detectedPlate, colorInfo);

    const result = {
      rawText: bestText.trim(),
      detectedPlate: detectedPlate || null,
      isValid,
      confidence: Math.min(100, Math.max(0, Math.round(bestConfidence))),
      state,
      rto,
      plateColor: colorInfo.colorLabel,
      plateType: colorInfo.plateType,
      fuelType: colorInfo.fuelType,
      vehicleCategory: colorInfo.vehicleCategory,
      bodyTypes,
      timestamp: new Date().toISOString(),
    };

    fs.unlink(imagePath, () => {});
    for (const p of tempFiles) fs.unlink(p, () => {});

    if (req.user) {
      addHistoryEntry({ id: crypto.randomUUID(), userId: req.user.id, ...result });
    }

    return res.json({ success: true, result });
  } catch (error) {
    fs.unlink(imagePath, () => {});
    for (const p of tempFiles) fs.unlink(p, () => {});
    return res.status(500).json({
      success: false,
      message: 'OCR processing failed. Please try a clearer, well-lit image.',
      error: error.message,
    });
  }
};

function generateStateCandidates(code) {
    const candidates = [];

    for (const state of Object.keys(STATE_CODES)) {
        let score = 0;

        for (let i = 0; i < 2; i++) {
            if (code[i] === state[i]) {
                score += 3;
            } else if (
                LETTER_CONFUSIONS[code[i]] &&
                LETTER_CONFUSIONS[code[i]].includes(state[i])
            ) {
                score += 2;
            }
        }

        if (score > 0) {
            candidates.push({ state, score });
        }
    }

    candidates.sort((a, b) => b.score - a.score);

    return candidates;
}

function chooseBestState(stateOCR, district) {

    const candidates = generateStateCandidates(stateOCR);

    let best = stateOCR;
    let bestScore = -1;

    for (const candidate of candidates) {

        let score = candidate.score;

        if (RTO_DISTRICTS[candidate.state]?.[district])
            score += 10;

        if (STATE_CODES[candidate.state])
            score += 5;

        if (score > bestScore) {
            bestScore = score;
            best = candidate.state;
        }
    }

    return best;
}