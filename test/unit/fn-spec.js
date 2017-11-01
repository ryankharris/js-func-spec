"use strict";

const spec = require("../../index");

describe("js-func-spec fn()", function() {
  describe("fn of 2 spec literal, fnDef of 2 params", function() {
    let specdAdd = spec.fn([0, 0], function add(a, b) {
      return a + b;
    });

    it("should set defaults when no args are passed", function() {
      expect(specdAdd()).toBe(0);
    });

    it("should set missing 2nd arg", function() {
      expect(specdAdd(1)).toBe(1);
    });

    it("should set missing 1st arg", function() {
      expect(specdAdd(undefined, 1)).toBe(1);
    });

    it("should verify that both args are used when specified", function() {
      expect(specdAdd(1, 2)).toBe(3);
    });
  });

  describe("fn of 1 spec literal, fnDef of 2 params", function() {
    let add = spec.fn([0], function add(a, b) {
      return a + b;
    });

    it("should return NaN when 0 args passed", function() {
      expect(isNaN(add())).toBe(true);
    });

    it("should sum 2 number args", function() {
      expect(add(3, 4)).toBe(7);
    });

    it("should return NaN when 1 arg passed", function() {
      expect(isNaN(add(3))).toBe(true);
    });
  });

  describe("fn of 0 spec literals, fnDef variadic args", function() {
    let specdAdd = spec.fn([], function add(...args) {
      return args.reduce((acc, val) => {
        return acc + val;
      }, 0);
    });

    it("should add variadic args", function() {
      expect(specdAdd(1, 2, 3)).toBe(6);
    });
  });

  describe("fn of 1 spec literal, fnDef of 2 params with 1 default in the signature", function() {
    let g = spec.fn([0], (a, b = 0) => a + b);

    it("should work as expected with 2 args", function() {
      expect(g(3, 4)).toBe(7);
    });

    it("should use the default param from fn signature for the 2nd arg. 3 + 0 == 3.", function() {
      expect(g(3)).toBe(3);
    });

    it("should return 0 when passed args (undefined, undefined).", function() {
      expect(g()).toBe(0);
    });
  });

  describe("fn of 2 spec literals, fnDef of 2 param with 1 default which doesn't match spec literal", function() {
    let h = spec.fn([0, 0], (a, b = 1) => a + b);

    it("should return 0 when passed args (undefined, undefined)", function() {
      expect(h()).toBe(0);
    });
  });

  // ============
  describe("fn of 2 spec validators, fnDef of 2 params", function() {
    let natural = spec.validator(0, n => {
      return n >= 0 && Math.floor(n) === n;
    });

    let specdAdd = spec.fn([natural, natural], (a, b) => {
      return a + b;
    });

    it("should set defaults when no args are passed", function() {
      expect(specdAdd()).toBe(0);
    });

    it("should set missing 2nd arg", function() {
      expect(specdAdd(1)).toBe(1);
    });

    it("should set missing 1st arg", function() {
      expect(specdAdd(undefined, 1)).toBe(1);
    });

    it("should verify that both args are used when specified", function() {
      expect(specdAdd(1, 2)).toBe(3);
    });

    it("should replace non-natural 1st arg with default natural value 0", function() {
      expect(specdAdd(-1, 2)).toBe(2);
    });

    it("should replace non-natural 2nd arg with default natural value 0", function() {
      expect(specdAdd(2, -1)).toBe(2);
    });

    it("should replace both non-natural args with default natural value 0", function() {
      expect(specdAdd(-1, -1)).toBe(0);
    });
  });
});
