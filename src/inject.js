import asap from 'asap';
import {generateCSS} from './generate';
import {flattenDeep} from './util';

// The current <style> tag we are inserting into, or null if we haven't
// inserted anything yet. We could find this each time using
// `document.querySelector("style[data-aphrodite"])`, but holding onto it is
// faster.
let styleTag = null;

// Inject a string of styles into a <style> tag in the head of the document. This
// will automatically create a style tag and then continue to use it for
// multiple injections. It will also use a style tag with the `data-aphrodite`
// tag on it if that exists in the DOM. This could be used for e.g. reusing the
// same style tag that server-side rendering inserts.
const injectStyleTag = (cssContents) => {
  if (styleTag == null) {
    // Try to find a style tag with the `data-aphrodite` attribute first.
    styleTag = document.querySelector("style[data-aphrodite]");

    // If that doesn't work, generate a new style tag.
    if (styleTag == null) {
      // Taken from
      // http://stackoverflow.com/questions/524696/how-to-create-a-style-tag-with-javascript
      const head = document.head || document.getElementsByTagName('head')[0];
      styleTag = document.createElement('style');

      styleTag.type = 'text/css';
      styleTag.setAttribute("data-aphrodite", "");
      head.appendChild(styleTag);
    }
  }

  if (styleTag.styleSheet) {
    styleTag.styleSheet.cssText += cssContents;
  } else {
    styleTag.appendChild(document.createTextNode(cssContents));
  }
};

// This is a map from Aphrodite's generated class names to `true` (acting as a
// set of class names)
let alreadyInjected = {};

// This is the buffer of styles which have not yet been flushed.
let injectionBuffer = "";

// A flag to tell if we are already buffering styles. This could happen either
// because we scheduled a flush call already, so newly added styles will
// already be flushed, or because we are statically buffering on the server.
let isBuffering = false;

export const injectGeneratedCSSOnce = (key, generatedCSS) => {
  if (!alreadyInjected[key]) {
    if (!isBuffering) {
      // We should never be automatically buffering on the server (or any
      // place without a document), so guard against that.
      if (typeof document === "undefined") {
        throw new Error(
          "Cannot automatically buffer without a document");
      }

      // If we're not already buffering, schedule a call to flush the
      // current styles.
      isBuffering = true;
      asap(flushToStyleTag);
    }

    injectionBuffer += generatedCSS;
    alreadyInjected[key] = true;
  }
};

export const injectStyleOnce = (key, selector, definitions) => {
  if (!alreadyInjected[key]) {
    const generated = generateCSS(selector, definitions);

    injectGeneratedCSSOnce(key, generated);
  }
};

export const reset = () => {
  injectionBuffer = "";
  alreadyInjected = {};
  isBuffering = false;
  styleTag = null;
};

export const startBuffering = () => {
  if (isBuffering) {
    throw new Error(
      "Cannot buffer while already buffering");
  }
  isBuffering = true;
};

export const flushToString = () => {
  isBuffering = false;
  const ret = injectionBuffer;
  injectionBuffer = "";
  return ret;
};

export const flushToStyleTag = () => {
  const cssContent = flushToString();
  if (cssContent.length > 0) {
    injectStyleTag(cssContent);
  }
};

export const getRenderedClassNames = () => {
  return Object.keys(alreadyInjected);
};

export const addRenderedClassNames = (classNames) => {
  classNames.forEach(className => {
    alreadyInjected[className] = true;
  });
};

/**
 * Inject styles associated with the passed style definition objects, and return
 * an associated CSS class name.
 *
 * @param {(Object|Object[])[]} styleDefinitions style definition objects, or
 *     arbitrarily nested arrays of them, as returned as properties of the
 *     return value of StyleSheet.create().
 */
export const injectAndGetClassName = (styleDefinitions) => {
  const flatStyleDefinitions = flattenDeep(styleDefinitions);

  // Filter out falsy values from the input, to allow for
  // `css(a, test && c)`
  const validDefinitions = flatStyleDefinitions.filter(Boolean);

  // Break if there aren't any valid styles.
  if (validDefinitions.length === 0) {
    return "";
  }

  // generate an short, opaque compound className
  // const className = hashObject(validDefinitions.map(s => s._name));
  const className = validDefinitions.map(s => s._name).join("-o_O-");
  const rawRulesets = validDefinitions.map(d => d._definition);
  injectGeneratedCSSOnce(className, rawRulesets);
  return className;
};

