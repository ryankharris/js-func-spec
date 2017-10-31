"use strict";

const spec = require("../../index");

describe("js-func-spec", function() {
  it("should throw error when literalArray.length !== function params length", function() {
    function mockFn(a) {
      /*pass*/
    }
    let msg =
      "Error: literalArray length does not match # of params in function-definition";
    let boundFn = spec.fn.bind(null, [1, 2], mockFn);
    expect(boundFn).toThrow(msg);
  });

  it("should throw error when spec'd function receives invalid # of args", function() {
    function mockFn(a) {
      /*pass*/
    }
    let msg = `Error: expected 1 args, received 0`;
    let myFn = spec.fn([1], mockFn);
    expect(myFn).toThrow(msg);
  });

  it("should generate a validator function with expected properties", function() {
    function mockFn1(arg) {
      return true;
    }
    let validator1 = spec.validator(1, mockFn1);
    expect(validator1.validator).toBe(true);
    expect(validator1.type).toBe("number");
    expect(validator1.literal).toBe(1);

    function mockFn2(arg) {
      return true;
    }
    let validator2 = spec.validator("hi", mockFn2);
    expect(validator2.validator).toBe(true);
    expect(validator2.type).toBe("string");
    expect(validator2.literal).toBe("hi");
  });

  it("should throw an error when validator() receives invalid literal", function() {
    function mockFn(arg) {
      return true;
    }
    let v = spec.validator.bind(null, null, mockFn);
    let msg = "Error: validator() expects non-null type argument at index 0";
    expect(v).toThrow(msg);
  });

  it("should throw an error when validator() receives invalid function-definition", function() {
    let v = spec.validator.bind(null, 1, true);
    let msg = "Error: validator() expects function type argument at index 1";
    expect(v).toThrow(msg);
  });

  it("should throw an error when validator() args validationFn(literal) is {boolean} false", function() {
    function mockFn(arg) {
      return typeof arg === "string";
    }
    let v = spec.validator.bind(null, 1, mockFn);
    let msg =
      "Error: validator requires that validationFn(literal) returns {boolean} true";
    expect(v).toThrow(msg);
  });
}); // end describe
