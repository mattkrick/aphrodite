// Custom handlers for stringifying CSS values that have side effects
// (such as fontFamily, which can cause @font-face rules to be injected)
import {injectGeneratedCSSOnce, injectStyleOnce} from './inject';
import {generateCSS} from './generate';
import {hashObject} from './util';

// With fontFamily we look for objects that are passed in and interpret
// them as @font-face rules that we need to inject. The value of fontFamily
// can either be a string (as normal), an object (a single font face), or
// an array of objects and strings.
const fontFamily = (val) => {
  if (Array.isArray(val)) {
    return val.map(fontFamily).join(",");
  } else if (val && typeof val === "object") {
    const {fontFamily, fontStyle, fontWeight} = val;
    const key = `${fontFamily}-${fontWeight || 400}${fontStyle}`;
    injectStyleOnce(key, "@font-face", [val], false);
    return fontFamily;
  } else {
    return val;
  }
};

// With animationName we look for an object that contains keyframes and
// inject them as an `@keyframes` block, returning a uniquely generated
// name. The keyframes object should look like
//  animationName: {
//    from: {
//      left: 0,
//      top: 0,
//    },
//    '50%': {
//      left: 15,
//      top: 5,
//    },
//    to: {
//      left: 20,
//      top: 20,
//    }
//  }
// TODO(emily): `stringHandlers` doesn't let us rename the key, so I have
// to use `animationName` here. Improve that so we can call this
// `animation` instead of `animationName`.
const animationName = (val) => {
  if (typeof val !== "object") {
    return val;
  }

  // Generate a unique name based on the hash of the object. We can't
  // just use the hash because the name can't start with a number.
  // TODO(emily): this probably makes debugging hard, allow a custom
  // name?
  const name = `keyframe_${hashObject(val)}`;

  // Since keyframes need 3 layers of nesting, we use `generateCSS` to
  // build the inner layers and wrap it in `@keyframes` ourselves.
  let finalVal = `@keyframes ${name}{`;
  Object.keys(val).forEach(key => {
    finalVal += generateCSS(key, [val[key]]);
  });
  finalVal += '}';

  injectGeneratedCSSOnce(name, finalVal);

  return name;
};

export default {
  animationName,
  fontFamily,
};
