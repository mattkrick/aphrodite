import prefixAll from 'inline-style-prefixer/static';

import {
  maybeVendorPrefix, objectToPairs, kebabifyStyleName, recursiveMerge, stringifyValue,
  flatten
} from './util';
// import globalHandlers from './globalHandlers';
// import handleAtRules from './handleAtRules';

// const stringHandlers = ['fontFace', '@media', '@font-face', '@']
export const generateCSSRules = (selector, ruleset) => {
  const rules = [];
  const properties = Object.keys(ruleset);
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    const declarations = ruleset[property];
    if (property.startsWith('@media')) {
      const newRules = generateCSSRules(selector, declarations);
      const wrappedRules = newRules.map(rule => `${selector}{${rule}}`);
      rules.push(...wrappedRules);
    } else {
      const ruleSelector = property.startsWith(':') ? `${selector}:${property}` : selector;
      const newRule = generateSingleRule(ruleSelector, declarations);
      rules.push(newRule);
    }
  }
  return rules;
};

export const generateSingleRule = (selector, declarations) => {
  const properties = Object.keys(declarations);
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    const value = declarations[property];
    const stringValue = stringifyValue(property, value);
    const prefixedProp = kebabifyStyleName(item[0]);
    reduction[prefixedProp] = item[1];
  }
  const camelDeclaration = declarationNames[i];
  // if (camelDeclaration === 'margin') debugger
  // const declaration = kebabify(camelDeclaration);
  const value = mergedRawRulesets[camelDeclaration];

  const rule = maybeVendorPrefix(camelDeclaration);
  rulesets[i] = `${kebabifyStyleName(rule)}:${stringValue};`;
  const rules = rulesets.join('');
  return `${selector}{${rules}}`;
}
/**
 * Generate CSS for a selector and some styles.
 *
 * This function handles the media queries, pseudo selectors, and descendant
 * styles that can be used in aphrodite styles.
 *
 * @param {string} selector: A base CSS selector for the styles to be generated
 *     with.
 * @param {Object} styleTypes: A list of properties of the return type of
 *     StyleSheet.create, e.g. [styles.red, styles.blue].
 *
 * To actually generate the CSS special-construct-less styles are passed to
 * `generateCSSRulesetObject`.
 *
 * For instance, a call to
 *
 *     generateCSSRules(".foo", {
 *       color: "red",
 *       "@media screen": {
 *         height: 20,
 *         ":hover": {
 *           backgroundColor: "black"
 *         }
 *       },
 *       ":active": {
 *         fontWeight: "bold",
 *         ">>bar": {
 *           _names: { "foo_bar": true },
 *           height: 10,
 *         }
 *       }
 *     });
 *
 * will make 5 calls to `generateCSSRulesetObject`:
 *
 *     generateCSSRulesetObject(".foo", { color: "red" }, ...)
 *     generateCSSRulesetObject(".foo:active", { fontWeight: "bold" }, ...)
 *     generateCSSRulesetObject(".foo:active .foo_bar", { height: 10 }, ...)
 *     // These 2 will be wrapped in @media screen {}
 *     generateCSSRulesetObject(".foo", { height: 20 }, ...)
 *     generateCSSRulesetObject(".foo:hover", { backgroundColor: "black" }, ...)
 */
export const generateCSS = (selector, styleTypes) => {
  const merged = styleTypes.reduce(recursiveMerge);

  const declarations = {};
  const mediaQueries = {};
  const pseudoStyles = {};

  Object.keys(merged).forEach(key => {
    if (key[0] === ':') {
      pseudoStyles[key] = merged[key];
    } else if (key[0] === '@') {
      mediaQueries[key] = merged[key];
    } else {
      declarations[key] = merged[key];
    }
  });

  const declarationsObj = generateCSSRulesetObject(declarations);
  return declarationsObj;
  const pseudosObj = Object.keys(pseudoStyles).map(pseudoSelector => {
    return generateCSSRulesetObject(pseudoStyles[pseudoSelector]);
    // return generateCSSRulesetObject(selector + pseudoSelector,
    //   pseudoStyles[pseudoSelector]);
  });
  const mediaQueriesObj = Object.keys(mediaQueries).map(mediaQuery => {
    const ruleset = generateCSSRules([mediaQueries[mediaQuery]]);
    return `${mediaQuery}{${ruleset}}`;
    // const ruleset = generateCSSRules(selector, [mediaQueries[mediaQuery]]);
  });
};

/**
 * Helper method of generateCSSRulesetObject to facilitate custom handling of certain
 * CSS properties. Used for e.g. font families.
 *
 * See generateCSSRulesetObject for usage and documentation of paramater types.
 */
const runStringHandlers = (declarations) => {
  const result = {};

  Object.keys(declarations).forEach(key => {
    // If a handler exists for this particular key, let it interpret
    // that value first before continuing
    if (stringHandlers[key]) {
      result[key] = stringHandlers[key](declarations[key]);
    } else {
      result[key] = declarations[key];
    }
  });

  return result;
};

/**
 * Generate a CSS ruleset with the selector and containing the declarations.
 *
 * This function assumes that the given declarations don't contain any special
 * children (such as media queries, pseudo-selectors, or descendant styles).
 *
 * Note that this method does not deal with nesting used for e.g.
 * psuedo-selectors or media queries. That responsibility is left to  the
 * `generateCSSRules` function.
 *
 * @param {string} selector: the selector associated with the ruleset
 * @param {Object} declarations: a map from camelCased CSS property name to CSS
 *     property value.
 * @returns {string} A string of raw CSS.
 *
 * Examples:
 *
 *    generateCSSRulesetObject(".blah", { color: "red !important" })
 *    -> ".blah{color: red !important;}"
 *    generateCSSRulesetObject(".blah", { color: "red" })
 *    -> ".blah{color: red}"
 *    generateCSSRulesetObject(".blah", { color: "red" }, {color: c => c.toUpperCase})
 *    -> ".blah{color: RED}"
 *    generateCSSRulesetObject(".blah:hover", { color: "red" })
 *    -> ".blah:hover{color: red}"
 */
export const generateCSSRulesetObject = (declarations) => {
  const handledDeclarations = runStringHandlers(declarations);

  const prefixedDeclarations = prefixAll(handledDeclarations);

  const prefixedRules = flatten(
    objectToPairs(prefixedDeclarations).map(([key, value]) => {
      if (Array.isArray(value)) {
        // inline-style-prefix-all returns an array when there should be
        // multiple rules, we will flatten to single rules

        const prefixedValues = [];
        const unprefixedValues = [];

        value.forEach(v => {
          if (v.indexOf('-') === 0) {
            prefixedValues.push(v);
          } else {
            unprefixedValues.push(v);
          }
        });

        prefixedValues.sort();
        unprefixedValues.sort();

        return prefixedValues
          .concat(unprefixedValues)
          .map(v => [key, v]);
      }
      return [[key, value]];
    })
  );

  return prefixedRules.reduce((reduction, item) => {
    const prefixedProp = kebabifyStyleName(item[0]);
    reduction[prefixedProp] = item[1];
    return reduction;
  }, {});

  // const rules = prefixedRules.map(([key, value]) => {
  //   const stringValue = stringifyValue(key, value);
  //   return `${}:${stringValue};`;
  // }).join("");
  //
  // if (rules) {
  //   return `${selector}{${rules}}`;
  // } else {
  //   return "";
  // }
};

export const aggregateStyles = (className, rulesets) => {
  // const selectors = Object.keys(rulesets);
  // const rules = [];
  const declarationArray = [];
  for (let i = 0; i < rulesets.length; i++) {
    const ruleset = rulesets[i];
    const properties = Object.keys(ruleset);
    for (let j = 0; j < properties.length; j++) {
      const property = properties[j];
      const value = ruleset[property];
      declarationArray[j] = `${property}:${value};`;
    }
  }
  return `${className}{${declarationArray.join('')}}`;
};
