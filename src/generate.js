import prefixAll from 'inline-style-prefixer/static';

import {
    objectToPairs, prefixes, kebabifyStyleName, recursiveMerge, stringifyValue,
    importantify, flatten, kebabify
} from './util';

let SSR = false;
const getBestPrefix = (declaration) => {
    for (let i = 0; i < prefixes.length; i++) {
        const prefix = prefixes[i];
        const prefixedDeclaration = `${prefix}${declaration}`;
        if (prefixedDeclaration) {
            return prefixedDeclaration;
        }
    }
    throw new Error(`Cannot find rule ${declaration}. Did you make a typo?`)
};

const getBrowserProperties = () => {
    if (!getBrowserProperties.availableStyles) {
        getBrowserProperties.availableStyles = {};
        const styles = Object.keys(window.getComputedStyle(document.documentElement, ''));
        for (let i = 0; i < styles.length; i++) {
            const style = styles[i];
            const rule = styles[style];
            if (isNaN(Number(rule))) {
                getBrowserProperties.availableStyles[style] = true;
            }
        }
    }
    return getBrowserProperties.availableStyles;
};

/**
 * Generate CSS for a selector and some styles.
 *
 * This function handles the media queries, pseudo selectors, and descendant
 * styles that can be used in aphrodite styles.
 *
 * @param {string} selector: A base CSS selector for the styles to be generated
 *     with.
 * @param {Object} rawRulesets: A list of properties of the return type of
 *     StyleSheet.create, e.g. [styles.red, styles.blue].
 * @param atRuleHandlers: See `generateCSSRuleset`
 *
 * To actually generate the CSS special-construct-less styles are passed to
 * `generateCSSRuleset`.
 *
 * For instance, a call to
 *
 *     generateCSS(".foo", {
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
 * will make 5 calls to `generateCSSRuleset`:
 *
 *     generateCSSRuleset(".foo", { color: "red" }, ...)
 *     generateCSSRuleset(".foo:active", { fontWeight: "bold" }, ...)
 *     generateCSSRuleset(".foo:active .foo_bar", { height: 10 }, ...)
 *     // These 2 will be wrapped in @media screen {}
 *     generateCSSRuleset(".foo", { height: 20 }, ...)
 *     generateCSSRuleset(".foo:hover", { backgroundColor: "black" }, ...)
 */
export const generateCSS = (selector, rawRulesets, atRuleHandlers) => {
    const mergedRawRulesets = recursiveMerge(rawRulesets);
    return generateCSSRuleset(selector, mergedRawRulesets, atRuleHandlers);
    // const declarations = {};
    // const mediaQueries = {};
    // const pseudoStyles = {};
    //
    // const statements = [];
    // const rawProperties = Object.keys(mergedRawRulesets);
    // for (let i = 0; i < rawProperties.length; i++) {
    //     const property = rawProperties[i];
    //     const value = mergedRawRulesets[property];
    //     if (value[0] === ':') {
    //         // values.push()
    //         // pseudoStyles[value] = merged[value];
    //     } else if (value[0] === '@') {
    //         // mediaQueries[value] = merged[value];
    //     } else {
    //         statements[i] =
    //         // statements[key] = merged[key];
    //     }
    // }

    // return (
    //     generateCSSRuleset(selector, declarations, atRuleHandlers) +
    //     Object.keys(pseudoStyles).map(pseudoSelector => {
    //         return generateCSSRuleset(selector + pseudoSelector,
    //                                   pseudoStyles[pseudoSelector],
    //                                   atRuleHandlers);
    //     }).join("") +
    //     Object.keys(mediaQueries).map(mediaQuery => {
    //         const ruleset = generateCSS(selector, [mediaQueries[mediaQuery]],
    //             atRuleHandlers, useImportant);
    //         return `${mediaQuery}{${ruleset}}`;
    //     }).join("")
    // );
};

/**
 * Helper method of generateCSSRuleset to facilitate custom handling of certain
 * CSS properties. Used for e.g. font families.
 *
 * See generateCSSRuleset for usage and documentation of paramater types.
 */
const appendAtRules = (declarations, atRuleHandlers) => {
    const result = {};
    Object.keys(declarations).forEach(key => {
        // If a handler exists for this particular key, let it interpret
        // that value first before continuing
        if (atRuleHandlers && atRuleHandlers.hasOwnProperty(key)) {
            result[key] = atRuleHandlers[key](declarations[key]);
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
 * `generateCSS` function.
 *
 * @param {string} selector: the selector associated with the ruleset
 * @param {Object} declarations: a map from camelCased CSS property name to CSS
 *     property value.
 * @param {Object.<string, function>} atRuleHandlers: a map from camelCased CSS
 *     property name to a function which will map the given value to the value
 *     that is output.
 * @returns {string} A string of raw CSS.
 *
 * Examples:
 *
 *    generateCSSRuleset(".blah", { color: "red" })
 *    -> ".blah{color: red !important;}"
 *    generateCSSRuleset(".blah", { color: "red" }, {}, false)
 *    -> ".blah{color: red}"
 *    generateCSSRuleset(".blah", { color: "red" }, {color: c => c.toUpperCase})
 *    -> ".blah{color: RED}"
 *    generateCSSRuleset(".blah:hover", { color: "red" })
 *    -> ".blah:hover{color: red}"
 */
export const generateCSSRuleset = (selector, mergedRawRulesets, atRuleHandlers, isSSR) => {
    // const handledDeclarations = appendAtRules(
    //     mergedRawRulesets, atRuleHandlers);
    if (isSSR) {
    } else {
        const validProperties = getBrowserProperties();
        const rulesets = [];
        const declarationNames = Object.keys(mergedRawRulesets);
        for (let i = 0; i < declarationNames.length; i++) {
            const camelDeclaration = declarationNames[i];
            // if (camelDeclaration === 'margin') debugger
            // const declaration = kebabify(camelDeclaration);
            const value = mergedRawRulesets[camelDeclaration];
            const stringValue = stringifyValue(camelDeclaration, value);
            const rule = validProperties[camelDeclaration] ? camelDeclaration : getBestPrefix(camelDeclaration);
            rulesets[i] = `${kebabifyStyleName(rule)}:${stringValue};`;
        }
        const rules = rulesets.join('');
        return `${selector}{${rules}}`;
    }
    // debugger
    // const prefixedDeclarations = prefixAll(handledDeclarations);
    //
    // const prefixedRules = flatten(
    //     objectToPairs(prefixedDeclarations).map(([key, value]) => {
    //         if (Array.isArray(value)) {
    //             // inline-style-prefix-all returns an array when there should be
    //             // multiple rules, we will flatten to single rules
    //
    //             const prefixedValues = [];
    //             const unprefixedValues = [];
    //
    //             value.forEach(v => {
    //               if (v.indexOf('-') === 0) {
    //                 prefixedValues.push(v);
    //               } else {
    //                 unprefixedValues.push(v);
    //               }
    //             });
    //
    //             prefixedValues.sort();
    //             unprefixedValues.sort();
    //
    //             return prefixedValues
    //               .concat(unprefixedValues)
    //               .map(v => [key, v]);
    //         }
    //         return [[key, value]];
    //     })
    // );

    // const rules = prefixedRules.map(([key, value]) => {
    //     const stringValue = stringifyValue(key, value);
    //     const ret = `${kebabifyStyleName(key)}:${stringValue};`;
    //     return useImportant === false ? ret : importantify(ret);
    // }).join("");

};
