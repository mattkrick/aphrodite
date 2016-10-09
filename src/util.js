// {K1: V1, K2: V2, ...} -> [[K1, V1], [K2, V2]]
export const objectToPairs = (obj) => Object.keys(obj).map(key => [key, obj[key]]);

// [[K1, V1], [K2, V2]] -> {K1: V1, K2: V2, ...}
const pairsToObject = (pairs) => {
  const result = {};
  pairs.forEach(([key, val]) => {
    result[key] = val;
  });
  return result;
};

export const mapObj = (obj, fn) => pairsToObject(objectToPairs(obj).map(fn))

// Flattens an array one level
// [[A], [B, C, [D]]] -> [A, B, C, [D]]
export const flatten = (list) => list.reduce((memo, x) => memo.concat(x), []);

const UPPERCASE_RE = /([A-Z])/g;
const MS_RE = /^ms-/;

export const kebabify = (string) => string.replace(UPPERCASE_RE, '-$1').toLowerCase();
export const kebabifyStyleName = (string) => kebabify(string).replace(MS_RE, '-ms-');


export const recursiveMerge = (rulesets) => {
  const target = {...rulesets[0]};
  // offset the target
  for (let i = 1; i < rulesets.length; i++) {
    const src = {...rulesets[i]};
    const properties = Object.keys(src);
    for (let j = 0; j < properties.length; j++) {
      const property = properties[j];
      const srcValue = src[property];
      const targetValue = target[property];
      target[property] = (typeof srcValue === 'object') ?
        recursiveMerge([targetValue, srcValue]) :
        target[property] = srcValue;
    }
  }
  return target;
};


/**
 * CSS properties which accept numbers but are not in units of "px".
 * Taken from React's CSSProperty.js
 */
const isUnitlessNumber = {
  animationIterationCount: true,
  borderImageOutset: true,
  borderImageSlice: true,
  borderImageWidth: true,
  boxFlex: true,
  boxFlexGroup: true,
  boxOrdinalGroup: true,
  columnCount: true,
  flex: true,
  flexGrow: true,
  flexPositive: true,
  flexShrink: true,
  flexNegative: true,
  flexOrder: true,
  gridRow: true,
  gridColumn: true,
  fontWeight: true,
  lineClamp: true,
  lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  tabSize: true,
  widows: true,
  zIndex: true,
  zoom: true,

  // SVG-related properties
  fillOpacity: true,
  floodOpacity: true,
  stopOpacity: true,
  strokeDasharray: true,
  strokeDashoffset: true,
  strokeMiterlimit: true,
  strokeOpacity: true,
  strokeWidth: true,
};

/**
 * Support style names that may come passed in prefixed by adding permutations
 * of vendor prefixes. Moz must come first since it supports some webkit props
 * Taken from React's CSSProperty.js
 */
export const prefixes = ['Moz', 'Webkit', 'ms', 'O'];

export const stringifyValue = (key, prop) => {
  return (typeof prop !== "number" || isUnitlessNumber[key]) ? prop : `${prop}px`;
};

/**
 * JS Implementation of MurmurHash2
 *
 * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
 * @see http://github.com/garycourt/murmurhash-js
 * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
 * @see http://sites.google.com/site/murmurhash/
 *
 * @param {string} str ASCII only
 * @return {string} Base 36 encoded hash result
 */
export const murmurhash2_32_gc = (str) => {
  let l = str.length;
  let h = l;
  let i = 0;
  let k;

  while (l >= 4) {
    k = ((str.charCodeAt(i) & 0xff)) |
      ((str.charCodeAt(++i) & 0xff) << 8) |
      ((str.charCodeAt(++i) & 0xff) << 16) |
      ((str.charCodeAt(++i) & 0xff) << 24);

    k = (((k & 0xffff) * 0x5bd1e995) + ((((k >>> 16) * 0x5bd1e995) & 0xffff) << 16));
    k ^= k >>> 24;
    k = (((k & 0xffff) * 0x5bd1e995) + ((((k >>> 16) * 0x5bd1e995) & 0xffff) << 16));

    h = (((h & 0xffff) * 0x5bd1e995) + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16)) ^ k;

    l -= 4;
    ++i;
  }

  switch (l) {
    case 3:
      h ^= (str.charCodeAt(i + 2) & 0xff) << 16;
    case 2:
      h ^= (str.charCodeAt(i + 1) & 0xff) << 8;
    case 1:
      h ^= (str.charCodeAt(i) & 0xff);
      h = (((h & 0xffff) * 0x5bd1e995) + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16));
  }

  h ^= h >>> 13;
  h = (((h & 0xffff) * 0x5bd1e995) + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16));
  h ^= h >>> 15;

  return (h >>> 0).toString(36);
}

// Hash a javascript object using JSON.stringify. This is very fast, about 3
// microseconds on my computer for a sample object:
// http://jsperf.com/test-hashfnv32a-hash/5
//
// Note that this uses JSON.stringify to stringify the objects so in order for
// this to produce consistent hashes browsers need to have a consistent
// ordering of objects. Ben Alpert says that Facebook depends on this, so we
// can probably depend on this too.
export const hashObject = (object) => murmurhash2_32_gc(JSON.stringify(object));
