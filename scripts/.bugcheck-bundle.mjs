var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/chess.js/dist/cjs/chess.js
var require_chess = __commonJS({
  "node_modules/chess.js/dist/cjs/chess.js"(exports) {
    "use strict";
    function rootNode(comment) {
      return comment !== null ? { comment, variations: [] } : { variations: [] };
    }
    function node(move, suffix, nag, comment, variations) {
      const node2 = { move, variations };
      if (suffix) {
        node2.suffix = suffix;
      }
      if (nag) {
        node2.nag = nag;
      }
      if (comment !== null) {
        node2.comment = comment;
      }
      return node2;
    }
    function lineToTree(...nodes) {
      const [root, ...rest] = nodes;
      let parent = root;
      for (const child of rest) {
        if (child !== null) {
          parent.variations = [child, ...child.variations];
          child.variations = [];
          parent = child;
        }
      }
      return root;
    }
    function pgn2(headers, game) {
      if (game.marker && game.marker.comment) {
        let node2 = game.root;
        while (true) {
          const next = node2.variations[0];
          if (!next) {
            node2.comment = game.marker.comment;
            break;
          }
          node2 = next;
        }
      }
      return {
        headers,
        root: game.root,
        result: (game.marker && game.marker.result) ?? void 0
      };
    }
    function peg$subclass(child, parent) {
      function C() {
        this.constructor = child;
      }
      C.prototype = parent.prototype;
      child.prototype = new C();
    }
    function peg$SyntaxError(message, expected, found, location) {
      var self = Error.call(this, message);
      if (Object.setPrototypeOf) {
        Object.setPrototypeOf(self, peg$SyntaxError.prototype);
      }
      self.expected = expected;
      self.found = found;
      self.location = location;
      self.name = "SyntaxError";
      return self;
    }
    peg$subclass(peg$SyntaxError, Error);
    function peg$padEnd(str, targetLength, padString) {
      padString = padString || " ";
      if (str.length > targetLength) {
        return str;
      }
      targetLength -= str.length;
      padString += padString.repeat(targetLength);
      return str + padString.slice(0, targetLength);
    }
    peg$SyntaxError.prototype.format = function(sources) {
      var str = "Error: " + this.message;
      if (this.location) {
        var src = null;
        var k;
        for (k = 0; k < sources.length; k++) {
          if (sources[k].source === this.location.source) {
            src = sources[k].text.split(/\r\n|\n|\r/g);
            break;
          }
        }
        var s = this.location.start;
        var offset_s = this.location.source && typeof this.location.source.offset === "function" ? this.location.source.offset(s) : s;
        var loc = this.location.source + ":" + offset_s.line + ":" + offset_s.column;
        if (src) {
          var e = this.location.end;
          var filler = peg$padEnd("", offset_s.line.toString().length, " ");
          var line = src[s.line - 1];
          var last = s.line === e.line ? e.column : line.length + 1;
          var hatLen = last - s.column || 1;
          str += "\n --> " + loc + "\n" + filler + " |\n" + offset_s.line + " | " + line + "\n" + filler + " | " + peg$padEnd("", s.column - 1, " ") + peg$padEnd("", hatLen, "^");
        } else {
          str += "\n at " + loc;
        }
      }
      return str;
    };
    peg$SyntaxError.buildMessage = function(expected, found) {
      var DESCRIBE_EXPECTATION_FNS = {
        literal: function(expectation) {
          return '"' + literalEscape(expectation.text) + '"';
        },
        class: function(expectation) {
          var escapedParts = expectation.parts.map(function(part) {
            return Array.isArray(part) ? classEscape(part[0]) + "-" + classEscape(part[1]) : classEscape(part);
          });
          return "[" + (expectation.inverted ? "^" : "") + escapedParts.join("") + "]";
        },
        any: function() {
          return "any character";
        },
        end: function() {
          return "end of input";
        },
        other: function(expectation) {
          return expectation.description;
        }
      };
      function hex(ch) {
        return ch.charCodeAt(0).toString(16).toUpperCase();
      }
      function literalEscape(s) {
        return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, function(ch) {
          return "\\x0" + hex(ch);
        }).replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) {
          return "\\x" + hex(ch);
        });
      }
      function classEscape(s) {
        return s.replace(/\\/g, "\\\\").replace(/\]/g, "\\]").replace(/\^/g, "\\^").replace(/-/g, "\\-").replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, function(ch) {
          return "\\x0" + hex(ch);
        }).replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) {
          return "\\x" + hex(ch);
        });
      }
      function describeExpectation(expectation) {
        return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
      }
      function describeExpected(expected2) {
        var descriptions = expected2.map(describeExpectation);
        var i, j;
        descriptions.sort();
        if (descriptions.length > 0) {
          for (i = 1, j = 1; i < descriptions.length; i++) {
            if (descriptions[i - 1] !== descriptions[i]) {
              descriptions[j] = descriptions[i];
              j++;
            }
          }
          descriptions.length = j;
        }
        switch (descriptions.length) {
          case 1:
            return descriptions[0];
          case 2:
            return descriptions[0] + " or " + descriptions[1];
          default:
            return descriptions.slice(0, -1).join(", ") + ", or " + descriptions[descriptions.length - 1];
        }
      }
      function describeFound(found2) {
        return found2 ? '"' + literalEscape(found2) + '"' : "end of input";
      }
      return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
    };
    function peg$parse(input, options) {
      options = options !== void 0 ? options : {};
      var peg$FAILED = {};
      var peg$source = options.grammarSource;
      var peg$startRuleFunctions = { pgn: peg$parsepgn };
      var peg$startRuleFunction = peg$parsepgn;
      var peg$c0 = "[";
      var peg$c1 = '"';
      var peg$c2 = "]";
      var peg$c3 = ".";
      var peg$c4 = "O-O-O";
      var peg$c5 = "O-O";
      var peg$c6 = "0-0-0";
      var peg$c7 = "0-0";
      var peg$c8 = "$";
      var peg$c9 = "{";
      var peg$c10 = "}";
      var peg$c11 = ";";
      var peg$c12 = "(";
      var peg$c13 = ")";
      var peg$c14 = "1-0";
      var peg$c15 = "0-1";
      var peg$c16 = "1/2-1/2";
      var peg$c17 = "*";
      var peg$r0 = /^[a-zA-Z]/;
      var peg$r1 = /^[^"]/;
      var peg$r2 = /^[0-9]/;
      var peg$r3 = /^[.]/;
      var peg$r4 = /^[a-zA-Z1-8\-=]/;
      var peg$r5 = /^[+#]/;
      var peg$r6 = /^[!?]/;
      var peg$r7 = /^[^}]/;
      var peg$r8 = /^[^\r\n]/;
      var peg$r9 = /^[ \t\r\n]/;
      var peg$e0 = peg$otherExpectation("tag pair");
      var peg$e1 = peg$literalExpectation("[", false);
      var peg$e2 = peg$literalExpectation('"', false);
      var peg$e3 = peg$literalExpectation("]", false);
      var peg$e4 = peg$otherExpectation("tag name");
      var peg$e5 = peg$classExpectation([["a", "z"], ["A", "Z"]], false, false);
      var peg$e6 = peg$otherExpectation("tag value");
      var peg$e7 = peg$classExpectation(['"'], true, false);
      var peg$e8 = peg$otherExpectation("move number");
      var peg$e9 = peg$classExpectation([["0", "9"]], false, false);
      var peg$e10 = peg$literalExpectation(".", false);
      var peg$e11 = peg$classExpectation(["."], false, false);
      var peg$e12 = peg$otherExpectation("standard algebraic notation");
      var peg$e13 = peg$literalExpectation("O-O-O", false);
      var peg$e14 = peg$literalExpectation("O-O", false);
      var peg$e15 = peg$literalExpectation("0-0-0", false);
      var peg$e16 = peg$literalExpectation("0-0", false);
      var peg$e17 = peg$classExpectation([["a", "z"], ["A", "Z"], ["1", "8"], "-", "="], false, false);
      var peg$e18 = peg$classExpectation(["+", "#"], false, false);
      var peg$e19 = peg$otherExpectation("suffix annotation");
      var peg$e20 = peg$classExpectation(["!", "?"], false, false);
      var peg$e21 = peg$otherExpectation("NAG");
      var peg$e22 = peg$literalExpectation("$", false);
      var peg$e23 = peg$otherExpectation("brace comment");
      var peg$e24 = peg$literalExpectation("{", false);
      var peg$e25 = peg$classExpectation(["}"], true, false);
      var peg$e26 = peg$literalExpectation("}", false);
      var peg$e27 = peg$otherExpectation("rest of line comment");
      var peg$e28 = peg$literalExpectation(";", false);
      var peg$e29 = peg$classExpectation(["\r", "\n"], true, false);
      var peg$e30 = peg$otherExpectation("variation");
      var peg$e31 = peg$literalExpectation("(", false);
      var peg$e32 = peg$literalExpectation(")", false);
      var peg$e33 = peg$otherExpectation("game termination marker");
      var peg$e34 = peg$literalExpectation("1-0", false);
      var peg$e35 = peg$literalExpectation("0-1", false);
      var peg$e36 = peg$literalExpectation("1/2-1/2", false);
      var peg$e37 = peg$literalExpectation("*", false);
      var peg$e38 = peg$otherExpectation("whitespace");
      var peg$e39 = peg$classExpectation([" ", "	", "\r", "\n"], false, false);
      var peg$f0 = function(headers, game) {
        return pgn2(headers, game);
      };
      var peg$f1 = function(tagPairs) {
        return Object.fromEntries(tagPairs);
      };
      var peg$f2 = function(tagName, tagValue) {
        return [tagName, tagValue];
      };
      var peg$f3 = function(root, marker) {
        return { root, marker };
      };
      var peg$f4 = function(comment, moves) {
        return lineToTree(rootNode(comment), ...moves.flat());
      };
      var peg$f5 = function(san, suffix, nag, comment, variations) {
        return node(san, suffix, nag, comment, variations);
      };
      var peg$f6 = function(nag) {
        return nag;
      };
      var peg$f7 = function(comment) {
        return comment.replace(/[\r\n]+/g, " ");
      };
      var peg$f8 = function(comment) {
        return comment.trim();
      };
      var peg$f9 = function(line) {
        return line;
      };
      var peg$f10 = function(result, comment) {
        return { result, comment };
      };
      var peg$currPos = options.peg$currPos | 0;
      var peg$posDetailsCache = [{ line: 1, column: 1 }];
      var peg$maxFailPos = peg$currPos;
      var peg$maxFailExpected = options.peg$maxFailExpected || [];
      var peg$silentFails = options.peg$silentFails | 0;
      var peg$result;
      if (options.startRule) {
        if (!(options.startRule in peg$startRuleFunctions)) {
          throw new Error(`Can't start parsing from rule "` + options.startRule + '".');
        }
        peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
      }
      function peg$literalExpectation(text, ignoreCase) {
        return { type: "literal", text, ignoreCase };
      }
      function peg$classExpectation(parts, inverted, ignoreCase) {
        return { type: "class", parts, inverted, ignoreCase };
      }
      function peg$endExpectation() {
        return { type: "end" };
      }
      function peg$otherExpectation(description) {
        return { type: "other", description };
      }
      function peg$computePosDetails(pos) {
        var details = peg$posDetailsCache[pos];
        var p;
        if (details) {
          return details;
        } else {
          if (pos >= peg$posDetailsCache.length) {
            p = peg$posDetailsCache.length - 1;
          } else {
            p = pos;
            while (!peg$posDetailsCache[--p]) {
            }
          }
          details = peg$posDetailsCache[p];
          details = {
            line: details.line,
            column: details.column
          };
          while (p < pos) {
            if (input.charCodeAt(p) === 10) {
              details.line++;
              details.column = 1;
            } else {
              details.column++;
            }
            p++;
          }
          peg$posDetailsCache[pos] = details;
          return details;
        }
      }
      function peg$computeLocation(startPos, endPos, offset) {
        var startPosDetails = peg$computePosDetails(startPos);
        var endPosDetails = peg$computePosDetails(endPos);
        var res = {
          source: peg$source,
          start: {
            offset: startPos,
            line: startPosDetails.line,
            column: startPosDetails.column
          },
          end: {
            offset: endPos,
            line: endPosDetails.line,
            column: endPosDetails.column
          }
        };
        return res;
      }
      function peg$fail(expected) {
        if (peg$currPos < peg$maxFailPos) {
          return;
        }
        if (peg$currPos > peg$maxFailPos) {
          peg$maxFailPos = peg$currPos;
          peg$maxFailExpected = [];
        }
        peg$maxFailExpected.push(expected);
      }
      function peg$buildStructuredError(expected, found, location) {
        return new peg$SyntaxError(
          peg$SyntaxError.buildMessage(expected, found),
          expected,
          found,
          location
        );
      }
      function peg$parsepgn() {
        var s0, s1, s2;
        s0 = peg$currPos;
        s1 = peg$parsetagPairSection();
        s2 = peg$parsemoveTextSection();
        s0 = peg$f0(s1, s2);
        return s0;
      }
      function peg$parsetagPairSection() {
        var s0, s1, s2;
        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsetagPair();
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parsetagPair();
        }
        s2 = peg$parse_();
        s0 = peg$f1(s1);
        return s0;
      }
      function peg$parsetagPair() {
        var s0, s2, s4, s6, s7, s8, s10;
        peg$silentFails++;
        s0 = peg$currPos;
        peg$parse_();
        if (input.charCodeAt(peg$currPos) === 91) {
          s2 = peg$c0;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e1);
          }
        }
        if (s2 !== peg$FAILED) {
          peg$parse_();
          s4 = peg$parsetagName();
          if (s4 !== peg$FAILED) {
            peg$parse_();
            if (input.charCodeAt(peg$currPos) === 34) {
              s6 = peg$c1;
              peg$currPos++;
            } else {
              s6 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e2);
              }
            }
            if (s6 !== peg$FAILED) {
              s7 = peg$parsetagValue();
              if (input.charCodeAt(peg$currPos) === 34) {
                s8 = peg$c1;
                peg$currPos++;
              } else {
                s8 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$e2);
                }
              }
              if (s8 !== peg$FAILED) {
                peg$parse_();
                if (input.charCodeAt(peg$currPos) === 93) {
                  s10 = peg$c2;
                  peg$currPos++;
                } else {
                  s10 = peg$FAILED;
                  if (peg$silentFails === 0) {
                    peg$fail(peg$e3);
                  }
                }
                if (s10 !== peg$FAILED) {
                  s0 = peg$f2(s4, s7);
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          if (peg$silentFails === 0) {
            peg$fail(peg$e0);
          }
        }
        return s0;
      }
      function peg$parsetagName() {
        var s0, s1, s2;
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = [];
        s2 = input.charAt(peg$currPos);
        if (peg$r0.test(s2)) {
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e5);
          }
        }
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = input.charAt(peg$currPos);
            if (peg$r0.test(s2)) {
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e5);
              }
            }
          }
        } else {
          s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
          s0 = input.substring(s0, peg$currPos);
        } else {
          s0 = s1;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e4);
          }
        }
        return s0;
      }
      function peg$parsetagValue() {
        var s0, s1, s2;
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = [];
        s2 = input.charAt(peg$currPos);
        if (peg$r1.test(s2)) {
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e7);
          }
        }
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = input.charAt(peg$currPos);
          if (peg$r1.test(s2)) {
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e7);
            }
          }
        }
        s0 = input.substring(s0, peg$currPos);
        peg$silentFails--;
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e6);
        }
        return s0;
      }
      function peg$parsemoveTextSection() {
        var s0, s1, s3;
        s0 = peg$currPos;
        s1 = peg$parseline();
        peg$parse_();
        s3 = peg$parsegameTerminationMarker();
        if (s3 === peg$FAILED) {
          s3 = null;
        }
        peg$parse_();
        s0 = peg$f3(s1, s3);
        return s0;
      }
      function peg$parseline() {
        var s0, s1, s2, s3;
        s0 = peg$currPos;
        s1 = peg$parsecomment();
        if (s1 === peg$FAILED) {
          s1 = null;
        }
        s2 = [];
        s3 = peg$parsemove();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parsemove();
        }
        s0 = peg$f4(s1, s2);
        return s0;
      }
      function peg$parsemove() {
        var s0, s4, s5, s6, s7, s8, s9, s10;
        s0 = peg$currPos;
        peg$parse_();
        peg$parsemoveNumber();
        peg$parse_();
        s4 = peg$parsesan();
        if (s4 !== peg$FAILED) {
          s5 = peg$parsesuffixAnnotation();
          if (s5 === peg$FAILED) {
            s5 = null;
          }
          s6 = [];
          s7 = peg$parsenag();
          while (s7 !== peg$FAILED) {
            s6.push(s7);
            s7 = peg$parsenag();
          }
          s7 = peg$parse_();
          s8 = peg$parsecomment();
          if (s8 === peg$FAILED) {
            s8 = null;
          }
          s9 = [];
          s10 = peg$parsevariation();
          while (s10 !== peg$FAILED) {
            s9.push(s10);
            s10 = peg$parsevariation();
          }
          s0 = peg$f5(s4, s5, s6, s8, s9);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        return s0;
      }
      function peg$parsemoveNumber() {
        var s0, s1, s2, s3, s4, s5;
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = [];
        s2 = input.charAt(peg$currPos);
        if (peg$r2.test(s2)) {
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e9);
          }
        }
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = input.charAt(peg$currPos);
          if (peg$r2.test(s2)) {
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e9);
            }
          }
        }
        if (input.charCodeAt(peg$currPos) === 46) {
          s2 = peg$c3;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e10);
          }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parse_();
          s4 = [];
          s5 = input.charAt(peg$currPos);
          if (peg$r3.test(s5)) {
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e11);
            }
          }
          while (s5 !== peg$FAILED) {
            s4.push(s5);
            s5 = input.charAt(peg$currPos);
            if (peg$r3.test(s5)) {
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e11);
              }
            }
          }
          s1 = [s1, s2, s3, s4];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e8);
          }
        }
        return s0;
      }
      function peg$parsesan() {
        var s0, s1, s2, s3, s4, s5;
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = peg$currPos;
        if (input.substr(peg$currPos, 5) === peg$c4) {
          s2 = peg$c4;
          peg$currPos += 5;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e13);
          }
        }
        if (s2 === peg$FAILED) {
          if (input.substr(peg$currPos, 3) === peg$c5) {
            s2 = peg$c5;
            peg$currPos += 3;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e14);
            }
          }
          if (s2 === peg$FAILED) {
            if (input.substr(peg$currPos, 5) === peg$c6) {
              s2 = peg$c6;
              peg$currPos += 5;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e15);
              }
            }
            if (s2 === peg$FAILED) {
              if (input.substr(peg$currPos, 3) === peg$c7) {
                s2 = peg$c7;
                peg$currPos += 3;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$e16);
                }
              }
              if (s2 === peg$FAILED) {
                s2 = peg$currPos;
                s3 = input.charAt(peg$currPos);
                if (peg$r0.test(s3)) {
                  peg$currPos++;
                } else {
                  s3 = peg$FAILED;
                  if (peg$silentFails === 0) {
                    peg$fail(peg$e5);
                  }
                }
                if (s3 !== peg$FAILED) {
                  s4 = [];
                  s5 = input.charAt(peg$currPos);
                  if (peg$r4.test(s5)) {
                    peg$currPos++;
                  } else {
                    s5 = peg$FAILED;
                    if (peg$silentFails === 0) {
                      peg$fail(peg$e17);
                    }
                  }
                  if (s5 !== peg$FAILED) {
                    while (s5 !== peg$FAILED) {
                      s4.push(s5);
                      s5 = input.charAt(peg$currPos);
                      if (peg$r4.test(s5)) {
                        peg$currPos++;
                      } else {
                        s5 = peg$FAILED;
                        if (peg$silentFails === 0) {
                          peg$fail(peg$e17);
                        }
                      }
                    }
                  } else {
                    s4 = peg$FAILED;
                  }
                  if (s4 !== peg$FAILED) {
                    s3 = [s3, s4];
                    s2 = s3;
                  } else {
                    peg$currPos = s2;
                    s2 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s2;
                  s2 = peg$FAILED;
                }
              }
            }
          }
        }
        if (s2 !== peg$FAILED) {
          s3 = input.charAt(peg$currPos);
          if (peg$r5.test(s3)) {
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e18);
            }
          }
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          s2 = [s2, s3];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
          s0 = input.substring(s0, peg$currPos);
        } else {
          s0 = s1;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e12);
          }
        }
        return s0;
      }
      function peg$parsesuffixAnnotation() {
        var s0, s1, s2;
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = [];
        s2 = input.charAt(peg$currPos);
        if (peg$r6.test(s2)) {
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e20);
          }
        }
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (s1.length >= 2) {
            s2 = peg$FAILED;
          } else {
            s2 = input.charAt(peg$currPos);
            if (peg$r6.test(s2)) {
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e20);
              }
            }
          }
        }
        if (s1.length < 1) {
          peg$currPos = s0;
          s0 = peg$FAILED;
        } else {
          s0 = s1;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e19);
          }
        }
        return s0;
      }
      function peg$parsenag() {
        var s0, s2, s3, s4, s5;
        peg$silentFails++;
        s0 = peg$currPos;
        peg$parse_();
        if (input.charCodeAt(peg$currPos) === 36) {
          s2 = peg$c8;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e22);
          }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          s4 = [];
          s5 = input.charAt(peg$currPos);
          if (peg$r2.test(s5)) {
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e9);
            }
          }
          if (s5 !== peg$FAILED) {
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              s5 = input.charAt(peg$currPos);
              if (peg$r2.test(s5)) {
                peg$currPos++;
              } else {
                s5 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$e9);
                }
              }
            }
          } else {
            s4 = peg$FAILED;
          }
          if (s4 !== peg$FAILED) {
            s3 = input.substring(s3, peg$currPos);
          } else {
            s3 = s4;
          }
          if (s3 !== peg$FAILED) {
            s0 = peg$f6(s3);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          if (peg$silentFails === 0) {
            peg$fail(peg$e21);
          }
        }
        return s0;
      }
      function peg$parsecomment() {
        var s0;
        s0 = peg$parsebraceComment();
        if (s0 === peg$FAILED) {
          s0 = peg$parserestOfLineComment();
        }
        return s0;
      }
      function peg$parsebraceComment() {
        var s0, s1, s2, s3, s4;
        peg$silentFails++;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 123) {
          s1 = peg$c9;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e24);
          }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          s3 = [];
          s4 = input.charAt(peg$currPos);
          if (peg$r7.test(s4)) {
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e25);
            }
          }
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = input.charAt(peg$currPos);
            if (peg$r7.test(s4)) {
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e25);
              }
            }
          }
          s2 = input.substring(s2, peg$currPos);
          if (input.charCodeAt(peg$currPos) === 125) {
            s3 = peg$c10;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e26);
            }
          }
          if (s3 !== peg$FAILED) {
            s0 = peg$f7(s2);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e23);
          }
        }
        return s0;
      }
      function peg$parserestOfLineComment() {
        var s0, s1, s2, s3, s4;
        peg$silentFails++;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 59) {
          s1 = peg$c11;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e28);
          }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          s3 = [];
          s4 = input.charAt(peg$currPos);
          if (peg$r8.test(s4)) {
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e29);
            }
          }
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = input.charAt(peg$currPos);
            if (peg$r8.test(s4)) {
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e29);
              }
            }
          }
          s2 = input.substring(s2, peg$currPos);
          s0 = peg$f8(s2);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e27);
          }
        }
        return s0;
      }
      function peg$parsevariation() {
        var s0, s2, s3, s5;
        peg$silentFails++;
        s0 = peg$currPos;
        peg$parse_();
        if (input.charCodeAt(peg$currPos) === 40) {
          s2 = peg$c12;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e31);
          }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseline();
          if (s3 !== peg$FAILED) {
            peg$parse_();
            if (input.charCodeAt(peg$currPos) === 41) {
              s5 = peg$c13;
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e32);
              }
            }
            if (s5 !== peg$FAILED) {
              s0 = peg$f9(s3);
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          if (peg$silentFails === 0) {
            peg$fail(peg$e30);
          }
        }
        return s0;
      }
      function peg$parsegameTerminationMarker() {
        var s0, s1, s3;
        peg$silentFails++;
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 3) === peg$c14) {
          s1 = peg$c14;
          peg$currPos += 3;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e34);
          }
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 3) === peg$c15) {
            s1 = peg$c15;
            peg$currPos += 3;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e35);
            }
          }
          if (s1 === peg$FAILED) {
            if (input.substr(peg$currPos, 7) === peg$c16) {
              s1 = peg$c16;
              peg$currPos += 7;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e36);
              }
            }
            if (s1 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 42) {
                s1 = peg$c17;
                peg$currPos++;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$e37);
                }
              }
            }
          }
        }
        if (s1 !== peg$FAILED) {
          peg$parse_();
          s3 = peg$parsecomment();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          s0 = peg$f10(s1, s3);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e33);
          }
        }
        return s0;
      }
      function peg$parse_() {
        var s0, s1;
        peg$silentFails++;
        s0 = [];
        s1 = input.charAt(peg$currPos);
        if (peg$r9.test(s1)) {
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e39);
          }
        }
        while (s1 !== peg$FAILED) {
          s0.push(s1);
          s1 = input.charAt(peg$currPos);
          if (peg$r9.test(s1)) {
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e39);
            }
          }
        }
        peg$silentFails--;
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e38);
        }
        return s0;
      }
      peg$result = peg$startRuleFunction();
      if (options.peg$library) {
        return (
          /** @type {any} */
          {
            peg$result,
            peg$currPos,
            peg$FAILED,
            peg$maxFailExpected,
            peg$maxFailPos
          }
        );
      }
      if (peg$result !== peg$FAILED && peg$currPos === input.length) {
        return peg$result;
      } else {
        if (peg$result !== peg$FAILED && peg$currPos < input.length) {
          peg$fail(peg$endExpectation());
        }
        throw peg$buildStructuredError(
          peg$maxFailExpected,
          peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
          peg$maxFailPos < input.length ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1) : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
        );
      }
    }
    var MASK64 = 0xffffffffffffffffn;
    function rotl(x, k) {
      return (x << k | x >> 64n - k) & 0xffffffffffffffffn;
    }
    function wrappingMul(x, y) {
      return x * y & MASK64;
    }
    function xoroshiro128(state) {
      return function() {
        let s0 = BigInt(state & MASK64);
        let s1 = BigInt(state >> 64n & MASK64);
        const result = wrappingMul(rotl(wrappingMul(s0, 5n), 7n), 9n);
        s1 ^= s0;
        s0 = (rotl(s0, 24n) ^ s1 ^ s1 << 16n) & MASK64;
        s1 = rotl(s1, 37n);
        state = s1 << 64n | s0;
        return result;
      };
    }
    var rand = xoroshiro128(0xa187eb39cdcaed8f31c4b365b102e01en);
    var PIECE_KEYS = Array.from({ length: 2 }, () => Array.from({ length: 6 }, () => Array.from({ length: 128 }, () => rand())));
    var EP_KEYS = Array.from({ length: 8 }, () => rand());
    var CASTLING_KEYS = Array.from({ length: 16 }, () => rand());
    var SIDE_KEY = rand();
    var WHITE = "w";
    var BLACK = "b";
    var PAWN = "p";
    var KNIGHT = "n";
    var BISHOP = "b";
    var ROOK = "r";
    var QUEEN = "q";
    var KING = "k";
    var DEFAULT_POSITION = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    var Move = class {
      color;
      from;
      to;
      piece;
      captured;
      promotion;
      /**
       * @deprecated This field is deprecated and will be removed in version 2.0.0.
       * Please use move descriptor functions instead: `isCapture`, `isPromotion`,
       * `isEnPassant`, `isKingsideCastle`, `isQueensideCastle`, `isCastle`, and
       * `isBigPawn`
       */
      flags;
      san;
      lan;
      before;
      after;
      constructor(chess, internal) {
        const { color, piece, from, to, flags, captured, promotion } = internal;
        const fromAlgebraic = algebraic(from);
        const toAlgebraic = algebraic(to);
        this.color = color;
        this.piece = piece;
        this.from = fromAlgebraic;
        this.to = toAlgebraic;
        this.san = chess["_moveToSan"](internal, chess["_moves"]({ legal: true }));
        this.lan = fromAlgebraic + toAlgebraic;
        this.before = chess.fen();
        chess["_makeMove"](internal);
        this.after = chess.fen();
        chess["_undoMove"]();
        this.flags = "";
        for (const flag in BITS) {
          if (BITS[flag] & flags) {
            this.flags += FLAGS[flag];
          }
        }
        if (captured) {
          this.captured = captured;
        }
        if (promotion) {
          this.promotion = promotion;
          this.lan += promotion;
        }
      }
      isCapture() {
        return this.flags.indexOf(FLAGS["CAPTURE"]) > -1;
      }
      isPromotion() {
        return this.flags.indexOf(FLAGS["PROMOTION"]) > -1;
      }
      isEnPassant() {
        return this.flags.indexOf(FLAGS["EP_CAPTURE"]) > -1;
      }
      isKingsideCastle() {
        return this.flags.indexOf(FLAGS["KSIDE_CASTLE"]) > -1;
      }
      isQueensideCastle() {
        return this.flags.indexOf(FLAGS["QSIDE_CASTLE"]) > -1;
      }
      isBigPawn() {
        return this.flags.indexOf(FLAGS["BIG_PAWN"]) > -1;
      }
    };
    var EMPTY = -1;
    var FLAGS = {
      NORMAL: "n",
      CAPTURE: "c",
      BIG_PAWN: "b",
      EP_CAPTURE: "e",
      PROMOTION: "p",
      KSIDE_CASTLE: "k",
      QSIDE_CASTLE: "q",
      NULL_MOVE: "-"
    };
    var SQUARES = [
      "a8",
      "b8",
      "c8",
      "d8",
      "e8",
      "f8",
      "g8",
      "h8",
      "a7",
      "b7",
      "c7",
      "d7",
      "e7",
      "f7",
      "g7",
      "h7",
      "a6",
      "b6",
      "c6",
      "d6",
      "e6",
      "f6",
      "g6",
      "h6",
      "a5",
      "b5",
      "c5",
      "d5",
      "e5",
      "f5",
      "g5",
      "h5",
      "a4",
      "b4",
      "c4",
      "d4",
      "e4",
      "f4",
      "g4",
      "h4",
      "a3",
      "b3",
      "c3",
      "d3",
      "e3",
      "f3",
      "g3",
      "h3",
      "a2",
      "b2",
      "c2",
      "d2",
      "e2",
      "f2",
      "g2",
      "h2",
      "a1",
      "b1",
      "c1",
      "d1",
      "e1",
      "f1",
      "g1",
      "h1"
    ];
    var BITS = {
      NORMAL: 1,
      CAPTURE: 2,
      BIG_PAWN: 4,
      EP_CAPTURE: 8,
      PROMOTION: 16,
      KSIDE_CASTLE: 32,
      QSIDE_CASTLE: 64,
      NULL_MOVE: 128
    };
    var SEVEN_TAG_ROSTER = {
      Event: "?",
      Site: "?",
      Date: "????.??.??",
      Round: "?",
      White: "?",
      Black: "?",
      Result: "*"
    };
    var SUPLEMENTAL_TAGS = {
      WhiteTitle: null,
      BlackTitle: null,
      WhiteElo: null,
      BlackElo: null,
      WhiteUSCF: null,
      BlackUSCF: null,
      WhiteNA: null,
      BlackNA: null,
      WhiteType: null,
      BlackType: null,
      EventDate: null,
      EventSponsor: null,
      Section: null,
      Stage: null,
      Board: null,
      Opening: null,
      Variation: null,
      SubVariation: null,
      ECO: null,
      NIC: null,
      Time: null,
      UTCTime: null,
      UTCDate: null,
      TimeControl: null,
      SetUp: null,
      FEN: null,
      Termination: null,
      Annotator: null,
      Mode: null,
      PlyCount: null
    };
    var HEADER_TEMPLATE = {
      ...SEVEN_TAG_ROSTER,
      ...SUPLEMENTAL_TAGS
    };
    var Ox88 = {
      a8: 0,
      b8: 1,
      c8: 2,
      d8: 3,
      e8: 4,
      f8: 5,
      g8: 6,
      h8: 7,
      a7: 16,
      b7: 17,
      c7: 18,
      d7: 19,
      e7: 20,
      f7: 21,
      g7: 22,
      h7: 23,
      a6: 32,
      b6: 33,
      c6: 34,
      d6: 35,
      e6: 36,
      f6: 37,
      g6: 38,
      h6: 39,
      a5: 48,
      b5: 49,
      c5: 50,
      d5: 51,
      e5: 52,
      f5: 53,
      g5: 54,
      h5: 55,
      a4: 64,
      b4: 65,
      c4: 66,
      d4: 67,
      e4: 68,
      f4: 69,
      g4: 70,
      h4: 71,
      a3: 80,
      b3: 81,
      c3: 82,
      d3: 83,
      e3: 84,
      f3: 85,
      g3: 86,
      h3: 87,
      a2: 96,
      b2: 97,
      c2: 98,
      d2: 99,
      e2: 100,
      f2: 101,
      g2: 102,
      h2: 103,
      a1: 112,
      b1: 113,
      c1: 114,
      d1: 115,
      e1: 116,
      f1: 117,
      g1: 118,
      h1: 119
    };
    var PAWN_OFFSETS = {
      b: [16, 32, 17, 15],
      w: [-16, -32, -17, -15]
    };
    var PIECE_OFFSETS = {
      n: [-18, -33, -31, -14, 18, 33, 31, 14],
      b: [-17, -15, 17, 15],
      r: [-16, 1, 16, -1],
      q: [-17, -16, -15, 1, 17, 16, 15, -1],
      k: [-17, -16, -15, 1, 17, 16, 15, -1]
    };
    var ATTACKS = [
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      24,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      24,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      24,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      24,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      24,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      2,
      24,
      2,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      2,
      53,
      56,
      53,
      2,
      0,
      0,
      0,
      0,
      0,
      0,
      24,
      24,
      24,
      24,
      24,
      24,
      56,
      0,
      56,
      24,
      24,
      24,
      24,
      24,
      24,
      0,
      0,
      0,
      0,
      0,
      0,
      2,
      53,
      56,
      53,
      2,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      2,
      24,
      2,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      24,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      24,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      24,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      24,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      24,
      0,
      0,
      0,
      0,
      0,
      0,
      20
    ];
    var RAYS = [
      17,
      0,
      0,
      0,
      0,
      0,
      0,
      16,
      0,
      0,
      0,
      0,
      0,
      0,
      15,
      0,
      0,
      17,
      0,
      0,
      0,
      0,
      0,
      16,
      0,
      0,
      0,
      0,
      0,
      15,
      0,
      0,
      0,
      0,
      17,
      0,
      0,
      0,
      0,
      16,
      0,
      0,
      0,
      0,
      15,
      0,
      0,
      0,
      0,
      0,
      0,
      17,
      0,
      0,
      0,
      16,
      0,
      0,
      0,
      15,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      17,
      0,
      0,
      16,
      0,
      0,
      15,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      17,
      0,
      16,
      0,
      15,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      17,
      16,
      15,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      -15,
      -16,
      -17,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      -15,
      0,
      -16,
      0,
      -17,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      -15,
      0,
      0,
      -16,
      0,
      0,
      -17,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      -15,
      0,
      0,
      0,
      -16,
      0,
      0,
      0,
      -17,
      0,
      0,
      0,
      0,
      0,
      0,
      -15,
      0,
      0,
      0,
      0,
      -16,
      0,
      0,
      0,
      0,
      -17,
      0,
      0,
      0,
      0,
      -15,
      0,
      0,
      0,
      0,
      0,
      -16,
      0,
      0,
      0,
      0,
      0,
      -17,
      0,
      0,
      -15,
      0,
      0,
      0,
      0,
      0,
      0,
      -16,
      0,
      0,
      0,
      0,
      0,
      0,
      -17
    ];
    var PIECE_MASKS = { p: 1, n: 2, b: 4, r: 8, q: 16, k: 32 };
    var SYMBOLS = "pnbrqkPNBRQK";
    var PROMOTIONS = [KNIGHT, BISHOP, ROOK, QUEEN];
    var RANK_1 = 7;
    var RANK_2 = 6;
    var RANK_7 = 1;
    var RANK_8 = 0;
    var SIDES = {
      [KING]: BITS.KSIDE_CASTLE,
      [QUEEN]: BITS.QSIDE_CASTLE
    };
    var ROOKS = {
      w: [
        { square: Ox88.a1, flag: BITS.QSIDE_CASTLE },
        { square: Ox88.h1, flag: BITS.KSIDE_CASTLE }
      ],
      b: [
        { square: Ox88.a8, flag: BITS.QSIDE_CASTLE },
        { square: Ox88.h8, flag: BITS.KSIDE_CASTLE }
      ]
    };
    var SECOND_RANK = { b: RANK_7, w: RANK_2 };
    var SAN_NULLMOVE = "--";
    function rank(square) {
      return square >> 4;
    }
    function file(square) {
      return square & 15;
    }
    function isDigit(c) {
      return "0123456789".indexOf(c) !== -1;
    }
    function algebraic(square) {
      const f = file(square);
      const r = rank(square);
      return "abcdefgh".substring(f, f + 1) + "87654321".substring(r, r + 1);
    }
    function swapColor(color) {
      return color === WHITE ? BLACK : WHITE;
    }
    function validateFen(fen) {
      const tokens = fen.split(/\s+/);
      if (tokens.length !== 6) {
        return {
          ok: false,
          error: "Invalid FEN: must contain six space-delimited fields"
        };
      }
      const moveNumber = parseInt(tokens[5], 10);
      if (isNaN(moveNumber) || moveNumber <= 0) {
        return {
          ok: false,
          error: "Invalid FEN: move number must be a positive integer"
        };
      }
      const halfMoves = parseInt(tokens[4], 10);
      if (isNaN(halfMoves) || halfMoves < 0) {
        return {
          ok: false,
          error: "Invalid FEN: half move counter number must be a non-negative integer"
        };
      }
      if (!/^(-|[abcdefgh][36])$/.test(tokens[3])) {
        return { ok: false, error: "Invalid FEN: en-passant square is invalid" };
      }
      if (/[^kKqQ-]/.test(tokens[2])) {
        return { ok: false, error: "Invalid FEN: castling availability is invalid" };
      }
      if (!/^(w|b)$/.test(tokens[1])) {
        return { ok: false, error: "Invalid FEN: side-to-move is invalid" };
      }
      const rows = tokens[0].split("/");
      if (rows.length !== 8) {
        return {
          ok: false,
          error: "Invalid FEN: piece data does not contain 8 '/'-delimited rows"
        };
      }
      for (let i = 0; i < rows.length; i++) {
        let sumFields = 0;
        let previousWasNumber = false;
        for (let k = 0; k < rows[i].length; k++) {
          if (isDigit(rows[i][k])) {
            if (previousWasNumber) {
              return {
                ok: false,
                error: "Invalid FEN: piece data is invalid (consecutive number)"
              };
            }
            sumFields += parseInt(rows[i][k], 10);
            previousWasNumber = true;
          } else {
            if (!/^[prnbqkPRNBQK]$/.test(rows[i][k])) {
              return {
                ok: false,
                error: "Invalid FEN: piece data is invalid (invalid piece)"
              };
            }
            sumFields += 1;
            previousWasNumber = false;
          }
        }
        if (sumFields !== 8) {
          return {
            ok: false,
            error: "Invalid FEN: piece data is invalid (too many squares in rank)"
          };
        }
      }
      if (tokens[3][1] == "3" && tokens[1] == "w" || tokens[3][1] == "6" && tokens[1] == "b") {
        return { ok: false, error: "Invalid FEN: illegal en-passant square" };
      }
      const kings = [
        { color: "white", regex: /K/g },
        { color: "black", regex: /k/g }
      ];
      for (const { color, regex } of kings) {
        if (!regex.test(tokens[0])) {
          return { ok: false, error: `Invalid FEN: missing ${color} king` };
        }
        if ((tokens[0].match(regex) || []).length > 1) {
          return { ok: false, error: `Invalid FEN: too many ${color} kings` };
        }
      }
      if (Array.from(rows[0] + rows[7]).some((char) => char.toUpperCase() === "P")) {
        return {
          ok: false,
          error: "Invalid FEN: some pawns are on the edge rows"
        };
      }
      return { ok: true };
    }
    function getDisambiguator(move, moves) {
      const from = move.from;
      const to = move.to;
      const piece = move.piece;
      let ambiguities = 0;
      let sameRank = 0;
      let sameFile = 0;
      for (let i = 0, len = moves.length; i < len; i++) {
        const ambigFrom = moves[i].from;
        const ambigTo = moves[i].to;
        const ambigPiece = moves[i].piece;
        if (piece === ambigPiece && from !== ambigFrom && to === ambigTo) {
          ambiguities++;
          if (rank(from) === rank(ambigFrom)) {
            sameRank++;
          }
          if (file(from) === file(ambigFrom)) {
            sameFile++;
          }
        }
      }
      if (ambiguities > 0) {
        if (sameRank > 0 && sameFile > 0) {
          return algebraic(from);
        } else if (sameFile > 0) {
          return algebraic(from).charAt(1);
        } else {
          return algebraic(from).charAt(0);
        }
      }
      return "";
    }
    function addMove(moves, color, from, to, piece, captured = void 0, flags = BITS.NORMAL) {
      const r = rank(to);
      if (piece === PAWN && (r === RANK_1 || r === RANK_8)) {
        for (let i = 0; i < PROMOTIONS.length; i++) {
          const promotion = PROMOTIONS[i];
          moves.push({
            color,
            from,
            to,
            piece,
            captured,
            promotion,
            flags: flags | BITS.PROMOTION
          });
        }
      } else {
        moves.push({
          color,
          from,
          to,
          piece,
          captured,
          flags
        });
      }
    }
    function inferPieceType(san) {
      let pieceType2 = san.charAt(0);
      if (pieceType2 >= "a" && pieceType2 <= "h") {
        const matches = san.match(/[a-h]\d.*[a-h]\d/);
        if (matches) {
          return void 0;
        }
        return PAWN;
      }
      pieceType2 = pieceType2.toLowerCase();
      if (pieceType2 === "o") {
        return KING;
      }
      return pieceType2;
    }
    function strippedSan(move) {
      return move.replace(/=/, "").replace(/[+#]?[?!]*$/, "");
    }
    var Chess6 = class {
      _board = new Array(128);
      _turn = WHITE;
      _header = {};
      _kings = { w: EMPTY, b: EMPTY };
      _epSquare = -1;
      _halfMoves = 0;
      _moveNumber = 0;
      _history = [];
      _comments = {};
      _castling = { w: 0, b: 0 };
      _hash = 0n;
      // tracks number of times a position has been seen for repetition checking
      _positionCount = /* @__PURE__ */ new Map();
      constructor(fen = DEFAULT_POSITION, { skipValidation = false } = {}) {
        this.load(fen, { skipValidation });
      }
      clear({ preserveHeaders = false } = {}) {
        this._board = new Array(128);
        this._kings = { w: EMPTY, b: EMPTY };
        this._turn = WHITE;
        this._castling = { w: 0, b: 0 };
        this._epSquare = EMPTY;
        this._halfMoves = 0;
        this._moveNumber = 1;
        this._history = [];
        this._comments = {};
        this._header = preserveHeaders ? this._header : { ...HEADER_TEMPLATE };
        this._hash = this._computeHash();
        this._positionCount = /* @__PURE__ */ new Map();
        this._header["SetUp"] = null;
        this._header["FEN"] = null;
      }
      load(fen, { skipValidation = false, preserveHeaders = false } = {}) {
        let tokens = fen.split(/\s+/);
        if (tokens.length >= 2 && tokens.length < 6) {
          const adjustments = ["-", "-", "0", "1"];
          fen = tokens.concat(adjustments.slice(-(6 - tokens.length))).join(" ");
        }
        tokens = fen.split(/\s+/);
        if (!skipValidation) {
          const { ok, error } = validateFen(fen);
          if (!ok) {
            throw new Error(error);
          }
        }
        const position = tokens[0];
        let square = 0;
        this.clear({ preserveHeaders });
        for (let i = 0; i < position.length; i++) {
          const piece = position.charAt(i);
          if (piece === "/") {
            square += 8;
          } else if (isDigit(piece)) {
            square += parseInt(piece, 10);
          } else {
            const color = piece < "a" ? WHITE : BLACK;
            this._put({ type: piece.toLowerCase(), color }, algebraic(square));
            square++;
          }
        }
        this._turn = tokens[1];
        if (tokens[2].indexOf("K") > -1) {
          this._castling.w |= BITS.KSIDE_CASTLE;
        }
        if (tokens[2].indexOf("Q") > -1) {
          this._castling.w |= BITS.QSIDE_CASTLE;
        }
        if (tokens[2].indexOf("k") > -1) {
          this._castling.b |= BITS.KSIDE_CASTLE;
        }
        if (tokens[2].indexOf("q") > -1) {
          this._castling.b |= BITS.QSIDE_CASTLE;
        }
        this._epSquare = tokens[3] === "-" ? EMPTY : Ox88[tokens[3]];
        this._halfMoves = parseInt(tokens[4], 10);
        this._moveNumber = parseInt(tokens[5], 10);
        this._hash = this._computeHash();
        this._updateSetup(fen);
        this._incPositionCount();
      }
      fen({ forceEnpassantSquare = false } = {}) {
        let empty = 0;
        let fen = "";
        for (let i = Ox88.a8; i <= Ox88.h1; i++) {
          if (this._board[i]) {
            if (empty > 0) {
              fen += empty;
              empty = 0;
            }
            const { color, type: piece } = this._board[i];
            fen += color === WHITE ? piece.toUpperCase() : piece.toLowerCase();
          } else {
            empty++;
          }
          if (i + 1 & 136) {
            if (empty > 0) {
              fen += empty;
            }
            if (i !== Ox88.h1) {
              fen += "/";
            }
            empty = 0;
            i += 8;
          }
        }
        let castling = "";
        if (this._castling[WHITE] & BITS.KSIDE_CASTLE) {
          castling += "K";
        }
        if (this._castling[WHITE] & BITS.QSIDE_CASTLE) {
          castling += "Q";
        }
        if (this._castling[BLACK] & BITS.KSIDE_CASTLE) {
          castling += "k";
        }
        if (this._castling[BLACK] & BITS.QSIDE_CASTLE) {
          castling += "q";
        }
        castling = castling || "-";
        let epSquare = "-";
        if (this._epSquare !== EMPTY) {
          if (forceEnpassantSquare) {
            epSquare = algebraic(this._epSquare);
          } else {
            const bigPawnSquare = this._epSquare + (this._turn === WHITE ? 16 : -16);
            const squares = [bigPawnSquare + 1, bigPawnSquare - 1];
            for (const square of squares) {
              if (square & 136) {
                continue;
              }
              const color = this._turn;
              if (this._board[square]?.color === color && this._board[square]?.type === PAWN) {
                this._makeMove({
                  color,
                  from: square,
                  to: this._epSquare,
                  piece: PAWN,
                  captured: PAWN,
                  flags: BITS.EP_CAPTURE
                });
                const isLegal = !this._isKingAttacked(color);
                this._undoMove();
                if (isLegal) {
                  epSquare = algebraic(this._epSquare);
                  break;
                }
              }
            }
          }
        }
        return [
          fen,
          this._turn,
          castling,
          epSquare,
          this._halfMoves,
          this._moveNumber
        ].join(" ");
      }
      _pieceKey(i) {
        if (!this._board[i]) {
          return 0n;
        }
        const { color, type } = this._board[i];
        const colorIndex = {
          w: 0,
          b: 1
        }[color];
        const typeIndex = {
          p: 0,
          n: 1,
          b: 2,
          r: 3,
          q: 4,
          k: 5
        }[type];
        return PIECE_KEYS[colorIndex][typeIndex][i];
      }
      _epKey() {
        return this._epSquare === EMPTY ? 0n : EP_KEYS[this._epSquare & 7];
      }
      _castlingKey() {
        const index = this._castling.w >> 5 | this._castling.b >> 3;
        return CASTLING_KEYS[index];
      }
      _computeHash() {
        let hash = 0n;
        for (let i = Ox88.a8; i <= Ox88.h1; i++) {
          if (i & 136) {
            i += 7;
            continue;
          }
          if (this._board[i]) {
            hash ^= this._pieceKey(i);
          }
        }
        hash ^= this._epKey();
        hash ^= this._castlingKey();
        if (this._turn === "b") {
          hash ^= SIDE_KEY;
        }
        return hash;
      }
      /*
       * Called when the initial board setup is changed with put() or remove().
       * modifies the SetUp and FEN properties of the header object. If the FEN
       * is equal to the default position, the SetUp and FEN are deleted the setup
       * is only updated if history.length is zero, ie moves haven't been made.
       */
      _updateSetup(fen) {
        if (this._history.length > 0)
          return;
        if (fen !== DEFAULT_POSITION) {
          this._header["SetUp"] = "1";
          this._header["FEN"] = fen;
        } else {
          this._header["SetUp"] = null;
          this._header["FEN"] = null;
        }
      }
      reset() {
        this.load(DEFAULT_POSITION);
      }
      get(square) {
        return this._board[Ox88[square]];
      }
      findPiece(piece) {
        const squares = [];
        for (let i = Ox88.a8; i <= Ox88.h1; i++) {
          if (i & 136) {
            i += 7;
            continue;
          }
          if (!this._board[i] || this._board[i]?.color !== piece.color) {
            continue;
          }
          if (this._board[i].color === piece.color && this._board[i].type === piece.type) {
            squares.push(algebraic(i));
          }
        }
        return squares;
      }
      put({ type, color }, square) {
        if (this._put({ type, color }, square)) {
          this._updateCastlingRights();
          this._updateEnPassantSquare();
          this._updateSetup(this.fen());
          return true;
        }
        return false;
      }
      _set(sq, piece) {
        this._hash ^= this._pieceKey(sq);
        this._board[sq] = piece;
        this._hash ^= this._pieceKey(sq);
      }
      _put({ type, color }, square) {
        if (SYMBOLS.indexOf(type.toLowerCase()) === -1) {
          return false;
        }
        if (!(square in Ox88)) {
          return false;
        }
        const sq = Ox88[square];
        if (type == KING && !(this._kings[color] == EMPTY || this._kings[color] == sq)) {
          return false;
        }
        const currentPieceOnSquare = this._board[sq];
        if (currentPieceOnSquare && currentPieceOnSquare.type === KING) {
          this._kings[currentPieceOnSquare.color] = EMPTY;
        }
        this._set(sq, { type, color });
        if (type === KING) {
          this._kings[color] = sq;
        }
        return true;
      }
      _clear(sq) {
        this._hash ^= this._pieceKey(sq);
        delete this._board[sq];
      }
      remove(square) {
        const piece = this.get(square);
        this._clear(Ox88[square]);
        if (piece && piece.type === KING) {
          this._kings[piece.color] = EMPTY;
        }
        this._updateCastlingRights();
        this._updateEnPassantSquare();
        this._updateSetup(this.fen());
        return piece;
      }
      _updateCastlingRights() {
        this._hash ^= this._castlingKey();
        const whiteKingInPlace = this._board[Ox88.e1]?.type === KING && this._board[Ox88.e1]?.color === WHITE;
        const blackKingInPlace = this._board[Ox88.e8]?.type === KING && this._board[Ox88.e8]?.color === BLACK;
        if (!whiteKingInPlace || this._board[Ox88.a1]?.type !== ROOK || this._board[Ox88.a1]?.color !== WHITE) {
          this._castling.w &= -65;
        }
        if (!whiteKingInPlace || this._board[Ox88.h1]?.type !== ROOK || this._board[Ox88.h1]?.color !== WHITE) {
          this._castling.w &= -33;
        }
        if (!blackKingInPlace || this._board[Ox88.a8]?.type !== ROOK || this._board[Ox88.a8]?.color !== BLACK) {
          this._castling.b &= -65;
        }
        if (!blackKingInPlace || this._board[Ox88.h8]?.type !== ROOK || this._board[Ox88.h8]?.color !== BLACK) {
          this._castling.b &= -33;
        }
        this._hash ^= this._castlingKey();
      }
      _updateEnPassantSquare() {
        if (this._epSquare === EMPTY) {
          return;
        }
        const startSquare = this._epSquare + (this._turn === WHITE ? -16 : 16);
        const currentSquare = this._epSquare + (this._turn === WHITE ? 16 : -16);
        const attackers = [currentSquare + 1, currentSquare - 1];
        if (this._board[startSquare] !== null || this._board[this._epSquare] !== null || this._board[currentSquare]?.color !== swapColor(this._turn) || this._board[currentSquare]?.type !== PAWN) {
          this._hash ^= this._epKey();
          this._epSquare = EMPTY;
          return;
        }
        const canCapture = (square) => !(square & 136) && this._board[square]?.color === this._turn && this._board[square]?.type === PAWN;
        if (!attackers.some(canCapture)) {
          this._hash ^= this._epKey();
          this._epSquare = EMPTY;
        }
      }
      _attacked(color, square, verbose) {
        const attackers = [];
        for (let i = Ox88.a8; i <= Ox88.h1; i++) {
          if (i & 136) {
            i += 7;
            continue;
          }
          if (this._board[i] === void 0 || this._board[i].color !== color) {
            continue;
          }
          const piece = this._board[i];
          const difference = i - square;
          if (difference === 0) {
            continue;
          }
          const index = difference + 119;
          if (ATTACKS[index] & PIECE_MASKS[piece.type]) {
            if (piece.type === PAWN) {
              if (difference > 0 && piece.color === WHITE || difference <= 0 && piece.color === BLACK) {
                if (!verbose) {
                  return true;
                } else {
                  attackers.push(algebraic(i));
                }
              }
              continue;
            }
            if (piece.type === "n" || piece.type === "k") {
              if (!verbose) {
                return true;
              } else {
                attackers.push(algebraic(i));
                continue;
              }
            }
            const offset = RAYS[index];
            let j = i + offset;
            let blocked = false;
            while (j !== square) {
              if (this._board[j] != null) {
                blocked = true;
                break;
              }
              j += offset;
            }
            if (!blocked) {
              if (!verbose) {
                return true;
              } else {
                attackers.push(algebraic(i));
                continue;
              }
            }
          }
        }
        if (verbose) {
          return attackers;
        } else {
          return false;
        }
      }
      attackers(square, attackedBy) {
        if (!attackedBy) {
          return this._attacked(this._turn, Ox88[square], true);
        } else {
          return this._attacked(attackedBy, Ox88[square], true);
        }
      }
      _isKingAttacked(color) {
        const square = this._kings[color];
        return square === -1 ? false : this._attacked(swapColor(color), square);
      }
      hash() {
        return this._hash.toString(16);
      }
      isAttacked(square, attackedBy) {
        return this._attacked(attackedBy, Ox88[square]);
      }
      isCheck() {
        return this._isKingAttacked(this._turn);
      }
      inCheck() {
        return this.isCheck();
      }
      isCheckmate() {
        return this.isCheck() && this._moves().length === 0;
      }
      isStalemate() {
        return !this.isCheck() && this._moves().length === 0;
      }
      isInsufficientMaterial() {
        const pieces = {
          b: 0,
          n: 0,
          r: 0,
          q: 0,
          k: 0,
          p: 0
        };
        const bishops = [];
        let numPieces = 0;
        let squareColor = 0;
        for (let i = Ox88.a8; i <= Ox88.h1; i++) {
          squareColor = (squareColor + 1) % 2;
          if (i & 136) {
            i += 7;
            continue;
          }
          const piece = this._board[i];
          if (piece) {
            pieces[piece.type] = piece.type in pieces ? pieces[piece.type] + 1 : 1;
            if (piece.type === BISHOP) {
              bishops.push(squareColor);
            }
            numPieces++;
          }
        }
        if (numPieces === 2) {
          return true;
        } else if (
          // k vs. kn .... or .... k vs. kb
          numPieces === 3 && (pieces[BISHOP] === 1 || pieces[KNIGHT] === 1)
        ) {
          return true;
        } else if (numPieces === pieces[BISHOP] + 2) {
          let sum = 0;
          const len = bishops.length;
          for (let i = 0; i < len; i++) {
            sum += bishops[i];
          }
          if (sum === 0 || sum === len) {
            return true;
          }
        }
        return false;
      }
      isThreefoldRepetition() {
        return this._getPositionCount(this._hash) >= 3;
      }
      isDrawByFiftyMoves() {
        return this._halfMoves >= 100;
      }
      isDraw() {
        return this.isDrawByFiftyMoves() || this.isStalemate() || this.isInsufficientMaterial() || this.isThreefoldRepetition();
      }
      isGameOver() {
        return this.isCheckmate() || this.isDraw();
      }
      moves({ verbose = false, square = void 0, piece = void 0 } = {}) {
        const moves = this._moves({ square, piece });
        if (verbose) {
          return moves.map((move) => new Move(this, move));
        } else {
          return moves.map((move) => this._moveToSan(move, moves));
        }
      }
      _moves({ legal = true, piece = void 0, square = void 0 } = {}) {
        const forSquare = square ? square.toLowerCase() : void 0;
        const forPiece = piece?.toLowerCase();
        const moves = [];
        const us = this._turn;
        const them = swapColor(us);
        let firstSquare = Ox88.a8;
        let lastSquare = Ox88.h1;
        let singleSquare = false;
        if (forSquare) {
          if (!(forSquare in Ox88)) {
            return [];
          } else {
            firstSquare = lastSquare = Ox88[forSquare];
            singleSquare = true;
          }
        }
        for (let from = firstSquare; from <= lastSquare; from++) {
          if (from & 136) {
            from += 7;
            continue;
          }
          if (!this._board[from] || this._board[from].color === them) {
            continue;
          }
          const { type } = this._board[from];
          let to;
          if (type === PAWN) {
            if (forPiece && forPiece !== type)
              continue;
            to = from + PAWN_OFFSETS[us][0];
            if (!this._board[to]) {
              addMove(moves, us, from, to, PAWN);
              to = from + PAWN_OFFSETS[us][1];
              if (SECOND_RANK[us] === rank(from) && !this._board[to]) {
                addMove(moves, us, from, to, PAWN, void 0, BITS.BIG_PAWN);
              }
            }
            for (let j = 2; j < 4; j++) {
              to = from + PAWN_OFFSETS[us][j];
              if (to & 136)
                continue;
              if (this._board[to]?.color === them) {
                addMove(moves, us, from, to, PAWN, this._board[to].type, BITS.CAPTURE);
              } else if (to === this._epSquare) {
                addMove(moves, us, from, to, PAWN, PAWN, BITS.EP_CAPTURE);
              }
            }
          } else {
            if (forPiece && forPiece !== type)
              continue;
            for (let j = 0, len = PIECE_OFFSETS[type].length; j < len; j++) {
              const offset = PIECE_OFFSETS[type][j];
              to = from;
              while (true) {
                to += offset;
                if (to & 136)
                  break;
                if (!this._board[to]) {
                  addMove(moves, us, from, to, type);
                } else {
                  if (this._board[to].color === us)
                    break;
                  addMove(moves, us, from, to, type, this._board[to].type, BITS.CAPTURE);
                  break;
                }
                if (type === KNIGHT || type === KING)
                  break;
              }
            }
          }
        }
        if (forPiece === void 0 || forPiece === KING) {
          if (!singleSquare || lastSquare === this._kings[us]) {
            if (this._castling[us] & BITS.KSIDE_CASTLE) {
              const castlingFrom = this._kings[us];
              const castlingTo = castlingFrom + 2;
              if (!this._board[castlingFrom + 1] && !this._board[castlingTo] && !this._attacked(them, this._kings[us]) && !this._attacked(them, castlingFrom + 1) && !this._attacked(them, castlingTo)) {
                addMove(moves, us, this._kings[us], castlingTo, KING, void 0, BITS.KSIDE_CASTLE);
              }
            }
            if (this._castling[us] & BITS.QSIDE_CASTLE) {
              const castlingFrom = this._kings[us];
              const castlingTo = castlingFrom - 2;
              if (!this._board[castlingFrom - 1] && !this._board[castlingFrom - 2] && !this._board[castlingFrom - 3] && !this._attacked(them, this._kings[us]) && !this._attacked(them, castlingFrom - 1) && !this._attacked(them, castlingTo)) {
                addMove(moves, us, this._kings[us], castlingTo, KING, void 0, BITS.QSIDE_CASTLE);
              }
            }
          }
        }
        if (!legal || this._kings[us] === -1) {
          return moves;
        }
        const legalMoves = [];
        for (let i = 0, len = moves.length; i < len; i++) {
          this._makeMove(moves[i]);
          if (!this._isKingAttacked(us)) {
            legalMoves.push(moves[i]);
          }
          this._undoMove();
        }
        return legalMoves;
      }
      move(move, { strict = false } = {}) {
        let moveObj = null;
        if (typeof move === "string") {
          moveObj = this._moveFromSan(move, strict);
        } else if (move === null) {
          moveObj = this._moveFromSan(SAN_NULLMOVE, strict);
        } else if (typeof move === "object") {
          const moves = this._moves();
          for (let i = 0, len = moves.length; i < len; i++) {
            if (move.from === algebraic(moves[i].from) && move.to === algebraic(moves[i].to) && (!("promotion" in moves[i]) || move.promotion === moves[i].promotion)) {
              moveObj = moves[i];
              break;
            }
          }
        }
        if (!moveObj) {
          if (typeof move === "string") {
            throw new Error(`Invalid move: ${move}`);
          } else {
            throw new Error(`Invalid move: ${JSON.stringify(move)}`);
          }
        }
        if (this.isCheck() && moveObj.flags & BITS.NULL_MOVE) {
          throw new Error("Null move not allowed when in check");
        }
        const prettyMove = new Move(this, moveObj);
        this._makeMove(moveObj);
        this._incPositionCount();
        return prettyMove;
      }
      _push(move) {
        this._history.push({
          move,
          kings: { b: this._kings.b, w: this._kings.w },
          turn: this._turn,
          castling: { b: this._castling.b, w: this._castling.w },
          epSquare: this._epSquare,
          halfMoves: this._halfMoves,
          moveNumber: this._moveNumber
        });
      }
      _movePiece(from, to) {
        this._hash ^= this._pieceKey(from);
        this._board[to] = this._board[from];
        delete this._board[from];
        this._hash ^= this._pieceKey(to);
      }
      _makeMove(move) {
        const us = this._turn;
        const them = swapColor(us);
        this._push(move);
        if (move.flags & BITS.NULL_MOVE) {
          if (us === BLACK) {
            this._moveNumber++;
          }
          this._halfMoves++;
          this._turn = them;
          this._epSquare = EMPTY;
          return;
        }
        this._hash ^= this._epKey();
        this._hash ^= this._castlingKey();
        if (move.captured) {
          this._hash ^= this._pieceKey(move.to);
        }
        this._movePiece(move.from, move.to);
        if (move.flags & BITS.EP_CAPTURE) {
          if (this._turn === BLACK) {
            this._clear(move.to - 16);
          } else {
            this._clear(move.to + 16);
          }
        }
        if (move.promotion) {
          this._clear(move.to);
          this._set(move.to, { type: move.promotion, color: us });
        }
        if (this._board[move.to].type === KING) {
          this._kings[us] = move.to;
          if (move.flags & BITS.KSIDE_CASTLE) {
            const castlingTo = move.to - 1;
            const castlingFrom = move.to + 1;
            this._movePiece(castlingFrom, castlingTo);
          } else if (move.flags & BITS.QSIDE_CASTLE) {
            const castlingTo = move.to + 1;
            const castlingFrom = move.to - 2;
            this._movePiece(castlingFrom, castlingTo);
          }
          this._castling[us] = 0;
        }
        if (this._castling[us]) {
          for (let i = 0, len = ROOKS[us].length; i < len; i++) {
            if (move.from === ROOKS[us][i].square && this._castling[us] & ROOKS[us][i].flag) {
              this._castling[us] ^= ROOKS[us][i].flag;
              break;
            }
          }
        }
        if (this._castling[them]) {
          for (let i = 0, len = ROOKS[them].length; i < len; i++) {
            if (move.to === ROOKS[them][i].square && this._castling[them] & ROOKS[them][i].flag) {
              this._castling[them] ^= ROOKS[them][i].flag;
              break;
            }
          }
        }
        this._hash ^= this._castlingKey();
        if (move.flags & BITS.BIG_PAWN) {
          let epSquare;
          if (us === BLACK) {
            epSquare = move.to - 16;
          } else {
            epSquare = move.to + 16;
          }
          if (!(move.to - 1 & 136) && this._board[move.to - 1]?.type === PAWN && this._board[move.to - 1]?.color === them || !(move.to + 1 & 136) && this._board[move.to + 1]?.type === PAWN && this._board[move.to + 1]?.color === them) {
            this._epSquare = epSquare;
            this._hash ^= this._epKey();
          } else {
            this._epSquare = EMPTY;
          }
        } else {
          this._epSquare = EMPTY;
        }
        if (move.piece === PAWN) {
          this._halfMoves = 0;
        } else if (move.flags & (BITS.CAPTURE | BITS.EP_CAPTURE)) {
          this._halfMoves = 0;
        } else {
          this._halfMoves++;
        }
        if (us === BLACK) {
          this._moveNumber++;
        }
        this._turn = them;
        this._hash ^= SIDE_KEY;
      }
      undo() {
        const hash = this._hash;
        const move = this._undoMove();
        if (move) {
          const prettyMove = new Move(this, move);
          this._decPositionCount(hash);
          return prettyMove;
        }
        return null;
      }
      _undoMove() {
        const old = this._history.pop();
        if (old === void 0) {
          return null;
        }
        this._hash ^= this._epKey();
        this._hash ^= this._castlingKey();
        const move = old.move;
        this._kings = old.kings;
        this._turn = old.turn;
        this._castling = old.castling;
        this._epSquare = old.epSquare;
        this._halfMoves = old.halfMoves;
        this._moveNumber = old.moveNumber;
        this._hash ^= this._epKey();
        this._hash ^= this._castlingKey();
        this._hash ^= SIDE_KEY;
        const us = this._turn;
        const them = swapColor(us);
        if (move.flags & BITS.NULL_MOVE) {
          return move;
        }
        this._movePiece(move.to, move.from);
        if (move.piece) {
          this._clear(move.from);
          this._set(move.from, { type: move.piece, color: us });
        }
        if (move.captured) {
          if (move.flags & BITS.EP_CAPTURE) {
            let index;
            if (us === BLACK) {
              index = move.to - 16;
            } else {
              index = move.to + 16;
            }
            this._set(index, { type: PAWN, color: them });
          } else {
            this._set(move.to, { type: move.captured, color: them });
          }
        }
        if (move.flags & (BITS.KSIDE_CASTLE | BITS.QSIDE_CASTLE)) {
          let castlingTo, castlingFrom;
          if (move.flags & BITS.KSIDE_CASTLE) {
            castlingTo = move.to + 1;
            castlingFrom = move.to - 1;
          } else {
            castlingTo = move.to - 2;
            castlingFrom = move.to + 1;
          }
          this._movePiece(castlingFrom, castlingTo);
        }
        return move;
      }
      pgn({ newline = "\n", maxWidth = 0 } = {}) {
        const result = [];
        let headerExists = false;
        for (const i in this._header) {
          const headerTag = this._header[i];
          if (headerTag)
            result.push(`[${i} "${this._header[i]}"]` + newline);
          headerExists = true;
        }
        if (headerExists && this._history.length) {
          result.push(newline);
        }
        const appendComment = (moveString2) => {
          const comment = this._comments[this.fen()];
          if (typeof comment !== "undefined") {
            const delimiter = moveString2.length > 0 ? " " : "";
            moveString2 = `${moveString2}${delimiter}{${comment}}`;
          }
          return moveString2;
        };
        const reversedHistory = [];
        while (this._history.length > 0) {
          reversedHistory.push(this._undoMove());
        }
        const moves = [];
        let moveString = "";
        if (reversedHistory.length === 0) {
          moves.push(appendComment(""));
        }
        while (reversedHistory.length > 0) {
          moveString = appendComment(moveString);
          const move = reversedHistory.pop();
          if (!move) {
            break;
          }
          if (!this._history.length && move.color === "b") {
            const prefix = `${this._moveNumber}. ...`;
            moveString = moveString ? `${moveString} ${prefix}` : prefix;
          } else if (move.color === "w") {
            if (moveString.length) {
              moves.push(moveString);
            }
            moveString = this._moveNumber + ".";
          }
          moveString = moveString + " " + this._moveToSan(move, this._moves({ legal: true }));
          this._makeMove(move);
        }
        if (moveString.length) {
          moves.push(appendComment(moveString));
        }
        moves.push(this._header.Result || "*");
        if (maxWidth === 0) {
          return result.join("") + moves.join(" ");
        }
        const strip = function() {
          if (result.length > 0 && result[result.length - 1] === " ") {
            result.pop();
            return true;
          }
          return false;
        };
        const wrapComment = function(width, move) {
          for (const token of move.split(" ")) {
            if (!token) {
              continue;
            }
            if (width + token.length > maxWidth) {
              while (strip()) {
                width--;
              }
              result.push(newline);
              width = 0;
            }
            result.push(token);
            width += token.length;
            result.push(" ");
            width++;
          }
          if (strip()) {
            width--;
          }
          return width;
        };
        let currentWidth = 0;
        for (let i = 0; i < moves.length; i++) {
          if (currentWidth + moves[i].length > maxWidth) {
            if (moves[i].includes("{")) {
              currentWidth = wrapComment(currentWidth, moves[i]);
              continue;
            }
          }
          if (currentWidth + moves[i].length > maxWidth && i !== 0) {
            if (result[result.length - 1] === " ") {
              result.pop();
            }
            result.push(newline);
            currentWidth = 0;
          } else if (i !== 0) {
            result.push(" ");
            currentWidth++;
          }
          result.push(moves[i]);
          currentWidth += moves[i].length;
        }
        return result.join("");
      }
      /**
       * @deprecated Use `setHeader` and `getHeaders` instead. This method will return null header tags (which is not what you want)
       */
      header(...args) {
        for (let i = 0; i < args.length; i += 2) {
          if (typeof args[i] === "string" && typeof args[i + 1] === "string") {
            this._header[args[i]] = args[i + 1];
          }
        }
        return this._header;
      }
      // TODO: value validation per spec
      setHeader(key, value) {
        this._header[key] = value ?? SEVEN_TAG_ROSTER[key] ?? null;
        return this.getHeaders();
      }
      removeHeader(key) {
        if (key in this._header) {
          this._header[key] = SEVEN_TAG_ROSTER[key] || null;
          return true;
        }
        return false;
      }
      // return only non-null headers (omit placemarker nulls)
      getHeaders() {
        const nonNullHeaders = {};
        for (const [key, value] of Object.entries(this._header)) {
          if (value !== null) {
            nonNullHeaders[key] = value;
          }
        }
        return nonNullHeaders;
      }
      loadPgn(pgn3, { strict = false, newlineChar = "\r?\n" } = {}) {
        if (newlineChar !== "\r?\n") {
          pgn3 = pgn3.replace(new RegExp(newlineChar, "g"), "\n");
        }
        const parsedPgn = peg$parse(pgn3);
        this.reset();
        const headers = parsedPgn.headers;
        let fen = "";
        for (const key in headers) {
          if (key.toLowerCase() === "fen") {
            fen = headers[key];
          }
          this.header(key, headers[key]);
        }
        if (!strict) {
          if (fen) {
            this.load(fen, { preserveHeaders: true });
          }
        } else {
          if (headers["SetUp"] === "1") {
            if (!("FEN" in headers)) {
              throw new Error("Invalid PGN: FEN tag must be supplied with SetUp tag");
            }
            this.load(headers["FEN"], { preserveHeaders: true });
          }
        }
        let node2 = parsedPgn.root;
        while (node2) {
          if (node2.move) {
            const move = this._moveFromSan(node2.move, strict);
            if (move == null) {
              throw new Error(`Invalid move in PGN: ${node2.move}`);
            } else {
              this._makeMove(move);
              this._incPositionCount();
            }
          }
          if (node2.comment !== void 0) {
            this._comments[this.fen()] = node2.comment;
          }
          node2 = node2.variations[0];
        }
        const result = parsedPgn.result;
        if (result && Object.keys(this._header).length && this._header["Result"] !== result) {
          this.setHeader("Result", result);
        }
      }
      /*
       * Convert a move from 0x88 coordinates to Standard Algebraic Notation
       * (SAN)
       *
       * @param {boolean} strict Use the strict SAN parser. It will throw errors
       * on overly disambiguated moves (see below):
       *
       * r1bqkbnr/ppp2ppp/2n5/1B1pP3/4P3/8/PPPP2PP/RNBQK1NR b KQkq - 2 4
       * 4. ... Nge7 is overly disambiguated because the knight on c6 is pinned
       * 4. ... Ne7 is technically the valid SAN
       */
      _moveToSan(move, moves) {
        let output = "";
        if (move.flags & BITS.KSIDE_CASTLE) {
          output = "O-O";
        } else if (move.flags & BITS.QSIDE_CASTLE) {
          output = "O-O-O";
        } else if (move.flags & BITS.NULL_MOVE) {
          return SAN_NULLMOVE;
        } else {
          if (move.piece !== PAWN) {
            const disambiguator = getDisambiguator(move, moves);
            output += move.piece.toUpperCase() + disambiguator;
          }
          if (move.flags & (BITS.CAPTURE | BITS.EP_CAPTURE)) {
            if (move.piece === PAWN) {
              output += algebraic(move.from)[0];
            }
            output += "x";
          }
          output += algebraic(move.to);
          if (move.promotion) {
            output += "=" + move.promotion.toUpperCase();
          }
        }
        this._makeMove(move);
        if (this.isCheck()) {
          if (this.isCheckmate()) {
            output += "#";
          } else {
            output += "+";
          }
        }
        this._undoMove();
        return output;
      }
      // convert a move from Standard Algebraic Notation (SAN) to 0x88 coordinates
      _moveFromSan(move, strict = false) {
        let cleanMove = strippedSan(move);
        if (!strict) {
          if (cleanMove === "0-0") {
            cleanMove = "O-O";
          } else if (cleanMove === "0-0-0") {
            cleanMove = "O-O-O";
          }
        }
        if (cleanMove == SAN_NULLMOVE) {
          const res = {
            color: this._turn,
            from: 0,
            to: 0,
            piece: "k",
            flags: BITS.NULL_MOVE
          };
          return res;
        }
        let pieceType2 = inferPieceType(cleanMove);
        let moves = this._moves({ legal: true, piece: pieceType2 });
        for (let i = 0, len = moves.length; i < len; i++) {
          if (cleanMove === strippedSan(this._moveToSan(moves[i], moves))) {
            return moves[i];
          }
        }
        if (strict) {
          return null;
        }
        let piece = void 0;
        let matches = void 0;
        let from = void 0;
        let to = void 0;
        let promotion = void 0;
        let overlyDisambiguated = false;
        matches = cleanMove.match(/([pnbrqkPNBRQK])?([a-h][1-8])x?-?([a-h][1-8])([qrbnQRBN])?/);
        if (matches) {
          piece = matches[1];
          from = matches[2];
          to = matches[3];
          promotion = matches[4];
          if (from.length == 1) {
            overlyDisambiguated = true;
          }
        } else {
          matches = cleanMove.match(/([pnbrqkPNBRQK])?([a-h]?[1-8]?)x?-?([a-h][1-8])([qrbnQRBN])?/);
          if (matches) {
            piece = matches[1];
            from = matches[2];
            to = matches[3];
            promotion = matches[4];
            if (from.length == 1) {
              overlyDisambiguated = true;
            }
          }
        }
        pieceType2 = inferPieceType(cleanMove);
        moves = this._moves({
          legal: true,
          piece: piece ? piece : pieceType2
        });
        if (!to) {
          return null;
        }
        for (let i = 0, len = moves.length; i < len; i++) {
          if (!from) {
            if (cleanMove === strippedSan(this._moveToSan(moves[i], moves)).replace("x", "")) {
              return moves[i];
            }
          } else if ((!piece || piece.toLowerCase() == moves[i].piece) && Ox88[from] == moves[i].from && Ox88[to] == moves[i].to && (!promotion || promotion.toLowerCase() == moves[i].promotion)) {
            return moves[i];
          } else if (overlyDisambiguated) {
            const square = algebraic(moves[i].from);
            if ((!piece || piece.toLowerCase() == moves[i].piece) && Ox88[to] == moves[i].to && (from == square[0] || from == square[1]) && (!promotion || promotion.toLowerCase() == moves[i].promotion)) {
              return moves[i];
            }
          }
        }
        return null;
      }
      ascii() {
        let s = "   +------------------------+\n";
        for (let i = Ox88.a8; i <= Ox88.h1; i++) {
          if (file(i) === 0) {
            s += " " + "87654321"[rank(i)] + " |";
          }
          if (this._board[i]) {
            const piece = this._board[i].type;
            const color = this._board[i].color;
            const symbol = color === WHITE ? piece.toUpperCase() : piece.toLowerCase();
            s += " " + symbol + " ";
          } else {
            s += " . ";
          }
          if (i + 1 & 136) {
            s += "|\n";
            i += 8;
          }
        }
        s += "   +------------------------+\n";
        s += "     a  b  c  d  e  f  g  h";
        return s;
      }
      perft(depth) {
        const moves = this._moves({ legal: false });
        let nodes = 0;
        const color = this._turn;
        for (let i = 0, len = moves.length; i < len; i++) {
          this._makeMove(moves[i]);
          if (!this._isKingAttacked(color)) {
            if (depth - 1 > 0) {
              nodes += this.perft(depth - 1);
            } else {
              nodes++;
            }
          }
          this._undoMove();
        }
        return nodes;
      }
      setTurn(color) {
        if (this._turn == color) {
          return false;
        }
        this.move("--");
        return true;
      }
      turn() {
        return this._turn;
      }
      board() {
        const output = [];
        let row = [];
        for (let i = Ox88.a8; i <= Ox88.h1; i++) {
          if (this._board[i] == null) {
            row.push(null);
          } else {
            row.push({
              square: algebraic(i),
              type: this._board[i].type,
              color: this._board[i].color
            });
          }
          if (i + 1 & 136) {
            output.push(row);
            row = [];
            i += 8;
          }
        }
        return output;
      }
      squareColor(square) {
        if (square in Ox88) {
          const sq = Ox88[square];
          return (rank(sq) + file(sq)) % 2 === 0 ? "light" : "dark";
        }
        return null;
      }
      history({ verbose = false } = {}) {
        const reversedHistory = [];
        const moveHistory = [];
        while (this._history.length > 0) {
          reversedHistory.push(this._undoMove());
        }
        while (true) {
          const move = reversedHistory.pop();
          if (!move) {
            break;
          }
          if (verbose) {
            moveHistory.push(new Move(this, move));
          } else {
            moveHistory.push(this._moveToSan(move, this._moves()));
          }
          this._makeMove(move);
        }
        return moveHistory;
      }
      /*
       * Keeps track of position occurrence counts for the purpose of repetition
       * checking. Old positions are removed from the map if their counts are reduced to 0.
       */
      _getPositionCount(hash) {
        return this._positionCount.get(hash) ?? 0;
      }
      _incPositionCount() {
        this._positionCount.set(this._hash, (this._positionCount.get(this._hash) ?? 0) + 1);
      }
      _decPositionCount(hash) {
        const currentCount = this._positionCount.get(hash) ?? 0;
        if (currentCount === 1) {
          this._positionCount.delete(hash);
        } else {
          this._positionCount.set(hash, currentCount - 1);
        }
      }
      _pruneComments() {
        const reversedHistory = [];
        const currentComments = {};
        const copyComment = (fen) => {
          if (fen in this._comments) {
            currentComments[fen] = this._comments[fen];
          }
        };
        while (this._history.length > 0) {
          reversedHistory.push(this._undoMove());
        }
        copyComment(this.fen());
        while (true) {
          const move = reversedHistory.pop();
          if (!move) {
            break;
          }
          this._makeMove(move);
          copyComment(this.fen());
        }
        this._comments = currentComments;
      }
      getComment() {
        return this._comments[this.fen()];
      }
      setComment(comment) {
        this._comments[this.fen()] = comment.replace("{", "[").replace("}", "]");
      }
      /**
       * @deprecated Renamed to `removeComment` for consistency
       */
      deleteComment() {
        return this.removeComment();
      }
      removeComment() {
        const comment = this._comments[this.fen()];
        delete this._comments[this.fen()];
        return comment;
      }
      getComments() {
        this._pruneComments();
        return Object.keys(this._comments).map((fen) => {
          return { fen, comment: this._comments[fen] };
        });
      }
      /**
       * @deprecated Renamed to `removeComments` for consistency
       */
      deleteComments() {
        return this.removeComments();
      }
      removeComments() {
        this._pruneComments();
        return Object.keys(this._comments).map((fen) => {
          const comment = this._comments[fen];
          delete this._comments[fen];
          return { fen, comment };
        });
      }
      setCastlingRights(color, rights) {
        for (const side of [KING, QUEEN]) {
          if (rights[side] !== void 0) {
            if (rights[side]) {
              this._castling[color] |= SIDES[side];
            } else {
              this._castling[color] &= ~SIDES[side];
            }
          }
        }
        this._updateCastlingRights();
        const result = this.getCastlingRights(color);
        return (rights[KING] === void 0 || rights[KING] === result[KING]) && (rights[QUEEN] === void 0 || rights[QUEEN] === result[QUEEN]);
      }
      getCastlingRights(color) {
        return {
          [KING]: (this._castling[color] & SIDES[KING]) !== 0,
          [QUEEN]: (this._castling[color] & SIDES[QUEEN]) !== 0
        };
      }
      moveNumber() {
        return this._moveNumber;
      }
    };
    exports.BISHOP = BISHOP;
    exports.BLACK = BLACK;
    exports.Chess = Chess6;
    exports.DEFAULT_POSITION = DEFAULT_POSITION;
    exports.KING = KING;
    exports.KNIGHT = KNIGHT;
    exports.Move = Move;
    exports.PAWN = PAWN;
    exports.QUEEN = QUEEN;
    exports.ROOK = ROOK;
    exports.SEVEN_TAG_ROSTER = SEVEN_TAG_ROSTER;
    exports.SQUARES = SQUARES;
    exports.WHITE = WHITE;
    exports.validateFen = validateFen;
    exports.xoroshiro128 = xoroshiro128;
  }
});

// scripts/bugcheck.ts
var import_chess5 = __toESM(require_chess(), 1);
import { readFileSync } from "node:fs";

// src/core/analysis.ts
var import_chess2 = __toESM(require_chess(), 1);

// src/core/engine.ts
var MATE_CAP = 1e5;

// src/core/config.ts
var DEFAULT_CONFIG = {
  depth: 14,
  perPositionTimeoutMs: 3e4,
  classification: {
    excellent: 25,
    good: 60,
    inaccuracy: 120,
    mistake: 250,
    blunder: Infinity
  },
  critical: {
    cpl: 120,
    swing: 150
  },
  diagnosis: {
    minInstances: 3,
    minGames: 2,
    gamesTarget: 20
  },
  severity: {
    frequencyWeight: 0.3,
    lossWeight: 0.4,
    gamesWeight: 0.3,
    critical: 0.68,
    significant: 0.5,
    moderate: 0.33,
    mild: 0.18
  },
  puzzleMinLoss: 200
};
var CLASSIFICATION_RULES_TEXT = [
  "Best \u2014 identical to the engine choice",
  `Excellent \u2014 loses \u2264 ${DEFAULT_CONFIG.classification.excellent}cp`,
  `Good \u2014 loses \u2264 ${DEFAULT_CONFIG.classification.good}cp`,
  `Inaccuracy \u2014 loses \u2264 ${DEFAULT_CONFIG.classification.inaccuracy}cp`,
  `Mistake \u2014 loses \u2264 ${DEFAULT_CONFIG.classification.mistake}cp`,
  "Blunder \u2014 loses more than a mistake"
];

// src/core/accuracy.ts
var MAX_CP = 1500;
function winPercent(cpWhite) {
  const cp = Math.max(-MAX_CP, Math.min(MAX_CP, cpWhite));
  return 50 + 50 * (2 / (1 + Math.exp(-368208e-8 * cp)) - 1);
}
function moveAccuracy(cpBeforeMover, cpAfterMover) {
  const winBefore = winPercent(cpBeforeMover);
  const winAfter = winPercent(cpAfterMover);
  const drop = Math.max(0, winBefore - winAfter);
  const acc = 103.1668 * Math.exp(-0.04354 * drop) - 3.1669;
  return Math.max(0, Math.min(100, acc));
}

// src/core/patterns.ts
var import_chess = __toESM(require_chess(), 1);

// src/core/boardFacts.ts
var PIECE_VALUE = {
  p: 1,
  n: 3,
  b: 3.25,
  r: 5,
  q: 9,
  k: 0
};
function isWhitePiece(pc) {
  return pc === pc.toUpperCase();
}
function pieceType(pc) {
  return pc.toLowerCase();
}
function parseFen(fen) {
  const boardPart = fen.split(" ")[0];
  const rows = boardPart.split("/");
  const grid = [];
  for (let r = 0; r < 8; r++) {
    const row = [];
    const rowStr = rows[r] ?? "8";
    let file = 0;
    for (const ch of rowStr) {
      if (/[1-8]/.test(ch)) {
        for (let i = 0; i < Number(ch); i++) row.push(null);
        file += Number(ch);
      } else if ("pnbrqkPNBRQK".includes(ch)) {
        row.push(ch);
        file++;
      }
    }
    while (row.length < 8) row.push(null);
    grid.push(row);
  }
  return { grid };
}
function sqToIndices(sq) {
  const file = sq.charCodeAt(0) - 97;
  const rank = Number(sq[1]);
  return [8 - rank, file];
}
function indicesToSq(row, file) {
  return String.fromCharCode(97 + file) + String(8 - row);
}
function pieceAt(b, sq) {
  const [r, f] = sqToIndices(sq);
  if (r < 0 || r > 7 || f < 0 || f > 7) return null;
  return b.grid[r][f];
}
function inBoard(r, f) {
  return r >= 0 && r <= 7 && f >= 0 && f <= 7;
}
var KNIGHT_OFFSETS = [
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2]
];
var KING_OFFSETS = [
  [0, 1],
  [1, 1],
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, -1],
  [-1, 0],
  [-1, 1]
];
var ORTHO_DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]];
var DIAG_DIRS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
function attackersOf(b, sq, byWhite) {
  const [r, f] = sqToIndices(sq);
  const out = [];
  const push = (rr, ff) => {
    if (inBoard(rr, ff) && b.grid[rr][ff]) out.push(indicesToSq(rr, ff));
  };
  const pawnRow = byWhite ? r + 1 : r - 1;
  for (const df of [-1, 1]) {
    if (inBoard(pawnRow, f + df)) {
      const pc = b.grid[pawnRow][f + df];
      if (pc && isWhitePiece(pc) === byWhite && pieceType(pc) === "p") out.push(indicesToSq(pawnRow, f + df));
    }
  }
  for (const [dr, df] of KNIGHT_OFFSETS) {
    const rr = r + dr, ff = f + df;
    if (inBoard(rr, ff)) {
      const pc = b.grid[rr][ff];
      if (pc && isWhitePiece(pc) === byWhite && pieceType(pc) === "n") out.push(indicesToSq(rr, ff));
    }
  }
  for (const [dr, df] of KING_OFFSETS) {
    const rr = r + dr, ff = f + df;
    if (inBoard(rr, ff)) {
      const pc = b.grid[rr][ff];
      if (pc && isWhitePiece(pc) === byWhite && pieceType(pc) === "k") out.push(indicesToSq(rr, ff));
    }
  }
  for (const dirs of [ORTHO_DIRS, DIAG_DIRS]) {
    for (const [dr, df] of dirs) {
      let rr = r + dr, ff = f + df;
      while (inBoard(rr, ff)) {
        const pc = b.grid[rr][ff];
        if (pc) {
          const t = pieceType(pc);
          if (isWhitePiece(pc) === byWhite && (t === "q" || (dirs === ORTHO_DIRS ? t === "r" : t === "b"))) {
            out.push(indicesToSq(rr, ff));
          }
          break;
        }
        rr += dr;
        ff += df;
      }
    }
  }
  return out;
}
function isAttacked(b, sq, byWhite) {
  return attackersOf(b, sq, byWhite).length > 0;
}
function hangingPieces(b, colorWhite, minGain = 1.5) {
  const out = [];
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const pc = b.grid[r][f];
      if (!pc || isWhitePiece(pc) !== colorWhite || pieceType(pc) === "k") continue;
      const sq = indicesToSq(r, f);
      const attackers = attackersOf(b, sq, !colorWhite);
      if (attackers.length === 0) continue;
      const defenders = attackersOf(b, sq, colorWhite);
      const value = PIECE_VALUE[pieceType(pc)];
      let gain;
      let defended;
      if (defenders.length === 0) {
        gain = value;
        defended = false;
      } else {
        const minAttacker = Math.min(...attackers.map((a) => PIECE_VALUE[pieceType(pieceAt(b, a))] || 0));
        gain = value - minAttacker;
        defended = true;
      }
      if (gain >= minGain) out.push({ sq, piece: pc, gain, defended });
    }
  }
  return out;
}
function materialFor(b, colorWhite) {
  const m = { pawns: 0, minors: 0, rooks: 0, queens: 0, nonPawnPoints: 0, totalPoints: 0 };
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const pc = b.grid[r][f];
      if (!pc || isWhitePiece(pc) !== colorWhite) continue;
      const t = pieceType(pc);
      if (t === "k") continue;
      const v = PIECE_VALUE[t];
      m.totalPoints += v;
      if (t === "p") m.pawns++;
      else {
        m.nonPawnPoints += v;
        if (t === "n" || t === "b") m.minors++;
        else if (t === "r") m.rooks++;
        else if (t === "q") m.queens++;
      }
    }
  }
  return m;
}
function doubledPawnFiles(b, colorWhite) {
  let count = 0;
  for (let f = 0; f < 8; f++) {
    let n = 0;
    for (let r = 0; r < 8; r++) {
      const pc = b.grid[r][f];
      if (pc && isWhitePiece(pc) === colorWhite && pieceType(pc) === "p") n++;
    }
    if (n >= 2) count += n - 1;
  }
  return count;
}
function isolatedPawnCount(b, colorWhite) {
  let count = 0;
  for (let f = 0; f < 8; f++) {
    const hasAdjacent = f > 0 && fileHasOwnPawn(b, f - 1, colorWhite) || f < 7 && fileHasOwnPawn(b, f + 1, colorWhite);
    if (!hasAdjacent && fileHasOwnPawn(b, f, colorWhite)) count += fileOwnPawnCount(b, f, colorWhite);
  }
  return count;
}
function fileHasOwnPawn(b, f, colorWhite) {
  return fileOwnPawnCount(b, f, colorWhite) > 0;
}
function fileOwnPawnCount(b, f, colorWhite) {
  let n = 0;
  for (let r = 0; r < 8; r++) {
    const pc = b.grid[r][f];
    if (pc && isWhitePiece(pc) === colorWhite && pieceType(pc) === "p") n++;
  }
  return n;
}
function kingSquare(b, colorWhite) {
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const pc = b.grid[r][f];
      if (pc && isWhitePiece(pc) === colorWhite && pieceType(pc) === "k") return indicesToSq(r, f);
    }
  }
  return null;
}
function kingZoneAttackers(b, colorWhite) {
  const ks = kingSquare(b, colorWhite);
  if (!ks) return 0;
  const [kr, kf] = sqToIndices(ks);
  const attackers = /* @__PURE__ */ new Set();
  const zone = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let df = -1; df <= 1; df++) zone.push([kr + dr, kf + df]);
  }
  const ahead = colorWhite ? -1 : 1;
  for (let df = -1; df <= 1; df++) zone.push([kr + 2 * ahead, kf + df]);
  for (const [r, f] of zone) {
    if (!inBoard(r, f)) continue;
    for (const a of attackersOf(b, indicesToSq(r, f), !colorWhite)) attackers.add(a);
  }
  return attackers.size;
}
function kingTrappedOnBackRank(b, colorWhite) {
  const ks = kingSquare(b, colorWhite);
  if (!ks) return false;
  const [kr, kf] = sqToIndices(ks);
  const backRankRow = colorWhite ? 7 : 0;
  const pawnRow = colorWhite ? 6 : 1;
  if (kr !== backRankRow) return false;
  let shelter = false;
  for (let df = -1; df <= 1; df++) {
    if (inBoard(pawnRow, kf + df)) {
      const pc = b.grid[pawnRow][kf + df];
      if (pc && isWhitePiece(pc) === colorWhite && pieceType(pc) === "p") shelter = true;
    }
  }
  if (!shelter) return false;
  let escapes = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let df = -1; df <= 1; df++) {
      const r = kr + dr, f = kf + df;
      if (!inBoard(r, f) || dr === 0 && df === 0) continue;
      const occ = b.grid[r][f];
      if (occ && isWhitePiece(occ) === colorWhite) continue;
      if (!isAttacked(b, indicesToSq(r, f), !colorWhite)) escapes++;
    }
  }
  return escapes <= 1;
}
function detectPhase(fen) {
  const b = parseFen(fen);
  const mp = materialFor(b, true).nonPawnPoints + materialFor(b, false).nonPawnPoints;
  if (mp <= 14) return "endgame";
  const parts = fen.split(" ");
  const fullmove = Number(parts[5] ?? "1") || 1;
  const turn = parts[1] === "w" ? 0 : 1;
  const ply = (fullmove - 1) * 2 + turn;
  if (ply < 16) return "opening";
  return "middlegame";
}
function isTacticalContext(fen) {
  const b = parseFen(fen);
  const turnWhite = (fen.split(" ")[1] ?? "w") === "w";
  if (hangingPieces(b, turnWhite, 1.5).length > 0) return true;
  if (hangingPieces(b, !turnWhite, 3).length > 0) return true;
  if (isAttacked(b, kingSquare(b, turnWhite) ?? "e1", !turnWhite)) return true;
  return false;
}
function describePiece(pc) {
  const names = {
    p: "pawn",
    n: "knight",
    b: "bishop",
    r: "rook",
    q: "queen",
    k: "king"
  };
  return names[pieceType(pc)] ?? "piece";
}

// src/core/patterns.ts
var MINOR_ORIGINAL_SQUARES = {
  white: ["b1", "g1", "c1", "f1"],
  black: ["b8", "g8", "c8", "f8"]
};
var ROOK_ORIGINAL_SQUARES = {
  white: ["a1", "h1"],
  black: ["a8", "h8"]
};
var QUEEN_ORIGINAL_SQUARES = {
  white: ["d1"],
  black: ["d8"]
};
function moverPov(evalWhite, moverWhite) {
  return moverWhite ? evalWhite : -evalWhite;
}
function fmtEval(cp) {
  const v = cp / 100;
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}`;
}
function isOwnPiece(pc, moverWhite) {
  const upper = pc === pc.toUpperCase();
  return upper === moverWhite;
}
function applyUci(fen, uci) {
  try {
    const c = new import_chess.Chess(fen);
    const m = c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.slice(4, 5) || void 0 });
    return m ? { fen: c.fen(), san: m.san } : null;
  } catch {
    return null;
  }
}
function targetsOfPiece(fen, sq, moverWhite) {
  const b = parseFen(fen);
  const targets = [];
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const pc = b.grid[r][f];
      if (!pc || isOwnPiece(pc, moverWhite)) continue;
      const esq = `${String.fromCharCode(97 + f)}${8 - r}`;
      if (attackersOf(b, esq, moverWhite).includes(sq)) {
        const t = pieceType(pc);
        targets.push({
          sq: esq,
          name: describePiece(pc),
          value: t === "k" ? 100 : PIECE_VALUE[t]
        });
      }
    }
  }
  return targets;
}
function detectPatterns(moves, gameId, _config) {
  const instances = [];
  const PRIORITY = [
    "allowed_mate",
    "missed_mate",
    "ignored_threat",
    "hanging_piece",
    "back_rank",
    "missed_fork",
    "missed_material_gain",
    "bad_exchange",
    "king_safety",
    "pawn_structure",
    "slow_development",
    "opening_deviation",
    "passive_move"
  ];
  const winning = { white: false, black: false };
  for (const m of moves) {
    const candidates = [];
    const moverWhite = m.color === "white";
    const beforeBoard = parseFen(m.fenBefore);
    const afterBoard = parseFen(m.fenAfter);
    const movedTo = m.uci.slice(2, 4);
    const movedFrom = m.uci.slice(0, 2);
    const beforePov = moverPov(m.evalBeforeWhite, moverWhite);
    const afterPov = moverPov(m.evalAfterWhite, moverWhite);
    const afterIsMateAgainst = Math.abs(m.evalAfterWhite) >= 9e4 && afterPov < 0;
    const wasAlreadyMated = beforePov <= -9e4;
    if (afterIsMateAgainst && !wasAlreadyMated && m.cpl >= 120) {
      candidates.push({
        patternId: "allowed_mate",
        detail: `After ${m.san}, the opponent has a forced mate. ${m.bestMoveSan} was necessary.`
      });
    }
    if (m.cpl >= 150 && m.bestMoveUci.length >= 4) {
      const bestDest = m.bestMoveUci.slice(2, 4);
      const bestFrom = m.bestMoveUci.slice(0, 2);
      const beforeMateForMover = beforePov >= 9e4;
      if (beforeMateForMover && afterPov < 9e4) {
        candidates.push({
          patternId: "missed_mate",
          detail: `You had a forced mate and let it slip \u2014 ${m.bestMoveSan} finished the game.`
        });
      } else {
        const applied = applyUci(m.fenBefore, m.bestMoveUci);
        if (applied) {
          const movedPiece = pieceAt(parseFen(applied.fen), bestDest);
          if (movedPiece && pieceType(movedPiece) !== "k") {
            const targets = targetsOfPiece(applied.fen, bestDest, moverWhite).filter((t) => t.value >= 3);
            const hasBig = targets.some((t) => t.value >= 5);
            if (targets.length >= 2 && (hasBig || pieceType(movedPiece) === "n" || pieceType(movedPiece) === "p")) {
              candidates.push({
                patternId: "missed_fork",
                detail: `${m.bestMoveSan} hits two targets at once (${targets.map((t) => `${t.name} on ${t.sq}`).join(" and ")}) \u2014 a fork you didn't consider.`
              });
            }
          }
          const destPieceBefore = pieceAt(beforeBoard, bestDest);
          const bestIsWinningCapture = destPieceBefore && !isOwnPiece(destPieceBefore, moverWhite) ? PIECE_VALUE[pieceType(destPieceBefore)] >= 3 : false;
          if (bestIsWinningCapture && !beforeMateForMover) {
            candidates.push({
              patternId: "missed_material_gain",
              detail: `Capturing with ${m.bestMoveSan} wins the ${describePiece(destPieceBefore)} on ${bestDest}.`
            });
          }
        }
      }
    }
    if (m.cpl >= 120) {
      const threatenedBefore = hangingPieces(beforeBoard, moverWhite, 1.5);
      if (threatenedBefore.length > 0) {
        const stillHangingAfter = new Set(hangingPieces(afterBoard, moverWhite, 1.5).map((h) => h.sq));
        const ignored = threatenedBefore.find((h) => h.sq !== movedFrom && stillHangingAfter.has(h.sq));
        if (ignored) {
          const pc = pieceAt(afterBoard, ignored.sq);
          candidates.push({
            patternId: "ignored_threat",
            detail: `Your ${describePiece(pc ?? "P")} on ${ignored.sq} was already under fire \u2014 after ${m.san} it is still capturable${ignored.defended ? " at a profit for the opponent" : " for free"}. ${m.bestMoveSan} dealt with it.`
          });
        }
      }
    }
    if (m.cpl >= 120) {
      const hangingAfter = hangingPieces(afterBoard, moverWhite, 1.5);
      const hangingBefore = new Set(hangingPieces(beforeBoard, moverWhite, 1.5).map((h) => h.sq));
      const movedPiece = pieceAt(afterBoard, movedTo);
      const movedHangs = movedPiece && isOwnPiece(movedPiece, moverWhite) ? hangingAfter.find((h) => h.sq === movedTo) : void 0;
      if (movedHangs) {
        candidates.push({
          patternId: "hanging_piece",
          detail: `${m.san} leaves your ${describePiece(movedPiece)} on ${movedTo} capturable ${movedHangs.defended ? `profitably (\u2248${movedHangs.gain.toFixed(1)} pawns)` : "for free"}.`
        });
      } else {
        const newlyExposed = hangingAfter.find((h) => h.sq !== movedTo && !hangingBefore.has(h.sq));
        if (newlyExposed) {
          const pc = pieceAt(afterBoard, newlyExposed.sq);
          candidates.push({
            patternId: "hanging_piece",
            detail: `${m.san} takes a defender away from your ${describePiece(pc ?? "P")} on ${newlyExposed.sq}, which can now be won${newlyExposed.defended ? " profitably" : " for free"}.`
          });
        }
      }
    }
    if (m.cpl >= 150 && kingTrappedOnBackRank(afterBoard, moverWhite)) {
      candidates.push({
        patternId: "back_rank",
        detail: `Your king is walled in on the back rank \u2014 ${m.san} ignores the weakness. Enemy heavy pieces can attack along the back rank with little warning.`
      });
    }
    if (m.capture && m.cpl >= 150) {
      const ourPiece = pieceAt(afterBoard, movedTo);
      const victim = pieceAt(beforeBoard, movedTo);
      if (ourPiece && isOwnPiece(ourPiece, moverWhite) && victim) {
        const victimVal = PIECE_VALUE[pieceType(victim)];
        const ourVal = PIECE_VALUE[pieceType(ourPiece)];
        const recaptureGain = hangingPieces(afterBoard, moverWhite, 0).find((h) => h.sq === movedTo);
        if (victimVal - ourVal <= -1.5 || recaptureGain && victimVal - ourVal + recaptureGain.gain < 0.5) {
          candidates.push({
            patternId: "bad_exchange",
            detail: `The capture ${m.san} loses material \u2014 after the recapture you come out \u2248${(ourVal - victimVal).toFixed(1)} pawns down.`
          });
        }
      }
    }
    if (m.cpl >= 120 && m.moveNumber >= 8) {
      const kzaBefore = kingZoneAttackers(beforeBoard, moverWhite);
      const kzaAfter = kingZoneAttackers(afterBoard, moverWhite);
      if (kzaAfter - kzaBefore >= 2) {
        candidates.push({
          patternId: "king_safety",
          detail: `${m.san} lets enemy pieces swarm your king (attackers in the king zone: ${kzaBefore} \u2192 ${kzaAfter}).`
        });
      }
    }
    if (m.cpl >= 100) {
      const structBefore = doubledPawnFiles(beforeBoard, moverWhite) + isolatedPawnCount(beforeBoard, moverWhite);
      const structAfter = doubledPawnFiles(afterBoard, moverWhite) + isolatedPawnCount(afterBoard, moverWhite);
      if (structAfter > structBefore) {
        candidates.push({
          patternId: "pawn_structure",
          detail: `${m.san} damages your pawn structure (doubled/isolated pawns: ${structBefore} \u2192 ${structAfter}) without compensation.`
        });
      }
    }
    if (m.phase === "opening" && m.cpl >= 80) {
      const movedPieceChar = pieceAt(beforeBoard, movedFrom);
      const pt = movedPieceChar ? pieceType(movedPieceChar) : null;
      const minorsHome = MINOR_ORIGINAL_SQUARES[m.color].filter((s) => {
        const pc = pieceAt(beforeBoard, s);
        return pc && isOwnPiece(pc, moverWhite) && (pieceType(pc) === "n" || pieceType(pc) === "b");
      }).length;
      if (pt === "q" && m.moveNumber <= 5) {
        candidates.push({
          patternId: "slow_development",
          detail: `The queen comes out on move ${m.moveNumber} while ${minorsHome} minor pieces are still at home \u2014 an early target for tempo-gaining attacks.`
        });
      } else if (pt && pt !== "k" && pt !== "p" && minorsHome >= 2 && !MINOR_ORIGINAL_SQUARES[m.color].includes(movedFrom) && !ROOK_ORIGINAL_SQUARES[m.color].includes(movedFrom) && !QUEEN_ORIGINAL_SQUARES[m.color].includes(movedFrom)) {
        candidates.push({
          patternId: "slow_development",
          detail: `You moved an already-developed piece (${movedFrom}${movedTo}) again while ${minorsHome} minor pieces were still undeveloped.`
        });
      }
    }
    if (m.phase === "opening" && m.cpl >= 100) {
      candidates.push({
        patternId: "opening_deviation",
        detail: `Early deviation: ${m.san} already costs ${m.cpl}cp of evaluation. Worth studying this line up to move ${m.moveNumber}.`
      });
    }
    if (m.cpl >= 150 && m.phase !== "endgame" && !m.capture && !m.check && m.classification !== "inaccuracy") {
      const destRank = Number(movedTo[1]);
      const ownHalf = moverWhite ? destRank <= 4 : destRank >= 5;
      if (ownHalf && afterPov <= -50) {
        candidates.push({
          patternId: "passive_move",
          detail: `${m.san} retreats to your own half while the position calls for activity (eval after: ${fmtEval(afterPov)}).`
        });
      }
    }
    if (!winning[m.color] && beforePov >= 250) winning[m.color] = true;
    if (winning[m.color] && m.phase === "endgame" && afterPov <= 80) {
      candidates.push({
        patternId: "endgame_conversion",
        detail: `You were winning (${fmtEval(beforePov)}) in the endgame, but by move ${m.moveNumber} the advantage melted to ${fmtEval(afterPov)}.`
      });
      winning[m.color] = false;
    }
    if (afterPov < -50) winning[m.color] = false;
    if (m.secondsSpent !== void 0 && m.secondsSpent <= 8 && m.cpl >= 200) {
      candidates.push({
        patternId: "fast_blunder",
        detail: `${m.san} was played in ${m.secondsSpent}s \u2014 a move this costly deserves a candidate-move check (opponent's checks, captures, threats).`
      });
    }
    const primary = PRIORITY.find((p) => candidates.some((c) => c.patternId === p));
    const additive = candidates.filter((c) => c.patternId === "fast_blunder" || c.patternId === "endgame_conversion");
    const chosen = [];
    if (primary) chosen.push(candidates.find((c) => c.patternId === primary));
    chosen.push(...additive);
    for (const c of chosen) {
      instances.push({
        patternId: c.patternId,
        gameId,
        ply: m.ply,
        moveNumber: m.moveNumber,
        color: m.color,
        phase: m.phase,
        san: m.san,
        fenBefore: m.fenBefore,
        fenAfter: m.fenAfter,
        evalLoss: m.cpl,
        bestMoveSan: m.bestMoveSan,
        bestMoveUci: m.bestMoveUci,
        detail: c.detail,
        secondsSpent: m.secondsSpent
      });
    }
  }
  return instances;
}

// src/core/critical.ts
function detectCriticalPlies(moves, instances, config) {
  const flagged = /* @__PURE__ */ new Set();
  const patternPlies = new Set(instances.map((i) => i.ply));
  for (let i = 0; i < moves.length; i++) {
    const m = moves[i];
    const swing = Math.abs(m.evalAfterWhite - m.evalBeforeWhite);
    const prev = i > 0 ? moves[i - 1] : null;
    let critical = false;
    if (m.cpl >= config.critical.cpl) critical = true;
    if (swing >= config.critical.swing) critical = true;
    if (patternPlies.has(m.ply)) critical = true;
    if (prev && prev.phase !== m.phase) critical = true;
    if (m.capture && victimValue(m) >= 5) critical = true;
    if (m.phase === "opening" && m.cpl >= 100) critical = true;
    if (critical) flagged.add(m.ply);
  }
  return [...flagged].sort((a, b) => a - b);
}
function victimValue(m) {
  if (!m.capture) return 0;
  const to = m.uci.slice(2, 4);
  const pc = pieceAt(parseFen(m.fenBefore), to);
  return pc ? PIECE_VALUE[pieceType(pc)] : 0;
}

// src/core/analysis.ts
var CancelledError = class extends Error {
  constructor() {
    super("cancelled");
  }
};
var CPL_CAP = 1e3;
function classifyMove(cpl, config) {
  if (cpl <= 10) return "best";
  if (cpl <= config.classification.excellent) return "excellent";
  if (cpl <= config.classification.good) return "good";
  if (cpl <= config.classification.inaccuracy) return "inaccuracy";
  if (cpl <= config.classification.mistake) return "mistake";
  return "blunder";
}
function computeCpl(beforeWhite, afterWhite, moverWhite, mateInBefore, mateInAfter) {
  const beforeMover = moverWhite ? beforeWhite : -beforeWhite;
  const afterMover = moverWhite ? afterWhite : -afterWhite;
  const mateMover = (mateIn) => mateIn === null ? null : moverWhite ? mateIn : -mateIn;
  const mateBefore = mateMover(mateInBefore);
  const mateAfter = mateMover(mateInAfter);
  const hadMate = mateBefore !== null && mateBefore > 0;
  const stillMate = mateAfter !== null && mateAfter > 0;
  const wasMated = mateBefore !== null && mateBefore < 0;
  const stillMated = mateAfter !== null && mateAfter < 0;
  if (hadMate && !stillMate) return 900;
  if (wasMated && stillMated) return 0;
  if (wasMated && !stillMated) return 0;
  const loss = beforeMover - afterMover;
  return Math.max(0, Math.min(CPL_CAP, Math.round(loss)));
}
function sanOfUci(uci, fen) {
  if (!uci) return "";
  try {
    const c = new import_chess2.Chess(fen);
    const m = c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.slice(4, 5) || void 0 });
    return m?.san ?? uci;
  } catch {
    return uci;
  }
}
function pvToSan(pvUci, fen, maxPlies = 6) {
  const c = new import_chess2.Chess(fen);
  const out = [];
  for (const uci of pvUci.slice(0, maxPlies)) {
    try {
      const m = c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.slice(4, 5) || void 0 });
      if (!m) break;
      out.push(m.san);
    } catch {
      break;
    }
  }
  return out;
}
function metricsForColor(moves, color) {
  const mine = moves.filter((m) => m.color === color);
  if (mine.length === 0) {
    return {
      moves: 0,
      avgCpl: 0,
      blunders: 0,
      mistakes: 0,
      inaccuracies: 0,
      accuracy: 0,
      openingAccuracy: null,
      middlegameAccuracy: null,
      endgameAccuracy: null,
      tacticalAccuracy: null,
      strategicAccuracy: null,
      timeTrouble: false
    };
  }
  const accs = mine.map((m) => m.accuracy);
  const byPhase = (phase) => {
    const xs = mine.filter((m) => m.phase === phase).map((m) => m.accuracy);
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
  };
  const tactical = mine.filter((m) => m.tacticalContext).map((m) => m.accuracy);
  const strategic = mine.filter((m) => !m.tacticalContext && m.phase !== "opening").map((m) => m.accuracy);
  const lastTen = mine.slice(-10);
  const timeTroubleMoves = lastTen.filter((m) => m.secondsSpent !== void 0 && m.secondsSpent < 30).length;
  return {
    moves: mine.length,
    avgCpl: mine.reduce((a, m) => a + m.cpl, 0) / mine.length,
    blunders: mine.filter((m) => m.classification === "blunder").length,
    mistakes: mine.filter((m) => m.classification === "mistake").length,
    inaccuracies: mine.filter((m) => m.classification === "inaccuracy").length,
    accuracy: accs.reduce((a, b) => a + b, 0) / accs.length,
    openingAccuracy: byPhase("opening"),
    middlegameAccuracy: byPhase("middlegame"),
    endgameAccuracy: byPhase("endgame"),
    tacticalAccuracy: tactical.length ? tactical.reduce((a, b) => a + b, 0) / tactical.length : null,
    strategicAccuracy: strategic.length ? strategic.reduce((a, b) => a + b, 0) / strategic.length : null,
    timeTrouble: timeTroubleMoves >= 4
  };
}
var AnalysisPipeline = class {
  constructor(engine, config = DEFAULT_CONFIG) {
    this.engine = engine;
    this.config = config;
  }
  config;
  cancelled = false;
  cancel() {
    this.cancelled = true;
    this.engine.cancel();
  }
  /** Analyze a single parsed game. Throws CancelledError if cancelled. */
  async analyzeGame(parsed, info2, id, onProgress, gameIndex, gameCount, gameLabel) {
    this.cancelled = false;
    const plies = parsed.plies;
    if (plies.length === 0) throw new Error("Game has no moves.");
    const fens = [parsed.startFen];
    for (const p of plies) fens.push(p.fenAfter);
    const evals = [];
    for (let i = 0; i < fens.length; i++) {
      if (this.cancelled) throw new CancelledError();
      onProgress({ gameLabel, gameIndex, gameCount, ply: i, plies: fens.length });
      try {
        const e = await this.engine.analyze(fens[i], {
          depth: this.config.depth,
          timeoutMs: this.config.perPositionTimeoutMs
        });
        evals.push(e);
      } catch (err) {
        if (err.message === "cancelled" || this.cancelled) throw new CancelledError();
        evals.push(null);
      }
    }
    for (let i = 0; i < fens.length; i++) {
      const fen = fens[i];
      try {
        const c = new import_chess2.Chess(fen);
        if (c.isCheckmate()) {
          const turnWhite = (fen.split(" ")[1] ?? "w") === "w";
          evals[i] = {
            fen,
            depth: 0,
            bestMoveUci: "",
            cpWhite: turnWhite ? -MATE_CAP : MATE_CAP,
            mateIn: turnWhite ? -1 : 1,
            pvUci: [],
            lines: []
          };
        } else if (c.isStalemate() || c.isInsufficientMaterial()) {
          evals[i] = { fen, depth: 0, bestMoveUci: "", cpWhite: 0, mateIn: null, pvUci: [], lines: [] };
        }
      } catch {
      }
    }
    const moves = [];
    for (let i = 0; i < plies.length; i++) {
      const plyRec = plies[i];
      const before = evals[i];
      const after = evals[i + 1];
      const moverWhite = plyRec.color === "white";
      let evalBeforeWhite = before?.cpWhite ?? 0;
      let evalAfterWhite = after?.cpWhite ?? evalBeforeWhite;
      const mateInBefore = before?.mateIn ?? null;
      const mateInAfter = after?.mateIn ?? null;
      const bestMoveUci = before?.bestMoveUci ?? "";
      const playedUci = plyRec.uci;
      const playedIsBest = bestMoveUci !== "" && normalizeUci(bestMoveUci) === normalizeUci(playedUci);
      let cpl = playedIsBest ? 0 : computeCpl(evalBeforeWhite, evalAfterWhite, moverWhite, mateInBefore, mateInAfter);
      if (!before || !after) cpl = Math.min(cpl, 60);
      const classification = playedIsBest ? "best" : classifyMove(cpl, this.config);
      const bestMoveSan = playedIsBest ? plyRec.san : sanOfUci(bestMoveUci, plyRec.fenBefore);
      moves.push({
        ply: plyRec.ply,
        moveNumber: plyRec.moveNumber,
        color: plyRec.color,
        san: plyRec.san,
        uci: playedUci,
        fenBefore: plyRec.fenBefore,
        fenAfter: plyRec.fenAfter,
        phase: detectPhase(plyRec.fenBefore),
        classification,
        cpl,
        evalBeforeWhite,
        evalAfterWhite,
        bestMoveUci,
        bestMoveSan,
        pvSan: before ? pvToSan(before.pvUci, plyRec.fenBefore) : [],
        capture: plyRec.capture,
        check: plyRec.check,
        secondsSpent: plyRec.secondsSpent,
        tacticalContext: isTacticalContext(plyRec.fenBefore),
        patterns: [],
        accuracy: moveAccuracy(
          moverWhite ? evalBeforeWhite : -evalBeforeWhite,
          moverWhite ? evalAfterWhite : -evalAfterWhite
        )
      });
    }
    const instances = detectPatterns(moves, id, this.config);
    for (const inst of instances) {
      const mv = moves[inst.ply - 1];
      if (mv && !mv.patterns.includes(inst.patternId)) mv.patterns.push(inst.patternId);
    }
    const criticalPlies = detectCriticalPlies(moves, instances, this.config);
    return {
      id,
      importedAt: Date.now(),
      analyzedAt: Date.now(),
      engine: { name: this.engine.displayName, depth: this.config.depth },
      info: info2,
      startFen: parsed.startFen,
      moves,
      instances,
      criticalPlies,
      metrics: { white: metricsForColor(moves, "white"), black: metricsForColor(moves, "black") }
    };
  }
};
function normalizeUci(uci) {
  return uci.length === 5 ? uci.slice(0, 4) + uci[4].toLowerCase() : uci;
}

// src/core/pgn.ts
var import_chess3 = __toESM(require_chess(), 1);
function splitChunks(text) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const chunks = [];
  let current = null;
  let sawMoves = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("[") && line.endsWith("]") && !line.startsWith("[%")) {
      if (sawMoves) {
        if (current) chunks.push(current);
        current = { tags: line + "\n", movetext: "" };
        sawMoves = false;
      } else {
        if (!current) current = { tags: "", movetext: "" };
        current.tags += line + "\n";
      }
    } else if (line.length > 0) {
      if (!current) current = { tags: "", movetext: "" };
      current.movetext += line + "\n";
      sawMoves = true;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}
function headerValue(headers, key) {
  const v = headers[key];
  if (!v || v === "" || /^[?.-]+$/.test(v)) return void 0;
  return v;
}
function eloOf(headers, key) {
  const v = headers[key];
  if (!v || v === "?" || v === "") return void 0;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : void 0;
}
function timeControlKind(tc) {
  if (!tc) return "unknown";
  const base = parseInt(tc.split("+")[0], 10);
  if (!Number.isFinite(base)) return "unknown";
  const minutes = base / 60;
  if (minutes < 3) return "bullet";
  if (minutes < 10) return "blitz";
  if (minutes < 60) return "rapid";
  return "classical";
}
function extractClocks(movetext, plyCount) {
  const re = /%clk\s+(\d+):(\d{1,2}):(\d{1,2}(?:\.\d+)?)/g;
  const clocks = [];
  let m;
  while ((m = re.exec(movetext)) !== null) {
    clocks.push(Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]));
  }
  if (clocks.length !== plyCount) return null;
  const elapsed = [];
  for (let i = 0; i < clocks.length; i++) {
    if (i < 2) {
      elapsed.push(void 0);
      continue;
    }
    const d = clocks[i - 2] - clocks[i];
    elapsed.push(d >= 0 && d < 3600 ? Math.round(d) : void 0);
  }
  return elapsed;
}
function parseSingleChunk(chunk) {
  const pgnText = chunk.tags + "\n" + chunk.movetext;
  const chess = new import_chess3.Chess();
  try {
    chess.loadPgn(pgnText);
  } catch {
    chess.loadPgn(pgnText, { strict: false });
  }
  const headers = typeof chess.getHeaders === "function" ? chess.getHeaders() : chess.header();
  const fenHeader = headerValue(headers, "FEN");
  const startFen = fenHeader ?? new import_chess3.Chess().fen();
  const replay = new import_chess3.Chess(startFen);
  const history = chess.history({ verbose: true });
  const plies = [];
  for (let i = 0; i < history.length; i++) {
    const hm = history[i];
    const fenBefore = replay.fen();
    const move = replay.move({ from: hm.from, to: hm.to, promotion: hm.promotion ?? "q" });
    if (!move) throw new Error(`Illegal move ${i + 1}: ${hm.san}`);
    const color = move.color === "w" ? "white" : "black";
    plies.push({
      ply: i + 1,
      moveNumber: Math.floor(i / 2) + 1,
      color,
      san: move.san,
      uci: move.from + move.to + (move.promotion ?? ""),
      fenBefore,
      fenAfter: replay.fen(),
      capture: Boolean(move.captured),
      check: Boolean(move.san.includes("+") || move.san.includes("#"))
    });
  }
  const clocks = extractClocks(chunk.movetext, plies.length);
  if (clocks) {
    for (let i = 0; i < plies.length; i++) {
      const s = clocks[i];
      if (s !== void 0) plies[i].secondsSpent = s;
    }
  }
  const info2 = {
    white: headers.White ?? "White",
    black: headers.Black ?? "Black",
    whiteElo: eloOf(headers, "WhiteElo"),
    blackElo: eloOf(headers, "BlackElo"),
    result: headers.Result ?? "*",
    date: headerValue(headers, "UTCDate") ?? headerValue(headers, "Date"),
    event: headerValue(headers, "Event"),
    timeControl: headerValue(headers, "TimeControl"),
    timeControlKind: timeControlKind(headerValue(headers, "TimeControl")),
    eco: headerValue(headers, "ECO"),
    opening: headerValue(headers, "Opening") ?? headerValue(headers, "Variation"),
    termination: headerValue(headers, "Termination")
  };
  return { info: info2, startFen, plies, movetext: chunk.movetext };
}
function parsePgn(text) {
  const errors = [];
  const games2 = [];
  const chunks = splitChunks(text);
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    if (!c.movetext.trim() && !c.tags.trim()) continue;
    try {
      const g = parseSingleChunk(c);
      if (g.plies.length === 0) {
        errors.push(`Game ${i + 1}: no moves found.`);
        continue;
      }
      games2.push(g);
    } catch (e) {
      const white = /\[White\s+"([^"]*)"/.exec(c.tags)?.[1];
      const black = /\[Black\s+"([^"]*)"/.exec(c.tags)?.[1];
      const label = white || black ? `${white ?? "?"} \u2013 ${black ?? "?"}` : `Game ${i + 1}`;
      errors.push(`${label}: ${e.message}`);
    }
  }
  return { games: games2, errors };
}
function suggestPlayerName(games2) {
  if (games2.length === 0) return null;
  const candidates = /* @__PURE__ */ new Map();
  for (const g of games2) {
    const names = /* @__PURE__ */ new Set([g.info.white, g.info.black]);
    for (const n of names) candidates.set(n, (candidates.get(n) ?? 0) + 1);
  }
  for (const [name, count] of candidates) {
    if (count === games2.length && name !== "White" && name !== "Black" && !name.startsWith("Anonymous")) {
      return name;
    }
  }
  return null;
}

// src/core/puzzles.ts
var import_chess4 = __toESM(require_chess(), 1);

// src/core/explain.ts
var PATTERN_META = {
  allowed_mate: {
    title: "Allowed Forced Mate",
    category: "tactical",
    typicalPattern: "A move overlooks a mating net that was already hanging in the air \u2014 usually right after a heavy piece took aim at your king.",
    whatToNotice: 'Before each move, ask one question first: "what is my opponent threatening?" A mate threat outranks every plan of your own.',
    principle: "King safety outranks material. When an attack on your king exists, defense is the whole job.",
    trainingIdea: "Defensive calculation: solve positions where the first move must parry a mate or decisive threat."
  },
  missed_mate: {
    title: "Missed Forced Mate",
    category: "tactical",
    typicalPattern: "Winning attacking positions were converted into quiet moves \u2014 the mating combination existed but was never calculated to the end.",
    whatToNotice: "When your rooks/queen point at the enemy king, force yourself to calculate checks first \u2014 mates hide in forcing sequences.",
    principle: "When you have an attack, calculation beats intuition. Check all checks, in order of forcing-ness.",
    trainingIdea: "Mating patterns: practice classic mates (back rank, smothered, Greek gift) until they jump out."
  },
  ignored_threat: {
    title: "Missed Opponent Threats",
    category: "decision",
    typicalPattern: "You continue your own plan while an immediate tactical threat is on the board \u2014 a piece was attacked and stayed attacked.",
    whatToNotice: "After every opponent move, name the threat out loud before choosing your move. If you cannot name it, look again.",
    principle: "Every opponent move makes a threat \u2014 captures, attacks, or a bigger plan. Identify it before you commit.",
    trainingIdea: "Threat identification: for each puzzle, state the opponent threat before looking for your move."
  },
  hanging_piece: {
    title: "Loose Pieces",
    category: "tactical",
    typicalPattern: "Pieces are left on attacked squares \u2014 moving into capture ranges, or pulling a defender away from a piece that needed it.",
    whatToNotice: 'Track which of your pieces are undefended ("LPDO \u2014 Loose Pieces Drop Off"). Before releasing a move, re-scan all your pieces.',
    principle: "An undefended piece is a tactical liability. Every move changes which pieces are loose.",
    trainingIdea: "Hanging-piece scans: 10 quick puzzles focused on noticing undefended pieces for both sides."
  },
  back_rank: {
    title: "Back-Rank Weakness",
    category: "tactical",
    typicalPattern: "The king stays walled in on its original square while the back rank is never given an escape hatch \u2014 heavy-piece sacrifices then hit like a truck.",
    whatToNotice: "Count the escape squares around your king. A single luft move (h2/h3) at the right time removes 90% of back-rank tricks.",
    principle: "A king with no luft is a tactical target even behind three pawns.",
    trainingIdea: "Back-rank puzzles: sacrifices and defenses on the first/eighth rank."
  },
  missed_fork: {
    title: "Missed Forks & Double Attacks",
    category: "tactical",
    typicalPattern: "Positions contained a move hitting two targets at once \u2014 often with a knight \u2014 but the double attack was not on the candidate list.",
    whatToNotice: "Look for moves that hit two enemy pieces at once, especially knight jumps. Also scan for what YOUR pieces attack after a quiet move.",
    principle: "The fork is the most common winning tactic after the simple capture. Two targets = one good move.",
    trainingIdea: "Knight/pawn fork drills: 15 puzzles where the solution is a double attack."
  },
  missed_material_gain: {
    title: "Missed Free Material",
    category: "tactical",
    typicalPattern: "Capturable material stayed on the board \u2014 the capture was available but a quieter move was preferred.",
    whatToNotice: "Before every move, complete the scan: checks, captures, threats \u2014 in that order. Most free material is a capture away.",
    principle: " CCT: Checks, Captures, Threats. Run it every move, for both sides.",
    trainingIdea: "Capture-awareness drills: puzzles won by simply taking the right piece."
  },
  bad_exchange: {
    title: "Bad Exchanges",
    category: "strategic",
    typicalPattern: "Captures were initiated that lose material after the recapture \u2014 the sequence was seen one move too short.",
    whatToNotice: "Before capturing, play the recapture in your head. Who is left standing on the square, and is that good for you?",
    principle: "Count the whole exchange sequence to the end, not just the first capture.",
    trainingIdea: "Static exchange evaluation practice: for each capture quiz, predict who wins the square."
  },
  king_safety: {
    title: "King Safety Under Pressure",
    category: "middlegame",
    typicalPattern: "Moves invite enemy pieces toward your king \u2014 open lines and missing defenders let the attack grow piece by piece.",
    whatToNotice: "Count attackers vs defenders around your king after each move. If the number grows, fix it before continuing your plan.",
    principle: "An attack succeeds when attackers outnumber defenders. Never let that ratio drift unnoticed.",
    trainingIdea: "King-safety review: replay your own attacked positions and mark each attacker/defender."
  },
  pawn_structure: {
    title: "Pawn Structure Damage",
    category: "strategic",
    typicalPattern: "Pawn moves create doubled or isolated pawns without gaining activity or compensation in return.",
    whatToNotice: "Before a pawn move, ask what squares it abandons and which files it opens. Pawns never move backwards.",
    principle: "Every pawn push is a structural commitment. Doubled/isolated pawns need a concrete reason.",
    trainingIdea: "Structure study: review your own doubled/isolated pawn positions and find the alternative plan."
  },
  passive_move: {
    title: "Passive Piece Play",
    category: "strategic",
    typicalPattern: "In worse or balanced positions, pieces retreat to the first ranks instead of generating counterplay.",
    whatToNotice: "When you cannot find a good retreat, look for the most active square the piece can reach. Passivity compounds.",
    principle: "A bad position is rarely saved by retreating. Counterplay is the currency of defense.",
    trainingIdea: "Active-choice training: puzzles where the only good move is the most aggressive one."
  },
  opening_deviation: {
    title: "Early Opening Deviations",
    category: "opening",
    typicalPattern: "Evaluation is already lost inside the first ten moves \u2014 the same lines are left too early or move-order tricks are missed.",
    whatToNotice: "Note exactly where your prepared lines end. If you cannot name your plan after the last theory move, that is where study starts.",
    principle: "Opening principles only work while the position is still principled: center, development, king safety.",
    trainingIdea: "Line repair: rebuild your opening repertoire from the exact deviation moves flagged below."
  },
  slow_development: {
    title: "Slow Opening Development",
    category: "opening",
    typicalPattern: "Minor pieces stay on their starting squares while already-developed pieces (often the queen) move again.",
    whatToNotice: 'In the opening, prefer the move that brings a NEW piece closer to the fight. Ask "which piece is my worst-placed piece?"',
    principle: "Open with knights and bishops, castle early, connect the rooks \u2014 then start piece regrouping.",
    trainingIdea: 'Development drills: rapid games with the rule "no piece moves twice until all minors are out".'
  },
  endgame_conversion: {
    title: "Endgame Conversion Technique",
    category: "endgame",
    typicalPattern: "Winning endgame evaluations were slowly returned to equality \u2014 the advantage existed but never became a result.",
    whatToNotice: "In winning endgames, activate the king and push the most advanced passed pawn. Every trade should increase your winning chances.",
    principle: "Up material or position? Simplify towards a known won ending and never relax until the point is scored.",
    trainingIdea: "Technical endgames: rook endings and passed-pawn races from your own converted/failed positions."
  },
  fast_blunder: {
    title: "Playing Too Quickly",
    category: "decision",
    typicalPattern: "Expensive moves were played within seconds \u2014 the biggest losses came from the fastest decisions.",
    whatToNotice: `When you "see" a move instantly, that is exactly when to pause: check the opponent's reply before playing it.`,
    principle: "Speed is only an asset when the position is forcing. Slow down for every capture and check.",
    trainingIdea: "Blunder-check routine: build a fixed 3-step pre-move ritual and use it in your next rapid games."
  }
};

// src/core/puzzles.ts
function buildPuzzles(games2, config, playerName = "") {
  const puzzles2 = [];
  for (const g of games2) {
    for (const inst of g.instances) {
      if (playerName && g.info.playerColor && inst.color !== g.info.playerColor) continue;
      if (inst.evalLoss < config.puzzleMinLoss) continue;
      if (!inst.bestMoveUci || inst.bestMoveUci.length < 4) continue;
      let legal = false;
      try {
        legal = new import_chess4.Chess(inst.fenBefore).moves().length > 0;
      } catch {
        continue;
      }
      if (!legal) continue;
      const swing = inst.evalLoss;
      const difficulty = swing >= 500 ? "advanced" : swing >= 300 ? "intermediate" : "easy";
      const meta = PATTERN_META[inst.patternId];
      puzzles2.push({
        id: `${g.id}-${inst.ply}`,
        gameId: g.id,
        gameLabel: `${g.info.white} \u2013 ${g.info.black}`,
        ply: inst.ply,
        fen: inst.fenBefore,
        solutionUci: inst.bestMoveUci,
        solutionSan: inst.bestMoveSan,
        playedSan: inst.san,
        evalLoss: inst.evalLoss,
        theme: meta.title,
        category: meta.category,
        difficulty,
        detail: inst.detail,
        bestPvSan: []
      });
    }
  }
  puzzles2.sort((a, b) => b.evalLoss - a.evalLoss);
  return puzzles2;
}

// scripts/bugcheck.ts
var failures = 0;
var check = (name, cond, detail = "") => {
  if (cond) console.log(`  \u2714 ${name}`);
  else {
    failures++;
    console.error(`  \u2718 ${name} ${detail}`);
  }
};
console.log("\u2014 computeCpl: mate logic from the mover\u2019s point of view \u2014");
var cplBlackDefends = computeCpl(MATE_CAP - 1, 300, false, 1, null);
check("Black correctly defending vs forced mate \u2192 no 900 penalty", cplBlackDefends !== 900, `got ${cplBlackDefends}`);
check("Black defensive move is low cpl", cplBlackDefends <= 60, `got ${cplBlackDefends}`);
check("classification not blunder", classifyMove(cplBlackDefends, DEFAULT_CONFIG) !== "blunder");
var cplWhiteErrs = computeCpl(MATE_CAP - 1, 300, true, 1, null);
check("White missing own mate \u2192 catastrophic 900", cplWhiteErrs === 900, `got ${cplWhiteErrs}`);
var cplStillMated = computeCpl(-(MATE_CAP - 2), -(MATE_CAP - 1), true, -2, -1);
check("still getting mated \u2192 0", cplStillMated === 0, `got ${cplStillMated}`);
var cplEscaped = computeCpl(MATE_CAP - 3, 150, false, 3, null);
check("Black escapes a mate \u2192 0", cplEscaped === 0, `got ${cplEscaped}`);
var cplAllowsMate = computeCpl(120, MATE_CAP - 2, false, null, 2);
check("Black move allowing White mate \u2192 capped catastrophic", cplAllowsMate >= 900, `got ${cplAllowsMate}`);
console.log("\u2014 pipeline: game ending in checkmate (Fool\u2019s mate) \u2014");
var pgn = [
  '[Event "T"]',
  '[White "Alex"]',
  '[Black "Bea"]',
  '[Result "0-1"]',
  "",
  "1. f3 e5 2. g4 Qh4# 0-1",
  ""
].join("\n");
var { games } = parsePgn(pgn);
check("PGN parses to 1 game", games.length === 1);
var mockEngine = {
  newGame() {
  },
  cancel() {
  },
  async analyze(fen) {
    const turnWhite = (fen.split(" ")[1] ?? "w") === "w";
    return {
      fen,
      depth: 8,
      bestMoveUci: "e2e4",
      cpWhite: turnWhite ? 30 : -30,
      mateIn: null,
      pvUci: ["e2e4"],
      lines: []
    };
  }
};
var info = {
  white: "Alex",
  black: "Bea",
  result: "0-1",
  timeControlKind: "unknown",
  playerColor: "white",
  playerElo: 1500,
  resultForPlayer: "loss"
};
var pipeline = new AnalysisPipeline(mockEngine, DEFAULT_CONFIG);
var analyzed = await pipeline.analyzeGame(
  { startFen: new import_chess5.Chess().fen(), plies: games[0].plies },
  info,
  "g1",
  () => {
  },
  0,
  1,
  "Alex \u2013 Bea"
);
var mateMove = analyzed.moves[3];
check("move 4 black is Qh4#", mateMove.san === "Qh4#", `got ${mateMove.san}`);
check("mating move evalAfter is a Black-mate score", mateMove.evalAfterWhite <= -(MATE_CAP - 1), `got ${mateMove.evalAfterWhite}`);
check("mating move classified best", mateMove.classification === "best", `got ${mateMove.classification}`);
check("mating move accuracy ~100", mateMove.accuracy > 99, `got ${mateMove.accuracy}`);
check("mating move cpl 0", mateMove.cpl === 0, `got ${mateMove.cpl}`);
var finalPositionMate = new import_chess5.Chess(analyzed.moves[3].fenAfter).isCheckmate();
check("final fen is checkmate", finalPositionMate);
console.log("\u2014 puzzle generation from a real mistake \u2014");
var trapPgn = [
  '[Event "T2"]',
  '[White "Alex"]',
  '[Black "Bea"]',
  '[Result "1-0"]',
  "",
  "1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7# 1-0",
  ""
].join("\n");
var parsed2 = parsePgn(trapPgn).games[0];
var analyzed2 = await pipeline.analyzeGame(
  { startFen: new import_chess5.Chess().fen(), plies: parsed2.plies },
  { ...info, playerColor: "black", resultForPlayer: "loss" },
  "g2",
  () => {
  },
  0,
  1,
  "Alex \u2013 Bea"
);
analyzed2.moves[5].cpl = 850;
analyzed2.moves[5].evalBeforeWhite = -50;
analyzed2.moves[5].evalAfterWhite = 900;
analyzed2.instances = [{
  patternId: "allowed_mate",
  gameId: "g2",
  ply: 6,
  moveNumber: 3,
  color: "black",
  phase: "opening",
  san: "Nf6",
  fenBefore: analyzed2.moves[5].fenBefore,
  fenAfter: analyzed2.moves[5].fenAfter,
  evalLoss: 850,
  bestMoveSan: "g6",
  bestMoveUci: "g7g6",
  detail: "test"
}];
var puzzles = buildPuzzles([analyzed2], DEFAULT_CONFIG, "Alex");
check("blunder became a puzzle", puzzles.length === 1, `got ${puzzles.length}`);
if (puzzles.length === 1) {
  check("puzzle solution is the engine best", puzzles[0].solutionUci === "g7g6");
  check("puzzle targets the player color", puzzles[0].fen.split(" ")[1] === "b");
}
console.log("\u2014 PGN helpers \u2014");
var samples = parsePgn(readFileSync(new URL("../public/samples/demo-games.pgn", import.meta.url), "utf8"));
check("sample file parses with 0 errors", samples.games.length === 9 && samples.errors.length === 0, `games=${samples.games.length} errors=${JSON.stringify(samples.errors)}`);
check("player auto-detected as Alex", suggestPlayerName(samples.games) === "Alex");
console.log(failures ? `
${failures} FAILURE(S)` : "\nALL CHECKS PASSED");
process.exit(failures ? 1 : 0);
/*! Bundled license information:

chess.js/dist/cjs/chess.js:
  (**
   * @license
   * Copyright (c) 2025, Jeff Hlywa (jhlywa@gmail.com)
   * All rights reserved.
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *
   * 1. Redistributions of source code must retain the above copyright notice,
   *    this list of conditions and the following disclaimer.
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   *    this list of conditions and the following disclaimer in the documentation
   *    and/or other materials provided with the distribution.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
   * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
   * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
   * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
   * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
   * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
   * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
   * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
   * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
   * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
   * POSSIBILITY OF SUCH DAMAGE.
   *)
*/
