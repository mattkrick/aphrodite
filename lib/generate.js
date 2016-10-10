'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var _inlineStylePrefixerStatic = require('inline-style-prefixer/static');

var _inlineStylePrefixerStatic2 = _interopRequireDefault(_inlineStylePrefixerStatic);

var _util = require('./util');

// import globalHandlers from './globalHandlers';
// import handleAtRules from './handleAtRules';

// const stringHandlers = ['fontFace', '@media', '@font-face', '@']
var generateCSSRules = function generateCSSRules(selector, ruleset) {
  var rules = [];
  var properties = Object.keys(ruleset);
  for (var _i = 0; _i < properties.length; _i++) {
    var property = properties[_i];
    var declarations = ruleset[property];
    if (property.startsWith('@media')) {
      var newRules = generateCSSRules(selector, declarations);
      var wrappedRules = newRules.map(function (rule) {
        return selector + '{' + rule + '}';
      });
      rules.push.apply(rules, _toConsumableArray(wrappedRules));
    } else {
      var ruleSelector = property.startsWith(':') ? selector + ':' + property : selector;
      var newRule = generateSingleRule(ruleSelector, declarations);
      rules.push(newRule);
    }
  }
  return rules;
};

exports.generateCSSRules = generateCSSRules;
var generateSingleRule = function generateSingleRule(selector, declarations) {
  var properties = Object.keys(declarations);
  for (var _i2 = 0; _i2 < properties.length; _i2++) {
    var property = properties[_i2];
    var _value = declarations[property];
    var _stringValue = (0, _util.stringifyValue)(property, _value);
    var prefixedProp = (0, _util.kebabifyStyleName)(item[0]);
    reduction[prefixedProp] = item[1];
  }
  var camelDeclaration = declarationNames[i];
  // if (camelDeclaration === 'margin') debugger
  // const declaration = kebabify(camelDeclaration);
  var value = mergedRawRulesets[camelDeclaration];

  var rule = (0, _util.maybeVendorPrefix)(camelDeclaration);
  rulesets[i] = (0, _util.kebabifyStyleName)(rule) + ':' + stringValue + ';';
  var rules = rulesets.join('');
  return selector + '{' + rules + '}';
};
exports.generateSingleRule = generateSingleRule;
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
var generateCSS = function generateCSS(selector, styleTypes) {
  var merged = styleTypes.reduce(_util.recursiveMerge);

  var declarations = {};
  var mediaQueries = {};
  var pseudoStyles = {};

  Object.keys(merged).forEach(function (key) {
    if (key[0] === ':') {
      pseudoStyles[key] = merged[key];
    } else if (key[0] === '@') {
      mediaQueries[key] = merged[key];
    } else {
      declarations[key] = merged[key];
    }
  });

  var declarationsObj = generateCSSRulesetObject(declarations);
  return declarationsObj;
  var pseudosObj = Object.keys(pseudoStyles).map(function (pseudoSelector) {
    return generateCSSRulesetObject(pseudoStyles[pseudoSelector]);
    // return generateCSSRulesetObject(selector + pseudoSelector,
    //   pseudoStyles[pseudoSelector]);
  });
  var mediaQueriesObj = Object.keys(mediaQueries).map(function (mediaQuery) {
    var ruleset = generateCSSRules([mediaQueries[mediaQuery]]);
    return mediaQuery + '{' + ruleset + '}';
    // const ruleset = generateCSSRules(selector, [mediaQueries[mediaQuery]]);
  });
};

exports.generateCSS = generateCSS;
/**
 * Helper method of generateCSSRulesetObject to facilitate custom handling of certain
 * CSS properties. Used for e.g. font families.
 *
 * See generateCSSRulesetObject for usage and documentation of paramater types.
 */
var runStringHandlers = function runStringHandlers(declarations) {
  var result = {};

  Object.keys(declarations).forEach(function (key) {
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
var generateCSSRulesetObject = function generateCSSRulesetObject(declarations) {
  var handledDeclarations = runStringHandlers(declarations);

  var prefixedDeclarations = (0, _inlineStylePrefixerStatic2['default'])(handledDeclarations);

  var prefixedRules = (0, _util.flatten)((0, _util.objectToPairs)(prefixedDeclarations).map(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2);

    var key = _ref2[0];
    var value = _ref2[1];

    if (Array.isArray(value)) {
      var _ret = (function () {
        // inline-style-prefix-all returns an array when there should be
        // multiple rules, we will flatten to single rules

        var prefixedValues = [];
        var unprefixedValues = [];

        value.forEach(function (v) {
          if (v.indexOf('-') === 0) {
            prefixedValues.push(v);
          } else {
            unprefixedValues.push(v);
          }
        });

        prefixedValues.sort();
        unprefixedValues.sort();

        return {
          v: prefixedValues.concat(unprefixedValues).map(function (v) {
            return [key, v];
          })
        };
      })();

      if (typeof _ret === 'object') return _ret.v;
    }
    return [[key, value]];
  }));

  return prefixedRules.reduce(function (reduction, item) {
    var prefixedProp = (0, _util.kebabifyStyleName)(item[0]);
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

exports.generateCSSRulesetObject = generateCSSRulesetObject;
var aggregateStyles = function aggregateStyles(className, rulesets) {
  // const selectors = Object.keys(rulesets);
  // const rules = [];
  var declarationArray = [];
  for (var _i3 = 0; _i3 < rulesets.length; _i3++) {
    var ruleset = rulesets[_i3];
    var properties = Object.keys(ruleset);
    for (var j = 0; j < properties.length; j++) {
      var property = properties[j];
      var value = ruleset[property];
      declarationArray[j] = property + ':' + value + ';';
    }
  }
  return className + '{' + declarationArray.join('') + '}';
};
exports.aggregateStyles = aggregateStyles;