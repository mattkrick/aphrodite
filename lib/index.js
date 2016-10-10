'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _util = require('./util');

var _inject = require('./inject');

var _generate = require('./generate');

var StyleSheet = {
  create: function create(sheetDefinition) {
    var prefixedRuleset = {};
    var rawSelectors = Object.keys(sheetDefinition);
    for (var i = 0; i < rawSelectors.length; i++) {
      var rawSelector = rawSelectors[i];
      var rawRuleset = sheetDefinition[rawSelector];
      var _name = rawSelector + '_' + (0, _util.hashObject)(rawRuleset);
      debugger;
      prefixedRuleset[rawSelector] = {
        _name: _name,
        _rules: (0, _generate.generateCSSRules)(rawSelector, rawRuleset)
      };
    }
    debugger;
    return prefixedRuleset;
  },

  rehydrate: function rehydrate() {
    var renderedClassNames = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

    (0, _inject.addRenderedClassNames)(renderedClassNames);
  }
};

/**
 * Utilities for using Aphrodite server-side.
 */
var StyleSheetServer = {
  renderStatic: function renderStatic(renderFunc) {
    (0, _inject.reset)();
    (0, _inject.startBuffering)();
    var html = renderFunc();
    var cssContent = (0, _inject.flushToString)();

    return {
      html: html,
      css: {
        content: cssContent,
        renderedClassNames: (0, _inject.getRenderedClassNames)()
      }
    };
  }
};

/**
 * Utilities for using Aphrodite in tests.
 *
 * Not meant to be used in production.
 */
var StyleSheetTestUtils = {
  /**
   * Prevent styles from being injected into the DOM.
   *
   * This is useful in situations where you'd like to test rendering UI
   * components which use Aphrodite without any of the side-effects of
   * Aphrodite happening. Particularly useful for testing the output of
   * components when you have no DOM, e.g. testing in Node without a fake DOM.
   *
   * Should be paired with a subsequent call to
   * clearBufferAndResumeStyleInjection.
   */
  suppressStyleInjection: function suppressStyleInjection() {
    (0, _inject.reset)();
    (0, _inject.startBuffering)();
  },

  /**
   * Opposite method of preventStyleInject.
   */
  clearBufferAndResumeStyleInjection: function clearBufferAndResumeStyleInjection() {
    (0, _inject.reset)();
  }
};

var css = function css() {
  for (var _len = arguments.length, styleDefinitions = Array(_len), _key = 0; _key < _len; _key++) {
    styleDefinitions[_key] = arguments[_key];
  }

  return (0, _inject.injectAndGetClassName)(styleDefinitions);
};

var injectGlobal = function injectGlobal(globalStyles) {
  var selectors = Object.keys(globalStyles);
  for (var i = 0; i < selectors.length; i++) {
    var _name2 = selectors[i];
    var value = globalStyles[_name2];

    (0, _inject.injectStyleOnce)(_name2, _name2, [value], false);
  }
};

exports['default'] = {
  StyleSheet: StyleSheet,
  StyleSheetServer: StyleSheetServer,
  StyleSheetTestUtils: StyleSheetTestUtils,
  css: css,
  injectGlobal: injectGlobal
};
module.exports = exports['default'];