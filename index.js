"use strict";

// project: js-func-spec
// author: Ryan K Harris
// description: A function specification library that aims to provide run-time
//    type-enforcement, intentional type-coercion, default param values,
//    pre-condition and post-condition validation, doc-strings, useful error
//    messages, possible doc-tests, etc.

const ENV = process.env.NODE_ENV || "development";

// 'production' ENV exports
exports.fn = fn;
exports.validator = validator;

// additional 'test' ENV exports
if (ENV === "test") {
  exports.invalidTypeException = invalidTypeException;
  exports.getType = getType;
  exports.typeCheck = typeCheck;
  exports.validate = validate;
  exports.coerce = coerce;
  exports.balanceLengths = balanceLengths;
  exports.parseSpecArgs = parseSpecArgs;
  exports.specCheck = specCheck;
  exports.buildDocString = buildDocString;
}

/**
@desc build exception object
@param {string} fnName of the fnDef
@param {string} expectedType of the arg
@param {string} actualType of the arg
@param {number} index of the arg in the collection of arguments
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
@desc compares expected type to arg type, and conditionally passes control to validate or coerce
@param {string} fnName of the fnDef
@param {Function} validator used to validate the given arg
@param {*} arg passed to the generated fn
@param {string} argType is a string indicating type, such as 'number' or 'boolean'
@param {number} index of the given arg within the argument collection
@return {*} curated arg
*/
function typeCheck(fnName, validator, arg, argType, index) {
  if (argType === validator.type) {
    // correct, goto validate
    return validate(fnName, validator, arg, argType, index);
  }
  // else, goto coerce
  return coerce(fnName, validator, arg, argType, index);
} // end typeCheck

/**
@desc given a validator, use it to test an associated arg
@param {string} fnName of the fnDef
@param {Function} validator used to validate the given arg
@param {*} arg passed to the generated fn
@param {string} argType is a string indicating type, such as 'number' or 'boolean'
@param {number} index of the given arg within the argument collection
@return {*} curated arg
*/
function validate(fnName, validator, arg, argType, index) {
  if (validator(arg)) {
    // if valid, return
    return arg;
  }
  // else, replace and return
  return validator.literal;
} // end validate

/**
FIXME
*/
function coerce(fnName, validator, arg, argType, index) {
  // coerce
  //   if coerced, goto validate
  //   else, replace & return | throw-if-preferred
  // FIXME
  // for now, coerce will simply replace & return
  // eventually, coercion rules will be implemented
  return validator.literal;
} // end coerce

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

/**
@desc determines how many args were passed to fn() and parses accordingly
@param {*[]} specArgs are the arguments passed to fn()
@return {*[]} of the form ['description', literalArray, fnDef]
*/
function parseSpecArgs(specArgs) {
  let argsLen = specArgs.length;
  let argsTypes = specArgs.map(v => {
    return getType(v);
  });

  if (argsLen < 2 || argsLen > 3) {
    throw new Error("Insufficient # of arguments passed to spec()");
  }

  // TODO make the following conditions throw more specific errors,
  // i.e. throw an error when functionDef is missing, or literalArray invalid
  if (
    argsLen === 2 &&
    argsTypes[0] === "array" &&
    argsTypes[1] === "function"
  ) {
    return ["", specArgs[0], specArgs[1]];
  } else if (
    argsLen === 3 &&
    argsTypes[0] === "string" &&
    argsTypes[1] === "array" &&
    argsTypes[2] === "function"
  ) {
    return specArgs;
  }

  throw new Error("Invalid arg types passed to fn()");
} // end parseSpecArgs

/**
@desc balances the lengths of two arrays
@param {*[]} arr1 to compare
@param {*[]} arr2 to compare
@return {[number, *[], *[]]} array of [length, altArr1, altArr2]
*/
function balanceLengths(arr1, arr2) {
  let arr2Len = arr2.length;
  let arr1Len = arr1.length;

  if (arr2Len >= arr1Len) {
    arr1 = arr1.concat(Array(arr2Len - arr1Len));
  } else {
    arr2 = arr2.concat(Array(arr1Len - arr2Len));
    arr2Len = arr2.length;
  }

  return [arr2Len, arr1, arr2];
} // end balanceLengths

/**
@desc validates arguments passed to spec'd function
@param {string} fnName is the name of the function-definition
@param {*[]} literalArray contains literal values indicating default vals
@param {*} arg to evaluate
@param {number} index within the array of arguments
@return {*} curated arg
*/
function specCheck(fnName, literal, arg, index) {
  /*
  specCheck logic flow:
  The following workflow applies to validators and non-validators in
  the literalArray.

  type-check
    if correct, goto validate
    else, goto coerce | throw-if-preferred
  coerce
    if coerced, goto validate
    else, replace & return | throw-if-preferred
  validate
    if valid, return
    else, replace & return | throw-if-preferred
  */

  let literalType = getType(literal);
  let argType = getType(arg);

  if (literalType === "undefined") {
    // indicates user did not want to spec this param, or there were
    // more arguments supplied to the function than are spec'd.
    // If the arg is null or undefined itself, that is what will be returned
    // and that is the responsibility of the user. If they wanted the lib
    // to coerce/correct this for them, they need to provide a spec for the
    // arg.
    return arg;
  }

  if (argType === "undefined") {
    // indicates that there were more literals provided to the spec than
    // arguments supplied to the spec'd function, meaning, use literals
    // as default values
    if (literalType === "function" && literal.validator) {
      // if a validator was supplied, use it's literal property
      return literal.literal;
    }
    return literal;
  }

  // if a js-func-spec validator function was passed in literalArray, pass it to typeCheck
  if (literalType === "function" && literal.validator) {
    return typeCheck(fnName, literal, arg, argType, index);
  }
  // else, build validator, then typeCheck
  let validator = arg => true;
  validator.type = literalType;
  validator.literal = literal;
  return typeCheck(fnName, validator, arg, argType, index);
} // end specCheck

/**
@desc produce doc-string for the generated function
@param {string} fnName of the generated function
@param {string} description of the generated function
@param {*[]} literalArray of specs
@return {string} doc-string attached to the generated function as property 'doc'
*/
function buildDocString(funcName, description, literalArray) {
  let doc = `function: ${funcName}\ndescription: ${description}\nparameters:\n`;
  literalArray.forEach((literal, index) => {
    doc += `\t${index}: {${getType(literal)}}\n`;
  });

  return doc;
} // end buildDocString

/**
@desc Used to spec a function
@param {string} [description=''] of the fn being defined, for doc-string
@param {*[]} literalArray containing a literal value for each param of the function-definition
@param {Function} fnDef wrapped in the specification code
@return {Function}
*/
function fn(...specArgs) {
  let _;
  let [description, literalArray, functionDef] = parseSpecArgs(specArgs);
  let funcName = functionDef.name;

  [_, literalArray, _] = balanceLengths(
    literalArray,
    Array(functionDef.length)
  );

  let typedFunc = function(...args) {
    let i;
    [i, literalArray, args] = balanceLengths(literalArray, args);
    let argList = args.slice();

    while (i--) {
      argList[i] = specCheck(funcName, literalArray[i], args[i], i);
    }

    return functionDef.apply(this, argList);
  };

  typedFunc.doc = buildDocString(funcName, description, literalArray);

  return typedFunc;
} // end fn
