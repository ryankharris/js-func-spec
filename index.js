#!/usr/bin/env node
"use strict";

// project: js-func-spec
// author: Ryan K Harris
// description: A function specification library that aims to provide run-time
//    type-enforcement, intentional type-coercion, default param values,
//    pre-condition and post-condition validation, doc-strings, useful error
//    messages, etc.

const ENV = process.env.NODE_ENV || "development";

// 'production' ENV exports
exports.fn = fn;
exports.validator = validator;

// additional 'test' ENV exports
if (ENV === "test") {
  exports.invalidTypeException = invalidTypeException;
  exports.getType = getType;
}

/**
FIXME
*/
function invalidTypeException(fnName, expectedType, actualType, index) {
  let msg = `${fnName} excpected argument type ${expectedType} at index ${index}, received type ${actualType}`;
  return {
    message: msg,
    name: "InvalidType"
  };
} // invalidTypeException

/**
@desc determines the type of the passed arg
@param {any} specEntity to infer type of
@return {string} describing the type
*/
function getType(specEntity) {
  return Object.prototype.toString
    .call(specEntity)
    .slice(8, -1)
    .toLowerCase();
} // end getType

/**
FIXME
*/
function validate(fnName, literal, expectedType, arg, argType, index) {
  // FIXME
} // end validate

/**
FIXME
*/
function coerce(fnName, literal, expectedType, arg, argType, index) {
  // FIXME
  return true;
} // end coerce

/**
@desc validates arguments passed to spec'd function
@param {string} fnName is the name of the function-definition
@param {*[]} literalArray contains literal values indicating default vals
@param {string[]} typeArray contains strings for each argument indicating expected type
@param {*} arg to evaluate
@param {number} index within the array of arguments
@return {*[]} Array of curated args
*/
function specCheck(fnName, literalArray, typeArray, arg, index) {
  // specCheck logic flow:

  /*
  The following workflow applies to validators and non-validators in
  the literalArray.

  type-check
    if correct, goto validate
    else, goto coerce | throw-if-preferred
  coerce
    if coerced, goto validate
    else, replace & return | throw-if-preferred
  validate
    if validator
      if valid, return
      else, replace & return | throw-if-preferred
    else, return
  */

  let expectedType = typeArray[index];
  let argType = getType(arg);

  // if a js-func-spec validator function was passed in literalArray, then validate
  if (expectedType === "function" && literalArray[index].validator) {
    return (argType === literalArray[index].type)? validate(fnName, literalArray[index], expectedType, arg, argType, index):
  }

  return argType === expectedType
    ? validate(fnName, literalArray[index], expectedType, arg, argType, index)
    : coerce(fnName, literalArray[index], expectedType, arg, argType, index);
} // end specCheck

/**
@desc generates a validator function which can be passed within the literalArray of fn()
@param {*} literal used to infer the type and default value of an argument
@param {Function} validationFn used to ensure an eventual argument is valid
@return {boolean} true if the argument is valid, false otherwise
*/
function validator(literal = null, validationFn = null) {
  let literalType = getType(literal);
  if (literalType === "undefined" || literalType === "null") {
    throw "Error: validator() expects non-null type argument at index 0";
  }
  let validationFnType = getType(validationFn);
  if (validationFnType !== "function") {
    throw "Error: validator() expects function type argument at index 1";
  }

  let expectedType = getType(literal);
  if (validationFn(literal) === true) {
    // verify that the literal passes the validationFn,
    // and that the response is boolean true
    let validatorFunc = validationFn;
    validatorFunc.validator = true;
    validatorFunc.type = expectedType;
    validatorFunc.literal = literal;
    return validatorFunc;
  }
  throw "Error: validator requires that validationFn(literal) returns {boolean} true";
} // end validator

// @param {string} [description=''] doc-strings
/**
@desc Used to spec a function
@param {*[]} literalArray containing a literal value for each param of the function-definition
@param {Function} fnDef wrapped in the specification code
@return {Function}
*/
function fn(literalArray, fnDef) {
  if (literalArray.length !== fnDef.length) {
    throw "Error: literalArray length does not match # of params in function-definition";
  }

  let typeArray = literalArray.map(getType);
  let fnName = fnDef.name;
  let boundSpecCheck = specCheck.bind(null, fnName, literalArray, typeArray);

  return function() {
    if (arguments.length !== literalArray.length) {
      throw `Error: expected ${literalArray.length} args, received ${arguments.length}`;
    }

    let args = Array.from(arguments, boundSpecCheck);
    return fnDef.apply(this, args);
  };
} // end fn
