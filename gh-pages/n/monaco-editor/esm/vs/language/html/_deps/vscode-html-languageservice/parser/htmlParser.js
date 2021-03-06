define('035e64a', function(require, exports, module) {

  "use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.parse = exports.Node = void 0;
  /*---------------------------------------------------------------------------------------------
   *  Copyright (c) Microsoft Corporation. All rights reserved.
   *  Licensed under the MIT License. See License.txt in the project root for license information.
   *--------------------------------------------------------------------------------------------*/
  var htmlScanner_js_1 = require("c2d9747");
  var arrays_js_1 = require("7caa5b3");
  var htmlLanguageTypes_js_1 = require("4ee499b");
  var fact_js_1 = require("46a8b2e");
  var Node = /** @class */ (function () {
      function Node(start, end, children, parent) {
          this.start = start;
          this.end = end;
          this.children = children;
          this.parent = parent;
          this.closed = false;
      }
      Object.defineProperty(Node.prototype, "attributeNames", {
          get: function () { return this.attributes ? Object.keys(this.attributes) : []; },
          enumerable: true,
          configurable: true
      });
      Node.prototype.isSameTag = function (tagInLowerCase) {
          return this.tag && tagInLowerCase && this.tag.length === tagInLowerCase.length && this.tag.toLowerCase() === tagInLowerCase;
      };
      Object.defineProperty(Node.prototype, "firstChild", {
          get: function () { return this.children[0]; },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(Node.prototype, "lastChild", {
          get: function () { return this.children.length ? this.children[this.children.length - 1] : void 0; },
          enumerable: true,
          configurable: true
      });
      Node.prototype.findNodeBefore = function (offset) {
          var idx = arrays_js_1.findFirst(this.children, function (c) { return offset <= c.start; }) - 1;
          if (idx >= 0) {
              var child = this.children[idx];
              if (offset > child.start) {
                  if (offset < child.end) {
                      return child.findNodeBefore(offset);
                  }
                  var lastChild = child.lastChild;
                  if (lastChild && lastChild.end === child.end) {
                      return child.findNodeBefore(offset);
                  }
                  return child;
              }
          }
          return this;
      };
      Node.prototype.findNodeAt = function (offset) {
          var idx = arrays_js_1.findFirst(this.children, function (c) { return offset <= c.start; }) - 1;
          if (idx >= 0) {
              var child = this.children[idx];
              if (offset > child.start && offset <= child.end) {
                  return child.findNodeAt(offset);
              }
          }
          return this;
      };
      return Node;
  }());
  exports.Node = Node;
  function parse(text) {
      var scanner = htmlScanner_js_1.createScanner(text);
      var htmlDocument = new Node(0, text.length, [], void 0);
      var curr = htmlDocument;
      var endTagStart = -1;
      var endTagName = null;
      var pendingAttribute = null;
      var token = scanner.scan();
      while (token !== htmlLanguageTypes_js_1.TokenType.EOS) {
          switch (token) {
              case htmlLanguageTypes_js_1.TokenType.StartTagOpen:
                  var child = new Node(scanner.getTokenOffset(), text.length, [], curr);
                  curr.children.push(child);
                  curr = child;
                  break;
              case htmlLanguageTypes_js_1.TokenType.StartTag:
                  curr.tag = scanner.getTokenText();
                  break;
              case htmlLanguageTypes_js_1.TokenType.StartTagClose:
                  curr.end = scanner.getTokenEnd(); // might be later set to end tag position
                  curr.startTagEnd = scanner.getTokenEnd();
                  if (curr.tag && fact_js_1.isVoidElement(curr.tag) && curr.parent) {
                      curr.closed = true;
                      curr = curr.parent;
                  }
                  break;
              case htmlLanguageTypes_js_1.TokenType.StartTagSelfClose:
                  if (curr.parent) {
                      curr.closed = true;
                      curr.end = scanner.getTokenEnd();
                      curr.startTagEnd = scanner.getTokenEnd();
                      curr = curr.parent;
                  }
                  break;
              case htmlLanguageTypes_js_1.TokenType.EndTagOpen:
                  endTagStart = scanner.getTokenOffset();
                  endTagName = null;
                  break;
              case htmlLanguageTypes_js_1.TokenType.EndTag:
                  endTagName = scanner.getTokenText().toLowerCase();
                  break;
              case htmlLanguageTypes_js_1.TokenType.EndTagClose:
                  if (endTagName) {
                      var node = curr;
                      // see if we can find a matching tag
                      while (!node.isSameTag(endTagName) && node.parent) {
                          node = node.parent;
                      }
                      if (node.parent) {
                          while (curr !== node) {
                              curr.end = endTagStart;
                              curr.closed = false;
                              curr = curr.parent;
                          }
                          curr.closed = true;
                          curr.endTagStart = endTagStart;
                          curr.end = scanner.getTokenEnd();
                          curr = curr.parent;
                      }
                  }
                  break;
              case htmlLanguageTypes_js_1.TokenType.AttributeName: {
                  pendingAttribute = scanner.getTokenText();
                  var attributes = curr.attributes;
                  if (!attributes) {
                      curr.attributes = attributes = {};
                  }
                  attributes[pendingAttribute] = null; // Support valueless attributes such as 'checked'
                  break;
              }
              case htmlLanguageTypes_js_1.TokenType.AttributeValue: {
                  var value = scanner.getTokenText();
                  var attributes = curr.attributes;
                  if (attributes && pendingAttribute) {
                      attributes[pendingAttribute] = value;
                      pendingAttribute = null;
                  }
                  break;
              }
          }
          token = scanner.scan();
      }
      while (curr.parent) {
          curr.end = text.length;
          curr.closed = false;
          curr = curr.parent;
      }
      return {
          roots: htmlDocument.children,
          findNodeBefore: htmlDocument.findNodeBefore.bind(htmlDocument),
          findNodeAt: htmlDocument.findNodeAt.bind(htmlDocument)
      };
  }
  exports.parse = parse;
  //# sourceMappingURL=htmlParser.js.map
  

});
