(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const headers = { '0x-api-key': 'dfba8a68-afa1-486e-b91c-60f87f4218c1' }//API KEY


const qs = require('qs');
const { default: BigNumber } = require('bignumber.js')
const Web3 = require('web3');

let currentTrade = {};
let currentSelectSide;
let tokens;

async function init() {
    await listAvailableTokens();
}

async function listAvailableTokens() {
    console.log("initializing");
    let response = await fetch('https://tokens.coingecko.com/uniswap/all.json');
    let tokenListJSON = await response.json();
    console.log("listing available tokens");
    console.log(tokenListJSON);
    tokens = tokenListJSON.tokens
    console.log("tokens:", tokens);


    let parent = document.getElementById("token_list");
    for (const i in tokens) {

        let div = document.createElement("div");
        div.className = "token_row";
        let html = `
    <img class="token_list_img" src="${tokens[i].logoURI}">
      <span class="token_list_text">${tokens[i].symbol}</span>
      `;
        div.innerHTML = html;
        div.onclick = () => {
            selectToken(tokens[i]);
        };
        parent.appendChild(div);
    }
}

function selectToken(token) {
    closeModal();
    currentTrade[currentSelectSide] = token;
    console.log("currentTrade:", currentTrade);
    renderInterface();
}

function renderInterface() {
    if (currentTrade.from) {
        console.log(currentTrade.from)
        document.getElementById("from_token_img").src = currentTrade.from.logoURI;
        document.getElementById("from_token_text").innerHTML = currentTrade.from.symbol;
    }
    if (currentTrade.to) {
        document.getElementById("to_token_img").src = currentTrade.to.logoURI;
        document.getElementById("to_token_text").innerHTML = currentTrade.to.symbol;
    }

}

async function connect() {
    if (typeof window.ethereum !== "undefined") {
        try {
            console.log("connecting");
            await ethereum.request({ method: "eth_requestAccounts" });
        } catch (error) {
            console.log(error);
        }
        document.getElementById("login_button").innerHTML = "Connected";
        // const accounts = await ethereum.request({ method: "eth_accounts" });
        document.getElementById("swap_button").disabled = false;
    } else {
        document.getElementById("login_button").innerHTML =
            "Please install MetaMask";
    }
}

function openModal(side) {
    currentSelectSide = side;
    document.getElementById("token_modal").style.display = "block";
}

function closeModal() {
    document.getElementById("token_modal").style.display = "none";
}

async function getPrice() {
    console.log("Getting Price");

    if (!currentTrade.from || !currentTrade.to || !document.getElementById("from_amount").value) return;
    let amount = Number(document.getElementById("from_amount").value * 10 ** currentTrade.from.decimals);

    const params = {
        sellToken: currentTrade.from.address,
        buyToken: currentTrade.to.address,
        sellAmount: amount,
    }



    const response = await fetch(`https://api.0x.org/swap/v1/price?${qs.stringify(params)}`, { headers: headers });
    swapPriceJSON = await response.json();
    console.log("Price: ", swapPriceJSON);

    document.getElementById("to_amount").value = swapPriceJSON.buyAmount / (10 ** currentTrade.to.decimals);
    document.getElementById("gas_estimate").innerHTML = swapPriceJSON.estimatedGas;
}

async function getQuote(account) {
    console.log("Getting Price");

    if (!currentTrade.from || !currentTrade.to || !document.getElementById("from_amount").value) return;
    let amount = Number(document.getElementById("from_amount").value * 10 ** currentTrade.from.decimals);

    const params = {
        sellToken: currentTrade.from.address,
        buyToken: currentTrade.to.address,
        sellAmount: amount,
        takerAddress: account
    }


    const response = await fetch(`https://api.0x.org/swap/v1/quote?${qs.stringify(params)}`, { headers: headers });
    swapQuoteJSON = await response.json();
    console.log("Quote: ", swapQuoteJSON);

    document.getElementById("to_amount").value = swapQuoteJSON.buyAmount / (10 ** currentTrade.to.decimals);
    document.getElementById("gas_estimate").innerHTML = swapQuoteJSON.estimatedGas;

    return swapQuoteJSON;
}

async function trySwap() {

    let accounts = await ethereum.request({ method: 'eth_accounts' })
    let takerAddress = accounts[0]

    console.log("takerAdress: ", takerAddress)

    const swapQuoteJSON = await getQuote(takerAddress)

    const web3 = new Web3(Web3.givenProvider)
    const fromTokenAddress = currentTrade.from.address
    const erc20abi = [
        {
            "constant": true,
            "inputs": [],
            "name": "name",
            "outputs": [
                {
                    "name": "",
                    "type": "string"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [
                {
                    "name": "_spender",
                    "type": "address"
                },
                {
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "approve",
            "outputs": [
                {
                    "name": "",
                    "type": "bool"
                }
            ],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "totalSupply",
            "outputs": [
                {
                    "name": "",
                    "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [
                {
                    "name": "_from",
                    "type": "address"
                },
                {
                    "name": "_to",
                    "type": "address"
                },
                {
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "transferFrom",
            "outputs": [
                {
                    "name": "",
                    "type": "bool"
                }
            ],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "decimals",
            "outputs": [
                {
                    "name": "",
                    "type": "uint8"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [
                {
                    "name": "_owner",
                    "type": "address"
                }
            ],
            "name": "balanceOf",
            "outputs": [
                {
                    "name": "balance",
                    "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "symbol",
            "outputs": [
                {
                    "name": "",
                    "type": "string"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [
                {
                    "name": "_to",
                    "type": "address"
                },
                {
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "transfer",
            "outputs": [
                {
                    "name": "",
                    "type": "bool"
                }
            ],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [
                {
                    "name": "_owner",
                    "type": "address"
                },
                {
                    "name": "_spender",
                    "type": "address"
                }
            ],
            "name": "allowance",
            "outputs": [
                {
                    "name": "",
                    "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "payable": true,
            "stateMutability": "payable",
            "type": "fallback"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "name": "owner",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "name": "spender",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "name": "value",
                    "type": "uint256"
                }
            ],
            "name": "Approval",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "name": "from",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "name": "to",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "name": "value",
                    "type": "uint256"
                }
            ],
            "name": "Transfer",
            "type": "event"
        }
    ]
    const ERC20TokenContract = new Web3.eth.Contract(erc20abi, fromTokenAddress)
    console.log("set up ERC20TokenCOntracts:", ERC20TokenContract)

    const maxApproval = new BigNumber(2).pow(256).minus(1)
    ERC20TokenContract.methods.approve(swapQuoteJSON.allowanceTarget, maxApproval)
        .send({ from: takerAddress })
        .then(tx => { console.log("tx: ", tx) })

    const receipt = await web3.eth.sendTransaction(swapQuoteJSON)
    console.log("receipt :", receipt)

}

init();

document.getElementById("login_button").onclick = connect;
document.getElementById("from_token_select").onclick = () => {
    openModal("from");
};
document.getElementById("to_token_select").onclick = () => {
    openModal("to");
};
document.getElementById("modal_close").onclick = closeModal;
document.getElementById("from_amount").oninput = getPrice;
document.getElementById("swap_button").onclick = trySwap;




},{"bignumber.js":2,"qs":25,"web3":31}],2:[function(require,module,exports){
;(function (globalObject) {
  'use strict';

/*
 *      bignumber.js v9.1.2
 *      A JavaScript library for arbitrary-precision arithmetic.
 *      https://github.com/MikeMcl/bignumber.js
 *      Copyright (c) 2022 Michael Mclaughlin <M8ch88l@gmail.com>
 *      MIT Licensed.
 *
 *      BigNumber.prototype methods     |  BigNumber methods
 *                                      |
 *      absoluteValue            abs    |  clone
 *      comparedTo                      |  config               set
 *      decimalPlaces            dp     |      DECIMAL_PLACES
 *      dividedBy                div    |      ROUNDING_MODE
 *      dividedToIntegerBy       idiv   |      EXPONENTIAL_AT
 *      exponentiatedBy          pow    |      RANGE
 *      integerValue                    |      CRYPTO
 *      isEqualTo                eq     |      MODULO_MODE
 *      isFinite                        |      POW_PRECISION
 *      isGreaterThan            gt     |      FORMAT
 *      isGreaterThanOrEqualTo   gte    |      ALPHABET
 *      isInteger                       |  isBigNumber
 *      isLessThan               lt     |  maximum              max
 *      isLessThanOrEqualTo      lte    |  minimum              min
 *      isNaN                           |  random
 *      isNegative                      |  sum
 *      isPositive                      |
 *      isZero                          |
 *      minus                           |
 *      modulo                   mod    |
 *      multipliedBy             times  |
 *      negated                         |
 *      plus                            |
 *      precision                sd     |
 *      shiftedBy                       |
 *      squareRoot               sqrt   |
 *      toExponential                   |
 *      toFixed                         |
 *      toFormat                        |
 *      toFraction                      |
 *      toJSON                          |
 *      toNumber                        |
 *      toPrecision                     |
 *      toString                        |
 *      valueOf                         |
 *
 */


  var BigNumber,
    isNumeric = /^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i,
    mathceil = Math.ceil,
    mathfloor = Math.floor,

    bignumberError = '[BigNumber Error] ',
    tooManyDigits = bignumberError + 'Number primitive has more than 15 significant digits: ',

    BASE = 1e14,
    LOG_BASE = 14,
    MAX_SAFE_INTEGER = 0x1fffffffffffff,         // 2^53 - 1
    // MAX_INT32 = 0x7fffffff,                   // 2^31 - 1
    POWS_TEN = [1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13],
    SQRT_BASE = 1e7,

    // EDITABLE
    // The limit on the value of DECIMAL_PLACES, TO_EXP_NEG, TO_EXP_POS, MIN_EXP, MAX_EXP, and
    // the arguments to toExponential, toFixed, toFormat, and toPrecision.
    MAX = 1E9;                                   // 0 to MAX_INT32


  /*
   * Create and return a BigNumber constructor.
   */
  function clone(configObject) {
    var div, convertBase, parseNumeric,
      P = BigNumber.prototype = { constructor: BigNumber, toString: null, valueOf: null },
      ONE = new BigNumber(1),


      //----------------------------- EDITABLE CONFIG DEFAULTS -------------------------------


      // The default values below must be integers within the inclusive ranges stated.
      // The values can also be changed at run-time using BigNumber.set.

      // The maximum number of decimal places for operations involving division.
      DECIMAL_PLACES = 20,                     // 0 to MAX

      // The rounding mode used when rounding to the above decimal places, and when using
      // toExponential, toFixed, toFormat and toPrecision, and round (default value).
      // UP         0 Away from zero.
      // DOWN       1 Towards zero.
      // CEIL       2 Towards +Infinity.
      // FLOOR      3 Towards -Infinity.
      // HALF_UP    4 Towards nearest neighbour. If equidistant, up.
      // HALF_DOWN  5 Towards nearest neighbour. If equidistant, down.
      // HALF_EVEN  6 Towards nearest neighbour. If equidistant, towards even neighbour.
      // HALF_CEIL  7 Towards nearest neighbour. If equidistant, towards +Infinity.
      // HALF_FLOOR 8 Towards nearest neighbour. If equidistant, towards -Infinity.
      ROUNDING_MODE = 4,                       // 0 to 8

      // EXPONENTIAL_AT : [TO_EXP_NEG , TO_EXP_POS]

      // The exponent value at and beneath which toString returns exponential notation.
      // Number type: -7
      TO_EXP_NEG = -7,                         // 0 to -MAX

      // The exponent value at and above which toString returns exponential notation.
      // Number type: 21
      TO_EXP_POS = 21,                         // 0 to MAX

      // RANGE : [MIN_EXP, MAX_EXP]

      // The minimum exponent value, beneath which underflow to zero occurs.
      // Number type: -324  (5e-324)
      MIN_EXP = -1e7,                          // -1 to -MAX

      // The maximum exponent value, above which overflow to Infinity occurs.
      // Number type:  308  (1.7976931348623157e+308)
      // For MAX_EXP > 1e7, e.g. new BigNumber('1e100000000').plus(1) may be slow.
      MAX_EXP = 1e7,                           // 1 to MAX

      // Whether to use cryptographically-secure random number generation, if available.
      CRYPTO = false,                          // true or false

      // The modulo mode used when calculating the modulus: a mod n.
      // The quotient (q = a / n) is calculated according to the corresponding rounding mode.
      // The remainder (r) is calculated as: r = a - n * q.
      //
      // UP        0 The remainder is positive if the dividend is negative, else is negative.
      // DOWN      1 The remainder has the same sign as the dividend.
      //             This modulo mode is commonly known as 'truncated division' and is
      //             equivalent to (a % n) in JavaScript.
      // FLOOR     3 The remainder has the same sign as the divisor (Python %).
      // HALF_EVEN 6 This modulo mode implements the IEEE 754 remainder function.
      // EUCLID    9 Euclidian division. q = sign(n) * floor(a / abs(n)).
      //             The remainder is always positive.
      //
      // The truncated division, floored division, Euclidian division and IEEE 754 remainder
      // modes are commonly used for the modulus operation.
      // Although the other rounding modes can also be used, they may not give useful results.
      MODULO_MODE = 1,                         // 0 to 9

      // The maximum number of significant digits of the result of the exponentiatedBy operation.
      // If POW_PRECISION is 0, there will be unlimited significant digits.
      POW_PRECISION = 0,                       // 0 to MAX

      // The format specification used by the BigNumber.prototype.toFormat method.
      FORMAT = {
        prefix: '',
        groupSize: 3,
        secondaryGroupSize: 0,
        groupSeparator: ',',
        decimalSeparator: '.',
        fractionGroupSize: 0,
        fractionGroupSeparator: '\xA0',        // non-breaking space
        suffix: ''
      },

      // The alphabet used for base conversion. It must be at least 2 characters long, with no '+',
      // '-', '.', whitespace, or repeated character.
      // '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_'
      ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz',
      alphabetHasNormalDecimalDigits = true;


    //------------------------------------------------------------------------------------------


    // CONSTRUCTOR


    /*
     * The BigNumber constructor and exported function.
     * Create and return a new instance of a BigNumber object.
     *
     * v {number|string|BigNumber} A numeric value.
     * [b] {number} The base of v. Integer, 2 to ALPHABET.length inclusive.
     */
    function BigNumber(v, b) {
      var alphabet, c, caseChanged, e, i, isNum, len, str,
        x = this;

      // Enable constructor call without `new`.
      if (!(x instanceof BigNumber)) return new BigNumber(v, b);

      if (b == null) {

        if (v && v._isBigNumber === true) {
          x.s = v.s;

          if (!v.c || v.e > MAX_EXP) {
            x.c = x.e = null;
          } else if (v.e < MIN_EXP) {
            x.c = [x.e = 0];
          } else {
            x.e = v.e;
            x.c = v.c.slice();
          }

          return;
        }

        if ((isNum = typeof v == 'number') && v * 0 == 0) {

          // Use `1 / n` to handle minus zero also.
          x.s = 1 / v < 0 ? (v = -v, -1) : 1;

          // Fast path for integers, where n < 2147483648 (2**31).
          if (v === ~~v) {
            for (e = 0, i = v; i >= 10; i /= 10, e++);

            if (e > MAX_EXP) {
              x.c = x.e = null;
            } else {
              x.e = e;
              x.c = [v];
            }

            return;
          }

          str = String(v);
        } else {

          if (!isNumeric.test(str = String(v))) return parseNumeric(x, str, isNum);

          x.s = str.charCodeAt(0) == 45 ? (str = str.slice(1), -1) : 1;
        }

        // Decimal point?
        if ((e = str.indexOf('.')) > -1) str = str.replace('.', '');

        // Exponential form?
        if ((i = str.search(/e/i)) > 0) {

          // Determine exponent.
          if (e < 0) e = i;
          e += +str.slice(i + 1);
          str = str.substring(0, i);
        } else if (e < 0) {

          // Integer.
          e = str.length;
        }

      } else {

        // '[BigNumber Error] Base {not a primitive number|not an integer|out of range}: {b}'
        intCheck(b, 2, ALPHABET.length, 'Base');

        // Allow exponential notation to be used with base 10 argument, while
        // also rounding to DECIMAL_PLACES as with other bases.
        if (b == 10 && alphabetHasNormalDecimalDigits) {
          x = new BigNumber(v);
          return round(x, DECIMAL_PLACES + x.e + 1, ROUNDING_MODE);
        }

        str = String(v);

        if (isNum = typeof v == 'number') {

          // Avoid potential interpretation of Infinity and NaN as base 44+ values.
          if (v * 0 != 0) return parseNumeric(x, str, isNum, b);

          x.s = 1 / v < 0 ? (str = str.slice(1), -1) : 1;

          // '[BigNumber Error] Number primitive has more than 15 significant digits: {n}'
          if (BigNumber.DEBUG && str.replace(/^0\.0*|\./, '').length > 15) {
            throw Error
             (tooManyDigits + v);
          }
        } else {
          x.s = str.charCodeAt(0) === 45 ? (str = str.slice(1), -1) : 1;
        }

        alphabet = ALPHABET.slice(0, b);
        e = i = 0;

        // Check that str is a valid base b number.
        // Don't use RegExp, so alphabet can contain special characters.
        for (len = str.length; i < len; i++) {
          if (alphabet.indexOf(c = str.charAt(i)) < 0) {
            if (c == '.') {

              // If '.' is not the first character and it has not be found before.
              if (i > e) {
                e = len;
                continue;
              }
            } else if (!caseChanged) {

              // Allow e.g. hexadecimal 'FF' as well as 'ff'.
              if (str == str.toUpperCase() && (str = str.toLowerCase()) ||
                  str == str.toLowerCase() && (str = str.toUpperCase())) {
                caseChanged = true;
                i = -1;
                e = 0;
                continue;
              }
            }

            return parseNumeric(x, String(v), isNum, b);
          }
        }

        // Prevent later check for length on converted number.
        isNum = false;
        str = convertBase(str, b, 10, x.s);

        // Decimal point?
        if ((e = str.indexOf('.')) > -1) str = str.replace('.', '');
        else e = str.length;
      }

      // Determine leading zeros.
      for (i = 0; str.charCodeAt(i) === 48; i++);

      // Determine trailing zeros.
      for (len = str.length; str.charCodeAt(--len) === 48;);

      if (str = str.slice(i, ++len)) {
        len -= i;

        // '[BigNumber Error] Number primitive has more than 15 significant digits: {n}'
        if (isNum && BigNumber.DEBUG &&
          len > 15 && (v > MAX_SAFE_INTEGER || v !== mathfloor(v))) {
            throw Error
             (tooManyDigits + (x.s * v));
        }

         // Overflow?
        if ((e = e - i - 1) > MAX_EXP) {

          // Infinity.
          x.c = x.e = null;

        // Underflow?
        } else if (e < MIN_EXP) {

          // Zero.
          x.c = [x.e = 0];
        } else {
          x.e = e;
          x.c = [];

          // Transform base

          // e is the base 10 exponent.
          // i is where to slice str to get the first element of the coefficient array.
          i = (e + 1) % LOG_BASE;
          if (e < 0) i += LOG_BASE;  // i < 1

          if (i < len) {
            if (i) x.c.push(+str.slice(0, i));

            for (len -= LOG_BASE; i < len;) {
              x.c.push(+str.slice(i, i += LOG_BASE));
            }

            i = LOG_BASE - (str = str.slice(i)).length;
          } else {
            i -= len;
          }

          for (; i--; str += '0');
          x.c.push(+str);
        }
      } else {

        // Zero.
        x.c = [x.e = 0];
      }
    }


    // CONSTRUCTOR PROPERTIES


    BigNumber.clone = clone;

    BigNumber.ROUND_UP = 0;
    BigNumber.ROUND_DOWN = 1;
    BigNumber.ROUND_CEIL = 2;
    BigNumber.ROUND_FLOOR = 3;
    BigNumber.ROUND_HALF_UP = 4;
    BigNumber.ROUND_HALF_DOWN = 5;
    BigNumber.ROUND_HALF_EVEN = 6;
    BigNumber.ROUND_HALF_CEIL = 7;
    BigNumber.ROUND_HALF_FLOOR = 8;
    BigNumber.EUCLID = 9;


    /*
     * Configure infrequently-changing library-wide settings.
     *
     * Accept an object with the following optional properties (if the value of a property is
     * a number, it must be an integer within the inclusive range stated):
     *
     *   DECIMAL_PLACES   {number}           0 to MAX
     *   ROUNDING_MODE    {number}           0 to 8
     *   EXPONENTIAL_AT   {number|number[]}  -MAX to MAX  or  [-MAX to 0, 0 to MAX]
     *   RANGE            {number|number[]}  -MAX to MAX (not zero)  or  [-MAX to -1, 1 to MAX]
     *   CRYPTO           {boolean}          true or false
     *   MODULO_MODE      {number}           0 to 9
     *   POW_PRECISION       {number}           0 to MAX
     *   ALPHABET         {string}           A string of two or more unique characters which does
     *                                       not contain '.'.
     *   FORMAT           {object}           An object with some of the following properties:
     *     prefix                 {string}
     *     groupSize              {number}
     *     secondaryGroupSize     {number}
     *     groupSeparator         {string}
     *     decimalSeparator       {string}
     *     fractionGroupSize      {number}
     *     fractionGroupSeparator {string}
     *     suffix                 {string}
     *
     * (The values assigned to the above FORMAT object properties are not checked for validity.)
     *
     * E.g.
     * BigNumber.config({ DECIMAL_PLACES : 20, ROUNDING_MODE : 4 })
     *
     * Ignore properties/parameters set to null or undefined, except for ALPHABET.
     *
     * Return an object with the properties current values.
     */
    BigNumber.config = BigNumber.set = function (obj) {
      var p, v;

      if (obj != null) {

        if (typeof obj == 'object') {

          // DECIMAL_PLACES {number} Integer, 0 to MAX inclusive.
          // '[BigNumber Error] DECIMAL_PLACES {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'DECIMAL_PLACES')) {
            v = obj[p];
            intCheck(v, 0, MAX, p);
            DECIMAL_PLACES = v;
          }

          // ROUNDING_MODE {number} Integer, 0 to 8 inclusive.
          // '[BigNumber Error] ROUNDING_MODE {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'ROUNDING_MODE')) {
            v = obj[p];
            intCheck(v, 0, 8, p);
            ROUNDING_MODE = v;
          }

          // EXPONENTIAL_AT {number|number[]}
          // Integer, -MAX to MAX inclusive or
          // [integer -MAX to 0 inclusive, 0 to MAX inclusive].
          // '[BigNumber Error] EXPONENTIAL_AT {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'EXPONENTIAL_AT')) {
            v = obj[p];
            if (v && v.pop) {
              intCheck(v[0], -MAX, 0, p);
              intCheck(v[1], 0, MAX, p);
              TO_EXP_NEG = v[0];
              TO_EXP_POS = v[1];
            } else {
              intCheck(v, -MAX, MAX, p);
              TO_EXP_NEG = -(TO_EXP_POS = v < 0 ? -v : v);
            }
          }

          // RANGE {number|number[]} Non-zero integer, -MAX to MAX inclusive or
          // [integer -MAX to -1 inclusive, integer 1 to MAX inclusive].
          // '[BigNumber Error] RANGE {not a primitive number|not an integer|out of range|cannot be zero}: {v}'
          if (obj.hasOwnProperty(p = 'RANGE')) {
            v = obj[p];
            if (v && v.pop) {
              intCheck(v[0], -MAX, -1, p);
              intCheck(v[1], 1, MAX, p);
              MIN_EXP = v[0];
              MAX_EXP = v[1];
            } else {
              intCheck(v, -MAX, MAX, p);
              if (v) {
                MIN_EXP = -(MAX_EXP = v < 0 ? -v : v);
              } else {
                throw Error
                 (bignumberError + p + ' cannot be zero: ' + v);
              }
            }
          }

          // CRYPTO {boolean} true or false.
          // '[BigNumber Error] CRYPTO not true or false: {v}'
          // '[BigNumber Error] crypto unavailable'
          if (obj.hasOwnProperty(p = 'CRYPTO')) {
            v = obj[p];
            if (v === !!v) {
              if (v) {
                if (typeof crypto != 'undefined' && crypto &&
                 (crypto.getRandomValues || crypto.randomBytes)) {
                  CRYPTO = v;
                } else {
                  CRYPTO = !v;
                  throw Error
                   (bignumberError + 'crypto unavailable');
                }
              } else {
                CRYPTO = v;
              }
            } else {
              throw Error
               (bignumberError + p + ' not true or false: ' + v);
            }
          }

          // MODULO_MODE {number} Integer, 0 to 9 inclusive.
          // '[BigNumber Error] MODULO_MODE {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'MODULO_MODE')) {
            v = obj[p];
            intCheck(v, 0, 9, p);
            MODULO_MODE = v;
          }

          // POW_PRECISION {number} Integer, 0 to MAX inclusive.
          // '[BigNumber Error] POW_PRECISION {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'POW_PRECISION')) {
            v = obj[p];
            intCheck(v, 0, MAX, p);
            POW_PRECISION = v;
          }

          // FORMAT {object}
          // '[BigNumber Error] FORMAT not an object: {v}'
          if (obj.hasOwnProperty(p = 'FORMAT')) {
            v = obj[p];
            if (typeof v == 'object') FORMAT = v;
            else throw Error
             (bignumberError + p + ' not an object: ' + v);
          }

          // ALPHABET {string}
          // '[BigNumber Error] ALPHABET invalid: {v}'
          if (obj.hasOwnProperty(p = 'ALPHABET')) {
            v = obj[p];

            // Disallow if less than two characters,
            // or if it contains '+', '-', '.', whitespace, or a repeated character.
            if (typeof v == 'string' && !/^.?$|[+\-.\s]|(.).*\1/.test(v)) {
              alphabetHasNormalDecimalDigits = v.slice(0, 10) == '0123456789';
              ALPHABET = v;
            } else {
              throw Error
               (bignumberError + p + ' invalid: ' + v);
            }
          }

        } else {

          // '[BigNumber Error] Object expected: {v}'
          throw Error
           (bignumberError + 'Object expected: ' + obj);
        }
      }

      return {
        DECIMAL_PLACES: DECIMAL_PLACES,
        ROUNDING_MODE: ROUNDING_MODE,
        EXPONENTIAL_AT: [TO_EXP_NEG, TO_EXP_POS],
        RANGE: [MIN_EXP, MAX_EXP],
        CRYPTO: CRYPTO,
        MODULO_MODE: MODULO_MODE,
        POW_PRECISION: POW_PRECISION,
        FORMAT: FORMAT,
        ALPHABET: ALPHABET
      };
    };


    /*
     * Return true if v is a BigNumber instance, otherwise return false.
     *
     * If BigNumber.DEBUG is true, throw if a BigNumber instance is not well-formed.
     *
     * v {any}
     *
     * '[BigNumber Error] Invalid BigNumber: {v}'
     */
    BigNumber.isBigNumber = function (v) {
      if (!v || v._isBigNumber !== true) return false;
      if (!BigNumber.DEBUG) return true;

      var i, n,
        c = v.c,
        e = v.e,
        s = v.s;

      out: if ({}.toString.call(c) == '[object Array]') {

        if ((s === 1 || s === -1) && e >= -MAX && e <= MAX && e === mathfloor(e)) {

          // If the first element is zero, the BigNumber value must be zero.
          if (c[0] === 0) {
            if (e === 0 && c.length === 1) return true;
            break out;
          }

          // Calculate number of digits that c[0] should have, based on the exponent.
          i = (e + 1) % LOG_BASE;
          if (i < 1) i += LOG_BASE;

          // Calculate number of digits of c[0].
          //if (Math.ceil(Math.log(c[0] + 1) / Math.LN10) == i) {
          if (String(c[0]).length == i) {

            for (i = 0; i < c.length; i++) {
              n = c[i];
              if (n < 0 || n >= BASE || n !== mathfloor(n)) break out;
            }

            // Last element cannot be zero, unless it is the only element.
            if (n !== 0) return true;
          }
        }

      // Infinity/NaN
      } else if (c === null && e === null && (s === null || s === 1 || s === -1)) {
        return true;
      }

      throw Error
        (bignumberError + 'Invalid BigNumber: ' + v);
    };


    /*
     * Return a new BigNumber whose value is the maximum of the arguments.
     *
     * arguments {number|string|BigNumber}
     */
    BigNumber.maximum = BigNumber.max = function () {
      return maxOrMin(arguments, -1);
    };


    /*
     * Return a new BigNumber whose value is the minimum of the arguments.
     *
     * arguments {number|string|BigNumber}
     */
    BigNumber.minimum = BigNumber.min = function () {
      return maxOrMin(arguments, 1);
    };


    /*
     * Return a new BigNumber with a random value equal to or greater than 0 and less than 1,
     * and with dp, or DECIMAL_PLACES if dp is omitted, decimal places (or less if trailing
     * zeros are produced).
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp}'
     * '[BigNumber Error] crypto unavailable'
     */
    BigNumber.random = (function () {
      var pow2_53 = 0x20000000000000;

      // Return a 53 bit integer n, where 0 <= n < 9007199254740992.
      // Check if Math.random() produces more than 32 bits of randomness.
      // If it does, assume at least 53 bits are produced, otherwise assume at least 30 bits.
      // 0x40000000 is 2^30, 0x800000 is 2^23, 0x1fffff is 2^21 - 1.
      var random53bitInt = (Math.random() * pow2_53) & 0x1fffff
       ? function () { return mathfloor(Math.random() * pow2_53); }
       : function () { return ((Math.random() * 0x40000000 | 0) * 0x800000) +
         (Math.random() * 0x800000 | 0); };

      return function (dp) {
        var a, b, e, k, v,
          i = 0,
          c = [],
          rand = new BigNumber(ONE);

        if (dp == null) dp = DECIMAL_PLACES;
        else intCheck(dp, 0, MAX);

        k = mathceil(dp / LOG_BASE);

        if (CRYPTO) {

          // Browsers supporting crypto.getRandomValues.
          if (crypto.getRandomValues) {

            a = crypto.getRandomValues(new Uint32Array(k *= 2));

            for (; i < k;) {

              // 53 bits:
              // ((Math.pow(2, 32) - 1) * Math.pow(2, 21)).toString(2)
              // 11111 11111111 11111111 11111111 11100000 00000000 00000000
              // ((Math.pow(2, 32) - 1) >>> 11).toString(2)
              //                                     11111 11111111 11111111
              // 0x20000 is 2^21.
              v = a[i] * 0x20000 + (a[i + 1] >>> 11);

              // Rejection sampling:
              // 0 <= v < 9007199254740992
              // Probability that v >= 9e15, is
              // 7199254740992 / 9007199254740992 ~= 0.0008, i.e. 1 in 1251
              if (v >= 9e15) {
                b = crypto.getRandomValues(new Uint32Array(2));
                a[i] = b[0];
                a[i + 1] = b[1];
              } else {

                // 0 <= v <= 8999999999999999
                // 0 <= (v % 1e14) <= 99999999999999
                c.push(v % 1e14);
                i += 2;
              }
            }
            i = k / 2;

          // Node.js supporting crypto.randomBytes.
          } else if (crypto.randomBytes) {

            // buffer
            a = crypto.randomBytes(k *= 7);

            for (; i < k;) {

              // 0x1000000000000 is 2^48, 0x10000000000 is 2^40
              // 0x100000000 is 2^32, 0x1000000 is 2^24
              // 11111 11111111 11111111 11111111 11111111 11111111 11111111
              // 0 <= v < 9007199254740992
              v = ((a[i] & 31) * 0x1000000000000) + (a[i + 1] * 0x10000000000) +
                 (a[i + 2] * 0x100000000) + (a[i + 3] * 0x1000000) +
                 (a[i + 4] << 16) + (a[i + 5] << 8) + a[i + 6];

              if (v >= 9e15) {
                crypto.randomBytes(7).copy(a, i);
              } else {

                // 0 <= (v % 1e14) <= 99999999999999
                c.push(v % 1e14);
                i += 7;
              }
            }
            i = k / 7;
          } else {
            CRYPTO = false;
            throw Error
             (bignumberError + 'crypto unavailable');
          }
        }

        // Use Math.random.
        if (!CRYPTO) {

          for (; i < k;) {
            v = random53bitInt();
            if (v < 9e15) c[i++] = v % 1e14;
          }
        }

        k = c[--i];
        dp %= LOG_BASE;

        // Convert trailing digits to zeros according to dp.
        if (k && dp) {
          v = POWS_TEN[LOG_BASE - dp];
          c[i] = mathfloor(k / v) * v;
        }

        // Remove trailing elements which are zero.
        for (; c[i] === 0; c.pop(), i--);

        // Zero?
        if (i < 0) {
          c = [e = 0];
        } else {

          // Remove leading elements which are zero and adjust exponent accordingly.
          for (e = -1 ; c[0] === 0; c.splice(0, 1), e -= LOG_BASE);

          // Count the digits of the first element of c to determine leading zeros, and...
          for (i = 1, v = c[0]; v >= 10; v /= 10, i++);

          // adjust the exponent accordingly.
          if (i < LOG_BASE) e -= LOG_BASE - i;
        }

        rand.e = e;
        rand.c = c;
        return rand;
      };
    })();


    /*
     * Return a BigNumber whose value is the sum of the arguments.
     *
     * arguments {number|string|BigNumber}
     */
    BigNumber.sum = function () {
      var i = 1,
        args = arguments,
        sum = new BigNumber(args[0]);
      for (; i < args.length;) sum = sum.plus(args[i++]);
      return sum;
    };


    // PRIVATE FUNCTIONS


    // Called by BigNumber and BigNumber.prototype.toString.
    convertBase = (function () {
      var decimal = '0123456789';

      /*
       * Convert string of baseIn to an array of numbers of baseOut.
       * Eg. toBaseOut('255', 10, 16) returns [15, 15].
       * Eg. toBaseOut('ff', 16, 10) returns [2, 5, 5].
       */
      function toBaseOut(str, baseIn, baseOut, alphabet) {
        var j,
          arr = [0],
          arrL,
          i = 0,
          len = str.length;

        for (; i < len;) {
          for (arrL = arr.length; arrL--; arr[arrL] *= baseIn);

          arr[0] += alphabet.indexOf(str.charAt(i++));

          for (j = 0; j < arr.length; j++) {

            if (arr[j] > baseOut - 1) {
              if (arr[j + 1] == null) arr[j + 1] = 0;
              arr[j + 1] += arr[j] / baseOut | 0;
              arr[j] %= baseOut;
            }
          }
        }

        return arr.reverse();
      }

      // Convert a numeric string of baseIn to a numeric string of baseOut.
      // If the caller is toString, we are converting from base 10 to baseOut.
      // If the caller is BigNumber, we are converting from baseIn to base 10.
      return function (str, baseIn, baseOut, sign, callerIsToString) {
        var alphabet, d, e, k, r, x, xc, y,
          i = str.indexOf('.'),
          dp = DECIMAL_PLACES,
          rm = ROUNDING_MODE;

        // Non-integer.
        if (i >= 0) {
          k = POW_PRECISION;

          // Unlimited precision.
          POW_PRECISION = 0;
          str = str.replace('.', '');
          y = new BigNumber(baseIn);
          x = y.pow(str.length - i);
          POW_PRECISION = k;

          // Convert str as if an integer, then restore the fraction part by dividing the
          // result by its base raised to a power.

          y.c = toBaseOut(toFixedPoint(coeffToString(x.c), x.e, '0'),
           10, baseOut, decimal);
          y.e = y.c.length;
        }

        // Convert the number as integer.

        xc = toBaseOut(str, baseIn, baseOut, callerIsToString
         ? (alphabet = ALPHABET, decimal)
         : (alphabet = decimal, ALPHABET));

        // xc now represents str as an integer and converted to baseOut. e is the exponent.
        e = k = xc.length;

        // Remove trailing zeros.
        for (; xc[--k] == 0; xc.pop());

        // Zero?
        if (!xc[0]) return alphabet.charAt(0);

        // Does str represent an integer? If so, no need for the division.
        if (i < 0) {
          --e;
        } else {
          x.c = xc;
          x.e = e;

          // The sign is needed for correct rounding.
          x.s = sign;
          x = div(x, y, dp, rm, baseOut);
          xc = x.c;
          r = x.r;
          e = x.e;
        }

        // xc now represents str converted to baseOut.

        // THe index of the rounding digit.
        d = e + dp + 1;

        // The rounding digit: the digit to the right of the digit that may be rounded up.
        i = xc[d];

        // Look at the rounding digits and mode to determine whether to round up.

        k = baseOut / 2;
        r = r || d < 0 || xc[d + 1] != null;

        r = rm < 4 ? (i != null || r) && (rm == 0 || rm == (x.s < 0 ? 3 : 2))
              : i > k || i == k &&(rm == 4 || r || rm == 6 && xc[d - 1] & 1 ||
               rm == (x.s < 0 ? 8 : 7));

        // If the index of the rounding digit is not greater than zero, or xc represents
        // zero, then the result of the base conversion is zero or, if rounding up, a value
        // such as 0.00001.
        if (d < 1 || !xc[0]) {

          // 1^-dp or 0
          str = r ? toFixedPoint(alphabet.charAt(1), -dp, alphabet.charAt(0)) : alphabet.charAt(0);
        } else {

          // Truncate xc to the required number of decimal places.
          xc.length = d;

          // Round up?
          if (r) {

            // Rounding up may mean the previous digit has to be rounded up and so on.
            for (--baseOut; ++xc[--d] > baseOut;) {
              xc[d] = 0;

              if (!d) {
                ++e;
                xc = [1].concat(xc);
              }
            }
          }

          // Determine trailing zeros.
          for (k = xc.length; !xc[--k];);

          // E.g. [4, 11, 15] becomes 4bf.
          for (i = 0, str = ''; i <= k; str += alphabet.charAt(xc[i++]));

          // Add leading zeros, decimal point and trailing zeros as required.
          str = toFixedPoint(str, e, alphabet.charAt(0));
        }

        // The caller will add the sign.
        return str;
      };
    })();


    // Perform division in the specified base. Called by div and convertBase.
    div = (function () {

      // Assume non-zero x and k.
      function multiply(x, k, base) {
        var m, temp, xlo, xhi,
          carry = 0,
          i = x.length,
          klo = k % SQRT_BASE,
          khi = k / SQRT_BASE | 0;

        for (x = x.slice(); i--;) {
          xlo = x[i] % SQRT_BASE;
          xhi = x[i] / SQRT_BASE | 0;
          m = khi * xlo + xhi * klo;
          temp = klo * xlo + ((m % SQRT_BASE) * SQRT_BASE) + carry;
          carry = (temp / base | 0) + (m / SQRT_BASE | 0) + khi * xhi;
          x[i] = temp % base;
        }

        if (carry) x = [carry].concat(x);

        return x;
      }

      function compare(a, b, aL, bL) {
        var i, cmp;

        if (aL != bL) {
          cmp = aL > bL ? 1 : -1;
        } else {

          for (i = cmp = 0; i < aL; i++) {

            if (a[i] != b[i]) {
              cmp = a[i] > b[i] ? 1 : -1;
              break;
            }
          }
        }

        return cmp;
      }

      function subtract(a, b, aL, base) {
        var i = 0;

        // Subtract b from a.
        for (; aL--;) {
          a[aL] -= i;
          i = a[aL] < b[aL] ? 1 : 0;
          a[aL] = i * base + a[aL] - b[aL];
        }

        // Remove leading zeros.
        for (; !a[0] && a.length > 1; a.splice(0, 1));
      }

      // x: dividend, y: divisor.
      return function (x, y, dp, rm, base) {
        var cmp, e, i, more, n, prod, prodL, q, qc, rem, remL, rem0, xi, xL, yc0,
          yL, yz,
          s = x.s == y.s ? 1 : -1,
          xc = x.c,
          yc = y.c;

        // Either NaN, Infinity or 0?
        if (!xc || !xc[0] || !yc || !yc[0]) {

          return new BigNumber(

           // Return NaN if either NaN, or both Infinity or 0.
           !x.s || !y.s || (xc ? yc && xc[0] == yc[0] : !yc) ? NaN :

            // Return ±0 if x is ±0 or y is ±Infinity, or return ±Infinity as y is ±0.
            xc && xc[0] == 0 || !yc ? s * 0 : s / 0
         );
        }

        q = new BigNumber(s);
        qc = q.c = [];
        e = x.e - y.e;
        s = dp + e + 1;

        if (!base) {
          base = BASE;
          e = bitFloor(x.e / LOG_BASE) - bitFloor(y.e / LOG_BASE);
          s = s / LOG_BASE | 0;
        }

        // Result exponent may be one less then the current value of e.
        // The coefficients of the BigNumbers from convertBase may have trailing zeros.
        for (i = 0; yc[i] == (xc[i] || 0); i++);

        if (yc[i] > (xc[i] || 0)) e--;

        if (s < 0) {
          qc.push(1);
          more = true;
        } else {
          xL = xc.length;
          yL = yc.length;
          i = 0;
          s += 2;

          // Normalise xc and yc so highest order digit of yc is >= base / 2.

          n = mathfloor(base / (yc[0] + 1));

          // Not necessary, but to handle odd bases where yc[0] == (base / 2) - 1.
          // if (n > 1 || n++ == 1 && yc[0] < base / 2) {
          if (n > 1) {
            yc = multiply(yc, n, base);
            xc = multiply(xc, n, base);
            yL = yc.length;
            xL = xc.length;
          }

          xi = yL;
          rem = xc.slice(0, yL);
          remL = rem.length;

          // Add zeros to make remainder as long as divisor.
          for (; remL < yL; rem[remL++] = 0);
          yz = yc.slice();
          yz = [0].concat(yz);
          yc0 = yc[0];
          if (yc[1] >= base / 2) yc0++;
          // Not necessary, but to prevent trial digit n > base, when using base 3.
          // else if (base == 3 && yc0 == 1) yc0 = 1 + 1e-15;

          do {
            n = 0;

            // Compare divisor and remainder.
            cmp = compare(yc, rem, yL, remL);

            // If divisor < remainder.
            if (cmp < 0) {

              // Calculate trial digit, n.

              rem0 = rem[0];
              if (yL != remL) rem0 = rem0 * base + (rem[1] || 0);

              // n is how many times the divisor goes into the current remainder.
              n = mathfloor(rem0 / yc0);

              //  Algorithm:
              //  product = divisor multiplied by trial digit (n).
              //  Compare product and remainder.
              //  If product is greater than remainder:
              //    Subtract divisor from product, decrement trial digit.
              //  Subtract product from remainder.
              //  If product was less than remainder at the last compare:
              //    Compare new remainder and divisor.
              //    If remainder is greater than divisor:
              //      Subtract divisor from remainder, increment trial digit.

              if (n > 1) {

                // n may be > base only when base is 3.
                if (n >= base) n = base - 1;

                // product = divisor * trial digit.
                prod = multiply(yc, n, base);
                prodL = prod.length;
                remL = rem.length;

                // Compare product and remainder.
                // If product > remainder then trial digit n too high.
                // n is 1 too high about 5% of the time, and is not known to have
                // ever been more than 1 too high.
                while (compare(prod, rem, prodL, remL) == 1) {
                  n--;

                  // Subtract divisor from product.
                  subtract(prod, yL < prodL ? yz : yc, prodL, base);
                  prodL = prod.length;
                  cmp = 1;
                }
              } else {

                // n is 0 or 1, cmp is -1.
                // If n is 0, there is no need to compare yc and rem again below,
                // so change cmp to 1 to avoid it.
                // If n is 1, leave cmp as -1, so yc and rem are compared again.
                if (n == 0) {

                  // divisor < remainder, so n must be at least 1.
                  cmp = n = 1;
                }

                // product = divisor
                prod = yc.slice();
                prodL = prod.length;
              }

              if (prodL < remL) prod = [0].concat(prod);

              // Subtract product from remainder.
              subtract(rem, prod, remL, base);
              remL = rem.length;

               // If product was < remainder.
              if (cmp == -1) {

                // Compare divisor and new remainder.
                // If divisor < new remainder, subtract divisor from remainder.
                // Trial digit n too low.
                // n is 1 too low about 5% of the time, and very rarely 2 too low.
                while (compare(yc, rem, yL, remL) < 1) {
                  n++;

                  // Subtract divisor from remainder.
                  subtract(rem, yL < remL ? yz : yc, remL, base);
                  remL = rem.length;
                }
              }
            } else if (cmp === 0) {
              n++;
              rem = [0];
            } // else cmp === 1 and n will be 0

            // Add the next digit, n, to the result array.
            qc[i++] = n;

            // Update the remainder.
            if (rem[0]) {
              rem[remL++] = xc[xi] || 0;
            } else {
              rem = [xc[xi]];
              remL = 1;
            }
          } while ((xi++ < xL || rem[0] != null) && s--);

          more = rem[0] != null;

          // Leading zero?
          if (!qc[0]) qc.splice(0, 1);
        }

        if (base == BASE) {

          // To calculate q.e, first get the number of digits of qc[0].
          for (i = 1, s = qc[0]; s >= 10; s /= 10, i++);

          round(q, dp + (q.e = i + e * LOG_BASE - 1) + 1, rm, more);

        // Caller is convertBase.
        } else {
          q.e = e;
          q.r = +more;
        }

        return q;
      };
    })();


    /*
     * Return a string representing the value of BigNumber n in fixed-point or exponential
     * notation rounded to the specified decimal places or significant digits.
     *
     * n: a BigNumber.
     * i: the index of the last digit required (i.e. the digit that may be rounded up).
     * rm: the rounding mode.
     * id: 1 (toExponential) or 2 (toPrecision).
     */
    function format(n, i, rm, id) {
      var c0, e, ne, len, str;

      if (rm == null) rm = ROUNDING_MODE;
      else intCheck(rm, 0, 8);

      if (!n.c) return n.toString();

      c0 = n.c[0];
      ne = n.e;

      if (i == null) {
        str = coeffToString(n.c);
        str = id == 1 || id == 2 && (ne <= TO_EXP_NEG || ne >= TO_EXP_POS)
         ? toExponential(str, ne)
         : toFixedPoint(str, ne, '0');
      } else {
        n = round(new BigNumber(n), i, rm);

        // n.e may have changed if the value was rounded up.
        e = n.e;

        str = coeffToString(n.c);
        len = str.length;

        // toPrecision returns exponential notation if the number of significant digits
        // specified is less than the number of digits necessary to represent the integer
        // part of the value in fixed-point notation.

        // Exponential notation.
        if (id == 1 || id == 2 && (i <= e || e <= TO_EXP_NEG)) {

          // Append zeros?
          for (; len < i; str += '0', len++);
          str = toExponential(str, e);

        // Fixed-point notation.
        } else {
          i -= ne;
          str = toFixedPoint(str, e, '0');

          // Append zeros?
          if (e + 1 > len) {
            if (--i > 0) for (str += '.'; i--; str += '0');
          } else {
            i += e - len;
            if (i > 0) {
              if (e + 1 == len) str += '.';
              for (; i--; str += '0');
            }
          }
        }
      }

      return n.s < 0 && c0 ? '-' + str : str;
    }


    // Handle BigNumber.max and BigNumber.min.
    // If any number is NaN, return NaN.
    function maxOrMin(args, n) {
      var k, y,
        i = 1,
        x = new BigNumber(args[0]);

      for (; i < args.length; i++) {
        y = new BigNumber(args[i]);
        if (!y.s || (k = compare(x, y)) === n || k === 0 && x.s === n) {
          x = y;
        }
      }

      return x;
    }


    /*
     * Strip trailing zeros, calculate base 10 exponent and check against MIN_EXP and MAX_EXP.
     * Called by minus, plus and times.
     */
    function normalise(n, c, e) {
      var i = 1,
        j = c.length;

       // Remove trailing zeros.
      for (; !c[--j]; c.pop());

      // Calculate the base 10 exponent. First get the number of digits of c[0].
      for (j = c[0]; j >= 10; j /= 10, i++);

      // Overflow?
      if ((e = i + e * LOG_BASE - 1) > MAX_EXP) {

        // Infinity.
        n.c = n.e = null;

      // Underflow?
      } else if (e < MIN_EXP) {

        // Zero.
        n.c = [n.e = 0];
      } else {
        n.e = e;
        n.c = c;
      }

      return n;
    }


    // Handle values that fail the validity test in BigNumber.
    parseNumeric = (function () {
      var basePrefix = /^(-?)0([xbo])(?=\w[\w.]*$)/i,
        dotAfter = /^([^.]+)\.$/,
        dotBefore = /^\.([^.]+)$/,
        isInfinityOrNaN = /^-?(Infinity|NaN)$/,
        whitespaceOrPlus = /^\s*\+(?=[\w.])|^\s+|\s+$/g;

      return function (x, str, isNum, b) {
        var base,
          s = isNum ? str : str.replace(whitespaceOrPlus, '');

        // No exception on ±Infinity or NaN.
        if (isInfinityOrNaN.test(s)) {
          x.s = isNaN(s) ? null : s < 0 ? -1 : 1;
        } else {
          if (!isNum) {

            // basePrefix = /^(-?)0([xbo])(?=\w[\w.]*$)/i
            s = s.replace(basePrefix, function (m, p1, p2) {
              base = (p2 = p2.toLowerCase()) == 'x' ? 16 : p2 == 'b' ? 2 : 8;
              return !b || b == base ? p1 : m;
            });

            if (b) {
              base = b;

              // E.g. '1.' to '1', '.1' to '0.1'
              s = s.replace(dotAfter, '$1').replace(dotBefore, '0.$1');
            }

            if (str != s) return new BigNumber(s, base);
          }

          // '[BigNumber Error] Not a number: {n}'
          // '[BigNumber Error] Not a base {b} number: {n}'
          if (BigNumber.DEBUG) {
            throw Error
              (bignumberError + 'Not a' + (b ? ' base ' + b : '') + ' number: ' + str);
          }

          // NaN
          x.s = null;
        }

        x.c = x.e = null;
      }
    })();


    /*
     * Round x to sd significant digits using rounding mode rm. Check for over/under-flow.
     * If r is truthy, it is known that there are more digits after the rounding digit.
     */
    function round(x, sd, rm, r) {
      var d, i, j, k, n, ni, rd,
        xc = x.c,
        pows10 = POWS_TEN;

      // if x is not Infinity or NaN...
      if (xc) {

        // rd is the rounding digit, i.e. the digit after the digit that may be rounded up.
        // n is a base 1e14 number, the value of the element of array x.c containing rd.
        // ni is the index of n within x.c.
        // d is the number of digits of n.
        // i is the index of rd within n including leading zeros.
        // j is the actual index of rd within n (if < 0, rd is a leading zero).
        out: {

          // Get the number of digits of the first element of xc.
          for (d = 1, k = xc[0]; k >= 10; k /= 10, d++);
          i = sd - d;

          // If the rounding digit is in the first element of xc...
          if (i < 0) {
            i += LOG_BASE;
            j = sd;
            n = xc[ni = 0];

            // Get the rounding digit at index j of n.
            rd = mathfloor(n / pows10[d - j - 1] % 10);
          } else {
            ni = mathceil((i + 1) / LOG_BASE);

            if (ni >= xc.length) {

              if (r) {

                // Needed by sqrt.
                for (; xc.length <= ni; xc.push(0));
                n = rd = 0;
                d = 1;
                i %= LOG_BASE;
                j = i - LOG_BASE + 1;
              } else {
                break out;
              }
            } else {
              n = k = xc[ni];

              // Get the number of digits of n.
              for (d = 1; k >= 10; k /= 10, d++);

              // Get the index of rd within n.
              i %= LOG_BASE;

              // Get the index of rd within n, adjusted for leading zeros.
              // The number of leading zeros of n is given by LOG_BASE - d.
              j = i - LOG_BASE + d;

              // Get the rounding digit at index j of n.
              rd = j < 0 ? 0 : mathfloor(n / pows10[d - j - 1] % 10);
            }
          }

          r = r || sd < 0 ||

          // Are there any non-zero digits after the rounding digit?
          // The expression  n % pows10[d - j - 1]  returns all digits of n to the right
          // of the digit at j, e.g. if n is 908714 and j is 2, the expression gives 714.
           xc[ni + 1] != null || (j < 0 ? n : n % pows10[d - j - 1]);

          r = rm < 4
           ? (rd || r) && (rm == 0 || rm == (x.s < 0 ? 3 : 2))
           : rd > 5 || rd == 5 && (rm == 4 || r || rm == 6 &&

            // Check whether the digit to the left of the rounding digit is odd.
            ((i > 0 ? j > 0 ? n / pows10[d - j] : 0 : xc[ni - 1]) % 10) & 1 ||
             rm == (x.s < 0 ? 8 : 7));

          if (sd < 1 || !xc[0]) {
            xc.length = 0;

            if (r) {

              // Convert sd to decimal places.
              sd -= x.e + 1;

              // 1, 0.1, 0.01, 0.001, 0.0001 etc.
              xc[0] = pows10[(LOG_BASE - sd % LOG_BASE) % LOG_BASE];
              x.e = -sd || 0;
            } else {

              // Zero.
              xc[0] = x.e = 0;
            }

            return x;
          }

          // Remove excess digits.
          if (i == 0) {
            xc.length = ni;
            k = 1;
            ni--;
          } else {
            xc.length = ni + 1;
            k = pows10[LOG_BASE - i];

            // E.g. 56700 becomes 56000 if 7 is the rounding digit.
            // j > 0 means i > number of leading zeros of n.
            xc[ni] = j > 0 ? mathfloor(n / pows10[d - j] % pows10[j]) * k : 0;
          }

          // Round up?
          if (r) {

            for (; ;) {

              // If the digit to be rounded up is in the first element of xc...
              if (ni == 0) {

                // i will be the length of xc[0] before k is added.
                for (i = 1, j = xc[0]; j >= 10; j /= 10, i++);
                j = xc[0] += k;
                for (k = 1; j >= 10; j /= 10, k++);

                // if i != k the length has increased.
                if (i != k) {
                  x.e++;
                  if (xc[0] == BASE) xc[0] = 1;
                }

                break;
              } else {
                xc[ni] += k;
                if (xc[ni] != BASE) break;
                xc[ni--] = 0;
                k = 1;
              }
            }
          }

          // Remove trailing zeros.
          for (i = xc.length; xc[--i] === 0; xc.pop());
        }

        // Overflow? Infinity.
        if (x.e > MAX_EXP) {
          x.c = x.e = null;

        // Underflow? Zero.
        } else if (x.e < MIN_EXP) {
          x.c = [x.e = 0];
        }
      }

      return x;
    }


    function valueOf(n) {
      var str,
        e = n.e;

      if (e === null) return n.toString();

      str = coeffToString(n.c);

      str = e <= TO_EXP_NEG || e >= TO_EXP_POS
        ? toExponential(str, e)
        : toFixedPoint(str, e, '0');

      return n.s < 0 ? '-' + str : str;
    }


    // PROTOTYPE/INSTANCE METHODS


    /*
     * Return a new BigNumber whose value is the absolute value of this BigNumber.
     */
    P.absoluteValue = P.abs = function () {
      var x = new BigNumber(this);
      if (x.s < 0) x.s = 1;
      return x;
    };


    /*
     * Return
     *   1 if the value of this BigNumber is greater than the value of BigNumber(y, b),
     *   -1 if the value of this BigNumber is less than the value of BigNumber(y, b),
     *   0 if they have the same value,
     *   or null if the value of either is NaN.
     */
    P.comparedTo = function (y, b) {
      return compare(this, new BigNumber(y, b));
    };


    /*
     * If dp is undefined or null or true or false, return the number of decimal places of the
     * value of this BigNumber, or null if the value of this BigNumber is ±Infinity or NaN.
     *
     * Otherwise, if dp is a number, return a new BigNumber whose value is the value of this
     * BigNumber rounded to a maximum of dp decimal places using rounding mode rm, or
     * ROUNDING_MODE if rm is omitted.
     *
     * [dp] {number} Decimal places: integer, 0 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
     */
    P.decimalPlaces = P.dp = function (dp, rm) {
      var c, n, v,
        x = this;

      if (dp != null) {
        intCheck(dp, 0, MAX);
        if (rm == null) rm = ROUNDING_MODE;
        else intCheck(rm, 0, 8);

        return round(new BigNumber(x), dp + x.e + 1, rm);
      }

      if (!(c = x.c)) return null;
      n = ((v = c.length - 1) - bitFloor(this.e / LOG_BASE)) * LOG_BASE;

      // Subtract the number of trailing zeros of the last number.
      if (v = c[v]) for (; v % 10 == 0; v /= 10, n--);
      if (n < 0) n = 0;

      return n;
    };


    /*
     *  n / 0 = I
     *  n / N = N
     *  n / I = 0
     *  0 / n = 0
     *  0 / 0 = N
     *  0 / N = N
     *  0 / I = 0
     *  N / n = N
     *  N / 0 = N
     *  N / N = N
     *  N / I = N
     *  I / n = I
     *  I / 0 = I
     *  I / N = N
     *  I / I = N
     *
     * Return a new BigNumber whose value is the value of this BigNumber divided by the value of
     * BigNumber(y, b), rounded according to DECIMAL_PLACES and ROUNDING_MODE.
     */
    P.dividedBy = P.div = function (y, b) {
      return div(this, new BigNumber(y, b), DECIMAL_PLACES, ROUNDING_MODE);
    };


    /*
     * Return a new BigNumber whose value is the integer part of dividing the value of this
     * BigNumber by the value of BigNumber(y, b).
     */
    P.dividedToIntegerBy = P.idiv = function (y, b) {
      return div(this, new BigNumber(y, b), 0, 1);
    };


    /*
     * Return a BigNumber whose value is the value of this BigNumber exponentiated by n.
     *
     * If m is present, return the result modulo m.
     * If n is negative round according to DECIMAL_PLACES and ROUNDING_MODE.
     * If POW_PRECISION is non-zero and m is not present, round to POW_PRECISION using ROUNDING_MODE.
     *
     * The modular power operation works efficiently when x, n, and m are integers, otherwise it
     * is equivalent to calculating x.exponentiatedBy(n).modulo(m) with a POW_PRECISION of 0.
     *
     * n {number|string|BigNumber} The exponent. An integer.
     * [m] {number|string|BigNumber} The modulus.
     *
     * '[BigNumber Error] Exponent not an integer: {n}'
     */
    P.exponentiatedBy = P.pow = function (n, m) {
      var half, isModExp, i, k, more, nIsBig, nIsNeg, nIsOdd, y,
        x = this;

      n = new BigNumber(n);

      // Allow NaN and ±Infinity, but not other non-integers.
      if (n.c && !n.isInteger()) {
        throw Error
          (bignumberError + 'Exponent not an integer: ' + valueOf(n));
      }

      if (m != null) m = new BigNumber(m);

      // Exponent of MAX_SAFE_INTEGER is 15.
      nIsBig = n.e > 14;

      // If x is NaN, ±Infinity, ±0 or ±1, or n is ±Infinity, NaN or ±0.
      if (!x.c || !x.c[0] || x.c[0] == 1 && !x.e && x.c.length == 1 || !n.c || !n.c[0]) {

        // The sign of the result of pow when x is negative depends on the evenness of n.
        // If +n overflows to ±Infinity, the evenness of n would be not be known.
        y = new BigNumber(Math.pow(+valueOf(x), nIsBig ? n.s * (2 - isOdd(n)) : +valueOf(n)));
        return m ? y.mod(m) : y;
      }

      nIsNeg = n.s < 0;

      if (m) {

        // x % m returns NaN if abs(m) is zero, or m is NaN.
        if (m.c ? !m.c[0] : !m.s) return new BigNumber(NaN);

        isModExp = !nIsNeg && x.isInteger() && m.isInteger();

        if (isModExp) x = x.mod(m);

      // Overflow to ±Infinity: >=2**1e10 or >=1.0000024**1e15.
      // Underflow to ±0: <=0.79**1e10 or <=0.9999975**1e15.
      } else if (n.e > 9 && (x.e > 0 || x.e < -1 || (x.e == 0
        // [1, 240000000]
        ? x.c[0] > 1 || nIsBig && x.c[1] >= 24e7
        // [80000000000000]  [99999750000000]
        : x.c[0] < 8e13 || nIsBig && x.c[0] <= 9999975e7))) {

        // If x is negative and n is odd, k = -0, else k = 0.
        k = x.s < 0 && isOdd(n) ? -0 : 0;

        // If x >= 1, k = ±Infinity.
        if (x.e > -1) k = 1 / k;

        // If n is negative return ±0, else return ±Infinity.
        return new BigNumber(nIsNeg ? 1 / k : k);

      } else if (POW_PRECISION) {

        // Truncating each coefficient array to a length of k after each multiplication
        // equates to truncating significant digits to POW_PRECISION + [28, 41],
        // i.e. there will be a minimum of 28 guard digits retained.
        k = mathceil(POW_PRECISION / LOG_BASE + 2);
      }

      if (nIsBig) {
        half = new BigNumber(0.5);
        if (nIsNeg) n.s = 1;
        nIsOdd = isOdd(n);
      } else {
        i = Math.abs(+valueOf(n));
        nIsOdd = i % 2;
      }

      y = new BigNumber(ONE);

      // Performs 54 loop iterations for n of 9007199254740991.
      for (; ;) {

        if (nIsOdd) {
          y = y.times(x);
          if (!y.c) break;

          if (k) {
            if (y.c.length > k) y.c.length = k;
          } else if (isModExp) {
            y = y.mod(m);    //y = y.minus(div(y, m, 0, MODULO_MODE).times(m));
          }
        }

        if (i) {
          i = mathfloor(i / 2);
          if (i === 0) break;
          nIsOdd = i % 2;
        } else {
          n = n.times(half);
          round(n, n.e + 1, 1);

          if (n.e > 14) {
            nIsOdd = isOdd(n);
          } else {
            i = +valueOf(n);
            if (i === 0) break;
            nIsOdd = i % 2;
          }
        }

        x = x.times(x);

        if (k) {
          if (x.c && x.c.length > k) x.c.length = k;
        } else if (isModExp) {
          x = x.mod(m);    //x = x.minus(div(x, m, 0, MODULO_MODE).times(m));
        }
      }

      if (isModExp) return y;
      if (nIsNeg) y = ONE.div(y);

      return m ? y.mod(m) : k ? round(y, POW_PRECISION, ROUNDING_MODE, more) : y;
    };


    /*
     * Return a new BigNumber whose value is the value of this BigNumber rounded to an integer
     * using rounding mode rm, or ROUNDING_MODE if rm is omitted.
     *
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {rm}'
     */
    P.integerValue = function (rm) {
      var n = new BigNumber(this);
      if (rm == null) rm = ROUNDING_MODE;
      else intCheck(rm, 0, 8);
      return round(n, n.e + 1, rm);
    };


    /*
     * Return true if the value of this BigNumber is equal to the value of BigNumber(y, b),
     * otherwise return false.
     */
    P.isEqualTo = P.eq = function (y, b) {
      return compare(this, new BigNumber(y, b)) === 0;
    };


    /*
     * Return true if the value of this BigNumber is a finite number, otherwise return false.
     */
    P.isFinite = function () {
      return !!this.c;
    };


    /*
     * Return true if the value of this BigNumber is greater than the value of BigNumber(y, b),
     * otherwise return false.
     */
    P.isGreaterThan = P.gt = function (y, b) {
      return compare(this, new BigNumber(y, b)) > 0;
    };


    /*
     * Return true if the value of this BigNumber is greater than or equal to the value of
     * BigNumber(y, b), otherwise return false.
     */
    P.isGreaterThanOrEqualTo = P.gte = function (y, b) {
      return (b = compare(this, new BigNumber(y, b))) === 1 || b === 0;

    };


    /*
     * Return true if the value of this BigNumber is an integer, otherwise return false.
     */
    P.isInteger = function () {
      return !!this.c && bitFloor(this.e / LOG_BASE) > this.c.length - 2;
    };


    /*
     * Return true if the value of this BigNumber is less than the value of BigNumber(y, b),
     * otherwise return false.
     */
    P.isLessThan = P.lt = function (y, b) {
      return compare(this, new BigNumber(y, b)) < 0;
    };


    /*
     * Return true if the value of this BigNumber is less than or equal to the value of
     * BigNumber(y, b), otherwise return false.
     */
    P.isLessThanOrEqualTo = P.lte = function (y, b) {
      return (b = compare(this, new BigNumber(y, b))) === -1 || b === 0;
    };


    /*
     * Return true if the value of this BigNumber is NaN, otherwise return false.
     */
    P.isNaN = function () {
      return !this.s;
    };


    /*
     * Return true if the value of this BigNumber is negative, otherwise return false.
     */
    P.isNegative = function () {
      return this.s < 0;
    };


    /*
     * Return true if the value of this BigNumber is positive, otherwise return false.
     */
    P.isPositive = function () {
      return this.s > 0;
    };


    /*
     * Return true if the value of this BigNumber is 0 or -0, otherwise return false.
     */
    P.isZero = function () {
      return !!this.c && this.c[0] == 0;
    };


    /*
     *  n - 0 = n
     *  n - N = N
     *  n - I = -I
     *  0 - n = -n
     *  0 - 0 = 0
     *  0 - N = N
     *  0 - I = -I
     *  N - n = N
     *  N - 0 = N
     *  N - N = N
     *  N - I = N
     *  I - n = I
     *  I - 0 = I
     *  I - N = N
     *  I - I = N
     *
     * Return a new BigNumber whose value is the value of this BigNumber minus the value of
     * BigNumber(y, b).
     */
    P.minus = function (y, b) {
      var i, j, t, xLTy,
        x = this,
        a = x.s;

      y = new BigNumber(y, b);
      b = y.s;

      // Either NaN?
      if (!a || !b) return new BigNumber(NaN);

      // Signs differ?
      if (a != b) {
        y.s = -b;
        return x.plus(y);
      }

      var xe = x.e / LOG_BASE,
        ye = y.e / LOG_BASE,
        xc = x.c,
        yc = y.c;

      if (!xe || !ye) {

        // Either Infinity?
        if (!xc || !yc) return xc ? (y.s = -b, y) : new BigNumber(yc ? x : NaN);

        // Either zero?
        if (!xc[0] || !yc[0]) {

          // Return y if y is non-zero, x if x is non-zero, or zero if both are zero.
          return yc[0] ? (y.s = -b, y) : new BigNumber(xc[0] ? x :

           // IEEE 754 (2008) 6.3: n - n = -0 when rounding to -Infinity
           ROUNDING_MODE == 3 ? -0 : 0);
        }
      }

      xe = bitFloor(xe);
      ye = bitFloor(ye);
      xc = xc.slice();

      // Determine which is the bigger number.
      if (a = xe - ye) {

        if (xLTy = a < 0) {
          a = -a;
          t = xc;
        } else {
          ye = xe;
          t = yc;
        }

        t.reverse();

        // Prepend zeros to equalise exponents.
        for (b = a; b--; t.push(0));
        t.reverse();
      } else {

        // Exponents equal. Check digit by digit.
        j = (xLTy = (a = xc.length) < (b = yc.length)) ? a : b;

        for (a = b = 0; b < j; b++) {

          if (xc[b] != yc[b]) {
            xLTy = xc[b] < yc[b];
            break;
          }
        }
      }

      // x < y? Point xc to the array of the bigger number.
      if (xLTy) {
        t = xc;
        xc = yc;
        yc = t;
        y.s = -y.s;
      }

      b = (j = yc.length) - (i = xc.length);

      // Append zeros to xc if shorter.
      // No need to add zeros to yc if shorter as subtract only needs to start at yc.length.
      if (b > 0) for (; b--; xc[i++] = 0);
      b = BASE - 1;

      // Subtract yc from xc.
      for (; j > a;) {

        if (xc[--j] < yc[j]) {
          for (i = j; i && !xc[--i]; xc[i] = b);
          --xc[i];
          xc[j] += BASE;
        }

        xc[j] -= yc[j];
      }

      // Remove leading zeros and adjust exponent accordingly.
      for (; xc[0] == 0; xc.splice(0, 1), --ye);

      // Zero?
      if (!xc[0]) {

        // Following IEEE 754 (2008) 6.3,
        // n - n = +0  but  n - n = -0  when rounding towards -Infinity.
        y.s = ROUNDING_MODE == 3 ? -1 : 1;
        y.c = [y.e = 0];
        return y;
      }

      // No need to check for Infinity as +x - +y != Infinity && -x - -y != Infinity
      // for finite x and y.
      return normalise(y, xc, ye);
    };


    /*
     *   n % 0 =  N
     *   n % N =  N
     *   n % I =  n
     *   0 % n =  0
     *  -0 % n = -0
     *   0 % 0 =  N
     *   0 % N =  N
     *   0 % I =  0
     *   N % n =  N
     *   N % 0 =  N
     *   N % N =  N
     *   N % I =  N
     *   I % n =  N
     *   I % 0 =  N
     *   I % N =  N
     *   I % I =  N
     *
     * Return a new BigNumber whose value is the value of this BigNumber modulo the value of
     * BigNumber(y, b). The result depends on the value of MODULO_MODE.
     */
    P.modulo = P.mod = function (y, b) {
      var q, s,
        x = this;

      y = new BigNumber(y, b);

      // Return NaN if x is Infinity or NaN, or y is NaN or zero.
      if (!x.c || !y.s || y.c && !y.c[0]) {
        return new BigNumber(NaN);

      // Return x if y is Infinity or x is zero.
      } else if (!y.c || x.c && !x.c[0]) {
        return new BigNumber(x);
      }

      if (MODULO_MODE == 9) {

        // Euclidian division: q = sign(y) * floor(x / abs(y))
        // r = x - qy    where  0 <= r < abs(y)
        s = y.s;
        y.s = 1;
        q = div(x, y, 0, 3);
        y.s = s;
        q.s *= s;
      } else {
        q = div(x, y, 0, MODULO_MODE);
      }

      y = x.minus(q.times(y));

      // To match JavaScript %, ensure sign of zero is sign of dividend.
      if (!y.c[0] && MODULO_MODE == 1) y.s = x.s;

      return y;
    };


    /*
     *  n * 0 = 0
     *  n * N = N
     *  n * I = I
     *  0 * n = 0
     *  0 * 0 = 0
     *  0 * N = N
     *  0 * I = N
     *  N * n = N
     *  N * 0 = N
     *  N * N = N
     *  N * I = N
     *  I * n = I
     *  I * 0 = N
     *  I * N = N
     *  I * I = I
     *
     * Return a new BigNumber whose value is the value of this BigNumber multiplied by the value
     * of BigNumber(y, b).
     */
    P.multipliedBy = P.times = function (y, b) {
      var c, e, i, j, k, m, xcL, xlo, xhi, ycL, ylo, yhi, zc,
        base, sqrtBase,
        x = this,
        xc = x.c,
        yc = (y = new BigNumber(y, b)).c;

      // Either NaN, ±Infinity or ±0?
      if (!xc || !yc || !xc[0] || !yc[0]) {

        // Return NaN if either is NaN, or one is 0 and the other is Infinity.
        if (!x.s || !y.s || xc && !xc[0] && !yc || yc && !yc[0] && !xc) {
          y.c = y.e = y.s = null;
        } else {
          y.s *= x.s;

          // Return ±Infinity if either is ±Infinity.
          if (!xc || !yc) {
            y.c = y.e = null;

          // Return ±0 if either is ±0.
          } else {
            y.c = [0];
            y.e = 0;
          }
        }

        return y;
      }

      e = bitFloor(x.e / LOG_BASE) + bitFloor(y.e / LOG_BASE);
      y.s *= x.s;
      xcL = xc.length;
      ycL = yc.length;

      // Ensure xc points to longer array and xcL to its length.
      if (xcL < ycL) {
        zc = xc;
        xc = yc;
        yc = zc;
        i = xcL;
        xcL = ycL;
        ycL = i;
      }

      // Initialise the result array with zeros.
      for (i = xcL + ycL, zc = []; i--; zc.push(0));

      base = BASE;
      sqrtBase = SQRT_BASE;

      for (i = ycL; --i >= 0;) {
        c = 0;
        ylo = yc[i] % sqrtBase;
        yhi = yc[i] / sqrtBase | 0;

        for (k = xcL, j = i + k; j > i;) {
          xlo = xc[--k] % sqrtBase;
          xhi = xc[k] / sqrtBase | 0;
          m = yhi * xlo + xhi * ylo;
          xlo = ylo * xlo + ((m % sqrtBase) * sqrtBase) + zc[j] + c;
          c = (xlo / base | 0) + (m / sqrtBase | 0) + yhi * xhi;
          zc[j--] = xlo % base;
        }

        zc[j] = c;
      }

      if (c) {
        ++e;
      } else {
        zc.splice(0, 1);
      }

      return normalise(y, zc, e);
    };


    /*
     * Return a new BigNumber whose value is the value of this BigNumber negated,
     * i.e. multiplied by -1.
     */
    P.negated = function () {
      var x = new BigNumber(this);
      x.s = -x.s || null;
      return x;
    };


    /*
     *  n + 0 = n
     *  n + N = N
     *  n + I = I
     *  0 + n = n
     *  0 + 0 = 0
     *  0 + N = N
     *  0 + I = I
     *  N + n = N
     *  N + 0 = N
     *  N + N = N
     *  N + I = N
     *  I + n = I
     *  I + 0 = I
     *  I + N = N
     *  I + I = I
     *
     * Return a new BigNumber whose value is the value of this BigNumber plus the value of
     * BigNumber(y, b).
     */
    P.plus = function (y, b) {
      var t,
        x = this,
        a = x.s;

      y = new BigNumber(y, b);
      b = y.s;

      // Either NaN?
      if (!a || !b) return new BigNumber(NaN);

      // Signs differ?
       if (a != b) {
        y.s = -b;
        return x.minus(y);
      }

      var xe = x.e / LOG_BASE,
        ye = y.e / LOG_BASE,
        xc = x.c,
        yc = y.c;

      if (!xe || !ye) {

        // Return ±Infinity if either ±Infinity.
        if (!xc || !yc) return new BigNumber(a / 0);

        // Either zero?
        // Return y if y is non-zero, x if x is non-zero, or zero if both are zero.
        if (!xc[0] || !yc[0]) return yc[0] ? y : new BigNumber(xc[0] ? x : a * 0);
      }

      xe = bitFloor(xe);
      ye = bitFloor(ye);
      xc = xc.slice();

      // Prepend zeros to equalise exponents. Faster to use reverse then do unshifts.
      if (a = xe - ye) {
        if (a > 0) {
          ye = xe;
          t = yc;
        } else {
          a = -a;
          t = xc;
        }

        t.reverse();
        for (; a--; t.push(0));
        t.reverse();
      }

      a = xc.length;
      b = yc.length;

      // Point xc to the longer array, and b to the shorter length.
      if (a - b < 0) {
        t = yc;
        yc = xc;
        xc = t;
        b = a;
      }

      // Only start adding at yc.length - 1 as the further digits of xc can be ignored.
      for (a = 0; b;) {
        a = (xc[--b] = xc[b] + yc[b] + a) / BASE | 0;
        xc[b] = BASE === xc[b] ? 0 : xc[b] % BASE;
      }

      if (a) {
        xc = [a].concat(xc);
        ++ye;
      }

      // No need to check for zero, as +x + +y != 0 && -x + -y != 0
      // ye = MAX_EXP + 1 possible
      return normalise(y, xc, ye);
    };


    /*
     * If sd is undefined or null or true or false, return the number of significant digits of
     * the value of this BigNumber, or null if the value of this BigNumber is ±Infinity or NaN.
     * If sd is true include integer-part trailing zeros in the count.
     *
     * Otherwise, if sd is a number, return a new BigNumber whose value is the value of this
     * BigNumber rounded to a maximum of sd significant digits using rounding mode rm, or
     * ROUNDING_MODE if rm is omitted.
     *
     * sd {number|boolean} number: significant digits: integer, 1 to MAX inclusive.
     *                     boolean: whether to count integer-part trailing zeros: true or false.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {sd|rm}'
     */
    P.precision = P.sd = function (sd, rm) {
      var c, n, v,
        x = this;

      if (sd != null && sd !== !!sd) {
        intCheck(sd, 1, MAX);
        if (rm == null) rm = ROUNDING_MODE;
        else intCheck(rm, 0, 8);

        return round(new BigNumber(x), sd, rm);
      }

      if (!(c = x.c)) return null;
      v = c.length - 1;
      n = v * LOG_BASE + 1;

      if (v = c[v]) {

        // Subtract the number of trailing zeros of the last element.
        for (; v % 10 == 0; v /= 10, n--);

        // Add the number of digits of the first element.
        for (v = c[0]; v >= 10; v /= 10, n++);
      }

      if (sd && x.e + 1 > n) n = x.e + 1;

      return n;
    };


    /*
     * Return a new BigNumber whose value is the value of this BigNumber shifted by k places
     * (powers of 10). Shift to the right if n > 0, and to the left if n < 0.
     *
     * k {number} Integer, -MAX_SAFE_INTEGER to MAX_SAFE_INTEGER inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {k}'
     */
    P.shiftedBy = function (k) {
      intCheck(k, -MAX_SAFE_INTEGER, MAX_SAFE_INTEGER);
      return this.times('1e' + k);
    };


    /*
     *  sqrt(-n) =  N
     *  sqrt(N) =  N
     *  sqrt(-I) =  N
     *  sqrt(I) =  I
     *  sqrt(0) =  0
     *  sqrt(-0) = -0
     *
     * Return a new BigNumber whose value is the square root of the value of this BigNumber,
     * rounded according to DECIMAL_PLACES and ROUNDING_MODE.
     */
    P.squareRoot = P.sqrt = function () {
      var m, n, r, rep, t,
        x = this,
        c = x.c,
        s = x.s,
        e = x.e,
        dp = DECIMAL_PLACES + 4,
        half = new BigNumber('0.5');

      // Negative/NaN/Infinity/zero?
      if (s !== 1 || !c || !c[0]) {
        return new BigNumber(!s || s < 0 && (!c || c[0]) ? NaN : c ? x : 1 / 0);
      }

      // Initial estimate.
      s = Math.sqrt(+valueOf(x));

      // Math.sqrt underflow/overflow?
      // Pass x to Math.sqrt as integer, then adjust the exponent of the result.
      if (s == 0 || s == 1 / 0) {
        n = coeffToString(c);
        if ((n.length + e) % 2 == 0) n += '0';
        s = Math.sqrt(+n);
        e = bitFloor((e + 1) / 2) - (e < 0 || e % 2);

        if (s == 1 / 0) {
          n = '5e' + e;
        } else {
          n = s.toExponential();
          n = n.slice(0, n.indexOf('e') + 1) + e;
        }

        r = new BigNumber(n);
      } else {
        r = new BigNumber(s + '');
      }

      // Check for zero.
      // r could be zero if MIN_EXP is changed after the this value was created.
      // This would cause a division by zero (x/t) and hence Infinity below, which would cause
      // coeffToString to throw.
      if (r.c[0]) {
        e = r.e;
        s = e + dp;
        if (s < 3) s = 0;

        // Newton-Raphson iteration.
        for (; ;) {
          t = r;
          r = half.times(t.plus(div(x, t, dp, 1)));

          if (coeffToString(t.c).slice(0, s) === (n = coeffToString(r.c)).slice(0, s)) {

            // The exponent of r may here be one less than the final result exponent,
            // e.g 0.0009999 (e-4) --> 0.001 (e-3), so adjust s so the rounding digits
            // are indexed correctly.
            if (r.e < e) --s;
            n = n.slice(s - 3, s + 1);

            // The 4th rounding digit may be in error by -1 so if the 4 rounding digits
            // are 9999 or 4999 (i.e. approaching a rounding boundary) continue the
            // iteration.
            if (n == '9999' || !rep && n == '4999') {

              // On the first iteration only, check to see if rounding up gives the
              // exact result as the nines may infinitely repeat.
              if (!rep) {
                round(t, t.e + DECIMAL_PLACES + 2, 0);

                if (t.times(t).eq(x)) {
                  r = t;
                  break;
                }
              }

              dp += 4;
              s += 4;
              rep = 1;
            } else {

              // If rounding digits are null, 0{0,4} or 50{0,3}, check for exact
              // result. If not, then there are further digits and m will be truthy.
              if (!+n || !+n.slice(1) && n.charAt(0) == '5') {

                // Truncate to the first rounding digit.
                round(r, r.e + DECIMAL_PLACES + 2, 1);
                m = !r.times(r).eq(x);
              }

              break;
            }
          }
        }
      }

      return round(r, r.e + DECIMAL_PLACES + 1, ROUNDING_MODE, m);
    };


    /*
     * Return a string representing the value of this BigNumber in exponential notation and
     * rounded using ROUNDING_MODE to dp fixed decimal places.
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
     */
    P.toExponential = function (dp, rm) {
      if (dp != null) {
        intCheck(dp, 0, MAX);
        dp++;
      }
      return format(this, dp, rm, 1);
    };


    /*
     * Return a string representing the value of this BigNumber in fixed-point notation rounding
     * to dp fixed decimal places using rounding mode rm, or ROUNDING_MODE if rm is omitted.
     *
     * Note: as with JavaScript's number type, (-0).toFixed(0) is '0',
     * but e.g. (-0.00001).toFixed(0) is '-0'.
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
     */
    P.toFixed = function (dp, rm) {
      if (dp != null) {
        intCheck(dp, 0, MAX);
        dp = dp + this.e + 1;
      }
      return format(this, dp, rm);
    };


    /*
     * Return a string representing the value of this BigNumber in fixed-point notation rounded
     * using rm or ROUNDING_MODE to dp decimal places, and formatted according to the properties
     * of the format or FORMAT object (see BigNumber.set).
     *
     * The formatting object may contain some or all of the properties shown below.
     *
     * FORMAT = {
     *   prefix: '',
     *   groupSize: 3,
     *   secondaryGroupSize: 0,
     *   groupSeparator: ',',
     *   decimalSeparator: '.',
     *   fractionGroupSize: 0,
     *   fractionGroupSeparator: '\xA0',      // non-breaking space
     *   suffix: ''
     * };
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     * [format] {object} Formatting options. See FORMAT pbject above.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
     * '[BigNumber Error] Argument not an object: {format}'
     */
    P.toFormat = function (dp, rm, format) {
      var str,
        x = this;

      if (format == null) {
        if (dp != null && rm && typeof rm == 'object') {
          format = rm;
          rm = null;
        } else if (dp && typeof dp == 'object') {
          format = dp;
          dp = rm = null;
        } else {
          format = FORMAT;
        }
      } else if (typeof format != 'object') {
        throw Error
          (bignumberError + 'Argument not an object: ' + format);
      }

      str = x.toFixed(dp, rm);

      if (x.c) {
        var i,
          arr = str.split('.'),
          g1 = +format.groupSize,
          g2 = +format.secondaryGroupSize,
          groupSeparator = format.groupSeparator || '',
          intPart = arr[0],
          fractionPart = arr[1],
          isNeg = x.s < 0,
          intDigits = isNeg ? intPart.slice(1) : intPart,
          len = intDigits.length;

        if (g2) {
          i = g1;
          g1 = g2;
          g2 = i;
          len -= i;
        }

        if (g1 > 0 && len > 0) {
          i = len % g1 || g1;
          intPart = intDigits.substr(0, i);
          for (; i < len; i += g1) intPart += groupSeparator + intDigits.substr(i, g1);
          if (g2 > 0) intPart += groupSeparator + intDigits.slice(i);
          if (isNeg) intPart = '-' + intPart;
        }

        str = fractionPart
         ? intPart + (format.decimalSeparator || '') + ((g2 = +format.fractionGroupSize)
          ? fractionPart.replace(new RegExp('\\d{' + g2 + '}\\B', 'g'),
           '$&' + (format.fractionGroupSeparator || ''))
          : fractionPart)
         : intPart;
      }

      return (format.prefix || '') + str + (format.suffix || '');
    };


    /*
     * Return an array of two BigNumbers representing the value of this BigNumber as a simple
     * fraction with an integer numerator and an integer denominator.
     * The denominator will be a positive non-zero value less than or equal to the specified
     * maximum denominator. If a maximum denominator is not specified, the denominator will be
     * the lowest value necessary to represent the number exactly.
     *
     * [md] {number|string|BigNumber} Integer >= 1, or Infinity. The maximum denominator.
     *
     * '[BigNumber Error] Argument {not an integer|out of range} : {md}'
     */
    P.toFraction = function (md) {
      var d, d0, d1, d2, e, exp, n, n0, n1, q, r, s,
        x = this,
        xc = x.c;

      if (md != null) {
        n = new BigNumber(md);

        // Throw if md is less than one or is not an integer, unless it is Infinity.
        if (!n.isInteger() && (n.c || n.s !== 1) || n.lt(ONE)) {
          throw Error
            (bignumberError + 'Argument ' +
              (n.isInteger() ? 'out of range: ' : 'not an integer: ') + valueOf(n));
        }
      }

      if (!xc) return new BigNumber(x);

      d = new BigNumber(ONE);
      n1 = d0 = new BigNumber(ONE);
      d1 = n0 = new BigNumber(ONE);
      s = coeffToString(xc);

      // Determine initial denominator.
      // d is a power of 10 and the minimum max denominator that specifies the value exactly.
      e = d.e = s.length - x.e - 1;
      d.c[0] = POWS_TEN[(exp = e % LOG_BASE) < 0 ? LOG_BASE + exp : exp];
      md = !md || n.comparedTo(d) > 0 ? (e > 0 ? d : n1) : n;

      exp = MAX_EXP;
      MAX_EXP = 1 / 0;
      n = new BigNumber(s);

      // n0 = d1 = 0
      n0.c[0] = 0;

      for (; ;)  {
        q = div(n, d, 0, 1);
        d2 = d0.plus(q.times(d1));
        if (d2.comparedTo(md) == 1) break;
        d0 = d1;
        d1 = d2;
        n1 = n0.plus(q.times(d2 = n1));
        n0 = d2;
        d = n.minus(q.times(d2 = d));
        n = d2;
      }

      d2 = div(md.minus(d0), d1, 0, 1);
      n0 = n0.plus(d2.times(n1));
      d0 = d0.plus(d2.times(d1));
      n0.s = n1.s = x.s;
      e = e * 2;

      // Determine which fraction is closer to x, n0/d0 or n1/d1
      r = div(n1, d1, e, ROUNDING_MODE).minus(x).abs().comparedTo(
          div(n0, d0, e, ROUNDING_MODE).minus(x).abs()) < 1 ? [n1, d1] : [n0, d0];

      MAX_EXP = exp;

      return r;
    };


    /*
     * Return the value of this BigNumber converted to a number primitive.
     */
    P.toNumber = function () {
      return +valueOf(this);
    };


    /*
     * Return a string representing the value of this BigNumber rounded to sd significant digits
     * using rounding mode rm or ROUNDING_MODE. If sd is less than the number of digits
     * necessary to represent the integer part of the value in fixed-point notation, then use
     * exponential notation.
     *
     * [sd] {number} Significant digits. Integer, 1 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {sd|rm}'
     */
    P.toPrecision = function (sd, rm) {
      if (sd != null) intCheck(sd, 1, MAX);
      return format(this, sd, rm, 2);
    };


    /*
     * Return a string representing the value of this BigNumber in base b, or base 10 if b is
     * omitted. If a base is specified, including base 10, round according to DECIMAL_PLACES and
     * ROUNDING_MODE. If a base is not specified, and this BigNumber has a positive exponent
     * that is equal to or greater than TO_EXP_POS, or a negative exponent equal to or less than
     * TO_EXP_NEG, return exponential notation.
     *
     * [b] {number} Integer, 2 to ALPHABET.length inclusive.
     *
     * '[BigNumber Error] Base {not a primitive number|not an integer|out of range}: {b}'
     */
    P.toString = function (b) {
      var str,
        n = this,
        s = n.s,
        e = n.e;

      // Infinity or NaN?
      if (e === null) {
        if (s) {
          str = 'Infinity';
          if (s < 0) str = '-' + str;
        } else {
          str = 'NaN';
        }
      } else {
        if (b == null) {
          str = e <= TO_EXP_NEG || e >= TO_EXP_POS
           ? toExponential(coeffToString(n.c), e)
           : toFixedPoint(coeffToString(n.c), e, '0');
        } else if (b === 10 && alphabetHasNormalDecimalDigits) {
          n = round(new BigNumber(n), DECIMAL_PLACES + e + 1, ROUNDING_MODE);
          str = toFixedPoint(coeffToString(n.c), n.e, '0');
        } else {
          intCheck(b, 2, ALPHABET.length, 'Base');
          str = convertBase(toFixedPoint(coeffToString(n.c), e, '0'), 10, b, s, true);
        }

        if (s < 0 && n.c[0]) str = '-' + str;
      }

      return str;
    };


    /*
     * Return as toString, but do not accept a base argument, and include the minus sign for
     * negative zero.
     */
    P.valueOf = P.toJSON = function () {
      return valueOf(this);
    };


    P._isBigNumber = true;

    if (configObject != null) BigNumber.set(configObject);

    return BigNumber;
  }


  // PRIVATE HELPER FUNCTIONS

  // These functions don't need access to variables,
  // e.g. DECIMAL_PLACES, in the scope of the `clone` function above.


  function bitFloor(n) {
    var i = n | 0;
    return n > 0 || n === i ? i : i - 1;
  }


  // Return a coefficient array as a string of base 10 digits.
  function coeffToString(a) {
    var s, z,
      i = 1,
      j = a.length,
      r = a[0] + '';

    for (; i < j;) {
      s = a[i++] + '';
      z = LOG_BASE - s.length;
      for (; z--; s = '0' + s);
      r += s;
    }

    // Determine trailing zeros.
    for (j = r.length; r.charCodeAt(--j) === 48;);

    return r.slice(0, j + 1 || 1);
  }


  // Compare the value of BigNumbers x and y.
  function compare(x, y) {
    var a, b,
      xc = x.c,
      yc = y.c,
      i = x.s,
      j = y.s,
      k = x.e,
      l = y.e;

    // Either NaN?
    if (!i || !j) return null;

    a = xc && !xc[0];
    b = yc && !yc[0];

    // Either zero?
    if (a || b) return a ? b ? 0 : -j : i;

    // Signs differ?
    if (i != j) return i;

    a = i < 0;
    b = k == l;

    // Either Infinity?
    if (!xc || !yc) return b ? 0 : !xc ^ a ? 1 : -1;

    // Compare exponents.
    if (!b) return k > l ^ a ? 1 : -1;

    j = (k = xc.length) < (l = yc.length) ? k : l;

    // Compare digit by digit.
    for (i = 0; i < j; i++) if (xc[i] != yc[i]) return xc[i] > yc[i] ^ a ? 1 : -1;

    // Compare lengths.
    return k == l ? 0 : k > l ^ a ? 1 : -1;
  }


  /*
   * Check that n is a primitive number, an integer, and in range, otherwise throw.
   */
  function intCheck(n, min, max, name) {
    if (n < min || n > max || n !== mathfloor(n)) {
      throw Error
       (bignumberError + (name || 'Argument') + (typeof n == 'number'
         ? n < min || n > max ? ' out of range: ' : ' not an integer: '
         : ' not a primitive number: ') + String(n));
    }
  }


  // Assumes finite n.
  function isOdd(n) {
    var k = n.c.length - 1;
    return bitFloor(n.e / LOG_BASE) == k && n.c[k] % 2 != 0;
  }


  function toExponential(str, e) {
    return (str.length > 1 ? str.charAt(0) + '.' + str.slice(1) : str) +
     (e < 0 ? 'e' : 'e+') + e;
  }


  function toFixedPoint(str, e, z) {
    var len, zs;

    // Negative exponent?
    if (e < 0) {

      // Prepend zeros.
      for (zs = z + '.'; ++e; zs += z);
      str = zs + str;

    // Positive exponent
    } else {
      len = str.length;

      // Append zeros.
      if (++e > len) {
        for (zs = z, e -= len; --e; zs += z);
        str += zs;
      } else if (e < len) {
        str = str.slice(0, e) + '.' + str.slice(e);
      }
    }

    return str;
  }


  // EXPORT


  BigNumber = clone();
  BigNumber['default'] = BigNumber.BigNumber = BigNumber;

  // AMD.
  if (typeof define == 'function' && define.amd) {
    define(function () { return BigNumber; });

  // Node.js and other environments that support module.exports.
  } else if (typeof module != 'undefined' && module.exports) {
    module.exports = BigNumber;

  // Browser.
  } else {
    if (!globalObject) {
      globalObject = typeof self != 'undefined' && self ? self : window;
    }

    globalObject.BigNumber = BigNumber;
  }
})(this);

},{}],3:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');

var callBind = require('./');

var $indexOf = callBind(GetIntrinsic('String.prototype.indexOf'));

module.exports = function callBoundIntrinsic(name, allowMissing) {
	var intrinsic = GetIntrinsic(name, !!allowMissing);
	if (typeof intrinsic === 'function' && $indexOf(name, '.prototype.') > -1) {
		return callBind(intrinsic);
	}
	return intrinsic;
};

},{"./":4,"get-intrinsic":16}],4:[function(require,module,exports){
'use strict';

var bind = require('function-bind');
var GetIntrinsic = require('get-intrinsic');
var setFunctionLength = require('set-function-length');

var $TypeError = require('es-errors/type');
var $apply = GetIntrinsic('%Function.prototype.apply%');
var $call = GetIntrinsic('%Function.prototype.call%');
var $reflectApply = GetIntrinsic('%Reflect.apply%', true) || bind.call($call, $apply);

var $defineProperty = require('es-define-property');
var $max = GetIntrinsic('%Math.max%');

module.exports = function callBind(originalFunction) {
	if (typeof originalFunction !== 'function') {
		throw new $TypeError('a function is required');
	}
	var func = $reflectApply(bind, $call, arguments);
	return setFunctionLength(
		func,
		1 + $max(0, originalFunction.length - (arguments.length - 1)),
		true
	);
};

var applyBind = function applyBind() {
	return $reflectApply(bind, $apply, arguments);
};

if ($defineProperty) {
	$defineProperty(module.exports, 'apply', { value: applyBind });
} else {
	module.exports.apply = applyBind;
}

},{"es-define-property":6,"es-errors/type":12,"function-bind":15,"get-intrinsic":16,"set-function-length":29}],5:[function(require,module,exports){
'use strict';

var $defineProperty = require('es-define-property');

var $SyntaxError = require('es-errors/syntax');
var $TypeError = require('es-errors/type');

var gopd = require('gopd');

/** @type {import('.')} */
module.exports = function defineDataProperty(
	obj,
	property,
	value
) {
	if (!obj || (typeof obj !== 'object' && typeof obj !== 'function')) {
		throw new $TypeError('`obj` must be an object or a function`');
	}
	if (typeof property !== 'string' && typeof property !== 'symbol') {
		throw new $TypeError('`property` must be a string or a symbol`');
	}
	if (arguments.length > 3 && typeof arguments[3] !== 'boolean' && arguments[3] !== null) {
		throw new $TypeError('`nonEnumerable`, if provided, must be a boolean or null');
	}
	if (arguments.length > 4 && typeof arguments[4] !== 'boolean' && arguments[4] !== null) {
		throw new $TypeError('`nonWritable`, if provided, must be a boolean or null');
	}
	if (arguments.length > 5 && typeof arguments[5] !== 'boolean' && arguments[5] !== null) {
		throw new $TypeError('`nonConfigurable`, if provided, must be a boolean or null');
	}
	if (arguments.length > 6 && typeof arguments[6] !== 'boolean') {
		throw new $TypeError('`loose`, if provided, must be a boolean');
	}

	var nonEnumerable = arguments.length > 3 ? arguments[3] : null;
	var nonWritable = arguments.length > 4 ? arguments[4] : null;
	var nonConfigurable = arguments.length > 5 ? arguments[5] : null;
	var loose = arguments.length > 6 ? arguments[6] : false;

	/* @type {false | TypedPropertyDescriptor<unknown>} */
	var desc = !!gopd && gopd(obj, property);

	if ($defineProperty) {
		$defineProperty(obj, property, {
			configurable: nonConfigurable === null && desc ? desc.configurable : !nonConfigurable,
			enumerable: nonEnumerable === null && desc ? desc.enumerable : !nonEnumerable,
			value: value,
			writable: nonWritable === null && desc ? desc.writable : !nonWritable
		});
	} else if (loose || (!nonEnumerable && !nonWritable && !nonConfigurable)) {
		// must fall back to [[Set]], and was not explicitly asked to make non-enumerable, non-writable, or non-configurable
		obj[property] = value; // eslint-disable-line no-param-reassign
	} else {
		throw new $SyntaxError('This environment does not support defining a property as non-configurable, non-writable, or non-enumerable.');
	}
};

},{"es-define-property":6,"es-errors/syntax":11,"es-errors/type":12,"gopd":17}],6:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');

/** @type {import('.')} */
var $defineProperty = GetIntrinsic('%Object.defineProperty%', true) || false;
if ($defineProperty) {
	try {
		$defineProperty({}, 'a', { value: 1 });
	} catch (e) {
		// IE 8 has a broken defineProperty
		$defineProperty = false;
	}
}

module.exports = $defineProperty;

},{"get-intrinsic":16}],7:[function(require,module,exports){
'use strict';

/** @type {import('./eval')} */
module.exports = EvalError;

},{}],8:[function(require,module,exports){
'use strict';

/** @type {import('.')} */
module.exports = Error;

},{}],9:[function(require,module,exports){
'use strict';

/** @type {import('./range')} */
module.exports = RangeError;

},{}],10:[function(require,module,exports){
'use strict';

/** @type {import('./ref')} */
module.exports = ReferenceError;

},{}],11:[function(require,module,exports){
'use strict';

/** @type {import('./syntax')} */
module.exports = SyntaxError;

},{}],12:[function(require,module,exports){
'use strict';

/** @type {import('./type')} */
module.exports = TypeError;

},{}],13:[function(require,module,exports){
'use strict';

/** @type {import('./uri')} */
module.exports = URIError;

},{}],14:[function(require,module,exports){
'use strict';

/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var toStr = Object.prototype.toString;
var max = Math.max;
var funcType = '[object Function]';

var concatty = function concatty(a, b) {
    var arr = [];

    for (var i = 0; i < a.length; i += 1) {
        arr[i] = a[i];
    }
    for (var j = 0; j < b.length; j += 1) {
        arr[j + a.length] = b[j];
    }

    return arr;
};

var slicy = function slicy(arrLike, offset) {
    var arr = [];
    for (var i = offset || 0, j = 0; i < arrLike.length; i += 1, j += 1) {
        arr[j] = arrLike[i];
    }
    return arr;
};

var joiny = function (arr, joiner) {
    var str = '';
    for (var i = 0; i < arr.length; i += 1) {
        str += arr[i];
        if (i + 1 < arr.length) {
            str += joiner;
        }
    }
    return str;
};

module.exports = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr.apply(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slicy(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                concatty(args, arguments)
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        }
        return target.apply(
            that,
            concatty(args, arguments)
        );

    };

    var boundLength = max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs[i] = '$' + i;
    }

    bound = Function('binder', 'return function (' + joiny(boundArgs, ',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

},{}],15:[function(require,module,exports){
'use strict';

var implementation = require('./implementation');

module.exports = Function.prototype.bind || implementation;

},{"./implementation":14}],16:[function(require,module,exports){
'use strict';

var undefined;

var $Error = require('es-errors');
var $EvalError = require('es-errors/eval');
var $RangeError = require('es-errors/range');
var $ReferenceError = require('es-errors/ref');
var $SyntaxError = require('es-errors/syntax');
var $TypeError = require('es-errors/type');
var $URIError = require('es-errors/uri');

var $Function = Function;

// eslint-disable-next-line consistent-return
var getEvalledConstructor = function (expressionSyntax) {
	try {
		return $Function('"use strict"; return (' + expressionSyntax + ').constructor;')();
	} catch (e) {}
};

var $gOPD = Object.getOwnPropertyDescriptor;
if ($gOPD) {
	try {
		$gOPD({}, '');
	} catch (e) {
		$gOPD = null; // this is IE 8, which has a broken gOPD
	}
}

var throwTypeError = function () {
	throw new $TypeError();
};
var ThrowTypeError = $gOPD
	? (function () {
		try {
			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
			arguments.callee; // IE 8 does not throw here
			return throwTypeError;
		} catch (calleeThrows) {
			try {
				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
				return $gOPD(arguments, 'callee').get;
			} catch (gOPDthrows) {
				return throwTypeError;
			}
		}
	}())
	: throwTypeError;

var hasSymbols = require('has-symbols')();
var hasProto = require('has-proto')();

var getProto = Object.getPrototypeOf || (
	hasProto
		? function (x) { return x.__proto__; } // eslint-disable-line no-proto
		: null
);

var needsEval = {};

var TypedArray = typeof Uint8Array === 'undefined' || !getProto ? undefined : getProto(Uint8Array);

var INTRINSICS = {
	__proto__: null,
	'%AggregateError%': typeof AggregateError === 'undefined' ? undefined : AggregateError,
	'%Array%': Array,
	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined : ArrayBuffer,
	'%ArrayIteratorPrototype%': hasSymbols && getProto ? getProto([][Symbol.iterator]()) : undefined,
	'%AsyncFromSyncIteratorPrototype%': undefined,
	'%AsyncFunction%': needsEval,
	'%AsyncGenerator%': needsEval,
	'%AsyncGeneratorFunction%': needsEval,
	'%AsyncIteratorPrototype%': needsEval,
	'%Atomics%': typeof Atomics === 'undefined' ? undefined : Atomics,
	'%BigInt%': typeof BigInt === 'undefined' ? undefined : BigInt,
	'%BigInt64Array%': typeof BigInt64Array === 'undefined' ? undefined : BigInt64Array,
	'%BigUint64Array%': typeof BigUint64Array === 'undefined' ? undefined : BigUint64Array,
	'%Boolean%': Boolean,
	'%DataView%': typeof DataView === 'undefined' ? undefined : DataView,
	'%Date%': Date,
	'%decodeURI%': decodeURI,
	'%decodeURIComponent%': decodeURIComponent,
	'%encodeURI%': encodeURI,
	'%encodeURIComponent%': encodeURIComponent,
	'%Error%': $Error,
	'%eval%': eval, // eslint-disable-line no-eval
	'%EvalError%': $EvalError,
	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined : Float32Array,
	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined : Float64Array,
	'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined : FinalizationRegistry,
	'%Function%': $Function,
	'%GeneratorFunction%': needsEval,
	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined : Int8Array,
	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined : Int16Array,
	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined : Int32Array,
	'%isFinite%': isFinite,
	'%isNaN%': isNaN,
	'%IteratorPrototype%': hasSymbols && getProto ? getProto(getProto([][Symbol.iterator]())) : undefined,
	'%JSON%': typeof JSON === 'object' ? JSON : undefined,
	'%Map%': typeof Map === 'undefined' ? undefined : Map,
	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols || !getProto ? undefined : getProto(new Map()[Symbol.iterator]()),
	'%Math%': Math,
	'%Number%': Number,
	'%Object%': Object,
	'%parseFloat%': parseFloat,
	'%parseInt%': parseInt,
	'%Promise%': typeof Promise === 'undefined' ? undefined : Promise,
	'%Proxy%': typeof Proxy === 'undefined' ? undefined : Proxy,
	'%RangeError%': $RangeError,
	'%ReferenceError%': $ReferenceError,
	'%Reflect%': typeof Reflect === 'undefined' ? undefined : Reflect,
	'%RegExp%': RegExp,
	'%Set%': typeof Set === 'undefined' ? undefined : Set,
	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols || !getProto ? undefined : getProto(new Set()[Symbol.iterator]()),
	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined : SharedArrayBuffer,
	'%String%': String,
	'%StringIteratorPrototype%': hasSymbols && getProto ? getProto(''[Symbol.iterator]()) : undefined,
	'%Symbol%': hasSymbols ? Symbol : undefined,
	'%SyntaxError%': $SyntaxError,
	'%ThrowTypeError%': ThrowTypeError,
	'%TypedArray%': TypedArray,
	'%TypeError%': $TypeError,
	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined : Uint8Array,
	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined : Uint8ClampedArray,
	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined : Uint16Array,
	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined : Uint32Array,
	'%URIError%': $URIError,
	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined : WeakMap,
	'%WeakRef%': typeof WeakRef === 'undefined' ? undefined : WeakRef,
	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined : WeakSet
};

if (getProto) {
	try {
		null.error; // eslint-disable-line no-unused-expressions
	} catch (e) {
		// https://github.com/tc39/proposal-shadowrealm/pull/384#issuecomment-1364264229
		var errorProto = getProto(getProto(e));
		INTRINSICS['%Error.prototype%'] = errorProto;
	}
}

var doEval = function doEval(name) {
	var value;
	if (name === '%AsyncFunction%') {
		value = getEvalledConstructor('async function () {}');
	} else if (name === '%GeneratorFunction%') {
		value = getEvalledConstructor('function* () {}');
	} else if (name === '%AsyncGeneratorFunction%') {
		value = getEvalledConstructor('async function* () {}');
	} else if (name === '%AsyncGenerator%') {
		var fn = doEval('%AsyncGeneratorFunction%');
		if (fn) {
			value = fn.prototype;
		}
	} else if (name === '%AsyncIteratorPrototype%') {
		var gen = doEval('%AsyncGenerator%');
		if (gen && getProto) {
			value = getProto(gen.prototype);
		}
	}

	INTRINSICS[name] = value;

	return value;
};

var LEGACY_ALIASES = {
	__proto__: null,
	'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
	'%ArrayPrototype%': ['Array', 'prototype'],
	'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
	'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
	'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
	'%ArrayProto_values%': ['Array', 'prototype', 'values'],
	'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
	'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
	'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
	'%BooleanPrototype%': ['Boolean', 'prototype'],
	'%DataViewPrototype%': ['DataView', 'prototype'],
	'%DatePrototype%': ['Date', 'prototype'],
	'%ErrorPrototype%': ['Error', 'prototype'],
	'%EvalErrorPrototype%': ['EvalError', 'prototype'],
	'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
	'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
	'%FunctionPrototype%': ['Function', 'prototype'],
	'%Generator%': ['GeneratorFunction', 'prototype'],
	'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
	'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
	'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
	'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
	'%JSONParse%': ['JSON', 'parse'],
	'%JSONStringify%': ['JSON', 'stringify'],
	'%MapPrototype%': ['Map', 'prototype'],
	'%NumberPrototype%': ['Number', 'prototype'],
	'%ObjectPrototype%': ['Object', 'prototype'],
	'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
	'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
	'%PromisePrototype%': ['Promise', 'prototype'],
	'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
	'%Promise_all%': ['Promise', 'all'],
	'%Promise_reject%': ['Promise', 'reject'],
	'%Promise_resolve%': ['Promise', 'resolve'],
	'%RangeErrorPrototype%': ['RangeError', 'prototype'],
	'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
	'%RegExpPrototype%': ['RegExp', 'prototype'],
	'%SetPrototype%': ['Set', 'prototype'],
	'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
	'%StringPrototype%': ['String', 'prototype'],
	'%SymbolPrototype%': ['Symbol', 'prototype'],
	'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
	'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
	'%TypeErrorPrototype%': ['TypeError', 'prototype'],
	'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
	'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
	'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
	'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
	'%URIErrorPrototype%': ['URIError', 'prototype'],
	'%WeakMapPrototype%': ['WeakMap', 'prototype'],
	'%WeakSetPrototype%': ['WeakSet', 'prototype']
};

var bind = require('function-bind');
var hasOwn = require('hasown');
var $concat = bind.call(Function.call, Array.prototype.concat);
var $spliceApply = bind.call(Function.apply, Array.prototype.splice);
var $replace = bind.call(Function.call, String.prototype.replace);
var $strSlice = bind.call(Function.call, String.prototype.slice);
var $exec = bind.call(Function.call, RegExp.prototype.exec);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath = function stringToPath(string) {
	var first = $strSlice(string, 0, 1);
	var last = $strSlice(string, -1);
	if (first === '%' && last !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected closing `%`');
	} else if (last === '%' && first !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected opening `%`');
	}
	var result = [];
	$replace(string, rePropName, function (match, number, quote, subString) {
		result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : number || match;
	});
	return result;
};
/* end adaptation */

var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
	var intrinsicName = name;
	var alias;
	if (hasOwn(LEGACY_ALIASES, intrinsicName)) {
		alias = LEGACY_ALIASES[intrinsicName];
		intrinsicName = '%' + alias[0] + '%';
	}

	if (hasOwn(INTRINSICS, intrinsicName)) {
		var value = INTRINSICS[intrinsicName];
		if (value === needsEval) {
			value = doEval(intrinsicName);
		}
		if (typeof value === 'undefined' && !allowMissing) {
			throw new $TypeError('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
		}

		return {
			alias: alias,
			name: intrinsicName,
			value: value
		};
	}

	throw new $SyntaxError('intrinsic ' + name + ' does not exist!');
};

module.exports = function GetIntrinsic(name, allowMissing) {
	if (typeof name !== 'string' || name.length === 0) {
		throw new $TypeError('intrinsic name must be a non-empty string');
	}
	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
		throw new $TypeError('"allowMissing" argument must be a boolean');
	}

	if ($exec(/^%?[^%]*%?$/, name) === null) {
		throw new $SyntaxError('`%` may not be present anywhere but at the beginning and end of the intrinsic name');
	}
	var parts = stringToPath(name);
	var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

	var intrinsic = getBaseIntrinsic('%' + intrinsicBaseName + '%', allowMissing);
	var intrinsicRealName = intrinsic.name;
	var value = intrinsic.value;
	var skipFurtherCaching = false;

	var alias = intrinsic.alias;
	if (alias) {
		intrinsicBaseName = alias[0];
		$spliceApply(parts, $concat([0, 1], alias));
	}

	for (var i = 1, isOwn = true; i < parts.length; i += 1) {
		var part = parts[i];
		var first = $strSlice(part, 0, 1);
		var last = $strSlice(part, -1);
		if (
			(
				(first === '"' || first === "'" || first === '`')
				|| (last === '"' || last === "'" || last === '`')
			)
			&& first !== last
		) {
			throw new $SyntaxError('property names with quotes must have matching quotes');
		}
		if (part === 'constructor' || !isOwn) {
			skipFurtherCaching = true;
		}

		intrinsicBaseName += '.' + part;
		intrinsicRealName = '%' + intrinsicBaseName + '%';

		if (hasOwn(INTRINSICS, intrinsicRealName)) {
			value = INTRINSICS[intrinsicRealName];
		} else if (value != null) {
			if (!(part in value)) {
				if (!allowMissing) {
					throw new $TypeError('base intrinsic for ' + name + ' exists, but the property is not available.');
				}
				return void undefined;
			}
			if ($gOPD && (i + 1) >= parts.length) {
				var desc = $gOPD(value, part);
				isOwn = !!desc;

				// By convention, when a data property is converted to an accessor
				// property to emulate a data property that does not suffer from
				// the override mistake, that accessor's getter is marked with
				// an `originalValue` property. Here, when we detect this, we
				// uphold the illusion by pretending to see that original data
				// property, i.e., returning the value rather than the getter
				// itself.
				if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
					value = desc.get;
				} else {
					value = value[part];
				}
			} else {
				isOwn = hasOwn(value, part);
				value = value[part];
			}

			if (isOwn && !skipFurtherCaching) {
				INTRINSICS[intrinsicRealName] = value;
			}
		}
	}
	return value;
};

},{"es-errors":8,"es-errors/eval":7,"es-errors/range":9,"es-errors/ref":10,"es-errors/syntax":11,"es-errors/type":12,"es-errors/uri":13,"function-bind":15,"has-proto":19,"has-symbols":20,"hasown":22}],17:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');

var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%', true);

if ($gOPD) {
	try {
		$gOPD([], 'length');
	} catch (e) {
		// IE 8 has a broken gOPD
		$gOPD = null;
	}
}

module.exports = $gOPD;

},{"get-intrinsic":16}],18:[function(require,module,exports){
'use strict';

var $defineProperty = require('es-define-property');

var hasPropertyDescriptors = function hasPropertyDescriptors() {
	return !!$defineProperty;
};

hasPropertyDescriptors.hasArrayLengthDefineBug = function hasArrayLengthDefineBug() {
	// node v0.6 has a bug where array lengths can be Set but not Defined
	if (!$defineProperty) {
		return null;
	}
	try {
		return $defineProperty([], 'length', { value: 1 }).length !== 1;
	} catch (e) {
		// In Firefox 4-22, defining length on an array throws an exception.
		return true;
	}
};

module.exports = hasPropertyDescriptors;

},{"es-define-property":6}],19:[function(require,module,exports){
'use strict';

var test = {
	__proto__: null,
	foo: {}
};

var $Object = Object;

/** @type {import('.')} */
module.exports = function hasProto() {
	// @ts-expect-error: TS errors on an inherited property for some reason
	return { __proto__: test }.foo === test.foo
		&& !(test instanceof $Object);
};

},{}],20:[function(require,module,exports){
'use strict';

var origSymbol = typeof Symbol !== 'undefined' && Symbol;
var hasSymbolSham = require('./shams');

module.exports = function hasNativeSymbols() {
	if (typeof origSymbol !== 'function') { return false; }
	if (typeof Symbol !== 'function') { return false; }
	if (typeof origSymbol('foo') !== 'symbol') { return false; }
	if (typeof Symbol('bar') !== 'symbol') { return false; }

	return hasSymbolSham();
};

},{"./shams":21}],21:[function(require,module,exports){
'use strict';

/* eslint complexity: [2, 18], max-statements: [2, 33] */
module.exports = function hasSymbols() {
	if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
	if (typeof Symbol.iterator === 'symbol') { return true; }

	var obj = {};
	var sym = Symbol('test');
	var symObj = Object(sym);
	if (typeof sym === 'string') { return false; }

	if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
	if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

	// temp disabled per https://github.com/ljharb/object.assign/issues/17
	// if (sym instanceof Symbol) { return false; }
	// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
	// if (!(symObj instanceof Symbol)) { return false; }

	// if (typeof Symbol.prototype.toString !== 'function') { return false; }
	// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

	var symVal = 42;
	obj[sym] = symVal;
	for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax, no-unreachable-loop
	if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

	if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

	var syms = Object.getOwnPropertySymbols(obj);
	if (syms.length !== 1 || syms[0] !== sym) { return false; }

	if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

	if (typeof Object.getOwnPropertyDescriptor === 'function') {
		var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
		if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
	}

	return true;
};

},{}],22:[function(require,module,exports){
'use strict';

var call = Function.prototype.call;
var $hasOwn = Object.prototype.hasOwnProperty;
var bind = require('function-bind');

/** @type {import('.')} */
module.exports = bind.call(call, $hasOwn);

},{"function-bind":15}],23:[function(require,module,exports){
(function (global){(function (){
var hasMap = typeof Map === 'function' && Map.prototype;
var mapSizeDescriptor = Object.getOwnPropertyDescriptor && hasMap ? Object.getOwnPropertyDescriptor(Map.prototype, 'size') : null;
var mapSize = hasMap && mapSizeDescriptor && typeof mapSizeDescriptor.get === 'function' ? mapSizeDescriptor.get : null;
var mapForEach = hasMap && Map.prototype.forEach;
var hasSet = typeof Set === 'function' && Set.prototype;
var setSizeDescriptor = Object.getOwnPropertyDescriptor && hasSet ? Object.getOwnPropertyDescriptor(Set.prototype, 'size') : null;
var setSize = hasSet && setSizeDescriptor && typeof setSizeDescriptor.get === 'function' ? setSizeDescriptor.get : null;
var setForEach = hasSet && Set.prototype.forEach;
var hasWeakMap = typeof WeakMap === 'function' && WeakMap.prototype;
var weakMapHas = hasWeakMap ? WeakMap.prototype.has : null;
var hasWeakSet = typeof WeakSet === 'function' && WeakSet.prototype;
var weakSetHas = hasWeakSet ? WeakSet.prototype.has : null;
var hasWeakRef = typeof WeakRef === 'function' && WeakRef.prototype;
var weakRefDeref = hasWeakRef ? WeakRef.prototype.deref : null;
var booleanValueOf = Boolean.prototype.valueOf;
var objectToString = Object.prototype.toString;
var functionToString = Function.prototype.toString;
var $match = String.prototype.match;
var $slice = String.prototype.slice;
var $replace = String.prototype.replace;
var $toUpperCase = String.prototype.toUpperCase;
var $toLowerCase = String.prototype.toLowerCase;
var $test = RegExp.prototype.test;
var $concat = Array.prototype.concat;
var $join = Array.prototype.join;
var $arrSlice = Array.prototype.slice;
var $floor = Math.floor;
var bigIntValueOf = typeof BigInt === 'function' ? BigInt.prototype.valueOf : null;
var gOPS = Object.getOwnPropertySymbols;
var symToString = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol' ? Symbol.prototype.toString : null;
var hasShammedSymbols = typeof Symbol === 'function' && typeof Symbol.iterator === 'object';
// ie, `has-tostringtag/shams
var toStringTag = typeof Symbol === 'function' && Symbol.toStringTag && (typeof Symbol.toStringTag === hasShammedSymbols ? 'object' : 'symbol')
    ? Symbol.toStringTag
    : null;
var isEnumerable = Object.prototype.propertyIsEnumerable;

var gPO = (typeof Reflect === 'function' ? Reflect.getPrototypeOf : Object.getPrototypeOf) || (
    [].__proto__ === Array.prototype // eslint-disable-line no-proto
        ? function (O) {
            return O.__proto__; // eslint-disable-line no-proto
        }
        : null
);

function addNumericSeparator(num, str) {
    if (
        num === Infinity
        || num === -Infinity
        || num !== num
        || (num && num > -1000 && num < 1000)
        || $test.call(/e/, str)
    ) {
        return str;
    }
    var sepRegex = /[0-9](?=(?:[0-9]{3})+(?![0-9]))/g;
    if (typeof num === 'number') {
        var int = num < 0 ? -$floor(-num) : $floor(num); // trunc(num)
        if (int !== num) {
            var intStr = String(int);
            var dec = $slice.call(str, intStr.length + 1);
            return $replace.call(intStr, sepRegex, '$&_') + '.' + $replace.call($replace.call(dec, /([0-9]{3})/g, '$&_'), /_$/, '');
        }
    }
    return $replace.call(str, sepRegex, '$&_');
}

var utilInspect = require('./util.inspect');
var inspectCustom = utilInspect.custom;
var inspectSymbol = isSymbol(inspectCustom) ? inspectCustom : null;

module.exports = function inspect_(obj, options, depth, seen) {
    var opts = options || {};

    if (has(opts, 'quoteStyle') && (opts.quoteStyle !== 'single' && opts.quoteStyle !== 'double')) {
        throw new TypeError('option "quoteStyle" must be "single" or "double"');
    }
    if (
        has(opts, 'maxStringLength') && (typeof opts.maxStringLength === 'number'
            ? opts.maxStringLength < 0 && opts.maxStringLength !== Infinity
            : opts.maxStringLength !== null
        )
    ) {
        throw new TypeError('option "maxStringLength", if provided, must be a positive integer, Infinity, or `null`');
    }
    var customInspect = has(opts, 'customInspect') ? opts.customInspect : true;
    if (typeof customInspect !== 'boolean' && customInspect !== 'symbol') {
        throw new TypeError('option "customInspect", if provided, must be `true`, `false`, or `\'symbol\'`');
    }

    if (
        has(opts, 'indent')
        && opts.indent !== null
        && opts.indent !== '\t'
        && !(parseInt(opts.indent, 10) === opts.indent && opts.indent > 0)
    ) {
        throw new TypeError('option "indent" must be "\\t", an integer > 0, or `null`');
    }
    if (has(opts, 'numericSeparator') && typeof opts.numericSeparator !== 'boolean') {
        throw new TypeError('option "numericSeparator", if provided, must be `true` or `false`');
    }
    var numericSeparator = opts.numericSeparator;

    if (typeof obj === 'undefined') {
        return 'undefined';
    }
    if (obj === null) {
        return 'null';
    }
    if (typeof obj === 'boolean') {
        return obj ? 'true' : 'false';
    }

    if (typeof obj === 'string') {
        return inspectString(obj, opts);
    }
    if (typeof obj === 'number') {
        if (obj === 0) {
            return Infinity / obj > 0 ? '0' : '-0';
        }
        var str = String(obj);
        return numericSeparator ? addNumericSeparator(obj, str) : str;
    }
    if (typeof obj === 'bigint') {
        var bigIntStr = String(obj) + 'n';
        return numericSeparator ? addNumericSeparator(obj, bigIntStr) : bigIntStr;
    }

    var maxDepth = typeof opts.depth === 'undefined' ? 5 : opts.depth;
    if (typeof depth === 'undefined') { depth = 0; }
    if (depth >= maxDepth && maxDepth > 0 && typeof obj === 'object') {
        return isArray(obj) ? '[Array]' : '[Object]';
    }

    var indent = getIndent(opts, depth);

    if (typeof seen === 'undefined') {
        seen = [];
    } else if (indexOf(seen, obj) >= 0) {
        return '[Circular]';
    }

    function inspect(value, from, noIndent) {
        if (from) {
            seen = $arrSlice.call(seen);
            seen.push(from);
        }
        if (noIndent) {
            var newOpts = {
                depth: opts.depth
            };
            if (has(opts, 'quoteStyle')) {
                newOpts.quoteStyle = opts.quoteStyle;
            }
            return inspect_(value, newOpts, depth + 1, seen);
        }
        return inspect_(value, opts, depth + 1, seen);
    }

    if (typeof obj === 'function' && !isRegExp(obj)) { // in older engines, regexes are callable
        var name = nameOf(obj);
        var keys = arrObjKeys(obj, inspect);
        return '[Function' + (name ? ': ' + name : ' (anonymous)') + ']' + (keys.length > 0 ? ' { ' + $join.call(keys, ', ') + ' }' : '');
    }
    if (isSymbol(obj)) {
        var symString = hasShammedSymbols ? $replace.call(String(obj), /^(Symbol\(.*\))_[^)]*$/, '$1') : symToString.call(obj);
        return typeof obj === 'object' && !hasShammedSymbols ? markBoxed(symString) : symString;
    }
    if (isElement(obj)) {
        var s = '<' + $toLowerCase.call(String(obj.nodeName));
        var attrs = obj.attributes || [];
        for (var i = 0; i < attrs.length; i++) {
            s += ' ' + attrs[i].name + '=' + wrapQuotes(quote(attrs[i].value), 'double', opts);
        }
        s += '>';
        if (obj.childNodes && obj.childNodes.length) { s += '...'; }
        s += '</' + $toLowerCase.call(String(obj.nodeName)) + '>';
        return s;
    }
    if (isArray(obj)) {
        if (obj.length === 0) { return '[]'; }
        var xs = arrObjKeys(obj, inspect);
        if (indent && !singleLineValues(xs)) {
            return '[' + indentedJoin(xs, indent) + ']';
        }
        return '[ ' + $join.call(xs, ', ') + ' ]';
    }
    if (isError(obj)) {
        var parts = arrObjKeys(obj, inspect);
        if (!('cause' in Error.prototype) && 'cause' in obj && !isEnumerable.call(obj, 'cause')) {
            return '{ [' + String(obj) + '] ' + $join.call($concat.call('[cause]: ' + inspect(obj.cause), parts), ', ') + ' }';
        }
        if (parts.length === 0) { return '[' + String(obj) + ']'; }
        return '{ [' + String(obj) + '] ' + $join.call(parts, ', ') + ' }';
    }
    if (typeof obj === 'object' && customInspect) {
        if (inspectSymbol && typeof obj[inspectSymbol] === 'function' && utilInspect) {
            return utilInspect(obj, { depth: maxDepth - depth });
        } else if (customInspect !== 'symbol' && typeof obj.inspect === 'function') {
            return obj.inspect();
        }
    }
    if (isMap(obj)) {
        var mapParts = [];
        if (mapForEach) {
            mapForEach.call(obj, function (value, key) {
                mapParts.push(inspect(key, obj, true) + ' => ' + inspect(value, obj));
            });
        }
        return collectionOf('Map', mapSize.call(obj), mapParts, indent);
    }
    if (isSet(obj)) {
        var setParts = [];
        if (setForEach) {
            setForEach.call(obj, function (value) {
                setParts.push(inspect(value, obj));
            });
        }
        return collectionOf('Set', setSize.call(obj), setParts, indent);
    }
    if (isWeakMap(obj)) {
        return weakCollectionOf('WeakMap');
    }
    if (isWeakSet(obj)) {
        return weakCollectionOf('WeakSet');
    }
    if (isWeakRef(obj)) {
        return weakCollectionOf('WeakRef');
    }
    if (isNumber(obj)) {
        return markBoxed(inspect(Number(obj)));
    }
    if (isBigInt(obj)) {
        return markBoxed(inspect(bigIntValueOf.call(obj)));
    }
    if (isBoolean(obj)) {
        return markBoxed(booleanValueOf.call(obj));
    }
    if (isString(obj)) {
        return markBoxed(inspect(String(obj)));
    }
    // note: in IE 8, sometimes `global !== window` but both are the prototypes of each other
    /* eslint-env browser */
    if (typeof window !== 'undefined' && obj === window) {
        return '{ [object Window] }';
    }
    if (obj === global) {
        return '{ [object globalThis] }';
    }
    if (!isDate(obj) && !isRegExp(obj)) {
        var ys = arrObjKeys(obj, inspect);
        var isPlainObject = gPO ? gPO(obj) === Object.prototype : obj instanceof Object || obj.constructor === Object;
        var protoTag = obj instanceof Object ? '' : 'null prototype';
        var stringTag = !isPlainObject && toStringTag && Object(obj) === obj && toStringTag in obj ? $slice.call(toStr(obj), 8, -1) : protoTag ? 'Object' : '';
        var constructorTag = isPlainObject || typeof obj.constructor !== 'function' ? '' : obj.constructor.name ? obj.constructor.name + ' ' : '';
        var tag = constructorTag + (stringTag || protoTag ? '[' + $join.call($concat.call([], stringTag || [], protoTag || []), ': ') + '] ' : '');
        if (ys.length === 0) { return tag + '{}'; }
        if (indent) {
            return tag + '{' + indentedJoin(ys, indent) + '}';
        }
        return tag + '{ ' + $join.call(ys, ', ') + ' }';
    }
    return String(obj);
};

function wrapQuotes(s, defaultStyle, opts) {
    var quoteChar = (opts.quoteStyle || defaultStyle) === 'double' ? '"' : "'";
    return quoteChar + s + quoteChar;
}

function quote(s) {
    return $replace.call(String(s), /"/g, '&quot;');
}

function isArray(obj) { return toStr(obj) === '[object Array]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isDate(obj) { return toStr(obj) === '[object Date]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isRegExp(obj) { return toStr(obj) === '[object RegExp]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isError(obj) { return toStr(obj) === '[object Error]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isString(obj) { return toStr(obj) === '[object String]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isNumber(obj) { return toStr(obj) === '[object Number]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isBoolean(obj) { return toStr(obj) === '[object Boolean]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }

// Symbol and BigInt do have Symbol.toStringTag by spec, so that can't be used to eliminate false positives
function isSymbol(obj) {
    if (hasShammedSymbols) {
        return obj && typeof obj === 'object' && obj instanceof Symbol;
    }
    if (typeof obj === 'symbol') {
        return true;
    }
    if (!obj || typeof obj !== 'object' || !symToString) {
        return false;
    }
    try {
        symToString.call(obj);
        return true;
    } catch (e) {}
    return false;
}

function isBigInt(obj) {
    if (!obj || typeof obj !== 'object' || !bigIntValueOf) {
        return false;
    }
    try {
        bigIntValueOf.call(obj);
        return true;
    } catch (e) {}
    return false;
}

var hasOwn = Object.prototype.hasOwnProperty || function (key) { return key in this; };
function has(obj, key) {
    return hasOwn.call(obj, key);
}

function toStr(obj) {
    return objectToString.call(obj);
}

function nameOf(f) {
    if (f.name) { return f.name; }
    var m = $match.call(functionToString.call(f), /^function\s*([\w$]+)/);
    if (m) { return m[1]; }
    return null;
}

function indexOf(xs, x) {
    if (xs.indexOf) { return xs.indexOf(x); }
    for (var i = 0, l = xs.length; i < l; i++) {
        if (xs[i] === x) { return i; }
    }
    return -1;
}

function isMap(x) {
    if (!mapSize || !x || typeof x !== 'object') {
        return false;
    }
    try {
        mapSize.call(x);
        try {
            setSize.call(x);
        } catch (s) {
            return true;
        }
        return x instanceof Map; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakMap(x) {
    if (!weakMapHas || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakMapHas.call(x, weakMapHas);
        try {
            weakSetHas.call(x, weakSetHas);
        } catch (s) {
            return true;
        }
        return x instanceof WeakMap; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakRef(x) {
    if (!weakRefDeref || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakRefDeref.call(x);
        return true;
    } catch (e) {}
    return false;
}

function isSet(x) {
    if (!setSize || !x || typeof x !== 'object') {
        return false;
    }
    try {
        setSize.call(x);
        try {
            mapSize.call(x);
        } catch (m) {
            return true;
        }
        return x instanceof Set; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakSet(x) {
    if (!weakSetHas || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakSetHas.call(x, weakSetHas);
        try {
            weakMapHas.call(x, weakMapHas);
        } catch (s) {
            return true;
        }
        return x instanceof WeakSet; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isElement(x) {
    if (!x || typeof x !== 'object') { return false; }
    if (typeof HTMLElement !== 'undefined' && x instanceof HTMLElement) {
        return true;
    }
    return typeof x.nodeName === 'string' && typeof x.getAttribute === 'function';
}

function inspectString(str, opts) {
    if (str.length > opts.maxStringLength) {
        var remaining = str.length - opts.maxStringLength;
        var trailer = '... ' + remaining + ' more character' + (remaining > 1 ? 's' : '');
        return inspectString($slice.call(str, 0, opts.maxStringLength), opts) + trailer;
    }
    // eslint-disable-next-line no-control-regex
    var s = $replace.call($replace.call(str, /(['\\])/g, '\\$1'), /[\x00-\x1f]/g, lowbyte);
    return wrapQuotes(s, 'single', opts);
}

function lowbyte(c) {
    var n = c.charCodeAt(0);
    var x = {
        8: 'b',
        9: 't',
        10: 'n',
        12: 'f',
        13: 'r'
    }[n];
    if (x) { return '\\' + x; }
    return '\\x' + (n < 0x10 ? '0' : '') + $toUpperCase.call(n.toString(16));
}

function markBoxed(str) {
    return 'Object(' + str + ')';
}

function weakCollectionOf(type) {
    return type + ' { ? }';
}

function collectionOf(type, size, entries, indent) {
    var joinedEntries = indent ? indentedJoin(entries, indent) : $join.call(entries, ', ');
    return type + ' (' + size + ') {' + joinedEntries + '}';
}

function singleLineValues(xs) {
    for (var i = 0; i < xs.length; i++) {
        if (indexOf(xs[i], '\n') >= 0) {
            return false;
        }
    }
    return true;
}

function getIndent(opts, depth) {
    var baseIndent;
    if (opts.indent === '\t') {
        baseIndent = '\t';
    } else if (typeof opts.indent === 'number' && opts.indent > 0) {
        baseIndent = $join.call(Array(opts.indent + 1), ' ');
    } else {
        return null;
    }
    return {
        base: baseIndent,
        prev: $join.call(Array(depth + 1), baseIndent)
    };
}

function indentedJoin(xs, indent) {
    if (xs.length === 0) { return ''; }
    var lineJoiner = '\n' + indent.prev + indent.base;
    return lineJoiner + $join.call(xs, ',' + lineJoiner) + '\n' + indent.prev;
}

function arrObjKeys(obj, inspect) {
    var isArr = isArray(obj);
    var xs = [];
    if (isArr) {
        xs.length = obj.length;
        for (var i = 0; i < obj.length; i++) {
            xs[i] = has(obj, i) ? inspect(obj[i], obj) : '';
        }
    }
    var syms = typeof gOPS === 'function' ? gOPS(obj) : [];
    var symMap;
    if (hasShammedSymbols) {
        symMap = {};
        for (var k = 0; k < syms.length; k++) {
            symMap['$' + syms[k]] = syms[k];
        }
    }

    for (var key in obj) { // eslint-disable-line no-restricted-syntax
        if (!has(obj, key)) { continue; } // eslint-disable-line no-restricted-syntax, no-continue
        if (isArr && String(Number(key)) === key && key < obj.length) { continue; } // eslint-disable-line no-restricted-syntax, no-continue
        if (hasShammedSymbols && symMap['$' + key] instanceof Symbol) {
            // this is to prevent shammed Symbols, which are stored as strings, from being included in the string key section
            continue; // eslint-disable-line no-restricted-syntax, no-continue
        } else if ($test.call(/[^\w$]/, key)) {
            xs.push(inspect(key, obj) + ': ' + inspect(obj[key], obj));
        } else {
            xs.push(key + ': ' + inspect(obj[key], obj));
        }
    }
    if (typeof gOPS === 'function') {
        for (var j = 0; j < syms.length; j++) {
            if (isEnumerable.call(obj, syms[j])) {
                xs.push('[' + inspect(syms[j]) + ']: ' + inspect(obj[syms[j]], obj));
            }
        }
    }
    return xs;
}

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./util.inspect":32}],24:[function(require,module,exports){
'use strict';

var replace = String.prototype.replace;
var percentTwenties = /%20/g;

var Format = {
    RFC1738: 'RFC1738',
    RFC3986: 'RFC3986'
};

module.exports = {
    'default': Format.RFC3986,
    formatters: {
        RFC1738: function (value) {
            return replace.call(value, percentTwenties, '+');
        },
        RFC3986: function (value) {
            return String(value);
        }
    },
    RFC1738: Format.RFC1738,
    RFC3986: Format.RFC3986
};

},{}],25:[function(require,module,exports){
'use strict';

var stringify = require('./stringify');
var parse = require('./parse');
var formats = require('./formats');

module.exports = {
    formats: formats,
    parse: parse,
    stringify: stringify
};

},{"./formats":24,"./parse":26,"./stringify":27}],26:[function(require,module,exports){
'use strict';

var utils = require('./utils');

var has = Object.prototype.hasOwnProperty;
var isArray = Array.isArray;

var defaults = {
    allowDots: false,
    allowEmptyArrays: false,
    allowPrototypes: false,
    allowSparse: false,
    arrayLimit: 20,
    charset: 'utf-8',
    charsetSentinel: false,
    comma: false,
    decodeDotInKeys: false,
    decoder: utils.decode,
    delimiter: '&',
    depth: 5,
    duplicates: 'combine',
    ignoreQueryPrefix: false,
    interpretNumericEntities: false,
    parameterLimit: 1000,
    parseArrays: true,
    plainObjects: false,
    strictNullHandling: false
};

var interpretNumericEntities = function (str) {
    return str.replace(/&#(\d+);/g, function ($0, numberStr) {
        return String.fromCharCode(parseInt(numberStr, 10));
    });
};

var parseArrayValue = function (val, options) {
    if (val && typeof val === 'string' && options.comma && val.indexOf(',') > -1) {
        return val.split(',');
    }

    return val;
};

// This is what browsers will submit when the ✓ character occurs in an
// application/x-www-form-urlencoded body and the encoding of the page containing
// the form is iso-8859-1, or when the submitted form has an accept-charset
// attribute of iso-8859-1. Presumably also with other charsets that do not contain
// the ✓ character, such as us-ascii.
var isoSentinel = 'utf8=%26%2310003%3B'; // encodeURIComponent('&#10003;')

// These are the percent-encoded utf-8 octets representing a checkmark, indicating that the request actually is utf-8 encoded.
var charsetSentinel = 'utf8=%E2%9C%93'; // encodeURIComponent('✓')

var parseValues = function parseQueryStringValues(str, options) {
    var obj = { __proto__: null };

    var cleanStr = options.ignoreQueryPrefix ? str.replace(/^\?/, '') : str;
    cleanStr = cleanStr.replace(/%5B/gi, '[').replace(/%5D/gi, ']');
    var limit = options.parameterLimit === Infinity ? undefined : options.parameterLimit;
    var parts = cleanStr.split(options.delimiter, limit);
    var skipIndex = -1; // Keep track of where the utf8 sentinel was found
    var i;

    var charset = options.charset;
    if (options.charsetSentinel) {
        for (i = 0; i < parts.length; ++i) {
            if (parts[i].indexOf('utf8=') === 0) {
                if (parts[i] === charsetSentinel) {
                    charset = 'utf-8';
                } else if (parts[i] === isoSentinel) {
                    charset = 'iso-8859-1';
                }
                skipIndex = i;
                i = parts.length; // The eslint settings do not allow break;
            }
        }
    }

    for (i = 0; i < parts.length; ++i) {
        if (i === skipIndex) {
            continue;
        }
        var part = parts[i];

        var bracketEqualsPos = part.indexOf(']=');
        var pos = bracketEqualsPos === -1 ? part.indexOf('=') : bracketEqualsPos + 1;

        var key, val;
        if (pos === -1) {
            key = options.decoder(part, defaults.decoder, charset, 'key');
            val = options.strictNullHandling ? null : '';
        } else {
            key = options.decoder(part.slice(0, pos), defaults.decoder, charset, 'key');
            val = utils.maybeMap(
                parseArrayValue(part.slice(pos + 1), options),
                function (encodedVal) {
                    return options.decoder(encodedVal, defaults.decoder, charset, 'value');
                }
            );
        }

        if (val && options.interpretNumericEntities && charset === 'iso-8859-1') {
            val = interpretNumericEntities(val);
        }

        if (part.indexOf('[]=') > -1) {
            val = isArray(val) ? [val] : val;
        }

        var existing = has.call(obj, key);
        if (existing && options.duplicates === 'combine') {
            obj[key] = utils.combine(obj[key], val);
        } else if (!existing || options.duplicates === 'last') {
            obj[key] = val;
        }
    }

    return obj;
};

var parseObject = function (chain, val, options, valuesParsed) {
    var leaf = valuesParsed ? val : parseArrayValue(val, options);

    for (var i = chain.length - 1; i >= 0; --i) {
        var obj;
        var root = chain[i];

        if (root === '[]' && options.parseArrays) {
            obj = options.allowEmptyArrays && leaf === '' ? [] : [].concat(leaf);
        } else {
            obj = options.plainObjects ? Object.create(null) : {};
            var cleanRoot = root.charAt(0) === '[' && root.charAt(root.length - 1) === ']' ? root.slice(1, -1) : root;
            var decodedRoot = options.decodeDotInKeys ? cleanRoot.replace(/%2E/g, '.') : cleanRoot;
            var index = parseInt(decodedRoot, 10);
            if (!options.parseArrays && decodedRoot === '') {
                obj = { 0: leaf };
            } else if (
                !isNaN(index)
                && root !== decodedRoot
                && String(index) === decodedRoot
                && index >= 0
                && (options.parseArrays && index <= options.arrayLimit)
            ) {
                obj = [];
                obj[index] = leaf;
            } else if (decodedRoot !== '__proto__') {
                obj[decodedRoot] = leaf;
            }
        }

        leaf = obj;
    }

    return leaf;
};

var parseKeys = function parseQueryStringKeys(givenKey, val, options, valuesParsed) {
    if (!givenKey) {
        return;
    }

    // Transform dot notation to bracket notation
    var key = options.allowDots ? givenKey.replace(/\.([^.[]+)/g, '[$1]') : givenKey;

    // The regex chunks

    var brackets = /(\[[^[\]]*])/;
    var child = /(\[[^[\]]*])/g;

    // Get the parent

    var segment = options.depth > 0 && brackets.exec(key);
    var parent = segment ? key.slice(0, segment.index) : key;

    // Stash the parent if it exists

    var keys = [];
    if (parent) {
        // If we aren't using plain objects, optionally prefix keys that would overwrite object prototype properties
        if (!options.plainObjects && has.call(Object.prototype, parent)) {
            if (!options.allowPrototypes) {
                return;
            }
        }

        keys.push(parent);
    }

    // Loop through children appending to the array until we hit depth

    var i = 0;
    while (options.depth > 0 && (segment = child.exec(key)) !== null && i < options.depth) {
        i += 1;
        if (!options.plainObjects && has.call(Object.prototype, segment[1].slice(1, -1))) {
            if (!options.allowPrototypes) {
                return;
            }
        }
        keys.push(segment[1]);
    }

    // If there's a remainder, just add whatever is left

    if (segment) {
        keys.push('[' + key.slice(segment.index) + ']');
    }

    return parseObject(keys, val, options, valuesParsed);
};

var normalizeParseOptions = function normalizeParseOptions(opts) {
    if (!opts) {
        return defaults;
    }

    if (typeof opts.allowEmptyArrays !== 'undefined' && typeof opts.allowEmptyArrays !== 'boolean') {
        throw new TypeError('`allowEmptyArrays` option can only be `true` or `false`, when provided');
    }

    if (typeof opts.decodeDotInKeys !== 'undefined' && typeof opts.decodeDotInKeys !== 'boolean') {
        throw new TypeError('`decodeDotInKeys` option can only be `true` or `false`, when provided');
    }

    if (opts.decoder !== null && typeof opts.decoder !== 'undefined' && typeof opts.decoder !== 'function') {
        throw new TypeError('Decoder has to be a function.');
    }

    if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
        throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
    }
    var charset = typeof opts.charset === 'undefined' ? defaults.charset : opts.charset;

    var duplicates = typeof opts.duplicates === 'undefined' ? defaults.duplicates : opts.duplicates;

    if (duplicates !== 'combine' && duplicates !== 'first' && duplicates !== 'last') {
        throw new TypeError('The duplicates option must be either combine, first, or last');
    }

    var allowDots = typeof opts.allowDots === 'undefined' ? opts.decodeDotInKeys === true ? true : defaults.allowDots : !!opts.allowDots;

    return {
        allowDots: allowDots,
        allowEmptyArrays: typeof opts.allowEmptyArrays === 'boolean' ? !!opts.allowEmptyArrays : defaults.allowEmptyArrays,
        allowPrototypes: typeof opts.allowPrototypes === 'boolean' ? opts.allowPrototypes : defaults.allowPrototypes,
        allowSparse: typeof opts.allowSparse === 'boolean' ? opts.allowSparse : defaults.allowSparse,
        arrayLimit: typeof opts.arrayLimit === 'number' ? opts.arrayLimit : defaults.arrayLimit,
        charset: charset,
        charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults.charsetSentinel,
        comma: typeof opts.comma === 'boolean' ? opts.comma : defaults.comma,
        decodeDotInKeys: typeof opts.decodeDotInKeys === 'boolean' ? opts.decodeDotInKeys : defaults.decodeDotInKeys,
        decoder: typeof opts.decoder === 'function' ? opts.decoder : defaults.decoder,
        delimiter: typeof opts.delimiter === 'string' || utils.isRegExp(opts.delimiter) ? opts.delimiter : defaults.delimiter,
        // eslint-disable-next-line no-implicit-coercion, no-extra-parens
        depth: (typeof opts.depth === 'number' || opts.depth === false) ? +opts.depth : defaults.depth,
        duplicates: duplicates,
        ignoreQueryPrefix: opts.ignoreQueryPrefix === true,
        interpretNumericEntities: typeof opts.interpretNumericEntities === 'boolean' ? opts.interpretNumericEntities : defaults.interpretNumericEntities,
        parameterLimit: typeof opts.parameterLimit === 'number' ? opts.parameterLimit : defaults.parameterLimit,
        parseArrays: opts.parseArrays !== false,
        plainObjects: typeof opts.plainObjects === 'boolean' ? opts.plainObjects : defaults.plainObjects,
        strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults.strictNullHandling
    };
};

module.exports = function (str, opts) {
    var options = normalizeParseOptions(opts);

    if (str === '' || str === null || typeof str === 'undefined') {
        return options.plainObjects ? Object.create(null) : {};
    }

    var tempObj = typeof str === 'string' ? parseValues(str, options) : str;
    var obj = options.plainObjects ? Object.create(null) : {};

    // Iterate over the keys and setup the new object

    var keys = Object.keys(tempObj);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var newObj = parseKeys(key, tempObj[key], options, typeof str === 'string');
        obj = utils.merge(obj, newObj, options);
    }

    if (options.allowSparse === true) {
        return obj;
    }

    return utils.compact(obj);
};

},{"./utils":28}],27:[function(require,module,exports){
'use strict';

var getSideChannel = require('side-channel');
var utils = require('./utils');
var formats = require('./formats');
var has = Object.prototype.hasOwnProperty;

var arrayPrefixGenerators = {
    brackets: function brackets(prefix) {
        return prefix + '[]';
    },
    comma: 'comma',
    indices: function indices(prefix, key) {
        return prefix + '[' + key + ']';
    },
    repeat: function repeat(prefix) {
        return prefix;
    }
};

var isArray = Array.isArray;
var push = Array.prototype.push;
var pushToArray = function (arr, valueOrArray) {
    push.apply(arr, isArray(valueOrArray) ? valueOrArray : [valueOrArray]);
};

var toISO = Date.prototype.toISOString;

var defaultFormat = formats['default'];
var defaults = {
    addQueryPrefix: false,
    allowDots: false,
    allowEmptyArrays: false,
    arrayFormat: 'indices',
    charset: 'utf-8',
    charsetSentinel: false,
    delimiter: '&',
    encode: true,
    encodeDotInKeys: false,
    encoder: utils.encode,
    encodeValuesOnly: false,
    format: defaultFormat,
    formatter: formats.formatters[defaultFormat],
    // deprecated
    indices: false,
    serializeDate: function serializeDate(date) {
        return toISO.call(date);
    },
    skipNulls: false,
    strictNullHandling: false
};

var isNonNullishPrimitive = function isNonNullishPrimitive(v) {
    return typeof v === 'string'
        || typeof v === 'number'
        || typeof v === 'boolean'
        || typeof v === 'symbol'
        || typeof v === 'bigint';
};

var sentinel = {};

var stringify = function stringify(
    object,
    prefix,
    generateArrayPrefix,
    commaRoundTrip,
    allowEmptyArrays,
    strictNullHandling,
    skipNulls,
    encodeDotInKeys,
    encoder,
    filter,
    sort,
    allowDots,
    serializeDate,
    format,
    formatter,
    encodeValuesOnly,
    charset,
    sideChannel
) {
    var obj = object;

    var tmpSc = sideChannel;
    var step = 0;
    var findFlag = false;
    while ((tmpSc = tmpSc.get(sentinel)) !== void undefined && !findFlag) {
        // Where object last appeared in the ref tree
        var pos = tmpSc.get(object);
        step += 1;
        if (typeof pos !== 'undefined') {
            if (pos === step) {
                throw new RangeError('Cyclic object value');
            } else {
                findFlag = true; // Break while
            }
        }
        if (typeof tmpSc.get(sentinel) === 'undefined') {
            step = 0;
        }
    }

    if (typeof filter === 'function') {
        obj = filter(prefix, obj);
    } else if (obj instanceof Date) {
        obj = serializeDate(obj);
    } else if (generateArrayPrefix === 'comma' && isArray(obj)) {
        obj = utils.maybeMap(obj, function (value) {
            if (value instanceof Date) {
                return serializeDate(value);
            }
            return value;
        });
    }

    if (obj === null) {
        if (strictNullHandling) {
            return encoder && !encodeValuesOnly ? encoder(prefix, defaults.encoder, charset, 'key', format) : prefix;
        }

        obj = '';
    }

    if (isNonNullishPrimitive(obj) || utils.isBuffer(obj)) {
        if (encoder) {
            var keyValue = encodeValuesOnly ? prefix : encoder(prefix, defaults.encoder, charset, 'key', format);
            return [formatter(keyValue) + '=' + formatter(encoder(obj, defaults.encoder, charset, 'value', format))];
        }
        return [formatter(prefix) + '=' + formatter(String(obj))];
    }

    var values = [];

    if (typeof obj === 'undefined') {
        return values;
    }

    var objKeys;
    if (generateArrayPrefix === 'comma' && isArray(obj)) {
        // we need to join elements in
        if (encodeValuesOnly && encoder) {
            obj = utils.maybeMap(obj, encoder);
        }
        objKeys = [{ value: obj.length > 0 ? obj.join(',') || null : void undefined }];
    } else if (isArray(filter)) {
        objKeys = filter;
    } else {
        var keys = Object.keys(obj);
        objKeys = sort ? keys.sort(sort) : keys;
    }

    var encodedPrefix = encodeDotInKeys ? prefix.replace(/\./g, '%2E') : prefix;

    var adjustedPrefix = commaRoundTrip && isArray(obj) && obj.length === 1 ? encodedPrefix + '[]' : encodedPrefix;

    if (allowEmptyArrays && isArray(obj) && obj.length === 0) {
        return adjustedPrefix + '[]';
    }

    for (var j = 0; j < objKeys.length; ++j) {
        var key = objKeys[j];
        var value = typeof key === 'object' && typeof key.value !== 'undefined' ? key.value : obj[key];

        if (skipNulls && value === null) {
            continue;
        }

        var encodedKey = allowDots && encodeDotInKeys ? key.replace(/\./g, '%2E') : key;
        var keyPrefix = isArray(obj)
            ? typeof generateArrayPrefix === 'function' ? generateArrayPrefix(adjustedPrefix, encodedKey) : adjustedPrefix
            : adjustedPrefix + (allowDots ? '.' + encodedKey : '[' + encodedKey + ']');

        sideChannel.set(object, step);
        var valueSideChannel = getSideChannel();
        valueSideChannel.set(sentinel, sideChannel);
        pushToArray(values, stringify(
            value,
            keyPrefix,
            generateArrayPrefix,
            commaRoundTrip,
            allowEmptyArrays,
            strictNullHandling,
            skipNulls,
            encodeDotInKeys,
            generateArrayPrefix === 'comma' && encodeValuesOnly && isArray(obj) ? null : encoder,
            filter,
            sort,
            allowDots,
            serializeDate,
            format,
            formatter,
            encodeValuesOnly,
            charset,
            valueSideChannel
        ));
    }

    return values;
};

var normalizeStringifyOptions = function normalizeStringifyOptions(opts) {
    if (!opts) {
        return defaults;
    }

    if (typeof opts.allowEmptyArrays !== 'undefined' && typeof opts.allowEmptyArrays !== 'boolean') {
        throw new TypeError('`allowEmptyArrays` option can only be `true` or `false`, when provided');
    }

    if (typeof opts.encodeDotInKeys !== 'undefined' && typeof opts.encodeDotInKeys !== 'boolean') {
        throw new TypeError('`encodeDotInKeys` option can only be `true` or `false`, when provided');
    }

    if (opts.encoder !== null && typeof opts.encoder !== 'undefined' && typeof opts.encoder !== 'function') {
        throw new TypeError('Encoder has to be a function.');
    }

    var charset = opts.charset || defaults.charset;
    if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
        throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
    }

    var format = formats['default'];
    if (typeof opts.format !== 'undefined') {
        if (!has.call(formats.formatters, opts.format)) {
            throw new TypeError('Unknown format option provided.');
        }
        format = opts.format;
    }
    var formatter = formats.formatters[format];

    var filter = defaults.filter;
    if (typeof opts.filter === 'function' || isArray(opts.filter)) {
        filter = opts.filter;
    }

    var arrayFormat;
    if (opts.arrayFormat in arrayPrefixGenerators) {
        arrayFormat = opts.arrayFormat;
    } else if ('indices' in opts) {
        arrayFormat = opts.indices ? 'indices' : 'repeat';
    } else {
        arrayFormat = defaults.arrayFormat;
    }

    if ('commaRoundTrip' in opts && typeof opts.commaRoundTrip !== 'boolean') {
        throw new TypeError('`commaRoundTrip` must be a boolean, or absent');
    }

    var allowDots = typeof opts.allowDots === 'undefined' ? opts.encodeDotInKeys === true ? true : defaults.allowDots : !!opts.allowDots;

    return {
        addQueryPrefix: typeof opts.addQueryPrefix === 'boolean' ? opts.addQueryPrefix : defaults.addQueryPrefix,
        allowDots: allowDots,
        allowEmptyArrays: typeof opts.allowEmptyArrays === 'boolean' ? !!opts.allowEmptyArrays : defaults.allowEmptyArrays,
        arrayFormat: arrayFormat,
        charset: charset,
        charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults.charsetSentinel,
        commaRoundTrip: opts.commaRoundTrip,
        delimiter: typeof opts.delimiter === 'undefined' ? defaults.delimiter : opts.delimiter,
        encode: typeof opts.encode === 'boolean' ? opts.encode : defaults.encode,
        encodeDotInKeys: typeof opts.encodeDotInKeys === 'boolean' ? opts.encodeDotInKeys : defaults.encodeDotInKeys,
        encoder: typeof opts.encoder === 'function' ? opts.encoder : defaults.encoder,
        encodeValuesOnly: typeof opts.encodeValuesOnly === 'boolean' ? opts.encodeValuesOnly : defaults.encodeValuesOnly,
        filter: filter,
        format: format,
        formatter: formatter,
        serializeDate: typeof opts.serializeDate === 'function' ? opts.serializeDate : defaults.serializeDate,
        skipNulls: typeof opts.skipNulls === 'boolean' ? opts.skipNulls : defaults.skipNulls,
        sort: typeof opts.sort === 'function' ? opts.sort : null,
        strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults.strictNullHandling
    };
};

module.exports = function (object, opts) {
    var obj = object;
    var options = normalizeStringifyOptions(opts);

    var objKeys;
    var filter;

    if (typeof options.filter === 'function') {
        filter = options.filter;
        obj = filter('', obj);
    } else if (isArray(options.filter)) {
        filter = options.filter;
        objKeys = filter;
    }

    var keys = [];

    if (typeof obj !== 'object' || obj === null) {
        return '';
    }

    var generateArrayPrefix = arrayPrefixGenerators[options.arrayFormat];
    var commaRoundTrip = generateArrayPrefix === 'comma' && options.commaRoundTrip;

    if (!objKeys) {
        objKeys = Object.keys(obj);
    }

    if (options.sort) {
        objKeys.sort(options.sort);
    }

    var sideChannel = getSideChannel();
    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];

        if (options.skipNulls && obj[key] === null) {
            continue;
        }
        pushToArray(keys, stringify(
            obj[key],
            key,
            generateArrayPrefix,
            commaRoundTrip,
            options.allowEmptyArrays,
            options.strictNullHandling,
            options.skipNulls,
            options.encodeDotInKeys,
            options.encode ? options.encoder : null,
            options.filter,
            options.sort,
            options.allowDots,
            options.serializeDate,
            options.format,
            options.formatter,
            options.encodeValuesOnly,
            options.charset,
            sideChannel
        ));
    }

    var joined = keys.join(options.delimiter);
    var prefix = options.addQueryPrefix === true ? '?' : '';

    if (options.charsetSentinel) {
        if (options.charset === 'iso-8859-1') {
            // encodeURIComponent('&#10003;'), the "numeric entity" representation of a checkmark
            prefix += 'utf8=%26%2310003%3B&';
        } else {
            // encodeURIComponent('✓')
            prefix += 'utf8=%E2%9C%93&';
        }
    }

    return joined.length > 0 ? prefix + joined : '';
};

},{"./formats":24,"./utils":28,"side-channel":30}],28:[function(require,module,exports){
'use strict';

var formats = require('./formats');

var has = Object.prototype.hasOwnProperty;
var isArray = Array.isArray;

var hexTable = (function () {
    var array = [];
    for (var i = 0; i < 256; ++i) {
        array.push('%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase());
    }

    return array;
}());

var compactQueue = function compactQueue(queue) {
    while (queue.length > 1) {
        var item = queue.pop();
        var obj = item.obj[item.prop];

        if (isArray(obj)) {
            var compacted = [];

            for (var j = 0; j < obj.length; ++j) {
                if (typeof obj[j] !== 'undefined') {
                    compacted.push(obj[j]);
                }
            }

            item.obj[item.prop] = compacted;
        }
    }
};

var arrayToObject = function arrayToObject(source, options) {
    var obj = options && options.plainObjects ? Object.create(null) : {};
    for (var i = 0; i < source.length; ++i) {
        if (typeof source[i] !== 'undefined') {
            obj[i] = source[i];
        }
    }

    return obj;
};

var merge = function merge(target, source, options) {
    /* eslint no-param-reassign: 0 */
    if (!source) {
        return target;
    }

    if (typeof source !== 'object') {
        if (isArray(target)) {
            target.push(source);
        } else if (target && typeof target === 'object') {
            if ((options && (options.plainObjects || options.allowPrototypes)) || !has.call(Object.prototype, source)) {
                target[source] = true;
            }
        } else {
            return [target, source];
        }

        return target;
    }

    if (!target || typeof target !== 'object') {
        return [target].concat(source);
    }

    var mergeTarget = target;
    if (isArray(target) && !isArray(source)) {
        mergeTarget = arrayToObject(target, options);
    }

    if (isArray(target) && isArray(source)) {
        source.forEach(function (item, i) {
            if (has.call(target, i)) {
                var targetItem = target[i];
                if (targetItem && typeof targetItem === 'object' && item && typeof item === 'object') {
                    target[i] = merge(targetItem, item, options);
                } else {
                    target.push(item);
                }
            } else {
                target[i] = item;
            }
        });
        return target;
    }

    return Object.keys(source).reduce(function (acc, key) {
        var value = source[key];

        if (has.call(acc, key)) {
            acc[key] = merge(acc[key], value, options);
        } else {
            acc[key] = value;
        }
        return acc;
    }, mergeTarget);
};

var assign = function assignSingleSource(target, source) {
    return Object.keys(source).reduce(function (acc, key) {
        acc[key] = source[key];
        return acc;
    }, target);
};

var decode = function (str, decoder, charset) {
    var strWithoutPlus = str.replace(/\+/g, ' ');
    if (charset === 'iso-8859-1') {
        // unescape never throws, no try...catch needed:
        return strWithoutPlus.replace(/%[0-9a-f]{2}/gi, unescape);
    }
    // utf-8
    try {
        return decodeURIComponent(strWithoutPlus);
    } catch (e) {
        return strWithoutPlus;
    }
};

var limit = 1024;

/* eslint operator-linebreak: [2, "before"] */

var encode = function encode(str, defaultEncoder, charset, kind, format) {
    // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
    // It has been adapted here for stricter adherence to RFC 3986
    if (str.length === 0) {
        return str;
    }

    var string = str;
    if (typeof str === 'symbol') {
        string = Symbol.prototype.toString.call(str);
    } else if (typeof str !== 'string') {
        string = String(str);
    }

    if (charset === 'iso-8859-1') {
        return escape(string).replace(/%u[0-9a-f]{4}/gi, function ($0) {
            return '%26%23' + parseInt($0.slice(2), 16) + '%3B';
        });
    }

    var out = '';
    for (var j = 0; j < string.length; j += limit) {
        var segment = string.length >= limit ? string.slice(j, j + limit) : string;
        var arr = [];

        for (var i = 0; i < segment.length; ++i) {
            var c = segment.charCodeAt(i);
            if (
                c === 0x2D // -
                || c === 0x2E // .
                || c === 0x5F // _
                || c === 0x7E // ~
                || (c >= 0x30 && c <= 0x39) // 0-9
                || (c >= 0x41 && c <= 0x5A) // a-z
                || (c >= 0x61 && c <= 0x7A) // A-Z
                || (format === formats.RFC1738 && (c === 0x28 || c === 0x29)) // ( )
            ) {
                arr[arr.length] = segment.charAt(i);
                continue;
            }

            if (c < 0x80) {
                arr[arr.length] = hexTable[c];
                continue;
            }

            if (c < 0x800) {
                arr[arr.length] = hexTable[0xC0 | (c >> 6)]
                    + hexTable[0x80 | (c & 0x3F)];
                continue;
            }

            if (c < 0xD800 || c >= 0xE000) {
                arr[arr.length] = hexTable[0xE0 | (c >> 12)]
                    + hexTable[0x80 | ((c >> 6) & 0x3F)]
                    + hexTable[0x80 | (c & 0x3F)];
                continue;
            }

            i += 1;
            c = 0x10000 + (((c & 0x3FF) << 10) | (segment.charCodeAt(i) & 0x3FF));

            arr[arr.length] = hexTable[0xF0 | (c >> 18)]
                + hexTable[0x80 | ((c >> 12) & 0x3F)]
                + hexTable[0x80 | ((c >> 6) & 0x3F)]
                + hexTable[0x80 | (c & 0x3F)];
        }

        out += arr.join('');
    }

    return out;
};

var compact = function compact(value) {
    var queue = [{ obj: { o: value }, prop: 'o' }];
    var refs = [];

    for (var i = 0; i < queue.length; ++i) {
        var item = queue[i];
        var obj = item.obj[item.prop];

        var keys = Object.keys(obj);
        for (var j = 0; j < keys.length; ++j) {
            var key = keys[j];
            var val = obj[key];
            if (typeof val === 'object' && val !== null && refs.indexOf(val) === -1) {
                queue.push({ obj: obj, prop: key });
                refs.push(val);
            }
        }
    }

    compactQueue(queue);

    return value;
};

var isRegExp = function isRegExp(obj) {
    return Object.prototype.toString.call(obj) === '[object RegExp]';
};

var isBuffer = function isBuffer(obj) {
    if (!obj || typeof obj !== 'object') {
        return false;
    }

    return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
};

var combine = function combine(a, b) {
    return [].concat(a, b);
};

var maybeMap = function maybeMap(val, fn) {
    if (isArray(val)) {
        var mapped = [];
        for (var i = 0; i < val.length; i += 1) {
            mapped.push(fn(val[i]));
        }
        return mapped;
    }
    return fn(val);
};

module.exports = {
    arrayToObject: arrayToObject,
    assign: assign,
    combine: combine,
    compact: compact,
    decode: decode,
    encode: encode,
    isBuffer: isBuffer,
    isRegExp: isRegExp,
    maybeMap: maybeMap,
    merge: merge
};

},{"./formats":24}],29:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');
var define = require('define-data-property');
var hasDescriptors = require('has-property-descriptors')();
var gOPD = require('gopd');

var $TypeError = require('es-errors/type');
var $floor = GetIntrinsic('%Math.floor%');

/** @type {import('.')} */
module.exports = function setFunctionLength(fn, length) {
	if (typeof fn !== 'function') {
		throw new $TypeError('`fn` is not a function');
	}
	if (typeof length !== 'number' || length < 0 || length > 0xFFFFFFFF || $floor(length) !== length) {
		throw new $TypeError('`length` must be a positive 32-bit integer');
	}

	var loose = arguments.length > 2 && !!arguments[2];

	var functionLengthIsConfigurable = true;
	var functionLengthIsWritable = true;
	if ('length' in fn && gOPD) {
		var desc = gOPD(fn, 'length');
		if (desc && !desc.configurable) {
			functionLengthIsConfigurable = false;
		}
		if (desc && !desc.writable) {
			functionLengthIsWritable = false;
		}
	}

	if (functionLengthIsConfigurable || functionLengthIsWritable || !loose) {
		if (hasDescriptors) {
			define(/** @type {Parameters<define>[0]} */ (fn), 'length', length, true, true);
		} else {
			define(/** @type {Parameters<define>[0]} */ (fn), 'length', length);
		}
	}
	return fn;
};

},{"define-data-property":5,"es-errors/type":12,"get-intrinsic":16,"gopd":17,"has-property-descriptors":18}],30:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');
var callBound = require('call-bind/callBound');
var inspect = require('object-inspect');

var $TypeError = require('es-errors/type');
var $WeakMap = GetIntrinsic('%WeakMap%', true);
var $Map = GetIntrinsic('%Map%', true);

var $weakMapGet = callBound('WeakMap.prototype.get', true);
var $weakMapSet = callBound('WeakMap.prototype.set', true);
var $weakMapHas = callBound('WeakMap.prototype.has', true);
var $mapGet = callBound('Map.prototype.get', true);
var $mapSet = callBound('Map.prototype.set', true);
var $mapHas = callBound('Map.prototype.has', true);

/*
* This function traverses the list returning the node corresponding to the given key.
*
* That node is also moved to the head of the list, so that if it's accessed again we don't need to traverse the whole list. By doing so, all the recently used nodes can be accessed relatively quickly.
*/
/** @type {import('.').listGetNode} */
var listGetNode = function (list, key) { // eslint-disable-line consistent-return
	/** @type {typeof list | NonNullable<(typeof list)['next']>} */
	var prev = list;
	/** @type {(typeof list)['next']} */
	var curr;
	for (; (curr = prev.next) !== null; prev = curr) {
		if (curr.key === key) {
			prev.next = curr.next;
			// eslint-disable-next-line no-extra-parens
			curr.next = /** @type {NonNullable<typeof list.next>} */ (list.next);
			list.next = curr; // eslint-disable-line no-param-reassign
			return curr;
		}
	}
};

/** @type {import('.').listGet} */
var listGet = function (objects, key) {
	var node = listGetNode(objects, key);
	return node && node.value;
};
/** @type {import('.').listSet} */
var listSet = function (objects, key, value) {
	var node = listGetNode(objects, key);
	if (node) {
		node.value = value;
	} else {
		// Prepend the new node to the beginning of the list
		objects.next = /** @type {import('.').ListNode<typeof value>} */ ({ // eslint-disable-line no-param-reassign, no-extra-parens
			key: key,
			next: objects.next,
			value: value
		});
	}
};
/** @type {import('.').listHas} */
var listHas = function (objects, key) {
	return !!listGetNode(objects, key);
};

/** @type {import('.')} */
module.exports = function getSideChannel() {
	/** @type {WeakMap<object, unknown>} */ var $wm;
	/** @type {Map<object, unknown>} */ var $m;
	/** @type {import('.').RootNode<unknown>} */ var $o;

	/** @type {import('.').Channel} */
	var channel = {
		assert: function (key) {
			if (!channel.has(key)) {
				throw new $TypeError('Side channel does not contain ' + inspect(key));
			}
		},
		get: function (key) { // eslint-disable-line consistent-return
			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
				if ($wm) {
					return $weakMapGet($wm, key);
				}
			} else if ($Map) {
				if ($m) {
					return $mapGet($m, key);
				}
			} else {
				if ($o) { // eslint-disable-line no-lonely-if
					return listGet($o, key);
				}
			}
		},
		has: function (key) {
			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
				if ($wm) {
					return $weakMapHas($wm, key);
				}
			} else if ($Map) {
				if ($m) {
					return $mapHas($m, key);
				}
			} else {
				if ($o) { // eslint-disable-line no-lonely-if
					return listHas($o, key);
				}
			}
			return false;
		},
		set: function (key, value) {
			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
				if (!$wm) {
					$wm = new $WeakMap();
				}
				$weakMapSet($wm, key, value);
			} else if ($Map) {
				if (!$m) {
					$m = new $Map();
				}
				$mapSet($m, key, value);
			} else {
				if (!$o) {
					// Initialize the linked list as an empty node, so that we don't have to special-case handling of the first node: we can always refer to it as (previous node).next, instead of something like (list).head
					$o = { key: {}, next: null };
				}
				listSet($o, key, value);
			}
		}
	};
	return channel;
};

},{"call-bind/callBound":3,"es-errors/type":12,"get-intrinsic":16,"object-inspect":23}],31:[function(require,module,exports){
(function (setImmediate){(function (){
/*! For license information please see web3.min.js.LICENSE.txt */
!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?exports.Web3=t():e.Web3=t()}(this,(()=>(()=>{var e={7256:(e,t)=>{"use strict";function r(e){if(Array.isArray(e)){const t=[];let n=0;for(let o=0;o<e.length;o++){const i=r(e[o]);t.push(i),n+=i.length}return h(i(n,192),...t)}const t=g(e);return 1===t.length&&t[0]<128?t:h(i(t.length,128),t)}function n(e,t,r){if(r>e.length)throw new Error("invalid RLP (safeSlice): end slice of Uint8Array out-of-bounds");return e.slice(t,r)}function o(e){if(0===e[0])throw new Error("invalid RLP: extra zeros");return d(u(e))}function i(e,t){if(e<56)return Uint8Array.from([e+t]);const r=p(e),n=p(t+55+r.length/2);return Uint8Array.from(l(n+r))}function s(e,t=!1){if(null==e||0===e.length)return Uint8Array.from([]);const r=a(g(e));if(t)return r;if(0!==r.remainder.length)throw new Error("invalid RLP: remainder must be zero");return r.data}function a(e){let t,r,i,s,c;const u=[],d=e[0];if(d<=127)return{data:e.slice(0,1),remainder:e.slice(1)};if(d<=183){if(t=d-127,i=128===d?Uint8Array.from([]):n(e,1,t),2===t&&i[0]<128)throw new Error("invalid RLP encoding: invalid prefix, single byte < 0x80 are not prefixed");return{data:i,remainder:e.slice(t)}}if(d<=191){if(r=d-182,e.length-1<r)throw new Error("invalid RLP: not enough bytes for string length");if(t=o(n(e,1,r)),t<=55)throw new Error("invalid RLP: expected string length to be greater than 55");return i=n(e,r,t+r),{data:i,remainder:e.slice(t+r)}}if(d<=247){for(t=d-191,s=n(e,1,t);s.length;)c=a(s),u.push(c.data),s=c.remainder;return{data:u,remainder:e.slice(t)}}{if(r=d-246,t=o(n(e,1,r)),t<56)throw new Error("invalid RLP: encoded list too short");const i=r+t;if(i>e.length)throw new Error("invalid RLP: total length is larger than the data");for(s=n(e,r,i);s.length;)c=a(s),u.push(c.data),s=c.remainder;return{data:u,remainder:e.slice(i)}}}Object.defineProperty(t,"__esModule",{value:!0}),t.RLP=t.utils=t.decode=t.encode=void 0,t.encode=r,t.decode=s;const c=Array.from({length:256},((e,t)=>t.toString(16).padStart(2,"0")));function u(e){let t="";for(let r=0;r<e.length;r++)t+=c[e[r]];return t}function d(e){const t=Number.parseInt(e,16);if(Number.isNaN(t))throw new Error("Invalid byte sequence");return t}function l(e){if("string"!=typeof e)throw new TypeError("hexToBytes: expected string, got "+typeof e);if(e.length%2)throw new Error("hexToBytes: received invalid unpadded hex");const t=new Uint8Array(e.length/2);for(let r=0;r<t.length;r++){const n=2*r;t[r]=d(e.slice(n,n+2))}return t}function h(...e){if(1===e.length)return e[0];const t=e.reduce(((e,t)=>e+t.length),0),r=new Uint8Array(t);for(let t=0,n=0;t<e.length;t++){const o=e[t];r.set(o,n),n+=o.length}return r}function f(e){return(new TextEncoder).encode(e)}function p(e){if(e<0)throw new Error("Invalid integer as argument, must be unsigned!");const t=e.toString(16);return t.length%2?`0${t}`:t}function m(e){return e.length>=2&&"0"===e[0]&&"x"===e[1]}function g(e){if(e instanceof Uint8Array)return e;if("string"==typeof e)return m(e)?l((t="string"!=typeof(r=e)?r:m(r)?r.slice(2):r).length%2?`0${t}`:t):f(e);var t,r;if("number"==typeof e||"bigint"==typeof e)return e?l(p(e)):Uint8Array.from([]);if(null==e)return Uint8Array.from([]);throw new Error("toBytes: received unsupported type "+typeof e)}t.utils={bytesToHex:u,concatBytes:h,hexToBytes:l,utf8ToBytes:f},t.RLP={encode:r,decode:s}},5887:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.createCurve=t.getHash=void 0;const n=r(7493),o=r(488),i=r(7851);function s(e){return{hash:e,hmac:(t,...r)=>(0,n.hmac)(e,t,(0,o.concatBytes)(...r)),randomBytes:o.randomBytes}}t.getHash=s,t.createCurve=function(e,t){const r=t=>(0,i.weierstrass)({...e,...s(t)});return Object.freeze({...r(t),create:r})}},1465:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.validateBasic=t.wNAF=void 0;const n=r(9530),o=r(4323),i=BigInt(0),s=BigInt(1);t.wNAF=function(e,t){const r=(e,t)=>{const r=t.negate();return e?r:t},n=e=>({windows:Math.ceil(t/e)+1,windowSize:2**(e-1)});return{constTimeNegate:r,unsafeLadder(t,r){let n=e.ZERO,o=t;for(;r>i;)r&s&&(n=n.add(o)),o=o.double(),r>>=s;return n},precomputeWindow(e,t){const{windows:r,windowSize:o}=n(t),i=[];let s=e,a=s;for(let e=0;e<r;e++){a=s,i.push(a);for(let e=1;e<o;e++)a=a.add(s),i.push(a);s=a.double()}return i},wNAF(t,o,i){const{windows:a,windowSize:c}=n(t);let u=e.ZERO,d=e.BASE;const l=BigInt(2**t-1),h=2**t,f=BigInt(t);for(let e=0;e<a;e++){const t=e*c;let n=Number(i&l);i>>=f,n>c&&(n-=h,i+=s);const a=t,p=t+Math.abs(n)-1,m=e%2!=0,g=n<0;0===n?d=d.add(r(m,o[a])):u=u.add(r(g,o[p]))}return{p:u,f:d}},wNAFCached(e,t,r,n){const o=e._WINDOW_SIZE||1;let i=t.get(e);return i||(i=this.precomputeWindow(e,o),1!==o&&t.set(e,n(i))),this.wNAF(o,i,r)}}},t.validateBasic=function(e){return(0,n.validateField)(e.Fp),(0,o.validateObject)(e,{n:"bigint",h:"bigint",Gx:"field",Gy:"field"},{nBitLength:"isSafeInteger",nByteLength:"isSafeInteger"}),Object.freeze({...(0,n.nLength)(e.n,e.nBitLength),...e,p:e.Fp.ORDER})}},1322:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.createHasher=t.isogenyMap=t.hash_to_field=t.expand_message_xof=t.expand_message_xmd=void 0;const n=r(9530),o=r(4323),i=o.bytesToNumberBE;function s(e,t){if(e<0||e>=1<<8*t)throw new Error(`bad I2OSP call: value=${e} length=${t}`);const r=Array.from({length:t}).fill(0);for(let n=t-1;n>=0;n--)r[n]=255&e,e>>>=8;return new Uint8Array(r)}function a(e,t){const r=new Uint8Array(e.length);for(let n=0;n<e.length;n++)r[n]=e[n]^t[n];return r}function c(e){if(!(e instanceof Uint8Array))throw new Error("Uint8Array expected")}function u(e){if(!Number.isSafeInteger(e))throw new Error("number expected")}function d(e,t,r,n){c(e),c(t),u(r),t.length>255&&(t=n((0,o.concatBytes)((0,o.utf8ToBytes)("H2C-OVERSIZE-DST-"),t)));const{outputLen:i,blockLen:d}=n,l=Math.ceil(r/i);if(l>255)throw new Error("Invalid xmd length");const h=(0,o.concatBytes)(t,s(t.length,1)),f=s(0,d),p=s(r,2),m=new Array(l),g=n((0,o.concatBytes)(f,e,p,s(0,1),h));m[0]=n((0,o.concatBytes)(g,s(1,1),h));for(let e=1;e<=l;e++){const t=[a(g,m[e-1]),s(e+1,1),h];m[e]=n((0,o.concatBytes)(...t))}return(0,o.concatBytes)(...m).slice(0,r)}function l(e,t,r,n,i){if(c(e),c(t),u(r),t.length>255){const e=Math.ceil(2*n/8);t=i.create({dkLen:e}).update((0,o.utf8ToBytes)("H2C-OVERSIZE-DST-")).update(t).digest()}if(r>65535||t.length>255)throw new Error("expand_message_xof: invalid lenInBytes");return i.create({dkLen:r}).update(e).update(s(r,2)).update(t).update(s(t.length,1)).digest()}function h(e,t,r){(0,o.validateObject)(r,{DST:"string",p:"bigint",m:"isSafeInteger",k:"isSafeInteger",hash:"hash"});const{p:s,k:a,m:h,hash:f,expand:p,DST:m}=r;c(e),u(t);const g=function(e){if(e instanceof Uint8Array)return e;if("string"==typeof e)return(0,o.utf8ToBytes)(e);throw new Error("DST must be Uint8Array or string")}(m),y=s.toString(2).length,v=Math.ceil((y+a)/8),b=t*h*v;let E;if("xmd"===p)E=d(e,g,b,f);else if("xof"===p)E=l(e,g,b,a,f);else{if("_internal_pass"!==p)throw new Error('expand must be "xmd" or "xof"');E=e}const _=new Array(t);for(let e=0;e<t;e++){const t=new Array(h);for(let r=0;r<h;r++){const o=v*(r+e*h),a=E.subarray(o,o+v);t[r]=(0,n.mod)(i(a),s)}_[e]=t}return _}t.expand_message_xmd=d,t.expand_message_xof=l,t.hash_to_field=h,t.isogenyMap=function(e,t){const r=t.map((e=>Array.from(e).reverse()));return(t,n)=>{const[o,i,s,a]=r.map((r=>r.reduce(((r,n)=>e.add(e.mul(r,t),n)))));return t=e.div(o,i),n=e.mul(n,e.div(s,a)),{x:t,y:n}}},t.createHasher=function(e,t,r){if("function"!=typeof t)throw new Error("mapToCurve() must be defined");return{hashToCurve(n,o){const i=h(n,2,{...r,DST:r.DST,...o}),s=e.fromAffine(t(i[0])),a=e.fromAffine(t(i[1])),c=s.add(a).clearCofactor();return c.assertValidity(),c},encodeToCurve(n,o){const i=h(n,1,{...r,DST:r.encodeDST,...o}),s=e.fromAffine(t(i[0])).clearCofactor();return s.assertValidity(),s}}}},9530:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.hashToPrivateScalar=t.FpSqrtEven=t.FpSqrtOdd=t.Field=t.nLength=t.FpIsSquare=t.FpDiv=t.FpInvertBatch=t.FpPow=t.validateField=t.isNegativeLE=t.FpSqrt=t.tonelliShanks=t.invert=t.pow2=t.pow=t.mod=void 0;const n=r(4323),o=BigInt(0),i=BigInt(1),s=BigInt(2),a=BigInt(3),c=BigInt(4),u=BigInt(5),d=BigInt(8);function l(e,t){const r=e%t;return r>=o?r:t+r}function h(e,t,r){if(r<=o||t<o)throw new Error("Expected power/modulo > 0");if(r===i)return o;let n=i;for(;t>o;)t&i&&(n=n*e%r),e=e*e%r,t>>=i;return n}function f(e,t){if(e===o||t<=o)throw new Error(`invert: expected positive integers, got n=${e} mod=${t}`);let r=l(e,t),n=t,s=o,a=i,c=i,u=o;for(;r!==o;){const e=n/r,t=n%r,o=s-c*e,i=a-u*e;n=r,r=t,s=c,a=u,c=o,u=i}if(n!==i)throw new Error("invert: does not exist");return l(s,t)}function p(e){const t=(e-i)/s;let r,n,a;for(r=e-i,n=0;r%s===o;r/=s,n++);for(a=s;a<e&&h(a,t,e)!==e-i;a++);if(1===n){const t=(e+i)/c;return function(e,r){const n=e.pow(r,t);if(!e.eql(e.sqr(n),r))throw new Error("Cannot find square root");return n}}const u=(r+i)/s;return function(e,o){if(e.pow(o,t)===e.neg(e.ONE))throw new Error("Cannot find square root");let s=n,c=e.pow(e.mul(e.ONE,a),r),d=e.pow(o,u),l=e.pow(o,r);for(;!e.eql(l,e.ONE);){if(e.eql(l,e.ZERO))return e.ZERO;let t=1;for(let r=e.sqr(l);t<s&&!e.eql(r,e.ONE);t++)r=e.sqr(r);const r=e.pow(c,i<<BigInt(s-t-1));c=e.sqr(r),d=e.mul(d,r),l=e.mul(l,c),s=t}return d}}function m(e){if(e%c===a){const t=(e+i)/c;return function(e,r){const n=e.pow(r,t);if(!e.eql(e.sqr(n),r))throw new Error("Cannot find square root");return n}}if(e%d===u){const t=(e-u)/d;return function(e,r){const n=e.mul(r,s),o=e.pow(n,t),i=e.mul(r,o),a=e.mul(e.mul(i,s),o),c=e.mul(i,e.sub(a,e.ONE));if(!e.eql(e.sqr(c),r))throw new Error("Cannot find square root");return c}}return p(e)}BigInt(9),BigInt(16),t.mod=l,t.pow=h,t.pow2=function(e,t,r){let n=e;for(;t-- >o;)n*=n,n%=r;return n},t.invert=f,t.tonelliShanks=p,t.FpSqrt=m,t.isNegativeLE=(e,t)=>(l(e,t)&i)===i;const g=["create","isValid","is0","neg","inv","sqrt","sqr","eql","add","sub","mul","pow","div","addN","subN","mulN","sqrN"];function y(e,t,r){if(r<o)throw new Error("Expected power > 0");if(r===o)return e.ONE;if(r===i)return t;let n=e.ONE,s=t;for(;r>o;)r&i&&(n=e.mul(n,s)),s=e.sqr(s),r>>=i;return n}function v(e,t){const r=new Array(t.length),n=t.reduce(((t,n,o)=>e.is0(n)?t:(r[o]=t,e.mul(t,n))),e.ONE),o=e.inv(n);return t.reduceRight(((t,n,o)=>e.is0(n)?t:(r[o]=e.mul(t,r[o]),e.mul(t,n))),o),r}function b(e,t){const r=void 0!==t?t:e.toString(2).length;return{nBitLength:r,nByteLength:Math.ceil(r/8)}}t.validateField=function(e){const t=g.reduce(((e,t)=>(e[t]="function",e)),{ORDER:"bigint",MASK:"bigint",BYTES:"isSafeInteger",BITS:"isSafeInteger"});return(0,n.validateObject)(e,t)},t.FpPow=y,t.FpInvertBatch=v,t.FpDiv=function(e,t,r){return e.mul(t,"bigint"==typeof r?f(r,e.ORDER):e.inv(r))},t.FpIsSquare=function(e){const t=(e.ORDER-i)/s;return r=>{const n=e.pow(r,t);return e.eql(n,e.ZERO)||e.eql(n,e.ONE)}},t.nLength=b,t.Field=function(e,t,r=!1,s={}){if(e<=o)throw new Error(`Expected Fp ORDER > 0, got ${e}`);const{nBitLength:a,nByteLength:c}=b(e,t);if(c>2048)throw new Error("Field lengths over 2048 bytes are not supported");const u=m(e),d=Object.freeze({ORDER:e,BITS:a,BYTES:c,MASK:(0,n.bitMask)(a),ZERO:o,ONE:i,create:t=>l(t,e),isValid:t=>{if("bigint"!=typeof t)throw new Error("Invalid field element: expected bigint, got "+typeof t);return o<=t&&t<e},is0:e=>e===o,isOdd:e=>(e&i)===i,neg:t=>l(-t,e),eql:(e,t)=>e===t,sqr:t=>l(t*t,e),add:(t,r)=>l(t+r,e),sub:(t,r)=>l(t-r,e),mul:(t,r)=>l(t*r,e),pow:(e,t)=>y(d,e,t),div:(t,r)=>l(t*f(r,e),e),sqrN:e=>e*e,addN:(e,t)=>e+t,subN:(e,t)=>e-t,mulN:(e,t)=>e*t,inv:t=>f(t,e),sqrt:s.sqrt||(e=>u(d,e)),invertBatch:e=>v(d,e),cmov:(e,t,r)=>r?t:e,toBytes:e=>r?(0,n.numberToBytesLE)(e,c):(0,n.numberToBytesBE)(e,c),fromBytes:e=>{if(e.length!==c)throw new Error(`Fp.fromBytes: expected ${c}, got ${e.length}`);return r?(0,n.bytesToNumberLE)(e):(0,n.bytesToNumberBE)(e)}});return Object.freeze(d)},t.FpSqrtOdd=function(e,t){if(!e.isOdd)throw new Error("Field doesn't have isOdd");const r=e.sqrt(t);return e.isOdd(r)?r:e.neg(r)},t.FpSqrtEven=function(e,t){if(!e.isOdd)throw new Error("Field doesn't have isOdd");const r=e.sqrt(t);return e.isOdd(r)?e.neg(r):r},t.hashToPrivateScalar=function(e,t,r=!1){const o=(e=(0,n.ensureBytes)("privateHash",e)).length,s=b(t).nByteLength+8;if(s<24||o<s||o>1024)throw new Error(`hashToPrivateScalar: expected ${s}-1024 bytes of input, got ${o}`);return l(r?(0,n.bytesToNumberLE)(e):(0,n.bytesToNumberBE)(e),t-i)+i}},4323:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.validateObject=t.createHmacDrbg=t.bitMask=t.bitSet=t.bitGet=t.bitLen=t.utf8ToBytes=t.equalBytes=t.concatBytes=t.ensureBytes=t.numberToVarBytesBE=t.numberToBytesLE=t.numberToBytesBE=t.bytesToNumberLE=t.bytesToNumberBE=t.hexToBytes=t.hexToNumber=t.numberToHexUnpadded=t.bytesToHex=void 0;const r=BigInt(0),n=BigInt(1),o=BigInt(2),i=e=>e instanceof Uint8Array,s=Array.from({length:256},((e,t)=>t.toString(16).padStart(2,"0")));function a(e){if(!i(e))throw new Error("Uint8Array expected");let t="";for(let r=0;r<e.length;r++)t+=s[e[r]];return t}function c(e){const t=e.toString(16);return 1&t.length?`0${t}`:t}function u(e){if("string"!=typeof e)throw new Error("hex string expected, got "+typeof e);return BigInt(""===e?"0":`0x${e}`)}function d(e){if("string"!=typeof e)throw new Error("hex string expected, got "+typeof e);if(e.length%2)throw new Error("hex string is invalid: unpadded "+e.length);const t=new Uint8Array(e.length/2);for(let r=0;r<t.length;r++){const n=2*r,o=e.slice(n,n+2),i=Number.parseInt(o,16);if(Number.isNaN(i)||i<0)throw new Error("invalid byte sequence");t[r]=i}return t}function l(...e){const t=new Uint8Array(e.reduce(((e,t)=>e+t.length),0));let r=0;return e.forEach((e=>{if(!i(e))throw new Error("Uint8Array expected");t.set(e,r),r+=e.length})),t}t.bytesToHex=a,t.numberToHexUnpadded=c,t.hexToNumber=u,t.hexToBytes=d,t.bytesToNumberBE=function(e){return u(a(e))},t.bytesToNumberLE=function(e){if(!i(e))throw new Error("Uint8Array expected");return u(a(Uint8Array.from(e).reverse()))},t.numberToBytesBE=(e,t)=>d(e.toString(16).padStart(2*t,"0")),t.numberToBytesLE=(e,r)=>(0,t.numberToBytesBE)(e,r).reverse(),t.numberToVarBytesBE=e=>d(c(e)),t.ensureBytes=function(e,t,r){let n;if("string"==typeof t)try{n=d(t)}catch(r){throw new Error(`${e} must be valid hex string, got "${t}". Cause: ${r}`)}else{if(!i(t))throw new Error(`${e} must be hex string or Uint8Array`);n=Uint8Array.from(t)}const o=n.length;if("number"==typeof r&&o!==r)throw new Error(`${e} expected ${r} bytes, got ${o}`);return n},t.concatBytes=l,t.equalBytes=function(e,t){if(e.length!==t.length)return!1;for(let r=0;r<e.length;r++)if(e[r]!==t[r])return!1;return!0},t.utf8ToBytes=function(e){if("string"!=typeof e)throw new Error("utf8ToBytes expected string, got "+typeof e);return(new TextEncoder).encode(e)},t.bitLen=function(e){let t;for(t=0;e>r;e>>=n,t+=1);return t},t.bitGet=(e,t)=>e>>BigInt(t)&n,t.bitSet=(e,t,o)=>e|(o?n:r)<<BigInt(t),t.bitMask=e=>(o<<BigInt(e-1))-n;const h=e=>new Uint8Array(e),f=e=>Uint8Array.from(e);t.createHmacDrbg=function(e,t,r){if("number"!=typeof e||e<2)throw new Error("hashLen must be a number");if("number"!=typeof t||t<2)throw new Error("qByteLen must be a number");if("function"!=typeof r)throw new Error("hmacFn must be a function");let n=h(e),o=h(e),i=0;const s=()=>{n.fill(1),o.fill(0),i=0},a=(...e)=>r(o,n,...e),c=(e=h())=>{o=a(f([0]),e),n=a(),0!==e.length&&(o=a(f([1]),e),n=a())},u=()=>{if(i++>=1e3)throw new Error("drbg: tried 1000 values");let e=0;const r=[];for(;e<t;){n=a();const t=n.slice();r.push(t),e+=n.length}return l(...r)};return(e,t)=>{let r;for(s(),c(e);!(r=t(u()));)c();return s(),r}};const p={bigint:e=>"bigint"==typeof e,function:e=>"function"==typeof e,boolean:e=>"boolean"==typeof e,string:e=>"string"==typeof e,isSafeInteger:e=>Number.isSafeInteger(e),array:e=>Array.isArray(e),field:(e,t)=>t.Fp.isValid(e),hash:e=>"function"==typeof e&&Number.isSafeInteger(e.outputLen)};t.validateObject=function(e,t,r={}){const n=(t,r,n)=>{const o=p[r];if("function"!=typeof o)throw new Error(`Invalid validator "${r}", expected function`);const i=e[t];if(!(n&&void 0===i||o(i,e)))throw new Error(`Invalid param ${String(t)}=${i} (${typeof i}), expected ${r}`)};for(const[e,r]of Object.entries(t))n(e,r,!1);for(const[e,t]of Object.entries(r))n(e,t,!0);return e}},7851:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.mapToCurveSimpleSWU=t.SWUFpSqrtRatio=t.weierstrass=t.weierstrassPoints=t.DER=void 0;const n=r(9530),o=r(4323),i=r(4323),s=r(1465),{bytesToNumberBE:a,hexToBytes:c}=o;t.DER={Err:class extends Error{constructor(e=""){super(e)}},_parseInt(e){const{Err:r}=t.DER;if(e.length<2||2!==e[0])throw new r("Invalid signature integer tag");const n=e[1],o=e.subarray(2,n+2);if(!n||o.length!==n)throw new r("Invalid signature integer: wrong length");if(128&o[0])throw new r("Invalid signature integer: negative");if(0===o[0]&&!(128&o[1]))throw new r("Invalid signature integer: unnecessary leading zero");return{d:a(o),l:e.subarray(n+2)}},toSig(e){const{Err:r}=t.DER,n="string"==typeof e?c(e):e;if(!(n instanceof Uint8Array))throw new Error("ui8a expected");let o=n.length;if(o<2||48!=n[0])throw new r("Invalid signature tag");if(n[1]!==o-2)throw new r("Invalid signature: incorrect length");const{d:i,l:s}=t.DER._parseInt(n.subarray(2)),{d:a,l:u}=t.DER._parseInt(s);if(u.length)throw new r("Invalid signature: left bytes after parsing");return{r:i,s:a}},hexFromSig(e){const t=e=>8&Number.parseInt(e[0],16)?"00"+e:e,r=e=>{const t=e.toString(16);return 1&t.length?`0${t}`:t},n=t(r(e.s)),o=t(r(e.r)),i=n.length/2,s=o.length/2,a=r(i),c=r(s);return`30${r(s+i+4)}02${c}${o}02${a}${n}`}};const u=BigInt(0),d=BigInt(1),l=BigInt(2),h=BigInt(3),f=BigInt(4);function p(e){const t=function(e){const t=(0,s.validateBasic)(e);o.validateObject(t,{a:"field",b:"field"},{allowedPrivateKeyLengths:"array",wrapPrivateKey:"boolean",isTorsionFree:"function",clearCofactor:"function",allowInfinityPoint:"boolean",fromBytes:"function",toBytes:"function"});const{endo:r,Fp:n,a:i}=t;if(r){if(!n.eql(i,n.ZERO))throw new Error("Endomorphism can only be defined for Koblitz curves that have a=0");if("object"!=typeof r||"bigint"!=typeof r.beta||"function"!=typeof r.splitScalar)throw new Error("Expected endomorphism with beta: bigint and splitScalar: function")}return Object.freeze({...t})}(e),{Fp:r}=t,a=t.toBytes||((e,t,n)=>{const i=t.toAffine();return o.concatBytes(Uint8Array.from([4]),r.toBytes(i.x),r.toBytes(i.y))}),c=t.fromBytes||(e=>{const t=e.subarray(1);return{x:r.fromBytes(t.subarray(0,r.BYTES)),y:r.fromBytes(t.subarray(r.BYTES,2*r.BYTES))}});function l(e){const{a:n,b:o}=t,i=r.sqr(e),s=r.mul(i,e);return r.add(r.add(s,r.mul(e,n)),o)}if(!r.eql(r.sqr(t.Gy),l(t.Gx)))throw new Error("bad generator point: equation left != right");function f(e){return"bigint"==typeof e&&u<e&&e<t.n}function p(e){if(!f(e))throw new Error("Expected valid bigint: 0 < bigint < curve.n")}function m(e){const{allowedPrivateKeyLengths:r,nByteLength:s,wrapPrivateKey:a,n:c}=t;if(r&&"bigint"!=typeof e){if(e instanceof Uint8Array&&(e=o.bytesToHex(e)),"string"!=typeof e||!r.includes(e.length))throw new Error("Invalid key");e=e.padStart(2*s,"0")}let u;try{u="bigint"==typeof e?e:o.bytesToNumberBE((0,i.ensureBytes)("private key",e,s))}catch(t){throw new Error(`private key must be ${s} bytes, hex or bigint, not ${typeof e}`)}return a&&(u=n.mod(u,c)),p(u),u}const g=new Map;function y(e){if(!(e instanceof v))throw new Error("ProjectivePoint expected")}class v{constructor(e,t,n){if(this.px=e,this.py=t,this.pz=n,null==e||!r.isValid(e))throw new Error("x required");if(null==t||!r.isValid(t))throw new Error("y required");if(null==n||!r.isValid(n))throw new Error("z required")}static fromAffine(e){const{x:t,y:n}=e||{};if(!e||!r.isValid(t)||!r.isValid(n))throw new Error("invalid affine point");if(e instanceof v)throw new Error("projective point not allowed");const o=e=>r.eql(e,r.ZERO);return o(t)&&o(n)?v.ZERO:new v(t,n,r.ONE)}get x(){return this.toAffine().x}get y(){return this.toAffine().y}static normalizeZ(e){const t=r.invertBatch(e.map((e=>e.pz)));return e.map(((e,r)=>e.toAffine(t[r]))).map(v.fromAffine)}static fromHex(e){const t=v.fromAffine(c((0,i.ensureBytes)("pointHex",e)));return t.assertValidity(),t}static fromPrivateKey(e){return v.BASE.multiply(m(e))}_setWindowSize(e){this._WINDOW_SIZE=e,g.delete(this)}assertValidity(){if(this.is0()){if(t.allowInfinityPoint)return;throw new Error("bad point: ZERO")}const{x:e,y:n}=this.toAffine();if(!r.isValid(e)||!r.isValid(n))throw new Error("bad point: x or y not FE");const o=r.sqr(n),i=l(e);if(!r.eql(o,i))throw new Error("bad point: equation left != right");if(!this.isTorsionFree())throw new Error("bad point: not in prime-order subgroup")}hasEvenY(){const{y:e}=this.toAffine();if(r.isOdd)return!r.isOdd(e);throw new Error("Field doesn't support isOdd")}equals(e){y(e);const{px:t,py:n,pz:o}=this,{px:i,py:s,pz:a}=e,c=r.eql(r.mul(t,a),r.mul(i,o)),u=r.eql(r.mul(n,a),r.mul(s,o));return c&&u}negate(){return new v(this.px,r.neg(this.py),this.pz)}double(){const{a:e,b:n}=t,o=r.mul(n,h),{px:i,py:s,pz:a}=this;let c=r.ZERO,u=r.ZERO,d=r.ZERO,l=r.mul(i,i),f=r.mul(s,s),p=r.mul(a,a),m=r.mul(i,s);return m=r.add(m,m),d=r.mul(i,a),d=r.add(d,d),c=r.mul(e,d),u=r.mul(o,p),u=r.add(c,u),c=r.sub(f,u),u=r.add(f,u),u=r.mul(c,u),c=r.mul(m,c),d=r.mul(o,d),p=r.mul(e,p),m=r.sub(l,p),m=r.mul(e,m),m=r.add(m,d),d=r.add(l,l),l=r.add(d,l),l=r.add(l,p),l=r.mul(l,m),u=r.add(u,l),p=r.mul(s,a),p=r.add(p,p),l=r.mul(p,m),c=r.sub(c,l),d=r.mul(p,f),d=r.add(d,d),d=r.add(d,d),new v(c,u,d)}add(e){y(e);const{px:n,py:o,pz:i}=this,{px:s,py:a,pz:c}=e;let u=r.ZERO,d=r.ZERO,l=r.ZERO;const f=t.a,p=r.mul(t.b,h);let m=r.mul(n,s),g=r.mul(o,a),b=r.mul(i,c),E=r.add(n,o),_=r.add(s,a);E=r.mul(E,_),_=r.add(m,g),E=r.sub(E,_),_=r.add(n,i);let A=r.add(s,c);return _=r.mul(_,A),A=r.add(m,b),_=r.sub(_,A),A=r.add(o,i),u=r.add(a,c),A=r.mul(A,u),u=r.add(g,b),A=r.sub(A,u),l=r.mul(f,_),u=r.mul(p,b),l=r.add(u,l),u=r.sub(g,l),l=r.add(g,l),d=r.mul(u,l),g=r.add(m,m),g=r.add(g,m),b=r.mul(f,b),_=r.mul(p,_),g=r.add(g,b),b=r.sub(m,b),b=r.mul(f,b),_=r.add(_,b),m=r.mul(g,_),d=r.add(d,m),m=r.mul(A,_),u=r.mul(E,u),u=r.sub(u,m),m=r.mul(E,g),l=r.mul(A,l),l=r.add(l,m),new v(u,d,l)}subtract(e){return this.add(e.negate())}is0(){return this.equals(v.ZERO)}wNAF(e){return E.wNAFCached(this,g,e,(e=>{const t=r.invertBatch(e.map((e=>e.pz)));return e.map(((e,r)=>e.toAffine(t[r]))).map(v.fromAffine)}))}multiplyUnsafe(e){const n=v.ZERO;if(e===u)return n;if(p(e),e===d)return this;const{endo:o}=t;if(!o)return E.unsafeLadder(this,e);let{k1neg:i,k1:s,k2neg:a,k2:c}=o.splitScalar(e),l=n,h=n,f=this;for(;s>u||c>u;)s&d&&(l=l.add(f)),c&d&&(h=h.add(f)),f=f.double(),s>>=d,c>>=d;return i&&(l=l.negate()),a&&(h=h.negate()),h=new v(r.mul(h.px,o.beta),h.py,h.pz),l.add(h)}multiply(e){p(e);let n,o,i=e;const{endo:s}=t;if(s){const{k1neg:e,k1:t,k2neg:a,k2:c}=s.splitScalar(i);let{p:u,f:d}=this.wNAF(t),{p:l,f:h}=this.wNAF(c);u=E.constTimeNegate(e,u),l=E.constTimeNegate(a,l),l=new v(r.mul(l.px,s.beta),l.py,l.pz),n=u.add(l),o=d.add(h)}else{const{p:e,f:t}=this.wNAF(i);n=e,o=t}return v.normalizeZ([n,o])[0]}multiplyAndAddUnsafe(e,t,r){const n=v.BASE,o=(e,t)=>t!==u&&t!==d&&e.equals(n)?e.multiply(t):e.multiplyUnsafe(t),i=o(this,t).add(o(e,r));return i.is0()?void 0:i}toAffine(e){const{px:t,py:n,pz:o}=this,i=this.is0();null==e&&(e=i?r.ONE:r.inv(o));const s=r.mul(t,e),a=r.mul(n,e),c=r.mul(o,e);if(i)return{x:r.ZERO,y:r.ZERO};if(!r.eql(c,r.ONE))throw new Error("invZ was invalid");return{x:s,y:a}}isTorsionFree(){const{h:e,isTorsionFree:r}=t;if(e===d)return!0;if(r)return r(v,this);throw new Error("isTorsionFree() has not been declared for the elliptic curve")}clearCofactor(){const{h:e,clearCofactor:r}=t;return e===d?this:r?r(v,this):this.multiplyUnsafe(t.h)}toRawBytes(e=!0){return this.assertValidity(),a(v,this,e)}toHex(e=!0){return o.bytesToHex(this.toRawBytes(e))}}v.BASE=new v(t.Gx,t.Gy,r.ONE),v.ZERO=new v(r.ZERO,r.ONE,r.ZERO);const b=t.nBitLength,E=(0,s.wNAF)(v,t.endo?Math.ceil(b/2):b);return{CURVE:t,ProjectivePoint:v,normPrivateKeyToScalar:m,weierstrassEquation:l,isWithinCurveOrder:f}}function m(e,t){const r=e.ORDER;let n=u;for(let e=r-d;e%l===u;e/=l)n+=d;const o=n,i=(r-d)/l**o,s=(i-d)/l,a=l**o-d,c=l**(o-d),p=e.pow(t,i),m=e.pow(t,(i+d)/l);let g=(t,r)=>{let n=p,i=e.pow(r,a),u=e.sqr(i);u=e.mul(u,r);let h=e.mul(t,u);h=e.pow(h,s),h=e.mul(h,i),i=e.mul(h,r),u=e.mul(h,t);let f=e.mul(u,i);h=e.pow(f,c);let g=e.eql(h,e.ONE);i=e.mul(u,m),h=e.mul(f,n),u=e.cmov(i,u,g),f=e.cmov(h,f,g);for(let t=o;t>d;t--){let r=l**(t-l),o=e.pow(f,r);const s=e.eql(o,e.ONE);i=e.mul(u,n),n=e.mul(n,n),o=e.mul(f,n),u=e.cmov(i,u,s),f=e.cmov(o,f,s)}return{isValid:g,value:u}};if(e.ORDER%f===h){const r=(e.ORDER-h)/f,n=e.sqrt(e.neg(t));g=(t,o)=>{let i=e.sqr(o);const s=e.mul(t,o);i=e.mul(i,s);let a=e.pow(i,r);a=e.mul(a,s);const c=e.mul(a,n),u=e.mul(e.sqr(a),o),d=e.eql(u,t);return{isValid:d,value:e.cmov(c,a,d)}}}return g}t.weierstrassPoints=p,t.weierstrass=function(e){const r=function(e){const t=(0,s.validateBasic)(e);return o.validateObject(t,{hash:"hash",hmac:"function",randomBytes:"function"},{bits2int:"function",bits2int_modN:"function",lowS:"boolean"}),Object.freeze({lowS:!0,...t})}(e),{Fp:a,n:c}=r,l=a.BYTES+1,h=2*a.BYTES+1;function f(e){return n.mod(e,c)}function m(e){return n.invert(e,c)}const{ProjectivePoint:g,normPrivateKeyToScalar:y,weierstrassEquation:v,isWithinCurveOrder:b}=p({...r,toBytes(e,t,r){const n=t.toAffine(),i=a.toBytes(n.x),s=o.concatBytes;return r?s(Uint8Array.from([t.hasEvenY()?2:3]),i):s(Uint8Array.from([4]),i,a.toBytes(n.y))},fromBytes(e){const t=e.length,r=e[0],n=e.subarray(1);if(t!==l||2!==r&&3!==r){if(t===h&&4===r)return{x:a.fromBytes(n.subarray(0,a.BYTES)),y:a.fromBytes(n.subarray(a.BYTES,2*a.BYTES))};throw new Error(`Point of length ${t} was invalid. Expected ${l} compressed bytes or ${h} uncompressed bytes`)}{const e=o.bytesToNumberBE(n);if(!(u<(i=e)&&i<a.ORDER))throw new Error("Point is not on curve");const t=v(e);let s=a.sqrt(t);return 1==(1&r)!=((s&d)===d)&&(s=a.neg(s)),{x:e,y:s}}var i}}),E=e=>o.bytesToHex(o.numberToBytesBE(e,r.nByteLength));function _(e){return e>c>>d}const A=(e,t,r)=>o.bytesToNumberBE(e.slice(t,r));class T{constructor(e,t,r){this.r=e,this.s=t,this.recovery=r,this.assertValidity()}static fromCompact(e){const t=r.nByteLength;return e=(0,i.ensureBytes)("compactSignature",e,2*t),new T(A(e,0,t),A(e,t,2*t))}static fromDER(e){const{r,s:n}=t.DER.toSig((0,i.ensureBytes)("DER",e));return new T(r,n)}assertValidity(){if(!b(this.r))throw new Error("r must be 0 < r < CURVE.n");if(!b(this.s))throw new Error("s must be 0 < s < CURVE.n")}addRecoveryBit(e){return new T(this.r,this.s,e)}recoverPublicKey(e){const{r:t,s:n,recovery:o}=this,s=P((0,i.ensureBytes)("msgHash",e));if(null==o||![0,1,2,3].includes(o))throw new Error("recovery id invalid");const c=2===o||3===o?t+r.n:t;if(c>=a.ORDER)throw new Error("recovery id 2 or 3 invalid");const u=0==(1&o)?"02":"03",d=g.fromHex(u+E(c)),l=m(c),h=f(-s*l),p=f(n*l),y=g.BASE.multiplyAndAddUnsafe(d,h,p);if(!y)throw new Error("point at infinify");return y.assertValidity(),y}hasHighS(){return _(this.s)}normalizeS(){return this.hasHighS()?new T(this.r,f(-this.s),this.recovery):this}toDERRawBytes(){return o.hexToBytes(this.toDERHex())}toDERHex(){return t.DER.hexFromSig({r:this.r,s:this.s})}toCompactRawBytes(){return o.hexToBytes(this.toCompactHex())}toCompactHex(){return E(this.r)+E(this.s)}}const w={isValidPrivateKey(e){try{return y(e),!0}catch(e){return!1}},normPrivateKeyToScalar:y,randomPrivateKey:()=>{const e=r.randomBytes(a.BYTES+8),t=n.hashToPrivateScalar(e,c);return o.numberToBytesBE(t,r.nByteLength)},precompute:(e=8,t=g.BASE)=>(t._setWindowSize(e),t.multiply(BigInt(3)),t)};function I(e){const t=e instanceof Uint8Array,r="string"==typeof e,n=(t||r)&&e.length;return t?n===l||n===h:r?n===2*l||n===2*h:e instanceof g}const R=r.bits2int||function(e){const t=o.bytesToNumberBE(e),n=8*e.length-r.nBitLength;return n>0?t>>BigInt(n):t},P=r.bits2int_modN||function(e){return f(R(e))},x=o.bitMask(r.nBitLength);function O(e){if("bigint"!=typeof e)throw new Error("bigint expected");if(!(u<=e&&e<x))throw new Error(`bigint expected < 2^${r.nBitLength}`);return o.numberToBytesBE(e,r.nByteLength)}const S={lowS:r.lowS,prehash:!1},C={lowS:r.lowS,prehash:!1};return g.BASE._setWindowSize(8),{CURVE:r,getPublicKey:function(e,t=!0){return g.fromPrivateKey(e).toRawBytes(t)},getSharedSecret:function(e,t,r=!0){if(I(e))throw new Error("first arg must be private key");if(!I(t))throw new Error("second arg must be public key");return g.fromHex(t).multiply(y(e)).toRawBytes(r)},sign:function(e,t,n=S){const{seed:s,k2sig:c}=function(e,t,n=S){if(["recovered","canonical"].some((e=>e in n)))throw new Error("sign() legacy options not supported");const{hash:s,randomBytes:c}=r;let{lowS:l,prehash:h,extraEntropy:p}=n;null==l&&(l=!0),e=(0,i.ensureBytes)("msgHash",e),h&&(e=(0,i.ensureBytes)("prehashed msgHash",s(e)));const v=P(e),E=y(t),A=[O(E),O(v)];if(null!=p){const e=!0===p?c(a.BYTES):p;A.push((0,i.ensureBytes)("extraEntropy",e,a.BYTES))}const w=o.concatBytes(...A),I=v;return{seed:w,k2sig:function(e){const t=R(e);if(!b(t))return;const r=m(t),n=g.BASE.multiply(t).toAffine(),o=f(n.x);if(o===u)return;const i=f(r*f(I+o*E));if(i===u)return;let s=(n.x===o?0:2)|Number(n.y&d),a=i;return l&&_(i)&&(a=function(e){return _(e)?f(-e):e}(i),s^=1),new T(o,a,s)}}}(e,t,n);return o.createHmacDrbg(r.hash.outputLen,r.nByteLength,r.hmac)(s,c)},verify:function(e,n,o,s=C){const a=e;if(n=(0,i.ensureBytes)("msgHash",n),o=(0,i.ensureBytes)("publicKey",o),"strict"in s)throw new Error("options.strict was renamed to lowS");const{lowS:c,prehash:u}=s;let d,l;try{if("string"==typeof a||a instanceof Uint8Array)try{d=T.fromDER(a)}catch(e){if(!(e instanceof t.DER.Err))throw e;d=T.fromCompact(a)}else{if("object"!=typeof a||"bigint"!=typeof a.r||"bigint"!=typeof a.s)throw new Error("PARSE");{const{r:e,s:t}=a;d=new T(e,t)}}l=g.fromHex(o)}catch(e){if("PARSE"===e.message)throw new Error("signature must be Signature instance, Uint8Array or hex string");return!1}if(c&&d.hasHighS())return!1;u&&(n=r.hash(n));const{r:h,s:p}=d,y=P(n),v=m(p),b=f(y*v),E=f(h*v),_=g.BASE.multiplyAndAddUnsafe(l,b,E)?.toAffine();return!!_&&f(_.x)===h},ProjectivePoint:g,Signature:T,utils:w}},t.SWUFpSqrtRatio=m,t.mapToCurveSimpleSWU=function(e,t){if(n.validateField(e),!e.isValid(t.A)||!e.isValid(t.B)||!e.isValid(t.Z))throw new Error("mapToCurveSimpleSWU: invalid opts");const r=m(e,t.Z);if(!e.isOdd)throw new Error("Fp.isOdd is not implemented!");return n=>{let o,i,s,a,c,u,d,l;o=e.sqr(n),o=e.mul(o,t.Z),i=e.sqr(o),i=e.add(i,o),s=e.add(i,e.ONE),s=e.mul(s,t.B),a=e.cmov(t.Z,e.neg(i),!e.eql(i,e.ZERO)),a=e.mul(a,t.A),i=e.sqr(s),u=e.sqr(a),c=e.mul(u,t.A),i=e.add(i,c),i=e.mul(i,s),u=e.mul(u,a),c=e.mul(u,t.B),i=e.add(i,c),d=e.mul(o,s);const{isValid:h,value:f}=r(i,u);l=e.mul(o,n),l=e.mul(l,f),d=e.cmov(d,s,h),l=e.cmov(l,f,h);const p=e.isOdd(n)===e.isOdd(l);return l=e.cmov(e.neg(l),l,p),d=e.div(d,a),{x:d,y:l}}}},1613:(e,t)=>{"use strict";function r(e){if(!Number.isSafeInteger(e)||e<0)throw new Error(`Wrong positive integer: ${e}`)}function n(e){if("boolean"!=typeof e)throw new Error(`Expected boolean, not ${e}`)}function o(e,...t){if(!(e instanceof Uint8Array))throw new TypeError("Expected Uint8Array");if(t.length>0&&!t.includes(e.length))throw new TypeError(`Expected Uint8Array of length ${t}, not of length=${e.length}`)}function i(e){if("function"!=typeof e||"function"!=typeof e.create)throw new Error("Hash should be wrapped by utils.wrapConstructor");r(e.outputLen),r(e.blockLen)}function s(e,t=!0){if(e.destroyed)throw new Error("Hash instance has been destroyed");if(t&&e.finished)throw new Error("Hash#digest() has already been called")}function a(e,t){o(e);const r=t.outputLen;if(e.length<r)throw new Error(`digestInto() expects output buffer of length at least ${r}`)}Object.defineProperty(t,"__esModule",{value:!0}),t.output=t.exists=t.hash=t.bytes=t.bool=t.number=void 0,t.number=r,t.bool=n,t.bytes=o,t.hash=i,t.exists=s,t.output=a;const c={number:r,bool:n,bytes:o,hash:i,exists:s,output:a};t.default=c},4490:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.SHA2=void 0;const n=r(1613),o=r(488);class i extends o.Hash{constructor(e,t,r,n){super(),this.blockLen=e,this.outputLen=t,this.padOffset=r,this.isLE=n,this.finished=!1,this.length=0,this.pos=0,this.destroyed=!1,this.buffer=new Uint8Array(e),this.view=(0,o.createView)(this.buffer)}update(e){n.default.exists(this);const{view:t,buffer:r,blockLen:i}=this,s=(e=(0,o.toBytes)(e)).length;for(let n=0;n<s;){const a=Math.min(i-this.pos,s-n);if(a!==i)r.set(e.subarray(n,n+a),this.pos),this.pos+=a,n+=a,this.pos===i&&(this.process(t,0),this.pos=0);else{const t=(0,o.createView)(e);for(;i<=s-n;n+=i)this.process(t,n)}}return this.length+=e.length,this.roundClean(),this}digestInto(e){n.default.exists(this),n.default.output(e,this),this.finished=!0;const{buffer:t,view:r,blockLen:i,isLE:s}=this;let{pos:a}=this;t[a++]=128,this.buffer.subarray(a).fill(0),this.padOffset>i-a&&(this.process(r,0),a=0);for(let e=a;e<i;e++)t[e]=0;!function(e,t,r,n){if("function"==typeof e.setBigUint64)return e.setBigUint64(t,r,n);const o=BigInt(32),i=BigInt(4294967295),s=Number(r>>o&i),a=Number(r&i),c=n?4:0,u=n?0:4;e.setUint32(t+c,s,n),e.setUint32(t+u,a,n)}(r,i-8,BigInt(8*this.length),s),this.process(r,0);const c=(0,o.createView)(e),u=this.outputLen;if(u%4)throw new Error("_sha2: outputLen should be aligned to 32bit");const d=u/4,l=this.get();if(d>l.length)throw new Error("_sha2: outputLen bigger than state");for(let e=0;e<d;e++)c.setUint32(4*e,l[e],s)}digest(){const{buffer:e,outputLen:t}=this;this.digestInto(e);const r=e.slice(0,t);return this.destroy(),r}_cloneInto(e){e||(e=new this.constructor),e.set(...this.get());const{blockLen:t,buffer:r,length:n,finished:o,destroyed:i,pos:s}=this;return e.length=n,e.pos=s,e.finished=o,e.destroyed=i,n%t&&e.buffer.set(r),e}}t.SHA2=i},9419:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.crypto=void 0,t.crypto="object"==typeof globalThis&&"crypto"in globalThis?globalThis.crypto:void 0},7493:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.hmac=void 0;const n=r(1613),o=r(488);class i extends o.Hash{constructor(e,t){super(),this.finished=!1,this.destroyed=!1,n.default.hash(e);const r=(0,o.toBytes)(t);if(this.iHash=e.create(),"function"!=typeof this.iHash.update)throw new TypeError("Expected instance of class which extends utils.Hash");this.blockLen=this.iHash.blockLen,this.outputLen=this.iHash.outputLen;const i=this.blockLen,s=new Uint8Array(i);s.set(r.length>i?e.create().update(r).digest():r);for(let e=0;e<s.length;e++)s[e]^=54;this.iHash.update(s),this.oHash=e.create();for(let e=0;e<s.length;e++)s[e]^=106;this.oHash.update(s),s.fill(0)}update(e){return n.default.exists(this),this.iHash.update(e),this}digestInto(e){n.default.exists(this),n.default.bytes(e,this.outputLen),this.finished=!0,this.iHash.digestInto(e),this.oHash.update(e),this.oHash.digestInto(e),this.destroy()}digest(){const e=new Uint8Array(this.oHash.outputLen);return this.digestInto(e),e}_cloneInto(e){e||(e=Object.create(Object.getPrototypeOf(this),{}));const{oHash:t,iHash:r,finished:n,destroyed:o,blockLen:i,outputLen:s}=this;return e.finished=n,e.destroyed=o,e.blockLen=i,e.outputLen=s,e.oHash=t._cloneInto(e.oHash),e.iHash=r._cloneInto(e.iHash),e}destroy(){this.destroyed=!0,this.oHash.destroy(),this.iHash.destroy()}}t.hmac=(e,t,r)=>new i(e,t).update(r).digest(),t.hmac.create=(e,t)=>new i(e,t)},7371:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.sha224=t.sha256=void 0;const n=r(4490),o=r(488),i=(e,t,r)=>e&t^e&r^t&r,s=new Uint32Array([1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298]),a=new Uint32Array([1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225]),c=new Uint32Array(64);class u extends n.SHA2{constructor(){super(64,32,8,!1),this.A=0|a[0],this.B=0|a[1],this.C=0|a[2],this.D=0|a[3],this.E=0|a[4],this.F=0|a[5],this.G=0|a[6],this.H=0|a[7]}get(){const{A:e,B:t,C:r,D:n,E:o,F:i,G:s,H:a}=this;return[e,t,r,n,o,i,s,a]}set(e,t,r,n,o,i,s,a){this.A=0|e,this.B=0|t,this.C=0|r,this.D=0|n,this.E=0|o,this.F=0|i,this.G=0|s,this.H=0|a}process(e,t){for(let r=0;r<16;r++,t+=4)c[r]=e.getUint32(t,!1);for(let e=16;e<64;e++){const t=c[e-15],r=c[e-2],n=(0,o.rotr)(t,7)^(0,o.rotr)(t,18)^t>>>3,i=(0,o.rotr)(r,17)^(0,o.rotr)(r,19)^r>>>10;c[e]=i+c[e-7]+n+c[e-16]|0}let{A:r,B:n,C:a,D:u,E:d,F:l,G:h,H:f}=this;for(let e=0;e<64;e++){const t=f+((0,o.rotr)(d,6)^(0,o.rotr)(d,11)^(0,o.rotr)(d,25))+((p=d)&l^~p&h)+s[e]+c[e]|0,m=((0,o.rotr)(r,2)^(0,o.rotr)(r,13)^(0,o.rotr)(r,22))+i(r,n,a)|0;f=h,h=l,l=d,d=u+t|0,u=a,a=n,n=r,r=t+m|0}var p;r=r+this.A|0,n=n+this.B|0,a=a+this.C|0,u=u+this.D|0,d=d+this.E|0,l=l+this.F|0,h=h+this.G|0,f=f+this.H|0,this.set(r,n,a,u,d,l,h,f)}roundClean(){c.fill(0)}destroy(){this.set(0,0,0,0,0,0,0,0),this.buffer.fill(0)}}class d extends u{constructor(){super(),this.A=-1056596264,this.B=914150663,this.C=812702999,this.D=-150054599,this.E=-4191439,this.F=1750603025,this.G=1694076839,this.H=-1090891868,this.outputLen=28}}t.sha256=(0,o.wrapConstructor)((()=>new u)),t.sha224=(0,o.wrapConstructor)((()=>new d))},488:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.randomBytes=t.wrapConstructorWithOpts=t.wrapConstructor=t.checkOpts=t.Hash=t.concatBytes=t.toBytes=t.utf8ToBytes=t.asyncLoop=t.nextTick=t.hexToBytes=t.bytesToHex=t.isLE=t.rotr=t.createView=t.u32=t.u8=void 0;const n=r(9419);if(t.u8=e=>new Uint8Array(e.buffer,e.byteOffset,e.byteLength),t.u32=e=>new Uint32Array(e.buffer,e.byteOffset,Math.floor(e.byteLength/4)),t.createView=e=>new DataView(e.buffer,e.byteOffset,e.byteLength),t.rotr=(e,t)=>e<<32-t|e>>>t,t.isLE=68===new Uint8Array(new Uint32Array([287454020]).buffer)[0],!t.isLE)throw new Error("Non little-endian hardware is not supported");const o=Array.from({length:256},((e,t)=>t.toString(16).padStart(2,"0")));function i(e){if("string"!=typeof e)throw new TypeError("utf8ToBytes expected string, got "+typeof e);return(new TextEncoder).encode(e)}function s(e){if("string"==typeof e&&(e=i(e)),!(e instanceof Uint8Array))throw new TypeError(`Expected input type is Uint8Array (got ${typeof e})`);return e}t.bytesToHex=function(e){if(!(e instanceof Uint8Array))throw new Error("Uint8Array expected");let t="";for(let r=0;r<e.length;r++)t+=o[e[r]];return t},t.hexToBytes=function(e){if("string"!=typeof e)throw new TypeError("hexToBytes: expected string, got "+typeof e);if(e.length%2)throw new Error("hexToBytes: received invalid unpadded hex");const t=new Uint8Array(e.length/2);for(let r=0;r<t.length;r++){const n=2*r,o=e.slice(n,n+2),i=Number.parseInt(o,16);if(Number.isNaN(i)||i<0)throw new Error("Invalid byte sequence");t[r]=i}return t},t.nextTick=async()=>{},t.asyncLoop=async function(e,r,n){let o=Date.now();for(let i=0;i<e;i++){n(i);const e=Date.now()-o;e>=0&&e<r||(await(0,t.nextTick)(),o+=e)}},t.utf8ToBytes=i,t.toBytes=s,t.concatBytes=function(...e){if(!e.every((e=>e instanceof Uint8Array)))throw new Error("Uint8Array list expected");if(1===e.length)return e[0];const t=e.reduce(((e,t)=>e+t.length),0),r=new Uint8Array(t);for(let t=0,n=0;t<e.length;t++){const o=e[t];r.set(o,n),n+=o.length}return r},t.Hash=class{clone(){return this._cloneInto()}},t.checkOpts=function(e,t){if(void 0!==t&&("object"!=typeof t||(r=t,"[object Object]"!==Object.prototype.toString.call(r)||r.constructor!==Object)))throw new TypeError("Options should be object or undefined");var r;return Object.assign(e,t)},t.wrapConstructor=function(e){const t=t=>e().update(s(t)).digest(),r=e();return t.outputLen=r.outputLen,t.blockLen=r.blockLen,t.create=()=>e(),t},t.wrapConstructorWithOpts=function(e){const t=(t,r)=>e(r).update(s(t)).digest(),r=e({});return t.outputLen=r.outputLen,t.blockLen=r.blockLen,t.create=t=>e(t),t},t.randomBytes=function(e=32){if(n.crypto&&"function"==typeof n.crypto.getRandomValues)return n.crypto.getRandomValues(new Uint8Array(e));throw new Error("crypto.getRandomValues must be defined")}},8358:(e,t,r)=>{"use strict";var n;Object.defineProperty(t,"__esModule",{value:!0}),t.encodeToCurve=t.hashToCurve=t.schnorr=t.secp256k1=void 0;const o=r(7371),i=r(488),s=r(9530),a=r(7851),c=r(4323),u=r(1322),d=r(5887),l=BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f"),h=BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141"),f=BigInt(1),p=BigInt(2),m=(e,t)=>(e+t/p)/t;function g(e){const t=l,r=BigInt(3),n=BigInt(6),o=BigInt(11),i=BigInt(22),a=BigInt(23),c=BigInt(44),u=BigInt(88),d=e*e*e%t,h=d*d*e%t,f=(0,s.pow2)(h,r,t)*h%t,m=(0,s.pow2)(f,r,t)*h%t,g=(0,s.pow2)(m,p,t)*d%t,v=(0,s.pow2)(g,o,t)*g%t,b=(0,s.pow2)(v,i,t)*v%t,E=(0,s.pow2)(b,c,t)*b%t,_=(0,s.pow2)(E,u,t)*E%t,A=(0,s.pow2)(_,c,t)*b%t,T=(0,s.pow2)(A,r,t)*h%t,w=(0,s.pow2)(T,a,t)*v%t,I=(0,s.pow2)(w,n,t)*d%t,R=(0,s.pow2)(I,p,t);if(!y.eql(y.sqr(R),e))throw new Error("Cannot find square root");return R}const y=(0,s.Field)(l,void 0,void 0,{sqrt:g});t.secp256k1=(0,d.createCurve)({a:BigInt(0),b:BigInt(7),Fp:y,n:h,Gx:BigInt("55066263022277343669578718895168534326250603453777594175500187360389116729240"),Gy:BigInt("32670510020758816978083085130507043184471273380659243275938904335757337482424"),h:BigInt(1),lowS:!0,endo:{beta:BigInt("0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee"),splitScalar:e=>{const t=h,r=BigInt("0x3086d221a7d46bcde86c90e49284eb15"),n=-f*BigInt("0xe4437ed6010e88286f547fa90abfe4c3"),o=BigInt("0x114ca50f7a8e2f3f657c1108d9d44cfd8"),i=r,a=BigInt("0x100000000000000000000000000000000"),c=m(i*e,t),u=m(-n*e,t);let d=(0,s.mod)(e-c*r-u*o,t),l=(0,s.mod)(-c*n-u*i,t);const p=d>a,g=l>a;if(p&&(d=t-d),g&&(l=t-l),d>a||l>a)throw new Error("splitScalar: Endomorphism failed, k="+e);return{k1neg:p,k1:d,k2neg:g,k2:l}}}},o.sha256);const v=BigInt(0),b=e=>"bigint"==typeof e&&v<e&&e<l,E={};function _(e,...t){let r=E[e];if(void 0===r){const t=(0,o.sha256)(Uint8Array.from(e,(e=>e.charCodeAt(0))));r=(0,c.concatBytes)(t,t),E[e]=r}return(0,o.sha256)((0,c.concatBytes)(r,...t))}const A=e=>e.toRawBytes(!0).slice(1),T=e=>(0,c.numberToBytesBE)(e,32),w=e=>(0,s.mod)(e,l),I=e=>(0,s.mod)(e,h),R=t.secp256k1.ProjectivePoint;function P(e){let r=t.secp256k1.utils.normPrivateKeyToScalar(e),n=R.fromPrivateKey(r);return{scalar:n.hasEvenY()?r:I(-r),bytes:A(n)}}function x(e){if(!b(e))throw new Error("bad x: need 0 < x < p");const t=w(e*e);let r=g(w(t*e+BigInt(7)));r%p!==v&&(r=w(-r));const n=new R(e,r,f);return n.assertValidity(),n}function O(...e){return I((0,c.bytesToNumberBE)(_("BIP0340/challenge",...e)))}function S(e,t,r){const n=(0,c.ensureBytes)("signature",e,64),o=(0,c.ensureBytes)("message",t),i=(0,c.ensureBytes)("publicKey",r,32);try{const e=x((0,c.bytesToNumberBE)(i)),t=(0,c.bytesToNumberBE)(n.subarray(0,32));if(!b(t))return!1;const r=(0,c.bytesToNumberBE)(n.subarray(32,64));if(!("bigint"==typeof(d=r)&&v<d&&d<h))return!1;const l=O(T(t),A(e),o),f=(s=e,a=r,u=I(-l),R.BASE.multiplyAndAddUnsafe(s,a,u));return!(!f||!f.hasEvenY()||f.toAffine().x!==t)}catch(e){return!1}var s,a,u,d}t.schnorr={getPublicKey:function(e){return P(e).bytes},sign:function(e,t,r=(0,i.randomBytes)(32)){const n=(0,c.ensureBytes)("message",e),{bytes:o,scalar:s}=P(t),a=(0,c.ensureBytes)("auxRand",r,32),u=T(s^(0,c.bytesToNumberBE)(_("BIP0340/aux",a))),d=_("BIP0340/nonce",u,o,n),l=I((0,c.bytesToNumberBE)(d));if(l===v)throw new Error("sign failed: k is zero");const{bytes:h,scalar:f}=P(l),p=O(h,o,n),m=new Uint8Array(64);if(m.set(h,0),m.set(T(I(f+p*s)),32),!S(m,n,o))throw new Error("sign: Invalid signature produced");return m},verify:S,utils:{randomPrivateKey:t.secp256k1.utils.randomPrivateKey,lift_x:x,pointToBytes:A,numberToBytesBE:c.numberToBytesBE,bytesToNumberBE:c.bytesToNumberBE,taggedHash:_,mod:s.mod}};const C=u.isogenyMap(y,[["0x8e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38daaaaa8c7","0x7d3d4c80bc321d5b9f315cea7fd44c5d595d2fc0bf63b92dfff1044f17c6581","0x534c328d23f234e6e2a413deca25caece4506144037c40314ecbd0b53d9dd262","0x8e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38daaaaa88c"],["0xd35771193d94918a9ca34ccbb7b640dd86cd409542f8487d9fe6b745781eb49b","0xedadc6f64383dc1df7c4b2d51b54225406d36b641f5e41bbc52a56612a8c6d14","0x0000000000000000000000000000000000000000000000000000000000000001"],["0x4bda12f684bda12f684bda12f684bda12f684bda12f684bda12f684b8e38e23c","0xc75e0c32d5cb7c0fa9d0a54b12a0a6d5647ab046d686da6fdffc90fc201d71a3","0x29a6194691f91a73715209ef6512e576722830a201be2018a765e85a9ecee931","0x2f684bda12f684bda12f684bda12f684bda12f684bda12f684bda12f38e38d84"],["0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffff93b","0x7a06534bb8bdb49fd5e9e6632722c2989467c1bfc8e8d978dfb425d2685c2573","0x6484aa716545ca2cf3a70c3fa8fe337e0a3d21162f0d6299a7bf8192bfd2a76f","0x0000000000000000000000000000000000000000000000000000000000000001"]].map((e=>e.map((e=>BigInt(e)))))),B=(0,a.mapToCurveSimpleSWU)(y,{A:BigInt("0x3f8731abdd661adca08a5558f0f5d272e953d363cb6f0e5d405447c01a444533"),B:BigInt("1771"),Z:y.create(BigInt("-11"))});n=u.createHasher(t.secp256k1.ProjectivePoint,(e=>{const{x:t,y:r}=B(y.create(e[0]));return C(t,r)}),{DST:"secp256k1_XMD:SHA-256_SSWU_RO_",encodeDST:"secp256k1_XMD:SHA-256_SSWU_NU_",p:y.ORDER,m:1,k:128,expand:"xmd",hash:o.sha256}),t.hashToCurve=n.hashToCurve,t.encodeToCurve=n.encodeToCurve},1238:(e,t)=>{var r;r=function(e){e.version="1.2.2";var t=function(){for(var e=0,t=new Array(256),r=0;256!=r;++r)e=1&(e=1&(e=1&(e=1&(e=1&(e=1&(e=1&(e=1&(e=r)?-306674912^e>>>1:e>>>1)?-306674912^e>>>1:e>>>1)?-306674912^e>>>1:e>>>1)?-306674912^e>>>1:e>>>1)?-306674912^e>>>1:e>>>1)?-306674912^e>>>1:e>>>1)?-306674912^e>>>1:e>>>1)?-306674912^e>>>1:e>>>1,t[r]=e;return"undefined"!=typeof Int32Array?new Int32Array(t):t}(),r=function(e){var t=0,r=0,n=0,o="undefined"!=typeof Int32Array?new Int32Array(4096):new Array(4096);for(n=0;256!=n;++n)o[n]=e[n];for(n=0;256!=n;++n)for(r=e[n],t=256+n;t<4096;t+=256)r=o[t]=r>>>8^e[255&r];var i=[];for(n=1;16!=n;++n)i[n-1]="undefined"!=typeof Int32Array?o.subarray(256*n,256*n+256):o.slice(256*n,256*n+256);return i}(t),n=r[0],o=r[1],i=r[2],s=r[3],a=r[4],c=r[5],u=r[6],d=r[7],l=r[8],h=r[9],f=r[10],p=r[11],m=r[12],g=r[13],y=r[14];e.table=t,e.bstr=function(e,r){for(var n=-1^r,o=0,i=e.length;o<i;)n=n>>>8^t[255&(n^e.charCodeAt(o++))];return~n},e.buf=function(e,r){for(var v=-1^r,b=e.length-15,E=0;E<b;)v=y[e[E++]^255&v]^g[e[E++]^v>>8&255]^m[e[E++]^v>>16&255]^p[e[E++]^v>>>24]^f[e[E++]]^h[e[E++]]^l[e[E++]]^d[e[E++]]^u[e[E++]]^c[e[E++]]^a[e[E++]]^s[e[E++]]^i[e[E++]]^o[e[E++]]^n[e[E++]]^t[e[E++]];for(b+=15;E<b;)v=v>>>8^t[255&(v^e[E++])];return~v},e.str=function(e,r){for(var n=-1^r,o=0,i=e.length,s=0,a=0;o<i;)(s=e.charCodeAt(o++))<128?n=n>>>8^t[255&(n^s)]:s<2048?n=(n=n>>>8^t[255&(n^(192|s>>6&31))])>>>8^t[255&(n^(128|63&s))]:s>=55296&&s<57344?(s=64+(1023&s),a=1023&e.charCodeAt(o++),n=(n=(n=(n=n>>>8^t[255&(n^(240|s>>8&7))])>>>8^t[255&(n^(128|s>>2&63))])>>>8^t[255&(n^(128|a>>6&15|(3&s)<<4))])>>>8^t[255&(n^(128|63&a))]):n=(n=(n=n>>>8^t[255&(n^(224|s>>12&15))])>>>8^t[255&(n^(128|s>>6&63))])>>>8^t[255&(n^(128|63&s))];return~n}},"undefined"==typeof DO_NOT_EXPORT_CRC?r(t):r({})},6279:(e,t,r)=>{var n="undefined"!=typeof globalThis&&globalThis||"undefined"!=typeof self&&self||void 0!==r.g&&r.g,o=function(){function e(){this.fetch=!1,this.DOMException=n.DOMException}return e.prototype=n,new e}();!function(e){!function(t){var r=void 0!==e&&e||"undefined"!=typeof self&&self||void 0!==r&&r,n="URLSearchParams"in r,o="Symbol"in r&&"iterator"in Symbol,i="FileReader"in r&&"Blob"in r&&function(){try{return new Blob,!0}catch(e){return!1}}(),s="FormData"in r,a="ArrayBuffer"in r;if(a)var c=["[object Int8Array]","[object Uint8Array]","[object Uint8ClampedArray]","[object Int16Array]","[object Uint16Array]","[object Int32Array]","[object Uint32Array]","[object Float32Array]","[object Float64Array]"],u=ArrayBuffer.isView||function(e){return e&&c.indexOf(Object.prototype.toString.call(e))>-1};function d(e){if("string"!=typeof e&&(e=String(e)),/[^a-z0-9\-#$%&'*+.^_`|~!]/i.test(e)||""===e)throw new TypeError('Invalid character in header field name: "'+e+'"');return e.toLowerCase()}function l(e){return"string"!=typeof e&&(e=String(e)),e}function h(e){var t={next:function(){var t=e.shift();return{done:void 0===t,value:t}}};return o&&(t[Symbol.iterator]=function(){return t}),t}function f(e){this.map={},e instanceof f?e.forEach((function(e,t){this.append(t,e)}),this):Array.isArray(e)?e.forEach((function(e){this.append(e[0],e[1])}),this):e&&Object.getOwnPropertyNames(e).forEach((function(t){this.append(t,e[t])}),this)}function p(e){if(e.bodyUsed)return Promise.reject(new TypeError("Already read"));e.bodyUsed=!0}function m(e){return new Promise((function(t,r){e.onload=function(){t(e.result)},e.onerror=function(){r(e.error)}}))}function g(e){var t=new FileReader,r=m(t);return t.readAsArrayBuffer(e),r}function y(e){if(e.slice)return e.slice(0);var t=new Uint8Array(e.byteLength);return t.set(new Uint8Array(e)),t.buffer}function v(){return this.bodyUsed=!1,this._initBody=function(e){var t;this.bodyUsed=this.bodyUsed,this._bodyInit=e,e?"string"==typeof e?this._bodyText=e:i&&Blob.prototype.isPrototypeOf(e)?this._bodyBlob=e:s&&FormData.prototype.isPrototypeOf(e)?this._bodyFormData=e:n&&URLSearchParams.prototype.isPrototypeOf(e)?this._bodyText=e.toString():a&&i&&(t=e)&&DataView.prototype.isPrototypeOf(t)?(this._bodyArrayBuffer=y(e.buffer),this._bodyInit=new Blob([this._bodyArrayBuffer])):a&&(ArrayBuffer.prototype.isPrototypeOf(e)||u(e))?this._bodyArrayBuffer=y(e):this._bodyText=e=Object.prototype.toString.call(e):this._bodyText="",this.headers.get("content-type")||("string"==typeof e?this.headers.set("content-type","text/plain;charset=UTF-8"):this._bodyBlob&&this._bodyBlob.type?this.headers.set("content-type",this._bodyBlob.type):n&&URLSearchParams.prototype.isPrototypeOf(e)&&this.headers.set("content-type","application/x-www-form-urlencoded;charset=UTF-8"))},i&&(this.blob=function(){var e=p(this);if(e)return e;if(this._bodyBlob)return Promise.resolve(this._bodyBlob);if(this._bodyArrayBuffer)return Promise.resolve(new Blob([this._bodyArrayBuffer]));if(this._bodyFormData)throw new Error("could not read FormData body as blob");return Promise.resolve(new Blob([this._bodyText]))},this.arrayBuffer=function(){return this._bodyArrayBuffer?p(this)||(ArrayBuffer.isView(this._bodyArrayBuffer)?Promise.resolve(this._bodyArrayBuffer.buffer.slice(this._bodyArrayBuffer.byteOffset,this._bodyArrayBuffer.byteOffset+this._bodyArrayBuffer.byteLength)):Promise.resolve(this._bodyArrayBuffer)):this.blob().then(g)}),this.text=function(){var e,t,r,n=p(this);if(n)return n;if(this._bodyBlob)return e=this._bodyBlob,r=m(t=new FileReader),t.readAsText(e),r;if(this._bodyArrayBuffer)return Promise.resolve(function(e){for(var t=new Uint8Array(e),r=new Array(t.length),n=0;n<t.length;n++)r[n]=String.fromCharCode(t[n]);return r.join("")}(this._bodyArrayBuffer));if(this._bodyFormData)throw new Error("could not read FormData body as text");return Promise.resolve(this._bodyText)},s&&(this.formData=function(){return this.text().then(_)}),this.json=function(){return this.text().then(JSON.parse)},this}f.prototype.append=function(e,t){e=d(e),t=l(t);var r=this.map[e];this.map[e]=r?r+", "+t:t},f.prototype.delete=function(e){delete this.map[d(e)]},f.prototype.get=function(e){return e=d(e),this.has(e)?this.map[e]:null},f.prototype.has=function(e){return this.map.hasOwnProperty(d(e))},f.prototype.set=function(e,t){this.map[d(e)]=l(t)},f.prototype.forEach=function(e,t){for(var r in this.map)this.map.hasOwnProperty(r)&&e.call(t,this.map[r],r,this)},f.prototype.keys=function(){var e=[];return this.forEach((function(t,r){e.push(r)})),h(e)},f.prototype.values=function(){var e=[];return this.forEach((function(t){e.push(t)})),h(e)},f.prototype.entries=function(){var e=[];return this.forEach((function(t,r){e.push([r,t])})),h(e)},o&&(f.prototype[Symbol.iterator]=f.prototype.entries);var b=["DELETE","GET","HEAD","OPTIONS","POST","PUT"];function E(e,t){if(!(this instanceof E))throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.');var r,n,o=(t=t||{}).body;if(e instanceof E){if(e.bodyUsed)throw new TypeError("Already read");this.url=e.url,this.credentials=e.credentials,t.headers||(this.headers=new f(e.headers)),this.method=e.method,this.mode=e.mode,this.signal=e.signal,o||null==e._bodyInit||(o=e._bodyInit,e.bodyUsed=!0)}else this.url=String(e);if(this.credentials=t.credentials||this.credentials||"same-origin",!t.headers&&this.headers||(this.headers=new f(t.headers)),this.method=(n=(r=t.method||this.method||"GET").toUpperCase(),b.indexOf(n)>-1?n:r),this.mode=t.mode||this.mode||null,this.signal=t.signal||this.signal,this.referrer=null,("GET"===this.method||"HEAD"===this.method)&&o)throw new TypeError("Body not allowed for GET or HEAD requests");if(this._initBody(o),!("GET"!==this.method&&"HEAD"!==this.method||"no-store"!==t.cache&&"no-cache"!==t.cache)){var i=/([?&])_=[^&]*/;i.test(this.url)?this.url=this.url.replace(i,"$1_="+(new Date).getTime()):this.url+=(/\?/.test(this.url)?"&":"?")+"_="+(new Date).getTime()}}function _(e){var t=new FormData;return e.trim().split("&").forEach((function(e){if(e){var r=e.split("="),n=r.shift().replace(/\+/g," "),o=r.join("=").replace(/\+/g," ");t.append(decodeURIComponent(n),decodeURIComponent(o))}})),t}function A(e,t){if(!(this instanceof A))throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.');t||(t={}),this.type="default",this.status=void 0===t.status?200:t.status,this.ok=this.status>=200&&this.status<300,this.statusText=void 0===t.statusText?"":""+t.statusText,this.headers=new f(t.headers),this.url=t.url||"",this._initBody(e)}E.prototype.clone=function(){return new E(this,{body:this._bodyInit})},v.call(E.prototype),v.call(A.prototype),A.prototype.clone=function(){return new A(this._bodyInit,{status:this.status,statusText:this.statusText,headers:new f(this.headers),url:this.url})},A.error=function(){var e=new A(null,{status:0,statusText:""});return e.type="error",e};var T=[301,302,303,307,308];A.redirect=function(e,t){if(-1===T.indexOf(t))throw new RangeError("Invalid status code");return new A(null,{status:t,headers:{location:e}})},t.DOMException=r.DOMException;try{new t.DOMException}catch(e){t.DOMException=function(e,t){this.message=e,this.name=t;var r=Error(e);this.stack=r.stack},t.DOMException.prototype=Object.create(Error.prototype),t.DOMException.prototype.constructor=t.DOMException}function w(e,n){return new Promise((function(o,s){var c=new E(e,n);if(c.signal&&c.signal.aborted)return s(new t.DOMException("Aborted","AbortError"));var u=new XMLHttpRequest;function d(){u.abort()}u.onload=function(){var e,t,r={status:u.status,statusText:u.statusText,headers:(e=u.getAllResponseHeaders()||"",t=new f,e.replace(/\r?\n[\t ]+/g," ").split("\r").map((function(e){return 0===e.indexOf("\n")?e.substr(1,e.length):e})).forEach((function(e){var r=e.split(":"),n=r.shift().trim();if(n){var o=r.join(":").trim();t.append(n,o)}})),t)};r.url="responseURL"in u?u.responseURL:r.headers.get("X-Request-URL");var n="response"in u?u.response:u.responseText;setTimeout((function(){o(new A(n,r))}),0)},u.onerror=function(){setTimeout((function(){s(new TypeError("Network request failed"))}),0)},u.ontimeout=function(){setTimeout((function(){s(new TypeError("Network request failed"))}),0)},u.onabort=function(){setTimeout((function(){s(new t.DOMException("Aborted","AbortError"))}),0)},u.open(c.method,function(e){try{return""===e&&r.location.href?r.location.href:e}catch(t){return e}}(c.url),!0),"include"===c.credentials?u.withCredentials=!0:"omit"===c.credentials&&(u.withCredentials=!1),"responseType"in u&&(i?u.responseType="blob":a&&c.headers.get("Content-Type")&&-1!==c.headers.get("Content-Type").indexOf("application/octet-stream")&&(u.responseType="arraybuffer")),!n||"object"!=typeof n.headers||n.headers instanceof f?c.headers.forEach((function(e,t){u.setRequestHeader(t,e)})):Object.getOwnPropertyNames(n.headers).forEach((function(e){u.setRequestHeader(e,l(n.headers[e]))})),c.signal&&(c.signal.addEventListener("abort",d),u.onreadystatechange=function(){4===u.readyState&&c.signal.removeEventListener("abort",d)}),u.send(void 0===c._bodyInit?null:c._bodyInit)}))}w.polyfill=!0,r.fetch||(r.fetch=w,r.Headers=f,r.Request=E,r.Response=A),t.Headers=f,t.Request=E,t.Response=A,t.fetch=w}({})}(o),o.fetch.ponyfill=!0,delete o.fetch.polyfill;var i=n.fetch?n:o;(t=i.fetch).default=i.fetch,t.fetch=i.fetch,t.Headers=i.Headers,t.Request=i.Request,t.Response=i.Response,e.exports=t},7475:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>o});var n=null;"undefined"!=typeof WebSocket?n=WebSocket:"undefined"!=typeof MozWebSocket?n=MozWebSocket:void 0!==r.g?n=r.g.WebSocket||r.g.MozWebSocket:"undefined"!=typeof window?n=window.WebSocket||window.MozWebSocket:"undefined"!=typeof self&&(n=self.WebSocket||self.MozWebSocket);const o=n},4406:e=>{var t,r,n=e.exports={};function o(){throw new Error("setTimeout has not been defined")}function i(){throw new Error("clearTimeout has not been defined")}function s(e){if(t===setTimeout)return setTimeout(e,0);if((t===o||!t)&&setTimeout)return t=setTimeout,setTimeout(e,0);try{return t(e,0)}catch(r){try{return t.call(null,e,0)}catch(r){return t.call(this,e,0)}}}!function(){try{t="function"==typeof setTimeout?setTimeout:o}catch(e){t=o}try{r="function"==typeof clearTimeout?clearTimeout:i}catch(e){r=i}}();var a,c=[],u=!1,d=-1;function l(){u&&a&&(u=!1,a.length?c=a.concat(c):d=-1,c.length&&h())}function h(){if(!u){var e=s(l);u=!0;for(var t=c.length;t;){for(a=c,c=[];++d<t;)a&&a[d].run();d=-1,t=c.length}a=null,u=!1,function(e){if(r===clearTimeout)return clearTimeout(e);if((r===i||!r)&&clearTimeout)return r=clearTimeout,clearTimeout(e);try{r(e)}catch(t){try{return r.call(null,e)}catch(t){return r.call(this,e)}}}(e)}}function f(e,t){this.fun=e,this.array=t}function p(){}n.nextTick=function(e){var t=new Array(arguments.length-1);if(arguments.length>1)for(var r=1;r<arguments.length;r++)t[r-1]=arguments[r];c.push(new f(e,t)),1!==c.length||u||s(h)},f.prototype.run=function(){this.fun.apply(null,this.array)},n.title="browser",n.browser=!0,n.env={},n.argv=[],n.version="",n.versions={},n.on=p,n.addListener=p,n.once=p,n.off=p,n.removeListener=p,n.removeAllListeners=p,n.emit=p,n.prependListener=p,n.prependOnceListener=p,n.listeners=function(e){return[]},n.binding=function(e){throw new Error("process.binding is not supported")},n.cwd=function(){return"/"},n.chdir=function(e){throw new Error("process.chdir is not supported")},n.umask=function(){return 0}},6985:function(e,t,r){var n=r(4406);!function(e,t){"use strict";if(!e.setImmediate){var r,o,i,s,a,c=1,u={},d=!1,l=e.document,h=Object.getPrototypeOf&&Object.getPrototypeOf(e);h=h&&h.setTimeout?h:e,"[object process]"==={}.toString.call(e.process)?r=function(e){n.nextTick((function(){p(e)}))}:function(){if(e.postMessage&&!e.importScripts){var t=!0,r=e.onmessage;return e.onmessage=function(){t=!1},e.postMessage("","*"),e.onmessage=r,t}}()?(s="setImmediate$"+Math.random()+"$",a=function(t){t.source===e&&"string"==typeof t.data&&0===t.data.indexOf(s)&&p(+t.data.slice(s.length))},e.addEventListener?e.addEventListener("message",a,!1):e.attachEvent("onmessage",a),r=function(t){e.postMessage(s+t,"*")}):e.MessageChannel?((i=new MessageChannel).port1.onmessage=function(e){p(e.data)},r=function(e){i.port2.postMessage(e)}):l&&"onreadystatechange"in l.createElement("script")?(o=l.documentElement,r=function(e){var t=l.createElement("script");t.onreadystatechange=function(){p(e),t.onreadystatechange=null,o.removeChild(t),t=null},o.appendChild(t)}):r=function(e){setTimeout(p,0,e)},h.setImmediate=function(e){"function"!=typeof e&&(e=new Function(""+e));for(var t=new Array(arguments.length-1),n=0;n<t.length;n++)t[n]=arguments[n+1];var o={callback:e,args:t};return u[c]=o,r(c),c++},h.clearImmediate=f}function f(e){delete u[e]}function p(e){if(d)setTimeout(p,0,e);else{var t=u[e];if(t){d=!0;try{!function(e){var t=e.callback,r=e.args;switch(r.length){case 0:t();break;case 1:t(r[0]);break;case 2:t(r[0],r[1]);break;case 3:t(r[0],r[1],r[2]);break;default:t.apply(void 0,r)}}(t)}finally{f(e),d=!1}}}}}("undefined"==typeof self?void 0===r.g?this:r.g:self)},9937:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0});const n=r(8381);t.default={encodeEventSignature:n.encodeEventSignature,encodeFunctionCall:n.encodeFunctionCall,encodeFunctionSignature:n.encodeFunctionSignature,encodeParameter:n.encodeParameter,encodeParameters:n.encodeParameters,decodeParameter:n.decodeParameter,decodeParameters:n.decodeParameters,decodeLog:n.decodeLog}},1186:function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.initAccountsForContext=void 0;const o=r(9970),i=r(9634),s=r(6637),a=r(9247);t.initAccountsForContext=e=>{const t=(t,r)=>n(void 0,void 0,void 0,(function*(){const n=yield(0,s.prepareTransactionForSigning)(t,e),c=(0,i.format)({format:"bytes"},r,o.ETH_DATA_FORMAT);return(0,a.signTransaction)(n,c)})),r=e=>{const r=(0,a.privateKeyToAccount)(e);return Object.assign(Object.assign({},r),{signTransaction:e=>n(void 0,void 0,void 0,(function*(){return t(e,r.privateKey)}))})},c=(e,r,o)=>n(void 0,void 0,void 0,(function*(){var i;const s=yield(0,a.decrypt)(e,r,null===(i=null==o?void 0:o.nonStrict)||void 0===i||i);return Object.assign(Object.assign({},s),{signTransaction:e=>n(void 0,void 0,void 0,(function*(){return t(e,s.privateKey)}))})})),u=()=>{const e=(0,a.create)();return Object.assign(Object.assign({},e),{signTransaction:r=>n(void 0,void 0,void 0,(function*(){return t(r,e.privateKey)}))})},d=new a.Wallet({create:u,privateKeyToAccount:r,decrypt:c});return{signTransaction:t,create:u,privateKeyToAccount:r,decrypt:c,recoverTransaction:a.recoverTransaction,hashMessage:a.hashMessage,sign:a.sign,recover:a.recover,encrypt:a.encrypt,wallet:d,privateKeyToAddress:a.privateKeyToAddress,parseAndValidatePrivateKey:a.parseAndValidatePrivateKey,privateKeyToPublicKey:a.privateKeyToPublicKey}}},9913:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.Web3PkgInfo=void 0,t.Web3PkgInfo={version:"4.10.0"}},9375:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r);var o=Object.getOwnPropertyDescriptor(t,r);o&&!("get"in o?!t.__esModule:o.writable||o.configurable)||(o={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,o)}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),o=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),i=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var r in e)"default"!==r&&Object.prototype.hasOwnProperty.call(e,r)&&n(t,e,r);return o(t,e),t},s=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.Web3=void 0;const a=r(6527),c=r(6637),u=s(r(3211)),d=r(1698),l=r(9910),h=r(9757),f=r(9820),p=i(r(9634)),m=r(9634),g=r(294),y=r(5071),v=s(r(9937)),b=r(1186),E=r(9913),_=r(7632);class A extends a.Web3Context{constructor(e=g.mainnet){var t;((0,m.isNullish)(e)||"string"==typeof e&&""===e.trim()||"string"!=typeof e&&!(0,a.isSupportedProvider)(e)&&!e.provider)&&console.warn("NOTE: web3.js is running without provider. You need to pass a provider in order to interact with the network!");let r={};"string"==typeof e||(0,a.isSupportedProvider)(e)?r.provider=e:r=e||{},r.registeredSubscriptions=Object.assign(Object.assign({},c.registeredSubscriptions),null!==(t=r.registeredSubscriptions)&&void 0!==t?t:{}),super(r);const n=(0,b.initAccountsForContext)(this);this._wallet=n.wallet,this._accountProvider=n,this.utils=p;const o=this;class i extends u.default{constructor(e,t,r,n,i){if((0,m.isContractInitOptions)(t)&&(0,m.isContractInitOptions)(r))throw new y.InvalidMethodParamsError("Should not provide options at both 2nd and 3rd parameters");let s,c,u,d={};if(!(0,m.isNullish)(t)&&"object"!=typeof t&&"string"!=typeof t)throw new y.InvalidMethodParamsError;"string"==typeof t&&(s=t),d=(0,m.isContractInitOptions)(t)?t:(0,m.isContractInitOptions)(r)?r:{},c=t instanceof a.Web3Context?t:r instanceof a.Web3Context?r:n instanceof a.Web3Context?n:o.getContextObject(),i?u=i:(0,m.isDataFormat)(r)?u=r:(0,m.isDataFormat)(n)&&(u=n),super(e,s,d,c,u),super.subscribeToContextEvents(o)}}const s=o.use(c.Web3Eth);this.eth=Object.assign(s,{ens:o.use(d.ENS,d.registryAddresses.main),Iban:l.Iban,net:o.use(f.Net),personal:o.use(h.Personal),Contract:i,abi:v.default,accounts:n})}}t.Web3=A,A.version=E.Web3PkgInfo.version,A.utils=p,A.requestEIP6963Providers=_.requestEIP6963Providers,A.onNewProviderDiscovered=_.onNewProviderDiscovered,A.modules={Web3Eth:c.Web3Eth,Iban:l.Iban,Net:f.Net,ENS:d.ENS,Personal:h.Personal},t.default=A},7632:function(e,t){"use strict";var r,n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.onNewProviderDiscovered=t.requestEIP6963Providers=t.web3ProvidersMapUpdated=t.eip6963ProvidersMap=t.Eip6963EventName=void 0,function(e){e.eip6963announceProvider="eip6963:announceProvider",e.eip6963requestProvider="eip6963:requestProvider"}(r=t.Eip6963EventName||(t.Eip6963EventName={})),t.eip6963ProvidersMap=new Map,t.web3ProvidersMapUpdated="web3:providersMapUpdated",t.requestEIP6963Providers=()=>n(void 0,void 0,void 0,(function*(){return new Promise(((e,n)=>{"undefined"==typeof window&&n(new Error("window object not available, EIP-6963 is intended to be used within a browser")),window.addEventListener(r.eip6963announceProvider,(r=>{t.eip6963ProvidersMap.set(r.detail.info.uuid,r.detail);const n=new CustomEvent(t.web3ProvidersMapUpdated,{detail:t.eip6963ProvidersMap});window.dispatchEvent(n),e(t.eip6963ProvidersMap)})),window.dispatchEvent(new Event(r.eip6963requestProvider))}))})),t.onNewProviderDiscovered=e=>{if("undefined"==typeof window)throw new Error("window object not available, EIP-6963 is intended to be used within a browser");window.addEventListener(t.web3ProvidersMapUpdated,e)}},5809:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.ZodError=t.quotelessJson=t.ZodIssueCode=void 0;const n=r(3133);t.ZodIssueCode=n.util.arrayToEnum(["invalid_type","invalid_literal","custom","invalid_union","invalid_union_discriminator","invalid_enum_value","unrecognized_keys","invalid_arguments","invalid_return_type","invalid_date","invalid_string","too_small","too_big","invalid_intersection_types","not_multiple_of","not_finite"]),t.quotelessJson=e=>JSON.stringify(e,null,2).replace(/"([^"]+)":/g,"$1:");class o extends Error{constructor(e){super(),this.issues=[],this.addIssue=e=>{this.issues=[...this.issues,e]},this.addIssues=(e=[])=>{this.issues=[...this.issues,...e]};const t=new.target.prototype;Object.setPrototypeOf?Object.setPrototypeOf(this,t):this.__proto__=t,this.name="ZodError",this.issues=e}get errors(){return this.issues}format(e){const t=e||function(e){return e.message},r={_errors:[]},n=e=>{for(const o of e.issues)if("invalid_union"===o.code)o.unionErrors.map(n);else if("invalid_return_type"===o.code)n(o.returnTypeError);else if("invalid_arguments"===o.code)n(o.argumentsError);else if(0===o.path.length)r._errors.push(t(o));else{let e=r,n=0;for(;n<o.path.length;){const r=o.path[n];n===o.path.length-1?(e[r]=e[r]||{_errors:[]},e[r]._errors.push(t(o))):e[r]=e[r]||{_errors:[]},e=e[r],n++}}};return n(this),r}toString(){return this.message}get message(){return JSON.stringify(this.issues,n.util.jsonStringifyReplacer,2)}get isEmpty(){return 0===this.issues.length}flatten(e=(e=>e.message)){const t={},r=[];for(const n of this.issues)n.path.length>0?(t[n.path[0]]=t[n.path[0]]||[],t[n.path[0]].push(e(n))):r.push(e(n));return{formErrors:r,fieldErrors:t}}get formErrors(){return this.flatten()}}t.ZodError=o,o.create=e=>new o(e)},1909:function(e,t,r){"use strict";var n=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.getErrorMap=t.setErrorMap=t.defaultErrorMap=void 0;const o=n(r(6013));t.defaultErrorMap=o.default;let i=o.default;t.setErrorMap=function(e){i=e},t.getErrorMap=function(){return i}},4474:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r),Object.defineProperty(e,n,{enumerable:!0,get:function(){return t[r]}})}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),o=this&&this.__exportStar||function(e,t){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(t,r)||n(t,e,r)};Object.defineProperty(t,"__esModule",{value:!0}),o(r(1909),t),o(r(4735),t),o(r(1832),t),o(r(3133),t),o(r(1176),t),o(r(5809),t)},3682:(e,t)=>{"use strict";var r;Object.defineProperty(t,"__esModule",{value:!0}),t.errorUtil=void 0,(r=t.errorUtil||(t.errorUtil={})).errToObj=e=>"string"==typeof e?{message:e}:e||{},r.toString=e=>"string"==typeof e?e:null==e?void 0:e.message},4735:function(e,t,r){"use strict";var n=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.isAsync=t.isValid=t.isDirty=t.isAborted=t.OK=t.DIRTY=t.INVALID=t.ParseStatus=t.addIssueToContext=t.EMPTY_PATH=t.makeIssue=void 0;const o=r(1909),i=n(r(6013));t.makeIssue=e=>{const{data:t,path:r,errorMaps:n,issueData:o}=e,i=[...r,...o.path||[]],s={...o,path:i};let a="";const c=n.filter((e=>!!e)).slice().reverse();for(const e of c)a=e(s,{data:t,defaultError:a}).message;return{...o,path:i,message:o.message||a}},t.EMPTY_PATH=[],t.addIssueToContext=function(e,r){const n=(0,t.makeIssue)({issueData:r,data:e.data,path:e.path,errorMaps:[e.common.contextualErrorMap,e.schemaErrorMap,(0,o.getErrorMap)(),i.default].filter((e=>!!e))});e.common.issues.push(n)};class s{constructor(){this.value="valid"}dirty(){"valid"===this.value&&(this.value="dirty")}abort(){"aborted"!==this.value&&(this.value="aborted")}static mergeArray(e,r){const n=[];for(const o of r){if("aborted"===o.status)return t.INVALID;"dirty"===o.status&&e.dirty(),n.push(o.value)}return{status:e.value,value:n}}static async mergeObjectAsync(e,t){const r=[];for(const e of t)r.push({key:await e.key,value:await e.value});return s.mergeObjectSync(e,r)}static mergeObjectSync(e,r){const n={};for(const o of r){const{key:r,value:i}=o;if("aborted"===r.status)return t.INVALID;if("aborted"===i.status)return t.INVALID;"dirty"===r.status&&e.dirty(),"dirty"===i.status&&e.dirty(),"__proto__"===r.value||void 0===i.value&&!o.alwaysSet||(n[r.value]=i.value)}return{status:e.value,value:n}}}t.ParseStatus=s,t.INVALID=Object.freeze({status:"aborted"}),t.DIRTY=e=>({status:"dirty",value:e}),t.OK=e=>({status:"valid",value:e}),t.isAborted=e=>"aborted"===e.status,t.isDirty=e=>"dirty"===e.status,t.isValid=e=>"valid"===e.status,t.isAsync=e=>"undefined"!=typeof Promise&&e instanceof Promise},1832:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0})},3133:(e,t)=>{"use strict";var r;Object.defineProperty(t,"__esModule",{value:!0}),t.getParsedType=t.ZodParsedType=t.objectUtil=t.util=void 0,function(e){e.assertEqual=e=>e,e.assertIs=function(e){},e.assertNever=function(e){throw new Error},e.arrayToEnum=e=>{const t={};for(const r of e)t[r]=r;return t},e.getValidEnumValues=t=>{const r=e.objectKeys(t).filter((e=>"number"!=typeof t[t[e]])),n={};for(const e of r)n[e]=t[e];return e.objectValues(n)},e.objectValues=t=>e.objectKeys(t).map((function(e){return t[e]})),e.objectKeys="function"==typeof Object.keys?e=>Object.keys(e):e=>{const t=[];for(const r in e)Object.prototype.hasOwnProperty.call(e,r)&&t.push(r);return t},e.find=(e,t)=>{for(const r of e)if(t(r))return r},e.isInteger="function"==typeof Number.isInteger?e=>Number.isInteger(e):e=>"number"==typeof e&&isFinite(e)&&Math.floor(e)===e,e.joinValues=function(e,t=" | "){return e.map((e=>"string"==typeof e?`'${e}'`:e)).join(t)},e.jsonStringifyReplacer=(e,t)=>"bigint"==typeof t?t.toString():t}(r=t.util||(t.util={})),(t.objectUtil||(t.objectUtil={})).mergeShapes=(e,t)=>({...e,...t}),t.ZodParsedType=r.arrayToEnum(["string","nan","number","integer","float","boolean","date","bigint","symbol","function","undefined","null","array","object","unknown","promise","void","never","map","set"]),t.getParsedType=e=>{switch(typeof e){case"undefined":return t.ZodParsedType.undefined;case"string":return t.ZodParsedType.string;case"number":return isNaN(e)?t.ZodParsedType.nan:t.ZodParsedType.number;case"boolean":return t.ZodParsedType.boolean;case"function":return t.ZodParsedType.function;case"bigint":return t.ZodParsedType.bigint;case"symbol":return t.ZodParsedType.symbol;case"object":return Array.isArray(e)?t.ZodParsedType.array:null===e?t.ZodParsedType.null:e.then&&"function"==typeof e.then&&e.catch&&"function"==typeof e.catch?t.ZodParsedType.promise:"undefined"!=typeof Map&&e instanceof Map?t.ZodParsedType.map:"undefined"!=typeof Set&&e instanceof Set?t.ZodParsedType.set:"undefined"!=typeof Date&&e instanceof Date?t.ZodParsedType.date:t.ZodParsedType.object;default:return t.ZodParsedType.unknown}}},6750:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r),Object.defineProperty(e,n,{enumerable:!0,get:function(){return t[r]}})}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),o=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),i=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var r in e)"default"!==r&&Object.prototype.hasOwnProperty.call(e,r)&&n(t,e,r);return o(t,e),t},s=this&&this.__exportStar||function(e,t){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(t,r)||n(t,e,r)};Object.defineProperty(t,"__esModule",{value:!0}),t.z=void 0;const a=i(r(4474));t.z=a,s(r(4474),t),t.default=a},6013:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0});const n=r(3133),o=r(5809);t.default=(e,t)=>{let r;switch(e.code){case o.ZodIssueCode.invalid_type:r=e.received===n.ZodParsedType.undefined?"Required":`Expected ${e.expected}, received ${e.received}`;break;case o.ZodIssueCode.invalid_literal:r=`Invalid literal value, expected ${JSON.stringify(e.expected,n.util.jsonStringifyReplacer)}`;break;case o.ZodIssueCode.unrecognized_keys:r=`Unrecognized key(s) in object: ${n.util.joinValues(e.keys,", ")}`;break;case o.ZodIssueCode.invalid_union:r="Invalid input";break;case o.ZodIssueCode.invalid_union_discriminator:r=`Invalid discriminator value. Expected ${n.util.joinValues(e.options)}`;break;case o.ZodIssueCode.invalid_enum_value:r=`Invalid enum value. Expected ${n.util.joinValues(e.options)}, received '${e.received}'`;break;case o.ZodIssueCode.invalid_arguments:r="Invalid function arguments";break;case o.ZodIssueCode.invalid_return_type:r="Invalid function return type";break;case o.ZodIssueCode.invalid_date:r="Invalid date";break;case o.ZodIssueCode.invalid_string:"object"==typeof e.validation?"includes"in e.validation?(r=`Invalid input: must include "${e.validation.includes}"`,"number"==typeof e.validation.position&&(r=`${r} at one or more positions greater than or equal to ${e.validation.position}`)):"startsWith"in e.validation?r=`Invalid input: must start with "${e.validation.startsWith}"`:"endsWith"in e.validation?r=`Invalid input: must end with "${e.validation.endsWith}"`:n.util.assertNever(e.validation):r="regex"!==e.validation?`Invalid ${e.validation}`:"Invalid";break;case o.ZodIssueCode.too_small:r="array"===e.type?`Array must contain ${e.exact?"exactly":e.inclusive?"at least":"more than"} ${e.minimum} element(s)`:"string"===e.type?`String must contain ${e.exact?"exactly":e.inclusive?"at least":"over"} ${e.minimum} character(s)`:"number"===e.type?`Number must be ${e.exact?"exactly equal to ":e.inclusive?"greater than or equal to ":"greater than "}${e.minimum}`:"date"===e.type?`Date must be ${e.exact?"exactly equal to ":e.inclusive?"greater than or equal to ":"greater than "}${new Date(Number(e.minimum))}`:"Invalid input";break;case o.ZodIssueCode.too_big:r="array"===e.type?`Array must contain ${e.exact?"exactly":e.inclusive?"at most":"less than"} ${e.maximum} element(s)`:"string"===e.type?`String must contain ${e.exact?"exactly":e.inclusive?"at most":"under"} ${e.maximum} character(s)`:"number"===e.type?`Number must be ${e.exact?"exactly":e.inclusive?"less than or equal to":"less than"} ${e.maximum}`:"bigint"===e.type?`BigInt must be ${e.exact?"exactly":e.inclusive?"less than or equal to":"less than"} ${e.maximum}`:"date"===e.type?`Date must be ${e.exact?"exactly":e.inclusive?"smaller than or equal to":"smaller than"} ${new Date(Number(e.maximum))}`:"Invalid input";break;case o.ZodIssueCode.custom:r="Invalid input";break;case o.ZodIssueCode.invalid_intersection_types:r="Intersection results could not be merged";break;case o.ZodIssueCode.not_multiple_of:r=`Number must be a multiple of ${e.multipleOf}`;break;case o.ZodIssueCode.not_finite:r="Number must be finite";break;default:r=t.defaultError,n.util.assertNever(e)}return{message:r}}},1176:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.date=t.boolean=t.bigint=t.array=t.any=t.coerce=t.ZodFirstPartyTypeKind=t.late=t.ZodSchema=t.Schema=t.custom=t.ZodReadonly=t.ZodPipeline=t.ZodBranded=t.BRAND=t.ZodNaN=t.ZodCatch=t.ZodDefault=t.ZodNullable=t.ZodOptional=t.ZodTransformer=t.ZodEffects=t.ZodPromise=t.ZodNativeEnum=t.ZodEnum=t.ZodLiteral=t.ZodLazy=t.ZodFunction=t.ZodSet=t.ZodMap=t.ZodRecord=t.ZodTuple=t.ZodIntersection=t.ZodDiscriminatedUnion=t.ZodUnion=t.ZodObject=t.ZodArray=t.ZodVoid=t.ZodNever=t.ZodUnknown=t.ZodAny=t.ZodNull=t.ZodUndefined=t.ZodSymbol=t.ZodDate=t.ZodBoolean=t.ZodBigInt=t.ZodNumber=t.ZodString=t.ZodType=void 0,t.NEVER=t.void=t.unknown=t.union=t.undefined=t.tuple=t.transformer=t.symbol=t.string=t.strictObject=t.set=t.record=t.promise=t.preprocess=t.pipeline=t.ostring=t.optional=t.onumber=t.oboolean=t.object=t.number=t.nullable=t.null=t.never=t.nativeEnum=t.nan=t.map=t.literal=t.lazy=t.intersection=t.instanceof=t.function=t.enum=t.effect=t.discriminatedUnion=void 0;const n=r(1909),o=r(3682),i=r(4735),s=r(3133),a=r(5809);class c{constructor(e,t,r,n){this._cachedPath=[],this.parent=e,this.data=t,this._path=r,this._key=n}get path(){return this._cachedPath.length||(this._key instanceof Array?this._cachedPath.push(...this._path,...this._key):this._cachedPath.push(...this._path,this._key)),this._cachedPath}}const u=(e,t)=>{if((0,i.isValid)(t))return{success:!0,data:t.value};if(!e.common.issues.length)throw new Error("Validation failed but no issues detected.");return{success:!1,get error(){if(this._error)return this._error;const t=new a.ZodError(e.common.issues);return this._error=t,this._error}}};function d(e){if(!e)return{};const{errorMap:t,invalid_type_error:r,required_error:n,description:o}=e;if(t&&(r||n))throw new Error('Can\'t use "invalid_type_error" or "required_error" in conjunction with custom error map.');return t?{errorMap:t,description:o}:{errorMap:(e,t)=>"invalid_type"!==e.code?{message:t.defaultError}:void 0===t.data?{message:null!=n?n:t.defaultError}:{message:null!=r?r:t.defaultError},description:o}}class l{constructor(e){this.spa=this.safeParseAsync,this._def=e,this.parse=this.parse.bind(this),this.safeParse=this.safeParse.bind(this),this.parseAsync=this.parseAsync.bind(this),this.safeParseAsync=this.safeParseAsync.bind(this),this.spa=this.spa.bind(this),this.refine=this.refine.bind(this),this.refinement=this.refinement.bind(this),this.superRefine=this.superRefine.bind(this),this.optional=this.optional.bind(this),this.nullable=this.nullable.bind(this),this.nullish=this.nullish.bind(this),this.array=this.array.bind(this),this.promise=this.promise.bind(this),this.or=this.or.bind(this),this.and=this.and.bind(this),this.transform=this.transform.bind(this),this.brand=this.brand.bind(this),this.default=this.default.bind(this),this.catch=this.catch.bind(this),this.describe=this.describe.bind(this),this.pipe=this.pipe.bind(this),this.readonly=this.readonly.bind(this),this.isNullable=this.isNullable.bind(this),this.isOptional=this.isOptional.bind(this)}get description(){return this._def.description}_getType(e){return(0,s.getParsedType)(e.data)}_getOrReturnCtx(e,t){return t||{common:e.parent.common,data:e.data,parsedType:(0,s.getParsedType)(e.data),schemaErrorMap:this._def.errorMap,path:e.path,parent:e.parent}}_processInputParams(e){return{status:new i.ParseStatus,ctx:{common:e.parent.common,data:e.data,parsedType:(0,s.getParsedType)(e.data),schemaErrorMap:this._def.errorMap,path:e.path,parent:e.parent}}}_parseSync(e){const t=this._parse(e);if((0,i.isAsync)(t))throw new Error("Synchronous parse encountered promise.");return t}_parseAsync(e){const t=this._parse(e);return Promise.resolve(t)}parse(e,t){const r=this.safeParse(e,t);if(r.success)return r.data;throw r.error}safeParse(e,t){var r;const n={common:{issues:[],async:null!==(r=null==t?void 0:t.async)&&void 0!==r&&r,contextualErrorMap:null==t?void 0:t.errorMap},path:(null==t?void 0:t.path)||[],schemaErrorMap:this._def.errorMap,parent:null,data:e,parsedType:(0,s.getParsedType)(e)},o=this._parseSync({data:e,path:n.path,parent:n});return u(n,o)}async parseAsync(e,t){const r=await this.safeParseAsync(e,t);if(r.success)return r.data;throw r.error}async safeParseAsync(e,t){const r={common:{issues:[],contextualErrorMap:null==t?void 0:t.errorMap,async:!0},path:(null==t?void 0:t.path)||[],schemaErrorMap:this._def.errorMap,parent:null,data:e,parsedType:(0,s.getParsedType)(e)},n=this._parse({data:e,path:r.path,parent:r}),o=await((0,i.isAsync)(n)?n:Promise.resolve(n));return u(r,o)}refine(e,t){const r=e=>"string"==typeof t||void 0===t?{message:t}:"function"==typeof t?t(e):t;return this._refinement(((t,n)=>{const o=e(t),i=()=>n.addIssue({code:a.ZodIssueCode.custom,...r(t)});return"undefined"!=typeof Promise&&o instanceof Promise?o.then((e=>!!e||(i(),!1))):!!o||(i(),!1)}))}refinement(e,t){return this._refinement(((r,n)=>!!e(r)||(n.addIssue("function"==typeof t?t(r,n):t),!1)))}_refinement(e){return new Y({schema:this,typeName:ae.ZodEffects,effect:{type:"refinement",refinement:e}})}superRefine(e){return this._refinement(e)}optional(){return $.create(this,this._def)}nullable(){return ee.create(this,this._def)}nullish(){return this.nullable().optional()}array(){return k.create(this,this._def)}promise(){return J.create(this,this._def)}or(e){return L.create([this,e],this._def)}and(e){return j.create(this,e,this._def)}transform(e){return new Y({...d(this._def),schema:this,typeName:ae.ZodEffects,effect:{type:"transform",transform:e}})}default(e){const t="function"==typeof e?e:()=>e;return new te({...d(this._def),innerType:this,defaultValue:t,typeName:ae.ZodDefault})}brand(){return new oe({typeName:ae.ZodBranded,type:this,...d(this._def)})}catch(e){const t="function"==typeof e?e:()=>e;return new re({...d(this._def),innerType:this,catchValue:t,typeName:ae.ZodCatch})}describe(e){return new(0,this.constructor)({...this._def,description:e})}pipe(e){return ie.create(this,e)}readonly(){return se.create(this)}isOptional(){return this.safeParse(void 0).success}isNullable(){return this.safeParse(null).success}}t.ZodType=l,t.Schema=l,t.ZodSchema=l;const h=/^c[^\s-]{8,}$/i,f=/^[a-z][a-z0-9]*$/,p=/[0-9A-HJKMNP-TV-Z]{26}/,m=/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i,g=/^(?!\.)(?!.*\.\.)([A-Z0-9_+-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i,y=/^(\p{Extended_Pictographic}|\p{Emoji_Component})+$/u,v=/^(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))$/,b=/^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/;class E extends l{constructor(){super(...arguments),this._regex=(e,t,r)=>this.refinement((t=>e.test(t)),{validation:t,code:a.ZodIssueCode.invalid_string,...o.errorUtil.errToObj(r)}),this.nonempty=e=>this.min(1,o.errorUtil.errToObj(e)),this.trim=()=>new E({...this._def,checks:[...this._def.checks,{kind:"trim"}]}),this.toLowerCase=()=>new E({...this._def,checks:[...this._def.checks,{kind:"toLowerCase"}]}),this.toUpperCase=()=>new E({...this._def,checks:[...this._def.checks,{kind:"toUpperCase"}]})}_parse(e){if(this._def.coerce&&(e.data=String(e.data)),this._getType(e)!==s.ZodParsedType.string){const t=this._getOrReturnCtx(e);return(0,i.addIssueToContext)(t,{code:a.ZodIssueCode.invalid_type,expected:s.ZodParsedType.string,received:t.parsedType}),i.INVALID}const t=new i.ParseStatus;let r;for(const u of this._def.checks)if("min"===u.kind)e.data.length<u.value&&(r=this._getOrReturnCtx(e,r),(0,i.addIssueToContext)(r,{code:a.ZodIssueCode.too_small,minimum:u.value,type:"string",inclusive:!0,exact:!1,message:u.message}),t.dirty());else if("max"===u.kind)e.data.length>u.value&&(r=this._getOrReturnCtx(e,r),(0,i.addIssueToContext)(r,{code:a.ZodIssueCode.too_big,maximum:u.value,type:"string",inclusive:!0,exact:!1,message:u.message}),t.dirty());else if("length"===u.kind){const n=e.data.length>u.value,o=e.data.length<u.value;(n||o)&&(r=this._getOrReturnCtx(e,r),n?(0,i.addIssueToContext)(r,{code:a.ZodIssueCode.too_big,maximum:u.value,type:"string",inclusive:!0,exact:!0,message:u.message}):o&&(0,i.addIssueToContext)(r,{code:a.ZodIssueCode.too_small,minimum:u.value,type:"string",inclusive:!0,exact:!0,message:u.message}),t.dirty())}else if("email"===u.kind)g.test(e.data)||(r=this._getOrReturnCtx(e,r),(0,i.addIssueToContext)(r,{validation:"email",code:a.ZodIssueCode.invalid_string,message:u.message}),t.dirty());else if("emoji"===u.kind)y.test(e.data)||(r=this._getOrReturnCtx(e,r),(0,i.addIssueToContext)(r,{validation:"emoji",code:a.ZodIssueCode.invalid_string,message:u.message}),t.dirty());else if("uuid"===u.kind)m.test(e.data)||(r=this._getOrReturnCtx(e,r),(0,i.addIssueToContext)(r,{validation:"uuid",code:a.ZodIssueCode.invalid_string,message:u.message}),t.dirty());else if("cuid"===u.kind)h.test(e.data)||(r=this._getOrReturnCtx(e,r),(0,i.addIssueToContext)(r,{validation:"cuid",code:a.ZodIssueCode.invalid_string,message:u.message}),t.dirty());else if("cuid2"===u.kind)f.test(e.data)||(r=this._getOrReturnCtx(e,r),(0,i.addIssueToContext)(r,{validation:"cuid2",code:a.ZodIssueCode.invalid_string,message:u.message}),t.dirty());else if("ulid"===u.kind)p.test(e.data)||(r=this._getOrReturnCtx(e,r),(0,i.addIssueToContext)(r,{validation:"ulid",code:a.ZodIssueCode.invalid_string,message:u.message}),t.dirty());else if("url"===u.kind)try{new URL(e.data)}catch(n){r=this._getOrReturnCtx(e,r),(0,i.addIssueToContext)(r,{validation:"url",code:a.ZodIssueCode.invalid_string,message:u.message}),t.dirty()}else"regex"===u.kind?(u.regex.lastIndex=0,u.regex.test(e.data)||(r=this._getOrReturnCtx(e,r),(0,i.addIssueToContext)(r,{validation:"regex",code:a.ZodIssueCode.invalid_string,message:u.message}),t.dirty())):"trim"===u.kind?e.data=e.data.trim():"includes"===u.kind?e.data.includes(u.value,u.position)||(r=this._getOrReturnCtx(e,r),(0,i.addIssueToContext)(r,{code:a.ZodIssueCode.invalid_string,validation:{includes:u.value,position:u.position},message:u.message}),t.dirty()):"toLowerCase"===u.kind?e.data=e.data.toLowerCase():"toUpperCase"===u.kind?e.data=e.data.toUpperCase():"startsWith"===u.kind?e.data.startsWith(u.value)||(r=this._getOrReturnCtx(e,r),(0,i.addIssueToContext)(r,{code:a.ZodIssueCode.invalid_string,validation:{startsWith:u.value},message:u.message}),t.dirty()):"endsWith"===u.kind?e.data.endsWith(u.value)||(r=this._getOrReturnCtx(e,r),(0,i.addIssueToContext)(r,{code:a.ZodIssueCode.invalid_string,validation:{endsWith:u.value},message:u.message}),t.dirty()):"datetime"===u.kind?((c=u).precision?c.offset?new RegExp(`^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{${c.precision}}(([+-]\\d{2}(:?\\d{2})?)|Z)$`):new RegExp(`^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{${c.precision}}Z$`):0===c.precision?c.offset?new RegExp("^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(([+-]\\d{2}(:?\\d{2})?)|Z)$"):new RegExp("^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$"):c.offset?new RegExp("^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(([+-]\\d{2}(:?\\d{2})?)|Z)$"):new RegExp("^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?Z$")).test(e.data)||(r=this._getOrReturnCtx(e,r),(0,i.addIssueToContext)(r,{code:a.ZodIssueCode.invalid_string,validation:"datetime",message:u.message}),t.dirty()):"ip"===u.kind?(n=e.data,("v4"!==(o=u.version)&&o||!v.test(n))&&("v6"!==o&&o||!b.test(n))&&(r=this._getOrReturnCtx(e,r),(0,i.addIssueToContext)(r,{validation:"ip",code:a.ZodIssueCode.invalid_string,message:u.message}),t.dirty())):s.util.assertNever(u);var n,o,c;return{status:t.value,value:e.data}}_addCheck(e){return new E({...this._def,checks:[...this._def.checks,e]})}email(e){return this._addCheck({kind:"email",...o.errorUtil.errToObj(e)})}url(e){return this._addCheck({kind:"url",...o.errorUtil.errToObj(e)})}emoji(e){return this._addCheck({kind:"emoji",...o.errorUtil.errToObj(e)})}uuid(e){return this._addCheck({kind:"uuid",...o.errorUtil.errToObj(e)})}cuid(e){return this._addCheck({kind:"cuid",...o.errorUtil.errToObj(e)})}cuid2(e){return this._addCheck({kind:"cuid2",...o.errorUtil.errToObj(e)})}ulid(e){return this._addCheck({kind:"ulid",...o.errorUtil.errToObj(e)})}ip(e){return this._addCheck({kind:"ip",...o.errorUtil.errToObj(e)})}datetime(e){var t;return"string"==typeof e?this._addCheck({kind:"datetime",precision:null,offset:!1,message:e}):this._addCheck({kind:"datetime",precision:void 0===(null==e?void 0:e.precision)?null:null==e?void 0:e.precision,offset:null!==(t=null==e?void 0:e.offset)&&void 0!==t&&t,...o.errorUtil.errToObj(null==e?void 0:e.message)})}regex(e,t){return this._addCheck({kind:"regex",regex:e,...o.errorUtil.errToObj(t)})}includes(e,t){return this._addCheck({kind:"includes",value:e,position:null==t?void 0:t.position,...o.errorUtil.errToObj(null==t?void 0:t.message)})}startsWith(e,t){return this._addCheck({kind:"startsWith",value:e,...o.errorUtil.errToObj(t)})}endsWith(e,t){return this._addCheck({kind:"endsWith",value:e,...o.errorUtil.errToObj(t)})}min(e,t){return this._addCheck({kind:"min",value:e,...o.errorUtil.errToObj(t)})}max(e,t){return this._addCheck({kind:"max",value:e,...o.errorUtil.errToObj(t)})}length(e,t){return this._addCheck({kind:"length",value:e,...o.errorUtil.errToObj(t)})}get isDatetime(){return!!this._def.checks.find((e=>"datetime"===e.kind))}get isEmail(){return!!this._def.checks.find((e=>"email"===e.kind))}get isURL(){return!!this._def.checks.find((e=>"url"===e.kind))}get isEmoji(){return!!this._def.checks.find((e=>"emoji"===e.kind))}get isUUID(){return!!this._def.checks.find((e=>"uuid"===e.kind))}get isCUID(){return!!this._def.checks.find((e=>"cuid"===e.kind))}get isCUID2(){return!!this._def.checks.find((e=>"cuid2"===e.kind))}get isULID(){return!!this._def.checks.find((e=>"ulid"===e.kind))}get isIP(){return!!this._def.checks.find((e=>"ip"===e.kind))}get minLength(){let e=null;for(const t of this._def.checks)"min"===t.kind&&(null===e||t.value>e)&&(e=t.value);return e}get maxLength(){let e=null;for(const t of this._def.checks)"max"===t.kind&&(null===e||t.value<e)&&(e=t.value);return e}}function _(e,t){const r=(e.toString().split(".")[1]||"").length,n=(t.toString().split(".")[1]||"").length,o=r>n?r:n;return parseInt(e.toFixed(o).replace(".",""))%parseInt(t.toFixed(o).replace(".",""))/Math.pow(10,o)}t.ZodString=E,E.create=e=>{var t;return new E({checks:[],typeName:ae.ZodString,coerce:null!==(t=null==e?void 0:e.coerce)&&void 0!==t&&t,...d(e)})};class A extends l{constructor(){super(...arguments),this.min=this.gte,this.max=this.lte,this.step=this.multipleOf}_parse(e){if(this._def.coerce&&(e.data=Number(e.data)),this._getType(e)!==s.ZodParsedType.number){const t=this._getOrReturnCtx(e);return(0,i.addIssueToContext)(t,{code:a.ZodIssueCode.invalid_type,expected:s.ZodParsedType.number,received:t.parsedType}),i.INVALID}let t;const r=new i.ParseStatus;for(const n of this._def.checks)"int"===n.kind?s.util.isInteger(e.data)||(t=this._getOrReturnCtx(e,t),(0,i.addIssueToContext)(t,{code:a.ZodIssueCode.invalid_type,expected:"integer",received:"float",message:n.message}),r.dirty()):"min"===n.kind?(n.inclusive?e.data<n.value:e.data<=n.value)&&(t=this._getOrReturnCtx(e,t),(0,i.addIssueToContext)(t,{code:a.ZodIssueCode.too_small,minimum:n.value,type:"number",inclusive:n.inclusive,exact:!1,message:n.message}),r.dirty()):"max"===n.kind?(n.inclusive?e.data>n.value:e.data>=n.value)&&(t=this._getOrReturnCtx(e,t),(0,i.addIssueToContext)(t,{code:a.ZodIssueCode.too_big,maximum:n.value,type:"number",inclusive:n.inclusive,exact:!1,message:n.message}),r.dirty()):"multipleOf"===n.kind?0!==_(e.data,n.value)&&(t=this._getOrReturnCtx(e,t),(0,i.addIssueToContext)(t,{code:a.ZodIssueCode.not_multiple_of,multipleOf:n.value,message:n.message}),r.dirty()):"finite"===n.kind?Number.isFinite(e.data)||(t=this._getOrReturnCtx(e,t),(0,i.addIssueToContext)(t,{code:a.ZodIssueCode.not_finite,message:n.message}),r.dirty()):s.util.assertNever(n);return{status:r.value,value:e.data}}gte(e,t){return this.setLimit("min",e,!0,o.errorUtil.toString(t))}gt(e,t){return this.setLimit("min",e,!1,o.errorUtil.toString(t))}lte(e,t){return this.setLimit("max",e,!0,o.errorUtil.toString(t))}lt(e,t){return this.setLimit("max",e,!1,o.errorUtil.toString(t))}setLimit(e,t,r,n){return new A({...this._def,checks:[...this._def.checks,{kind:e,value:t,inclusive:r,message:o.errorUtil.toString(n)}]})}_addCheck(e){return new A({...this._def,checks:[...this._def.checks,e]})}int(e){return this._addCheck({kind:"int",message:o.errorUtil.toString(e)})}positive(e){return this._addCheck({kind:"min",value:0,inclusive:!1,message:o.errorUtil.toString(e)})}negative(e){return this._addCheck({kind:"max",value:0,inclusive:!1,message:o.errorUtil.toString(e)})}nonpositive(e){return this._addCheck({kind:"max",value:0,inclusive:!0,message:o.errorUtil.toString(e)})}nonnegative(e){return this._addCheck({kind:"min",value:0,inclusive:!0,message:o.errorUtil.toString(e)})}multipleOf(e,t){return this._addCheck({kind:"multipleOf",value:e,message:o.errorUtil.toString(t)})}finite(e){return this._addCheck({kind:"finite",message:o.errorUtil.toString(e)})}safe(e){return this._addCheck({kind:"min",inclusive:!0,value:Number.MIN_SAFE_INTEGER,message:o.errorUtil.toString(e)})._addCheck({kind:"max",inclusive:!0,value:Number.MAX_SAFE_INTEGER,message:o.errorUtil.toString(e)})}get minValue(){let e=null;for(const t of this._def.checks)"min"===t.kind&&(null===e||t.value>e)&&(e=t.value);return e}get maxValue(){let e=null;for(const t of this._def.checks)"max"===t.kind&&(null===e||t.value<e)&&(e=t.value);return e}get isInt(){return!!this._def.checks.find((e=>"int"===e.kind||"multipleOf"===e.kind&&s.util.isInteger(e.value)))}get isFinite(){let e=null,t=null;for(const r of this._def.checks){if("finite"===r.kind||"int"===r.kind||"multipleOf"===r.kind)return!0;"min"===r.kind?(null===t||r.value>t)&&(t=r.value):"max"===r.kind&&(null===e||r.value<e)&&(e=r.value)}return Number.isFinite(t)&&Number.isFinite(e)}}t.ZodNumber=A,A.create=e=>new A({checks:[],typeName:ae.ZodNumber,coerce:(null==e?void 0:e.coerce)||!1,...d(e)});class T extends l{constructor(){super(...arguments),this.min=this.gte,this.max=this.lte}_parse(e){if(this._def.coerce&&(e.data=BigInt(e.data)),this._getType(e)!==s.ZodParsedType.bigint){const t=this._getOrReturnCtx(e);return(0,i.addIssueToContext)(t,{code:a.ZodIssueCode.invalid_type,expected:s.ZodParsedType.bigint,received:t.parsedType}),i.INVALID}let t;const r=new i.ParseStatus;for(const n of this._def.checks)"min"===n.kind?(n.inclusive?e.data<n.value:e.data<=n.value)&&(t=this._getOrReturnCtx(e,t),(0,i.addIssueToContext)(t,{code:a.ZodIssueCode.too_small,type:"bigint",minimum:n.value,inclusive:n.inclusive,message:n.message}),r.dirty()):"max"===n.kind?(n.inclusive?e.data>n.value:e.data>=n.value)&&(t=this._getOrReturnCtx(e,t),(0,i.addIssueToContext)(t,{code:a.ZodIssueCode.too_big,type:"bigint",maximum:n.value,inclusive:n.inclusive,message:n.message}),r.dirty()):"multipleOf"===n.kind?e.data%n.value!==BigInt(0)&&(t=this._getOrReturnCtx(e,t),(0,i.addIssueToContext)(t,{code:a.ZodIssueCode.not_multiple_of,multipleOf:n.value,message:n.message}),r.dirty()):s.util.assertNever(n);return{status:r.value,value:e.data}}gte(e,t){return this.setLimit("min",e,!0,o.errorUtil.toString(t))}gt(e,t){return this.setLimit("min",e,!1,o.errorUtil.toString(t))}lte(e,t){return this.setLimit("max",e,!0,o.errorUtil.toString(t))}lt(e,t){return this.setLimit("max",e,!1,o.errorUtil.toString(t))}setLimit(e,t,r,n){return new T({...this._def,checks:[...this._def.checks,{kind:e,value:t,inclusive:r,message:o.errorUtil.toString(n)}]})}_addCheck(e){return new T({...this._def,checks:[...this._def.checks,e]})}positive(e){return this._addCheck({kind:"min",value:BigInt(0),inclusive:!1,message:o.errorUtil.toString(e)})}negative(e){return this._addCheck({kind:"max",value:BigInt(0),inclusive:!1,message:o.errorUtil.toString(e)})}nonpositive(e){return this._addCheck({kind:"max",value:BigInt(0),inclusive:!0,message:o.errorUtil.toString(e)})}nonnegative(e){return this._addCheck({kind:"min",value:BigInt(0),inclusive:!0,message:o.errorUtil.toString(e)})}multipleOf(e,t){return this._addCheck({kind:"multipleOf",value:e,message:o.errorUtil.toString(t)})}get minValue(){let e=null;for(const t of this._def.checks)"min"===t.kind&&(null===e||t.value>e)&&(e=t.value);return e}get maxValue(){let e=null;for(const t of this._def.checks)"max"===t.kind&&(null===e||t.value<e)&&(e=t.value);return e}}t.ZodBigInt=T,T.create=e=>{var t;return new T({checks:[],typeName:ae.ZodBigInt,coerce:null!==(t=null==e?void 0:e.coerce)&&void 0!==t&&t,...d(e)})};class w extends l{_parse(e){if(this._def.coerce&&(e.data=Boolean(e.data)),this._getType(e)!==s.ZodParsedType.boolean){const t=this._getOrReturnCtx(e);return(0,i.addIssueToContext)(t,{code:a.ZodIssueCode.invalid_type,expected:s.ZodParsedType.boolean,received:t.parsedType}),i.INVALID}return(0,i.OK)(e.data)}}t.ZodBoolean=w,w.create=e=>new w({typeName:ae.ZodBoolean,coerce:(null==e?void 0:e.coerce)||!1,...d(e)});class I extends l{_parse(e){if(this._def.coerce&&(e.data=new Date(e.data)),this._getType(e)!==s.ZodParsedType.date){const t=this._getOrReturnCtx(e);return(0,i.addIssueToContext)(t,{code:a.ZodIssueCode.invalid_type,expected:s.ZodParsedType.date,received:t.parsedType}),i.INVALID}if(isNaN(e.data.getTime())){const t=this._getOrReturnCtx(e);return(0,i.addIssueToContext)(t,{code:a.ZodIssueCode.invalid_date}),i.INVALID}const t=new i.ParseStatus;let r;for(const n of this._def.checks)"min"===n.kind?e.data.getTime()<n.value&&(r=this._getOrReturnCtx(e,r),(0,i.addIssueToContext)(r,{code:a.ZodIssueCode.too_small,message:n.message,inclusive:!0,exact:!1,minimum:n.value,type:"date"}),t.dirty()):"max"===n.kind?e.data.getTime()>n.value&&(r=this._getOrReturnCtx(e,r),(0,i.addIssueToContext)(r,{code:a.ZodIssueCode.too_big,message:n.message,inclusive:!0,exact:!1,maximum:n.value,type:"date"}),t.dirty()):s.util.assertNever(n);return{status:t.value,value:new Date(e.data.getTime())}}_addCheck(e){return new I({...this._def,checks:[...this._def.checks,e]})}min(e,t){return this._addCheck({kind:"min",value:e.getTime(),message:o.errorUtil.toString(t)})}max(e,t){return this._addCheck({kind:"max",value:e.getTime(),message:o.errorUtil.toString(t)})}get minDate(){let e=null;for(const t of this._def.checks)"min"===t.kind&&(null===e||t.value>e)&&(e=t.value);return null!=e?new Date(e):null}get maxDate(){let e=null;for(const t of this._def.checks)"max"===t.kind&&(null===e||t.value<e)&&(e=t.value);return null!=e?new Date(e):null}}t.ZodDate=I,I.create=e=>new I({checks:[],coerce:(null==e?void 0:e.coerce)||!1,typeName:ae.ZodDate,...d(e)});class R extends l{_parse(e){if(this._getType(e)!==s.ZodParsedType.symbol){const t=this._getOrReturnCtx(e);return(0,i.addIssueToContext)(t,{code:a.ZodIssueCode.invalid_type,expected:s.ZodParsedType.symbol,received:t.parsedType}),i.INVALID}return(0,i.OK)(e.data)}}t.ZodSymbol=R,R.create=e=>new R({typeName:ae.ZodSymbol,...d(e)});class P extends l{_parse(e){if(this._getType(e)!==s.ZodParsedType.undefined){const t=this._getOrReturnCtx(e);return(0,i.addIssueToContext)(t,{code:a.ZodIssueCode.invalid_type,expected:s.ZodParsedType.undefined,received:t.parsedType}),i.INVALID}return(0,i.OK)(e.data)}}t.ZodUndefined=P,P.create=e=>new P({typeName:ae.ZodUndefined,...d(e)});class x extends l{_parse(e){if(this._getType(e)!==s.ZodParsedType.null){const t=this._getOrReturnCtx(e);return(0,i.addIssueToContext)(t,{code:a.ZodIssueCode.invalid_type,expected:s.ZodParsedType.null,received:t.parsedType}),i.INVALID}return(0,i.OK)(e.data)}}t.ZodNull=x,x.create=e=>new x({typeName:ae.ZodNull,...d(e)});class O extends l{constructor(){super(...arguments),this._any=!0}_parse(e){return(0,i.OK)(e.data)}}t.ZodAny=O,O.create=e=>new O({typeName:ae.ZodAny,...d(e)});class S extends l{constructor(){super(...arguments),this._unknown=!0}_parse(e){return(0,i.OK)(e.data)}}t.ZodUnknown=S,S.create=e=>new S({typeName:ae.ZodUnknown,...d(e)});class C extends l{_parse(e){const t=this._getOrReturnCtx(e);return(0,i.addIssueToContext)(t,{code:a.ZodIssueCode.invalid_type,expected:s.ZodParsedType.never,received:t.parsedType}),i.INVALID}}t.ZodNever=C,C.create=e=>new C({typeName:ae.ZodNever,...d(e)});class B extends l{_parse(e){if(this._getType(e)!==s.ZodParsedType.undefined){const t=this._getOrReturnCtx(e);return(0,i.addIssueToContext)(t,{code:a.ZodIssueCode.invalid_type,expected:s.ZodParsedType.void,received:t.parsedType}),i.INVALID}return(0,i.OK)(e.data)}}t.ZodVoid=B,B.create=e=>new B({typeName:ae.ZodVoid,...d(e)});class k extends l{_parse(e){const{ctx:t,status:r}=this._processInputParams(e),n=this._def;if(t.parsedType!==s.ZodParsedType.array)return(0,i.addIssueToContext)(t,{code:a.ZodIssueCode.invalid_type,expected:s.ZodParsedType.array,received:t.parsedType}),i.INVALID;if(null!==n.exactLength){const e=t.data.length>n.exactLength.value,o=t.data.length<n.exactLength.value;(e||o)&&((0,i.addIssueToContext)(t,{code:e?a.ZodIssueCode.too_big:a.ZodIssueCode.too_small,minimum:o?n.exactLength.value:void 0,maximum:e?n.exactLength.value:void 0,type:"array",inclusive:!0,exact:!0,message:n.exactLength.message}),r.dirty())}if(null!==n.minLength&&t.data.length<n.minLength.value&&((0,i.addIssueToContext)(t,{code:a.ZodIssueCode.too_small,minimum:n.minLength.value,type:"array",inclusive:!0,exact:!1,message:n.minLength.message}),r.dirty()),null!==n.maxLength&&t.data.length>n.maxLength.value&&((0,i.addIssueToContext)(t,{code:a.ZodIssueCode.too_big,maximum:n.maxLength.value,type:"array",inclusive:!0,exact:!1,message:n.maxLength.message}),r.dirty()),t.common.async)return Promise.all([...t.data].map(((e,r)=>n.type._parseAsync(new c(t,e,t.path,r))))).then((e=>i.ParseStatus.mergeArray(r,e)));const o=[...t.data].map(((e,r)=>n.type._parseSync(new c(t,e,t.path,r))));return i.ParseStatus.mergeArray(r,o)}get element(){return this._def.type}min(e,t){return new k({...this._def,minLength:{value:e,message:o.errorUtil.toString(t)}})}max(e,t){return new k({...this._def,maxLength:{value:e,message:o.errorUtil.toString(t)}})}length(e,t){return new k({...this._def,exactLength:{value:e,message:o.errorUtil.toString(t)}})}nonempty(e){return this.min(1,e)}}function N(e){if(e instanceof M){const t={};for(const r in e.shape){const n=e.shape[r];t[r]=$.create(N(n))}return new M({...e._def,shape:()=>t})}return e instanceof k?new k({...e._def,type:N(e.element)}):e instanceof $?$.create(N(e.unwrap())):e instanceof ee?ee.create(N(e.unwrap())):e instanceof U?U.create(e.items.map((e=>N(e)))):e}t.ZodArray=k,k.create=(e,t)=>new k({type:e,minLength:null,maxLength:null,exactLength:null,typeName:ae.ZodArray,...d(t)});class M extends l{constructor(){super(...arguments),this._cached=null,this.nonstrict=this.passthrough,this.augment=this.extend}_getCached(){if(null!==this._cached)return this._cached;const e=this._def.shape(),t=s.util.objectKeys(e);return this._cached={shape:e,keys:t}}_parse(e){if(this._getType(e)!==s.ZodParsedType.object){const t=this._getOrReturnCtx(e);return(0,i.addIssueToContext)(t,{code:a.ZodIssueCode.invalid_type,expected:s.ZodParsedType.object,received:t.parsedType}),i.INVALID}const{status:t,ctx:r}=this._processInputParams(e),{shape:n,keys:o}=this._getCached(),u=[];if(!(this._def.catchall instanceof C&&"strip"===this._def.unknownKeys))for(const e in r.data)o.includes(e)||u.push(e);const d=[];for(const e of o){const t=n[e],o=r.data[e];d.push({key:{status:"valid",value:e},value:t._parse(new c(r,o,r.path,e)),alwaysSet:e in r.data})}if(this._def.catchall instanceof C){const e=this._def.unknownKeys;if("passthrough"===e)for(const e of u)d.push({key:{status:"valid",value:e},value:{status:"valid",value:r.data[e]}});else if("strict"===e)u.length>0&&((0,i.addIssueToContext)(r,{code:a.ZodIssueCode.unrecognized_keys,keys:u}),t.dirty());else if("strip"!==e)throw new Error("Internal ZodObject error: invalid unknownKeys value.")}else{const e=this._def.catchall;for(const t of u){const n=r.data[t];d.push({key:{status:"valid",value:t},value:e._parse(new c(r,n,r.path,t)),alwaysSet:t in r.data})}}return r.common.async?Promise.resolve().then((async()=>{const e=[];for(const t of d){const r=await t.key;e.push({key:r,value:await t.value,alwaysSet:t.alwaysSet})}return e})).then((e=>i.ParseStatus.mergeObjectSync(t,e))):i.ParseStatus.mergeObjectSync(t,d)}get shape(){return this._def.shape()}strict(e){return o.errorUtil.errToObj,new M({...this._def,unknownKeys:"strict",...void 0!==e?{errorMap:(t,r)=>{var n,i,s,a;const c=null!==(s=null===(i=(n=this._def).errorMap)||void 0===i?void 0:i.call(n,t,r).message)&&void 0!==s?s:r.defaultError;return"unrecognized_keys"===t.code?{message:null!==(a=o.errorUtil.errToObj(e).message)&&void 0!==a?a:c}:{message:c}}}:{}})}strip(){return new M({...this._def,unknownKeys:"strip"})}passthrough(){return new M({...this._def,unknownKeys:"passthrough"})}extend(e){return new M({...this._def,shape:()=>({...this._def.shape(),...e})})}merge(e){return new M({unknownKeys:e._def.unknownKeys,catchall:e._def.catchall,shape:()=>({...this._def.shape(),...e._def.shape()}),typeName:ae.ZodObject})}setKey(e,t){return this.augment({[e]:t})}catchall(e){return new M({...this._def,catchall:e})}pick(e){const t={};return s.util.objectKeys(e).forEach((r=>{e[r]&&this.shape[r]&&(t[r]=this.shape[r])})),new M({...this._def,shape:()=>t})}omit(e){const t={};return s.util.objectKeys(this.shape).forEach((r=>{e[r]||(t[r]=this.shape[r])})),new M({...this._def,shape:()=>t})}deepPartial(){return N(this)}partial(e){const t={};return s.util.objectKeys(this.shape).forEach((r=>{const n=this.shape[r];e&&!e[r]?t[r]=n:t[r]=n.optional()})),new M({...this._def,shape:()=>t})}required(e){const t={};return s.util.objectKeys(this.shape).forEach((r=>{if(e&&!e[r])t[r]=this.shape[r];else{let e=this.shape[r];for(;e instanceof $;)e=e._def.innerType;t[r]=e}})),new M({...this._def,shape:()=>t})}keyof(){return K(s.util.objectKeys(this.shape))}}t.ZodObject=M,M.create=(e,t)=>new M({shape:()=>e,unknownKeys:"strip",catchall:C.create(),typeName:ae.ZodObject,...d(t)}),M.strictCreate=(e,t)=>new M({shape:()=>e,unknownKeys:"strict",catchall:C.create(),typeName:ae.ZodObject,...d(t)}),M.lazycreate=(e,t)=>new M({shape:e,unknownKeys:"strip",catchall:C.create(),typeName:ae.ZodObject,...d(t)});class L extends l{_parse(e){const{ctx:t}=this._processInputParams(e),r=this._def.options;if(t.common.async)return Promise.all(r.map((async e=>{const r={...t,common:{...t.common,issues:[]},parent:null};return{result:await e._parseAsync({data:t.data,path:t.path,parent:r}),ctx:r}}))).then((function(e){for(const t of e)if("valid"===t.result.status)return t.result;for(const r of e)if("dirty"===r.result.status)return t.common.issues.push(...r.ctx.common.issues),r.result;const r=e.map((e=>new a.ZodError(e.ctx.common.issues)));return(0,i.addIssueToContext)(t,{code:a.ZodIssueCode.invalid_union,unionErrors:r}),i.INVALID}));{let e;const n=[];for(const o of r){const r={...t,common:{...t.common,issues:[]},parent:null},i=o._parseSync({data:t.data,path:t.path,parent:r});if("valid"===i.status)return i;"dirty"!==i.status||e||(e={result:i,ctx:r}),r.common.issues.length&&n.push(r.common.issues)}if(e)return t.common.issues.push(...e.ctx.common.issues),e.result;const o=n.map((e=>new a.ZodError(e)));return(0,i.addIssueToContext)(t,{code:a.ZodIssueCode.invalid_union,unionErrors:o}),i.INVALID}}get options(){return this._def.options}}t.ZodUnion=L,L.create=(e,t)=>new L({options:e,typeName:ae.ZodUnion,...d(t)});const D=e=>e instanceof q?D(e.schema):e instanceof Y?D(e.innerType()):e instanceof z?[e.value]:e instanceof Q?e.options:e instanceof X?Object.keys(e.enum):e instanceof te?D(e._def.innerType):e instanceof P?[void 0]:e instanceof x?[null]:null;class F extends l{_parse(e){const{ctx:t}=this._processInputParams(e);if(t.parsedType!==s.ZodParsedType.object)return(0,i.addIssueToContext)(t,{code:a.ZodIssueCode.invalid_type,expected:s.ZodParsedType.object,received:t.parsedType}),i.INVALID;const r=this.discriminator,n=t.data[r],o=this.optionsMap.get(n);return o?t.common.async?o._parseAsync({data:t.data,path:t.path,parent:t}):o._parseSync({data:t.data,path:t.path,parent:t}):((0,i.addIssueToContext)(t,{code:a.ZodIssueCode.invalid_union_discriminator,options:Array.from(this.optionsMap.keys()),path:[r]}),i.INVALID)}get discriminator(){return this._def.discriminator}get options(){return this._def.options}get optionsMap(){return this._def.optionsMap}static create(e,t,r){const n=new Map;for(const r of t){const t=D(r.shape[e]);if(!t)throw new Error(`A discriminator value for key \`${e}\` could not be extracted from all schema options`);for(const o of t){if(n.has(o))throw new Error(`Discriminator property ${String(e)} has duplicate value ${String(o)}`);n.set(o,r)}}return new F({typeName:ae.ZodDiscriminatedUnion,discriminator:e,options:t,optionsMap:n,...d(r)})}}function H(e,t){const r=(0,s.getParsedType)(e),n=(0,s.getParsedType)(t);if(e===t)return{valid:!0,data:e};if(r===s.ZodParsedType.object&&n===s.ZodParsedType.object){const r=s.util.objectKeys(t),n=s.util.objectKeys(e).filter((e=>-1!==r.indexOf(e))),o={...e,...t};for(const r of n){const n=H(e[r],t[r]);if(!n.valid)return{valid:!1};o[r]=n.data}return{valid:!0,data:o}}if(r===s.ZodParsedType.array&&n===s.ZodParsedType.array){if(e.length!==t.length)return{valid:!1};const r=[];for(let n=0;n<e.length;n++){const o=H(e[n],t[n]);if(!o.valid)return{valid:!1};r.push(o.data)}return{valid:!0,data:r}}return r===s.ZodParsedType.date&&n===s.ZodParsedType.date&&+e==+t?{valid:!0,data:e}:{valid:!1}}t.ZodDiscriminatedUnion=F;class j extends l{_parse(e){const{status:t,ctx:r}=this._processInputParams(e),n=(e,n)=>{if((0,i.isAborted)(e)||(0,i.isAborted)(n))return i.INVALID;const o=H(e.value,n.value);return o.valid?(((0,i.isDirty)(e)||(0,i.isDirty)(n))&&t.dirty(),{status:t.value,value:o.data}):((0,i.addIssueToContext)(r,{code:a.ZodIssueCode.invalid_intersection_types}),i.INVALID)};return r.common.async?Promise.all([this._def.left._parseAsync({data:r.data,path:r.path,parent:r}),this._def.right._parseAsync({data:r.data,path:r.path,parent:r})]).then((([e,t])=>n(e,t))):n(this._def.left._parseSync({data:r.data,path:r.path,parent:r}),this._def.right._parseSync({data:r.data,path:r.path,parent:r}))}}t.ZodIntersection=j,j.create=(e,t,r)=>new j({left:e,right:t,typeName:ae.ZodIntersection,...d(r)});class U extends l{_parse(e){const{status:t,ctx:r}=this._processInputParams(e);if(r.parsedType!==s.ZodParsedType.array)return(0,i.addIssueToContext)(r,{code:a.ZodIssueCode.invalid_type,expected:s.ZodParsedType.array,received:r.parsedType}),i.INVALID;if(r.data.length<this._def.items.length)return(0,i.addIssueToContext)(r,{code:a.ZodIssueCode.too_small,minimum:this._def.items.length,inclusive:!0,exact:!1,type:"array"}),i.INVALID;!this._def.rest&&r.data.length>this._def.items.length&&((0,i.addIssueToContext)(r,{code:a.ZodIssueCode.too_big,maximum:this._def.items.length,inclusive:!0,exact:!1,type:"array"}),t.dirty());const n=[...r.data].map(((e,t)=>{const n=this._def.items[t]||this._def.rest;return n?n._parse(new c(r,e,r.path,t)):null})).filter((e=>!!e));return r.common.async?Promise.all(n).then((e=>i.ParseStatus.mergeArray(t,e))):i.ParseStatus.mergeArray(t,n)}get items(){return this._def.items}rest(e){return new U({...this._def,rest:e})}}t.ZodTuple=U,U.create=(e,t)=>{if(!Array.isArray(e))throw new Error("You must pass an array of schemas to z.tuple([ ... ])");return new U({items:e,typeName:ae.ZodTuple,rest:null,...d(t)})};class G extends l{get keySchema(){return this._def.keyType}get valueSchema(){return this._def.valueType}_parse(e){const{status:t,ctx:r}=this._processInputParams(e);if(r.parsedType!==s.ZodParsedType.object)return(0,i.addIssueToContext)(r,{code:a.ZodIssueCode.invalid_type,expected:s.ZodParsedType.object,received:r.parsedType}),i.INVALID;const n=[],o=this._def.keyType,u=this._def.valueType;for(const e in r.data)n.push({key:o._parse(new c(r,e,r.path,e)),value:u._parse(new c(r,r.data[e],r.path,e))});return r.common.async?i.ParseStatus.mergeObjectAsync(t,n):i.ParseStatus.mergeObjectSync(t,n)}get element(){return this._def.valueType}static create(e,t,r){return new G(t instanceof l?{keyType:e,valueType:t,typeName:ae.ZodRecord,...d(r)}:{keyType:E.create(),valueType:e,typeName:ae.ZodRecord,...d(t)})}}t.ZodRecord=G;class V extends l{get keySchema(){return this._def.keyType}get valueSchema(){return this._def.valueType}_parse(e){const{status:t,ctx:r}=this._processInputParams(e);if(r.parsedType!==s.ZodParsedType.map)return(0,i.addIssueToContext)(r,{code:a.ZodIssueCode.invalid_type,expected:s.ZodParsedType.map,received:r.parsedType}),i.INVALID;const n=this._def.keyType,o=this._def.valueType,u=[...r.data.entries()].map((([e,t],i)=>({key:n._parse(new c(r,e,r.path,[i,"key"])),value:o._parse(new c(r,t,r.path,[i,"value"]))})));if(r.common.async){const e=new Map;return Promise.resolve().then((async()=>{for(const r of u){const n=await r.key,o=await r.value;if("aborted"===n.status||"aborted"===o.status)return i.INVALID;"dirty"!==n.status&&"dirty"!==o.status||t.dirty(),e.set(n.value,o.value)}return{status:t.value,value:e}}))}{const e=new Map;for(const r of u){const n=r.key,o=r.value;if("aborted"===n.status||"aborted"===o.status)return i.INVALID;"dirty"!==n.status&&"dirty"!==o.status||t.dirty(),e.set(n.value,o.value)}return{status:t.value,value:e}}}}t.ZodMap=V,V.create=(e,t,r)=>new V({valueType:t,keyType:e,typeName:ae.ZodMap,...d(r)});class W extends l{_parse(e){const{status:t,ctx:r}=this._processInputParams(e);if(r.parsedType!==s.ZodParsedType.set)return(0,i.addIssueToContext)(r,{code:a.ZodIssueCode.invalid_type,expected:s.ZodParsedType.set,received:r.parsedType}),i.INVALID;const n=this._def;null!==n.minSize&&r.data.size<n.minSize.value&&((0,i.addIssueToContext)(r,{code:a.ZodIssueCode.too_small,minimum:n.minSize.value,type:"set",inclusive:!0,exact:!1,message:n.minSize.message}),t.dirty()),null!==n.maxSize&&r.data.size>n.maxSize.value&&((0,i.addIssueToContext)(r,{code:a.ZodIssueCode.too_big,maximum:n.maxSize.value,type:"set",inclusive:!0,exact:!1,message:n.maxSize.message}),t.dirty());const o=this._def.valueType;function u(e){const r=new Set;for(const n of e){if("aborted"===n.status)return i.INVALID;"dirty"===n.status&&t.dirty(),r.add(n.value)}return{status:t.value,value:r}}const d=[...r.data.values()].map(((e,t)=>o._parse(new c(r,e,r.path,t))));return r.common.async?Promise.all(d).then((e=>u(e))):u(d)}min(e,t){return new W({...this._def,minSize:{value:e,message:o.errorUtil.toString(t)}})}max(e,t){return new W({...this._def,maxSize:{value:e,message:o.errorUtil.toString(t)}})}size(e,t){return this.min(e,t).max(e,t)}nonempty(e){return this.min(1,e)}}t.ZodSet=W,W.create=(e,t)=>new W({valueType:e,minSize:null,maxSize:null,typeName:ae.ZodSet,...d(t)});class Z extends l{constructor(){super(...arguments),this.validate=this.implement}_parse(e){const{ctx:t}=this._processInputParams(e);if(t.parsedType!==s.ZodParsedType.function)return(0,i.addIssueToContext)(t,{code:a.ZodIssueCode.invalid_type,expected:s.ZodParsedType.function,received:t.parsedType}),i.INVALID;function r(e,r){return(0,i.makeIssue)({data:e,path:t.path,errorMaps:[t.common.contextualErrorMap,t.schemaErrorMap,(0,n.getErrorMap)(),n.defaultErrorMap].filter((e=>!!e)),issueData:{code:a.ZodIssueCode.invalid_arguments,argumentsError:r}})}function o(e,r){return(0,i.makeIssue)({data:e,path:t.path,errorMaps:[t.common.contextualErrorMap,t.schemaErrorMap,(0,n.getErrorMap)(),n.defaultErrorMap].filter((e=>!!e)),issueData:{code:a.ZodIssueCode.invalid_return_type,returnTypeError:r}})}const c={errorMap:t.common.contextualErrorMap},u=t.data;if(this._def.returns instanceof J){const e=this;return(0,i.OK)((async function(...t){const n=new a.ZodError([]),i=await e._def.args.parseAsync(t,c).catch((e=>{throw n.addIssue(r(t,e)),n})),s=await Reflect.apply(u,this,i);return await e._def.returns._def.type.parseAsync(s,c).catch((e=>{throw n.addIssue(o(s,e)),n}))}))}{const e=this;return(0,i.OK)((function(...t){const n=e._def.args.safeParse(t,c);if(!n.success)throw new a.ZodError([r(t,n.error)]);const i=Reflect.apply(u,this,n.data),s=e._def.returns.safeParse(i,c);if(!s.success)throw new a.ZodError([o(i,s.error)]);return s.data}))}}parameters(){return this._def.args}returnType(){return this._def.returns}args(...e){return new Z({...this._def,args:U.create(e).rest(S.create())})}returns(e){return new Z({...this._def,returns:e})}implement(e){return this.parse(e)}strictImplement(e){return this.parse(e)}static create(e,t,r){return new Z({args:e||U.create([]).rest(S.create()),returns:t||S.create(),typeName:ae.ZodFunction,...d(r)})}}t.ZodFunction=Z;class q extends l{get schema(){return this._def.getter()}_parse(e){const{ctx:t}=this._processInputParams(e);return this._def.getter()._parse({data:t.data,path:t.path,parent:t})}}t.ZodLazy=q,q.create=(e,t)=>new q({getter:e,typeName:ae.ZodLazy,...d(t)});class z extends l{_parse(e){if(e.data!==this._def.value){const t=this._getOrReturnCtx(e);return(0,i.addIssueToContext)(t,{received:t.data,code:a.ZodIssueCode.invalid_literal,expected:this._def.value}),i.INVALID}return{status:"valid",value:e.data}}get value(){return this._def.value}}function K(e,t){return new Q({values:e,typeName:ae.ZodEnum,...d(t)})}t.ZodLiteral=z,z.create=(e,t)=>new z({value:e,typeName:ae.ZodLiteral,...d(t)});class Q extends l{_parse(e){if("string"!=typeof e.data){const t=this._getOrReturnCtx(e),r=this._def.values;return(0,i.addIssueToContext)(t,{expected:s.util.joinValues(r),received:t.parsedType,code:a.ZodIssueCode.invalid_type}),i.INVALID}if(-1===this._def.values.indexOf(e.data)){const t=this._getOrReturnCtx(e),r=this._def.values;return(0,i.addIssueToContext)(t,{received:t.data,code:a.ZodIssueCode.invalid_enum_value,options:r}),i.INVALID}return(0,i.OK)(e.data)}get options(){return this._def.values}get enum(){const e={};for(const t of this._def.values)e[t]=t;return e}get Values(){const e={};for(const t of this._def.values)e[t]=t;return e}get Enum(){const e={};for(const t of this._def.values)e[t]=t;return e}extract(e){return Q.create(e)}exclude(e){return Q.create(this.options.filter((t=>!e.includes(t))))}}t.ZodEnum=Q,Q.create=K;class X extends l{_parse(e){const t=s.util.getValidEnumValues(this._def.values),r=this._getOrReturnCtx(e);if(r.parsedType!==s.ZodParsedType.string&&r.parsedType!==s.ZodParsedType.number){const e=s.util.objectValues(t);return(0,i.addIssueToContext)(r,{expected:s.util.joinValues(e),received:r.parsedType,code:a.ZodIssueCode.invalid_type}),i.INVALID}if(-1===t.indexOf(e.data)){const e=s.util.objectValues(t);return(0,i.addIssueToContext)(r,{received:r.data,code:a.ZodIssueCode.invalid_enum_value,options:e}),i.INVALID}return(0,i.OK)(e.data)}get enum(){return this._def.values}}t.ZodNativeEnum=X,X.create=(e,t)=>new X({values:e,typeName:ae.ZodNativeEnum,...d(t)});class J extends l{unwrap(){return this._def.type}_parse(e){const{ctx:t}=this._processInputParams(e);if(t.parsedType!==s.ZodParsedType.promise&&!1===t.common.async)return(0,i.addIssueToContext)(t,{code:a.ZodIssueCode.invalid_type,expected:s.ZodParsedType.promise,received:t.parsedType}),i.INVALID;const r=t.parsedType===s.ZodParsedType.promise?t.data:Promise.resolve(t.data);return(0,i.OK)(r.then((e=>this._def.type.parseAsync(e,{path:t.path,errorMap:t.common.contextualErrorMap}))))}}t.ZodPromise=J,J.create=(e,t)=>new J({type:e,typeName:ae.ZodPromise,...d(t)});class Y extends l{innerType(){return this._def.schema}sourceType(){return this._def.schema._def.typeName===ae.ZodEffects?this._def.schema.sourceType():this._def.schema}_parse(e){const{status:t,ctx:r}=this._processInputParams(e),n=this._def.effect||null,o={addIssue:e=>{(0,i.addIssueToContext)(r,e),e.fatal?t.abort():t.dirty()},get path(){return r.path}};if(o.addIssue=o.addIssue.bind(o),"preprocess"===n.type){const e=n.transform(r.data,o);return r.common.issues.length?{status:"dirty",value:r.data}:r.common.async?Promise.resolve(e).then((e=>this._def.schema._parseAsync({data:e,path:r.path,parent:r}))):this._def.schema._parseSync({data:e,path:r.path,parent:r})}if("refinement"===n.type){const e=e=>{const t=n.refinement(e,o);if(r.common.async)return Promise.resolve(t);if(t instanceof Promise)throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");return e};if(!1===r.common.async){const n=this._def.schema._parseSync({data:r.data,path:r.path,parent:r});return"aborted"===n.status?i.INVALID:("dirty"===n.status&&t.dirty(),e(n.value),{status:t.value,value:n.value})}return this._def.schema._parseAsync({data:r.data,path:r.path,parent:r}).then((r=>"aborted"===r.status?i.INVALID:("dirty"===r.status&&t.dirty(),e(r.value).then((()=>({status:t.value,value:r.value}))))))}if("transform"===n.type){if(!1===r.common.async){const e=this._def.schema._parseSync({data:r.data,path:r.path,parent:r});if(!(0,i.isValid)(e))return e;const s=n.transform(e.value,o);if(s instanceof Promise)throw new Error("Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.");return{status:t.value,value:s}}return this._def.schema._parseAsync({data:r.data,path:r.path,parent:r}).then((e=>(0,i.isValid)(e)?Promise.resolve(n.transform(e.value,o)).then((e=>({status:t.value,value:e}))):e))}s.util.assertNever(n)}}t.ZodEffects=Y,t.ZodTransformer=Y,Y.create=(e,t,r)=>new Y({schema:e,typeName:ae.ZodEffects,effect:t,...d(r)}),Y.createWithPreprocess=(e,t,r)=>new Y({schema:t,effect:{type:"preprocess",transform:e},typeName:ae.ZodEffects,...d(r)});class $ extends l{_parse(e){return this._getType(e)===s.ZodParsedType.undefined?(0,i.OK)(void 0):this._def.innerType._parse(e)}unwrap(){return this._def.innerType}}t.ZodOptional=$,$.create=(e,t)=>new $({innerType:e,typeName:ae.ZodOptional,...d(t)});class ee extends l{_parse(e){return this._getType(e)===s.ZodParsedType.null?(0,i.OK)(null):this._def.innerType._parse(e)}unwrap(){return this._def.innerType}}t.ZodNullable=ee,ee.create=(e,t)=>new ee({innerType:e,typeName:ae.ZodNullable,...d(t)});class te extends l{_parse(e){const{ctx:t}=this._processInputParams(e);let r=t.data;return t.parsedType===s.ZodParsedType.undefined&&(r=this._def.defaultValue()),this._def.innerType._parse({data:r,path:t.path,parent:t})}removeDefault(){return this._def.innerType}}t.ZodDefault=te,te.create=(e,t)=>new te({innerType:e,typeName:ae.ZodDefault,defaultValue:"function"==typeof t.default?t.default:()=>t.default,...d(t)});class re extends l{_parse(e){const{ctx:t}=this._processInputParams(e),r={...t,common:{...t.common,issues:[]}},n=this._def.innerType._parse({data:r.data,path:r.path,parent:{...r}});return(0,i.isAsync)(n)?n.then((e=>({status:"valid",value:"valid"===e.status?e.value:this._def.catchValue({get error(){return new a.ZodError(r.common.issues)},input:r.data})}))):{status:"valid",value:"valid"===n.status?n.value:this._def.catchValue({get error(){return new a.ZodError(r.common.issues)},input:r.data})}}removeCatch(){return this._def.innerType}}t.ZodCatch=re,re.create=(e,t)=>new re({innerType:e,typeName:ae.ZodCatch,catchValue:"function"==typeof t.catch?t.catch:()=>t.catch,...d(t)});class ne extends l{_parse(e){if(this._getType(e)!==s.ZodParsedType.nan){const t=this._getOrReturnCtx(e);return(0,i.addIssueToContext)(t,{code:a.ZodIssueCode.invalid_type,expected:s.ZodParsedType.nan,received:t.parsedType}),i.INVALID}return{status:"valid",value:e.data}}}t.ZodNaN=ne,ne.create=e=>new ne({typeName:ae.ZodNaN,...d(e)}),t.BRAND=Symbol("zod_brand");class oe extends l{_parse(e){const{ctx:t}=this._processInputParams(e),r=t.data;return this._def.type._parse({data:r,path:t.path,parent:t})}unwrap(){return this._def.type}}t.ZodBranded=oe;class ie extends l{_parse(e){const{status:t,ctx:r}=this._processInputParams(e);if(r.common.async)return(async()=>{const e=await this._def.in._parseAsync({data:r.data,path:r.path,parent:r});return"aborted"===e.status?i.INVALID:"dirty"===e.status?(t.dirty(),(0,i.DIRTY)(e.value)):this._def.out._parseAsync({data:e.value,path:r.path,parent:r})})();{const e=this._def.in._parseSync({data:r.data,path:r.path,parent:r});return"aborted"===e.status?i.INVALID:"dirty"===e.status?(t.dirty(),{status:"dirty",value:e.value}):this._def.out._parseSync({data:e.value,path:r.path,parent:r})}}static create(e,t){return new ie({in:e,out:t,typeName:ae.ZodPipeline})}}t.ZodPipeline=ie;class se extends l{_parse(e){const t=this._def.innerType._parse(e);return(0,i.isValid)(t)&&(t.value=Object.freeze(t.value)),t}}var ae;t.ZodReadonly=se,se.create=(e,t)=>new se({innerType:e,typeName:ae.ZodReadonly,...d(t)}),t.custom=(e,t={},r)=>e?O.create().superRefine(((n,o)=>{var i,s;if(!e(n)){const e="function"==typeof t?t(n):"string"==typeof t?{message:t}:t,a=null===(s=null!==(i=e.fatal)&&void 0!==i?i:r)||void 0===s||s,c="string"==typeof e?{message:e}:e;o.addIssue({code:"custom",...c,fatal:a})}})):O.create(),t.late={object:M.lazycreate},function(e){e.ZodString="ZodString",e.ZodNumber="ZodNumber",e.ZodNaN="ZodNaN",e.ZodBigInt="ZodBigInt",e.ZodBoolean="ZodBoolean",e.ZodDate="ZodDate",e.ZodSymbol="ZodSymbol",e.ZodUndefined="ZodUndefined",e.ZodNull="ZodNull",e.ZodAny="ZodAny",e.ZodUnknown="ZodUnknown",e.ZodNever="ZodNever",e.ZodVoid="ZodVoid",e.ZodArray="ZodArray",e.ZodObject="ZodObject",e.ZodUnion="ZodUnion",e.ZodDiscriminatedUnion="ZodDiscriminatedUnion",e.ZodIntersection="ZodIntersection",e.ZodTuple="ZodTuple",e.ZodRecord="ZodRecord",e.ZodMap="ZodMap",e.ZodSet="ZodSet",e.ZodFunction="ZodFunction",e.ZodLazy="ZodLazy",e.ZodLiteral="ZodLiteral",e.ZodEnum="ZodEnum",e.ZodEffects="ZodEffects",e.ZodNativeEnum="ZodNativeEnum",e.ZodOptional="ZodOptional",e.ZodNullable="ZodNullable",e.ZodDefault="ZodDefault",e.ZodCatch="ZodCatch",e.ZodPromise="ZodPromise",e.ZodBranded="ZodBranded",e.ZodPipeline="ZodPipeline",e.ZodReadonly="ZodReadonly"}(ae=t.ZodFirstPartyTypeKind||(t.ZodFirstPartyTypeKind={})),t.instanceof=(e,r={message:`Input not instance of ${e.name}`})=>(0,t.custom)((t=>t instanceof e),r);const ce=E.create;t.string=ce;const ue=A.create;t.number=ue;const de=ne.create;t.nan=de;const le=T.create;t.bigint=le;const he=w.create;t.boolean=he;const fe=I.create;t.date=fe;const pe=R.create;t.symbol=pe;const me=P.create;t.undefined=me;const ge=x.create;t.null=ge;const ye=O.create;t.any=ye;const ve=S.create;t.unknown=ve;const be=C.create;t.never=be;const Ee=B.create;t.void=Ee;const _e=k.create;t.array=_e;const Ae=M.create;t.object=Ae;const Te=M.strictCreate;t.strictObject=Te;const we=L.create;t.union=we;const Ie=F.create;t.discriminatedUnion=Ie;const Re=j.create;t.intersection=Re;const Pe=U.create;t.tuple=Pe;const xe=G.create;t.record=xe;const Oe=V.create;t.map=Oe;const Se=W.create;t.set=Se;const Ce=Z.create;t.function=Ce;const Be=q.create;t.lazy=Be;const ke=z.create;t.literal=ke;const Ne=Q.create;t.enum=Ne;const Me=X.create;t.nativeEnum=Me;const Le=J.create;t.promise=Le;const De=Y.create;t.effect=De,t.transformer=De;const Fe=$.create;t.optional=Fe;const He=ee.create;t.nullable=He;const je=Y.createWithPreprocess;t.preprocess=je;const Ue=ie.create;t.pipeline=Ue,t.ostring=()=>ce().optional(),t.onumber=()=>ue().optional(),t.oboolean=()=>he().optional(),t.coerce={string:e=>E.create({...e,coerce:!0}),number:e=>A.create({...e,coerce:!0}),boolean:e=>w.create({...e,coerce:!0}),bigint:e=>T.create({...e,coerce:!0}),date:e=>I.create({...e,coerce:!0})},t.NEVER=i.INVALID},4530:(e,t)=>{"use strict";function r(e){if(!Number.isSafeInteger(e)||e<0)throw new Error(`Wrong positive integer: ${e}`)}function n(e){if("boolean"!=typeof e)throw new Error(`Expected boolean, not ${e}`)}function o(e,...t){if(!(e instanceof Uint8Array))throw new TypeError("Expected Uint8Array");if(t.length>0&&!t.includes(e.length))throw new TypeError(`Expected Uint8Array of length ${t}, not of length=${e.length}`)}function i(e){if("function"!=typeof e||"function"!=typeof e.create)throw new Error("Hash should be wrapped by utils.wrapConstructor");r(e.outputLen),r(e.blockLen)}function s(e,t=!0){if(e.destroyed)throw new Error("Hash instance has been destroyed");if(t&&e.finished)throw new Error("Hash#digest() has already been called")}function a(e,t){o(e);const r=t.outputLen;if(e.length<r)throw new Error(`digestInto() expects output buffer of length at least ${r}`)}Object.defineProperty(t,"__esModule",{value:!0}),t.output=t.exists=t.hash=t.bytes=t.bool=t.number=void 0,t.number=r,t.bool=n,t.bytes=o,t.hash=i,t.exists=s,t.output=a;const c={number:r,bool:n,bytes:o,hash:i,exists:s,output:a};t.default=c},2023:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.SHA2=void 0;const n=r(4530),o=r(2071);class i extends o.Hash{constructor(e,t,r,n){super(),this.blockLen=e,this.outputLen=t,this.padOffset=r,this.isLE=n,this.finished=!1,this.length=0,this.pos=0,this.destroyed=!1,this.buffer=new Uint8Array(e),this.view=(0,o.createView)(this.buffer)}update(e){n.default.exists(this);const{view:t,buffer:r,blockLen:i}=this,s=(e=(0,o.toBytes)(e)).length;for(let n=0;n<s;){const a=Math.min(i-this.pos,s-n);if(a!==i)r.set(e.subarray(n,n+a),this.pos),this.pos+=a,n+=a,this.pos===i&&(this.process(t,0),this.pos=0);else{const t=(0,o.createView)(e);for(;i<=s-n;n+=i)this.process(t,n)}}return this.length+=e.length,this.roundClean(),this}digestInto(e){n.default.exists(this),n.default.output(e,this),this.finished=!0;const{buffer:t,view:r,blockLen:i,isLE:s}=this;let{pos:a}=this;t[a++]=128,this.buffer.subarray(a).fill(0),this.padOffset>i-a&&(this.process(r,0),a=0);for(let e=a;e<i;e++)t[e]=0;!function(e,t,r,n){if("function"==typeof e.setBigUint64)return e.setBigUint64(t,r,n);const o=BigInt(32),i=BigInt(4294967295),s=Number(r>>o&i),a=Number(r&i),c=n?4:0,u=n?0:4;e.setUint32(t+c,s,n),e.setUint32(t+u,a,n)}(r,i-8,BigInt(8*this.length),s),this.process(r,0);const c=(0,o.createView)(e),u=this.outputLen;if(u%4)throw new Error("_sha2: outputLen should be aligned to 32bit");const d=u/4,l=this.get();if(d>l.length)throw new Error("_sha2: outputLen bigger than state");for(let e=0;e<d;e++)c.setUint32(4*e,l[e],s)}digest(){const{buffer:e,outputLen:t}=this;this.digestInto(e);const r=e.slice(0,t);return this.destroy(),r}_cloneInto(e){e||(e=new this.constructor),e.set(...this.get());const{blockLen:t,buffer:r,length:n,finished:o,destroyed:i,pos:s}=this;return e.length=n,e.pos=s,e.finished=o,e.destroyed=i,n%t&&e.buffer.set(r),e}}t.SHA2=i},2286:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.add=t.toBig=t.split=t.fromBig=void 0;const r=BigInt(2**32-1),n=BigInt(32);function o(e,t=!1){return t?{h:Number(e&r),l:Number(e>>n&r)}:{h:0|Number(e>>n&r),l:0|Number(e&r)}}function i(e,t=!1){let r=new Uint32Array(e.length),n=new Uint32Array(e.length);for(let i=0;i<e.length;i++){const{h:s,l:a}=o(e[i],t);[r[i],n[i]]=[s,a]}return[r,n]}function s(e,t,r,n){const o=(t>>>0)+(n>>>0);return{h:e+r+(o/2**32|0)|0,l:0|o}}t.fromBig=o,t.split=i,t.toBig=(e,t)=>BigInt(e>>>0)<<n|BigInt(t>>>0),t.add=s;const a={fromBig:o,split:i,toBig:t.toBig,shrSH:(e,t,r)=>e>>>r,shrSL:(e,t,r)=>e<<32-r|t>>>r,rotrSH:(e,t,r)=>e>>>r|t<<32-r,rotrSL:(e,t,r)=>e<<32-r|t>>>r,rotrBH:(e,t,r)=>e<<64-r|t>>>r-32,rotrBL:(e,t,r)=>e>>>r-32|t<<64-r,rotr32H:(e,t)=>t,rotr32L:(e,t)=>e,rotlSH:(e,t,r)=>e<<r|t>>>32-r,rotlSL:(e,t,r)=>t<<r|e>>>32-r,rotlBH:(e,t,r)=>t<<r-32|e>>>64-r,rotlBL:(e,t,r)=>e<<r-32|t>>>64-r,add:s,add3L:(e,t,r)=>(e>>>0)+(t>>>0)+(r>>>0),add3H:(e,t,r,n)=>t+r+n+(e/2**32|0)|0,add4L:(e,t,r,n)=>(e>>>0)+(t>>>0)+(r>>>0)+(n>>>0),add4H:(e,t,r,n,o)=>t+r+n+o+(e/2**32|0)|0,add5H:(e,t,r,n,o,i)=>t+r+n+o+i+(e/2**32|0)|0,add5L:(e,t,r,n,o)=>(e>>>0)+(t>>>0)+(r>>>0)+(n>>>0)+(o>>>0)};t.default=a},9043:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.crypto=void 0,t.crypto="object"==typeof globalThis&&"crypto"in globalThis?globalThis.crypto:void 0},4302:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.hmac=void 0;const n=r(4530),o=r(2071);class i extends o.Hash{constructor(e,t){super(),this.finished=!1,this.destroyed=!1,n.default.hash(e);const r=(0,o.toBytes)(t);if(this.iHash=e.create(),"function"!=typeof this.iHash.update)throw new TypeError("Expected instance of class which extends utils.Hash");this.blockLen=this.iHash.blockLen,this.outputLen=this.iHash.outputLen;const i=this.blockLen,s=new Uint8Array(i);s.set(r.length>i?e.create().update(r).digest():r);for(let e=0;e<s.length;e++)s[e]^=54;this.iHash.update(s),this.oHash=e.create();for(let e=0;e<s.length;e++)s[e]^=106;this.oHash.update(s),s.fill(0)}update(e){return n.default.exists(this),this.iHash.update(e),this}digestInto(e){n.default.exists(this),n.default.bytes(e,this.outputLen),this.finished=!0,this.iHash.digestInto(e),this.oHash.update(e),this.oHash.digestInto(e),this.destroy()}digest(){const e=new Uint8Array(this.oHash.outputLen);return this.digestInto(e),e}_cloneInto(e){e||(e=Object.create(Object.getPrototypeOf(this),{}));const{oHash:t,iHash:r,finished:n,destroyed:o,blockLen:i,outputLen:s}=this;return e.finished=n,e.destroyed=o,e.blockLen=i,e.outputLen=s,e.oHash=t._cloneInto(e.oHash),e.iHash=r._cloneInto(e.iHash),e}destroy(){this.destroyed=!0,this.oHash.destroy(),this.iHash.destroy()}}t.hmac=(e,t,r)=>new i(e,t).update(r).digest(),t.hmac.create=(e,t)=>new i(e,t)},8797:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.pbkdf2Async=t.pbkdf2=void 0;const n=r(4530),o=r(4302),i=r(2071);function s(e,t,r,s){n.default.hash(e);const a=(0,i.checkOpts)({dkLen:32,asyncTick:10},s),{c,dkLen:u,asyncTick:d}=a;if(n.default.number(c),n.default.number(u),n.default.number(d),c<1)throw new Error("PBKDF2: iterations (c) should be >= 1");const l=(0,i.toBytes)(t),h=(0,i.toBytes)(r),f=new Uint8Array(u),p=o.hmac.create(e,l),m=p._cloneInto().update(h);return{c,dkLen:u,asyncTick:d,DK:f,PRF:p,PRFSalt:m}}function a(e,t,r,n,o){return e.destroy(),t.destroy(),n&&n.destroy(),o.fill(0),r}t.pbkdf2=function(e,t,r,n){const{c:o,dkLen:c,DK:u,PRF:d,PRFSalt:l}=s(e,t,r,n);let h;const f=new Uint8Array(4),p=(0,i.createView)(f),m=new Uint8Array(d.outputLen);for(let e=1,t=0;t<c;e++,t+=d.outputLen){const r=u.subarray(t,t+d.outputLen);p.setInt32(0,e,!1),(h=l._cloneInto(h)).update(f).digestInto(m),r.set(m.subarray(0,r.length));for(let e=1;e<o;e++){d._cloneInto(h).update(m).digestInto(m);for(let e=0;e<r.length;e++)r[e]^=m[e]}}return a(d,l,u,h,m)},t.pbkdf2Async=async function(e,t,r,n){const{c:o,dkLen:c,asyncTick:u,DK:d,PRF:l,PRFSalt:h}=s(e,t,r,n);let f;const p=new Uint8Array(4),m=(0,i.createView)(p),g=new Uint8Array(l.outputLen);for(let e=1,t=0;t<c;e++,t+=l.outputLen){const r=d.subarray(t,t+l.outputLen);m.setInt32(0,e,!1),(f=h._cloneInto(f)).update(p).digestInto(g),r.set(g.subarray(0,r.length)),await(0,i.asyncLoop)(o-1,u,(e=>{l._cloneInto(f).update(g).digestInto(g);for(let e=0;e<r.length;e++)r[e]^=g[e]}))}return a(l,h,d,f,g)}},217:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.scryptAsync=t.scrypt=void 0;const n=r(4530),o=r(8091),i=r(8797),s=r(2071),a=(e,t)=>e<<t|e>>>32-t;function c(e,t,r,n,o,i){let s=e[t++]^r[n++],c=e[t++]^r[n++],u=e[t++]^r[n++],d=e[t++]^r[n++],l=e[t++]^r[n++],h=e[t++]^r[n++],f=e[t++]^r[n++],p=e[t++]^r[n++],m=e[t++]^r[n++],g=e[t++]^r[n++],y=e[t++]^r[n++],v=e[t++]^r[n++],b=e[t++]^r[n++],E=e[t++]^r[n++],_=e[t++]^r[n++],A=e[t++]^r[n++],T=s,w=c,I=u,R=d,P=l,x=h,O=f,S=p,C=m,B=g,k=y,N=v,M=b,L=E,D=_,F=A;for(let e=0;e<8;e+=2)P^=a(T+M|0,7),C^=a(P+T|0,9),M^=a(C+P|0,13),T^=a(M+C|0,18),B^=a(x+w|0,7),L^=a(B+x|0,9),w^=a(L+B|0,13),x^=a(w+L|0,18),D^=a(k+O|0,7),I^=a(D+k|0,9),O^=a(I+D|0,13),k^=a(O+I|0,18),R^=a(F+N|0,7),S^=a(R+F|0,9),N^=a(S+R|0,13),F^=a(N+S|0,18),w^=a(T+R|0,7),I^=a(w+T|0,9),R^=a(I+w|0,13),T^=a(R+I|0,18),O^=a(x+P|0,7),S^=a(O+x|0,9),P^=a(S+O|0,13),x^=a(P+S|0,18),N^=a(k+B|0,7),C^=a(N+k|0,9),B^=a(C+N|0,13),k^=a(B+C|0,18),M^=a(F+D|0,7),L^=a(M+F|0,9),D^=a(L+M|0,13),F^=a(D+L|0,18);o[i++]=s+T|0,o[i++]=c+w|0,o[i++]=u+I|0,o[i++]=d+R|0,o[i++]=l+P|0,o[i++]=h+x|0,o[i++]=f+O|0,o[i++]=p+S|0,o[i++]=m+C|0,o[i++]=g+B|0,o[i++]=y+k|0,o[i++]=v+N|0,o[i++]=b+M|0,o[i++]=E+L|0,o[i++]=_+D|0,o[i++]=A+F|0}function u(e,t,r,n,o){let i=n+0,s=n+16*o;for(let n=0;n<16;n++)r[s+n]=e[t+16*(2*o-1)+n];for(let n=0;n<o;n++,i+=16,t+=16)c(r,s,e,t,r,i),n>0&&(s+=16),c(r,i,e,t+=16,r,s)}function d(e,t,r){const a=(0,s.checkOpts)({dkLen:32,asyncTick:10,maxmem:1073742848},r),{N:c,r:u,p:d,dkLen:l,asyncTick:h,maxmem:f,onProgress:p}=a;if(n.default.number(c),n.default.number(u),n.default.number(d),n.default.number(l),n.default.number(h),n.default.number(f),void 0!==p&&"function"!=typeof p)throw new Error("progressCb should be function");const m=128*u,g=m/4;if(c<=1||0!=(c&c-1)||c>=2**(m/8)||c>2**32)throw new Error("Scrypt: N must be larger than 1, a power of 2, less than 2^(128 * r / 8) and less than 2^32");if(d<0||d>137438953440/m)throw new Error("Scrypt: p must be a positive integer less than or equal to ((2^32 - 1) * 32) / (128 * r)");if(l<0||l>137438953440)throw new Error("Scrypt: dkLen should be positive integer less than or equal to (2^32 - 1) * 32");const y=m*(c+d);if(y>f)throw new Error(`Scrypt: parameters too large, ${y} (128 * r * (N + p)) > ${f} (maxmem)`);const v=(0,i.pbkdf2)(o.sha256,e,t,{c:1,dkLen:m*d}),b=(0,s.u32)(v),E=(0,s.u32)(new Uint8Array(m*c)),_=(0,s.u32)(new Uint8Array(m));let A=()=>{};if(p){const e=2*c*d,t=Math.max(Math.floor(e/1e4),1);let r=0;A=()=>{r++,!p||r%t&&r!==e||p(r/e)}}return{N:c,r:u,p:d,dkLen:l,blockSize32:g,V:E,B32:b,B:v,tmp:_,blockMixCb:A,asyncTick:h}}function l(e,t,r,n,s){const a=(0,i.pbkdf2)(o.sha256,e,r,{c:1,dkLen:t});return r.fill(0),n.fill(0),s.fill(0),a}t.scrypt=function(e,t,r){const{N:n,r:o,p:i,dkLen:s,blockSize32:a,V:c,B32:h,B:f,tmp:p,blockMixCb:m}=d(e,t,r);for(let e=0;e<i;e++){const t=a*e;for(let e=0;e<a;e++)c[e]=h[t+e];for(let e=0,t=0;e<n-1;e++)u(c,t,c,t+=a,o),m();u(c,(n-1)*a,h,t,o),m();for(let e=0;e<n;e++){const e=h[t+a-16]%n;for(let r=0;r<a;r++)p[r]=h[t+r]^c[e*a+r];u(p,0,h,t,o),m()}}return l(e,s,f,c,p)},t.scryptAsync=async function(e,t,r){const{N:n,r:o,p:i,dkLen:a,blockSize32:c,V:h,B32:f,B:p,tmp:m,blockMixCb:g,asyncTick:y}=d(e,t,r);for(let e=0;e<i;e++){const t=c*e;for(let e=0;e<c;e++)h[e]=f[t+e];let r=0;await(0,s.asyncLoop)(n-1,y,(e=>{u(h,r,h,r+=c,o),g()})),u(h,(n-1)*c,f,t,o),g(),await(0,s.asyncLoop)(n,y,(e=>{const r=f[t+c-16]%n;for(let e=0;e<c;e++)m[e]=f[t+e]^h[r*c+e];u(m,0,f,t,o),g()}))}return l(e,a,p,h,m)}},8091:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.sha224=t.sha256=void 0;const n=r(2023),o=r(2071),i=(e,t,r)=>e&t^e&r^t&r,s=new Uint32Array([1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298]),a=new Uint32Array([1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225]),c=new Uint32Array(64);class u extends n.SHA2{constructor(){super(64,32,8,!1),this.A=0|a[0],this.B=0|a[1],this.C=0|a[2],this.D=0|a[3],this.E=0|a[4],this.F=0|a[5],this.G=0|a[6],this.H=0|a[7]}get(){const{A:e,B:t,C:r,D:n,E:o,F:i,G:s,H:a}=this;return[e,t,r,n,o,i,s,a]}set(e,t,r,n,o,i,s,a){this.A=0|e,this.B=0|t,this.C=0|r,this.D=0|n,this.E=0|o,this.F=0|i,this.G=0|s,this.H=0|a}process(e,t){for(let r=0;r<16;r++,t+=4)c[r]=e.getUint32(t,!1);for(let e=16;e<64;e++){const t=c[e-15],r=c[e-2],n=(0,o.rotr)(t,7)^(0,o.rotr)(t,18)^t>>>3,i=(0,o.rotr)(r,17)^(0,o.rotr)(r,19)^r>>>10;c[e]=i+c[e-7]+n+c[e-16]|0}let{A:r,B:n,C:a,D:u,E:d,F:l,G:h,H:f}=this;for(let e=0;e<64;e++){const t=f+((0,o.rotr)(d,6)^(0,o.rotr)(d,11)^(0,o.rotr)(d,25))+((p=d)&l^~p&h)+s[e]+c[e]|0,m=((0,o.rotr)(r,2)^(0,o.rotr)(r,13)^(0,o.rotr)(r,22))+i(r,n,a)|0;f=h,h=l,l=d,d=u+t|0,u=a,a=n,n=r,r=t+m|0}var p;r=r+this.A|0,n=n+this.B|0,a=a+this.C|0,u=u+this.D|0,d=d+this.E|0,l=l+this.F|0,h=h+this.G|0,f=f+this.H|0,this.set(r,n,a,u,d,l,h,f)}roundClean(){c.fill(0)}destroy(){this.set(0,0,0,0,0,0,0,0),this.buffer.fill(0)}}class d extends u{constructor(){super(),this.A=-1056596264,this.B=914150663,this.C=812702999,this.D=-150054599,this.E=-4191439,this.F=1750603025,this.G=1694076839,this.H=-1090891868,this.outputLen=28}}t.sha256=(0,o.wrapConstructor)((()=>new u)),t.sha224=(0,o.wrapConstructor)((()=>new d))},1366:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.shake256=t.shake128=t.keccak_512=t.keccak_384=t.keccak_256=t.keccak_224=t.sha3_512=t.sha3_384=t.sha3_256=t.sha3_224=t.Keccak=t.keccakP=void 0;const n=r(4530),o=r(2286),i=r(2071),[s,a,c]=[[],[],[]],u=BigInt(0),d=BigInt(1),l=BigInt(2),h=BigInt(7),f=BigInt(256),p=BigInt(113);for(let e=0,t=d,r=1,n=0;e<24;e++){[r,n]=[n,(2*r+3*n)%5],s.push(2*(5*n+r)),a.push((e+1)*(e+2)/2%64);let o=u;for(let e=0;e<7;e++)t=(t<<d^(t>>h)*p)%f,t&l&&(o^=d<<(d<<BigInt(e))-d);c.push(o)}const[m,g]=o.default.split(c,!0),y=(e,t,r)=>r>32?o.default.rotlBH(e,t,r):o.default.rotlSH(e,t,r),v=(e,t,r)=>r>32?o.default.rotlBL(e,t,r):o.default.rotlSL(e,t,r);function b(e,t=24){const r=new Uint32Array(10);for(let n=24-t;n<24;n++){for(let t=0;t<10;t++)r[t]=e[t]^e[t+10]^e[t+20]^e[t+30]^e[t+40];for(let t=0;t<10;t+=2){const n=(t+8)%10,o=(t+2)%10,i=r[o],s=r[o+1],a=y(i,s,1)^r[n],c=v(i,s,1)^r[n+1];for(let r=0;r<50;r+=10)e[t+r]^=a,e[t+r+1]^=c}let t=e[2],o=e[3];for(let r=0;r<24;r++){const n=a[r],i=y(t,o,n),c=v(t,o,n),u=s[r];t=e[u],o=e[u+1],e[u]=i,e[u+1]=c}for(let t=0;t<50;t+=10){for(let n=0;n<10;n++)r[n]=e[t+n];for(let n=0;n<10;n++)e[t+n]^=~r[(n+2)%10]&r[(n+4)%10]}e[0]^=m[n],e[1]^=g[n]}r.fill(0)}t.keccakP=b;class E extends i.Hash{constructor(e,t,r,o=!1,s=24){if(super(),this.blockLen=e,this.suffix=t,this.outputLen=r,this.enableXOF=o,this.rounds=s,this.pos=0,this.posOut=0,this.finished=!1,this.destroyed=!1,n.default.number(r),0>=this.blockLen||this.blockLen>=200)throw new Error("Sha3 supports only keccak-f1600 function");this.state=new Uint8Array(200),this.state32=(0,i.u32)(this.state)}keccak(){b(this.state32,this.rounds),this.posOut=0,this.pos=0}update(e){n.default.exists(this);const{blockLen:t,state:r}=this,o=(e=(0,i.toBytes)(e)).length;for(let n=0;n<o;){const i=Math.min(t-this.pos,o-n);for(let t=0;t<i;t++)r[this.pos++]^=e[n++];this.pos===t&&this.keccak()}return this}finish(){if(this.finished)return;this.finished=!0;const{state:e,suffix:t,pos:r,blockLen:n}=this;e[r]^=t,0!=(128&t)&&r===n-1&&this.keccak(),e[n-1]^=128,this.keccak()}writeInto(e){n.default.exists(this,!1),n.default.bytes(e),this.finish();const t=this.state,{blockLen:r}=this;for(let n=0,o=e.length;n<o;){this.posOut>=r&&this.keccak();const i=Math.min(r-this.posOut,o-n);e.set(t.subarray(this.posOut,this.posOut+i),n),this.posOut+=i,n+=i}return e}xofInto(e){if(!this.enableXOF)throw new Error("XOF is not possible for this instance");return this.writeInto(e)}xof(e){return n.default.number(e),this.xofInto(new Uint8Array(e))}digestInto(e){if(n.default.output(e,this),this.finished)throw new Error("digest() was already called");return this.writeInto(e),this.destroy(),e}digest(){return this.digestInto(new Uint8Array(this.outputLen))}destroy(){this.destroyed=!0,this.state.fill(0)}_cloneInto(e){const{blockLen:t,suffix:r,outputLen:n,rounds:o,enableXOF:i}=this;return e||(e=new E(t,r,n,i,o)),e.state32.set(this.state32),e.pos=this.pos,e.posOut=this.posOut,e.finished=this.finished,e.rounds=o,e.suffix=r,e.outputLen=n,e.enableXOF=i,e.destroyed=this.destroyed,e}}t.Keccak=E;const _=(e,t,r)=>(0,i.wrapConstructor)((()=>new E(t,e,r)));t.sha3_224=_(6,144,28),t.sha3_256=_(6,136,32),t.sha3_384=_(6,104,48),t.sha3_512=_(6,72,64),t.keccak_224=_(1,144,28),t.keccak_256=_(1,136,32),t.keccak_384=_(1,104,48),t.keccak_512=_(1,72,64);const A=(e,t,r)=>(0,i.wrapConstructorWithOpts)(((n={})=>new E(t,e,void 0===n.dkLen?r:n.dkLen,!0)));t.shake128=A(31,168,16),t.shake256=A(31,136,32)},8578:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.sha384=t.sha512_256=t.sha512_224=t.sha512=t.SHA512=void 0;const n=r(2023),o=r(2286),i=r(2071),[s,a]=o.default.split(["0x428a2f98d728ae22","0x7137449123ef65cd","0xb5c0fbcfec4d3b2f","0xe9b5dba58189dbbc","0x3956c25bf348b538","0x59f111f1b605d019","0x923f82a4af194f9b","0xab1c5ed5da6d8118","0xd807aa98a3030242","0x12835b0145706fbe","0x243185be4ee4b28c","0x550c7dc3d5ffb4e2","0x72be5d74f27b896f","0x80deb1fe3b1696b1","0x9bdc06a725c71235","0xc19bf174cf692694","0xe49b69c19ef14ad2","0xefbe4786384f25e3","0x0fc19dc68b8cd5b5","0x240ca1cc77ac9c65","0x2de92c6f592b0275","0x4a7484aa6ea6e483","0x5cb0a9dcbd41fbd4","0x76f988da831153b5","0x983e5152ee66dfab","0xa831c66d2db43210","0xb00327c898fb213f","0xbf597fc7beef0ee4","0xc6e00bf33da88fc2","0xd5a79147930aa725","0x06ca6351e003826f","0x142929670a0e6e70","0x27b70a8546d22ffc","0x2e1b21385c26c926","0x4d2c6dfc5ac42aed","0x53380d139d95b3df","0x650a73548baf63de","0x766a0abb3c77b2a8","0x81c2c92e47edaee6","0x92722c851482353b","0xa2bfe8a14cf10364","0xa81a664bbc423001","0xc24b8b70d0f89791","0xc76c51a30654be30","0xd192e819d6ef5218","0xd69906245565a910","0xf40e35855771202a","0x106aa07032bbd1b8","0x19a4c116b8d2d0c8","0x1e376c085141ab53","0x2748774cdf8eeb99","0x34b0bcb5e19b48a8","0x391c0cb3c5c95a63","0x4ed8aa4ae3418acb","0x5b9cca4f7763e373","0x682e6ff3d6b2b8a3","0x748f82ee5defb2fc","0x78a5636f43172f60","0x84c87814a1f0ab72","0x8cc702081a6439ec","0x90befffa23631e28","0xa4506cebde82bde9","0xbef9a3f7b2c67915","0xc67178f2e372532b","0xca273eceea26619c","0xd186b8c721c0c207","0xeada7dd6cde0eb1e","0xf57d4f7fee6ed178","0x06f067aa72176fba","0x0a637dc5a2c898a6","0x113f9804bef90dae","0x1b710b35131c471b","0x28db77f523047d84","0x32caab7b40c72493","0x3c9ebe0a15c9bebc","0x431d67c49c100d4c","0x4cc5d4becb3e42b6","0x597f299cfc657e2a","0x5fcb6fab3ad6faec","0x6c44198c4a475817"].map((e=>BigInt(e)))),c=new Uint32Array(80),u=new Uint32Array(80);class d extends n.SHA2{constructor(){super(128,64,16,!1),this.Ah=1779033703,this.Al=-205731576,this.Bh=-1150833019,this.Bl=-2067093701,this.Ch=1013904242,this.Cl=-23791573,this.Dh=-1521486534,this.Dl=1595750129,this.Eh=1359893119,this.El=-1377402159,this.Fh=-1694144372,this.Fl=725511199,this.Gh=528734635,this.Gl=-79577749,this.Hh=1541459225,this.Hl=327033209}get(){const{Ah:e,Al:t,Bh:r,Bl:n,Ch:o,Cl:i,Dh:s,Dl:a,Eh:c,El:u,Fh:d,Fl:l,Gh:h,Gl:f,Hh:p,Hl:m}=this;return[e,t,r,n,o,i,s,a,c,u,d,l,h,f,p,m]}set(e,t,r,n,o,i,s,a,c,u,d,l,h,f,p,m){this.Ah=0|e,this.Al=0|t,this.Bh=0|r,this.Bl=0|n,this.Ch=0|o,this.Cl=0|i,this.Dh=0|s,this.Dl=0|a,this.Eh=0|c,this.El=0|u,this.Fh=0|d,this.Fl=0|l,this.Gh=0|h,this.Gl=0|f,this.Hh=0|p,this.Hl=0|m}process(e,t){for(let r=0;r<16;r++,t+=4)c[r]=e.getUint32(t),u[r]=e.getUint32(t+=4);for(let e=16;e<80;e++){const t=0|c[e-15],r=0|u[e-15],n=o.default.rotrSH(t,r,1)^o.default.rotrSH(t,r,8)^o.default.shrSH(t,r,7),i=o.default.rotrSL(t,r,1)^o.default.rotrSL(t,r,8)^o.default.shrSL(t,r,7),s=0|c[e-2],a=0|u[e-2],d=o.default.rotrSH(s,a,19)^o.default.rotrBH(s,a,61)^o.default.shrSH(s,a,6),l=o.default.rotrSL(s,a,19)^o.default.rotrBL(s,a,61)^o.default.shrSL(s,a,6),h=o.default.add4L(i,l,u[e-7],u[e-16]),f=o.default.add4H(h,n,d,c[e-7],c[e-16]);c[e]=0|f,u[e]=0|h}let{Ah:r,Al:n,Bh:i,Bl:d,Ch:l,Cl:h,Dh:f,Dl:p,Eh:m,El:g,Fh:y,Fl:v,Gh:b,Gl:E,Hh:_,Hl:A}=this;for(let e=0;e<80;e++){const t=o.default.rotrSH(m,g,14)^o.default.rotrSH(m,g,18)^o.default.rotrBH(m,g,41),T=o.default.rotrSL(m,g,14)^o.default.rotrSL(m,g,18)^o.default.rotrBL(m,g,41),w=m&y^~m&b,I=g&v^~g&E,R=o.default.add5L(A,T,I,a[e],u[e]),P=o.default.add5H(R,_,t,w,s[e],c[e]),x=0|R,O=o.default.rotrSH(r,n,28)^o.default.rotrBH(r,n,34)^o.default.rotrBH(r,n,39),S=o.default.rotrSL(r,n,28)^o.default.rotrBL(r,n,34)^o.default.rotrBL(r,n,39),C=r&i^r&l^i&l,B=n&d^n&h^d&h;_=0|b,A=0|E,b=0|y,E=0|v,y=0|m,v=0|g,({h:m,l:g}=o.default.add(0|f,0|p,0|P,0|x)),f=0|l,p=0|h,l=0|i,h=0|d,i=0|r,d=0|n;const k=o.default.add3L(x,S,B);r=o.default.add3H(k,P,O,C),n=0|k}({h:r,l:n}=o.default.add(0|this.Ah,0|this.Al,0|r,0|n)),({h:i,l:d}=o.default.add(0|this.Bh,0|this.Bl,0|i,0|d)),({h:l,l:h}=o.default.add(0|this.Ch,0|this.Cl,0|l,0|h)),({h:f,l:p}=o.default.add(0|this.Dh,0|this.Dl,0|f,0|p)),({h:m,l:g}=o.default.add(0|this.Eh,0|this.El,0|m,0|g)),({h:y,l:v}=o.default.add(0|this.Fh,0|this.Fl,0|y,0|v)),({h:b,l:E}=o.default.add(0|this.Gh,0|this.Gl,0|b,0|E)),({h:_,l:A}=o.default.add(0|this.Hh,0|this.Hl,0|_,0|A)),this.set(r,n,i,d,l,h,f,p,m,g,y,v,b,E,_,A)}roundClean(){c.fill(0),u.fill(0)}destroy(){this.buffer.fill(0),this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0)}}t.SHA512=d;class l extends d{constructor(){super(),this.Ah=-1942145080,this.Al=424955298,this.Bh=1944164710,this.Bl=-1982016298,this.Ch=502970286,this.Cl=855612546,this.Dh=1738396948,this.Dl=1479516111,this.Eh=258812777,this.El=2077511080,this.Fh=2011393907,this.Fl=79989058,this.Gh=1067287976,this.Gl=1780299464,this.Hh=286451373,this.Hl=-1848208735,this.outputLen=28}}class h extends d{constructor(){super(),this.Ah=573645204,this.Al=-64227540,this.Bh=-1621794909,this.Bl=-934517566,this.Ch=596883563,this.Cl=1867755857,this.Dh=-1774684391,this.Dl=1497426621,this.Eh=-1775747358,this.El=-1467023389,this.Fh=-1101128155,this.Fl=1401305490,this.Gh=721525244,this.Gl=746961066,this.Hh=246885852,this.Hl=-2117784414,this.outputLen=32}}class f extends d{constructor(){super(),this.Ah=-876896931,this.Al=-1056596264,this.Bh=1654270250,this.Bl=914150663,this.Ch=-1856437926,this.Cl=812702999,this.Dh=355462360,this.Dl=-150054599,this.Eh=1731405415,this.El=-4191439,this.Fh=-1900787065,this.Fl=1750603025,this.Gh=-619958771,this.Gl=1694076839,this.Hh=1203062813,this.Hl=-1090891868,this.outputLen=48}}t.sha512=(0,i.wrapConstructor)((()=>new d)),t.sha512_224=(0,i.wrapConstructor)((()=>new l)),t.sha512_256=(0,i.wrapConstructor)((()=>new h)),t.sha384=(0,i.wrapConstructor)((()=>new f))},2071:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.randomBytes=t.wrapConstructorWithOpts=t.wrapConstructor=t.checkOpts=t.Hash=t.concatBytes=t.toBytes=t.utf8ToBytes=t.asyncLoop=t.nextTick=t.hexToBytes=t.bytesToHex=t.isLE=t.rotr=t.createView=t.u32=t.u8=void 0;const n=r(9043);if(t.u8=e=>new Uint8Array(e.buffer,e.byteOffset,e.byteLength),t.u32=e=>new Uint32Array(e.buffer,e.byteOffset,Math.floor(e.byteLength/4)),t.createView=e=>new DataView(e.buffer,e.byteOffset,e.byteLength),t.rotr=(e,t)=>e<<32-t|e>>>t,t.isLE=68===new Uint8Array(new Uint32Array([287454020]).buffer)[0],!t.isLE)throw new Error("Non little-endian hardware is not supported");const o=Array.from({length:256},((e,t)=>t.toString(16).padStart(2,"0")));function i(e){if("string"!=typeof e)throw new TypeError("utf8ToBytes expected string, got "+typeof e);return(new TextEncoder).encode(e)}function s(e){if("string"==typeof e&&(e=i(e)),!(e instanceof Uint8Array))throw new TypeError(`Expected input type is Uint8Array (got ${typeof e})`);return e}t.bytesToHex=function(e){if(!(e instanceof Uint8Array))throw new Error("Uint8Array expected");let t="";for(let r=0;r<e.length;r++)t+=o[e[r]];return t},t.hexToBytes=function(e){if("string"!=typeof e)throw new TypeError("hexToBytes: expected string, got "+typeof e);if(e.length%2)throw new Error("hexToBytes: received invalid unpadded hex");const t=new Uint8Array(e.length/2);for(let r=0;r<t.length;r++){const n=2*r,o=e.slice(n,n+2),i=Number.parseInt(o,16);if(Number.isNaN(i)||i<0)throw new Error("Invalid byte sequence");t[r]=i}return t},t.nextTick=async()=>{},t.asyncLoop=async function(e,r,n){let o=Date.now();for(let i=0;i<e;i++){n(i);const e=Date.now()-o;e>=0&&e<r||(await(0,t.nextTick)(),o+=e)}},t.utf8ToBytes=i,t.toBytes=s,t.concatBytes=function(...e){if(!e.every((e=>e instanceof Uint8Array)))throw new Error("Uint8Array list expected");if(1===e.length)return e[0];const t=e.reduce(((e,t)=>e+t.length),0),r=new Uint8Array(t);for(let t=0,n=0;t<e.length;t++){const o=e[t];r.set(o,n),n+=o.length}return r},t.Hash=class{clone(){return this._cloneInto()}},t.checkOpts=function(e,t){if(void 0!==t&&("object"!=typeof t||(r=t,"[object Object]"!==Object.prototype.toString.call(r)||r.constructor!==Object)))throw new TypeError("Options should be object or undefined");var r;return Object.assign(e,t)},t.wrapConstructor=function(e){const t=t=>e().update(s(t)).digest(),r=e();return t.outputLen=r.outputLen,t.blockLen=r.blockLen,t.create=()=>e(),t},t.wrapConstructorWithOpts=function(e){const t=(t,r)=>e(r).update(s(t)).digest(),r=e({});return t.outputLen=r.outputLen,t.blockLen=r.blockLen,t.create=t=>e(t),t},t.randomBytes=function(e=32){if(n.crypto&&"function"==typeof n.crypto.getRandomValues)return n.crypto.getRandomValues(new Uint8Array(e));throw new Error("crypto.getRandomValues must be defined")}},3072:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.decrypt=t.encrypt=void 0;const n=r(9043),o=r(6540),i={web:n.crypto};function s(e,t,r){if(!r.startsWith("aes-"))throw new Error(`AES submodule doesn't support mode ${r}`);if(16!==t.length)throw new Error("AES: wrong IV length");if(r.startsWith("aes-128")&&16!==e.length||r.startsWith("aes-256")&&32!==e.length)throw new Error("AES: wrong key length")}async function a(e,t,r){if(!i.web)throw new Error("Browser crypto not available.");let n;if(["aes-128-cbc","aes-256-cbc"].includes(e)&&(n="cbc"),["aes-128-ctr","aes-256-ctr"].includes(e)&&(n="ctr"),!n)throw new Error("AES: unsupported mode");return[await i.web.subtle.importKey("raw",t,{name:`AES-${n.toUpperCase()}`,length:8*t.length},!0,["encrypt","decrypt"]),{name:`aes-${n}`,iv:r,counter:r,length:128}]}async function c(e,t,r,n="aes-128-ctr",c=!0){if(s(t,r,n),i.web){const[o,s]=await a(n,t,r),u=await i.web.subtle.encrypt(s,o,e);let d=new Uint8Array(u);return c||"aes-cbc"!==s.name||e.length%16||(d=d.slice(0,-16)),d}if(i.node){const s=i.node.createCipheriv(n,t,r);return s.setAutoPadding(c),(0,o.concatBytes)(s.update(e),s.final())}throw new Error("The environment doesn't have AES module")}t.encrypt=c,t.decrypt=async function(e,t,r,n="aes-128-ctr",u=!0){if(s(t,r,n),i.web){const[s,d]=await a(n,t,r);if(!u&&"aes-cbc"===d.name){const i=await async function(e,t,r,n){const o=e.slice(-16);for(let e=0;e<16;e++)o[e]^=16^r[e];return(await c(o,t,r,n)).slice(0,16)}(e,t,r,n);e=(0,o.concatBytes)(e,i)}const l=await i.web.subtle.decrypt(d,s,e),h=new Uint8Array(l);if("aes-cbc"===d.name){const i=await c(h,t,r,n);if(!(0,o.equalsBytes)(i,e))throw new Error("AES: wrong padding")}return h}if(i.node){const s=i.node.createDecipheriv(n,t,r);return s.setAutoPadding(u),(0,o.concatBytes)(s.update(e),s.final())}throw new Error("The environment doesn't have AES module")}},7423:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.keccak512=t.keccak384=t.keccak256=t.keccak224=void 0;const n=r(1366),o=r(6540);t.keccak224=(0,o.wrapHash)(n.keccak_224),t.keccak256=(()=>{const e=(0,o.wrapHash)(n.keccak_256);return e.create=n.keccak_256.create,e})(),t.keccak384=(0,o.wrapHash)(n.keccak_384),t.keccak512=(0,o.wrapHash)(n.keccak_512)},8109:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.pbkdf2Sync=t.pbkdf2=void 0;const n=r(8797),o=r(8091),i=r(8578),s=r(6540);t.pbkdf2=async function(e,t,r,a,c){if(!["sha256","sha512"].includes(c))throw new Error("Only sha256 and sha512 are supported");return(0,s.assertBytes)(e),(0,s.assertBytes)(t),(0,n.pbkdf2Async)("sha256"===c?o.sha256:i.sha512,e,t,{c:r,dkLen:a})},t.pbkdf2Sync=function(e,t,r,a,c){if(!["sha256","sha512"].includes(c))throw new Error("Only sha256 and sha512 are supported");return(0,s.assertBytes)(e),(0,s.assertBytes)(t),(0,n.pbkdf2)("sha256"===c?o.sha256:i.sha512,e,t,{c:r,dkLen:a})}},7002:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.scryptSync=t.scrypt=void 0;const n=r(217),o=r(6540);t.scrypt=async function(e,t,r,i,s,a,c){return(0,o.assertBytes)(e),(0,o.assertBytes)(t),(0,n.scryptAsync)(e,t,{N:r,r:s,p:i,dkLen:a,onProgress:c})},t.scryptSync=function(e,t,r,i,s,a,c){return(0,o.assertBytes)(e),(0,o.assertBytes)(t),(0,n.scrypt)(e,t,{N:r,r:s,p:i,dkLen:a,onProgress:c})}},5473:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.secp256k1=void 0;var n=r(8358);Object.defineProperty(t,"secp256k1",{enumerable:!0,get:function(){return n.secp256k1}})},6540:function(e,t,r){"use strict";e=r.nmd(e);var n=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.crypto=t.wrapHash=t.equalsBytes=t.hexToBytes=t.bytesToUtf8=t.utf8ToBytes=t.createView=t.concatBytes=t.toHex=t.bytesToHex=t.assertBytes=t.assertBool=void 0;const o=n(r(4530)),i=r(2071),s=o.default.bool;t.assertBool=s;const a=o.default.bytes;t.assertBytes=a;var c=r(2071);Object.defineProperty(t,"bytesToHex",{enumerable:!0,get:function(){return c.bytesToHex}}),Object.defineProperty(t,"toHex",{enumerable:!0,get:function(){return c.bytesToHex}}),Object.defineProperty(t,"concatBytes",{enumerable:!0,get:function(){return c.concatBytes}}),Object.defineProperty(t,"createView",{enumerable:!0,get:function(){return c.createView}}),Object.defineProperty(t,"utf8ToBytes",{enumerable:!0,get:function(){return c.utf8ToBytes}}),t.bytesToUtf8=function(e){if(!(e instanceof Uint8Array))throw new TypeError("bytesToUtf8 expected Uint8Array, got "+typeof e);return(new TextDecoder).decode(e)},t.hexToBytes=function(e){const t=e.startsWith("0x")?e.substring(2):e;return(0,i.hexToBytes)(t)},t.equalsBytes=function(e,t){if(e.length!==t.length)return!1;for(let r=0;r<e.length;r++)if(e[r]!==t[r])return!1;return!0},t.wrapHash=function(e){return t=>(o.default.bytes(t),e(t))},t.crypto=(()=>{const t="object"==typeof self&&"crypto"in self?self.crypto:void 0,r="function"==typeof e.require&&e.require.bind(e);return{node:r&&!t?r("crypto"):void 0,web:t}})()},8989:(e,t)=>{"use strict";function r(e){if(!Number.isSafeInteger(e)||e<0)throw new Error(`Wrong positive integer: ${e}`)}function n(e){if("boolean"!=typeof e)throw new Error(`Expected boolean, not ${e}`)}function o(e,...t){if(!(e instanceof Uint8Array))throw new TypeError("Expected Uint8Array");if(t.length>0&&!t.includes(e.length))throw new TypeError(`Expected Uint8Array of length ${t}, not of length=${e.length}`)}function i(e){if("function"!=typeof e||"function"!=typeof e.create)throw new Error("Hash should be wrapped by utils.wrapConstructor");r(e.outputLen),r(e.blockLen)}function s(e,t=!0){if(e.destroyed)throw new Error("Hash instance has been destroyed");if(t&&e.finished)throw new Error("Hash#digest() has already been called")}function a(e,t){o(e);const r=t.outputLen;if(e.length<r)throw new Error(`digestInto() expects output buffer of length at least ${r}`)}Object.defineProperty(t,"__esModule",{value:!0}),t.output=t.exists=t.hash=t.bytes=t.bool=t.number=void 0,t.number=r,t.bool=n,t.bytes=o,t.hash=i,t.exists=s,t.output=a;const c={number:r,bool:n,bytes:o,hash:i,exists:s,output:a};t.default=c},7889:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.add=t.toBig=t.split=t.fromBig=void 0;const r=BigInt(2**32-1),n=BigInt(32);function o(e,t=!1){return t?{h:Number(e&r),l:Number(e>>n&r)}:{h:0|Number(e>>n&r),l:0|Number(e&r)}}function i(e,t=!1){let r=new Uint32Array(e.length),n=new Uint32Array(e.length);for(let i=0;i<e.length;i++){const{h:s,l:a}=o(e[i],t);[r[i],n[i]]=[s,a]}return[r,n]}function s(e,t,r,n){const o=(t>>>0)+(n>>>0);return{h:e+r+(o/2**32|0)|0,l:0|o}}t.fromBig=o,t.split=i,t.toBig=(e,t)=>BigInt(e>>>0)<<n|BigInt(t>>>0),t.add=s;const a={fromBig:o,split:i,toBig:t.toBig,shrSH:(e,t,r)=>e>>>r,shrSL:(e,t,r)=>e<<32-r|t>>>r,rotrSH:(e,t,r)=>e>>>r|t<<32-r,rotrSL:(e,t,r)=>e<<32-r|t>>>r,rotrBH:(e,t,r)=>e<<64-r|t>>>r-32,rotrBL:(e,t,r)=>e>>>r-32|t<<64-r,rotr32H:(e,t)=>t,rotr32L:(e,t)=>e,rotlSH:(e,t,r)=>e<<r|t>>>32-r,rotlSL:(e,t,r)=>t<<r|e>>>32-r,rotlBH:(e,t,r)=>t<<r-32|e>>>64-r,rotlBL:(e,t,r)=>e<<r-32|t>>>64-r,add:s,add3L:(e,t,r)=>(e>>>0)+(t>>>0)+(r>>>0),add3H:(e,t,r,n)=>t+r+n+(e/2**32|0)|0,add4L:(e,t,r,n)=>(e>>>0)+(t>>>0)+(r>>>0)+(n>>>0),add4H:(e,t,r,n,o)=>t+r+n+o+(e/2**32|0)|0,add5H:(e,t,r,n,o,i)=>t+r+n+o+i+(e/2**32|0)|0,add5L:(e,t,r,n,o)=>(e>>>0)+(t>>>0)+(r>>>0)+(n>>>0)+(o>>>0)};t.default=a},4318:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.crypto=void 0,t.crypto="object"==typeof globalThis&&"crypto"in globalThis?globalThis.crypto:void 0},5179:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.shake256=t.shake128=t.keccak_512=t.keccak_384=t.keccak_256=t.keccak_224=t.sha3_512=t.sha3_384=t.sha3_256=t.sha3_224=t.Keccak=t.keccakP=void 0;const n=r(8989),o=r(7889),i=r(2263),[s,a,c]=[[],[],[]],u=BigInt(0),d=BigInt(1),l=BigInt(2),h=BigInt(7),f=BigInt(256),p=BigInt(113);for(let e=0,t=d,r=1,n=0;e<24;e++){[r,n]=[n,(2*r+3*n)%5],s.push(2*(5*n+r)),a.push((e+1)*(e+2)/2%64);let o=u;for(let e=0;e<7;e++)t=(t<<d^(t>>h)*p)%f,t&l&&(o^=d<<(d<<BigInt(e))-d);c.push(o)}const[m,g]=o.default.split(c,!0),y=(e,t,r)=>r>32?o.default.rotlBH(e,t,r):o.default.rotlSH(e,t,r),v=(e,t,r)=>r>32?o.default.rotlBL(e,t,r):o.default.rotlSL(e,t,r);function b(e,t=24){const r=new Uint32Array(10);for(let n=24-t;n<24;n++){for(let t=0;t<10;t++)r[t]=e[t]^e[t+10]^e[t+20]^e[t+30]^e[t+40];for(let t=0;t<10;t+=2){const n=(t+8)%10,o=(t+2)%10,i=r[o],s=r[o+1],a=y(i,s,1)^r[n],c=v(i,s,1)^r[n+1];for(let r=0;r<50;r+=10)e[t+r]^=a,e[t+r+1]^=c}let t=e[2],o=e[3];for(let r=0;r<24;r++){const n=a[r],i=y(t,o,n),c=v(t,o,n),u=s[r];t=e[u],o=e[u+1],e[u]=i,e[u+1]=c}for(let t=0;t<50;t+=10){for(let n=0;n<10;n++)r[n]=e[t+n];for(let n=0;n<10;n++)e[t+n]^=~r[(n+2)%10]&r[(n+4)%10]}e[0]^=m[n],e[1]^=g[n]}r.fill(0)}t.keccakP=b;class E extends i.Hash{constructor(e,t,r,o=!1,s=24){if(super(),this.blockLen=e,this.suffix=t,this.outputLen=r,this.enableXOF=o,this.rounds=s,this.pos=0,this.posOut=0,this.finished=!1,this.destroyed=!1,n.default.number(r),0>=this.blockLen||this.blockLen>=200)throw new Error("Sha3 supports only keccak-f1600 function");this.state=new Uint8Array(200),this.state32=(0,i.u32)(this.state)}keccak(){b(this.state32,this.rounds),this.posOut=0,this.pos=0}update(e){n.default.exists(this);const{blockLen:t,state:r}=this,o=(e=(0,i.toBytes)(e)).length;for(let n=0;n<o;){const i=Math.min(t-this.pos,o-n);for(let t=0;t<i;t++)r[this.pos++]^=e[n++];this.pos===t&&this.keccak()}return this}finish(){if(this.finished)return;this.finished=!0;const{state:e,suffix:t,pos:r,blockLen:n}=this;e[r]^=t,0!=(128&t)&&r===n-1&&this.keccak(),e[n-1]^=128,this.keccak()}writeInto(e){n.default.exists(this,!1),n.default.bytes(e),this.finish();const t=this.state,{blockLen:r}=this;for(let n=0,o=e.length;n<o;){this.posOut>=r&&this.keccak();const i=Math.min(r-this.posOut,o-n);e.set(t.subarray(this.posOut,this.posOut+i),n),this.posOut+=i,n+=i}return e}xofInto(e){if(!this.enableXOF)throw new Error("XOF is not possible for this instance");return this.writeInto(e)}xof(e){return n.default.number(e),this.xofInto(new Uint8Array(e))}digestInto(e){if(n.default.output(e,this),this.finished)throw new Error("digest() was already called");return this.writeInto(e),this.destroy(),e}digest(){return this.digestInto(new Uint8Array(this.outputLen))}destroy(){this.destroyed=!0,this.state.fill(0)}_cloneInto(e){const{blockLen:t,suffix:r,outputLen:n,rounds:o,enableXOF:i}=this;return e||(e=new E(t,r,n,i,o)),e.state32.set(this.state32),e.pos=this.pos,e.posOut=this.posOut,e.finished=this.finished,e.rounds=o,e.suffix=r,e.outputLen=n,e.enableXOF=i,e.destroyed=this.destroyed,e}}t.Keccak=E;const _=(e,t,r)=>(0,i.wrapConstructor)((()=>new E(t,e,r)));t.sha3_224=_(6,144,28),t.sha3_256=_(6,136,32),t.sha3_384=_(6,104,48),t.sha3_512=_(6,72,64),t.keccak_224=_(1,144,28),t.keccak_256=_(1,136,32),t.keccak_384=_(1,104,48),t.keccak_512=_(1,72,64);const A=(e,t,r)=>(0,i.wrapConstructorWithOpts)(((n={})=>new E(t,e,void 0===n.dkLen?r:n.dkLen,!0)));t.shake128=A(31,168,16),t.shake256=A(31,136,32)},2263:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.randomBytes=t.wrapConstructorWithOpts=t.wrapConstructor=t.checkOpts=t.Hash=t.concatBytes=t.toBytes=t.utf8ToBytes=t.asyncLoop=t.nextTick=t.hexToBytes=t.bytesToHex=t.isLE=t.rotr=t.createView=t.u32=t.u8=void 0;const n=r(4318);if(t.u8=e=>new Uint8Array(e.buffer,e.byteOffset,e.byteLength),t.u32=e=>new Uint32Array(e.buffer,e.byteOffset,Math.floor(e.byteLength/4)),t.createView=e=>new DataView(e.buffer,e.byteOffset,e.byteLength),t.rotr=(e,t)=>e<<32-t|e>>>t,t.isLE=68===new Uint8Array(new Uint32Array([287454020]).buffer)[0],!t.isLE)throw new Error("Non little-endian hardware is not supported");const o=Array.from({length:256},((e,t)=>t.toString(16).padStart(2,"0")));function i(e){if("string"!=typeof e)throw new TypeError("utf8ToBytes expected string, got "+typeof e);return(new TextEncoder).encode(e)}function s(e){if("string"==typeof e&&(e=i(e)),!(e instanceof Uint8Array))throw new TypeError(`Expected input type is Uint8Array (got ${typeof e})`);return e}t.bytesToHex=function(e){if(!(e instanceof Uint8Array))throw new Error("Uint8Array expected");let t="";for(let r=0;r<e.length;r++)t+=o[e[r]];return t},t.hexToBytes=function(e){if("string"!=typeof e)throw new TypeError("hexToBytes: expected string, got "+typeof e);if(e.length%2)throw new Error("hexToBytes: received invalid unpadded hex");const t=new Uint8Array(e.length/2);for(let r=0;r<t.length;r++){const n=2*r,o=e.slice(n,n+2),i=Number.parseInt(o,16);if(Number.isNaN(i)||i<0)throw new Error("Invalid byte sequence");t[r]=i}return t},t.nextTick=async()=>{},t.asyncLoop=async function(e,r,n){let o=Date.now();for(let i=0;i<e;i++){n(i);const e=Date.now()-o;e>=0&&e<r||(await(0,t.nextTick)(),o+=e)}},t.utf8ToBytes=i,t.toBytes=s,t.concatBytes=function(...e){if(!e.every((e=>e instanceof Uint8Array)))throw new Error("Uint8Array list expected");if(1===e.length)return e[0];const t=e.reduce(((e,t)=>e+t.length),0),r=new Uint8Array(t);for(let t=0,n=0;t<e.length;t++){const o=e[t];r.set(o,n),n+=o.length}return r},t.Hash=class{clone(){return this._cloneInto()}},t.checkOpts=function(e,t){if(void 0!==t&&("object"!=typeof t||(r=t,"[object Object]"!==Object.prototype.toString.call(r)||r.constructor!==Object)))throw new TypeError("Options should be object or undefined");var r;return Object.assign(e,t)},t.wrapConstructor=function(e){const t=t=>e().update(s(t)).digest(),r=e();return t.outputLen=r.outputLen,t.blockLen=r.blockLen,t.create=()=>e(),t},t.wrapConstructorWithOpts=function(e){const t=(t,r)=>e(r).update(s(t)).digest(),r=e({});return t.outputLen=r.outputLen,t.blockLen=r.blockLen,t.create=t=>e(t),t},t.randomBytes=function(e=32){if(n.crypto&&"function"==typeof n.crypto.getRandomValues)return n.crypto.getRandomValues(new Uint8Array(e));throw new Error("crypto.getRandomValues must be defined")}},3687:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.keccak512=t.keccak384=t.keccak256=t.keccak224=void 0;const n=r(5179),o=r(5487);t.keccak224=(0,o.wrapHash)(n.keccak_224),t.keccak256=(()=>{const e=(0,o.wrapHash)(n.keccak_256);return e.create=n.keccak_256.create,e})(),t.keccak384=(0,o.wrapHash)(n.keccak_384),t.keccak512=(0,o.wrapHash)(n.keccak_512)},1341:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getRandomBytes=t.getRandomBytesSync=void 0;const n=r(2263);t.getRandomBytesSync=function(e){return(0,n.randomBytes)(e)},t.getRandomBytes=async function(e){return(0,n.randomBytes)(e)}},5487:function(e,t,r){"use strict";e=r.nmd(e);var n=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.crypto=t.wrapHash=t.equalsBytes=t.hexToBytes=t.bytesToUtf8=t.utf8ToBytes=t.createView=t.concatBytes=t.toHex=t.bytesToHex=t.assertBytes=t.assertBool=void 0;const o=n(r(8989)),i=r(2263),s=o.default.bool;t.assertBool=s;const a=o.default.bytes;t.assertBytes=a;var c=r(2263);Object.defineProperty(t,"bytesToHex",{enumerable:!0,get:function(){return c.bytesToHex}}),Object.defineProperty(t,"toHex",{enumerable:!0,get:function(){return c.bytesToHex}}),Object.defineProperty(t,"concatBytes",{enumerable:!0,get:function(){return c.concatBytes}}),Object.defineProperty(t,"createView",{enumerable:!0,get:function(){return c.createView}}),Object.defineProperty(t,"utf8ToBytes",{enumerable:!0,get:function(){return c.utf8ToBytes}}),t.bytesToUtf8=function(e){if(!(e instanceof Uint8Array))throw new TypeError("bytesToUtf8 expected Uint8Array, got "+typeof e);return(new TextDecoder).decode(e)},t.hexToBytes=function(e){const t=e.startsWith("0x")?e.substring(2):e;return(0,i.hexToBytes)(t)},t.equalsBytes=function(e,t){if(e.length!==t.length)return!1;for(let r=0;r<e.length;r++)if(e[r]!==t[r])return!1;return!0},t.wrapHash=function(e){return t=>(o.default.bytes(t),e(t))},t.crypto=(()=>{const t="object"==typeof self&&"crypto"in self?self.crypto:void 0,r="function"==typeof e.require&&e.require.bind(e);return{node:r&&!t?r("crypto"):void 0,web:t}})()},9386:e=>{"use strict";var t=Object.prototype.hasOwnProperty,r="~";function n(){}function o(e,t,r){this.fn=e,this.context=t,this.once=r||!1}function i(e,t,n,i,s){if("function"!=typeof n)throw new TypeError("The listener must be a function");var a=new o(n,i||e,s),c=r?r+t:t;return e._events[c]?e._events[c].fn?e._events[c]=[e._events[c],a]:e._events[c].push(a):(e._events[c]=a,e._eventsCount++),e}function s(e,t){0==--e._eventsCount?e._events=new n:delete e._events[t]}function a(){this._events=new n,this._eventsCount=0}Object.create&&(n.prototype=Object.create(null),(new n).__proto__||(r=!1)),a.prototype.eventNames=function(){var e,n,o=[];if(0===this._eventsCount)return o;for(n in e=this._events)t.call(e,n)&&o.push(r?n.slice(1):n);return Object.getOwnPropertySymbols?o.concat(Object.getOwnPropertySymbols(e)):o},a.prototype.listeners=function(e){var t=r?r+e:e,n=this._events[t];if(!n)return[];if(n.fn)return[n.fn];for(var o=0,i=n.length,s=new Array(i);o<i;o++)s[o]=n[o].fn;return s},a.prototype.listenerCount=function(e){var t=r?r+e:e,n=this._events[t];return n?n.fn?1:n.length:0},a.prototype.emit=function(e,t,n,o,i,s){var a=r?r+e:e;if(!this._events[a])return!1;var c,u,d=this._events[a],l=arguments.length;if(d.fn){switch(d.once&&this.removeListener(e,d.fn,void 0,!0),l){case 1:return d.fn.call(d.context),!0;case 2:return d.fn.call(d.context,t),!0;case 3:return d.fn.call(d.context,t,n),!0;case 4:return d.fn.call(d.context,t,n,o),!0;case 5:return d.fn.call(d.context,t,n,o,i),!0;case 6:return d.fn.call(d.context,t,n,o,i,s),!0}for(u=1,c=new Array(l-1);u<l;u++)c[u-1]=arguments[u];d.fn.apply(d.context,c)}else{var h,f=d.length;for(u=0;u<f;u++)switch(d[u].once&&this.removeListener(e,d[u].fn,void 0,!0),l){case 1:d[u].fn.call(d[u].context);break;case 2:d[u].fn.call(d[u].context,t);break;case 3:d[u].fn.call(d[u].context,t,n);break;case 4:d[u].fn.call(d[u].context,t,n,o);break;default:if(!c)for(h=1,c=new Array(l-1);h<l;h++)c[h-1]=arguments[h];d[u].fn.apply(d[u].context,c)}}return!0},a.prototype.on=function(e,t,r){return i(this,e,t,r,!1)},a.prototype.once=function(e,t,r){return i(this,e,t,r,!0)},a.prototype.removeListener=function(e,t,n,o){var i=r?r+e:e;if(!this._events[i])return this;if(!t)return s(this,i),this;var a=this._events[i];if(a.fn)a.fn!==t||o&&!a.once||n&&a.context!==n||s(this,i);else{for(var c=0,u=[],d=a.length;c<d;c++)(a[c].fn!==t||o&&!a[c].once||n&&a[c].context!==n)&&u.push(a[c]);u.length?this._events[i]=1===u.length?u[0]:u:s(this,i)}return this},a.prototype.removeAllListeners=function(e){var t;return e?(t=r?r+e:e,this._events[t]&&s(this,t)):(this._events=new n,this._eventsCount=0),this},a.prototype.off=a.prototype.removeListener,a.prototype.addListener=a.prototype.on,a.prefixed=r,a.EventEmitter=a,e.exports=a},5844:(e,t)=>{"use strict";function r(e){if(!Number.isSafeInteger(e)||e<0)throw new Error(`Wrong positive integer: ${e}`)}function n(e){if("boolean"!=typeof e)throw new Error(`Expected boolean, not ${e}`)}function o(e,...t){if(!(e instanceof Uint8Array))throw new TypeError("Expected Uint8Array");if(t.length>0&&!t.includes(e.length))throw new TypeError(`Expected Uint8Array of length ${t}, not of length=${e.length}`)}function i(e){if("function"!=typeof e||"function"!=typeof e.create)throw new Error("Hash should be wrapped by utils.wrapConstructor");r(e.outputLen),r(e.blockLen)}function s(e,t=!0){if(e.destroyed)throw new Error("Hash instance has been destroyed");if(t&&e.finished)throw new Error("Hash#digest() has already been called")}function a(e,t){o(e);const r=t.outputLen;if(e.length<r)throw new Error(`digestInto() expects output buffer of length at least ${r}`)}Object.defineProperty(t,"__esModule",{value:!0}),t.output=t.exists=t.hash=t.bytes=t.bool=t.number=void 0,t.number=r,t.bool=n,t.bytes=o,t.hash=i,t.exists=s,t.output=a;const c={number:r,bool:n,bytes:o,hash:i,exists:s,output:a};t.default=c},6631:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.add=t.toBig=t.split=t.fromBig=void 0;const r=BigInt(2**32-1),n=BigInt(32);function o(e,t=!1){return t?{h:Number(e&r),l:Number(e>>n&r)}:{h:0|Number(e>>n&r),l:0|Number(e&r)}}function i(e,t=!1){let r=new Uint32Array(e.length),n=new Uint32Array(e.length);for(let i=0;i<e.length;i++){const{h:s,l:a}=o(e[i],t);[r[i],n[i]]=[s,a]}return[r,n]}function s(e,t,r,n){const o=(t>>>0)+(n>>>0);return{h:e+r+(o/2**32|0)|0,l:0|o}}t.fromBig=o,t.split=i,t.toBig=(e,t)=>BigInt(e>>>0)<<n|BigInt(t>>>0),t.add=s;const a={fromBig:o,split:i,toBig:t.toBig,shrSH:(e,t,r)=>e>>>r,shrSL:(e,t,r)=>e<<32-r|t>>>r,rotrSH:(e,t,r)=>e>>>r|t<<32-r,rotrSL:(e,t,r)=>e<<32-r|t>>>r,rotrBH:(e,t,r)=>e<<64-r|t>>>r-32,rotrBL:(e,t,r)=>e>>>r-32|t<<64-r,rotr32H:(e,t)=>t,rotr32L:(e,t)=>e,rotlSH:(e,t,r)=>e<<r|t>>>32-r,rotlSL:(e,t,r)=>t<<r|e>>>32-r,rotlBH:(e,t,r)=>t<<r-32|e>>>64-r,rotlBL:(e,t,r)=>e<<r-32|t>>>64-r,add:s,add3L:(e,t,r)=>(e>>>0)+(t>>>0)+(r>>>0),add3H:(e,t,r,n)=>t+r+n+(e/2**32|0)|0,add4L:(e,t,r,n)=>(e>>>0)+(t>>>0)+(r>>>0)+(n>>>0),add4H:(e,t,r,n,o)=>t+r+n+o+(e/2**32|0)|0,add5H:(e,t,r,n,o,i)=>t+r+n+o+i+(e/2**32|0)|0,add5L:(e,t,r,n,o)=>(e>>>0)+(t>>>0)+(r>>>0)+(n>>>0)+(o>>>0)};t.default=a},4174:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.crypto=void 0,t.crypto="object"==typeof globalThis&&"crypto"in globalThis?globalThis.crypto:void 0},5406:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.shake256=t.shake128=t.keccak_512=t.keccak_384=t.keccak_256=t.keccak_224=t.sha3_512=t.sha3_384=t.sha3_256=t.sha3_224=t.Keccak=t.keccakP=void 0;const n=r(5844),o=r(6631),i=r(2532),[s,a,c]=[[],[],[]],u=BigInt(0),d=BigInt(1),l=BigInt(2),h=BigInt(7),f=BigInt(256),p=BigInt(113);for(let e=0,t=d,r=1,n=0;e<24;e++){[r,n]=[n,(2*r+3*n)%5],s.push(2*(5*n+r)),a.push((e+1)*(e+2)/2%64);let o=u;for(let e=0;e<7;e++)t=(t<<d^(t>>h)*p)%f,t&l&&(o^=d<<(d<<BigInt(e))-d);c.push(o)}const[m,g]=o.default.split(c,!0),y=(e,t,r)=>r>32?o.default.rotlBH(e,t,r):o.default.rotlSH(e,t,r),v=(e,t,r)=>r>32?o.default.rotlBL(e,t,r):o.default.rotlSL(e,t,r);function b(e,t=24){const r=new Uint32Array(10);for(let n=24-t;n<24;n++){for(let t=0;t<10;t++)r[t]=e[t]^e[t+10]^e[t+20]^e[t+30]^e[t+40];for(let t=0;t<10;t+=2){const n=(t+8)%10,o=(t+2)%10,i=r[o],s=r[o+1],a=y(i,s,1)^r[n],c=v(i,s,1)^r[n+1];for(let r=0;r<50;r+=10)e[t+r]^=a,e[t+r+1]^=c}let t=e[2],o=e[3];for(let r=0;r<24;r++){const n=a[r],i=y(t,o,n),c=v(t,o,n),u=s[r];t=e[u],o=e[u+1],e[u]=i,e[u+1]=c}for(let t=0;t<50;t+=10){for(let n=0;n<10;n++)r[n]=e[t+n];for(let n=0;n<10;n++)e[t+n]^=~r[(n+2)%10]&r[(n+4)%10]}e[0]^=m[n],e[1]^=g[n]}r.fill(0)}t.keccakP=b;class E extends i.Hash{constructor(e,t,r,o=!1,s=24){if(super(),this.blockLen=e,this.suffix=t,this.outputLen=r,this.enableXOF=o,this.rounds=s,this.pos=0,this.posOut=0,this.finished=!1,this.destroyed=!1,n.default.number(r),0>=this.blockLen||this.blockLen>=200)throw new Error("Sha3 supports only keccak-f1600 function");this.state=new Uint8Array(200),this.state32=(0,i.u32)(this.state)}keccak(){b(this.state32,this.rounds),this.posOut=0,this.pos=0}update(e){n.default.exists(this);const{blockLen:t,state:r}=this,o=(e=(0,i.toBytes)(e)).length;for(let n=0;n<o;){const i=Math.min(t-this.pos,o-n);for(let t=0;t<i;t++)r[this.pos++]^=e[n++];this.pos===t&&this.keccak()}return this}finish(){if(this.finished)return;this.finished=!0;const{state:e,suffix:t,pos:r,blockLen:n}=this;e[r]^=t,0!=(128&t)&&r===n-1&&this.keccak(),e[n-1]^=128,this.keccak()}writeInto(e){n.default.exists(this,!1),n.default.bytes(e),this.finish();const t=this.state,{blockLen:r}=this;for(let n=0,o=e.length;n<o;){this.posOut>=r&&this.keccak();const i=Math.min(r-this.posOut,o-n);e.set(t.subarray(this.posOut,this.posOut+i),n),this.posOut+=i,n+=i}return e}xofInto(e){if(!this.enableXOF)throw new Error("XOF is not possible for this instance");return this.writeInto(e)}xof(e){return n.default.number(e),this.xofInto(new Uint8Array(e))}digestInto(e){if(n.default.output(e,this),this.finished)throw new Error("digest() was already called");return this.writeInto(e),this.destroy(),e}digest(){return this.digestInto(new Uint8Array(this.outputLen))}destroy(){this.destroyed=!0,this.state.fill(0)}_cloneInto(e){const{blockLen:t,suffix:r,outputLen:n,rounds:o,enableXOF:i}=this;return e||(e=new E(t,r,n,i,o)),e.state32.set(this.state32),e.pos=this.pos,e.posOut=this.posOut,e.finished=this.finished,e.rounds=o,e.suffix=r,e.outputLen=n,e.enableXOF=i,e.destroyed=this.destroyed,e}}t.Keccak=E;const _=(e,t,r)=>(0,i.wrapConstructor)((()=>new E(t,e,r)));t.sha3_224=_(6,144,28),t.sha3_256=_(6,136,32),t.sha3_384=_(6,104,48),t.sha3_512=_(6,72,64),t.keccak_224=_(1,144,28),t.keccak_256=_(1,136,32),t.keccak_384=_(1,104,48),t.keccak_512=_(1,72,64);const A=(e,t,r)=>(0,i.wrapConstructorWithOpts)(((n={})=>new E(t,e,void 0===n.dkLen?r:n.dkLen,!0)));t.shake128=A(31,168,16),t.shake256=A(31,136,32)},2532:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.randomBytes=t.wrapConstructorWithOpts=t.wrapConstructor=t.checkOpts=t.Hash=t.concatBytes=t.toBytes=t.utf8ToBytes=t.asyncLoop=t.nextTick=t.hexToBytes=t.bytesToHex=t.isLE=t.rotr=t.createView=t.u32=t.u8=void 0;const n=r(4174);if(t.u8=e=>new Uint8Array(e.buffer,e.byteOffset,e.byteLength),t.u32=e=>new Uint32Array(e.buffer,e.byteOffset,Math.floor(e.byteLength/4)),t.createView=e=>new DataView(e.buffer,e.byteOffset,e.byteLength),t.rotr=(e,t)=>e<<32-t|e>>>t,t.isLE=68===new Uint8Array(new Uint32Array([287454020]).buffer)[0],!t.isLE)throw new Error("Non little-endian hardware is not supported");const o=Array.from({length:256},((e,t)=>t.toString(16).padStart(2,"0")));function i(e){if("string"!=typeof e)throw new TypeError("utf8ToBytes expected string, got "+typeof e);return(new TextEncoder).encode(e)}function s(e){if("string"==typeof e&&(e=i(e)),!(e instanceof Uint8Array))throw new TypeError(`Expected input type is Uint8Array (got ${typeof e})`);return e}t.bytesToHex=function(e){if(!(e instanceof Uint8Array))throw new Error("Uint8Array expected");let t="";for(let r=0;r<e.length;r++)t+=o[e[r]];return t},t.hexToBytes=function(e){if("string"!=typeof e)throw new TypeError("hexToBytes: expected string, got "+typeof e);if(e.length%2)throw new Error("hexToBytes: received invalid unpadded hex");const t=new Uint8Array(e.length/2);for(let r=0;r<t.length;r++){const n=2*r,o=e.slice(n,n+2),i=Number.parseInt(o,16);if(Number.isNaN(i)||i<0)throw new Error("Invalid byte sequence");t[r]=i}return t},t.nextTick=async()=>{},t.asyncLoop=async function(e,r,n){let o=Date.now();for(let i=0;i<e;i++){n(i);const e=Date.now()-o;e>=0&&e<r||(await(0,t.nextTick)(),o+=e)}},t.utf8ToBytes=i,t.toBytes=s,t.concatBytes=function(...e){if(!e.every((e=>e instanceof Uint8Array)))throw new Error("Uint8Array list expected");if(1===e.length)return e[0];const t=e.reduce(((e,t)=>e+t.length),0),r=new Uint8Array(t);for(let t=0,n=0;t<e.length;t++){const o=e[t];r.set(o,n),n+=o.length}return r},t.Hash=class{clone(){return this._cloneInto()}},t.checkOpts=function(e,t){if(void 0!==t&&("object"!=typeof t||(r=t,"[object Object]"!==Object.prototype.toString.call(r)||r.constructor!==Object)))throw new TypeError("Options should be object or undefined");var r;return Object.assign(e,t)},t.wrapConstructor=function(e){const t=t=>e().update(s(t)).digest(),r=e();return t.outputLen=r.outputLen,t.blockLen=r.blockLen,t.create=()=>e(),t},t.wrapConstructorWithOpts=function(e){const t=(t,r)=>e(r).update(s(t)).digest(),r=e({});return t.outputLen=r.outputLen,t.blockLen=r.blockLen,t.create=t=>e(t),t},t.randomBytes=function(e=32){if(n.crypto&&"function"==typeof n.crypto.getRandomValues)return n.crypto.getRandomValues(new Uint8Array(e));throw new Error("crypto.getRandomValues must be defined")}},4488:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.keccak512=t.keccak384=t.keccak256=t.keccak224=void 0;const n=r(5406),o=r(7737);t.keccak224=(0,o.wrapHash)(n.keccak_224),t.keccak256=(()=>{const e=(0,o.wrapHash)(n.keccak_256);return e.create=n.keccak_256.create,e})(),t.keccak384=(0,o.wrapHash)(n.keccak_384),t.keccak512=(0,o.wrapHash)(n.keccak_512)},7737:function(e,t,r){"use strict";e=r.nmd(e);var n=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.crypto=t.wrapHash=t.equalsBytes=t.hexToBytes=t.bytesToUtf8=t.utf8ToBytes=t.createView=t.concatBytes=t.toHex=t.bytesToHex=t.assertBytes=t.assertBool=void 0;const o=n(r(5844)),i=r(2532),s=o.default.bool;t.assertBool=s;const a=o.default.bytes;t.assertBytes=a;var c=r(2532);Object.defineProperty(t,"bytesToHex",{enumerable:!0,get:function(){return c.bytesToHex}}),Object.defineProperty(t,"toHex",{enumerable:!0,get:function(){return c.bytesToHex}}),Object.defineProperty(t,"concatBytes",{enumerable:!0,get:function(){return c.concatBytes}}),Object.defineProperty(t,"createView",{enumerable:!0,get:function(){return c.createView}}),Object.defineProperty(t,"utf8ToBytes",{enumerable:!0,get:function(){return c.utf8ToBytes}}),t.bytesToUtf8=function(e){if(!(e instanceof Uint8Array))throw new TypeError("bytesToUtf8 expected Uint8Array, got "+typeof e);return(new TextDecoder).decode(e)},t.hexToBytes=function(e){const t=e.startsWith("0x")?e.substring(2):e;return(0,i.hexToBytes)(t)},t.equalsBytes=function(e,t){if(e.length!==t.length)return!1;for(let r=0;r<e.length;r++)if(e[r]!==t[r])return!1;return!0},t.wrapHash=function(e){return t=>(o.default.bytes(t),e(t))},t.crypto=(()=>{const t="object"==typeof self&&"crypto"in self?self.crypto:void 0,r="function"==typeof e.require&&e.require.bind(e);return{node:r&&!t?r("crypto"):void 0,web:t}})()},6608:(e,t)=>{"use strict";function r(e){return function(e){let t=0;return()=>e[t++]}(function(e){let t=0;function r(){return e[t++]<<8|e[t++]}let n=r(),o=1,i=[0,1];for(let e=1;e<n;e++)i.push(o+=r());let s=r(),a=t;t+=s;let c=0,u=0;function d(){return 0==c&&(u=u<<8|e[t++],c=8),u>>--c&1}const l=2**31,h=l>>>1,f=l-1;let p=0;for(let e=0;e<31;e++)p=p<<1|d();let m=[],g=0,y=l;for(;;){let e=Math.floor(((p-g+1)*o-1)/y),t=0,r=n;for(;r-t>1;){let n=t+r>>>1;e<i[n]?r=n:t=n}if(0==t)break;m.push(t);let s=g+Math.floor(y*i[t]/o),a=g+Math.floor(y*i[t+1]/o)-1;for(;0==((s^a)&h);)p=p<<1&f|d(),s=s<<1&f,a=a<<1&f|1;for(;s&~a&536870912;)p=p&h|p<<1&f>>>1|d(),s=s<<1^h,a=(a^h)<<1|h|1;g=s,y=1+a-s}let v=n-4;return m.map((t=>{switch(t-v){case 3:return v+65792+(e[a++]<<16|e[a++]<<8|e[a++]);case 2:return v+256+(e[a++]<<8|e[a++]);case 1:return v+e[a++];default:return t-1}}))}(function(e){let t=[];[..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"].forEach(((e,r)=>t[e.charCodeAt(0)]=r));let r=e.length,n=new Uint8Array(6*r>>3);for(let o=0,i=0,s=0,a=0;o<r;o++)a=a<<6|t[e.charCodeAt(o)],s+=6,s>=8&&(n[i++]=a>>(s-=8));return n}(e)))}function n(e){return 1&e?~e>>1:e>>1}function o(e,t){let r=Array(e);for(let o=0,i=0;o<e;o++)r[o]=i+=n(t());return r}function i(e,t=0){let r=[];for(;;){let n=e(),o=e();if(!o)break;t+=n;for(let e=0;e<o;e++)r.push(t+e);t+=o+1}return r}function s(e){return c((()=>{let t=i(e);if(t.length)return t}))}function a(e){let t=[];for(;;){let r=e();if(0==r)break;t.push(d(r,e))}for(;;){let r=e()-1;if(r<0)break;t.push(l(r,e))}return t.flat()}function c(e){let t=[];for(;;){let r=e(t.length);if(!r)break;t.push(r)}return t}function u(e,t,r){let n=Array(e).fill().map((()=>[]));for(let i=0;i<t;i++)o(e,r).forEach(((e,t)=>n[t].push(e)));return n}function d(e,t){let r=1+t(),n=t(),o=c(t);return u(o.length,1+e,t).flatMap(((e,t)=>{let[i,...s]=e;return Array(o[t]).fill().map(((e,t)=>{let o=t*n;return[i+t*r,s.map((e=>e+o))]}))}))}function l(e,t){return u(1+t(),1+e,t).map((e=>[e[0],e.slice(1)]))}Object.defineProperty(t,"__esModule",{value:!0});var h=r("AEIRrQh1DccBuQJ+APkBMQDiASoAnADQAHQAngBmANQAaACKAEQAgwBJAHcAOQA9ACoANQAmAGMAHgAvACgAJQAWACwAGQAjAB8ALwAVACgAEQAdAAkAHAARABgAFwA7ACcALAAtADcAEwApABAAHQAfABAAGAAeABsAFwAUBLoF3QEXE7k3ygXaALgArkYBbgCsCAPMAK6GNjY2NjFiAQ0ODBDyAAQHRgbrOAVeBV8APTI5B/a9GAUNz8gAFQPPBeelYALMCjYCjqgCht8/lW+QAsXSAoP5ASbmEADytAFIAjSUCkaWAOoA6QocAB7bwM8TEkSkBCJ+AQQCQBjED/IQBjDwDASIbgwDxAeuBzQAsgBwmO+snIYAYgaaAioG8AAiAEIMmhcCqgLKQiDWCMIwA7gCFAIA9zRyqgCohB8AHgQsAt4dASQAwBnUBQEQIFM+CZ4JjyUiIVbATOqDSQAaABMAHAAVclsAKAAVAE71HN89+gI5X8qc5jUKFyRfVAJfPfMAGgATABwAFXIgY0CeAMPyACIAQAzMFsKqAgHavwViBekC0KYCxLcCClMjpGwUehp0TPwAwhRuAugAEjQ0kBfQmAKBggETIgDEFG4C6AASNAFPUCyYTBEDLgIFMBDecB60Ad5KAHgyEn4COBYoAy4uwD5yAEDoAfwsAM4OqLwBImqIALgMAAwCAIraUAUi3HIeAKgu2AGoBgYGBgYrNAOiAG4BCiA+9Dd7BB8eALEBzgIoAgDmMhJ6OvpQtzOoLjVPBQAGAS4FYAVftr8FcDtkQhlBWEiee5pmZqH/EhoDzA4s+H4qBKpSAlpaAnwisi4BlqqsPGIDTB4EimgQANgCBrJGNioCBzACQGQAcgFoJngAiiQgAJwBUL4ALnAeAbbMAz40KEoEWgF2YAZsAmwA+FAeAzAIDABQSACyAABkAHoAMrwGDvr2IJSGBgAQKAAwALoiTgHYAeIOEjiXf4HvABEAGAA7AEQAPzp3gNrHEGYQYwgFTRBMc0EVEgKzD60L7BEcDNgq0tPfADSwB/IDWgfyA1oDWgfyB/IDWgfyA1oDWgNaA1ocEfAh2scQZg9PBHQFlQWSBN0IiiZQEYgHLwjZVBR0JRxOA0wBAyMsSSM7mjMSJUlME00KCAM2SWyufT8DTjGyVPyQqQPSMlY5cwgFHngSpwAxD3ojNbxOhXpOcacKUk+1tYZJaU5uAsU6rz//CigJmm/Cd1UGRBAeJ6gQ+gw2AbgBPg3wS9sE9AY+BMwfgBkcD9CVnwioLeAM8CbmLqSAXSP4KoYF8Ev3POALUFFrD1wLaAnmOmaBUQMkARAijgrgDTwIcBD2CsxuDegRSAc8A9hJnQCoBwQLFB04FbgmE2KvCww5egb+GvkLkiayEyx6/wXWGiQGUAEsGwIA0i7qhbNaNFwfT2IGBgsoI8oUq1AjDShAunhLGh4HGCWsApRDc0qKUTkeliH5PEANaS4WUX8H+DwIGVILhDyhRq5FERHVPpA9SyJMTC8EOIIsMieOCdIPiAy8fHUBXAkkCbQMdBM0ERo3yAg8BxwwlycnGAgkRphgnQT6ogP2E9QDDgVCCUQHFgO4HDATMRUsBRCBJ9oC9jbYLrYCklaDARoFzg8oH+IQU0fjDuwIngJoA4Yl7gAwFSQAGiKeCEZmAGKP21MILs4IympvI3cDahTqZBF2B5QOWgeqHDYVwhzkcMteDoYLKKayCV4BeAmcAWIE5ggMNV6MoyBEZ1aLWxieIGRBQl3/AjQMaBWiRMCHewKOD24SHgE4AXYHPA0EAnoR8BFuEJgI7oYHNbgz+zooBFIhhiAUCioDUmzRCyom/Az7bAGmEmUDDzRAd/FnrmC5JxgABxwyyEFjIfQLlU/QDJ8axBhFVDEZ5wfCA/Ya9iftQVoGAgOmBhY6UDPxBMALbAiOCUIATA6mGgfaGG0KdIzTATSOAbqcA1qUhgJykgY6Bw4Aag6KBXzoACACqgimAAgA0gNaADwCsAegABwAiEQBQAMqMgEk6AKSA5YINM4BmDIB9iwEHsYMGAD6Om5NAsO0AoBtZqUF4FsCkQJMOAFQKAQIUUpUA7J05ADeAE4GFuJKARiuTc4d5kYB4nIuAMoA/gAIOAcIRAHQAfZwALoBYgs0CaW2uAFQ7CwAhgAYbgHaAowA4AA4AIL0AVYAUAVc/AXWAlJMARQ0Gy5aZAG+AyIBNgEQAHwGzpCozAoiBHAH1gIQHhXkAu8xB7gEAyLiE9BCyAK94VgAMhkKOwqqCqlgXmM2CTR1PVMAER+rPso/UQVUO1Y7WztWO1s7VjtbO1Y7WztWO1sDmsLlwuUKb19IYe4MqQ3XRMs6TBPeYFRgNRPLLboUxBXRJVkZQBq/Jwgl51UMDwct1mYzCC80eBe/AEIpa4NEY4keMwpOHOpTlFT7LR4AtEulM7INrxsYREMFSnXwYi0WEQolAmSEAmJFXlCyAF43IwKh+gJomwJmDAKfhzgeDgJmPgJmKQRxBIIDfxYDfpU5CTl6GjmFOiYmAmwgAjI5OA0CbcoCbbHyjQI2akguAWoA4QDkAE0IB5sMkAEBDsUAELgCdzICdqVCAnlORgJ4vSBf3kWxRvYCfEICessCfQwCfPNIA0iAZicALhhJW0peGBpKzwLRBALQz0sqA4hSA4fpRMiRNQLypF0GAwOxS9FMMCgG0k1PTbICi0ICitvEHgogRmoIugKOOgKOX0OahAKO3AKOX3tRt1M4AA1S11SIApP+ApMPAOwAH1UhVbJV0wksHimYiTLkeGlFPjwCl6IC77VYJKsAXCgClpICln+fAKxZr1oMhFAAPgKWuAKWUVxHXNQCmc4CmWdczV0KHAKcnjnFOqACnBkCn54CnruNACASNC0SAp30Ap6VALhAYTdh8gKe1gKgcQGsAp6iIgKeUahjy2QqKC4CJ7ICJoECoP4CoE/aAqYyAqXRAqgCAIACp/Vof2i0AAZMah9q1AKs5gKssQKtagKtBQJXIAJV3wKx5NoDH1FsmgKywBACsusabONtZm1LYgMl0AK2Xz5CbpMDKUgCuGECuUoYArktenA5cOQCvRwDLbUDMhQCvotyBQMzdAK+HXMlc1ICw84CwwdzhXROOEh04wM8qgADPJ0DPcICxX8CxkoCxhOMAshsVALIRwLJUgLJMQJkoALd1Xh8ZHixeShL0wMYpmcFAmH3GfaVJ3sOXpVevhQCz24Cz28yTlbV9haiAMmwAs92ASztA04Vfk4IAtwqAtuNAtJSA1JfA1NiAQQDVY+AjEIDzhnwY0h4AoLRg5AC2soC2eGEE4RMpz8DhqgAMgNkEYZ0XPwAWALfaALeu3Z6AuIy7RcB8zMqAfSeAfLVigLr9gLpc3wCAur8AurnAPxKAbwC7owC65+WrZcGAu5CA4XjmHxw43GkAvMGAGwDjhmZlgL3FgORcQOSigL3mwL53AL4aZofmq6+OpshA52GAv79AR4APJ8fAJ+2AwWQA6ZtA6bcANTIAwZtoYuiCAwDDEwBIAEiB3AGZLxqCAC+BG7CFI4ethAAGng8ACYDNrIDxAwQA4yCAWYqJACM8gAkAOamCqKUCLoGIqbIBQCuBRjCBfAkREUEFn8Fbz5FRzJCKEK7X3gYX8MAlswFOQCQUyCbwDstYDkYutYONhjNGJDJ/QVeBV8FXgVfBWoFXwVeBV8FXgVfBV4FXwVeBV9NHAjejG4JCQkKa17wMgTQA7gGNsLCAMIErsIA7kcwFrkFTT5wPndCRkK9X3w+X+8AWBgzsgCNBcxyzAOm7kaBRC0qCzIdLj08fnTfccH4GckscAFy13U3HgVmBXHJyMm/CNZQYgcHBwqDXoSSxQA6P4gAChbYBuy0KgwAjMoSAwgUAOVsJEQrJlFCuELDSD8qXy5gPS4/KgnIRAUKSz9KPn8+iD53PngCkELDUElCX9JVVnFUETNyWzYCcQASdSZf5zpBIgluogppKjJDJC1CskLDMswIzANf0BUmNRAPEAMGAQYpfqTfcUE0UR7JssmzCWzI0tMKZ0FmD+wQqhgAk5QkTEIsG7BtQM4/Cjo/Sj53QkYcDhEkU05zYjM0Wui8GQqE9CQyQkYcZA9REBU6W0pJPgs7SpwzCogiNEJGG/wPWikqHzc4BwyPaPBlCnhk0GASYDQqdQZKYCBACSIlYLoNCXIXbFVgVBgIBQZk7mAcYJxghGC6YFJgmG8WHga8FdxcsLxhC0MdsgHCMtTICSYcByMKJQGAAnMBNjecWYcCAZEKv04hAOsqdJUR0RQErU3xAaICjqNWBUdmAP4ARBEHOx1egRKsEysmwbZOAFYTOwMAHBO+NVsC2RJLbBEiAN9VBnwEESVhADgAvQKhLgsWdrIgAWIBjQoDA+D0FgaxBlEGwAAky1ywYRC7aBOQCy1GDsIBwgEpCU4DYQUvLy8nJSYoMxktDSgTlABbAnVel1CcCHUmBA94TgHadRbVWCcgsLdN8QcYBVNmAP4ARBEHgQYNK3MRjhKsPzc0zrZdFBIAZsMSAGpKblAoIiLGADgAvQKhLi1CFdUClxiCAVDCWM90eY7epaIO/KAVRBvzEuASDQ8iAwHOCUEQmgwXMhM9EgBCALrVAQkAqwDoAJuRNgAbAGIbzTVzfTEUyAIXCUIrStroIyUSG4QCggTIEbHxcwA+QDQOrT8u1agjB8IQABBBLtUYIAB9suEjD8IhThzUqHclAUQqZiMC8qAPBFPz6x9sDMMNAQhDCkUABccLRAJSDcIIww1DLtWoMQrDCUMPkhroBCIOwgyYCCILwhZCAKcQwgsFGKd74wA7cgtCDEMAAq0JwwUi1/UMBQ110QaCAAfCEmIYEsMBCADxCAAAexViDRbSG/x2F8IYQgAuwgLyqMIAHsICXCcxhgABwgAC6hVDFcIr8qPCz6hCCgKlJ1IAAmIA5+QZwqViFb/LAPsaggioBRH/dwDfwqfCGOIBGsKjknl5BwKpoooAEsINGxIAA5oAbcINAAvCp0IIGkICwQionNEPAgfHqUIFAOGCL71txQNPAAPyABXCAAcCAAnCAGmSABrCAA7CCRjCjnAWAgABYgAOcgAuUiUABsIAF8IIKAANUQC6wi0AA8IADqIq8gCyYQAcIgAbwgAB8gqoAAXNCxwV4gAHogBCwgEJAGnCAAuCAB3CAAjCCagABdEAbqYZ3ACYCCgABdEAAUIAB+IAHaIIKAAGoQAJggAbMgBtIgDmwocACGIACEIAFMIDAGkCCSgABtEA45IACUILqA7L+2YAB0IAbqNATwBOAArCCwADQgAJtAM+AAciABmCAAISpwIACiIACkIACgKn8gbCAAkiAAMSABBCBwAUQgARcgAPkgAN8gANwgAZEg0WIgAVQgBuoha6AcIAwQATQgBpMhEA4VIAAkIABFkAF4IFIgAG1wAYwgQlAYIvWQBATAC2DwcUDHkALzF3AasMCGUCcyoTBgQQDnZSc2YxkCYFhxsFaTQ9A6gKuwYI3wAdAwIKdQF9eU5ZGygDVgIcRQEzBgp6TcSCWYFHADAAOAgAAgAAAFoR4gCClzMBMgB97BQYOU0IUQBeDAAIVwEOkdMAf0IEJ6wAYQDdHACcbz4mkgDUcrgA1tsBHQ/JfHoiH10kENgBj5eyKVpaVE8ZQ8mQAAAAhiM+RzAy5xieVgB5ATAsNylJIBYDN1wE/sz1AFJs4wBxAngCRhGBOs54NTXcAgEMFxkmCxsOsrMAAAMCBAICABnRAgAqAQAFBQUFBQUEBAQEBAQDBAUGBwgDBAQEBAMBASEAigCNAJI8AOcAuADZAKFDAL8ArwCqAKUA6wCjANcAoADkAQUBAADEAH4AXwDPANEBAADbAO8AjQCmAS4A5wDcANkKAAgOMTrZ2dnZu8Xh0tXTSDccAU8BWTRMAVcBZgFlAVgBSVBISm0SAVAaDA8KOT0SDQAmEyosLjE9Pz9CQkJDRBNFBSNWVlZWWFhXWC5ZWlxbWyJiZmZlZ2Ypa211dHd3d3d3d3l5eXl5eXl5eXl5e3t8e3phAEPxAEgAmQB3ADEAZfcAjQBWAFYANgJz7gCKAAT39wBjAJLxAJ4ATgBhAGP+/q8AhACEAGgAVQCwACMAtQCCAj0CQAD7AOYA/QD9AOcA/gDoAOgA5wDlAC4CeAFQAT8BPQFTAT0BPQE9ATgBNwE3ATcBGwFXFgAwDwcAAFIeER0KHB0VAI0AlQClAFAAaR8CMAB1AG4AlgMSAyQxAx5IRU4wAJACTgDGAlYCoQC/ApMCkwKTApMCkwKTAogCkwKTApMCkwKTApMCkgKSApUCnQKUApMCkwKRApECkQKQAnIB0QKUApoCkwKTApIbfhACAPsKA5oCXgI3HAFRFToC3RYPMBgBSzwYUpYBeKlBAWZeAQIDPEwBAwCWMB4flnEAMGcAcAA1AJADm8yS8LWLYQzBMhXJARgIpNx7MQsEKmEBuQDkhYeGhYeFiImJhYqNi4WMj42HjomPiZCFkYWShZORlIWVhZaJl4WYhZmFmoWbipyPnYmehQCJK6cAigRCBD8EQQREBEIESARFBEAERgRIBEcEQwRFBEgAqgOOANBYANYCEwD9YQD9ASAA/QD7APsA/AD72wOLKmzFAP0A+wD7APwA+yMAkGEA/QCQASAA/QCQAvMA/QCQ2wOLKmzFIwD+YQEgAP0A/QD7APsA/AD7AP4A+wD7APwA+9sDiypsxSMAkGEBIAD9AJAA/QCQAvMA/QCQ2wOLKmzFIwJKAT0CUQFAAlLIA6UC8wOl2wOLKmzFIwCQYQEgA6UAkAOlAJAC8wOlAJDbA4sqbMUjBDcAkAQ4AJANlDh0JwEzAJAHRXUKKgEEAM1hCQBbYQAFGjkJAJAJRN8AUAkAkAkAnW0/6mOd3brkH5dB9mNQ/eNThoJ1CP8EZzy46pMulzRpOAZDJDXL2yXaVtAh1MxM82zfnsL/FXSaOaxJlgv345IW0Dfon3fzkx0WByY6wfCroENsWq/bORcfBvtlWbGzP5ju+gqE1DjyFssbkkSeqLAdrCkLOfItA7XNe1PctDPFKoNd/aZ6IQq6JTB6IrDBZ5/nJIbTHMeaaIWRoDvc42ORs9KtvcQWZd+Nv1D2C/hrzaOrFUjpItLWRI4x3GmzQqZbVH5LoCEJpk3hzt1pmM7bPitwOPG8gTKLVFszSrDZyLmfq8LkwkSUhIQlN4nFJUEhU2N7NBTOGk4Y2q9A2M7ps8jcevOKfycp9u3DyCe9hCt7i5HV8U5pm5LnVnKnyzbIyAN/LU4aqT3JK+e9JsdusAsUCgAuCnc4IwbgPBg4EPGOv5gR8D+96c8fLb09f7L6ON2k+Zxe/Y0AYoZIZ8yuu1At7f70iuSFoFmyPpwDU/4lQ+mHkFmq/CwtE7A979KNdD8zaHSx4HoxWsM8vl+2brNxN0QtIUvOfNGAYyv1R5DaM1JAR0C+Ugp6/cNq4pUDyDPKJjFeP4/L1TBoOJak3PVlmDCi/1oF8k1mnzTCz15BdAvmFjQrjide74m2NW1NG/qRrzhbNwwejlhnPfRn4mIfYmXzj5Fbu3C2TUpnYg+djp65dxZJ8XhwUqJ8JYrrR4WtrHKdKjz0i77K+QitukOAZSfFIwvBr1GKYpSukYTqF4gNtgaNDqh78ZDH4Qerglo3VpTLT0wOglaX6bDNhfs04jHVcMfCHwIb+y5bAaBvh2RARFYEjxjr1xTfU09JEjdY1vfcPrPVmnBBSDPj9TcZ1V/Dz8fvy0WLWZM0JPbRL0hLSPeVoC8hgQIGaeE6AYVZnnqm62/wt00pDl5Nw/nDo+bF1tC4qo5DryXVn8ffL3kuT51e+VcBTGiibvP+vqX50dppfxyNORSr48S5WXV8fzcsgjRQH6zjl+nuUYFVloiEnZOPDpHD/7ILh3JuFCdvAi2ANXYXjTDA5Up6YLihbc7d+dBlI9+mdgr8m8+3/Dp26W/Jssn7b9/pOEP4i+/9TsPI9m2NfNKwEI35mqKV+HpZ+W69Y8sM/sIA9Ltvhd+evQTUUfSkYxki28/CBT0cT96HrlrSrE+V9RzhskX0CsDsCfHffBVybkxmHOFOgaUurWNQ2AcZbi1WjkZzYArWZBHFd1SYwtqQ0DIZt7OV40ewQxCr/LgxAc8dLJeAJFseWJq9XiOp21hLv/HhsFbYbg3zCR8JmonZjhuKYrS/KJc30vnOL2CM+GfogNWug2DstZPzauCNeeD8zlP8wxPyfLHYQB/J+wQE3aDpXH/5tdIQpLn3JXNJYZFiXInGB7FqxRxHYJ/re/lHprE5sngUMm11uOIA3bbtkk06I8DYxuwPD+e4sAeNfor0DkWmiCQFiNptkmiD2xGO1kIKGr/Tuu4bHe6z2NaS7Ih0c+Gpv+QbLY9ea122BXNSitM41sxUSlnWl+uJBIFoLqt66v/VfGIQos2lzhOOLDuScVxcyrqH3/FI4vaYB0b8gFHLXtxyX/9JpUCYNwlLZ1v5CeB99l0F795R5wl5UHRq1OYyKqsoIY07wJz2CT0TOf5/JRBPtJIIk5pOJ60SHayS9kMSKbI3fLLYztsY3B4MlSyoEfc9gL4yJVrPo+OGGunCK4p15UbCArJP/PQgUWDW4l+2P/tCqRRy2flIZL/nVeY/vyAfILUM5qEGfcFXXXrAit7skwDEFnD7mL1ATtyrz7HcodhzP7gShFhazIPm7X0+mTCeSWfrOr5WcvJfip19JRRLfXjuQpQjcNCuXo8kqkxQ68ukJQoxlnfjevc0WcKnGpUvyY54eJTS1IRWDqfHANukJLw56ts5yS6Nea7IrL6/78aKmZsch4Q694ujxgx5+0PhlGpzWimajpvkBOOUQlHLkJorzqu4e768L9nJtZWYturb7dsBxjzlNhd/gZcBuRgIUSdgZjg7Rx+f/zLcs4mAa3qDbJNUQVNbSg+dm0L3KH1uhesTPaErVYjZ8Isvfr+zfiX3DT0PlaOv+hdGvLUIlKSEcYHPMs0NtTGzyqMe74yciNFdAVZVzol/XtLsEqivKqfW7zWTCNCvZkPnnBlMv3UHW5RNNEJfuyR3MvYH/9E6gcts5GAwKIgCaBQ+V2Eh9O0IJkxFksPI1V9obqDKCpmPM55mLd+VQgRqgD+9XvsUxjbh/AXXPxOpc0FXFyJzc85aa1VQZa90LAWR4oinrBaOBr8DymCpFbdXMTn7Cv18S0hMR7T/o5VkRqN1g1/dvaDdZsRArO3bopkfee4efLF+hyVdcX4u3aNGTkWvLRafW+sXPktA1lla4UkSB7uJIULfxy/RAflk2miyw9xq9uVGgCNzqCv4iX+AUchfMkZdEgRZ9TZ+1CPTH2jXjMXjFl/+bEPzSjM7zPKKWhyZUgQG1lpp+DNz+Zz+85kD59q99U5R4B3vuI9WenCWqroy2U2Ruq6I+di5N/v9SmYnqJ5H1HLWCbIg6iVrn3s2gFBVFhrc1zzNqoFe275K3Jy1T0Mc5yeE1iRwO2b1L/j/S8jyvGDz6B3NMFEHErGHMM2+oJ5LobazyWEitdgMjQnsd0cjYrCqRpx8idpfwRq6hz/LleX6obpuJh/AGIu4sxD35hwkIEr5ShH8xro7tTDYK1GPHGylK6rp7NCG0lMr7YqwziMUBwXv0zPW667f3/IRLJRD7mkuwUP6mpkxyVjNlcBiAX12r//+WTuzWxsue7bsjRp7xFjpR2tRLqGHLvjYt3TpeybR82K61iLn+pOSWDfUv/HU8ecBtML+Gbz0v9vmlxSgZeBBzbGeP1KSqsH14ZM2kibgDhbS21hIALSOYFCE9LY+2CNvtzT2QuSJMiKP3zwvvs+/JkDwTg0jHVE0XH//U0nu5HKQtCL2KGDQYUgT7qIMVN/OoWqEz1oeG4wG7InZg47NE7rfHB2i7rkpYCUzaPfVtDYgTEPNpa8gXHI2Pp8A6YB8OYHkXDZMMcOL3rJD0Hxk+mRlsSJ12/7T52IcFst5zRc7uDJtQTXBdm9GvsvyXcBbMfKXWqsDSeEnFyPUXZGTafti4a0it8SN1qXxzBmzj+gVZ/FojNy+x73AuuqtJ/oaMZF6m5kbW6ItpfnUT/BrQunS+gLjTTUz0d8jTMpAfFQ40RQi9uM5qdFYzqk85hqSH1zsPOhiO5CN+hNZvL/RIs7m7LyLDuV80ZtyHHqVEngTVPBctHQhmcPjM30m1veDmHCXEpjybWAbgj3TqLUPNazzdHgxYmNuT7trWFcGOi7iTeL5YeK2yp2H98yoLN+skqhffZI/5n/ivceo44wJRY8bzC6DGwdgkMOulYhzW5m6OKyK2Mg+E3YE19L8ngE08TdAuNu0mIzd6kw0i03zzm4oqfVSZjZyxXnBhvt0v89EmnArya/UvHQrdQxBDAJagK2y+OqgBqzQ4FnUeiKfb7HFoUvFSknWhwq58TpBlVRZ0B0A7QWz7X4GLHcbdh5kFI/PKJ91OEh/kmnMEdh+Z23myFH8sXjR/KaHttrpz80N+bl0HM17RX48UjUWslrYHYW7oiHVgcGqTBoTrqK4JYwTTArFO1/APJ8DnEYf+wD92Dw15a9wrPxyJA88yYcv9RypzXLKAWmMuE0KAtIGjfKx1GbRQIq0AkttuRpBO7p4SGrTZuAOat3hTxXEcIKh3HgC1d88K7bz1+Jsi+y7tL/7zc0ZxCBB3hSxvP90GkUp1Lm2wuESafZyFy4Opir+o3gMWtDSuLF3LRHXTUGkKQtvARnwam8BuKv8Q2fHH/cEwPCQd3dhzgri8eTezRsQoGz6ha+S4E7ZzDB/LXwl04vA70NeVsf5rmv1TLvcQSNIBk3U6Qh6Bm+0905B91hopTLnTJRWZkUmbckEw0woG81azyw6LZaBL5Qx2HPvd3LHGLpN6mPZlto50NwW2zFOkgoPKV1gr142teD9aok2HNkPMepl3NIi78ShnAlJCzjZplteUoqz0+iUEOym1LZGGFHMBkc6/5f+sRCCFZZW6KrEby64o/ZfefQAPP6b5ko2fuujIv7uonIKXN6XiJsZmcOeGxteQ+b/ope3Z1HFeXYoW1AJrU/OiCpsyQP1Pr1BdQKFzS0oYnLCAweSnIh7qMFMRBMY7BcnJ5oskUbbRNiosqMzCYUAZPbo8tjCCsCBm5SoGcTHBMXcE+yQpl/OfBkcTw3oa4X7V+ohEh/Zkcv0cqc8sY40IsOW6lLiIrvYND/exZbRlOMgaHvb/QQKaY0k6Aamee2o3LVARCbIP4RoSd7u3CXkG+Iz6iFLfsN38F9xU4n3ueeVgiRs3jw70SMWu1QzDdiLsKtU1qvaLhv7dUbnLimdqYG+pa2aRZ8A6Q9JSr3yTs1MiAvfFHPQJTiqpI/hVUMmL6gPj6eL7lH0IkLCNcaogBA0TGfO0wO6ddf8Fju0L3YbRrWe8J3IewsNBCbpC2b6etQRJnSGLuWDiFoBez9hJHw6+bMQQGQS8YV/kzQ5AFHEqPaMgOjyR5zaHtlOBI4mjo8gdNItHUHQ7Bzq/E/xV1B+L0uoRcLIEj4hcv0yWQTwWLHzoFrvEZPygABpc4rnVjhfcBw5wOvaVVtgiG5qjklrTY1ZaXHkasyVYBd+lgo6zEHMumfK8XR2eD0cVn5w8l1uxGz2ACwtFob/CTV/TUx1kCKp+QROanLrNBiSPTxAf1eOFE+JifgAJ+pyrFqS/0wKlPWUVKlB2Bhu1Ggx2cvfdiR49VIsgBNnE75pf5lpFaQuz8+VPreUd/HLlW8kDSr25AnETsVRrOycLBPYD9/j/7Z0KKdOjtrM71AT+VsjD3D97aUDP5WrHp1DWghsk/lS/hp2VMwo0eqoEerLL/4/SlmyjStwWVDqF6jHC89niCwr1tMSe8GxeC9wjzMKmE7ZtdHOWqqc1OoTI24eVQc++crbyxSU4TxiB+vWoaAUpYQxZ06KKIPq6EvN/rN4DZ0/tQWYVqZ3FTIftPBfIuOWX3PonIKTUArpSvfmQRpkWD00wc3AQS98i4ZYaUbI+DGv90tuEKRjb2ocfdddC21YGUATYQmzelz7JqWBAQqKrWYdWEJlfPeRFZHtUm2MaISZsoOvURowxJKveGRegmBiKZ3d1cMFioJL33RoIKT0eDeK8FH/ybAhZU5TQIsWYmjyeT7EOLL5xZuRPf4qRIo6bbLtFOV6SX60fR8Smys/u1D5DjkmHJyr/woVAvBP2dxGo9gH1LgIm8XlFF1KSYvfj+0w7aTEfoFpcO+Jv3Ssbv8wwkED5JEC+jdln2dzToPNRtWiPbRb8f8G4aZX1j/2Vdbu7jM3gAVD5BKR+yJaOwLtwJodwjWu5di47tnNs9ahpnCUzVMObQfbTqMNs64MGANlgyihKjhwZ6p1Jsnro0/SfkOk6wx+HgUB6Mz9cUiF7KrJkhxnOVjCCcqPZglIojIRoDtkd2AkLNZC88GdP2qZV/1N6PBAe+fpgWZ36oHnewQ8CHdXcxbwQVjOn8U3qD9+e7FzWpg135vgdEMZ9fH5agDnNzdjKFZQ4tDsJs/S6Lk8FqjFJpHMjaRU6FI/DBDM0g+RRkxNoUvm14JAn5dgd6aVHt1aMkSXiJVenbm2FfrIEaFKHtm1erv1BJ5056ULL8AMGLmHav4yxg6F6n5oBq7bdP6zEr6f+QTDJ/KE1XfoG24JvVk2GL7Fb+me27otVFnq1e/2wEuqv6X+2zLQuJQszy5YJi/M5888fMy34L6z8ykD5sCHgzliAoAtEeoaFmnPT63kOYrZWspxYzqQBu/QKNyQ8e4QwKJUCVazmIUp6/zpLA3bWH2ch7QZN0rzWGxMRl3K1osWeETxL95TZSG/atM8LB9B92/71+g9UGWDPfD+lu/KdOQ85rocuHe91/gHA/iprG9PZ2juX49kaRxZ+1/sB3Ck35eWYBFsmCl0wC4QZWX5c5QMuSAEz1CJj0JWArSReV4D/vrgLw+EyhBB6aA4+B34PdlDaTLpm9q9Pkl+bzVWrSO+7uVrIECzsvk8RcmfmNSJretRcoI7ZcIfAqwciU9nJ8O4u1EgkcMOzC/MM2l6OYZRrGcqXCitp4LPXruVPzeD402JGV9grZyz9wJolMLC/YCcWs9CjiWv+DNRLaoSgD5M8T4PzmG8cXYM4jPo5SG1wY3QK/4wzVPrc33wI+AcGI//yXgvyBjocGrl768DMaYCGglwIit4r6t6ulwhwHJ4KeV3VHjspXXG4DIlDR2HNFvPaqkBViIvr433qZPuUINp6oi1LyVVC+EE1j6+wab8uPMeAo6e9uWYequvZynhnYazrvrDQJVkK3KZRoSR5BHi6vOC+AVCujMiQ1GVzGDZ4RFv8jFm7z5CU0iPH2JeXqUzqaKKP4P7osPkcIL99Y7fP3l+TzeFXO2kSpLIJW51oEY8DRIhqexGnxj0nmtGOseStuViIE2mJge45LENf77xjuI7egRNpzthNiajnuqikg0aQS1JqlIZf+hwSUlOp8BEQ0y3xiTOJkohBP3eyYiPDlZpFY88EWOpp4+hC/tQdhrQ56h2VJ2XA6vhPAbj+wH6iA2XYuTvRV25N8wNPQuA0Vzzem2ADZPFK2vr8l0I3GTV3fUN4S6FFYygW2Pu98f+lsgPf67rwVCbgMFAACW3P10GbxnK3SNuNK+VlPRiL7U3dK1o3spH/MFfDkgXuXjxDTxJrYctqHdwUg4rhUCNA13lGjuhJDatpFb/mExsBWS46aLFtROqVm8xQNPXK6A2rRfazJSWpIyh+FMmorXPXYnHQ7YLOmD4B5QTI8rzp7OomiarnaFs5syYjQ0ucc7g1/JzT446IFlDtpUL7DP9bLRCLJryUvi5R71/qX7ycqRSwunQ7+tfJz44Na3aJNszaMEZ/BV4iOGopabYdmvAPe+kIdGCNq5Q8fg8Ld0VNNXV0ZiiGej7zSA+pexy6wKC5k4rZa0k+qaN8bKq3oJWMQCSGaK7PrwMvA8t8BZTzjDqXcFTAIeRtl0SdlGSuAziVXItFcgAkeqwuNsbsrUZFcU6KUZLmvG415kHa0AwMFW2cNSUvPR0U9iCPh0nyslT92B5slYXiDWeSXvxHXItvjI8z5KCIVTIHqGZsbDBTr7WdHzcUAI1ipR86H3o0p2wPhfp7xg9oWOxWIK4a5BWdaV9OAPc0XuvlbwitCVtZDzZxGhIOl77ZgrRYR7LZQFE+Ih23hW3gI914ekkjgbKCi2bsqSAvij6GGj5p+k6evQtJp3qVh9vg+jiJvFCGcKBCITMWpqHZNKfE6IT0dKntS0rhu0DB5D9qIS0/RboNLsx2DlRMlx1QIBeBpHJNKdCL9uWM9eS7RJXKNOpraULtutuJYOl0apdE4LxfsyRSZb6fJkd51SHrI7lLB4vEg4fifJ1dqcWSeY4DgcyjrUcymK+gd3o+qj+3gHKWlLVdMUr3IeF8aClYBq+eeCV9Y7n1Ye8yL7rEvxY7jAlLwucKQ51pu59N8we8XwrbXPChBHXP4LnD3kDwQ85w1DKghtwvpO609fZOrPq8Q7GOOAjHhfR5VqvpoFne8oMHbCrWb1L0IdATo+h1PFeLLI8wc+FEyftLvskCdOtxKfAx3IEJXzBfWTKq5viKP/uu99dxnEpoNJhRtjSZGwOTWr7Ys44++P58O+nkYxd1Gcqm8G3Gh7AHSCxiPNyJWijI/lECrKrAXgBqkRShvdkd7IfoqUlziFDiglx+jdHnmRVmGnk3p/3n78M/HkzFUGZOS07cPnPn9jAnBWl4qDrB1ECf9idIKOdkJTKcZ690nuLW2yDsqwNpgrlT+wx2gv+Engha74lfVqbwqS15FRwuFDfq3bVCZcPy78TL2pH/DOdHeL9MFAtyybQNwHaO781rnJZAhR4M+AYWoSoa0EjQ99xivreM+FKwd7Jp/FC2vvvcq1z3RnRau/BM5KGkBPBSUBOzTNdfaJS/PWTDb1jRSgn2MuY3pVZbY9peHBVI3Ce/u70hg4f7MCVeAjYJfzTkDVLuB6jyjZs5Kko3u39ozgLK4LuwSbUrNIU5cl6Bs3De62AE084XRsm64Gs5W1ofxsWIZ9cYl8PNa5zQHl9ls5aiIKN0rHIIzBnLr03Kle2qq+n/gLDAzvF89vdZCvUFEHRoi9n33O3i49UWyeHP+ZAeRf+psM867nfqON092zE4Pj7AbLtvIUFJFr1y9Le0CL2flc7LUqbgGzOw4/q3vA/cJO5JeI8S+8bc1Y7pqYSzoEWSFn5G7EoPHTGHPMU6SeLKEeli+i8dHY3lWxSrIOU2y0TNo1SeRYewhVx05OXeVDf0xhHNckqp0arRk+bgToeSaHbVZ5nj3IH3m2oayt3sXY78qSPcDpc/5C7VXDRj6bROvvBG5JCsKl/yeMPAUn1flMsmr/FaFdb7gVUXnhLa+/Ilj87PpCC6rILQ6wkIP1ywEg0PztSEzbsJoRwQzDaxkiTN27YDnsy/YKfe6jKcqZWs64skzUAHIt+nXxju0dUVtbCSDAUXYw78Yd4bJKuYU8gbzLzgL4XIUC2HcPIVCUYvM7cybOBFVBdeGR4cOVB7QbGnohTRpiPrGqi1a8QXFBYqENawROuR43OG8dl+Jx4TpwAoi2kkPXW7b/ARSs4DO/z4H6oTIUpN3+/K6Iuc49C4/Uf1NxQTEE91VP8RnLKTpxjywMe2VxM1l4YGXSFY80HUAKIdqczBnnLMPklFV8mrr5hFDypn5TAT00ruU6AjDPNvncoVzX4ac6wAzTwrNH7oz1XLH1wzjQs5k7hcNLbznXQGB7M+rXxKtZXPrz1Ar+OxYGDkJvElknZsHD/IcxRd7ujmmLYpDDbverynroCnSKVQWEGjHL57PaI/WokvhYRpPMk4ni2EUhjDuIF+IU2R0fs40i+66bw8sz8OzyC2eFAxxicd2n5Juta2eWa9KtObD7xLmPvtK+8cjQt+NLjcZCTt+Ss9p1od0bklVgaIV1qJbWxUOr6iUzLDzFefYxAtyRcBr53IaDB25n60KQdhroQWMUpuWSUpELSFxiu4vgQeRoEZe78/ua3TlrszB8sLVZoecnV9YMYz+HkZA/pLqbFhzurB52Wl/WEM6sVk4q04OnzWZFi76JkcGgeeUyYUIwhCDMdIfTUdD4wQpYm3LBw0sp33CVK2q305jeyzgGnBzSMXjesm4XjcEhhrjPSLtwqqoaFCqD5DlHYhoTVafWtBUQXoNfDk19IFxq8sImCcqgMhOToIZUO2530aasY908dMX2nTMFjgv+lapdI8k/e0a7pFw6X3Tgf0m99bbCpOzVgRu2Dw/13CehVfFj+8BeKP6SZV4g/qiX42NWP568PzMajFm2ANmKtHjEIAIc2hc1iecBR9elGP4LmAQwAVmZT8kWc7JSY0ag583ch/Z16krGrjn2YdIaa22egy4/niU6m0WAG3K/yP65cfL//CP+JzcnoLHQFb/KJQeBrEbR1/IKo+YOFXWIQ8ghNxYdMwa49NeXzFqFOIXTmk3w/v5KneS8sGHiPGACh0DE9a1uLAochB79g3IqYObhlswemMucZnAE7dBkp5OAfToa5gHFbIPcec0fVWEOOLftQXsuffyv3wo1LWDDm+SyNMWgSEWtjMyYkjLjTkUtmj7DQlfbpHf38lDvoEN9d2ALxnWCjph4jvfEIRbHvltKbvE2BiYlz45mnJPeFrwZcBny3k0/pyXNrSbEIWvvZw14Y0Fqy4tba1Fu0yNNYaf47jfnz7VCCxKsrJz5oz3F8jXUdQqFu+gDq6EzvKDipXf/3NmcsCC74VB3OgHPgN7W9cU54pjGFDMfifl3m5Vhy21uk1U2nYCrddrifkpwGLYmLSSQAAjC6M3yB1fc6KHpgDnMXh2bYX2ns+Qma+DBgyCkZ0TqZK8Mp2Sryx7HdMM74X9hrwYhQbwlK+zgATAXRzQyS+hK4OTnP17/cyJ2WzY6DChYWGJYXGCnEdMswF5VTYQdSyTpdLXYuh+x2Qr7DR3H2x+YdP0qsLAzYJIWKwrrKkpBgWCmgNCn5t+QbWqf/LoLuvjgDFLtMoxNK5axIA9kammelvwh5ZI52ktrEm/OVEESPQPZGHAIhP7oWDBnGnuzG45XOTpZWsxwNO4UiyxH8riTvQq4JVq5GwX3yqVCbSR0ef/gVYDgiYaiD2EAAxuEPKyXTp/HhL96eVTpaDqFEoV2x1PP/UMcs/XqeGc1gZQG1ot6YxaIEWHanYavH9YdLFjlyU5yrYALVg/sxBjT39oD+BIXvf4LTbvvvpX3srxckEX1XAM9s2uajUTlpPq32mcx4T+sibdQEHQV2WmgwMhbYovh7WWTPfLF03ZbV5a+ElsSIyH6kgJ8+D6aN/6f+ZstkZOYZYx9GbagcrEqwNblz0iZ9NTyvIAeNn3Oup7rtyD4wVE0PoqcnR/LoSK1s1esmOGPjs3zHB8xW4iL8IrhqAJfsWNBYW9TGR11C3KZJaN7MP4O5Ykmpvw94hHzVmsYA68RQdFYfPlFOgCNBoSdy5ODcv11l9bLs135M4okEc4/e8hQczcz2PWipIVSBxa/5sr9xyTFbjG4xm8f4LmrAhD1uEDGrFDl/6X7Nw7/WZPW7fZJGYN8eZ68Td5KGfJyKjD+pTysvTi+8Q8R0L9wKAxAUrYswdvAuiNeenxSplQZjYTxbcH/wP97fOY215SozY3UDRhv7lomztURB2O2UriTX3oAiTKoInkHQietZyhBQ9wMTVHgMrxOP5T/0gN14eFTz0m2D6/iJMbXYGHdIkKEGV2Voa8k/hVNvAVAZKrDEXthUxotwYkYysTDk8j27XEVy+4a30jopuAp5+/xWYb0ne6lwKZwR3j6kDXroOOtrHqWlkJHSWLoPEQJQo/ARzR8UBZSckmeBPn3gJwY62Zo2dyy1AyRRDQBFAJKH9KX+7auP8U8XDo7mMSzq5ZxmaJ5bLpNg4ZM7938SAjMHcu1yB4+lkHnVLnIp86AOPgigH+ZFDRq1QuKWK3pK5JkLDJdakj176NCbjXDASt1h/t1p+GHyKbAoevHSnHuPfoBmQ3nJrDjOhPfwVYi8V5r0KB8BsrfFu8BvhYCbNrvCVnd4Q8RktqIR/ZilioC6g3++L7PHzuXa8NFSF5zd+ISzGLTjrfaKXsBFCkkK0ksSDbl91yXUghMFOskQBeUoo7o3wuIsE29goRIORuJ4b1jSumvR0gR8B21iyW1G4FqHkZOlWz9zq5FnaJX1WbeAxe2DfGSAnw4cqDwg3LFalk6eH89Sdc41Fr6voEa0hfwdkb54yOM7WevDugT1FRzEqdg9zZZ44ZAKGH3ZyqFve3SE4UDN6tLmIFTdIwMrtYRXWBQDB7vvqOuYj7cN31av64+jg/g1uce+am3TOl0cUUL6s0l35FJ9p8vJcG+G8lAFqC0pdmd/aaWYpqDLvB5LEasLMgbPN2N+Wvkh6HYxPOrZEfoxQX/67AzcWOR0K3eYGOgQhyWL7cwKGlxmY/E2b8CKi6Ssgok+7B+zTtq/DXmaDAHRnwbwvCDJ9pITO5RQgBuprEWT0avZv7QjbzITYD8Fzgy4TSYG3z9tLso0Z7MfgHDLKU+kHrzxWkBPwJRydKMXG4AaCA7mlAmjzpNhGOrMGZGZlHSjPbmO5jPd/lKBrViZ0BaXMmqaFOwA/f03O04qQX6MSVA37+SA5Pne/KP7caLJKuOCJXoXpzArUrYesMVc/RXnOv03YrwKgPlR2SjpqIycyulmodZBy6gVc1jA9y6lJqWgR6SY6tc24sVcYuh2GaTeikYJnhr2d6BiL3oLx8M8wuJBdI3FRVIIAx4XougScOw2xWgwUoSYKeLUHc310kVBzSE/vFeHAjlUil8KZftctMgwGjwrhMbjDbK4rB32fTe9jnsqijdp5kOwkD9+klel+lNh3joAFQ");const f=new Map([[8217,"apostrophe"],[8260,"fraction slash"],[12539,"middle dot"]]);function p(e){return`{${function(e){return e.toString(16).toUpperCase().padStart(2,"0")}(e)}}`}function m(e){let t=[];for(let r=0,n=e.length;r<n;){let n=e.codePointAt(r);r+=n<65536?1:2,t.push(n)}return t}function g(e){let t=e.length;if(t<4096)return String.fromCodePoint(...e);let r=[];for(let n=0;n<t;)r.push(String.fromCodePoint(...e.slice(n,n+=4096)));return r.join("")}function y(e,t){let r=e.length,n=r-t.length;for(let o=0;0==n&&o<r;o++)n=e[o]-t[o];return n}var v=r("AEUDTAHBCFQATQDRADAAcgAgADQAFAAsABQAHwAOACQADQARAAoAFwAHABIACAAPAAUACwAFAAwABAAQAAMABwAEAAoABQAIAAIACgABAAQAFAALAAIACwABAAIAAQAHAAMAAwAEAAsADAAMAAwACgANAA0AAwAKAAkABAAdAAYAZwDSAdsDJgC0CkMB8xhZAqfoC190UGcThgBurwf7PT09Pb09AjgJum8OjDllxHYUKXAPxzq6tABAxgK8ysUvWAgMPT09PT09PSs6LT2HcgWXWwFLoSMEEEl5RFVMKvO0XQ8ExDdJMnIgsj26PTQyy8FfEQ8AY8IPAGcEbwRwBHEEcgRzBHQEdQR2BHcEeAR6BHsEfAR+BIAEgfndBQoBYgULAWIFDAFiBNcE2ATZBRAFEQUvBdALFAsVDPcNBw13DYcOMA4xDjMB4BllHI0B2grbAMDpHLkQ7QHVAPRNQQFnGRUEg0yEB2uaJF8AJpIBpob5AERSMAKNoAXqaQLUBMCzEiACnwRZEkkVsS7tANAsBG0RuAQLEPABv9HICTUBXigPZwRBApMDOwAamhtaABqEAY8KvKx3LQ4ArAB8UhwEBAVSagD8AEFZADkBIadVj2UMUgx5Il4ANQC9AxIB1BlbEPMAs30CGxlXAhwZKQIECBc6EbsCoxngzv7UzRQA8M0BawL6ZwkN7wABAD33OQRcsgLJCjMCjqUChtw/km+NAsXPAoP2BT84PwURAK0RAvptb6cApQS/OMMey5HJS84UdxpxTPkCogVFITaTOwERAK5pAvkNBOVyA7q3BKlOJSALAgUIBRcEdASpBXqzABXFSWZOawLCOqw//AolCZdvv3dSBkEQGyelEPcMMwG1ATsN7UvYBPEGOwTJH30ZGQ/NlZwIpS3dDO0m4y6hgFoj9SqDBe1L9DzdC01RaA9ZC2UJ4zpjgU4DIQENIosK3Q05CG0Q8wrJaw3lEUUHOQPVSZoApQcBCxEdNRW1JhBirAsJOXcG+xr2C48mrxMpevwF0xohBk0BKRr/AM8u54WwWjFcHE9fBgMLJSPHFKhQIA0lQLd4SBobBxUlqQKRQ3BKh1E2HpMh9jw9DWYuE1F8B/U8BRlPC4E8nkarRQ4R0j6NPUgiSUwsBDV/LC8niwnPD4UMuXxyAVkJIQmxDHETMREXN8UIOQcZLZckJxUIIUaVYJoE958D8xPRAwsFPwlBBxMDtRwtEy4VKQUNgSTXAvM21S6zAo9WgAEXBcsPJR/fEFBH4A7pCJsCZQODJesALRUhABcimwhDYwBfj9hTBS7LCMdqbCN0A2cU52ERcweRDlcHpxwzFb8c4XDIXguGCCijrwlbAXUJmQFfBOMICTVbjKAgQWdTi1gYmyBhQT9d/AIxDGUVn0S9h3gCiw9rEhsBNQFzBzkNAQJ3Ee0RaxCVCOuGBDW1M/g6JQRPIYMgEQonA09szgsnJvkM+GkBoxJiAww0PXfuZ6tgtiQX/QcZMsVBYCHxC5JPzQycGsEYQlQuGeQHvwPzGvMn6kFXBf8DowMTOk0z7gS9C2kIiwk/AEkOoxcH1xhqCnGM0AExiwG3mQNXkYMCb48GNwcLAGcLhwV55QAdAqcIowAFAM8DVwA5Aq0HnQAZAIVBAT0DJy8BIeUCjwOTCDHLAZUvAfMpBBvDDBUA9zduSgLDsQKAamaiBd1YAo4CSTUBTSUEBU5HUQOvceEA2wBLBhPfRwEVq0rLGuNDAd9vKwDHAPsABTUHBUEBzQHzbQC3AV8LMQmis7UBTekpAIMAFWsB1wKJAN0ANQB/8QFTAE0FWfkF0wJPSQERMRgrV2EBuwMfATMBDQB5BsuNpckHHwRtB9MCEBsV4QLvLge1AQMi3xPNQsUCvd5VoWACZIECYkJbTa9bNyACofcCaJgCZgkCn4Q4GwsCZjsCZiYEbgR/A38TA36SOQY5dxc5gjojIwJsHQIyNjgKAm3HAm2u74ozZ0UrAWcA3gDhAEoFB5gMjQD+C8IADbUCdy8CdqI/AnlLQwJ4uh1c20WuRtcCfD8CesgCfQkCfPAFWQUgSABIfWMkAoFtAoAAAoAFAn+uSVhKWxUXSswC0QEC0MxLJwOITwOH5kTFkTIC8qFdAwMDrkvOTC0lA89NTE2vAos/AorYwRsHHUNnBbcCjjcCjlxAl4ECjtkCjlx4UbRTNQpS1FSFApP7ApMMAOkAHFUeVa9V0AYsGymVhjLheGZFOzkCl58C77JYIagAWSUClo8ClnycAKlZrFoJgU0AOwKWtQKWTlxEXNECmcsCmWRcyl0HGQKcmznCOp0CnBYCn5sCnriKAB0PMSoPAp3xAp6SALU9YTRh7wKe0wKgbgGpAp6fHwKeTqVjyGQnJSsCJ68CJn4CoPsCoEwCot0CocQCpi8Cpc4Cp/8AfQKn8mh8aLEAA0lqHGrRAqzjAqyuAq1nAq0CAlcdAlXcArHh1wMfTmyXArK9DQKy6Bds4G1jbUhfAyXNArZcOz9ukAMpRQK4XgK5RxUCuSp3cDZw4QK9GQK72nCWAzIRAr6IcgIDM3ECvhpzInNPAsPLAsMEc4J0SzVFdOADPKcDPJoDPb8CxXwCxkcCxhCJAshpUQLIRALJTwLJLgJknQLd0nh5YXiueSVL0AMYo2cCAmH0GfOVJHsLXpJeuxECz2sCz2wvS1PS8xOfAMatAs9zASnqA04SfksFAtwnAtuKAtJPA1JcA1NfAQEDVYyAiT8AyxbtYEWCHILTgs6DjQLaxwLZ3oQQhEmnPAOGpQAvA2QOhnFZ+QBVAt9lAt64c3cC4i/tFAHzMCcB9JsB8tKHAuvzAulweQLq+QLq5AD5RwG5Au6JAuuclqqXAwLuPwOF4Jh5cOBxoQLzAwBpA44WmZMC9xMDkW4DkocC95gC+dkC+GaaHJqruzebHgOdgwL++gEbADmfHJ+zAwWNA6ZqA6bZANHFAwZqoYiiBQkDDEkCwAA/AwDhQRdTARHzA2sHl2cFAJMtK7evvdsBiZkUfxEEOQH7KQUhDp0JnwCS/SlXxQL3AZ0AtwW5AG8LbUEuFCaNLgFDAYD8AbUmAHUDDgRtACwCFgyhAAAKAj0CagPdA34EkQEgRQUhfAoABQBEABMANhICdwEABdUDa+8KxQIA9wqfJ7+xt+UBkSFBQgHpFH8RNMCJAAQAGwBaAkUChIsABjpTOpSNbQC4Oo860ACNOME63AClAOgAywE6gTo7Ofw5+Tt2iTpbO56JOm85GAFWATMBbAUvNV01njWtNWY1dTW2NcU1gjWRNdI14TWeNa017jX9NbI1wTYCNhE1xjXVNhY2JzXeNe02LjY9Ni41LSE2OjY9Njw2yTcIBJA8VzY4Nt03IDcPNsogN4k3MAoEsDxnNiQ3GTdsOo03IULUQwdC4EMLHA8PCZsobShRVQYA6X8A6bABFCnXAukBowC9BbcAbwNzBL8MDAMMAQgDAAkKCwsLCQoGBAVVBI/DvwDz9b29kaUCb0QtsRTNLt4eGBcSHAMZFhYZEhYEARAEBUEcQRxBHEEcQRxBHEEaQRxBHEFCSTxBPElISUhBNkM2QTYbNklISVmBVIgBFLWZAu0BhQCjBcEAbykBvwGJAaQcEZ0ePCklMAAhMvAIMAL54gC7Bm8EescjzQMpARQpKgDUABavAj626xQAJP0A3etzuf4NNRA7efy2Z9NQrCnC0OSyANz5BBIbJ5IFDR6miIavYS6tprjjmuKebxm5C74Q225X1pkaYYPb6f1DK4k3xMEBb9S2WMjEibTNWhsRJIA+vwNVEiXTE5iXs/wezV66oFLfp9NZGYW+Gk19J2+bCT6Ye2w6LDYdgzKMUabk595eLBCXANz9HUpWbATq9vqXVx9XDg+Pc9Xp4+bsS005SVM/BJBM4687WUuf+Uj9dEi8aDNaPxtpbDxcG1THTImUMZq4UCaaNYpsVqraNyKLJXDYsFZ/5jl7bLRtO88t7P3xZaAxhb5OdPMXqsSkp1WCieG8jXm1U99+blvLlXzPCS+M93VnJCiK+09LfaSaBAVBomyDgJua8dfUzR7ga34IvR2Nvj+A9heJ6lsl1KG4NkI1032Cnff1m1wof2B9oHJK4bi6JkEdSqeNeiuo6QoZZincoc73/TH9SXF8sCE7XyuYyW8WSgbGFCjPV0ihLKhdPs08Tx82fYAkLLc4I2wdl4apY7GU5lHRFzRWJep7Ww3wbeA3qmd59/86P4xuNaqDpygXt6M85glSBHOCGgJDnt+pN9bK7HApMguX6+06RZNjzVmcZJ+wcUrJ9//bpRNxNuKpNl9uFds+S9tdx7LaM5ZkIrPj6nIU9mnbFtVbs9s/uLgl8MVczAwet+iOEzzBlYW7RCMgE6gyNLeq6+1tIx4dpgZnd0DksJS5f+JNDpwwcPNXaaVspq1fbQajOrJgK0ofKtJ1Ne90L6VO4MOl5S886p7u6xo7OLjG8TGL+HU1JXGJgppg4nNbNJ5nlzSpuPYy21JUEcUA94PoFiZfjZue+QnyQ80ekOuZVkxx4g+cvhJfHgNl4hy1/a6+RKcKlar/J29y//EztlbVPHVUeQ1zX86eQVAjR/M3dA9w4W8LfaXp4EgM85wOWasli837PzVMOnsLzR+k3o75/lRPAJSE1xAKQzEi5v10ke+VBvRt1cwQRMd+U5mLCTGVd6XiZtgBG5cDi0w22GKcVNvHiu5LQbZEDVtz0onn7k5+heuKXVsZtSzilkLRAUmjMXEMB3J9YC50XBxPiz53SC+EhnPl9WsKCv92SM/OFFIMJZYfl0WW8tIO3UxYcwdMAj7FSmgrsZ2aAZO03BOhP1bNNZItyXYQFTpC3SG1VuPDqH9GkiCDmE+JwxyIVSO5siDErAOpEXFgjy6PQtOVDj+s6e1r8heWVvmZnTciuf4EiNZzCAd7SOMhXERIOlsHIMG399i9aLTy3m2hRLZjJVDNLS53iGIK11dPqQt0zBDyg6qc7YqkDm2M5Ve6dCWCaCbTXX2rToaIgz6+zh4lYUi/+6nqcFMAkQJKHYLK0wYk5N9szV6xihDbDDFr45lN1K4aCXBq/FitPSud9gLt5ZVn+ZqGX7cwm2z5EGMgfFpIFyhGGuDPmso6TItTMwny+7uPnLCf4W6goFQFV0oQSsc9VfMmVLcLr6ZetDZbaSFTLqnSO/bIPjA3/zAUoqgGFAEQS4IhuMzEp2I3jJzbzkk/IEmyax+rhZTwd6f+CGtwPixu8IvzACquPWPREu9ZvGkUzpRwvRRuaNN6cr0W1wWits9ICdYJ7ltbgMiSL3sTPeufgNcVqMVWFkCPDH4jG2jA0XcVgQj62Cb29v9f/z/+2KbYvIv/zzjpQAPkliaVDzNrW57TZ/ZOyZD0nlfMmAIBIAGAI0D3k/mdN4xr9v85ZbZbbqfH2jGd5hUqNZWwl5SPfoGmfElmazUIeNL1j/mkF7VNAzTq4jNt8JoQ11NQOcmhprXoxSxfRGJ9LDEOAQ+dmxAQH90iti9e2u/MoeuaGcDTHoC+xsmEeWmxEKefQuIzHbpw5Tc5cEocboAD09oipWQhtTO1wivf/O+DRe2rpl/E9wlrzBorjJsOeG1B/XPW4EaJEFdNlECEZga5ZoGRHXgYouGRuVkm8tDESiEyFNo+3s5M5puSdTyUL2llnINVHEt91XUNW4ewdMgJ4boJfEyt/iY5WXqbA+A2Fkt5Z0lutiWhe9nZIyIUjyXDC3UsaG1t+eNx6z4W/OYoTB7A6x+dNSTOi9AInctbESqm5gvOLww7OWXPrmHwVZasrl4eD113pm+JtT7JVOvnCXqdzzdTRHgJ0PiGTFYW5Gvt9R9LD6Lzfs0v/TZZHSmyVNq7viIHE6DBK7Qp07Iz55EM8SYtQvZf/obBniTWi5C2/ovHfw4VndkE5XYdjOhCMRjDeOEfXeN/CwfGduiUIfsoFeUxXeQXba7c7972XNv8w+dTjjUM0QeNAReW+J014dKAD/McQYXT7c0GQPIkn3Ll6R7gGjuiQoZD0TEeEqQpKoZ15g/0OPQI17QiSv9AUROa/V/TQN3dvLArec3RrsYlvBm1b8LWzltdugsC50lNKYLEp2a+ZZYqPejULRlOJh5zj/LVMyTDvwKhMxxwuDkxJ1QpoNI0OTWLom4Z71SNzI9TV1iXJrIu9Wcnd+MCaAw8o1jSXd94YU/1gnkrC9BUEOtQvEIQ7g0i6h+KL2JKk8Ydl7HruvgWMSAmNe+LshGhV4qnWHhO9/RIPQzY1tHRj2VqOyNsDpK0cww+56AdDC4gsWwY0XxoucIWIqs/GcwnWqlaT0KPr8mbK5U94/301i1WLt4YINTVvCFBrFZbIbY8eycOdeJ2teD5IfPLCRg7jjcFTwlMFNl9zdh/o3E/hHPwj7BWg0MU09pPrBLbrCgm54A6H+I6v27+jL5gkjWg/iYdks9jbfVP5y/n0dlgWEMlKasl7JvFZd56LfybW1eeaVO0gxTfXZwD8G4SI116yx7UKVRgui6Ya1YpixqXeNLc8IxtAwCU5IhwQgn+NqHnRaDv61CxKhOq4pOX7M6pkA+Pmpd4j1vn6ACUALoLLc4vpXci8VidLxzm7qFBe7s+quuJs6ETYmnpgS3LwSZxPIltgBDXz8M1k/W2ySNv2f9/NPhxLGK2D21dkHeSGmenRT3Yqcdl0m/h3OYr8V+lXNYGf8aCCpd4bWjE4QIPj7vUKN4Nrfs7ML6Y2OyS830JCnofg/k7lpFpt4SqZc5HGg1HCOrHvOdC8bP6FGDbE/VV0mX4IakzbdS/op+Kt3G24/8QbBV7y86sGSQ/vZzU8FXs7u6jIvwchsEP2BpIhW3G8uWNwa3HmjfH/ZjhhCWvluAcF+nMf14ClKg5hGgtPLJ98ueNAkc5Hs2WZlk2QHvfreCK1CCGO6nMZVSb99VM/ajr8WHTte9JSmkXq/i/U943HEbdzW6Re/S88dKgg8pGOLlAeNiqrcLkUR3/aClFpMXcOUP3rmETcWSfMXZE3TUOi8i+fqRnTYLflVx/Vb/6GJ7eIRZUA6k3RYR3iFSK9c4iDdNwJuZL2FKz/IK5VimcNWEqdXjSoxSgmF0UPlDoUlNrPcM7ftmA8Y9gKiqKEHuWN+AZRIwtVSxye2Kf8rM3lhJ5XcBXU9n4v0Oy1RU2M+4qM8AQPVwse8ErNSob5oFPWxuqZnVzo1qB/IBxkM3EVUKFUUlO3e51259GgNcJbCmlvrdjtoTW7rChm1wyCKzpCTwozUUEOIcWLneRLgMXh+SjGSFkAllzbGS5HK7LlfCMRNRDSvbQPjcXaenNYxCvu2Qyznz6StuxVj66SgI0T8B6/sfHAJYZaZ78thjOSIFumNWLQbeZixDCCC+v0YBtkxiBB3jefHqZ/dFHU+crbj6OvS1x/JDD7vlm7zOVPwpUC01nhxZuY/63E7g");function b(e){return e>>24&255}function E(e){return 16777215&e}const _=new Map(s(v).flatMap(((e,t)=>e.map((e=>[e,t+1<<24]))))),A=new Set(i(v)),T=new Map,w=new Map;for(let[e,t]of a(v)){if(!A.has(e)&&2==t.length){let[r,n]=t,o=w.get(r);o||(o=new Map,w.set(r,o)),o.set(n,e)}T.set(e,t.reverse())}const I=44032,R=4352,P=4449,x=4519;function O(e){return e>=I&&e<55204}function S(e,t){if(e>=R&&e<4371&&t>=P&&t<4470)return I+588*(e-R)+28*(t-P);if(O(e)&&t>x&&t<4547&&(e-I)%28==0)return e+(t-x);{let r=w.get(e);return r&&(r=r.get(t),r)?r:-1}}function C(e){let t=[],r=[],n=!1;function o(e){let r=_.get(e);r&&(n=!0,e|=r),t.push(e)}for(let n of e)for(;;){if(n<128)t.push(n);else if(O(n)){let e=n-I,t=e%588/28|0,r=e%28;o(R+(e/588|0)),o(P+t),r>0&&o(x+r)}else{let e=T.get(n);e?r.push(...e):o(n)}if(!r.length)break;n=r.pop()}if(n&&t.length>1){let e=b(t[0]);for(let r=1;r<t.length;r++){let n=b(t[r]);if(0==n||e<=n){e=n;continue}let o=r-1;for(;;){let r=t[o+1];if(t[o+1]=t[o],t[o]=r,!o)break;if(e=b(t[--o]),e<=n)break}e=b(t[r])}}return t}function B(e){return C(e).map(E)}function k(e){return function(e){let t=[],r=[],n=-1,o=0;for(let i of e){let e=b(i),s=E(i);if(-1==n)0==e?n=s:t.push(s);else if(o>0&&o>=e)0==e?(t.push(n,...r),r.length=0,n=s):r.push(s),o=e;else{let i=S(n,s);i>=0?n=i:0==o&&0==e?(t.push(n),n=s):(r.push(s),o=e)}}return n>=0&&t.push(n,...r),t}(C(e))}const N=65039,M=".";function L(){return new Set(i(h))}const D=new Map(a(h)),F=L(),H=L(),j=L(),U=L(),G=s(h);function V(){return new Set([i(h).map((e=>G[e])),i(h)].flat(2))}const W=h(),Z=c((e=>{let t=c(h).map((e=>e+96));if(t.length){let r=e>=W;t[0]-=32,t=g(t),r&&(t=`Restricted[${t}]`);let n=V(),o=V(),i=[...n,...o].sort(((e,t)=>e-t));return{N:t,P:n,M:h()-1,R:r,V:new Set(i)}}})),q=L(),z=new Map;[...q,...L()].sort(((e,t)=>e-t)).map(((e,t,r)=>{let n=h(),o=r[t]=n?r[t-n]:{V:[],M:new Map};o.V.push(e),q.has(e)||z.set(e,o)}));for(let{V:e,M:t}of new Set(z.values())){let r=[];for(let t of e){let e=Z.filter((e=>e.V.has(t))),n=r.find((({G:t})=>e.some((e=>t.has(e)))));n||(n={G:new Set,V:[]},r.push(n)),n.V.push(t),e.forEach((e=>n.G.add(e)))}let n=r.flatMap((({G:e})=>[...e]));for(let{G:e,V:o}of r){let r=new Set(n.filter((t=>!e.has(t))));for(let e of o)t.set(e,r)}}let K=new Set,Q=new Set;for(let e of Z)for(let t of e.V)(K.has(t)?Q:K).add(t);for(let e of K)z.has(e)||Q.has(e)||z.set(e,1);const X=new Set([...K,...B(K)]),J=i(h),Y=function e(t){let r=c((()=>{let t=i(h).map((e=>J[e]));if(t.length)return e(t)})).sort(((e,t)=>t.Q.size-e.Q.size)),n=h(),o=n%3;n=n/3|0;let s=1&n;return n>>=1,{B:r,V:o,F:s,S:1&n,C:2&n,Q:new Set(t)}}([]);class $ extends Array{get is_emoji(){return!0}}function ee(e,t=p){let r=[];ne(e[0])&&r.push("◌");let n=0,o=e.length;for(let i=0;i<o;i++){let o=e[i];oe(o)&&(r.push(g(e.slice(n,i))),r.push(t(o)),n=i+1)}return r.push(g(e.slice(n,o))),r.join("")}function te(e){return(oe(e)?"":`"${ee([e])}" `)+p(e)}function re(e){for(let t=e.lastIndexOf(95);t>0;)if(95!==e[--t])throw new Error("underscore allowed only at start")}function ne(e){return H.has(e)}function oe(e){return j.has(e)}function ie(e,t){let r=0;return e.split(M).map((e=>{let n,o=m(e),i={input:o,offset:r};r+=o.length+1;try{let e,r=i.tokens=de(o,k),s=r.length;if(!s)throw new Error("empty label");{let o=r[0],a=s>1||o.is_emoji;if(!a&&o.every((e=>e<128)))n=o,re(n),function(e){if(e.length>=4&&45==e[2]&&45==e[3])throw new Error("invalid label extension")}(n),e="ASCII";else if(a&&(i.emoji=!0,o=r.flatMap((e=>e.is_emoji?[]:e))),n=r.flatMap((e=>!t&&e.is_emoji?le(e):e)),re(n),o.length){if(H.has(n[0]))throw ue("leading combining mark");for(let e=1;e<s;e++){let t=r[e];if(!t.is_emoji&&H.has(t[0]))throw ue(`emoji + combining mark: "${g(r[e-1])} + ${ee([t[0]])}"`)}!function(e){let t=e[0],r=f.get(t);if(r)throw ue(`leading ${r}`);let n=e.length,o=-1;for(let i=1;i<n;i++){t=e[i];let n=f.get(t);if(n){if(o==i)throw ue(`${r} + ${n}`);o=i+1,r=n}}if(o==n)throw ue(`trailing ${r}`)}(n);let t=[...new Set(o)],[i]=function(e){let t=Z;for(let r of e){let e=t.filter((e=>e.V.has(r)));if(!e.length)throw t===Z?ae(r):ce(t[0],r);if(t=e,1==e.length)break}return t}(t);!function(e,t){let{V:r,M:n}=e;for(let n of t)if(!r.has(n))throw ce(e,n);if(n>=0)for(let r=1,o=B(t).length;r<o;r++)if(H.has(t[r])){let i=r+1;for(;i<o&&H.has(t[i]);)i++;if(i-r>n)throw new Error(`too many combining marks: ${e.N} "${g(t.slice(r-1,i))}" (${i-r}/${n})`);r=i}}(i,o),function(e,t){let r,n=[];for(let e of t){let t=z.get(e);if(1===t)return;if(t){let n=t.M.get(e);if(r=r?r.filter((e=>n.has(e))):[...n],!r.length)return}else n.push(e)}if(r)for(let t of r)if(n.every((e=>t.V.has(e))))throw new Error(`whole-script confusable: ${e.N}/${t.N}`)}(i,t),e=i.N}else e="Emoji"}i.type=e}catch(e){i.error=e}return i.output=n,i}))}function se(e){return e.map((({input:t,error:r,output:n})=>{if(r){let n=r.message;throw new Error(1==e.length?n:`Invalid label "${ee(t)}": ${n}`)}return g(n)})).join(M)}function ae(e){return new Error(`disallowed character: ${te(e)}`)}function ce(e,t){let r=te(t),n=Z.find((e=>e.P.has(t)));return n&&(r=`${n.N} ${r}`),new Error(`illegal mixture: ${e.N} + ${r}`)}function ue(e){return new Error(`illegal placement: ${e}`)}function de(e,t){let r=[],n=[];for(e=e.slice().reverse();e.length;){let o=he(e);if(o)n.length&&(r.push(t(n)),n=[]),r.push(o);else{let t=e.pop();if(X.has(t))n.push(t);else{let e=D.get(t);if(e)n.push(...e);else if(!F.has(t))throw ae(t)}}}return n.length&&r.push(t(n)),r}function le(e){return e.filter((e=>e!=N))}function he(e,t){let r,n,o=Y,i=[],s=e.length;for(t&&(t.length=0);s;){let a=e[--s];if(o=o.B.find((e=>e.Q.has(a))),!o)break;if(o.S)n=a;else if(o.C&&a===n)break;i.push(a),o.F&&(i.push(N),s>0&&e[s-1]==N&&s--),o.V&&(r=fe(i,o),t&&t.push(...e.slice(s).reverse()),e.length=s)}return r}function fe(e,t){let r=$.from(e);return 2==t.V&&r.splice(1,1),r}const pe="valid",me="mapped",ge="ignored";function ye(e){return e==pe||e==me}function ve(e){return e.some((e=>U.has(e)))}function be(e){for(let t=0;t<e.length;t++)if(e[t].type==pe){let r=t+1;for(;r<e.length&&e[r].type==pe;)r++;e.splice(t,r-t,{type:pe,cps:e.slice(t,r).flatMap((e=>e.cps))})}return e}t.ens_beautify=function(e){let t=ie(e,!0);for(let{type:e,output:r,error:n}of t)if(!n&&"Greek"!==e){let e=0;for(;;){let t=r.indexOf(958,e);if(t<0)break;r[t]=926,e=t+1}}return se(t)},t.ens_emoji=function(){let e=[];return function t(r,n,o){if(r.S)o=n[n.length-1];else if(r.C&&o===n[n.length-1])return;r.F&&n.push(N),r.V&&e.push(fe(n,r));for(let e of r.B)for(let r of e.Q)t(e,[...n,r],o)}(Y,[]),e.sort(y)},t.ens_normalize=function(e){return se(ie(e))},t.ens_normalize_fragment=function(e,t){let r=t?B:k;return e.split(M).map((e=>g(de(m(e),r).flatMap((e=>e.is_emoji?le(e):e))))).join(M)},t.ens_split=ie,t.ens_tokenize=function e(t,{nf:r=!0}={}){let n=m(t).reverse(),o=[],i=[];for(;n.length;){let e=he(n,o);if(e)i.push({type:"emoji",emoji:e,input:o.slice(),cps:le(e)});else{let e=n.pop();if(46==e)i.push({type:"stop",cp:e});else if(X.has(e))i.push({type:pe,cps:[e]});else if(F.has(e))i.push({type:ge,cp:e});else{let t=D.get(e);t?i.push({type:me,cp:e,cps:t.slice()}):i.push({type:"disallowed",cp:e})}}}if(r)for(let t=0,r=-1;t<i.length;t++){let n=i[t];if(ye(n.type))if(ve(n.cps)){let n=t+1;for(let e=n;e<i.length;e++){let{type:t,cps:r}=i[e];if(ye(t)){if(!ve(r))break;n=e+1}else if(t!==ge)break}r<0&&(r=t);let o=i.slice(r,n),s=o.flatMap((e=>ye(e.type)?e.cps:[])),a=k(s);y(a,s)?(i.splice(r,n-r,{type:"nfc",input:s,cps:a,tokens0:be(o),tokens:e(g(a),{nf:!1})}),t=r):t=n-1,r=-1}else r=t;else n.type!==ge&&(r=-1)}return be(i)},t.is_combining_mark=ne,t.nfc=k,t.nfd=B,t.safe_str_from_cps=ee,t.should_escape=oe},1732:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.outputSyncingFormatter=t.outputPostFormatter=t.inputPostFormatter=t.outputBlockFormatter=t.outputTransactionReceiptFormatter=t.outputLogFormatter=t.inputLogFormatter=t.inputTopicFormatter=t.outputTransactionFormatter=t.inputSignFormatter=t.inputTransactionFormatter=t.inputCallFormatter=t.txInputOptionsFormatter=t.inputAddressFormatter=t.inputDefaultBlockNumberFormatter=t.inputBlockNumberFormatter=t.outputBigIntegerFormatter=t.outputProofFormatter=t.inputStorageKeysFormatter=void 0;const n=r(5071),o=r(9910),i=r(9970),s=r(9634),a=r(7345);t.inputStorageKeysFormatter=e=>e.map((e=>(0,s.numberToHex)(e))),t.outputProofFormatter=e=>({address:(0,s.toChecksumAddress)(e.address),nonce:(0,s.hexToNumberString)(e.nonce),balance:(0,s.hexToNumberString)(e.balance)}),t.outputBigIntegerFormatter=e=>(0,s.toNumber)(e),t.inputBlockNumberFormatter=e=>{if(!(0,a.isNullish)(e))return"string"==typeof e&&(0,a.isBlockTag)(e)?e:"genesis"===e?"0x0":"string"==typeof e&&(0,s.isHexStrict)(e)?e.toLowerCase():(0,s.numberToHex)(e)},t.inputDefaultBlockNumberFormatter=(e,r)=>e?(0,t.inputBlockNumberFormatter)(e):(0,t.inputBlockNumberFormatter)(r),t.inputAddressFormatter=e=>{if(o.Iban.isValid(e)&&o.Iban.isDirect(e))return new o.Iban(e).toAddress().toLowerCase();if((0,s.isAddress)(e))return`0x${e.toLowerCase().replace("0x","")}`;throw new n.FormatterError(`Provided address ${e} is invalid, the capitalization checksum test failed, or it's an indirect IBAN address which can't be converted.`)},t.txInputOptionsFormatter=e=>{var r;const o=Object.assign({},e);if(e.to&&(o.to=(0,t.inputAddressFormatter)(e.to)),e.data&&e.input)throw new n.FormatterError('You can\'t have "data" and "input" as properties of transactions at the same time, please use either "data" or "input" instead.');if(!e.input&&e.data&&(o.input=e.data,delete o.data),e.input&&!e.input.startsWith("0x")&&(o.input=`0x${e.input}`),o.input&&!(0,s.isHexStrict)(o.input))throw new n.FormatterError("The input field must be HEX encoded data.");return(e.gas||e.gasLimit)&&(o.gas=(0,s.toNumber)(null!==(r=e.gas)&&void 0!==r?r:e.gasLimit)),(e.maxPriorityFeePerGas||e.maxFeePerGas)&&delete o.gasPrice,["gasPrice","gas","value","maxPriorityFeePerGas","maxFeePerGas","nonce","chainId"].filter((e=>!(0,a.isNullish)(o[e]))).forEach((e=>{o[e]=(0,s.numberToHex)(o[e])})),o},t.inputCallFormatter=(e,r)=>{var n;const o=(0,t.txInputOptionsFormatter)(e),i=null!==(n=o.from)&&void 0!==n?n:r;return i&&(o.from=(0,t.inputAddressFormatter)(i)),o},t.inputTransactionFormatter=(e,r)=>{var o;const i=(0,t.txInputOptionsFormatter)(e);if("number"!=typeof i.from&&(!i.from||"object"!=typeof i.from)){if(i.from=null!==(o=i.from)&&void 0!==o?o:r,!e.from&&"number"!=typeof e.from)throw new n.FormatterError('The send transactions "from" field must be defined!');i.from=(0,t.inputAddressFormatter)(e.from)}return i},t.inputSignFormatter=e=>(0,s.isHexStrict)(e)?e:(0,s.utf8ToHex)(e),t.outputTransactionFormatter=e=>{const r=Object.assign({},e);return e.blockNumber&&(r.blockNumber=(0,s.hexToNumber)(e.blockNumber)),e.transactionIndex&&(r.transactionIndex=(0,s.hexToNumber)(e.transactionIndex)),r.nonce=(0,s.hexToNumber)(e.nonce),r.gas=(0,s.hexToNumber)(e.gas),e.gasPrice&&(r.gasPrice=(0,t.outputBigIntegerFormatter)(e.gasPrice)),e.maxFeePerGas&&(r.maxFeePerGas=(0,t.outputBigIntegerFormatter)(e.maxFeePerGas)),e.maxPriorityFeePerGas&&(r.maxPriorityFeePerGas=(0,t.outputBigIntegerFormatter)(e.maxPriorityFeePerGas)),e.type&&(r.type=(0,s.hexToNumber)(e.type)),r.value=(0,t.outputBigIntegerFormatter)(e.value),e.to&&(0,s.isAddress)(e.to)?r.to=(0,s.toChecksumAddress)(e.to):r.to=void 0,e.from&&(r.from=(0,s.toChecksumAddress)(e.from)),r},t.inputTopicFormatter=e=>{if((0,a.isNullish)(e))return null;const t=String(e);return(0,a.isHex)(t)?t:(0,s.fromUtf8)(t)},t.inputLogFormatter=e=>{var r;const n=(0,a.isNullish)(e)?{}:(0,s.mergeDeep)({},e);return(0,a.isNullish)(n.fromBlock)&&(n.fromBlock=i.BlockTags.LATEST),n.fromBlock=(0,t.inputBlockNumberFormatter)(n.fromBlock),(0,a.isNullish)(n.toBlock)||(n.toBlock=(0,t.inputBlockNumberFormatter)(n.toBlock)),n.topics=null!==(r=n.topics)&&void 0!==r?r:[],n.topics=n.topics.map((e=>Array.isArray(e)?e.map(t.inputTopicFormatter):(0,t.inputTopicFormatter)(e))),n.address&&(n.address=Array.isArray(n.address)?n.address.map((e=>(0,t.inputAddressFormatter)(e))):(0,t.inputAddressFormatter)(n.address)),n},t.outputLogFormatter=e=>{const t=Object.assign({},e),r="string"==typeof e.logIndex?e.logIndex:(0,s.numberToHex)(e.logIndex);if("string"==typeof e.blockHash&&"string"==typeof e.transactionHash){const n=(0,s.sha3Raw)(`${e.blockHash.replace("0x","")}${e.transactionHash.replace("0x","")}${r.replace("0x","")}`);t.id=`log_${n.replace("0x","").slice(0,8)}`}else e.id||(t.id=void 0);return e.blockNumber&&(0,s.isHexStrict)(e.blockNumber)&&(t.blockNumber=(0,s.hexToNumber)(e.blockNumber)),e.transactionIndex&&(0,s.isHexStrict)(e.transactionIndex)&&(t.transactionIndex=(0,s.hexToNumber)(e.transactionIndex)),e.logIndex&&(0,s.isHexStrict)(e.logIndex)&&(t.logIndex=(0,s.hexToNumber)(e.logIndex)),e.address&&(t.address=(0,s.toChecksumAddress)(e.address)),t},t.outputTransactionReceiptFormatter=e=>{if("object"!=typeof e)throw new n.FormatterError(`Received receipt is invalid: ${String(e)}`);const r=Object.assign({},e);return e.blockNumber&&(r.blockNumber=(0,s.hexToNumber)(e.blockNumber)),e.transactionIndex&&(r.transactionIndex=(0,s.hexToNumber)(e.transactionIndex)),r.cumulativeGasUsed=(0,s.hexToNumber)(e.cumulativeGasUsed),r.gasUsed=(0,s.hexToNumber)(e.gasUsed),e.logs&&Array.isArray(e.logs)&&(r.logs=e.logs.map(t.outputLogFormatter)),e.effectiveGasPrice&&(r.effectiveGasPrice=(0,s.hexToNumber)(e.effectiveGasPrice)),e.contractAddress&&(r.contractAddress=(0,s.toChecksumAddress)(e.contractAddress)),e.status&&(r.status=Boolean(parseInt(e.status,10))),r},t.outputBlockFormatter=e=>{const r=Object.assign({},e);return r.gasLimit=(0,s.hexToNumber)(e.gasLimit),r.gasUsed=(0,s.hexToNumber)(e.gasUsed),r.size=(0,s.hexToNumber)(e.size),r.timestamp=(0,s.hexToNumber)(e.timestamp),e.number&&(r.number=(0,s.hexToNumber)(e.number)),e.difficulty&&(r.difficulty=(0,t.outputBigIntegerFormatter)(e.difficulty)),e.totalDifficulty&&(r.totalDifficulty=(0,t.outputBigIntegerFormatter)(e.totalDifficulty)),e.transactions&&Array.isArray(e.transactions)&&(r.transactions=e.transactions.map(t.outputTransactionFormatter)),e.miner&&(r.miner=(0,s.toChecksumAddress)(e.miner)),e.baseFeePerGas&&(r.baseFeePerGas=(0,t.outputBigIntegerFormatter)(e.baseFeePerGas)),r},t.inputPostFormatter=e=>{var t;const r=Object.assign({},e);return e.ttl&&(r.ttl=(0,s.numberToHex)(e.ttl)),e.workToProve&&(r.workToProve=(0,s.numberToHex)(e.workToProve)),e.priority&&(r.priority=(0,s.numberToHex)(e.priority)),e.topics&&!Array.isArray(e.topics)&&(r.topics=e.topics?[e.topics]:[]),r.topics=null===(t=r.topics)||void 0===t?void 0:t.map((e=>e.startsWith("0x")?e:(0,s.fromUtf8)(e))),r},t.outputPostFormatter=e=>{var t;const r=Object.assign({},e);return e.expiry&&(r.expiry=(0,s.hexToNumber)(e.expiry)),e.sent&&(r.sent=(0,s.hexToNumber)(e.sent)),e.ttl&&(r.ttl=(0,s.hexToNumber)(e.ttl)),e.workProved&&(r.workProved=(0,s.hexToNumber)(e.workProved)),e.topics||(r.topics=[]),r.topics=null===(t=r.topics)||void 0===t?void 0:t.map(s.toUtf8),r},t.outputSyncingFormatter=e=>{const t=Object.assign({},e);return t.startingBlock=(0,s.hexToNumber)(e.startingBlock),t.currentBlock=(0,s.hexToNumber)(e.currentBlock),t.highestBlock=(0,s.hexToNumber)(e.highestBlock),e.knownStates&&(t.knownStates=(0,s.hexToNumber)(e.knownStates)),e.pulledStates&&(t.pulledStates=(0,s.hexToNumber)(e.pulledStates)),t}},6527:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r);var o=Object.getOwnPropertyDescriptor(t,r);o&&!("get"in o?!t.__esModule:o.writable||o.configurable)||(o={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,o)}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),o=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),i=this&&this.__exportStar||function(e,t){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(t,r)||n(t,e,r)},s=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var r in e)"default"!==r&&Object.prototype.hasOwnProperty.call(e,r)&&n(t,e,r);return o(t,e),t};Object.defineProperty(t,"__esModule",{value:!0}),t.formatters=void 0,i(r(6171),t),i(r(8441),t),i(r(860),t),i(r(1819),t),i(r(8174),t),i(r(8202),t),i(r(7003),t),i(r(8165),t),i(r(1732),t),i(r(4738),t),i(r(8976),t),t.formatters=s(r(1732))},8165:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0})},7003:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.isSupportSubscriptions=t.isSupportedProvider=t.isLegacySendAsyncProvider=t.isLegacySendProvider=t.isEIP1193Provider=t.isLegacyRequestProvider=t.isMetaMaskProvider=t.isWeb3Provider=void 0;const n=r(9970);t.isWeb3Provider=e=>n.Web3BaseProvider.isWeb3Provider(e),t.isMetaMaskProvider=e=>"string"!=typeof e&&"request"in e&&"AsyncFunction"===e.request.constructor.name&&"isMetaMask"in e&&e.isMetaMask,t.isLegacyRequestProvider=e=>"string"!=typeof e&&"request"in e&&"Function"===e.request.constructor.name,t.isEIP1193Provider=e=>"string"!=typeof e&&"request"in e&&"AsyncFunction"===e.request.constructor.name,t.isLegacySendProvider=e=>"string"!=typeof e&&"send"in e,t.isLegacySendAsyncProvider=e=>"string"!=typeof e&&"sendAsync"in e,t.isSupportedProvider=e=>e&&((0,t.isWeb3Provider)(e)||(0,t.isEIP1193Provider)(e)||(0,t.isLegacyRequestProvider)(e)||(0,t.isLegacySendAsyncProvider)(e)||(0,t.isLegacySendProvider)(e)),t.isSupportSubscriptions=e=>e&&"supportsSubscriptions"in e?e.supportsSubscriptions():!(!e||"string"==typeof e||!("on"in e))},8202:function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.Web3BatchRequest=t.DEFAULT_BATCH_REQUEST_TIMEOUT=void 0;const o=r(9634),i=r(5071);t.DEFAULT_BATCH_REQUEST_TIMEOUT=1e3,t.Web3BatchRequest=class{constructor(e){this._requestManager=e,this._requests=new Map}get requests(){return[...this._requests.values()].map((e=>e.payload))}add(e){const t=o.jsonRpc.toPayload(e),r=new o.Web3DeferredPromise;return this._requests.set(t.id,{payload:t,promise:r}),r}execute(e){var r;return n(this,void 0,void 0,(function*(){if(0===this.requests.length)return Promise.resolve([]);const n=new o.Web3DeferredPromise({timeout:null!==(r=null==e?void 0:e.timeout)&&void 0!==r?r:t.DEFAULT_BATCH_REQUEST_TIMEOUT,eagerStart:!0,timeoutMessage:"Batch request timeout"});return this._processBatchRequest(n).catch((e=>n.reject(e))),n.catch((e=>{e instanceof i.OperationTimeoutError&&this._abortAllRequests("Batch request timeout"),n.reject(e)})),n}))}_processBatchRequest(e){var t,r;return n(this,void 0,void 0,(function*(){const n=yield this._requestManager.sendBatch([...this._requests.values()].map((e=>e.payload)));if(n.length!==this._requests.size)throw this._abortAllRequests("Invalid batch response"),new i.ResponseError(n,`Batch request size mismatch the results size. Requests: ${this._requests.size}, Responses: ${n.length}`);const s=this.requests.map((e=>e.id)).map(Number).sort(((e,t)=>e-t)),a=n.map((e=>e.id)).map(Number).sort(((e,t)=>e-t));if(JSON.stringify(s)!==JSON.stringify(a))throw this._abortAllRequests("Invalid batch response"),new i.ResponseError(n,`Batch request mismatch the results. Requests: [${s.join()}], Responses: [${a.join()}]`);for(const e of n)o.jsonRpc.isResponseWithResult(e)?null===(t=this._requests.get(e.id))||void 0===t||t.promise.resolve(e.result):o.jsonRpc.isResponseWithError(e)&&(null===(r=this._requests.get(e.id))||void 0===r||r.promise.reject(e.error));e.resolve(n)}))}_abortAllRequests(e){for(const{promise:t}of this._requests.values())t.reject(new i.OperationAbortError(e))}}},6171:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.Web3Config=t.Web3ConfigEvent=void 0;const n=r(9970),o=r(5071),i=r(9634),s=r(8976);var a;!function(e){e.CONFIG_CHANGE="CONFIG_CHANGE"}(a=t.Web3ConfigEvent||(t.Web3ConfigEvent={}));class c extends s.Web3EventEmitter{constructor(e){super(),this.config={handleRevert:!1,defaultAccount:void 0,defaultBlock:"latest",transactionBlockTimeout:50,transactionConfirmationBlocks:24,transactionPollingInterval:1e3,transactionPollingTimeout:75e4,transactionReceiptPollingInterval:void 0,transactionSendTimeout:75e4,transactionConfirmationPollingInterval:void 0,blockHeaderTimeout:10,maxListenersWarningThreshold:100,contractDataInputFill:"data",defaultNetworkId:void 0,defaultChain:"mainnet",defaultHardfork:"london",defaultCommon:void 0,defaultTransactionType:"0x2",defaultMaxPriorityFeePerGas:(0,i.toHex)(25e8),enableExperimentalFeatures:{useSubscriptionWhenCheckingBlockTimeout:!1,useRpcCallSpecification:!1},transactionBuilder:void 0,transactionTypeParser:void 0,defaultReturnFormat:n.DEFAULT_RETURN_FORMAT},this.setConfig(null!=e?e:{})}setConfig(e){const t=Object.keys(e);for(const r of t)this._triggerConfigChange(r,e[r]);Object.assign(this.config,e)}get handleRevert(){return this.config.handleRevert}set handleRevert(e){this._triggerConfigChange("handleRevert",e),this.config.handleRevert=e}get contractDataInputFill(){return this.config.contractDataInputFill}set contractDataInputFill(e){this._triggerConfigChange("contractDataInputFill",e),this.config.contractDataInputFill=e}get defaultAccount(){return this.config.defaultAccount}set defaultAccount(e){this._triggerConfigChange("defaultAccount",e),this.config.defaultAccount=e}get defaultBlock(){return this.config.defaultBlock}set defaultBlock(e){this._triggerConfigChange("defaultBlock",e),this.config.defaultBlock=e}get transactionSendTimeout(){return this.config.transactionSendTimeout}set transactionSendTimeout(e){this._triggerConfigChange("transactionSendTimeout",e),this.config.transactionSendTimeout=e}get transactionBlockTimeout(){return this.config.transactionBlockTimeout}set transactionBlockTimeout(e){this._triggerConfigChange("transactionBlockTimeout",e),this.config.transactionBlockTimeout=e}get transactionConfirmationBlocks(){return this.config.transactionConfirmationBlocks}set transactionConfirmationBlocks(e){this._triggerConfigChange("transactionConfirmationBlocks",e),this.config.transactionConfirmationBlocks=e}get transactionPollingInterval(){return this.config.transactionPollingInterval}set transactionPollingInterval(e){this._triggerConfigChange("transactionPollingInterval",e),this.config.transactionPollingInterval=e,this.transactionReceiptPollingInterval=e,this.transactionConfirmationPollingInterval=e}get transactionPollingTimeout(){return this.config.transactionPollingTimeout}set transactionPollingTimeout(e){this._triggerConfigChange("transactionPollingTimeout",e),this.config.transactionPollingTimeout=e}get transactionReceiptPollingInterval(){return this.config.transactionReceiptPollingInterval}set transactionReceiptPollingInterval(e){this._triggerConfigChange("transactionReceiptPollingInterval",e),this.config.transactionReceiptPollingInterval=e}get transactionConfirmationPollingInterval(){return this.config.transactionConfirmationPollingInterval}set transactionConfirmationPollingInterval(e){this._triggerConfigChange("transactionConfirmationPollingInterval",e),this.config.transactionConfirmationPollingInterval=e}get blockHeaderTimeout(){return this.config.blockHeaderTimeout}set blockHeaderTimeout(e){this._triggerConfigChange("blockHeaderTimeout",e),this.config.blockHeaderTimeout=e}get enableExperimentalFeatures(){return this.config.enableExperimentalFeatures}set enableExperimentalFeatures(e){this._triggerConfigChange("enableExperimentalFeatures",e),this.config.enableExperimentalFeatures=e}get maxListenersWarningThreshold(){return this.config.maxListenersWarningThreshold}set maxListenersWarningThreshold(e){this._triggerConfigChange("maxListenersWarningThreshold",e),this.setMaxListenerWarningThreshold(e),this.config.maxListenersWarningThreshold=e}get defaultReturnFormat(){return this.config.defaultReturnFormat}set defaultReturnFormat(e){this._triggerConfigChange("defaultReturnFormat",e),this.config.defaultReturnFormat=e}get defaultNetworkId(){return this.config.defaultNetworkId}set defaultNetworkId(e){this._triggerConfigChange("defaultNetworkId",e),this.config.defaultNetworkId=e}get defaultChain(){return this.config.defaultChain}set defaultChain(e){if(!(0,i.isNullish)(this.config.defaultCommon)&&!(0,i.isNullish)(this.config.defaultCommon.baseChain)&&e!==this.config.defaultCommon.baseChain)throw new o.ConfigChainMismatchError(this.config.defaultChain,e);this._triggerConfigChange("defaultChain",e),this.config.defaultChain=e}get defaultHardfork(){return this.config.defaultHardfork}set defaultHardfork(e){if(!(0,i.isNullish)(this.config.defaultCommon)&&!(0,i.isNullish)(this.config.defaultCommon.hardfork)&&e!==this.config.defaultCommon.hardfork)throw new o.ConfigHardforkMismatchError(this.config.defaultCommon.hardfork,e);this._triggerConfigChange("defaultHardfork",e),this.config.defaultHardfork=e}get defaultCommon(){return this.config.defaultCommon}set defaultCommon(e){if(!(0,i.isNullish)(this.config.defaultHardfork)&&!(0,i.isNullish)(e)&&!(0,i.isNullish)(e.hardfork)&&this.config.defaultHardfork!==e.hardfork)throw new o.ConfigHardforkMismatchError(this.config.defaultHardfork,e.hardfork);if(!(0,i.isNullish)(this.config.defaultChain)&&!(0,i.isNullish)(e)&&!(0,i.isNullish)(e.baseChain)&&this.config.defaultChain!==e.baseChain)throw new o.ConfigChainMismatchError(this.config.defaultChain,e.baseChain);this._triggerConfigChange("defaultCommon",e),this.config.defaultCommon=e}get defaultTransactionType(){return this.config.defaultTransactionType}set defaultTransactionType(e){this._triggerConfigChange("defaultTransactionType",e),this.config.defaultTransactionType=e}get defaultMaxPriorityFeePerGas(){return this.config.defaultMaxPriorityFeePerGas}set defaultMaxPriorityFeePerGas(e){this._triggerConfigChange("defaultMaxPriorityFeePerGas",e),this.config.defaultMaxPriorityFeePerGas=e}get transactionBuilder(){return this.config.transactionBuilder}set transactionBuilder(e){this._triggerConfigChange("transactionBuilder",e),this.config.transactionBuilder=e}get transactionTypeParser(){return this.config.transactionTypeParser}set transactionTypeParser(e){this._triggerConfigChange("transactionTypeParser",e),this.config.transactionTypeParser=e}_triggerConfigChange(e,t){this.emit(a.CONFIG_CHANGE,{name:e,oldValue:this.config[e],newValue:t})}}t.Web3Config=c},8174:function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.Web3EthPluginBase=t.Web3PluginBase=t.Web3Context=void 0;const o=r(5071),i=r(9634),s=r(9247),a=r(7003),c=r(8202),u=r(6171),d=r(8441),l=r(860);class h extends u.Web3Config{constructor(e){var t;if(super(),this.providers=d.Web3RequestManager.providers,(0,i.isNullish)(e)||"string"==typeof e&&""!==e.trim()||(0,a.isSupportedProvider)(e))return this._requestManager=new d.Web3RequestManager(e),void(this._subscriptionManager=new l.Web3SubscriptionManager(this._requestManager,{}));const{config:r,provider:n,requestManager:o,subscriptionManager:s,registeredSubscriptions:c,accountProvider:u,wallet:h,requestManagerMiddleware:f}=e;this.setConfig(null!=r?r:{}),this._requestManager=null!=o?o:new d.Web3RequestManager(n,null===(t=null==r?void 0:r.enableExperimentalFeatures)||void 0===t?void 0:t.useSubscriptionWhenCheckingBlockTimeout,f),this._subscriptionManager=s||new l.Web3SubscriptionManager(this.requestManager,null!=c?c:{}),u&&(this._accountProvider=u),h&&(this._wallet=h)}get requestManager(){return this._requestManager}get subscriptionManager(){return this._subscriptionManager}get wallet(){return this._wallet}get accountProvider(){return this._accountProvider}static fromContextObject(...e){return new this(...e.reverse())}getContextObject(){var e;return{config:this.config,provider:this.provider,requestManager:this.requestManager,subscriptionManager:this.subscriptionManager,registeredSubscriptions:null===(e=this.subscriptionManager)||void 0===e?void 0:e.registeredSubscriptions,providers:this.providers,wallet:this.wallet,accountProvider:this.accountProvider}}use(e,...t){const r=new e(...[...t,this.getContextObject()]);return this.on(u.Web3ConfigEvent.CONFIG_CHANGE,(e=>{r.setConfig({[e.name]:e.newValue})})),this[e.name]=r,r}link(e){this.setConfig(e.config),this._requestManager=e.requestManager,this.provider=e.provider,this._subscriptionManager=e.subscriptionManager,this._wallet=e.wallet,this._accountProvider=e._accountProvider,e.on(u.Web3ConfigEvent.CONFIG_CHANGE,(e=>{this.setConfig({[e.name]:e.newValue})}))}registerPlugin(e){if(void 0!==this[e.pluginNamespace])throw new o.ExistingPluginNamespaceError(e.pluginNamespace);const t={[e.pluginNamespace]:e};t[e.pluginNamespace].link(this),Object.assign(this,t)}get provider(){return this.currentProvider}set provider(e){this.requestManager.setProvider(e)}get currentProvider(){return this.requestManager.provider}set currentProvider(e){this.requestManager.setProvider(e)}get givenProvider(){return h.givenProvider}setProvider(e){return this.provider=e,!0}setRequestManagerMiddleware(e){this.requestManager.setMiddleware(e)}get BatchRequest(){return c.Web3BatchRequest.bind(void 0,this._requestManager)}extend(e){var t;return e.property&&!this[e.property]&&(this[e.property]={}),null===(t=e.methods)||void 0===t||t.forEach((t=>{const r=(...e)=>n(this,void 0,void 0,(function*(){return this.requestManager.send({method:t.call,params:e})}));e.property?this[e.property][t.name]=r:this[t.name]=r})),this}}t.Web3Context=h,h.providers=d.Web3RequestManager.providers;class f extends h{registerNewTransactionType(e,t){s.TransactionFactory.registerTransactionType(e,t)}}t.Web3PluginBase=f,t.Web3EthPluginBase=class extends f{}},8976:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.Web3EventEmitter=void 0;const n=r(9634);t.Web3EventEmitter=class{constructor(){this._emitter=new n.EventEmitter}on(e,t){this._emitter.on(e,t)}once(e,t){this._emitter.once(e,t)}off(e,t){this._emitter.off(e,t)}emit(e,t){this._emitter.emit(e,t)}listenerCount(e){return this._emitter.listenerCount(e)}listeners(e){return this._emitter.listeners(e)}eventNames(){return this._emitter.eventNames()}removeAllListeners(){return this._emitter.removeAllListeners()}setMaxListenerWarningThreshold(e){this._emitter.setMaxListeners(e)}getMaxListeners(){return this._emitter.getMaxListeners()}}},4738:function(e,t,r){"use strict";var n,o=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.Web3PromiEvent=void 0;const i=r(8976);class s extends i.Web3EventEmitter{constructor(e){super(),this[n]="Promise",this._promise=new Promise(e)}then(e,t){return o(this,void 0,void 0,(function*(){return this._promise.then(e,t)}))}catch(e){return o(this,void 0,void 0,(function*(){return this._promise.catch(e)}))}finally(e){return o(this,void 0,void 0,(function*(){return this._promise.finally(e)}))}on(e,t){return super.on(e,t),this}once(e,t){return super.once(e,t),this}}t.Web3PromiEvent=s,n=Symbol.toStringTag},8441:function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))},o=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.Web3RequestManager=t.Web3RequestManagerEvent=void 0;const i=r(5071),s=o(r(2636)),a=o(r(1161)),c=r(9634),u=r(7003),d=r(8976);var l;!function(e){e.PROVIDER_CHANGED="PROVIDER_CHANGED",e.BEFORE_PROVIDER_CHANGE="BEFORE_PROVIDER_CHANGE"}(l=t.Web3RequestManagerEvent||(t.Web3RequestManagerEvent={}));const h={HttpProvider:s.default,WebsocketProvider:a.default};class f extends d.Web3EventEmitter{constructor(e,t,r){super(),(0,c.isNullish)(e)||this.setProvider(e),this.useRpcCallSpecification=t,(0,c.isNullish)(r)||(this.middleware=r)}static get providers(){return h}get provider(){return this._provider}get providers(){return h}setProvider(e){let t;if(e&&"string"==typeof e&&this.providers)if(/^http(s)?:\/\//i.test(e))t=new this.providers.HttpProvider(e);else{if(!/^ws(s)?:\/\//i.test(e))throw new i.ProviderError(`Can't autodetect provider for "${e}"`);t=new this.providers.WebsocketProvider(e)}else t=(0,c.isNullish)(e)?void 0:e;return this.emit(l.BEFORE_PROVIDER_CHANGE,this._provider),this._provider=t,this.emit(l.PROVIDER_CHANGED,this._provider),!0}setMiddleware(e){this.middleware=e}send(e){return n(this,void 0,void 0,(function*(){const t=Object.assign({},e);let r=yield this._sendRequest(t);if((0,c.isNullish)(this.middleware)||(r=yield this.middleware.processResponse(r)),c.jsonRpc.isResponseWithResult(r))return r.result;throw new i.ResponseError(r)}))}sendBatch(e){return n(this,void 0,void 0,(function*(){return yield this._sendRequest(e)}))}_sendRequest(e){return n(this,void 0,void 0,(function*(){const{provider:t}=this;if((0,c.isNullish)(t))throw new i.ProviderError("Provider not available. Use `.setProvider` or `.provider=` to initialize the provider.");let r=c.jsonRpc.isBatchRequest(e)?c.jsonRpc.toBatchPayload(e):c.jsonRpc.toPayload(e);if((0,c.isNullish)(this.middleware)||(r=yield this.middleware.processRequest(r)),(0,u.isWeb3Provider)(t)){let e;try{e=yield t.request(r)}catch(t){e=t}return this._processJsonRpcResponse(r,e,{legacy:!1,error:!1})}if((0,u.isEIP1193Provider)(t))return t.request(r).then((e=>this._processJsonRpcResponse(r,e,{legacy:!0,error:!1}))).catch((e=>this._processJsonRpcResponse(r,e,{legacy:!0,error:!0})));if((0,u.isLegacyRequestProvider)(t))return new Promise(((e,n)=>{const o=e=>{n(this._processJsonRpcResponse(r,e,{legacy:!0,error:!0}))},i=t=>e(this._processJsonRpcResponse(r,t,{legacy:!0,error:!1})),s=t.request(r,((e,t)=>e?o(e):i(t)));(0,c.isPromise)(s)&&s.then(i).catch((e=>{try{const t=this._processJsonRpcResponse(r,e,{legacy:!0,error:!0});n(t)}catch(e){n(e)}}))}));if((0,u.isLegacySendProvider)(t))return new Promise(((e,n)=>{t.send(r,((t,o)=>{if(t)return n(this._processJsonRpcResponse(r,t,{legacy:!0,error:!0}));if((0,c.isNullish)(o))throw new i.ResponseError({},'Got a "nullish" response from provider.');return e(this._processJsonRpcResponse(r,o,{legacy:!0,error:!1}))}))}));if((0,u.isLegacySendAsyncProvider)(t))return t.sendAsync(r).then((e=>this._processJsonRpcResponse(r,e,{legacy:!0,error:!1}))).catch((e=>this._processJsonRpcResponse(r,e,{legacy:!0,error:!0})));throw new i.ProviderError("Provider does not have a request or send method to use.")}))}_processJsonRpcResponse(e,t,{legacy:r,error:n}){if((0,c.isNullish)(t))return this._buildResponse(e,null,n);if(c.jsonRpc.isResponseWithError(t)){if(this.useRpcCallSpecification&&(0,c.isResponseRpcError)(t)){const e=t;if(i.rpcErrorsMap.get(e.error.code))throw new(0,i.rpcErrorsMap.get(e.error.code).error)(e);throw new i.RpcError(e)}if(!f._isReverted(t))throw new i.InvalidResponseError(t,e)}if(c.jsonRpc.isResponseWithResult(t))return t;if(t instanceof Error)throw f._isReverted(t),t;if(!r&&c.jsonRpc.isBatchRequest(e)&&c.jsonRpc.isBatchResponse(t))return t;if(r&&!n&&c.jsonRpc.isBatchRequest(e))return t;if(r&&n&&c.jsonRpc.isBatchRequest(e))throw t;if(r&&!c.jsonRpc.isResponseWithError(t)&&!c.jsonRpc.isResponseWithResult(t))return this._buildResponse(e,t,n);if(c.jsonRpc.isBatchRequest(e)&&!Array.isArray(t))throw new i.ResponseError(t,"Got normal response for a batch request.");if(!c.jsonRpc.isBatchRequest(e)&&Array.isArray(t))throw new i.ResponseError(t,"Got batch response for a normal request.");throw new i.ResponseError(t,"Invalid response")}static _isReverted(e){let t;if(c.jsonRpc.isResponseWithError(e)?t=e.error:e instanceof Error&&(t=e),null==t?void 0:t.message.includes("revert"))throw new i.ContractExecutionError(t);return!1}_buildResponse(e,t,r){const n={jsonrpc:"2.0",id:c.jsonRpc.isBatchRequest(e)?e[0].id:"id"in e?e.id:null};return r?Object.assign(Object.assign({},n),{error:t}):Object.assign(Object.assign({},n),{result:t})}}t.Web3RequestManager=f},860:function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.Web3SubscriptionManager=void 0;const o=r(9970),i=r(5071),s=r(9634),a=r(7003),c=r(8441);t.Web3SubscriptionManager=class{constructor(e,t,r=!1){this.requestManager=e,this.registeredSubscriptions=t,this.tolerateUnlinkedSubscription=r,this._subscriptions=new Map,this.requestManager.on(c.Web3RequestManagerEvent.BEFORE_PROVIDER_CHANGE,(()=>n(this,void 0,void 0,(function*(){yield this.unsubscribe()})))),this.requestManager.on(c.Web3RequestManagerEvent.PROVIDER_CHANGED,(()=>{this.clear(),this.listenToProviderEvents()})),this.listenToProviderEvents()}listenToProviderEvents(){const e=this.requestManager.provider;this.requestManager.provider&&("function"!=typeof(null==e?void 0:e.supportsSubscriptions)||(null==e?void 0:e.supportsSubscriptions()))&&"function"==typeof this.requestManager.provider.on&&("function"==typeof this.requestManager.provider.request?this.requestManager.provider.on("message",(e=>this.messageListener(e))):e.on("data",(e=>this.messageListener(e))))}messageListener(e){var t,r,n;if(!e)throw new i.SubscriptionError("Should not call messageListener with no data. Type was");const o=(null===(t=e.params)||void 0===t?void 0:t.subscription)||(null===(r=e.data)||void 0===r?void 0:r.subscription)||(null===(n=e.id)||void 0===n?void 0:n.toString(16));if(o){const t=this._subscriptions.get(o);null==t||t.processSubscriptionData(e)}}subscribe(e,t,r=o.DEFAULT_RETURN_FORMAT){return n(this,void 0,void 0,(function*(){const n=this.registeredSubscriptions[e];if(!n)throw new i.SubscriptionError("Invalid subscription type");const o=new n(null!=t?t:void 0,{subscriptionManager:this,returnFormat:r});return yield this.addSubscription(o),o}))}get subscriptions(){return this._subscriptions}addSubscription(e){return n(this,void 0,void 0,(function*(){if(!this.requestManager.provider)throw new i.ProviderError("Provider not available");if(!this.supportsSubscriptions())throw new i.SubscriptionError("The current provider does not support subscriptions");if(e.id&&this._subscriptions.has(e.id))throw new i.SubscriptionError(`Subscription with id "${e.id}" already exists`);if(yield e.sendSubscriptionRequest(),(0,s.isNullish)(e.id))throw new i.SubscriptionError("Subscription is not subscribed yet.");return this._subscriptions.set(e.id,e),e.id}))}removeSubscription(e){return n(this,void 0,void 0,(function*(){const{id:t}=e;if((0,s.isNullish)(t))throw new i.SubscriptionError("Subscription is not subscribed yet. Or, had already been unsubscribed but not through the Subscription Manager.");if(!this._subscriptions.has(t)&&!this.tolerateUnlinkedSubscription)throw new i.SubscriptionError(`Subscription with id "${t.toString()}" does not exists`);return yield e.sendUnsubscribeRequest(),this._subscriptions.delete(t),t}))}unsubscribe(e){return n(this,void 0,void 0,(function*(){const t=[];for(const[r,n]of this.subscriptions.entries())(!e||"function"==typeof e&&e({id:r,sub:n}))&&t.push(this.removeSubscription(n));return Promise.all(t)}))}clear(){this._subscriptions.clear()}supportsSubscriptions(){return!(0,s.isNullish)(this.requestManager.provider)&&(0,a.isSupportSubscriptions)(this.requestManager.provider)}}},1819:function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.Web3Subscription=void 0;const o=r(9970),i=r(9634),s=r(860),a=r(8976);class c extends a.Web3EventEmitter{constructor(e,t){var r;super(),this.args=e;const{requestManager:n}=t,{subscriptionManager:i}=t;this._subscriptionManager=n?new s.Web3SubscriptionManager(n,{},!0):i,this._returnFormat=null!==(r=null==t?void 0:t.returnFormat)&&void 0!==r?r:o.DEFAULT_RETURN_FORMAT}get id(){return this._id}get lastBlock(){return this._lastBlock}subscribe(){return n(this,void 0,void 0,(function*(){return this._subscriptionManager.addSubscription(this)}))}processSubscriptionData(e){var t,r;(null==e?void 0:e.data)?this._processSubscriptionResult(null!==(r=null===(t=null==e?void 0:e.data)||void 0===t?void 0:t.result)&&void 0!==r?r:null==e?void 0:e.data):e&&i.jsonRpc.isResponseWithNotification(e)&&this._processSubscriptionResult(null==e?void 0:e.params.result)}sendSubscriptionRequest(){return n(this,void 0,void 0,(function*(){return this._id=yield this._subscriptionManager.requestManager.send({method:"eth_subscribe",params:this._buildSubscriptionParams()}),this.emit("connected",this._id),this._id}))}get returnFormat(){return this._returnFormat}get subscriptionManager(){return this._subscriptionManager}resubscribe(){return n(this,void 0,void 0,(function*(){yield this.unsubscribe(),yield this.subscribe()}))}unsubscribe(){return n(this,void 0,void 0,(function*(){this.id&&(yield this._subscriptionManager.removeSubscription(this))}))}sendUnsubscribeRequest(){return n(this,void 0,void 0,(function*(){yield this._subscriptionManager.requestManager.send({method:"eth_unsubscribe",params:[this.id]}),this._id=void 0}))}formatSubscriptionResult(e){return e}_processSubscriptionResult(e){this.emit("data",this.formatSubscriptionResult(e))}_processSubscriptionError(e){this.emit("error",e)}_buildSubscriptionParams(){throw new Error("Implement in the child class")}}t.Web3Subscription=c},7639:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.ERR_TX_POLLING_TIMEOUT=t.ERR_TX_DATA_AND_INPUT=t.ERR_TX_UNSUPPORTED_TYPE=t.ERR_TX_UNSUPPORTED_EIP_1559=t.ERR_TX_UNABLE_TO_POPULATE_NONCE=t.ERR_TX_INVALID_NONCE_OR_CHAIN_ID=t.ERR_TX_INVALID_OBJECT=t.ERR_TX_INVALID_LEGACY_FEE_MARKET=t.ERR_TX_INVALID_FEE_MARKET_GAS_PRICE=t.ERR_TX_INVALID_FEE_MARKET_GAS=t.ERR_TX_INVALID_LEGACY_GAS=t.ERR_TX_MISSING_GAS=t.ERR_TX_MISSING_CHAIN_INFO=t.ERR_TX_INVALID_CHAIN_INFO=t.ERR_TX_CHAIN_ID_MISMATCH=t.ERR_TX_MISSING_CUSTOM_CHAIN_ID=t.ERR_TX_MISSING_CUSTOM_CHAIN=t.ERR_TX_INVALID_CALL=t.ERR_TX_INVALID_SENDER=t.ERR_RAW_TX_UNDEFINED=t.ERR_TX_OUT_OF_GAS=t.ERR_TX_REVERT_WITHOUT_REASON=t.ERR_TX_CONTRACT_NOT_STORED=t.ERR_TX_NO_CONTRACT_ADDRESS=t.ERR_TX_REVERT_TRANSACTION=t.ERR_TX_REVERT_INSTRUCTION=t.ERR_TX=t.ERR_CONTRACT_TX_DATA_AND_INPUT=t.ERR_CONTRACT_EXECUTION_REVERTED=t.ERR_CONTRACT_INSTANTIATION=t.ERR_CONTRACT_MISSING_FROM_ADDRESS=t.ERR_CONTRACT_MISSING_ADDRESS=t.ERR_CONTRACT_MISSING_DEPLOY_DATA=t.ERR_CONTRACT_RESERVED_EVENT=t.ERR_CONTRACT_EVENT_NOT_EXISTS=t.ERR_CONTRACT_REQUIRED_CALLBACK=t.ERR_CONTRACT_ABI_MISSING=t.ERR_CONTRACT_RESOLVER_MISSING=t.ERR_CONTRACT=t.ERR_MULTIPLE_ERRORS=t.ERR_INVALID_METHOD_PARAMS=t.ERR_EXISTING_PLUGIN_NAMESPACE=t.ERR_ABI_ENCODING=t.ERR_OPERATION_ABORT=t.ERR_OPERATION_TIMEOUT=t.ERR_METHOD_NOT_IMPLEMENTED=t.ERR_FORMATTERS=t.ERR_PARAM=t.ERR_INVALID_RESPONSE=t.ERR_RESPONSE=void 0,t.ERR_INVALID_BYTES=t.ERR_INVALID_STRING=t.ERR_ENS_NETWORK_NOT_SYNCED=t.ERR_ENS_UNSUPPORTED_NETWORK=t.ERR_ENS_CHECK_INTERFACE_SUPPORT=t.JSONRPC_ERR_CHAIN_DISCONNECTED=t.JSONRPC_ERR_DISCONNECTED=t.JSONRPC_ERR_UNSUPPORTED_METHOD=t.JSONRPC_ERR_UNAUTHORIZED=t.JSONRPC_ERR_REJECTED_REQUEST=t.GENESIS_BLOCK_NUMBER=t.ERR_INVALID_SIGNATURE=t.ERR_SIGNATURE_FAILED=t.ERR_PBKDF2_ITERATIONS=t.ERR_INVALID_KEYSTORE=t.ERR_IV_LENGTH=t.ERR_INVALID_PASSWORD=t.ERR_KEY_VERSION_UNSUPPORTED=t.ERR_KEY_DERIVATION_FAIL=t.ERR_UNSUPPORTED_KDF=t.ERR_INVALID_PRIVATE_KEY=t.ERR_PRIVATE_KEY_LENGTH=t.ERR_WS_PROVIDER=t.ERR_SUBSCRIPTION=t.ERR_INVALID_CLIENT=t.ERR_INVALID_PROVIDER=t.ERR_PROVIDER=t.ERR_REQ_ALREADY_SENT=t.ERR_CONN_PENDING_REQUESTS=t.ERR_CONN_MAX_ATTEMPTS=t.ERR_CONN_CLOSE=t.ERR_CONN_NOT_OPEN=t.ERR_CONN_TIMEOUT=t.ERR_CONN_INVALID=t.ERR_CONN=t.ERR_TX_GAS_MISMATCH_INNER_ERROR=t.ERR_TX_MISSING_GAS_INNER_ERROR=t.ERR_TX_INVALID_PROPERTIES_FOR_TYPE=t.ERR_TX_REVERT_TRANSACTION_CUSTOM_ERROR=t.ERR_TX_INVALID_RECEIVER=t.ERR_TX_HARDFORK_MISMATCH=t.ERR_TX_CHAIN_MISMATCH=t.ERR_TX_GAS_MISMATCH=t.ERR_TX_SIGNING=t.ERR_TX_BLOCK_TIMEOUT=t.ERR_TX_SEND_TIMEOUT=t.ERR_TX_NOT_FOUND=t.ERR_TX_LOCAL_WALLET_NOT_AVAILABLE=t.ERR_TX_RECEIPT_MISSING_BLOCK_NUMBER=t.ERR_TX_RECEIPT_MISSING_OR_BLOCKHASH_NULL=void 0,t.ERR_RPC_NOT_SUPPORTED=t.ERR_RPC_LIMIT_EXCEEDED=t.ERR_RPC_UNSUPPORTED_METHOD=t.ERR_RPC_TRANSACTION_REJECTED=t.ERR_RPC_UNAVAILABLE_RESOURCE=t.ERR_RPC_MISSING_RESOURCE=t.ERR_RPC_INVALID_INPUT=t.ERR_RPC_INTERNAL_ERROR=t.ERR_RPC_INVALID_PARAMS=t.ERR_RPC_INVALID_METHOD=t.ERR_RPC_INVALID_REQUEST=t.ERR_RPC_INVALID_JSON=t.ERR_SCHEMA_FORMAT=t.ERR_CORE_CHAIN_MISMATCH=t.ERR_CORE_HARDFORK_MISMATCH=t.ERR_VALIDATION=t.ERR_INVALID_INTEGER=t.ERR_INVALID_NIBBLE_WIDTH=t.ERR_INVALID_TYPE_ABI=t.ERR_INVALID_BLOCK=t.ERR_INVALID_LARGE_VALUE=t.ERR_INVALID_SIZE=t.ERR_INVALID_UNSIGNED_INTEGER=t.ERR_INVALID_BOOLEAN=t.ERR_INVALID_TYPE=t.ERR_INVALID_HEX=t.ERR_INVALID_ADDRESS=t.ERR_INVALID_UNIT=t.ERR_INVALID_NUMBER=void 0,t.ERR_RESPONSE=100,t.ERR_INVALID_RESPONSE=101,t.ERR_PARAM=200,t.ERR_FORMATTERS=201,t.ERR_METHOD_NOT_IMPLEMENTED=202,t.ERR_OPERATION_TIMEOUT=203,t.ERR_OPERATION_ABORT=204,t.ERR_ABI_ENCODING=205,t.ERR_EXISTING_PLUGIN_NAMESPACE=206,t.ERR_INVALID_METHOD_PARAMS=207,t.ERR_MULTIPLE_ERRORS=208,t.ERR_CONTRACT=300,t.ERR_CONTRACT_RESOLVER_MISSING=301,t.ERR_CONTRACT_ABI_MISSING=302,t.ERR_CONTRACT_REQUIRED_CALLBACK=303,t.ERR_CONTRACT_EVENT_NOT_EXISTS=304,t.ERR_CONTRACT_RESERVED_EVENT=305,t.ERR_CONTRACT_MISSING_DEPLOY_DATA=306,t.ERR_CONTRACT_MISSING_ADDRESS=307,t.ERR_CONTRACT_MISSING_FROM_ADDRESS=308,t.ERR_CONTRACT_INSTANTIATION=309,t.ERR_CONTRACT_EXECUTION_REVERTED=310,t.ERR_CONTRACT_TX_DATA_AND_INPUT=311,t.ERR_TX=400,t.ERR_TX_REVERT_INSTRUCTION=401,t.ERR_TX_REVERT_TRANSACTION=402,t.ERR_TX_NO_CONTRACT_ADDRESS=403,t.ERR_TX_CONTRACT_NOT_STORED=404,t.ERR_TX_REVERT_WITHOUT_REASON=405,t.ERR_TX_OUT_OF_GAS=406,t.ERR_RAW_TX_UNDEFINED=407,t.ERR_TX_INVALID_SENDER=408,t.ERR_TX_INVALID_CALL=409,t.ERR_TX_MISSING_CUSTOM_CHAIN=410,t.ERR_TX_MISSING_CUSTOM_CHAIN_ID=411,t.ERR_TX_CHAIN_ID_MISMATCH=412,t.ERR_TX_INVALID_CHAIN_INFO=413,t.ERR_TX_MISSING_CHAIN_INFO=414,t.ERR_TX_MISSING_GAS=415,t.ERR_TX_INVALID_LEGACY_GAS=416,t.ERR_TX_INVALID_FEE_MARKET_GAS=417,t.ERR_TX_INVALID_FEE_MARKET_GAS_PRICE=418,t.ERR_TX_INVALID_LEGACY_FEE_MARKET=419,t.ERR_TX_INVALID_OBJECT=420,t.ERR_TX_INVALID_NONCE_OR_CHAIN_ID=421,t.ERR_TX_UNABLE_TO_POPULATE_NONCE=422,t.ERR_TX_UNSUPPORTED_EIP_1559=423,t.ERR_TX_UNSUPPORTED_TYPE=424,t.ERR_TX_DATA_AND_INPUT=425,t.ERR_TX_POLLING_TIMEOUT=426,t.ERR_TX_RECEIPT_MISSING_OR_BLOCKHASH_NULL=427,t.ERR_TX_RECEIPT_MISSING_BLOCK_NUMBER=428,t.ERR_TX_LOCAL_WALLET_NOT_AVAILABLE=429,t.ERR_TX_NOT_FOUND=430,t.ERR_TX_SEND_TIMEOUT=431,t.ERR_TX_BLOCK_TIMEOUT=432,t.ERR_TX_SIGNING=433,t.ERR_TX_GAS_MISMATCH=434,t.ERR_TX_CHAIN_MISMATCH=435,t.ERR_TX_HARDFORK_MISMATCH=436,t.ERR_TX_INVALID_RECEIVER=437,t.ERR_TX_REVERT_TRANSACTION_CUSTOM_ERROR=438,t.ERR_TX_INVALID_PROPERTIES_FOR_TYPE=439,t.ERR_TX_MISSING_GAS_INNER_ERROR=440,t.ERR_TX_GAS_MISMATCH_INNER_ERROR=441,t.ERR_CONN=500,t.ERR_CONN_INVALID=501,t.ERR_CONN_TIMEOUT=502,t.ERR_CONN_NOT_OPEN=503,t.ERR_CONN_CLOSE=504,t.ERR_CONN_MAX_ATTEMPTS=505,t.ERR_CONN_PENDING_REQUESTS=506,t.ERR_REQ_ALREADY_SENT=507,t.ERR_PROVIDER=600,t.ERR_INVALID_PROVIDER=601,t.ERR_INVALID_CLIENT=602,t.ERR_SUBSCRIPTION=603,t.ERR_WS_PROVIDER=604,t.ERR_PRIVATE_KEY_LENGTH=701,t.ERR_INVALID_PRIVATE_KEY=702,t.ERR_UNSUPPORTED_KDF=703,t.ERR_KEY_DERIVATION_FAIL=704,t.ERR_KEY_VERSION_UNSUPPORTED=705,t.ERR_INVALID_PASSWORD=706,t.ERR_IV_LENGTH=707,t.ERR_INVALID_KEYSTORE=708,t.ERR_PBKDF2_ITERATIONS=709,t.ERR_SIGNATURE_FAILED=801,t.ERR_INVALID_SIGNATURE=802,t.GENESIS_BLOCK_NUMBER="0x0",t.JSONRPC_ERR_REJECTED_REQUEST=4001,t.JSONRPC_ERR_UNAUTHORIZED=4100,t.JSONRPC_ERR_UNSUPPORTED_METHOD=4200,t.JSONRPC_ERR_DISCONNECTED=4900,t.JSONRPC_ERR_CHAIN_DISCONNECTED=4901,t.ERR_ENS_CHECK_INTERFACE_SUPPORT=901,t.ERR_ENS_UNSUPPORTED_NETWORK=902,t.ERR_ENS_NETWORK_NOT_SYNCED=903,t.ERR_INVALID_STRING=1001,t.ERR_INVALID_BYTES=1002,t.ERR_INVALID_NUMBER=1003,t.ERR_INVALID_UNIT=1004,t.ERR_INVALID_ADDRESS=1005,t.ERR_INVALID_HEX=1006,t.ERR_INVALID_TYPE=1007,t.ERR_INVALID_BOOLEAN=1008,t.ERR_INVALID_UNSIGNED_INTEGER=1009,t.ERR_INVALID_SIZE=1010,t.ERR_INVALID_LARGE_VALUE=1011,t.ERR_INVALID_BLOCK=1012,t.ERR_INVALID_TYPE_ABI=1013,t.ERR_INVALID_NIBBLE_WIDTH=1014,t.ERR_INVALID_INTEGER=1015,t.ERR_VALIDATION=1100,t.ERR_CORE_HARDFORK_MISMATCH=1101,t.ERR_CORE_CHAIN_MISMATCH=1102,t.ERR_SCHEMA_FORMAT=1200,t.ERR_RPC_INVALID_JSON=-32700,t.ERR_RPC_INVALID_REQUEST=-32600,t.ERR_RPC_INVALID_METHOD=-32601,t.ERR_RPC_INVALID_PARAMS=-32602,t.ERR_RPC_INTERNAL_ERROR=-32603,t.ERR_RPC_INVALID_INPUT=-32e3,t.ERR_RPC_MISSING_RESOURCE=-32001,t.ERR_RPC_UNAVAILABLE_RESOURCE=-32002,t.ERR_RPC_TRANSACTION_REJECTED=-32003,t.ERR_RPC_UNSUPPORTED_METHOD=-32004,t.ERR_RPC_LIMIT_EXCEEDED=-32005,t.ERR_RPC_NOT_SUPPORTED=-32006},8105:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.PBKDF2IterationsError=t.IVLengthError=t.InvalidPasswordError=t.KeyStoreVersionError=t.KeyDerivationError=t.InvalidKdfError=t.InvalidSignatureError=t.InvalidPrivateKeyError=t.PrivateKeyLengthError=void 0;const n=r(7639),o=r(3685);class i extends o.BaseWeb3Error{constructor(){super("Private key must be 32 bytes."),this.code=n.ERR_PRIVATE_KEY_LENGTH}}t.PrivateKeyLengthError=i;class s extends o.BaseWeb3Error{constructor(){super("Invalid Private Key, Not a valid string or uint8Array"),this.code=n.ERR_INVALID_PRIVATE_KEY}}t.InvalidPrivateKeyError=s;class a extends o.BaseWeb3Error{constructor(e){super(`"${e}"`),this.code=n.ERR_INVALID_SIGNATURE}}t.InvalidSignatureError=a;class c extends o.BaseWeb3Error{constructor(){super("Invalid key derivation function"),this.code=n.ERR_UNSUPPORTED_KDF}}t.InvalidKdfError=c;class u extends o.BaseWeb3Error{constructor(){super("Key derivation failed - possibly wrong password"),this.code=n.ERR_KEY_DERIVATION_FAIL}}t.KeyDerivationError=u;class d extends o.BaseWeb3Error{constructor(){super("Unsupported key store version"),this.code=n.ERR_KEY_VERSION_UNSUPPORTED}}t.KeyStoreVersionError=d;class l extends o.BaseWeb3Error{constructor(){super("Password cannot be empty"),this.code=n.ERR_INVALID_PASSWORD}}t.InvalidPasswordError=l;class h extends o.BaseWeb3Error{constructor(){super("Initialization vector must be 16 bytes"),this.code=n.ERR_IV_LENGTH}}t.IVLengthError=h;class f extends o.BaseWeb3Error{constructor(){super("c > 1000, pbkdf2 is less secure with less iterations"),this.code=n.ERR_PBKDF2_ITERATIONS}}t.PBKDF2IterationsError=f},3789:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.RequestAlreadySentError=t.PendingRequestsOnReconnectingError=t.MaxAttemptsReachedOnReconnectingError=t.ConnectionCloseError=t.ConnectionNotOpenError=t.ConnectionTimeoutError=t.InvalidConnectionError=t.ConnectionError=void 0;const n=r(7639),o=r(3685);class i extends o.BaseWeb3Error{constructor(e,t){super(e),this.code=n.ERR_CONN,t&&(this.errorCode=t.code,this.errorReason=t.reason)}toJSON(){return Object.assign(Object.assign({},super.toJSON()),{errorCode:this.errorCode,errorReason:this.errorReason})}}t.ConnectionError=i,t.InvalidConnectionError=class extends i{constructor(e,t){super(`CONNECTION ERROR: Couldn't connect to node ${e}.`,t),this.host=e,this.code=n.ERR_CONN_INVALID}toJSON(){return Object.assign(Object.assign({},super.toJSON()),{host:this.host})}},t.ConnectionTimeoutError=class extends i{constructor(e){super(`CONNECTION TIMEOUT: timeout of ${e}ms achieved`),this.duration=e,this.code=n.ERR_CONN_TIMEOUT}toJSON(){return Object.assign(Object.assign({},super.toJSON()),{duration:this.duration})}},t.ConnectionNotOpenError=class extends i{constructor(e){super("Connection not open",e),this.code=n.ERR_CONN_NOT_OPEN}},t.ConnectionCloseError=class extends i{constructor(e){var t,r;super(`CONNECTION ERROR: The connection got closed with the close code ${null!==(t=null==e?void 0:e.code)&&void 0!==t?t:""} and the following reason string ${null!==(r=null==e?void 0:e.reason)&&void 0!==r?r:""}`,e),this.code=n.ERR_CONN_CLOSE}},t.MaxAttemptsReachedOnReconnectingError=class extends i{constructor(e){super(`Maximum number of reconnect attempts reached! (${e})`),this.code=n.ERR_CONN_MAX_ATTEMPTS}},t.PendingRequestsOnReconnectingError=class extends i{constructor(){super("CONNECTION ERROR: Provider started to reconnect before the response got received!"),this.code=n.ERR_CONN_PENDING_REQUESTS}},t.RequestAlreadySentError=class extends i{constructor(e){super(`Request already sent with following id: ${e}`),this.code=n.ERR_REQ_ALREADY_SENT}}},510:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.ContractTransactionDataAndInputError=t.ContractExecutionError=t.Eip838ExecutionError=t.ContractInstantiationError=t.ContractNoFromAddressDefinedError=t.ContractNoAddressDefinedError=t.ContractMissingDeployDataError=t.ContractReservedEventError=t.ContractEventDoesNotExistError=t.ContractOnceRequiresCallbackError=t.ContractMissingABIError=t.ResolverMethodMissingError=t.Web3ContractError=void 0;const n=r(7639),o=r(3685);class i extends o.BaseWeb3Error{constructor(e,t){super(e),this.code=n.ERR_CONTRACT,this.receipt=t}}t.Web3ContractError=i;class s extends o.BaseWeb3Error{constructor(e,t){super(`The resolver at ${e} does not implement requested method: "${t}".`),this.address=e,this.name=t,this.code=n.ERR_CONTRACT_RESOLVER_MISSING}toJSON(){return Object.assign(Object.assign({},super.toJSON()),{address:this.address,name:this.name})}}t.ResolverMethodMissingError=s;class a extends o.BaseWeb3Error{constructor(){super("You must provide the json interface of the contract when instantiating a contract object."),this.code=n.ERR_CONTRACT_ABI_MISSING}}t.ContractMissingABIError=a;class c extends o.BaseWeb3Error{constructor(){super("Once requires a callback as the second parameter."),this.code=n.ERR_CONTRACT_REQUIRED_CALLBACK}}t.ContractOnceRequiresCallbackError=c;class u extends o.BaseWeb3Error{constructor(e){super(`Event "${e}" doesn't exist in this contract.`),this.eventName=e,this.code=n.ERR_CONTRACT_EVENT_NOT_EXISTS}toJSON(){return Object.assign(Object.assign({},super.toJSON()),{eventName:this.eventName})}}t.ContractEventDoesNotExistError=u;class d extends o.BaseWeb3Error{constructor(e){super(`Event "${e}" doesn't exist in this contract.`),this.type=e,this.code=n.ERR_CONTRACT_RESERVED_EVENT}toJSON(){return Object.assign(Object.assign({},super.toJSON()),{type:this.type})}}t.ContractReservedEventError=d;class l extends o.BaseWeb3Error{constructor(){super('No "data" specified in neither the given options, nor the default options.'),this.code=n.ERR_CONTRACT_MISSING_DEPLOY_DATA}}t.ContractMissingDeployDataError=l;class h extends o.BaseWeb3Error{constructor(){super("This contract object doesn't have address set yet, please set an address first."),this.code=n.ERR_CONTRACT_MISSING_ADDRESS}}t.ContractNoAddressDefinedError=h;class f extends o.BaseWeb3Error{constructor(){super('No "from" address specified in neither the given options, nor the default options.'),this.code=n.ERR_CONTRACT_MISSING_FROM_ADDRESS}}t.ContractNoFromAddressDefinedError=f;class p extends o.BaseWeb3Error{constructor(){super(...arguments),this.code=n.ERR_CONTRACT_INSTANTIATION}}t.ContractInstantiationError=p;class m extends i{constructor(e){if(super(e.message||"Error"),this.name="name"in e&&e.name||this.constructor.name,this.stack="stack"in e&&e.stack||void 0,this.code=e.code,"object"==typeof e.data){let t;t="originalError"in e.data?e.data.originalError:e.data,this.data=t.data,this.cause=new m(t)}else this.data=e.data}setDecodedProperties(e,t,r){this.errorName=e,this.errorSignature=t,this.errorArgs=r}toJSON(){let e=Object.assign(Object.assign({},super.toJSON()),{data:this.data});return this.errorName&&(e=Object.assign(Object.assign({},e),{errorName:this.errorName,errorSignature:this.errorSignature,errorArgs:this.errorArgs})),e}}t.Eip838ExecutionError=m,t.ContractExecutionError=class extends i{constructor(e){super("Error happened while trying to execute a function inside a smart contract"),this.code=n.ERR_CONTRACT_EXECUTION_REVERTED,this.cause=new m(e)}};class g extends o.InvalidValueError{constructor(e){var t,r;super(`data: ${null!==(t=e.data)&&void 0!==t?t:"undefined"}, input: ${null!==(r=e.input)&&void 0!==r?r:"undefined"}`,'You can\'t have "data" and "input" as properties of a contract at the same time, please use either "data" or "input" instead.'),this.code=n.ERR_CONTRACT_TX_DATA_AND_INPUT}}t.ContractTransactionDataAndInputError=g},3628:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.ConfigChainMismatchError=t.ConfigHardforkMismatchError=void 0;const n=r(3685),o=r(7639);class i extends n.BaseWeb3Error{constructor(e,t){super(`Web3Config hardfork doesnt match in defaultHardfork ${e} and common.hardfork ${t}`),this.code=o.ERR_CORE_HARDFORK_MISMATCH}}t.ConfigHardforkMismatchError=i;class s extends n.BaseWeb3Error{constructor(e,t){super(`Web3Config chain doesnt match in defaultHardfork ${e} and common.hardfork ${t}`),this.code=o.ERR_CORE_HARDFORK_MISMATCH}}t.ConfigChainMismatchError=s},1591:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.ENSNetworkNotSyncedError=t.ENSUnsupportedNetworkError=t.ENSCheckInterfaceSupportError=void 0;const n=r(7639),o=r(3685);class i extends o.BaseWeb3Error{constructor(e){super(`ENS resolver check interface support error. "${e}"`),this.code=n.ERR_ENS_CHECK_INTERFACE_SUPPORT}}t.ENSCheckInterfaceSupportError=i;class s extends o.BaseWeb3Error{constructor(e){super(`ENS is not supported on network ${e}`),this.code=n.ERR_ENS_UNSUPPORTED_NETWORK}}t.ENSUnsupportedNetworkError=s;class a extends o.BaseWeb3Error{constructor(){super("Network not synced"),this.code=n.ERR_ENS_NETWORK_NOT_SYNCED}}t.ENSNetworkNotSyncedError=a},7297:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.ExistingPluginNamespaceError=t.AbiError=t.OperationAbortError=t.OperationTimeoutError=t.MethodNotImplementedError=t.FormatterError=t.InvalidMethodParamsError=t.InvalidNumberOfParamsError=void 0;const n=r(7639),o=r(3685);class i extends o.BaseWeb3Error{constructor(e,t,r){super(`Invalid number of parameters for "${r}". Got "${e}" expected "${t}"!`),this.got=e,this.expected=t,this.method=r,this.code=n.ERR_PARAM}toJSON(){return Object.assign(Object.assign({},super.toJSON()),{got:this.got,expected:this.expected,method:this.method})}}t.InvalidNumberOfParamsError=i;class s extends o.BaseWeb3Error{constructor(e){super(`Invalid parameters passed. "${void 0!==e?e:""}"`),this.hint=e,this.code=n.ERR_INVALID_METHOD_PARAMS}toJSON(){return Object.assign(Object.assign({},super.toJSON()),{hint:this.hint})}}t.InvalidMethodParamsError=s;class a extends o.BaseWeb3Error{constructor(){super(...arguments),this.code=n.ERR_FORMATTERS}}t.FormatterError=a;class c extends o.BaseWeb3Error{constructor(){super("The method you're trying to call is not implemented."),this.code=n.ERR_METHOD_NOT_IMPLEMENTED}}t.MethodNotImplementedError=c;class u extends o.BaseWeb3Error{constructor(){super(...arguments),this.code=n.ERR_OPERATION_TIMEOUT}}t.OperationTimeoutError=u;class d extends o.BaseWeb3Error{constructor(){super(...arguments),this.code=n.ERR_OPERATION_ABORT}}t.OperationAbortError=d;class l extends o.BaseWeb3Error{constructor(e,t){super(e),this.code=n.ERR_ABI_ENCODING,this.props=null!=t?t:{}}}t.AbiError=l;class h extends o.BaseWeb3Error{constructor(e){super(`A plugin with the namespace: ${e} has already been registered.`),this.code=n.ERR_EXISTING_PLUGIN_NAMESPACE}}t.ExistingPluginNamespaceError=h},7108:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.Web3WSProviderError=t.SubscriptionError=t.InvalidClientError=t.InvalidProviderError=t.ProviderError=void 0;const n=r(7639),o=r(3685);class i extends o.BaseWeb3Error{constructor(){super(...arguments),this.code=n.ERR_PROVIDER}}t.ProviderError=i;class s extends o.BaseWeb3Error{constructor(e){super(`Provider with url "${e}" is not set or invalid`),this.clientUrl=e,this.code=n.ERR_INVALID_PROVIDER}}t.InvalidProviderError=s;class a extends o.BaseWeb3Error{constructor(e){super(`Client URL "${e}" is invalid.`),this.code=n.ERR_INVALID_CLIENT}}t.InvalidClientError=a;class c extends o.BaseWeb3Error{constructor(){super(...arguments),this.code=n.ERR_SUBSCRIPTION}}t.SubscriptionError=c;class u extends o.BaseWeb3Error{constructor(){super(...arguments),this.code=n.ERR_WS_PROVIDER}}t.Web3WSProviderError=u},9491:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.InvalidResponseError=t.ResponseError=void 0;const n=r(3685),o=r(7639),i=e=>(e=>!(Array.isArray(e)||"2.0"!==e.jsonrpc||!e||void 0!==e.result&&null!==e.result||!("error"in e)||"number"!=typeof e.id&&"string"!=typeof e.id))(e)?e.error.message:"";class s extends n.BaseWeb3Error{constructor(e,t,r){var s;let a;super(null!=t?t:`Returned error: ${Array.isArray(e)?e.map((e=>i(e))).join(","):i(e)}`),this.code=o.ERR_RESPONSE,t||(this.data=Array.isArray(e)?e.map((e=>{var t;return null===(t=e.error)||void 0===t?void 0:t.data})):null===(s=null==e?void 0:e.error)||void 0===s?void 0:s.data),this.request=r,"error"in e?a=e.error:e instanceof Array&&(a=e.filter((e=>e.error)).map((e=>e.error))),Array.isArray(a)&&a.length>0?this.cause=new n.MultipleErrors(a):this.cause=a}toJSON(){return Object.assign(Object.assign({},super.toJSON()),{data:this.data,request:this.request})}}t.ResponseError=s,t.InvalidResponseError=class extends s{constructor(e,t){let r;super(e,void 0,t),this.code=o.ERR_INVALID_RESPONSE,"error"in e?r=e.error:e instanceof Array&&(r=e.map((e=>e.error))),Array.isArray(r)?this.cause=new n.MultipleErrors(r):this.cause=r}}},4032:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.RpcErrorMessages=t.genericRpcErrorMessageTemplate=void 0;const n=r(7639);t.genericRpcErrorMessageTemplate="An Rpc error has occured with a code of *code*",t.RpcErrorMessages={[n.ERR_RPC_INVALID_JSON]:{message:"Parse error",description:"Invalid JSON"},[n.ERR_RPC_INVALID_REQUEST]:{message:"Invalid request",description:"JSON is not a valid request object\t"},[n.ERR_RPC_INVALID_METHOD]:{message:"Method not found",description:"Method does not exist\t"},[n.ERR_RPC_INVALID_PARAMS]:{message:"Invalid params",description:"Invalid method parameters"},[n.ERR_RPC_INTERNAL_ERROR]:{message:"Internal error",description:"Internal JSON-RPC error"},[n.ERR_RPC_INVALID_INPUT]:{message:"Invalid input",description:"Missing or invalid parameters"},[n.ERR_RPC_MISSING_RESOURCE]:{message:"Resource not found",description:"Requested resource not found"},[n.ERR_RPC_UNAVAILABLE_RESOURCE]:{message:"Resource unavailable",description:"Requested resource not available"},[n.ERR_RPC_TRANSACTION_REJECTED]:{message:"Transaction rejected",description:"Transaction creation failed"},[n.ERR_RPC_UNSUPPORTED_METHOD]:{message:"Method not supported",description:"Method is not implemented"},[n.ERR_RPC_LIMIT_EXCEEDED]:{message:"Limit exceeded",description:"Request exceeds defined limit"},[n.ERR_RPC_NOT_SUPPORTED]:{message:"JSON-RPC version not supported",description:"Version of JSON-RPC protocol is not supported"},[n.JSONRPC_ERR_REJECTED_REQUEST]:{name:"User Rejected Request",message:"The user rejected the request."},[n.JSONRPC_ERR_UNAUTHORIZED]:{name:"Unauthorized",message:"The requested method and/or account has not been authorized by the user."},[n.JSONRPC_ERR_UNSUPPORTED_METHOD]:{name:"Unsupported Method",message:"The Provider does not support the requested method."},[n.JSONRPC_ERR_DISCONNECTED]:{name:"Disconnected",message:"The Provider is disconnected from all chains."},[n.JSONRPC_ERR_CHAIN_DISCONNECTED]:{name:"Chain Disconnected",message:"The Provider is not connected to the requested chain."},"0-999":{name:"",message:"Not used."},1e3:{name:"Normal Closure",message:"The connection successfully completed the purpose for which it was created."},1001:{name:"Going Away",message:"The endpoint is going away, either because of a server failure or because the browser is navigating away from the page that opened the connection."},1002:{name:"Protocol error",message:"The endpoint is terminating the connection due to a protocol error."},1003:{name:"Unsupported Data",message:"The connection is being terminated because the endpoint received data of a type it cannot accept. (For example, a text-only endpoint received binary data.)"},1004:{name:"Reserved",message:"Reserved. A meaning might be defined in the future."},1005:{name:"No Status Rcvd",message:"Reserved. Indicates that no status code was provided even though one was expected."},1006:{name:"Abnormal Closure",message:"Reserved. Indicates that a connection was closed abnormally (that is, with no close frame being sent) when a status code is expected."},1007:{name:"Invalid frame payload data",message:"The endpoint is terminating the connection because a message was received that contained inconsistent data (e.g., non-UTF-8 data within a text message)."},1008:{name:"Policy Violation",message:"The endpoint is terminating the connection because it received a message that violates its policy. This is a generic status code, used when codes 1003 and 1009 are not suitable."},1009:{name:"Message Too Big",message:"The endpoint is terminating the connection because a data frame was received that is too large."},1010:{name:"Mandatory Ext.",message:"The client is terminating the connection because it expected the server to negotiate one or more extension, but the server didn't."},1011:{name:"Internal Error",message:"The server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request."},1012:{name:"Service Restart",message:"The server is terminating the connection because it is restarting."},1013:{name:"Try Again Later",message:"The server is terminating the connection due to a temporary condition, e.g. it is overloaded and is casting off some of its clients."},1014:{name:"Bad Gateway",message:"The server was acting as a gateway or proxy and received an invalid response from the upstream server. This is similar to 502 HTTP Status Code."},1015:{name:"TLS handshake",message:"Reserved. Indicates that the connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified)."},"1016-2999":{name:"",message:"For definition by future revisions of the WebSocket Protocol specification, and for definition by extension specifications."},"3000-3999":{name:"",message:"For use by libraries, frameworks, and applications. These status codes are registered directly with IANA. The interpretation of these codes is undefined by the WebSocket protocol."},"4000-4999":{name:"",message:"For private use, and thus can't be registered. Such codes can be used by prior agreements between WebSocket applications. The interpretation of these codes is undefined by the WebSocket protocol."}}},655:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.rpcErrorsMap=t.LimitExceededError=t.TransactionRejectedError=t.VersionNotSupportedError=t.ResourcesNotFoundError=t.ResourceUnavailableError=t.MethodNotSupported=t.InvalidInputError=t.InternalError=t.InvalidParamsError=t.MethodNotFoundError=t.InvalidRequestError=t.ParseError=t.EIP1193ProviderRpcError=t.RpcError=void 0;const n=r(3685),o=r(7639),i=r(4032);class s extends n.BaseWeb3Error{constructor(e,t){super(null!=t?t:i.genericRpcErrorMessageTemplate.replace("*code*",e.error.code.toString())),this.code=e.error.code,this.id=e.id,this.jsonrpc=e.jsonrpc,this.jsonRpcError=e.error}toJSON(){return Object.assign(Object.assign({},super.toJSON()),{error:this.jsonRpcError,id:this.id,jsonRpc:this.jsonrpc})}}t.RpcError=s;class a extends n.BaseWeb3Error{constructor(e,t){var r,n,o,s;if(e)if(null===(r=i.RpcErrorMessages[e])||void 0===r?void 0:r.message)super(i.RpcErrorMessages[e].message);else{const t=Object.keys(i.RpcErrorMessages).find((t=>"string"==typeof t&&e>=parseInt(t.split("-")[0],10)&&e<=parseInt(t.split("-")[1],10)));super(null!==(o=null===(n=i.RpcErrorMessages[null!=t?t:""])||void 0===n?void 0:n.message)&&void 0!==o?o:i.genericRpcErrorMessageTemplate.replace("*code*",null!==(s=null==e?void 0:e.toString())&&void 0!==s?s:'""'))}else super();this.code=e,this.data=t}}t.EIP1193ProviderRpcError=a;class c extends s{constructor(e){super(e,i.RpcErrorMessages[o.ERR_RPC_INVALID_JSON].message),this.code=o.ERR_RPC_INVALID_JSON}}t.ParseError=c;class u extends s{constructor(e){super(e,i.RpcErrorMessages[o.ERR_RPC_INVALID_REQUEST].message),this.code=o.ERR_RPC_INVALID_REQUEST}}t.InvalidRequestError=u;class d extends s{constructor(e){super(e,i.RpcErrorMessages[o.ERR_RPC_INVALID_METHOD].message),this.code=o.ERR_RPC_INVALID_METHOD}}t.MethodNotFoundError=d;class l extends s{constructor(e){super(e,i.RpcErrorMessages[o.ERR_RPC_INVALID_PARAMS].message),this.code=o.ERR_RPC_INVALID_PARAMS}}t.InvalidParamsError=l;class h extends s{constructor(e){super(e,i.RpcErrorMessages[o.ERR_RPC_INTERNAL_ERROR].message),this.code=o.ERR_RPC_INTERNAL_ERROR}}t.InternalError=h;class f extends s{constructor(e){super(e,i.RpcErrorMessages[o.ERR_RPC_INVALID_INPUT].message),this.code=o.ERR_RPC_INVALID_INPUT}}t.InvalidInputError=f;class p extends s{constructor(e){super(e,i.RpcErrorMessages[o.ERR_RPC_UNSUPPORTED_METHOD].message),this.code=o.ERR_RPC_UNSUPPORTED_METHOD}}t.MethodNotSupported=p;class m extends s{constructor(e){super(e,i.RpcErrorMessages[o.ERR_RPC_UNAVAILABLE_RESOURCE].message),this.code=o.ERR_RPC_UNAVAILABLE_RESOURCE}}t.ResourceUnavailableError=m;class g extends s{constructor(e){super(e,i.RpcErrorMessages[o.ERR_RPC_MISSING_RESOURCE].message),this.code=o.ERR_RPC_MISSING_RESOURCE}}t.ResourcesNotFoundError=g;class y extends s{constructor(e){super(e,i.RpcErrorMessages[o.ERR_RPC_NOT_SUPPORTED].message),this.code=o.ERR_RPC_NOT_SUPPORTED}}t.VersionNotSupportedError=y;class v extends s{constructor(e){super(e,i.RpcErrorMessages[o.ERR_RPC_TRANSACTION_REJECTED].message),this.code=o.ERR_RPC_TRANSACTION_REJECTED}}t.TransactionRejectedError=v;class b extends s{constructor(e){super(e,i.RpcErrorMessages[o.ERR_RPC_LIMIT_EXCEEDED].message),this.code=o.ERR_RPC_LIMIT_EXCEEDED}}t.LimitExceededError=b,t.rpcErrorsMap=new Map,t.rpcErrorsMap.set(o.ERR_RPC_INVALID_JSON,{error:c}),t.rpcErrorsMap.set(o.ERR_RPC_INVALID_REQUEST,{error:u}),t.rpcErrorsMap.set(o.ERR_RPC_INVALID_METHOD,{error:d}),t.rpcErrorsMap.set(o.ERR_RPC_INVALID_PARAMS,{error:l}),t.rpcErrorsMap.set(o.ERR_RPC_INTERNAL_ERROR,{error:h}),t.rpcErrorsMap.set(o.ERR_RPC_INVALID_INPUT,{error:f}),t.rpcErrorsMap.set(o.ERR_RPC_UNSUPPORTED_METHOD,{error:p}),t.rpcErrorsMap.set(o.ERR_RPC_UNAVAILABLE_RESOURCE,{error:m}),t.rpcErrorsMap.set(o.ERR_RPC_TRANSACTION_REJECTED,{error:v}),t.rpcErrorsMap.set(o.ERR_RPC_MISSING_RESOURCE,{error:g}),t.rpcErrorsMap.set(o.ERR_RPC_NOT_SUPPORTED,{error:y}),t.rpcErrorsMap.set(o.ERR_RPC_LIMIT_EXCEEDED,{error:b})},1066:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.SchemaFormatError=void 0;const n=r(7639),o=r(3685);class i extends o.BaseWeb3Error{constructor(e){super(`Format for the type ${e} is unsupported`),this.type=e,this.code=n.ERR_SCHEMA_FORMAT}toJSON(){return Object.assign(Object.assign({},super.toJSON()),{type:this.type})}}t.SchemaFormatError=i},1075:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.SignatureError=void 0;const n=r(7639),o=r(3685);class i extends o.InvalidValueError{constructor(){super(...arguments),this.code=n.ERR_SIGNATURE_FAILED}}t.SignatureError=i},8450:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.InvalidPropertiesForTransactionTypeError=t.LocalWalletNotAvailableError=t.TransactionSigningError=t.TransactionReceiptMissingBlockNumberError=t.TransactionMissingReceiptOrBlockHashError=t.TransactionBlockTimeoutError=t.TransactionPollingTimeoutError=t.TransactionSendTimeoutError=t.TransactionDataAndInputError=t.UnsupportedTransactionTypeError=t.Eip1559NotSupportedError=t.UnableToPopulateNonceError=t.InvalidNonceOrChainIdError=t.InvalidTransactionObjectError=t.UnsupportedFeeMarketError=t.Eip1559GasPriceError=t.InvalidMaxPriorityFeePerGasOrMaxFeePerGas=t.InvalidGasOrGasPrice=t.TransactionGasMismatchError=t.TransactionGasMismatchInnerError=t.MissingGasError=t.MissingGasInnerError=t.MissingChainOrHardforkError=t.CommonOrChainAndHardforkError=t.HardforkMismatchError=t.ChainMismatchError=t.ChainIdMismatchError=t.MissingCustomChainIdError=t.MissingCustomChainError=t.InvalidTransactionCall=t.InvalidTransactionWithReceiver=t.InvalidTransactionWithSender=t.TransactionNotFound=t.UndefinedRawTransactionError=t.TransactionOutOfGasError=t.TransactionRevertedWithoutReasonError=t.ContractCodeNotStoredError=t.NoContractAddressFoundError=t.TransactionRevertWithCustomError=t.TransactionRevertInstructionError=t.RevertInstructionError=t.TransactionError=void 0;const n=r(7639),o=r(3685);class i extends o.BaseWeb3Error{constructor(e,t){super(e),this.receipt=t,this.code=n.ERR_TX}toJSON(){return Object.assign(Object.assign({},super.toJSON()),{receipt:this.receipt})}}t.TransactionError=i;class s extends o.BaseWeb3Error{constructor(e,t){super(`Your request got reverted with the following reason string: ${e}`),this.reason=e,this.signature=t,this.code=n.ERR_TX_REVERT_INSTRUCTION}toJSON(){return Object.assign(Object.assign({},super.toJSON()),{reason:this.reason,signature:this.signature})}}t.RevertInstructionError=s;class a extends o.BaseWeb3Error{constructor(e,t,r,i){super("Transaction has been reverted by the EVM"+(void 0===r?"":`:\n ${o.BaseWeb3Error.convertToString(r)}`)),this.reason=e,this.signature=t,this.receipt=r,this.data=i,this.code=n.ERR_TX_REVERT_TRANSACTION}toJSON(){return Object.assign(Object.assign({},super.toJSON()),{reason:this.reason,signature:this.signature,receipt:this.receipt,data:this.data})}}t.TransactionRevertInstructionError=a,t.TransactionRevertWithCustomError=class extends a{constructor(e,t,r,o,i,s,a){super(e),this.reason=e,this.customErrorName=t,this.customErrorDecodedSignature=r,this.customErrorArguments=o,this.signature=i,this.receipt=s,this.data=a,this.code=n.ERR_TX_REVERT_TRANSACTION_CUSTOM_ERROR}toJSON(){return Object.assign(Object.assign({},super.toJSON()),{reason:this.reason,customErrorName:this.customErrorName,customErrorDecodedSignature:this.customErrorDecodedSignature,customErrorArguments:this.customErrorArguments,signature:this.signature,receipt:this.receipt,data:this.data})}},t.NoContractAddressFoundError=class extends i{constructor(e){super("The transaction receipt didn't contain a contract address.",e),this.code=n.ERR_TX_NO_CONTRACT_ADDRESS}toJSON(){return Object.assign(Object.assign({},super.toJSON()),{receipt:this.receipt})}},t.ContractCodeNotStoredError=class extends i{constructor(e){super("The contract code couldn't be stored, please check your gas limit.",e),this.code=n.ERR_TX_CONTRACT_NOT_STORED}},t.TransactionRevertedWithoutReasonError=class extends i{constructor(e){super("Transaction has been reverted by the EVM"+(void 0===e?"":`:\n ${o.BaseWeb3Error.convertToString(e)}`),e),this.code=n.ERR_TX_REVERT_WITHOUT_REASON}},t.TransactionOutOfGasError=class extends i{constructor(e){super(`Transaction ran out of gas. Please provide more gas:\n ${JSON.stringify(e,void 0,2)}`,e),this.code=n.ERR_TX_OUT_OF_GAS}},t.UndefinedRawTransactionError=class extends i{constructor(){super("Raw transaction undefined"),this.code=n.ERR_RAW_TX_UNDEFINED}},t.TransactionNotFound=class extends i{constructor(){super("Transaction not found"),this.code=n.ERR_TX_NOT_FOUND}};class c extends o.InvalidValueError{constructor(e){super(e,"invalid transaction with invalid sender"),this.code=n.ERR_TX_INVALID_SENDER}}t.InvalidTransactionWithSender=c;class u extends o.InvalidValueError{constructor(e){super(e,"invalid transaction with invalid receiver"),this.code=n.ERR_TX_INVALID_RECEIVER}}t.InvalidTransactionWithReceiver=u;class d extends o.InvalidValueError{constructor(e){super(e,"invalid transaction call"),this.code=n.ERR_TX_INVALID_CALL}}t.InvalidTransactionCall=d;class l extends o.InvalidValueError{constructor(){super("MissingCustomChainError","If tx.common is provided it must have tx.common.customChain"),this.code=n.ERR_TX_MISSING_CUSTOM_CHAIN}}t.MissingCustomChainError=l;class h extends o.InvalidValueError{constructor(){super("MissingCustomChainIdError","If tx.common is provided it must have tx.common.customChain and tx.common.customChain.chainId"),this.code=n.ERR_TX_MISSING_CUSTOM_CHAIN_ID}}t.MissingCustomChainIdError=h;class f extends o.InvalidValueError{constructor(e){super(JSON.stringify(e),"Chain Id doesnt match in tx.chainId tx.common.customChain.chainId"),this.code=n.ERR_TX_CHAIN_ID_MISMATCH}}t.ChainIdMismatchError=f;class p extends o.InvalidValueError{constructor(e){super(JSON.stringify(e),"Chain doesnt match in tx.chain tx.common.basechain"),this.code=n.ERR_TX_CHAIN_MISMATCH}}t.ChainMismatchError=p;class m extends o.InvalidValueError{constructor(e){super(JSON.stringify(e),"hardfork doesnt match in tx.hardfork tx.common.hardfork"),this.code=n.ERR_TX_HARDFORK_MISMATCH}}t.HardforkMismatchError=m;class g extends o.InvalidValueError{constructor(){super("CommonOrChainAndHardforkError","Please provide the common object or the chain and hardfork property but not all together."),this.code=n.ERR_TX_INVALID_CHAIN_INFO}}t.CommonOrChainAndHardforkError=g;class y extends o.InvalidValueError{constructor(e){var t,r;super("MissingChainOrHardforkError",`When specifying chain and hardfork, both values must be defined. Received "chain": ${null!==(t=e.chain)&&void 0!==t?t:"undefined"}, "hardfork": ${null!==(r=e.hardfork)&&void 0!==r?r:"undefined"}`),this.code=n.ERR_TX_MISSING_CHAIN_INFO}}t.MissingChainOrHardforkError=y;class v extends o.BaseWeb3Error{constructor(){super('Missing properties in transaction, either define "gas" and "gasPrice" for type 0 transactions or "gas", "maxPriorityFeePerGas" and "maxFeePerGas" for type 2 transactions'),this.code=n.ERR_TX_MISSING_GAS_INNER_ERROR}}t.MissingGasInnerError=v;class b extends o.InvalidValueError{constructor(e){var t,r,o,i;super(`gas: ${null!==(t=e.gas)&&void 0!==t?t:"undefined"}, gasPrice: ${null!==(r=e.gasPrice)&&void 0!==r?r:"undefined"}, maxPriorityFeePerGas: ${null!==(o=e.maxPriorityFeePerGas)&&void 0!==o?o:"undefined"}, maxFeePerGas: ${null!==(i=e.maxFeePerGas)&&void 0!==i?i:"undefined"}`,'"gas" is missing'),this.code=n.ERR_TX_MISSING_GAS,this.cause=new v}}t.MissingGasError=b;class E extends o.BaseWeb3Error{constructor(){super('Missing properties in transaction, either define "gas" and "gasPrice" for type 0 transactions or "gas", "maxPriorityFeePerGas" and "maxFeePerGas" for type 2 transactions, not both'),this.code=n.ERR_TX_GAS_MISMATCH_INNER_ERROR}}t.TransactionGasMismatchInnerError=E;class _ extends o.InvalidValueError{constructor(e){var t,r,o,i;super(`gas: ${null!==(t=e.gas)&&void 0!==t?t:"undefined"}, gasPrice: ${null!==(r=e.gasPrice)&&void 0!==r?r:"undefined"}, maxPriorityFeePerGas: ${null!==(o=e.maxPriorityFeePerGas)&&void 0!==o?o:"undefined"}, maxFeePerGas: ${null!==(i=e.maxFeePerGas)&&void 0!==i?i:"undefined"}`,"transaction must specify legacy or fee market gas properties, not both"),this.code=n.ERR_TX_GAS_MISMATCH,this.cause=new E}}t.TransactionGasMismatchError=_;class A extends o.InvalidValueError{constructor(e){var t,r;super(`gas: ${null!==(t=e.gas)&&void 0!==t?t:"undefined"}, gasPrice: ${null!==(r=e.gasPrice)&&void 0!==r?r:"undefined"}`,"Gas or gasPrice is lower than 0"),this.code=n.ERR_TX_INVALID_LEGACY_GAS}}t.InvalidGasOrGasPrice=A;class T extends o.InvalidValueError{constructor(e){var t,r;super(`maxPriorityFeePerGas: ${null!==(t=e.maxPriorityFeePerGas)&&void 0!==t?t:"undefined"}, maxFeePerGas: ${null!==(r=e.maxFeePerGas)&&void 0!==r?r:"undefined"}`,"maxPriorityFeePerGas or maxFeePerGas is lower than 0"),this.code=n.ERR_TX_INVALID_FEE_MARKET_GAS}}t.InvalidMaxPriorityFeePerGasOrMaxFeePerGas=T;class w extends o.InvalidValueError{constructor(e){super(e,"eip-1559 transactions don't support gasPrice"),this.code=n.ERR_TX_INVALID_FEE_MARKET_GAS_PRICE}}t.Eip1559GasPriceError=w;class I extends o.InvalidValueError{constructor(e){var t,r;super(`maxPriorityFeePerGas: ${null!==(t=e.maxPriorityFeePerGas)&&void 0!==t?t:"undefined"}, maxFeePerGas: ${null!==(r=e.maxFeePerGas)&&void 0!==r?r:"undefined"}`,"pre-eip-1559 transaction don't support maxFeePerGas/maxPriorityFeePerGas"),this.code=n.ERR_TX_INVALID_LEGACY_FEE_MARKET}}t.UnsupportedFeeMarketError=I;class R extends o.InvalidValueError{constructor(e){super(e,"invalid transaction object"),this.code=n.ERR_TX_INVALID_OBJECT}}t.InvalidTransactionObjectError=R;class P extends o.InvalidValueError{constructor(e){var t,r;super(`nonce: ${null!==(t=e.nonce)&&void 0!==t?t:"undefined"}, chainId: ${null!==(r=e.chainId)&&void 0!==r?r:"undefined"}`,"Nonce or chainId is lower than 0"),this.code=n.ERR_TX_INVALID_NONCE_OR_CHAIN_ID}}t.InvalidNonceOrChainIdError=P;class x extends o.InvalidValueError{constructor(){super("UnableToPopulateNonceError","unable to populate nonce, no from address available"),this.code=n.ERR_TX_UNABLE_TO_POPULATE_NONCE}}t.UnableToPopulateNonceError=x;class O extends o.InvalidValueError{constructor(){super("Eip1559NotSupportedError","Network doesn't support eip-1559"),this.code=n.ERR_TX_UNSUPPORTED_EIP_1559}}t.Eip1559NotSupportedError=O;class S extends o.InvalidValueError{constructor(e){super(e,"unsupported transaction type"),this.code=n.ERR_TX_UNSUPPORTED_TYPE}}t.UnsupportedTransactionTypeError=S;class C extends o.InvalidValueError{constructor(e){var t,r;super(`data: ${null!==(t=e.data)&&void 0!==t?t:"undefined"}, input: ${null!==(r=e.input)&&void 0!==r?r:"undefined"}`,'You can\'t have "data" and "input" as properties of transactions at the same time, please use either "data" or "input" instead.'),this.code=n.ERR_TX_DATA_AND_INPUT}}t.TransactionDataAndInputError=C;class B extends o.BaseWeb3Error{constructor(e){super(`The connected Ethereum Node did not respond within ${e.numberOfSeconds} seconds, please make sure your transaction was properly sent and you are connected to a healthy Node. Be aware that transaction might still be pending or mined!\n\tTransaction Hash: ${e.transactionHash?e.transactionHash.toString():"not available"}`),this.code=n.ERR_TX_SEND_TIMEOUT}}function k(e){return`Please make sure your transaction was properly sent and there are no previous pending transaction for the same account. However, be aware that it might still be mined!\n\tTransaction Hash: ${e?e.toString():"not available"}`}t.TransactionSendTimeoutError=B;class N extends o.BaseWeb3Error{constructor(e){super(`Transaction was not mined within ${e.numberOfSeconds} seconds. ${k(e.transactionHash)}`),this.code=n.ERR_TX_POLLING_TIMEOUT}}t.TransactionPollingTimeoutError=N;class M extends o.BaseWeb3Error{constructor(e){super(`Transaction started at ${e.starterBlockNumber} but was not mined within ${e.numberOfBlocks} blocks. ${k(e.transactionHash)}`),this.code=n.ERR_TX_BLOCK_TIMEOUT}}t.TransactionBlockTimeoutError=M;class L extends o.InvalidValueError{constructor(e){var t,r;super(`receipt: ${JSON.stringify(e.receipt)}, blockHash: ${null===(t=e.blockHash)||void 0===t?void 0:t.toString()}, transactionHash: ${null===(r=e.transactionHash)||void 0===r?void 0:r.toString()}`,"Receipt missing or blockHash null"),this.code=n.ERR_TX_RECEIPT_MISSING_OR_BLOCKHASH_NULL}}t.TransactionMissingReceiptOrBlockHashError=L;class D extends o.InvalidValueError{constructor(e){super(`receipt: ${JSON.stringify(e.receipt)}`,"Receipt missing block number"),this.code=n.ERR_TX_RECEIPT_MISSING_BLOCK_NUMBER}}t.TransactionReceiptMissingBlockNumberError=D;class F extends o.BaseWeb3Error{constructor(e){super(`Invalid signature. "${e}"`),this.code=n.ERR_TX_SIGNING}}t.TransactionSigningError=F;class H extends o.InvalidValueError{constructor(){super("LocalWalletNotAvailableError","Attempted to index account in local wallet, but no wallet is available"),this.code=n.ERR_TX_LOCAL_WALLET_NOT_AVAILABLE}}t.LocalWalletNotAvailableError=H;class j extends o.BaseWeb3Error{constructor(e,t){const r=[];e.forEach((e=>r.push(e.keyword))),super(`The following properties are invalid for the transaction type ${t}: ${r.join(", ")}`),this.code=n.ERR_TX_INVALID_PROPERTIES_FOR_TYPE}}t.InvalidPropertiesForTransactionTypeError=j},4618:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.InvalidTypeAbiInputError=t.InvalidBlockError=t.InvalidLargeValueError=t.InvalidSizeError=t.InvalidUnsignedIntegerError=t.InvalidBooleanError=t.InvalidTypeError=t.NibbleWidthError=t.HexProcessingError=t.InvalidIntegerError=t.InvalidUnitError=t.InvalidStringError=t.InvalidAddressError=t.InvalidNumberError=t.InvalidBytesError=void 0;const n=r(7639),o=r(3685);class i extends o.InvalidValueError{constructor(e){super(e,"can not parse as byte data"),this.code=n.ERR_INVALID_BYTES}}t.InvalidBytesError=i;class s extends o.InvalidValueError{constructor(e){super(e,"can not parse as number data"),this.code=n.ERR_INVALID_NUMBER}}t.InvalidNumberError=s;class a extends o.InvalidValueError{constructor(e){super(e,"invalid ethereum address"),this.code=n.ERR_INVALID_ADDRESS}}t.InvalidAddressError=a;class c extends o.InvalidValueError{constructor(e){super(e,"not a valid string"),this.code=n.ERR_INVALID_STRING}}t.InvalidStringError=c;class u extends o.InvalidValueError{constructor(e){super(e,"invalid unit"),this.code=n.ERR_INVALID_UNIT}}t.InvalidUnitError=u;class d extends o.InvalidValueError{constructor(e){super(e,"not a valid unit. Must be a positive integer"),this.code=n.ERR_INVALID_INTEGER}}t.InvalidIntegerError=d;class l extends o.InvalidValueError{constructor(e){super(e,"can not be converted to hex"),this.code=n.ERR_INVALID_HEX}}t.HexProcessingError=l;class h extends o.InvalidValueError{constructor(e){super(e,"value greater than the nibble width"),this.code=n.ERR_INVALID_NIBBLE_WIDTH}}t.NibbleWidthError=h;class f extends o.InvalidValueError{constructor(e){super(e,"invalid type, type not supported"),this.code=n.ERR_INVALID_TYPE}}t.InvalidTypeError=f;class p extends o.InvalidValueError{constructor(e){super(e,"not a valid boolean."),this.code=n.ERR_INVALID_BOOLEAN}}t.InvalidBooleanError=p;class m extends o.InvalidValueError{constructor(e){super(e,"not a valid unsigned integer."),this.code=n.ERR_INVALID_UNSIGNED_INTEGER}}t.InvalidUnsignedIntegerError=m;class g extends o.InvalidValueError{constructor(e){super(e,"invalid size given."),this.code=n.ERR_INVALID_SIZE}}t.InvalidSizeError=g;class y extends o.InvalidValueError{constructor(e){super(e,"value is larger than size."),this.code=n.ERR_INVALID_LARGE_VALUE}}t.InvalidLargeValueError=y;class v extends o.InvalidValueError{constructor(e){super(e,"invalid string given"),this.code=n.ERR_INVALID_BLOCK}}t.InvalidBlockError=v;class b extends o.InvalidValueError{constructor(e){super(e,"components found but type is not tuple"),this.code=n.ERR_INVALID_TYPE_ABI}}t.InvalidTypeAbiInputError=b},5071:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r);var o=Object.getOwnPropertyDescriptor(t,r);o&&!("get"in o?!t.__esModule:o.writable||o.configurable)||(o={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,o)}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),o=this&&this.__exportStar||function(e,t){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(t,r)||n(t,e,r)};Object.defineProperty(t,"__esModule",{value:!0}),o(r(7639),t),o(r(3685),t),o(r(8105),t),o(r(3789),t),o(r(510),t),o(r(1591),t),o(r(7297),t),o(r(7108),t),o(r(1075),t),o(r(8450),t),o(r(4618),t),o(r(9491),t),o(r(3628),t),o(r(655),t),o(r(4032),t),o(r(1066),t)},3685:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.InvalidValueError=t.MultipleErrors=t.BaseWeb3Error=void 0;const n=r(7639);class o extends Error{constructor(e,t){super(e),Array.isArray(t)?this.cause=new i(t):this.cause=t,this.name=this.constructor.name,"function"==typeof Error.captureStackTrace?Error.captureStackTrace(new.target.constructor):this.stack=(new Error).stack}get innerError(){return this.cause instanceof i?this.cause.errors:this.cause}set innerError(e){Array.isArray(e)?this.cause=new i(e):this.cause=e}static convertToString(e,t=!1){if(null==e)return"undefined";const r=JSON.stringify(e,((e,t)=>"bigint"==typeof t?t.toString():t));return t&&["bigint","string"].includes(typeof e)?r.replace(/['\\"]+/g,""):r}toJSON(){return{name:this.name,code:this.code,message:this.message,cause:this.cause,innerError:this.cause}}}t.BaseWeb3Error=o;class i extends o{constructor(e){super(`Multiple errors occurred: [${e.map((e=>e.message)).join("], [")}]`),this.code=n.ERR_MULTIPLE_ERRORS,this.errors=e}}t.MultipleErrors=i,t.InvalidValueError=class extends o{constructor(e,t){super(`Invalid value given "${o.convertToString(e,!0)}". Error: ${t}.`),this.name=this.constructor.name}}},9722:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.encodeErrorSignature=void 0;const n=r(9634),o=r(5071),i=r(1583);t.encodeErrorSignature=e=>{if("string"!=typeof e&&!(0,i.isAbiErrorFragment)(e))throw new o.AbiError("Invalid parameter value in encodeErrorSignature");let t;return t=!e||"function"!=typeof e&&"object"!=typeof e?e:(0,i.jsonInterfaceMethodToString)(e),(0,n.sha3Raw)(t)}},5893:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.encodeEventSignature=void 0;const n=r(9634),o=r(5071),i=r(1583);t.encodeEventSignature=e=>{if("string"!=typeof e&&!(0,i.isAbiEventFragment)(e))throw new o.AbiError("Invalid parameter value in encodeEventSignature");let t;return t=!e||"function"!=typeof e&&"object"!=typeof e?e:(0,i.jsonInterfaceMethodToString)(e),(0,n.sha3Raw)(t)}},3249:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.encodeFunctionCall=t.encodeFunctionSignature=void 0;const n=r(5071),o=r(9634),i=r(1583),s=r(4566);t.encodeFunctionSignature=e=>{if("string"!=typeof e&&!(0,i.isAbiFunctionFragment)(e))throw new n.AbiError("Invalid parameter value in encodeFunctionSignature");let t;return t=!e||"function"!=typeof e&&"object"!=typeof e?e:(0,i.jsonInterfaceMethodToString)(e),(0,o.sha3Raw)(t).slice(0,10)},t.encodeFunctionCall=(e,r)=>{var o;if(!(0,i.isAbiFunctionFragment)(e))throw new n.AbiError("Invalid parameter value in encodeFunctionCall");return`${(0,t.encodeFunctionSignature)(e)}${(0,s.encodeParameters)(null!==(o=e.inputs)&&void 0!==o?o:[],null!=r?r:[]).replace("0x","")}`}},734:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.decodeLog=void 0;const n=r(4566),o=["bool","string","int","uint","address","fixed","ufixed"];t.decodeLog=(e,t,r)=>{const i=Array.isArray(r)?r:[r],s={},a={};for(const[t,r]of e.entries())r.indexed?s[t]=r:a[t]=r;const c=t?(0,n.decodeParametersWith)(Object.values(a),t,!0):{__length__:0},u=i.length-Object.keys(s).length,d=Object.values(s).map(((e,t)=>{return o.some((t=>e.type.startsWith(t)))?(r=e.type,s=i[t+u],"string"===r?s:(0,n.decodeParameter)(r,s)):i[t+u];var r,s})),l={__length__:0};let h=0,f=0;for(const[t,r]of e.entries())l[t]="string"===r.type?"":void 0,s[t]&&(l[t]=d[h],h+=1),a[t]&&(l[t]=c[String(f)],f+=1),r.name&&(l[r.name]=l[t]),l.__length__+=1;return l}},4566:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.decodeParameter=t.decodeParameters=t.decodeParametersWith=t.encodeParameter=t.inferTypesAndEncodeParameters=t.encodeParameters=void 0;const n=r(5071),o=r(6729),i=r(4581);var s=r(4581);Object.defineProperty(t,"encodeParameters",{enumerable:!0,get:function(){return s.encodeParameters}}),Object.defineProperty(t,"inferTypesAndEncodeParameters",{enumerable:!0,get:function(){return s.inferTypesAndEncodeParameters}}),t.encodeParameter=(e,t)=>(0,i.encodeParameters)([e],[t]),t.decodeParametersWith=(e,t,r)=>{try{if(e.length>0&&(!t||"0x"===t||"0X"===t))throw new n.AbiError("Returned values aren't valid, did it run Out of Gas? You might also see this error if you are not using the correct ABI for the contract you are retrieving data from, requesting data from a block number that does not exist, or querying a node which is not fully synced.");return(0,o.decodeParameters)(e,`0x${t.replace(/0x/i,"")}`,r)}catch(e){throw new n.AbiError(`Parameter decoding error: ${e.message}`,{internalErr:e})}},t.decodeParameters=(e,r)=>(0,t.decodeParametersWith)(e,r,!1),t.decodeParameter=(e,r)=>(0,t.decodeParameters)([e],r)[0]},1691:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.decodeAddress=t.encodeAddress=void 0;const n=r(5071),o=r(9634),i=r(7345),s=r(3852),a=s.WORD_SIZE-20;t.encodeAddress=function(e,t){if("string"!=typeof t)throw new n.AbiError("address type expects string as input type",{value:t,name:e.name,type:e.type});let r=t.toLowerCase();if(r.startsWith("0x")||(r=`0x${r}`),!(0,i.isAddress)(r))throw new n.AbiError("provided input is not valid address",{value:t,name:e.name,type:e.type});const o=i.utils.hexToUint8Array(r),c=(0,s.alloc)(s.WORD_SIZE);return c.set(o,a),{dynamic:!1,encoded:c}},t.decodeAddress=function(e,t){const r=t.subarray(a,s.WORD_SIZE);if(20!==r.length)throw new n.AbiError("Invalid decoding input, not enough bytes to decode address",{bytes:t});const c=i.utils.uint8ArrayToHexString(r);return{result:(0,o.toChecksumAddress)(c),encoded:t.subarray(s.WORD_SIZE),consumed:s.WORD_SIZE}}},7064:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.decodeArray=t.encodeArray=void 0;const n=r(5071),o=r(9634),i=r(5555),s=r(3852),a=r(8809),c=r(5433);t.encodeArray=function(e,t){if(!Array.isArray(t))throw new n.AbiError("Expected value to be array",{abi:e,values:t});const{size:r,param:a}=(0,s.extractArrayType)(e),u=t.map((e=>(0,i.encodeParamFromAbiParameter)(a,e))),d=-1===r,l=u.length>0&&u[0].dynamic;if(!d&&t.length!==r)throw new n.AbiError("Given arguments count doesn't match array length",{arrayLength:r,argumentsLength:t.length});if(d||l){const e=(0,c.encodeDynamicParams)(u);if(d){const t=(0,i.encodeNumber)({type:"uint256",name:""},u.length).encoded;return{dynamic:!0,encoded:u.length>0?(0,o.uint8ArrayConcat)(t,e):t}}return{dynamic:!0,encoded:e}}return{dynamic:!1,encoded:(0,o.uint8ArrayConcat)(...u.map((e=>e.encoded)))}},t.decodeArray=function(e,t){let{size:r,param:n}=(0,s.extractArrayType)(e),o=0;const c=[];let u=t;if(-1===r){const e=(0,a.decodeNumber)({type:"uint32",name:""},t);r=Number(e.result),o=e.consumed,u=e.encoded}if((0,s.isDynamic)(n)){for(let e=0;e<r;e+=1){const t=(0,a.decodeNumber)({type:"uint32",name:""},u.subarray(e*s.WORD_SIZE));o+=t.consumed;const r=(0,i.decodeParamFromAbiParameter)(n,u.subarray(Number(t.result)));o+=r.consumed,c.push(r.result)}return{result:c,encoded:u.subarray(o),consumed:o}}for(let e=0;e<r;e+=1){const e=(0,i.decodeParamFromAbiParameter)(n,t.subarray(o));o+=e.consumed,c.push(e.result)}return{result:c,encoded:t.subarray(o),consumed:o}}},2252:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.decodeBool=t.encodeBoolean=void 0;const n=r(5071),o=r(9634),i=r(3852),s=r(8809);t.encodeBoolean=function(e,t){let r;try{r=(0,o.toBool)(t)}catch(r){if(r instanceof n.InvalidBooleanError)throw new n.AbiError("provided input is not valid boolean value",{type:e.type,value:t,name:e.name})}return(0,s.encodeNumber)({type:"uint8",name:""},Number(r))},t.decodeBool=function(e,t){const r=(0,s.decodeNumber)({type:"uint8",name:""},t);if(r.result>1||r.result<0)throw new n.AbiError("Invalid boolean value encoded",{boolBytes:t.subarray(0,i.WORD_SIZE),numberResult:r});return{result:r.result===BigInt(1),encoded:r.encoded,consumed:i.WORD_SIZE}}},7144:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.decodeBytes=t.encodeBytes=void 0;const n=r(5071),o=r(9634),i=r(7345),s=r(3852),a=r(8809);t.encodeBytes=function(e,t){if("string"==typeof t&&t.length%2!=0&&(t+="0"),!(0,i.isBytes)(t))throw new n.AbiError("provided input is not valid bytes value",{type:e.type,value:t,name:e.name});const r=(0,o.bytesToUint8Array)(t),[,c]=e.type.split("bytes");if(c){if(Number(c)>32||Number(c)<1)throw new n.AbiError("invalid bytes type. Static byte type can have between 1 and 32 bytes",{type:e.type});if(Number(c)<r.length)throw new n.AbiError("provided input size is different than type size",{type:e.type,value:t,name:e.name});const o=(0,s.alloc)(s.WORD_SIZE);return o.set(r),{dynamic:!1,encoded:o}}const u=Math.ceil(r.length/s.WORD_SIZE),d=(0,s.alloc)(s.WORD_SIZE+u*s.WORD_SIZE);return d.set((0,a.encodeNumber)({type:"uint32",name:""},r.length).encoded),d.set(r,s.WORD_SIZE),{dynamic:!0,encoded:d}},t.decodeBytes=function(e,t){const[,r]=e.type.split("bytes");let i=Number(r),c=t,u=1,d=0;if(!i){const e=(0,a.decodeNumber)({type:"uint32",name:""},c);i=Number(e.result),d+=e.consumed,c=e.encoded,u=Math.ceil(i/s.WORD_SIZE)}if(i>t.length)throw new n.AbiError("there is not enough data to decode",{type:e.type,encoded:t,size:i});return{result:(0,o.bytesToHex)(c.subarray(0,i)),encoded:c.subarray(u*s.WORD_SIZE),consumed:d+u*s.WORD_SIZE}}},5555:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.decodeParamFromAbiParameter=t.encodeParamFromAbiParameter=t.decodeArray=t.encodeArray=t.decodeTuple=t.encodeTuple=t.decodeString=t.encodeString=t.decodeNumber=t.encodeNumber=t.decodeBytes=t.encodeBytes=t.decodeBool=t.encodeBoolean=t.decodeAddress=t.encodeAddress=void 0;const n=r(5071),o=r(1691),i=r(2252),s=r(7144),a=r(8809),c=r(8574),u=r(4759),d=r(7064);var l=r(1691);Object.defineProperty(t,"encodeAddress",{enumerable:!0,get:function(){return l.encodeAddress}}),Object.defineProperty(t,"decodeAddress",{enumerable:!0,get:function(){return l.decodeAddress}});var h=r(2252);Object.defineProperty(t,"encodeBoolean",{enumerable:!0,get:function(){return h.encodeBoolean}}),Object.defineProperty(t,"decodeBool",{enumerable:!0,get:function(){return h.decodeBool}});var f=r(7144);Object.defineProperty(t,"encodeBytes",{enumerable:!0,get:function(){return f.encodeBytes}}),Object.defineProperty(t,"decodeBytes",{enumerable:!0,get:function(){return f.decodeBytes}});var p=r(8809);Object.defineProperty(t,"encodeNumber",{enumerable:!0,get:function(){return p.encodeNumber}}),Object.defineProperty(t,"decodeNumber",{enumerable:!0,get:function(){return p.decodeNumber}});var m=r(8574);Object.defineProperty(t,"encodeString",{enumerable:!0,get:function(){return m.encodeString}}),Object.defineProperty(t,"decodeString",{enumerable:!0,get:function(){return m.decodeString}});var g=r(4759);Object.defineProperty(t,"encodeTuple",{enumerable:!0,get:function(){return g.encodeTuple}}),Object.defineProperty(t,"decodeTuple",{enumerable:!0,get:function(){return g.decodeTuple}});var y=r(7064);Object.defineProperty(t,"encodeArray",{enumerable:!0,get:function(){return y.encodeArray}}),Object.defineProperty(t,"decodeArray",{enumerable:!0,get:function(){return y.decodeArray}}),t.encodeParamFromAbiParameter=function(e,t){if("string"===e.type)return(0,c.encodeString)(e,t);if("bool"===e.type)return(0,i.encodeBoolean)(e,t);if("address"===e.type)return(0,o.encodeAddress)(e,t);if("tuple"===e.type)return(0,u.encodeTuple)(e,t);if(e.type.endsWith("]"))return(0,d.encodeArray)(e,t);if(e.type.startsWith("bytes"))return(0,s.encodeBytes)(e,t);if(e.type.startsWith("uint")||e.type.startsWith("int"))return(0,a.encodeNumber)(e,t);throw new n.AbiError("Unsupported",{param:e,value:t})},t.decodeParamFromAbiParameter=function(e,t){if("string"===e.type)return(0,c.decodeString)(e,t);if("bool"===e.type)return(0,i.decodeBool)(e,t);if("address"===e.type)return(0,o.decodeAddress)(e,t);if("tuple"===e.type)return(0,u.decodeTuple)(e,t);if(e.type.endsWith("]"))return(0,d.decodeArray)(e,t);if(e.type.startsWith("bytes"))return(0,s.decodeBytes)(e,t);if(e.type.startsWith("uint")||e.type.startsWith("int"))return(0,a.decodeNumber)(e,t);throw new n.AbiError("Unsupported",{param:e,bytes:t})}},8809:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.decodeNumber=t.encodeNumber=void 0;const n=r(5071),o=r(9634),i=r(7345),s=r(3852),a=r(5978),c=BigInt(1)<<BigInt(256);function u(e,t=s.WORD_SIZE){let r;return r=e<0?(c+e).toString(16):e.toString(16),r=(0,o.padLeft)(r,2*t),i.utils.hexToUint8Array(r)}t.encodeNumber=function(e,t){let r;try{r=(0,o.toBigInt)(t)}catch(r){throw new n.AbiError("provided input is not number value",{type:e.type,value:t,name:e.name})}const i=a.numberLimits.get(e.type);if(!i)throw new n.AbiError("provided abi contains invalid number datatype",{type:e.type});if(r<i.min)throw new n.AbiError("provided input is less then minimum for given type",{type:e.type,value:t,name:e.name,minimum:i.min.toString()});if(r>i.max)throw new n.AbiError("provided input is greater then maximum for given type",{type:e.type,value:t,name:e.name,maximum:i.max.toString()});return{dynamic:!1,encoded:u(r)}},t.decodeNumber=function(e,t){if(t.length<s.WORD_SIZE)throw new n.AbiError("Not enough bytes left to decode",{param:e,bytesLeft:t.length});const r=t.subarray(0,s.WORD_SIZE),o=a.numberLimits.get(e.type);if(!o)throw new n.AbiError("provided abi contains invalid number datatype",{type:e.type});const u=function(e,t){const r=i.utils.uint8ArrayToHexString(e),n=BigInt(r);return n<=t?n:n-c}(r,o.max);if(u<o.min)throw new n.AbiError("decoded value is less then minimum for given type",{type:e.type,value:u,name:e.name,minimum:o.min.toString()});if(u>o.max)throw new n.AbiError("decoded value is greater then maximum for given type",{type:e.type,value:u,name:e.name,maximum:o.max.toString()});return{result:u,encoded:t.subarray(s.WORD_SIZE),consumed:s.WORD_SIZE}}},5978:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.numberLimits=void 0,t.numberLimits=new Map;let r=BigInt(256);for(let e=8;e<=256;e+=8)t.numberLimits.set(`uint${e}`,{min:BigInt(0),max:r-BigInt(1)}),t.numberLimits.set(`int${e}`,{min:-r/BigInt(2),max:r/BigInt(2)-BigInt(1)}),r*=BigInt(256);t.numberLimits.set("int",t.numberLimits.get("int256")),t.numberLimits.set("uint",t.numberLimits.get("uint256"))},8574:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.decodeString=t.encodeString=void 0;const n=r(5071),o=r(9634),i=r(7144);t.encodeString=function(e,t){if("string"!=typeof t)throw new n.AbiError("invalid input, should be string",{input:t});const r=(0,o.utf8ToBytes)(t);return(0,i.encodeBytes)({type:"bytes",name:""},r)},t.decodeString=function(e,t){const r=(0,i.decodeBytes)({type:"bytes",name:""},t);return{result:(0,o.hexToUtf8)(r.result),encoded:r.encoded,consumed:r.consumed}}},4759:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.decodeTuple=t.encodeTuple=void 0;const n=r(5071),o=r(9634),i=r(5555),s=r(5433),a=r(3852),c=r(8809);t.encodeTuple=function(e,t){var r,a,c;let u=!1;if(!Array.isArray(t)&&"object"!=typeof t)throw new n.AbiError("param must be either Array or Object",{param:e,input:t});const d=t,l=[];for(let o=0;o<(null!==(a=null===(r=e.components)||void 0===r?void 0:r.length)&&void 0!==a?a:0);o+=1){const r=e.components[o];let s;if(Array.isArray(d)){if(o>=d.length)throw new n.AbiError("input param length missmatch",{param:e,input:t});s=(0,i.encodeParamFromAbiParameter)(r,d[o])}else{const o=d[null!==(c=r.name)&&void 0!==c?c:""];if(null==o)throw new n.AbiError("missing input defined in abi",{param:e,input:t,paramName:r.name});s=(0,i.encodeParamFromAbiParameter)(r,o)}s.dynamic&&(u=!0),l.push(s)}return u?{dynamic:!0,encoded:(0,s.encodeDynamicParams)(l)}:{dynamic:!1,encoded:(0,o.uint8ArrayConcat)(...l.map((e=>e.encoded)))}},t.decodeTuple=function(e,t){const r={__length__:0};let n=0;if(!e.components)return{result:r,encoded:t,consumed:n};let o=0;for(const[s,u]of e.components.entries()){let e;if((0,a.isDynamic)(u)){const r=(0,c.decodeNumber)({type:"uint32",name:""},t.subarray(n));e=(0,i.decodeParamFromAbiParameter)(u,t.subarray(Number(r.result))),n+=r.consumed,o+=e.consumed}else e=(0,i.decodeParamFromAbiParameter)(u,t.subarray(n)),n+=e.consumed;r.__length__+=1,r[s]=e.result,u.name&&""!==u.name&&(r[u.name]=e.result)}return{encoded:t.subarray(n+o),result:r,consumed:n+o}}},5433:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.encodeDynamicParams=void 0;const n=r(9634),o=r(3852),i=r(8809);t.encodeDynamicParams=function(e){let t=0,r=0;const s=[],a=[];for(const r of e)r.dynamic?t+=o.WORD_SIZE:t+=r.encoded.length;for(const n of e)n.dynamic?(s.push((0,i.encodeNumber)({type:"uint256",name:""},t+r)),a.push(n),r+=n.encoded.length):s.push(n);return(0,n.uint8ArrayConcat)(...s.map((e=>e.encoded)),...a.map((e=>e.encoded)))}},6729:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.decodeParameters=void 0;const n=r(7345),o=r(4759),i=r(3852);t.decodeParameters=function(e,t,r){const s=(0,i.toAbiParams)(e),a=n.utils.hexToUint8Array(t);return(0,o.decodeTuple)({type:"tuple",name:"",components:s},a).result}},4581:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.inferTypesAndEncodeParameters=t.encodeParameters=void 0;const n=r(5071),o=r(9634),i=r(7345),s=r(5555),a=r(3852);function c(e){const t=[];return e.forEach((e=>{if(Array.isArray(e)){const r=c(e);t.push({type:"tuple",components:r,name:""})}else t.push({type:(0,o.toHex)(e,!0)})})),t}t.encodeParameters=function(e,t){if((null==e?void 0:e.length)!==t.length)throw new n.AbiError("Invalid number of values received for given ABI",{expected:null==e?void 0:e.length,received:t.length});const r=(0,a.toAbiParams)(e);return i.utils.uint8ArrayToHexString((0,s.encodeTuple)({type:"tuple",name:"",components:r},t).encoded)},t.inferTypesAndEncodeParameters=function(e){try{const t=c(e);return i.utils.uint8ArrayToHexString((0,s.encodeTuple)({type:"tuple",name:"",components:t},e).encoded)}catch(t){throw new n.AbiError("Could not infer types from given params",{params:e})}}},3852:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.isDynamic=t.extractArrayType=t.toAbiParams=t.isAbiParameter=t.convertExternalAbiParameter=t.allocUnsafe=t.alloc=t.WORD_SIZE=void 0;const n=r(1655),o=r(5071),i=r(9634),s=r(1583);function a(e){var t,r;return Object.assign(Object.assign({},e),{name:null!==(t=e.name)&&void 0!==t?t:"",components:null===(r=e.components)||void 0===r?void 0:r.map((e=>a(e)))})}function c(e){return!(0,i.isNullish)(e)&&"object"==typeof e&&!(0,i.isNullish)(e.type)&&"string"==typeof e.type}function u(e){const t=e.type.lastIndexOf("["),r=e.type.substring(0,t),n=e.type.substring(t);let i=-1;if("[]"!==n&&(i=Number(n.slice(1,-1)),isNaN(i)))throw new o.AbiError("Invalid fixed array size",{size:n});return{param:{type:r,name:"",components:e.components},size:i}}t.WORD_SIZE=32,t.alloc=function(e=0){var t;if(void 0!==(null===(t=globalThis.Buffer)||void 0===t?void 0:t.alloc)){const t=globalThis.Buffer.alloc(e);return new Uint8Array(t.buffer,t.byteOffset,t.byteLength)}return new Uint8Array(e)},t.allocUnsafe=function(e=0){var t;if(void 0!==(null===(t=globalThis.Buffer)||void 0===t?void 0:t.allocUnsafe)){const t=globalThis.Buffer.allocUnsafe(e);return new Uint8Array(t.buffer,t.byteOffset,t.byteLength)}return new Uint8Array(e)},t.convertExternalAbiParameter=a,t.isAbiParameter=c,t.toAbiParams=function(e){return e.map((e=>{var t;if(c(e))return e;if("string"==typeof e)return a((0,n.parseAbiParameter)(e.replace(/tuple/,"")));if((0,s.isSimplifiedStructFormat)(e)){const r=Object.keys(e)[0],n=(0,s.mapStructNameAndType)(r);return n.name=null!==(t=n.name)&&void 0!==t?t:"",Object.assign(Object.assign({},n),{components:(0,s.mapStructToCoderFormat)(e[r])})}throw new o.AbiError("Invalid abi")}))},t.extractArrayType=u,t.isDynamic=function e(t){var r,n;return!("string"!==t.type&&"bytes"!==t.type&&!t.type.endsWith("[]"))||("tuple"===t.type?null!==(n=null===(r=t.components)||void 0===r?void 0:r.some(e))&&void 0!==n&&n:!!t.type.endsWith("]")&&e(u(t).param))}},5610:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.decodeContractErrorData=void 0;const n=r(9722),o=r(4566),i=r(1583);t.decodeContractErrorData=(e,t)=>{if(null==t?void 0:t.data){let r,s,a;try{const c=t.data.slice(0,10),u=e.find((e=>(0,n.encodeErrorSignature)(e).startsWith(c)));(null==u?void 0:u.inputs)&&(r=u.name,s=(0,i.jsonInterfaceMethodToString)(u),a=(0,o.decodeParameters)([...u.inputs],t.data.substring(10)))}catch(e){console.error(e)}r&&t.setDecodedProperties(r,s,a)}}},6329:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getMessage=void 0;const n=r(9634),o=r(5071),i=r(4581),s=/^\w+/,a=/^(.*)\[([0-9]*?)]$/,c=(e,t,r=[])=>{const n=t.match(s)[0];return r.includes(n)?r:e.types[n]?[n,...e.types[n].reduce(((t,r)=>[...t,...c(e,r.type,t).filter((e=>!t.includes(e)))]),[])]:r},u=(e,t)=>(0,n.keccak256)(((e,t)=>{const[r,...n]=c(e,t);return[r,...n.sort()].map((t=>`${t}(${e.types[t].map((e=>`${e.type} ${e.name}`))})`)).join("")})(e,t)),d=(e,t,r)=>(0,n.keccak256)(h(e,t,r));t.getMessage=(e,t)=>{const r=`0x1901${d(e,"EIP712Domain",e.domain).substring(2)}${d(e,e.primaryType,e.message).substring(2)}`;return t?(0,n.keccak256)(r):r};const l=(e,t,r)=>{const s=t.match(a);if(s){const t=s[1],a=Number(s[2])||void 0;if(!Array.isArray(r))throw new o.AbiError("Cannot encode data: value is not of array type",{data:r});if(a&&r.length!==a)throw new o.AbiError(`Cannot encode data: expected length of ${a}, but got ${r.length}`,{data:r});const c=r.map((r=>l(e,t,r))),u=c.map((e=>e[0])),d=c.map((e=>e[1]));return["bytes32",(0,n.keccak256)((0,i.encodeParameters)(u,d))]}return e.types[t]?["bytes32",d(e,t,r)]:"string"===t||"bytes"===t?["bytes32",(0,n.keccak256)(r)]:[t,r]},h=(e,t,r)=>{const[s,a]=e.types[t].reduce((([t,i],s)=>{if((0,n.isNullish)(r[s.name])||(0,n.isNullish)(r[s.name]))throw new o.AbiError(`Cannot encode data: missing data for '${s.name}'`,{data:r,field:s});const a=r[s.name],[c,u]=l(e,s.type,a);return[[...t,c],[...i,u]]}),[["bytes32"],[u(e,t)]]);return(0,i.encodeParameters)(s,a)}},8381:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r);var o=Object.getOwnPropertyDescriptor(t,r);o&&!("get"in o?!t.__esModule:o.writable||o.configurable)||(o={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,o)}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),o=this&&this.__exportStar||function(e,t){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(t,r)||n(t,e,r)};Object.defineProperty(t,"__esModule",{value:!0}),t.getEncodedEip712Data=void 0,o(r(9722),t),o(r(5893),t),o(r(3249),t),o(r(734),t),o(r(4566),t),o(r(1583),t),o(r(5610),t);var i=r(6329);Object.defineProperty(t,"getEncodedEip712Data",{enumerable:!0,get:function(){return i.getMessage}})},1583:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.jsonInterfaceMethodToString=t.flattenTypes=t.formatParam=t.formatOddHexstrings=t.isOddHexstring=t.mapTypes=t.mapStructToCoderFormat=t.mapStructNameAndType=t.isSimplifiedStructFormat=t.isAbiConstructorFragment=t.isAbiFunctionFragment=t.isAbiEventFragment=t.isAbiErrorFragment=t.isAbiFragment=void 0;const n=r(5071),o=r(9634);t.isAbiFragment=e=>!(0,o.isNullish)(e)&&"object"==typeof e&&!(0,o.isNullish)(e.type)&&["function","event","constructor","error"].includes(e.type),t.isAbiErrorFragment=e=>!(0,o.isNullish)(e)&&"object"==typeof e&&!(0,o.isNullish)(e.type)&&"error"===e.type,t.isAbiEventFragment=e=>!(0,o.isNullish)(e)&&"object"==typeof e&&!(0,o.isNullish)(e.type)&&"event"===e.type,t.isAbiFunctionFragment=e=>!(0,o.isNullish)(e)&&"object"==typeof e&&!(0,o.isNullish)(e.type)&&"function"===e.type,t.isAbiConstructorFragment=e=>!(0,o.isNullish)(e)&&"object"==typeof e&&!(0,o.isNullish)(e.type)&&"constructor"===e.type,t.isSimplifiedStructFormat=e=>"object"==typeof e&&void 0===e.components&&void 0===e.name,t.mapStructNameAndType=e=>e.includes("[]")?{type:"tuple[]",name:e.slice(0,-2)}:{type:"tuple",name:e},t.mapStructToCoderFormat=e=>{const r=[];for(const n of Object.keys(e)){const o=e[n];"object"==typeof o?r.push(Object.assign(Object.assign({},(0,t.mapStructNameAndType)(n)),{components:(0,t.mapStructToCoderFormat)(o)})):r.push({name:n,type:e[n]})}return r},t.mapTypes=e=>{const r=[];for(const n of e){let e=n;if("object"==typeof n&&(e=Object.assign({},n)),"object"==typeof n&&"function"===n.type&&(e=Object.assign(Object.assign({},n),{type:"bytes24"})),(0,t.isSimplifiedStructFormat)(e)){const n=Object.keys(e)[0];r.push(Object.assign(Object.assign({},(0,t.mapStructNameAndType)(n)),{components:(0,t.mapStructToCoderFormat)(e[n])}))}else r.push(e)}return r},t.isOddHexstring=e=>"string"==typeof e&&/^(-)?0x[0-9a-f]*$/i.test(e)&&e.length%2==1,t.formatOddHexstrings=e=>(0,t.isOddHexstring)(e)?`0x0${e.substring(2)}`:e;const i=/^bytes([0-9]*)$/,s=/^bytes([0-9]*)\[\]$/,a=/^(u?int)([0-9]*)$/,c=/^(u?int)([0-9]*)\[\]$/;t.formatParam=(e,r)=>{const n="object"!=typeof r||Array.isArray(r)?r:Object.assign({},r);if(n instanceof BigInt||"bigint"==typeof n)return n.toString(10);if(s.exec(e)||c.exec(e))return[...n].map((r=>(0,t.formatParam)(e.replace("[]",""),r)));let u=a.exec(e);if(u){const e=parseInt(u[2]?u[2]:"256",10);if(e/8<n.length)return(0,o.leftPad)(n,e)}if(u=i.exec(e),u){const e=(0,o.isUint8Array)(n)?(0,o.toHex)(n):n,r=parseInt(u[1],10);if(r){let i=2*r;n.startsWith("0x")&&(i+=2);const s=e.length<i?(0,o.rightPad)(n,2*r):e;return(0,t.formatOddHexstrings)(s)}return(0,t.formatOddHexstrings)(e)}return n},t.flattenTypes=(e,r)=>{const o=[];return r.forEach((r=>{if("object"==typeof r.components){if(!r.type.startsWith("tuple"))throw new n.AbiError(`Invalid value given "${r.type}". Error: components found but type is not tuple.`);const i=r.type.indexOf("["),s=i>=0?r.type.substring(i):"",a=(0,t.flattenTypes)(e,r.components);Array.isArray(a)&&e?o.push(`tuple(${a.join(",")})${s}`):e?o.push(`(${a.join()})`):o.push(`(${a.join(",")})${s}`)}else o.push(r.type)})),o},t.jsonInterfaceMethodToString=e=>{var r,n,o,i;return(0,t.isAbiErrorFragment)(e)||(0,t.isAbiEventFragment)(e)||(0,t.isAbiFunctionFragment)(e)?(null===(r=e.name)||void 0===r?void 0:r.includes("("))?e.name:`${null!==(n=e.name)&&void 0!==n?n:""}(${(0,t.flattenTypes)(!1,null!==(o=e.inputs)&&void 0!==o?o:[]).join(",")})`:`(${(0,t.flattenTypes)(!1,null!==(i=e.inputs)&&void 0!==i?i:[]).join(",")})`}},1560:function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.decrypt=t.create=t.privateKeyToAccount=t.encrypt=t.privateKeyToPublicKey=t.privateKeyToAddress=t.recover=t.recoverTransaction=t.signTransaction=t.sign=t.hashMessage=t.parseAndValidatePrivateKey=void 0;const o=r(3072),i=r(8109),s=r(7002),a=r(5071),c=r(9634),u=r(7345),d=r(4555),l=r(5774),h=r(7668);t.parseAndValidatePrivateKey=(e,t)=>{let r;if(!t&&"string"==typeof e&&(0,u.isHexStrict)(e)&&66!==e.length)throw new a.PrivateKeyLengthError;try{r=(0,c.isUint8Array)(e)?e:(0,c.bytesToUint8Array)(e)}catch(e){throw new a.InvalidPrivateKeyError}if(!t&&32!==r.byteLength)throw new a.PrivateKeyLengthError;return r},t.hashMessage=e=>{const t=(0,u.isHexStrict)(e)?e:(0,c.utf8ToHex)(e),r=(0,c.hexToBytes)(t),n=(0,c.hexToBytes)((0,c.fromUtf8)(`Ethereum Signed Message:\n${r.byteLength}`)),o=(0,c.uint8ArrayConcat)(n,r);return(0,c.sha3Raw)(o)},t.sign=(e,r)=>{const n=(0,t.parseAndValidatePrivateKey)(r),o=(0,t.hashMessage)(e),i=d.secp256k1.sign(o.substring(2),n),s=i.toCompactRawBytes(),a=i.r.toString(16).padStart(64,"0"),u=i.s.toString(16).padStart(64,"0"),l=i.recovery+27;return{message:e,messageHash:o,v:(0,c.numberToHex)(l),r:`0x${a}`,s:`0x${u}`,signature:`${(0,c.bytesToHex)(s)}${l.toString(16)}`}},t.signTransaction=(e,t)=>n(void 0,void 0,void 0,(function*(){const r=e.sign((0,c.hexToBytes)(t));if((0,u.isNullish)(r.v)||(0,u.isNullish)(r.r)||(0,u.isNullish)(r.s))throw new a.TransactionSigningError("Signer Error");const n=r.validate(!0);if(n.length>0){let e="Signer Error ";for(const t of n)e+=`${e} ${t}.`;throw new a.TransactionSigningError(e)}const o=(0,c.bytesToHex)(r.serialize()),i=(0,c.sha3Raw)(o);return{messageHash:(0,c.bytesToHex)(r.getMessageToSign(!0)),v:`0x${r.v.toString(16)}`,r:`0x${r.r.toString(16).padStart(64,"0")}`,s:`0x${r.s.toString(16).padStart(64,"0")}`,rawTransaction:o,transactionHash:(0,c.bytesToHex)(i)}})),t.recoverTransaction=e=>{if((0,u.isNullish)(e))throw new a.UndefinedRawTransactionError;const t=h.TransactionFactory.fromSerializedData((0,c.hexToBytes)(e));return(0,c.toChecksumAddress)(t.getSenderAddress().toString())},t.recover=(e,r,n,o,i)=>{if("object"==typeof e){const r=`${e.r}${e.s.slice(2)}${e.v.slice(2)}`;return(0,t.recover)(e.messageHash,r,n)}if("string"==typeof r&&"string"==typeof n&&!(0,u.isNullish)(o)){const s=`${n}${o.slice(2)}${r.slice(2)}`;return(0,t.recover)(e,s,i)}if((0,u.isNullish)(r))throw new a.InvalidSignatureError("signature string undefined");const s=n?e:(0,t.hashMessage)(e);let l=parseInt(r.substring(130),16);l>26&&(l-=27);const h=d.secp256k1.Signature.fromCompact(r.slice(2,130)).addRecoveryBit(l).recoverPublicKey(s.replace("0x","")).toRawBytes(!1),f=(0,c.sha3Raw)(h.subarray(1));return(0,c.toChecksumAddress)(`0x${f.slice(-40)}`)},t.privateKeyToAddress=e=>{const r=(0,t.parseAndValidatePrivateKey)(e),n=d.secp256k1.getPublicKey(r,!1),o=(0,c.sha3Raw)(n.slice(1)).slice(-40);return(0,c.toChecksumAddress)(`0x${o}`)},t.privateKeyToPublicKey=(e,r)=>{const n=(0,t.parseAndValidatePrivateKey)(e);return`0x${(0,c.bytesToHex)(d.secp256k1.getPublicKey(n,r)).slice(4)}`},t.encrypt=(e,r,d)=>n(void 0,void 0,void 0,(function*(){var n,l,h,f,p,m,g;const y=(0,t.parseAndValidatePrivateKey)(e);let v;if(v=(null==d?void 0:d.salt)?"string"==typeof d.salt?(0,c.hexToBytes)(d.salt):d.salt:(0,c.randomBytes)(32),!(0,u.isString)(r)&&!(0,c.isUint8Array)(r))throw new a.InvalidPasswordError;const b="string"==typeof r?(0,c.hexToBytes)((0,c.utf8ToHex)(r)):r;let E;if(null==d?void 0:d.iv){if(E="string"==typeof d.iv?(0,c.hexToBytes)(d.iv):d.iv,16!==E.length)throw new a.IVLengthError}else E=(0,c.randomBytes)(16);const _=null!==(n=null==d?void 0:d.kdf)&&void 0!==n?n:"scrypt";let A,T;if("pbkdf2"===_){if(T={dklen:null!==(l=null==d?void 0:d.dklen)&&void 0!==l?l:32,salt:(0,c.bytesToHex)(v).replace("0x",""),c:null!==(h=null==d?void 0:d.c)&&void 0!==h?h:262144,prf:"hmac-sha256"},T.c<1e3)throw new a.PBKDF2IterationsError;A=(0,i.pbkdf2Sync)(b,v,T.c,T.dklen,"sha256")}else{if("scrypt"!==_)throw new a.InvalidKdfError;T={n:null!==(f=null==d?void 0:d.n)&&void 0!==f?f:8192,r:null!==(p=null==d?void 0:d.r)&&void 0!==p?p:8,p:null!==(m=null==d?void 0:d.p)&&void 0!==m?m:1,dklen:null!==(g=null==d?void 0:d.dklen)&&void 0!==g?g:32,salt:(0,c.bytesToHex)(v).replace("0x","")},A=(0,s.scryptSync)(b,v,T.n,T.p,T.r,T.dklen)}const w=yield(0,o.encrypt)(y,A.slice(0,16),E,"aes-128-ctr"),I=(0,c.bytesToHex)(w).slice(2),R=(0,c.sha3Raw)((0,c.uint8ArrayConcat)(A.slice(16,32),w)).replace("0x","");return{version:3,id:(0,c.uuidV4)(),address:(0,t.privateKeyToAddress)(y).toLowerCase().replace("0x",""),crypto:{ciphertext:I,cipherparams:{iv:(0,c.bytesToHex)(E).replace("0x","")},cipher:"aes-128-ctr",kdf:_,kdfparams:T,mac:R}}})),t.privateKeyToAccount=(e,r)=>{const o=(0,t.parseAndValidatePrivateKey)(e,r);return{address:(0,t.privateKeyToAddress)(o),privateKey:(0,c.bytesToHex)(o),signTransaction:e=>{throw new a.TransactionSigningError("Do not have network access to sign the transaction")},sign:e=>(0,t.sign)("string"==typeof e?e:JSON.stringify(e),o),encrypt:(e,r)=>n(void 0,void 0,void 0,(function*(){return(0,t.encrypt)(o,e,r)}))}},t.create=()=>{const e=d.secp256k1.utils.randomPrivateKey();return(0,t.privateKeyToAccount)(`${(0,c.bytesToHex)(e)}`)},t.decrypt=(e,r,d)=>n(void 0,void 0,void 0,(function*(){const n="object"==typeof e?e:JSON.parse(d?e.toLowerCase():e);if(u.validator.validateJSONSchema(l.keyStoreSchema,n),3!==n.version)throw new a.KeyStoreVersionError;const h="string"==typeof r?(0,c.hexToBytes)((0,c.utf8ToHex)(r)):r;let f;if(u.validator.validate(["bytes"],[h]),"scrypt"===n.crypto.kdf){const e=n.crypto.kdfparams,t="string"==typeof e.salt?(0,c.hexToBytes)(e.salt):e.salt;f=(0,s.scryptSync)(h,t,e.n,e.p,e.r,e.dklen)}else{if("pbkdf2"!==n.crypto.kdf)throw new a.InvalidKdfError;{const e=n.crypto.kdfparams,t="string"==typeof e.salt?(0,c.hexToBytes)(e.salt):e.salt;f=(0,i.pbkdf2Sync)(h,t,e.c,e.dklen,"sha256")}}const p=(0,c.hexToBytes)(n.crypto.ciphertext);if((0,c.sha3Raw)((0,c.uint8ArrayConcat)(f.slice(16,32),p)).replace("0x","")!==n.crypto.mac)throw new a.KeyDerivationError;const m=yield(0,o.decrypt)((0,c.hexToBytes)(n.crypto.ciphertext),f.slice(0,16),(0,c.hexToBytes)(n.crypto.cipherparams.iv));return(0,t.privateKeyToAccount)(m)}))},7634:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"goerli",chainId:5,networkId:5,defaultHardfork:"merge",consensus:{type:"poa",algorithm:"clique",clique:{period:15,epoch:3e4}},comment:"Cross-client PoA test network",url:"https://github.com/goerli/testnet",genesis:{timestamp:"0x5c51a607",gasLimit:10485760,difficulty:1,nonce:"0x0000000000000000",extraData:"0x22466c6578692069732061207468696e6722202d204166726900000000000000e0a2bd4258d2768837baa26a28fe71dc079f84c70000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"},hardforks:[{name:"chainstart",block:0,forkHash:"0xa3f5ab08"},{name:"homestead",block:0,forkHash:"0xa3f5ab08"},{name:"tangerineWhistle",block:0,forkHash:"0xa3f5ab08"},{name:"spuriousDragon",block:0,forkHash:"0xa3f5ab08"},{name:"byzantium",block:0,forkHash:"0xa3f5ab08"},{name:"constantinople",block:0,forkHash:"0xa3f5ab08"},{name:"petersburg",block:0,forkHash:"0xa3f5ab08"},{name:"istanbul",block:1561651,forkHash:"0xc25efa5c"},{name:"berlin",block:4460644,forkHash:"0x757a1c47"},{name:"london",block:5062605,forkHash:"0xb8c6299d"},{"//_comment":"The forkHash will remain same as mergeForkIdTransition is post merge, terminal block: https://goerli.etherscan.io/block/7382818",name:"merge",ttd:"10790000",block:7382819,forkHash:"0xb8c6299d"},{name:"mergeForkIdTransition",block:null,forkHash:null},{name:"shanghai",block:null,forkHash:null}],bootstrapNodes:[],dnsNetworks:["enrtree://AKA3AM6LPBYEUDMVNU3BSVQJ5AD45Y7YPOHJLEF6W26QOE4VTUDPE@all.goerli.ethdisco.net"]}},3233:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"mainnet",chainId:1,networkId:1,defaultHardfork:"merge",consensus:{type:"pow",algorithm:"ethash",ethash:{}},comment:"The Ethereum main chain",url:"https://ethstats.net/",genesis:{gasLimit:5e3,difficulty:17179869184,nonce:"0x0000000000000042",extraData:"0x11bbe8db4e347b4e8c937c1c8370e4b5ed33adb3db69cbdb7a38e1e50b1b82fa"},hardforks:[{name:"chainstart",block:0,forkHash:"0xfc64ec04"},{name:"homestead",block:115e4,forkHash:"0x97c2c34c"},{name:"dao",block:192e4,forkHash:"0x91d1f948"},{name:"tangerineWhistle",block:2463e3,forkHash:"0x7a64da13"},{name:"spuriousDragon",block:2675e3,forkHash:"0x3edd5b10"},{name:"byzantium",block:437e4,forkHash:"0xa00bc324"},{name:"constantinople",block:728e4,forkHash:"0x668db0af"},{name:"petersburg",block:728e4,forkHash:"0x668db0af"},{name:"istanbul",block:9069e3,forkHash:"0x879d6e30"},{name:"muirGlacier",block:92e5,forkHash:"0xe029e991"},{name:"berlin",block:12244e3,forkHash:"0x0eb440f6"},{name:"london",block:12965e3,forkHash:"0xb715077d"},{name:"arrowGlacier",block:13773e3,forkHash:"0x20c327fc"},{name:"grayGlacier",block:1505e4,forkHash:"0xf0afd0e3"},{"//_comment":"The forkHash will remain same as mergeForkIdTransition is post merge, terminal block: https://etherscan.io/block/15537393",name:"merge",ttd:"58750000000000000000000",block:15537394,forkHash:"0xf0afd0e3"},{name:"mergeForkIdTransition",block:null,forkHash:null},{name:"shanghai",block:null,forkHash:null}],bootstrapNodes:[],dnsNetworks:["enrtree://AKA3AM6LPBYEUDMVNU3BSVQJ5AD45Y7YPOHJLEF6W26QOE4VTUDPE@all.mainnet.ethdisco.net"]}},5077:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"sepolia",chainId:11155111,networkId:11155111,defaultHardfork:"merge",consensus:{type:"pow",algorithm:"ethash",ethash:{}},comment:"PoW test network to replace Ropsten",url:"https://github.com/ethereum/go-ethereum/pull/23730",genesis:{timestamp:"0x6159af19",gasLimit:3e7,difficulty:131072,nonce:"0x0000000000000000",extraData:"0x5365706f6c69612c20417468656e732c204174746963612c2047726565636521"},hardforks:[{name:"chainstart",block:0,forkHash:"0xfe3366e7"},{name:"homestead",block:0,forkHash:"0xfe3366e7"},{name:"tangerineWhistle",block:0,forkHash:"0xfe3366e7"},{name:"spuriousDragon",block:0,forkHash:"0xfe3366e7"},{name:"byzantium",block:0,forkHash:"0xfe3366e7"},{name:"constantinople",block:0,forkHash:"0xfe3366e7"},{name:"petersburg",block:0,forkHash:"0xfe3366e7"},{name:"istanbul",block:0,forkHash:"0xfe3366e7"},{name:"muirGlacier",block:0,forkHash:"0xfe3366e7"},{name:"berlin",block:0,forkHash:"0xfe3366e7"},{name:"london",block:0,forkHash:"0xfe3366e7"},{"//_comment":"The forkHash will remain same as mergeForkIdTransition is post merge, terminal block: https://sepolia.etherscan.io/block/1450408",name:"merge",ttd:"17000000000000000",block:1450409,forkHash:"0xfe3366e7"},{name:"mergeForkIdTransition",block:1735371,forkHash:"0xb96cbd13"},{name:"shanghai",block:null,timestamp:"1677557088",forkHash:"0xf7f9bc08"}],bootstrapNodes:[],dnsNetworks:["enrtree://AKA3AM6LPBYEUDMVNU3BSVQJ5AD45Y7YPOHJLEF6W26QOE4VTUDPE@all.sepolia.ethdisco.net"]}},6664:function(e,t,r){"use strict";var n=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.Common=void 0;const o=n(r(1238)),i=r(9634),s=r(850),a=r(2290),c=n(r(7634)),u=n(r(3233)),d=n(r(5077)),l=r(5257),h=r(4443),f=r(9137),{buf:p}=o.default;class m extends i.EventEmitter{constructor(e){var t,r;super(),this._eips=[],this._customChains=null!==(t=e.customChains)&&void 0!==t?t:[],this._chainParams=this.setChain(e.chain),this.DEFAULT_HARDFORK=null!==(r=this._chainParams.defaultHardfork)&&void 0!==r?r:h.Hardfork.Merge,this.HARDFORK_CHANGES=this.hardforks().map((e=>[e.name,f.hardforks[e.name]])),this._hardfork=this.DEFAULT_HARDFORK,void 0!==e.hardfork&&this.setHardfork(e.hardfork),e.eips&&this.setEIPs(e.eips)}static custom(e,t={}){var r;const n=null!==(r=t.baseChain)&&void 0!==r?r:"mainnet",o=Object.assign({},m._getChainParams(n));if(o.name="custom-chain","string"!=typeof e)return new m(Object.assign({chain:Object.assign(Object.assign({},o),e)},t));if(e===h.CustomChain.PolygonMainnet)return m.custom({name:h.CustomChain.PolygonMainnet,chainId:137,networkId:137},t);if(e===h.CustomChain.PolygonMumbai)return m.custom({name:h.CustomChain.PolygonMumbai,chainId:80001,networkId:80001},t);if(e===h.CustomChain.ArbitrumRinkebyTestnet)return m.custom({name:h.CustomChain.ArbitrumRinkebyTestnet,chainId:421611,networkId:421611},t);if(e===h.CustomChain.ArbitrumOne)return m.custom({name:h.CustomChain.ArbitrumOne,chainId:42161,networkId:42161},t);if(e===h.CustomChain.xDaiChain)return m.custom({name:h.CustomChain.xDaiChain,chainId:100,networkId:100},t);if(e===h.CustomChain.OptimisticKovan)return m.custom({name:h.CustomChain.OptimisticKovan,chainId:69,networkId:69},Object.assign({hardfork:h.Hardfork.Berlin},t));if(e===h.CustomChain.OptimisticEthereum)return m.custom({name:h.CustomChain.OptimisticEthereum,chainId:10,networkId:10},Object.assign({hardfork:h.Hardfork.Berlin},t));throw new Error(`Custom chain ${e} not supported`)}static fromGethGenesis(e,{chain:t,eips:r,genesisHash:n,hardfork:o,mergeForkIdPostMerge:i}){var s;const c=(0,a.parseGethGenesis)(e,t,i),u=new m({chain:null!==(s=c.name)&&void 0!==s?s:"custom",customChains:[c],eips:r,hardfork:null!=o?o:c.hardfork});return void 0!==n&&u.setForkHashes(n),u}static isSupportedChainId(e){const t=this._getInitializedChains();return Boolean(t.names[e.toString()])}static _getChainParams(e,t){let r=e;const n=this._getInitializedChains(t);if("number"==typeof r||"bigint"==typeof r){if(r=r.toString(),n.names[r])return n[n.names[r]];throw new Error(`Chain with ID ${r} not supported`)}if(void 0!==n[r])return n[r];throw new Error(`Chain with name ${r} not supported`)}setChain(e){if("number"==typeof e||"bigint"==typeof e||"string"==typeof e)this._chainParams=m._getChainParams(e,this._customChains);else{if("object"!=typeof e)throw new Error("Wrong input format");{if(this._customChains.length>0)throw new Error("Chain must be a string, number, or bigint when initialized with customChains passed in");const t=["networkId","genesis","hardforks","bootstrapNodes"];for(const r of t)if(!(r in e))throw new Error(`Missing required chain parameter: ${r}`);this._chainParams=e}}for(const e of this.hardforks())if(void 0===e.block)throw new Error("Hardfork cannot have undefined block number");return this._chainParams}setHardfork(e){let t=!1;for(const r of this.HARDFORK_CHANGES)r[0]===e&&(this._hardfork!==e&&(this._hardfork=e,this.emit("hardforkChanged",e)),t=!0);if(!t)throw new Error(`Hardfork with name ${e} not supported`)}getHardforkByBlockNumber(e,t,r){const n=(0,a.toType)(e,s.TypeOutput.BigInt),o=(0,a.toType)(t,s.TypeOutput.BigInt),i=(0,a.toType)(r,s.TypeOutput.Number),c=this.hardforks().filter((e=>null!==e.block||null!==e.ttd&&void 0!==e.ttd||void 0!==e.timestamp)),u=c.findIndex((e=>null!==e.ttd&&void 0!==e.ttd));if(c.slice(u+1).findIndex((e=>null!==e.ttd&&void 0!==e.ttd))>=0)throw Error("More than one merge hardforks found with ttd specified");let d=c.findIndex((e=>null!==e.block&&e.block>n||void 0!==i&&Number(e.timestamp)>i));if(-1===d)d=c.length;else if(0===d)throw Error("Must have at least one hardfork at block 0");if(void 0===i&&(d-=c.slice(0,d).reverse().findIndex((e=>null!==e.block||void 0!==e.ttd))),d-=1,null===c[d].block&&void 0===c[d].timestamp)(null==o||BigInt(c[d].ttd)>o)&&(d-=1);else if(u>=0&&null!=o){if(d>=u&&BigInt(c[u].ttd)>o)throw Error("Maximum HF determined by total difficulty is lower than the block number HF");if(d<u&&BigInt(c[u].ttd)<=o)throw Error("HF determined by block number is lower than the minimum total difficulty HF")}const l=d;for(;d<c.length-1&&c[d].block===c[d+1].block&&c[d].timestamp===c[d+1].timestamp;d+=1);if(i){if(c.slice(0,l).reduce(((e,t)=>{var r;return Math.max(Number(null!==(r=t.timestamp)&&void 0!==r?r:"0"),e)}),0)>i)throw Error("Maximum HF determined by timestamp is lower than the block number/ttd HF");if(c.slice(d+1).reduce(((e,t)=>{var r;return Math.min(Number(null!==(r=t.timestamp)&&void 0!==r?r:i),e)}),i)<i)throw Error("Maximum HF determined by block number/ttd is lower than timestamp HF")}return c[d].name}setHardforkByBlockNumber(e,t,r){const n=this.getHardforkByBlockNumber(e,t,r);return this.setHardfork(n),n}_getHardfork(e){const t=this.hardforks();for(const r of t)if(r.name===e)return r;return null}setEIPs(e=[]){for(const t of e){if(!(t in l.EIPs))throw new Error(`${t} not supported`);const r=this.gteHardfork(l.EIPs[t].minimumHardfork);if(!r)throw new Error(`${t} cannot be activated on hardfork ${this.hardfork()}, minimumHardfork: ${r}`);if(void 0!==l.EIPs[t].requiredEIPs)for(const r of l.EIPs[t].requiredEIPs)if(!e.includes(r)&&!this.isActivatedEIP(r))throw new Error(`${t} requires EIP ${r}, but is not included in the EIP list`)}this._eips=e}param(e,t){let r;for(const n of this._eips)if(r=this.paramByEIP(e,t,n),void 0!==r)return r;return this.paramByHardfork(e,t,this._hardfork)}paramByHardfork(e,t,r){let n=null;for(const o of this.HARDFORK_CHANGES){if("eips"in o[1]){const r=o[1].eips;for(const o of r){const r=this.paramByEIP(e,t,o);n="bigint"==typeof r?r:n}}else{if(void 0===o[1][e])throw new Error(`Topic ${e} not defined`);void 0!==o[1][e][t]&&(n=o[1][e][t].v)}if(o[0]===r)break}return BigInt(null!=n?n:0)}paramByEIP(e,t,r){if(!(r in l.EIPs))throw new Error(`${r} not supported`);const n=l.EIPs[r];if(!(e in n))throw new Error(`Topic ${e} not defined`);if(void 0===n[e][t])return;const o=n[e][t].v;return BigInt(o)}paramByBlock(e,t,r,n,o){const i=this.getHardforkByBlockNumber(r,n,o);return this.paramByHardfork(e,t,i)}isActivatedEIP(e){if(this.eips().includes(e))return!0;for(const t of this.HARDFORK_CHANGES){const r=t[1];if(this.gteHardfork(r.name)&&"eips"in r&&r.eips.includes(e))return!0}return!1}hardforkIsActiveOnBlock(e,t){const r=(0,a.toType)(t,s.TypeOutput.BigInt),n=null!=e?e:this._hardfork,o=this.hardforkBlock(n);return"bigint"==typeof o&&o!==BigInt(0)&&r>=o}activeOnBlock(e){return this.hardforkIsActiveOnBlock(null,e)}hardforkGteHardfork(e,t){const r=null!=e?e:this._hardfork,n=this.hardforks();let o=-1,i=-1,s=0;for(const e of n)e.name===r&&(o=s),e.name===t&&(i=s),s+=1;return o>=i&&-1!==i}gteHardfork(e){return this.hardforkGteHardfork(null,e)}hardforkBlock(e){var t;const r=null!=e?e:this._hardfork,n=null===(t=this._getHardfork(r))||void 0===t?void 0:t.block;return null==n?null:BigInt(n)}hardforkTimestamp(e){var t;const r=null!=e?e:this._hardfork,n=null===(t=this._getHardfork(r))||void 0===t?void 0:t.timestamp;return null==n?null:BigInt(n)}eipBlock(e){for(const t of this.HARDFORK_CHANGES){const r=t[1];if("eips"in r&&r.eips.includes(e))return this.hardforkBlock("number"==typeof t[0]?String(t[0]):t[0])}return null}hardforkTTD(e){var t;const r=null!=e?e:this._hardfork,n=null===(t=this._getHardfork(r))||void 0===t?void 0:t.ttd;return null==n?null:BigInt(n)}isHardforkBlock(e,t){const r=(0,a.toType)(e,s.TypeOutput.BigInt),n=null!=t?t:this._hardfork,o=this.hardforkBlock(n);return"bigint"==typeof o&&o!==BigInt(0)&&o===r}nextHardforkBlockOrTimestamp(e){var t,r;const n=null!=e?e:this._hardfork,o=this.hardforks();let i=o.findIndex((e=>e.name===n));if(n===h.Hardfork.Merge&&(i-=1),i<0)return null;let s=null!==(t=o[i].timestamp)&&void 0!==t?t:o[i].block;s=null!=s?Number(s):null;const a=o.slice(i+1).find((e=>{var t;let r=null!==(t=e.timestamp)&&void 0!==t?t:e.block;return r=null!=r?Number(r):null,e.name!==h.Hardfork.Merge&&null!=r&&r!==s}));if(void 0===a)return null;const c=null!==(r=a.timestamp)&&void 0!==r?r:a.block;return null==c?null:BigInt(c)}nextHardforkBlock(e){const t=null!=e?e:this._hardfork;let r=this.hardforkBlock(t);if(null===r&&t===h.Hardfork.Merge){const e=this.hardforks(),t=e.findIndex((e=>null!==e.ttd&&void 0!==e.ttd));if(t<0)throw Error("Merge hardfork should have been found");r=this.hardforkBlock(e[t-1].name)}return null===r?null:this.hardforks().reduce(((e,t)=>{const n=BigInt(null===t.block||void 0!==t.ttd&&null!==t.ttd?0:t.block);return n>r&&null===e?n:e}),null)}isNextHardforkBlock(e,t){const r=(0,a.toType)(e,s.TypeOutput.BigInt),n=null!=t?t:this._hardfork,o=this.nextHardforkBlock(n);return null!==o&&o===r}_calcForkHash(e,t){let r=new Uint8Array,n=0;for(const t of this.hardforks()){const{block:o,timestamp:s,name:a}=t;let c=null!=s?s:o;if(c=null!==c?Number(c):null,"number"==typeof c&&0!==c&&c!==n&&a!==h.Hardfork.Merge){const e=(0,i.hexToBytes)(c.toString(16).padStart(16,"0"));r=(0,i.uint8ArrayConcat)(r,e),n=c}if(t.name===e)break}const o=(0,i.uint8ArrayConcat)(t,r);return(0,i.bytesToHex)((0,a.intToUint8Array)(p(o)>>>0))}forkHash(e,t){const r=null!=e?e:this._hardfork,n=this._getHardfork(r);if(null===n||null===(null==n?void 0:n.block)&&void 0===(null==n?void 0:n.timestamp)&&void 0===(null==n?void 0:n.ttd))throw new Error("No fork hash calculation possible for future hardfork");if(null!==(null==n?void 0:n.forkHash)&&void 0!==(null==n?void 0:n.forkHash))return n.forkHash;if(!t)throw new Error("genesisHash required for forkHash calculation");return this._calcForkHash(r,t)}hardforkForForkHash(e){const t=this.hardforks().filter((t=>t.forkHash===e));return t.length>=1?t[t.length-1]:null}setForkHashes(e){var t;for(const r of this.hardforks()){const n=null!==(t=r.timestamp)&&void 0!==t?t:r.block;null!==r.forkHash&&void 0!==r.forkHash||null==n&&void 0===r.ttd||(r.forkHash=this.forkHash(r.name,e))}}genesis(){return this._chainParams.genesis}hardforks(){return this._chainParams.hardforks}bootstrapNodes(){return this._chainParams.bootstrapNodes}dnsNetworks(){return this._chainParams.dnsNetworks}hardfork(){return this._hardfork}chainId(){return BigInt(this._chainParams.chainId)}chainName(){return this._chainParams.name}networkId(){return BigInt(this._chainParams.networkId)}eips(){return this._eips}consensusType(){const e=this.hardfork();let t;for(const r of this.HARDFORK_CHANGES)if("consensus"in r[1]&&(t=r[1].consensus.type),r[0]===e)break;return null!=t?t:this._chainParams.consensus.type}consensusAlgorithm(){const e=this.hardfork();let t;for(const r of this.HARDFORK_CHANGES)if("consensus"in r[1]&&(t=r[1].consensus.algorithm),r[0]===e)break;return null!=t?t:this._chainParams.consensus.algorithm}consensusConfig(){var e;const t=this.hardfork();let r;for(const e of this.HARDFORK_CHANGES)if("consensus"in e[1]&&(r=e[1].consensus[e[1].consensus.algorithm]),e[0]===t)break;return null!==(e=null!=r?r:this._chainParams.consensus[this.consensusAlgorithm()])&&void 0!==e?e:{}}copy(){const e=Object.assign(Object.create(Object.getPrototypeOf(this)),this);return e.removeAllListeners(),e}static _getInitializedChains(e){const t={};for(const[e,r]of Object.entries(h.Chain))t[r]=e.toLowerCase();const r={mainnet:u.default,goerli:c.default,sepolia:d.default};if(e)for(const n of e){const{name:e}=n;t[n.chainId.toString()]=e,r[e]=n}return r.names=t,r}}t.Common=m},2819:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"EIP-1153",number:1153,comment:"Transient Storage",url:"https://eips.ethereum.org/EIPS/eip-1153",status:"Review",minimumHardfork:"chainstart",requiredEIPs:[],gasConfig:{},gasPrices:{tstore:{v:100,d:"Base fee of the TSTORE opcode"},tload:{v:100,d:"Base fee of the TLOAD opcode"}},vm:{},pow:{}}},4013:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"EIP-1559",number:1559,comment:"Fee market change for ETH 1.0 chain",url:"https://eips.ethereum.org/EIPS/eip-1559",status:"Final",minimumHardfork:"berlin",requiredEIPs:[2930],gasConfig:{baseFeeMaxChangeDenominator:{v:8,d:"Maximum base fee change denominator"},elasticityMultiplier:{v:2,d:"Maximum block gas target elasticity"},initialBaseFee:{v:1e9,d:"Initial base fee on first EIP1559 block"}},gasPrices:{},vm:{},pow:{}}},1933:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"EIP-2315",number:2315,comment:"Simple subroutines for the EVM",url:"https://eips.ethereum.org/EIPS/eip-2315",status:"Draft",minimumHardfork:"istanbul",gasConfig:{},gasPrices:{beginsub:{v:2,d:"Base fee of the BEGINSUB opcode"},returnsub:{v:5,d:"Base fee of the RETURNSUB opcode"},jumpsub:{v:10,d:"Base fee of the JUMPSUB opcode"}},vm:{},pow:{}}},4638:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"EIP-2537",number:2537,comment:"BLS12-381 precompiles",url:"https://eips.ethereum.org/EIPS/eip-2537",status:"Draft",minimumHardfork:"chainstart",gasConfig:{},gasPrices:{Bls12381G1AddGas:{v:600,d:"Gas cost of a single BLS12-381 G1 addition precompile-call"},Bls12381G1MulGas:{v:12e3,d:"Gas cost of a single BLS12-381 G1 multiplication precompile-call"},Bls12381G2AddGas:{v:4500,d:"Gas cost of a single BLS12-381 G2 addition precompile-call"},Bls12381G2MulGas:{v:55e3,d:"Gas cost of a single BLS12-381 G2 multiplication precompile-call"},Bls12381PairingBaseGas:{v:115e3,d:"Base gas cost of BLS12-381 pairing check"},Bls12381PairingPerPairGas:{v:23e3,d:"Per-pair gas cost of BLS12-381 pairing check"},Bls12381MapG1Gas:{v:5500,d:"Gas cost of BLS12-381 map field element to G1"},Bls12381MapG2Gas:{v:11e4,d:"Gas cost of BLS12-381 map field element to G2"},Bls12381MultiExpGasDiscount:{v:[[1,1200],[2,888],[3,764],[4,641],[5,594],[6,547],[7,500],[8,453],[9,438],[10,423],[11,408],[12,394],[13,379],[14,364],[15,349],[16,334],[17,330],[18,326],[19,322],[20,318],[21,314],[22,310],[23,306],[24,302],[25,298],[26,294],[27,289],[28,285],[29,281],[30,277],[31,273],[32,269],[33,268],[34,266],[35,265],[36,263],[37,262],[38,260],[39,259],[40,257],[41,256],[42,254],[43,253],[44,251],[45,250],[46,248],[47,247],[48,245],[49,244],[50,242],[51,241],[52,239],[53,238],[54,236],[55,235],[56,233],[57,232],[58,231],[59,229],[60,228],[61,226],[62,225],[63,223],[64,222],[65,221],[66,220],[67,219],[68,219],[69,218],[70,217],[71,216],[72,216],[73,215],[74,214],[75,213],[76,213],[77,212],[78,211],[79,211],[80,210],[81,209],[82,208],[83,208],[84,207],[85,206],[86,205],[87,205],[88,204],[89,203],[90,202],[91,202],[92,201],[93,200],[94,199],[95,199],[96,198],[97,197],[98,196],[99,196],[100,195],[101,194],[102,193],[103,193],[104,192],[105,191],[106,191],[107,190],[108,189],[109,188],[110,188],[111,187],[112,186],[113,185],[114,185],[115,184],[116,183],[117,182],[118,182],[119,181],[120,180],[121,179],[122,179],[123,178],[124,177],[125,176],[126,176],[127,175],[128,174]],d:"Discount gas costs of calls to the MultiExp precompiles with `k` (point, scalar) pair"}},vm:{},pow:{}}},6906:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"EIP-2565",number:2565,comment:"ModExp gas cost",url:"https://eips.ethereum.org/EIPS/eip-2565",status:"Final",minimumHardfork:"byzantium",gasConfig:{},gasPrices:{modexpGquaddivisor:{v:3,d:"Gquaddivisor from modexp precompile for gas calculation"}},vm:{},pow:{}}},3399:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"EIP-2718",comment:"Typed Transaction Envelope",url:"https://eips.ethereum.org/EIPS/eip-2718",status:"Final",minimumHardfork:"chainstart",gasConfig:{},gasPrices:{},vm:{},pow:{}}},7387:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"EIP-2929",comment:"Gas cost increases for state access opcodes",url:"https://eips.ethereum.org/EIPS/eip-2929",status:"Final",minimumHardfork:"chainstart",gasConfig:{},gasPrices:{coldsload:{v:2100,d:"Gas cost of the first read of storage from a given location (per transaction)"},coldaccountaccess:{v:2600,d:"Gas cost of the first read of a given address (per transaction)"},warmstorageread:{v:100,d:"Gas cost of reading storage locations which have already loaded 'cold'"},sstoreCleanGasEIP2200:{v:2900,d:"Once per SSTORE operation from clean non-zero to something else"},sstoreNoopGasEIP2200:{v:100,d:"Once per SSTORE operation if the value doesn't change"},sstoreDirtyGasEIP2200:{v:100,d:"Once per SSTORE operation if a dirty value is changed"},sstoreInitRefundEIP2200:{v:19900,d:"Once per SSTORE operation for resetting to the original zero value"},sstoreCleanRefundEIP2200:{v:4900,d:"Once per SSTORE operation for resetting to the original non-zero value"},call:{v:0,d:"Base fee of the CALL opcode"},callcode:{v:0,d:"Base fee of the CALLCODE opcode"},delegatecall:{v:0,d:"Base fee of the DELEGATECALL opcode"},staticcall:{v:0,d:"Base fee of the STATICCALL opcode"},balance:{v:0,d:"Base fee of the BALANCE opcode"},extcodesize:{v:0,d:"Base fee of the EXTCODESIZE opcode"},extcodecopy:{v:0,d:"Base fee of the EXTCODECOPY opcode"},extcodehash:{v:0,d:"Base fee of the EXTCODEHASH opcode"},sload:{v:0,d:"Base fee of the SLOAD opcode"},sstore:{v:0,d:"Base fee of the SSTORE opcode"}},vm:{},pow:{}}},6299:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"EIP-2930",comment:"Optional access lists",url:"https://eips.ethereum.org/EIPS/eip-2930",status:"Final",minimumHardfork:"istanbul",requiredEIPs:[2718,2929],gasConfig:{},gasPrices:{accessListStorageKeyCost:{v:1900,d:"Gas cost per storage key in an Access List transaction"},accessListAddressCost:{v:2400,d:"Gas cost per storage key in an Access List transaction"}},vm:{},pow:{}}},1073:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"EIP-3198",number:3198,comment:"BASEFEE opcode",url:"https://eips.ethereum.org/EIPS/eip-3198",status:"Final",minimumHardfork:"london",gasConfig:{},gasPrices:{basefee:{v:2,d:"Gas cost of the BASEFEE opcode"}},vm:{},pow:{}}},634:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"EIP-3529",comment:"Reduction in refunds",url:"https://eips.ethereum.org/EIPS/eip-3529",status:"Final",minimumHardfork:"berlin",requiredEIPs:[2929],gasConfig:{maxRefundQuotient:{v:5,d:"Maximum refund quotient; max tx refund is min(tx.gasUsed/maxRefundQuotient, tx.gasRefund)"}},gasPrices:{selfdestructRefund:{v:0,d:"Refunded following a selfdestruct operation"},sstoreClearRefundEIP2200:{v:4800,d:"Once per SSTORE operation for clearing an originally existing storage slot"}},vm:{},pow:{}}},3829:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"EIP-3540",number:3540,comment:"EVM Object Format (EOF) v1",url:"https://eips.ethereum.org/EIPS/eip-3540",status:"Review",minimumHardfork:"london",requiredEIPs:[3541],gasConfig:{},gasPrices:{},vm:{},pow:{}}},5729:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"EIP-3541",comment:"Reject new contracts starting with the 0xEF byte",url:"https://eips.ethereum.org/EIPS/eip-3541",status:"Final",minimumHardfork:"berlin",requiredEIPs:[],gasConfig:{},gasPrices:{},vm:{},pow:{}}},8958:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"EIP-3554",comment:"Reduction in refunds",url:"Difficulty Bomb Delay to December 1st 2021",status:"Final",minimumHardfork:"muirGlacier",requiredEIPs:[],gasConfig:{},gasPrices:{},vm:{},pow:{difficultyBombDelay:{v:95e5,d:"the amount of blocks to delay the difficulty bomb with"}}}},8334:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"EIP-3607",number:3607,comment:"Reject transactions from senders with deployed code",url:"https://eips.ethereum.org/EIPS/eip-3607",status:"Final",minimumHardfork:"chainstart",requiredEIPs:[],gasConfig:{},gasPrices:{},vm:{},pow:{}}},3412:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"EIP-3651",number:3198,comment:"Warm COINBASE",url:"https://eips.ethereum.org/EIPS/eip-3651",status:"Review",minimumHardfork:"london",requiredEIPs:[2929],gasConfig:{},gasPrices:{},vm:{},pow:{}}},6337:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"EIP-3670",number:3670,comment:"EOF - Code Validation",url:"https://eips.ethereum.org/EIPS/eip-3670",status:"Review",minimumHardfork:"london",requiredEIPs:[3540],gasConfig:{},gasPrices:{},vm:{},pow:{}}},2610:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"EIP-3675",number:3675,comment:"Upgrade consensus to Proof-of-Stake",url:"https://eips.ethereum.org/EIPS/eip-3675",status:"Final",minimumHardfork:"london",requiredEIPs:[],gasConfig:{},gasPrices:{},vm:{},pow:{}}},7619:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"EIP-3855",number:3855,comment:"PUSH0 instruction",url:"https://eips.ethereum.org/EIPS/eip-3855",status:"Review",minimumHardfork:"chainstart",requiredEIPs:[],gasConfig:{},gasPrices:{push0:{v:2,d:"Base fee of the PUSH0 opcode"}},vm:{},pow:{}}},8018:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"EIP-3860",number:3860,comment:"Limit and meter initcode",url:"https://eips.ethereum.org/EIPS/eip-3860",status:"Review",minimumHardfork:"spuriousDragon",requiredEIPs:[],gasConfig:{},gasPrices:{initCodeWordCost:{v:2,d:"Gas to pay for each word (32 bytes) of initcode when creating a contract"}},vm:{maxInitCodeSize:{v:49152,d:"Maximum length of initialization code when creating a contract"}},pow:{}}},6779:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"EIP-4345",number:4345,comment:"Difficulty Bomb Delay to June 2022",url:"https://eips.ethereum.org/EIPS/eip-4345",status:"Final",minimumHardfork:"london",gasConfig:{},gasPrices:{},vm:{},pow:{difficultyBombDelay:{v:107e5,d:"the amount of blocks to delay the difficulty bomb with"}}}},623:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"EIP-4399",number:4399,comment:"Supplant DIFFICULTY opcode with PREVRANDAO",url:"https://eips.ethereum.org/EIPS/eip-4399",status:"Review",minimumHardfork:"london",requiredEIPs:[],gasConfig:{},gasPrices:{},vm:{},pow:{}}},797:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"EIP-5133",number:5133,comment:"Delaying Difficulty Bomb to mid-September 2022",url:"https://eips.ethereum.org/EIPS/eip-5133",status:"Draft",minimumHardfork:"grayGlacier",gasConfig:{},gasPrices:{},vm:{},pow:{difficultyBombDelay:{v:114e5,d:"the amount of blocks to delay the difficulty bomb with"}}}},5257:function(e,t,r){"use strict";var n=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.EIPs=void 0;const o=n(r(2819)),i=n(r(4013)),s=n(r(1933)),a=n(r(4638)),c=n(r(6906)),u=n(r(3399)),d=n(r(7387)),l=n(r(6299)),h=n(r(1073)),f=n(r(634)),p=n(r(3829)),m=n(r(5729)),g=n(r(8958)),y=n(r(8334)),v=n(r(3412)),b=n(r(6337)),E=n(r(2610)),_=n(r(7619)),A=n(r(8018)),T=n(r(6779)),w=n(r(623)),I=n(r(797));t.EIPs={1153:o.default,1559:i.default,2315:s.default,2537:a.default,2565:c.default,2718:u.default,2929:d.default,2930:l.default,3198:h.default,3529:f.default,3540:p.default,3541:m.default,3554:g.default,3607:y.default,3651:v.default,3670:b.default,3675:E.default,3855:_.default,3860:A.default,4345:T.default,4399:w.default,5133:I.default}},4443:(e,t)=>{"use strict";var r,n,o,i,s;Object.defineProperty(t,"__esModule",{value:!0}),t.CustomChain=t.ConsensusAlgorithm=t.ConsensusType=t.Hardfork=t.Chain=void 0,(s=t.Chain||(t.Chain={}))[s.Mainnet=1]="Mainnet",s[s.Goerli=5]="Goerli",s[s.Sepolia=11155111]="Sepolia",(i=t.Hardfork||(t.Hardfork={})).Chainstart="chainstart",i.Homestead="homestead",i.Dao="dao",i.TangerineWhistle="tangerineWhistle",i.SpuriousDragon="spuriousDragon",i.Byzantium="byzantium",i.Constantinople="constantinople",i.Petersburg="petersburg",i.Istanbul="istanbul",i.MuirGlacier="muirGlacier",i.Berlin="berlin",i.London="london",i.ArrowGlacier="arrowGlacier",i.GrayGlacier="grayGlacier",i.MergeForkIdTransition="mergeForkIdTransition",i.Merge="merge",i.Shanghai="shanghai",i.ShardingForkDev="shardingFork",(o=t.ConsensusType||(t.ConsensusType={})).ProofOfStake="pos",o.ProofOfWork="pow",o.ProofOfAuthority="poa",(n=t.ConsensusAlgorithm||(t.ConsensusAlgorithm={})).Ethash="ethash",n.Clique="clique",n.Casper="casper",(r=t.CustomChain||(t.CustomChain={})).PolygonMainnet="polygon-mainnet",r.PolygonMumbai="polygon-mumbai",r.ArbitrumRinkebyTestnet="arbitrum-rinkeby-testnet",r.ArbitrumOne="arbitrum-one",r.xDaiChain="x-dai-chain",r.OptimisticKovan="optimistic-kovan",r.OptimisticEthereum="optimistic-ethereum"},3923:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"arrowGlacier",comment:"HF to delay the difficulty bomb",url:"https://github.com/ethereum/execution-specs/blob/master/network-upgrades/mainnet-upgrades/arrow-glacier.md",status:"Final",eips:[4345],gasConfig:{},gasPrices:{},vm:{},pow:{}}},9126:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"berlin",comment:"HF targeted for July 2020 following the Muir Glacier HF",url:"https://eips.ethereum.org/EIPS/eip-2070",status:"Final",eips:[2565,2929,2718,2930]}},7251:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"byzantium",comment:"Hardfork with new precompiles, instructions and other protocol changes",url:"https://eips.ethereum.org/EIPS/eip-609",status:"Final",gasConfig:{},gasPrices:{modexpGquaddivisor:{v:20,d:"Gquaddivisor from modexp precompile for gas calculation"},ecAdd:{v:500,d:"Gas costs for curve addition precompile"},ecMul:{v:4e4,d:"Gas costs for curve multiplication precompile"},ecPairing:{v:1e5,d:"Base gas costs for curve pairing precompile"},ecPairingWord:{v:8e4,d:"Gas costs regarding curve pairing precompile input length"},revert:{v:0,d:"Base fee of the REVERT opcode"},staticcall:{v:700,d:"Base fee of the STATICCALL opcode"},returndatasize:{v:2,d:"Base fee of the RETURNDATASIZE opcode"},returndatacopy:{v:3,d:"Base fee of the RETURNDATACOPY opcode"}},vm:{},pow:{minerReward:{v:"3000000000000000000",d:"the amount a miner get rewarded for mining a block"},difficultyBombDelay:{v:3e6,d:"the amount of blocks to delay the difficulty bomb with"}}}},9454:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"chainstart",comment:"Start of the Ethereum main chain",url:"",status:"",gasConfig:{minGasLimit:{v:5e3,d:"Minimum the gas limit may ever be"},gasLimitBoundDivisor:{v:1024,d:"The bound divisor of the gas limit, used in update calculations"},maxRefundQuotient:{v:2,d:"Maximum refund quotient; max tx refund is min(tx.gasUsed/maxRefundQuotient, tx.gasRefund)"}},gasPrices:{base:{v:2,d:"Gas base cost, used e.g. for ChainID opcode (Istanbul)"},tierStep:{v:[0,2,3,5,8,10,20],d:"Once per operation, for a selection of them"},exp:{v:10,d:"Base fee of the EXP opcode"},expByte:{v:10,d:"Times ceil(log256(exponent)) for the EXP instruction"},sha3:{v:30,d:"Base fee of the SHA3 opcode"},sha3Word:{v:6,d:"Once per word of the SHA3 operation's data"},sload:{v:50,d:"Base fee of the SLOAD opcode"},sstoreSet:{v:2e4,d:"Once per SSTORE operation if the zeroness changes from zero"},sstoreReset:{v:5e3,d:"Once per SSTORE operation if the zeroness does not change from zero"},sstoreRefund:{v:15e3,d:"Once per SSTORE operation if the zeroness changes to zero"},jumpdest:{v:1,d:"Base fee of the JUMPDEST opcode"},log:{v:375,d:"Base fee of the LOG opcode"},logData:{v:8,d:"Per byte in a LOG* operation's data"},logTopic:{v:375,d:"Multiplied by the * of the LOG*, per LOG transaction. e.g. LOG0 incurs 0 * c_txLogTopicGas, LOG4 incurs 4 * c_txLogTopicGas"},create:{v:32e3,d:"Base fee of the CREATE opcode"},call:{v:40,d:"Base fee of the CALL opcode"},callStipend:{v:2300,d:"Free gas given at beginning of call"},callValueTransfer:{v:9e3,d:"Paid for CALL when the value transfor is non-zero"},callNewAccount:{v:25e3,d:"Paid for CALL when the destination address didn't exist prior"},selfdestructRefund:{v:24e3,d:"Refunded following a selfdestruct operation"},memory:{v:3,d:"Times the address of the (highest referenced byte in memory + 1). NOTE: referencing happens on read, write and in instructions such as RETURN and CALL"},quadCoeffDiv:{v:512,d:"Divisor for the quadratic particle of the memory cost equation"},createData:{v:200,d:""},tx:{v:21e3,d:"Per transaction. NOTE: Not payable on data of calls between transactions"},txCreation:{v:32e3,d:"The cost of creating a contract via tx"},txDataZero:{v:4,d:"Per byte of data attached to a transaction that equals zero. NOTE: Not payable on data of calls between transactions"},txDataNonZero:{v:68,d:"Per byte of data attached to a transaction that is not equal to zero. NOTE: Not payable on data of calls between transactions"},copy:{v:3,d:"Multiplied by the number of 32-byte words that are copied (round up) for any *COPY operation and added"},ecRecover:{v:3e3,d:""},sha256:{v:60,d:""},sha256Word:{v:12,d:""},ripemd160:{v:600,d:""},ripemd160Word:{v:120,d:""},identity:{v:15,d:""},identityWord:{v:3,d:""},stop:{v:0,d:"Base fee of the STOP opcode"},add:{v:3,d:"Base fee of the ADD opcode"},mul:{v:5,d:"Base fee of the MUL opcode"},sub:{v:3,d:"Base fee of the SUB opcode"},div:{v:5,d:"Base fee of the DIV opcode"},sdiv:{v:5,d:"Base fee of the SDIV opcode"},mod:{v:5,d:"Base fee of the MOD opcode"},smod:{v:5,d:"Base fee of the SMOD opcode"},addmod:{v:8,d:"Base fee of the ADDMOD opcode"},mulmod:{v:8,d:"Base fee of the MULMOD opcode"},signextend:{v:5,d:"Base fee of the SIGNEXTEND opcode"},lt:{v:3,d:"Base fee of the LT opcode"},gt:{v:3,d:"Base fee of the GT opcode"},slt:{v:3,d:"Base fee of the SLT opcode"},sgt:{v:3,d:"Base fee of the SGT opcode"},eq:{v:3,d:"Base fee of the EQ opcode"},iszero:{v:3,d:"Base fee of the ISZERO opcode"},and:{v:3,d:"Base fee of the AND opcode"},or:{v:3,d:"Base fee of the OR opcode"},xor:{v:3,d:"Base fee of the XOR opcode"},not:{v:3,d:"Base fee of the NOT opcode"},byte:{v:3,d:"Base fee of the BYTE opcode"},address:{v:2,d:"Base fee of the ADDRESS opcode"},balance:{v:20,d:"Base fee of the BALANCE opcode"},origin:{v:2,d:"Base fee of the ORIGIN opcode"},caller:{v:2,d:"Base fee of the CALLER opcode"},callvalue:{v:2,d:"Base fee of the CALLVALUE opcode"},calldataload:{v:3,d:"Base fee of the CALLDATALOAD opcode"},calldatasize:{v:2,d:"Base fee of the CALLDATASIZE opcode"},calldatacopy:{v:3,d:"Base fee of the CALLDATACOPY opcode"},codesize:{v:2,d:"Base fee of the CODESIZE opcode"},codecopy:{v:3,d:"Base fee of the CODECOPY opcode"},gasprice:{v:2,d:"Base fee of the GASPRICE opcode"},extcodesize:{v:20,d:"Base fee of the EXTCODESIZE opcode"},extcodecopy:{v:20,d:"Base fee of the EXTCODECOPY opcode"},blockhash:{v:20,d:"Base fee of the BLOCKHASH opcode"},coinbase:{v:2,d:"Base fee of the COINBASE opcode"},timestamp:{v:2,d:"Base fee of the TIMESTAMP opcode"},number:{v:2,d:"Base fee of the NUMBER opcode"},difficulty:{v:2,d:"Base fee of the DIFFICULTY opcode"},gaslimit:{v:2,d:"Base fee of the GASLIMIT opcode"},pop:{v:2,d:"Base fee of the POP opcode"},mload:{v:3,d:"Base fee of the MLOAD opcode"},mstore:{v:3,d:"Base fee of the MSTORE opcode"},mstore8:{v:3,d:"Base fee of the MSTORE8 opcode"},sstore:{v:0,d:"Base fee of the SSTORE opcode"},jump:{v:8,d:"Base fee of the JUMP opcode"},jumpi:{v:10,d:"Base fee of the JUMPI opcode"},pc:{v:2,d:"Base fee of the PC opcode"},msize:{v:2,d:"Base fee of the MSIZE opcode"},gas:{v:2,d:"Base fee of the GAS opcode"},push:{v:3,d:"Base fee of the PUSH opcode"},dup:{v:3,d:"Base fee of the DUP opcode"},swap:{v:3,d:"Base fee of the SWAP opcode"},callcode:{v:40,d:"Base fee of the CALLCODE opcode"},return:{v:0,d:"Base fee of the RETURN opcode"},invalid:{v:0,d:"Base fee of the INVALID opcode"},selfdestruct:{v:0,d:"Base fee of the SELFDESTRUCT opcode"}},vm:{stackLimit:{v:1024,d:"Maximum size of VM stack allowed"},callCreateDepth:{v:1024,d:"Maximum depth of call/create stack"},maxExtraDataSize:{v:32,d:"Maximum size extra data may be after Genesis"}},pow:{minimumDifficulty:{v:131072,d:"The minimum that the difficulty may ever be"},difficultyBoundDivisor:{v:2048,d:"The bound divisor of the difficulty, used in the update calculations"},durationLimit:{v:13,d:"The decision boundary on the blocktime duration used to determine whether difficulty should go up or not"},epochDuration:{v:3e4,d:"Duration between proof-of-work epochs"},timebombPeriod:{v:1e5,d:"Exponential difficulty timebomb period"},minerReward:{v:"5000000000000000000",d:"the amount a miner get rewarded for mining a block"},difficultyBombDelay:{v:0,d:"the amount of blocks to delay the difficulty bomb with"}}}},1353:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"constantinople",comment:"Postponed hardfork including EIP-1283 (SSTORE gas metering changes)",url:"https://eips.ethereum.org/EIPS/eip-1013",status:"Final",gasConfig:{},gasPrices:{netSstoreNoopGas:{v:200,d:"Once per SSTORE operation if the value doesn't change"},netSstoreInitGas:{v:2e4,d:"Once per SSTORE operation from clean zero"},netSstoreCleanGas:{v:5e3,d:"Once per SSTORE operation from clean non-zero"},netSstoreDirtyGas:{v:200,d:"Once per SSTORE operation from dirty"},netSstoreClearRefund:{v:15e3,d:"Once per SSTORE operation for clearing an originally existing storage slot"},netSstoreResetRefund:{v:4800,d:"Once per SSTORE operation for resetting to the original non-zero value"},netSstoreResetClearRefund:{v:19800,d:"Once per SSTORE operation for resetting to the original zero value"},shl:{v:3,d:"Base fee of the SHL opcode"},shr:{v:3,d:"Base fee of the SHR opcode"},sar:{v:3,d:"Base fee of the SAR opcode"},extcodehash:{v:400,d:"Base fee of the EXTCODEHASH opcode"},create2:{v:32e3,d:"Base fee of the CREATE2 opcode"}},vm:{},pow:{minerReward:{v:"2000000000000000000",d:"The amount a miner gets rewarded for mining a block"},difficultyBombDelay:{v:5e6,d:"the amount of blocks to delay the difficulty bomb with"}}}},3810:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"dao",comment:"DAO rescue hardfork",url:"https://eips.ethereum.org/EIPS/eip-779",status:"Final",gasConfig:{},gasPrices:{},vm:{},pow:{}}},6257:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"grayGlacier",comment:"Delaying the difficulty bomb to Mid September 2022",url:"https://github.com/ethereum/execution-specs/blob/master/network-upgrades/mainnet-upgrades/gray-glacier.md",status:"Draft",eips:[5133],gasConfig:{},gasPrices:{},vm:{},pow:{}}},7446:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"homestead",comment:"Homestead hardfork with protocol and network changes",url:"https://eips.ethereum.org/EIPS/eip-606",status:"Final",gasConfig:{},gasPrices:{delegatecall:{v:40,d:"Base fee of the DELEGATECALL opcode"}},vm:{},pow:{}}},9137:function(e,t,r){"use strict";var n=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.hardforks=void 0;const o=n(r(9454)),i=n(r(3810)),s=n(r(7446)),a=n(r(7458)),c=n(r(2546)),u=n(r(7251)),d=n(r(1353)),l=n(r(5338)),h=n(r(9597)),f=n(r(7931)),p=n(r(9126)),m=n(r(1233)),g=n(r(2761)),y=n(r(3923)),v=n(r(6257)),b=n(r(6697)),E=n(r(6668));t.hardforks={chainstart:o.default,homestead:s.default,dao:i.default,tangerineWhistle:a.default,spuriousDragon:c.default,byzantium:u.default,constantinople:d.default,petersburg:l.default,istanbul:h.default,muirGlacier:f.default,berlin:p.default,london:m.default,shanghai:g.default,arrowGlacier:y.default,grayGlacier:v.default,mergeForkIdTransition:b.default,merge:E.default}},9597:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"istanbul",comment:"HF targeted for December 2019 following the Constantinople/Petersburg HF",url:"https://eips.ethereum.org/EIPS/eip-1679",status:"Final",gasConfig:{},gasPrices:{blake2Round:{v:1,d:"Gas cost per round for the Blake2 F precompile"},ecAdd:{v:150,d:"Gas costs for curve addition precompile"},ecMul:{v:6e3,d:"Gas costs for curve multiplication precompile"},ecPairing:{v:45e3,d:"Base gas costs for curve pairing precompile"},ecPairingWord:{v:34e3,d:"Gas costs regarding curve pairing precompile input length"},txDataNonZero:{v:16,d:"Per byte of data attached to a transaction that is not equal to zero. NOTE: Not payable on data of calls between transactions"},sstoreSentryGasEIP2200:{v:2300,d:"Minimum gas required to be present for an SSTORE call, not consumed"},sstoreNoopGasEIP2200:{v:800,d:"Once per SSTORE operation if the value doesn't change"},sstoreDirtyGasEIP2200:{v:800,d:"Once per SSTORE operation if a dirty value is changed"},sstoreInitGasEIP2200:{v:2e4,d:"Once per SSTORE operation from clean zero to non-zero"},sstoreInitRefundEIP2200:{v:19200,d:"Once per SSTORE operation for resetting to the original zero value"},sstoreCleanGasEIP2200:{v:5e3,d:"Once per SSTORE operation from clean non-zero to something else"},sstoreCleanRefundEIP2200:{v:4200,d:"Once per SSTORE operation for resetting to the original non-zero value"},sstoreClearRefundEIP2200:{v:15e3,d:"Once per SSTORE operation for clearing an originally existing storage slot"},balance:{v:700,d:"Base fee of the BALANCE opcode"},extcodehash:{v:700,d:"Base fee of the EXTCODEHASH opcode"},chainid:{v:2,d:"Base fee of the CHAINID opcode"},selfbalance:{v:5,d:"Base fee of the SELFBALANCE opcode"},sload:{v:800,d:"Base fee of the SLOAD opcode"}},vm:{},pow:{}}},1233:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"london",comment:"HF targeted for July 2021 following the Berlin fork",url:"https://github.com/ethereum/eth1.0-specs/blob/master/network-upgrades/mainnet-upgrades/london.md",status:"Final",eips:[1559,3198,3529,3541]}},6668:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"merge",comment:"Hardfork to upgrade the consensus mechanism to Proof-of-Stake",url:"https://github.com/ethereum/execution-specs/blob/master/network-upgrades/mainnet-upgrades/merge.md",status:"Final",consensus:{type:"pos",algorithm:"casper",casper:{}},eips:[3675,4399]}},6697:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"mergeForkIdTransition",comment:"Pre-merge hardfork to fork off non-upgraded clients",url:"https://eips.ethereum.org/EIPS/eip-3675",status:"Draft",eips:[]}},7931:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"muirGlacier",comment:"HF to delay the difficulty bomb",url:"https://eips.ethereum.org/EIPS/eip-2384",status:"Final",gasConfig:{},gasPrices:{},vm:{},pow:{difficultyBombDelay:{v:9e6,d:"the amount of blocks to delay the difficulty bomb with"}}}},5338:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"petersburg",comment:"Aka constantinopleFix, removes EIP-1283, activate together with or after constantinople",url:"https://eips.ethereum.org/EIPS/eip-1716",status:"Final",gasConfig:{},gasPrices:{netSstoreNoopGas:{v:null,d:"Removed along EIP-1283"},netSstoreInitGas:{v:null,d:"Removed along EIP-1283"},netSstoreCleanGas:{v:null,d:"Removed along EIP-1283"},netSstoreDirtyGas:{v:null,d:"Removed along EIP-1283"},netSstoreClearRefund:{v:null,d:"Removed along EIP-1283"},netSstoreResetRefund:{v:null,d:"Removed along EIP-1283"},netSstoreResetClearRefund:{v:null,d:"Removed along EIP-1283"}},vm:{},pow:{}}},2761:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"shanghai",comment:"Next feature hardfork after the merge hardfork having withdrawals, warm coinbase, push0, limit/meter initcode",url:"https://github.com/ethereum/execution-specs/blob/master/network-upgrades/mainnet-upgrades/shanghai.md",status:"Final",eips:[3651,3855,3860,4895]}},2546:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"spuriousDragon",comment:"HF with EIPs for simple replay attack protection, EXP cost increase, state trie clearing, contract code size limit",url:"https://eips.ethereum.org/EIPS/eip-607",status:"Final",gasConfig:{},gasPrices:{expByte:{v:50,d:"Times ceil(log256(exponent)) for the EXP instruction"}},vm:{maxCodeSize:{v:24576,d:"Maximum length of contract code"}},pow:{}}},7458:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"tangerineWhistle",comment:"Hardfork with gas cost changes for IO-heavy operations",url:"https://eips.ethereum.org/EIPS/eip-608",status:"Final",gasConfig:{},gasPrices:{sload:{v:200,d:"Once per SLOAD operation"},call:{v:700,d:"Once per CALL operation & message call transaction"},extcodesize:{v:700,d:"Base fee of the EXTCODESIZE opcode"},extcodecopy:{v:700,d:"Base fee of the EXTCODECOPY opcode"},balance:{v:400,d:"Base fee of the BALANCE opcode"},delegatecall:{v:700,d:"Base fee of the DELEGATECALL opcode"},callcode:{v:700,d:"Base fee of the CALLCODE opcode"},selfdestruct:{v:5e3,d:"Base fee of the SELFDESTRUCT opcode"}},vm:{},pow:{}}},8317:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r);var o=Object.getOwnPropertyDescriptor(t,r);o&&!("get"in o?!t.__esModule:o.writable||o.configurable)||(o={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,o)}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),o=this&&this.__exportStar||function(e,t){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(t,r)||n(t,e,r)};Object.defineProperty(t,"__esModule",{value:!0}),o(r(6664),t),o(r(4443),t),o(r(850),t),o(r(2290),t)},850:(e,t)=>{"use strict";var r;Object.defineProperty(t,"__esModule",{value:!0}),t.TypeOutput=void 0,(r=t.TypeOutput||(t.TypeOutput={}))[r.Number=0]="Number",r[r.BigInt=1]="BigInt",r[r.Uint8Array=2]="Uint8Array",r[r.PrefixedHexString=3]="PrefixedHexString"},2290:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.toType=t.ecrecover=t.bigIntToUnpaddedUint8Array=t.bigIntToHex=t.unpadUint8Array=t.stripZeros=t.setLengthLeft=t.assertIsUint8Array=t.zeros=t.bigIntToUint8Array=t.uint8ArrayToBigInt=t.toUint8Array=t.intToUint8Array=t.padToEven=t.parseGethGenesis=t.stripHexPrefix=void 0;const n=r(7345),o=r(9634),i=r(4555),s=r(4443),a=r(850);t.stripHexPrefix=e=>{if("string"!=typeof e)throw new Error("[stripHexPrefix] input must be type 'string', received "+typeof e);return(0,n.isHexPrefixed)(e)?e.slice(2):e};const c=function(e){if(!Number.isSafeInteger(e)||e<0)throw new Error(`Received an invalid integer type: ${e}`);return`0x${e.toString(16)}`};function u(e){let t=e;if("string"!=typeof t)throw new Error("[padToEven] value must be type 'string', received "+typeof t);return t.length%2&&(t=`0${t}`),t}function d(e){const t=(0,o.bytesToHex)(e);return"0x"===t?BigInt(0):BigInt(t)}function l(e){return(0,t.toUint8Array)(`0x${e.toString(16)}`)}function h(e){if(!(0,o.isUint8Array)(e))throw new Error(`This method only supports Uint8Array but input was: ${e}`)}function f(e){let t=e[0];for(;e.length>0&&"0"===t.toString();)t=(e=e.slice(1))[0];return e}t.parseGethGenesis=function(e,r,o){try{if(["config","difficulty","gasLimit","alloc"].some((t=>!(t in e))))throw new Error("Invalid format, expected geth genesis fields missing");return void 0!==r&&(e.name=r),function(e,r=!0){var o,i;const{name:a,config:u,difficulty:d,mixHash:l,gasLimit:h,coinbase:f,baseFeePerGas:p}=e;let{extraData:m,timestamp:g,nonce:y}=e;const v=Number(g),{chainId:b}=u;if(""===m&&(m="0x"),(0,n.isHexPrefixed)(g)||(g=c(parseInt(g))),18!==y.length&&(y=function(e){return e&&"0x0"!==e?(0,n.isHexPrefixed)(e)?`0x${(0,t.stripHexPrefix)(e).padStart(16,"0")}`:`0x${e.padStart(16,"0")}`:"0x0000000000000000"}(y)),u.eip155Block!==u.eip158Block)throw new Error("EIP155 block number must equal EIP 158 block number since both are part of SpuriousDragon hardfork and the client only supports activating the full hardfork");const E={name:a,chainId:b,networkId:b,genesis:{timestamp:g,gasLimit:parseInt(h),difficulty:parseInt(d),nonce:y,extraData:m,mixHash:l,coinbase:f,baseFeePerGas:p},hardfork:void 0,hardforks:[],bootstrapNodes:[],consensus:void 0!==u.clique?{type:"poa",algorithm:"clique",clique:{period:null!==(o=u.clique.period)&&void 0!==o?o:u.clique.blockperiodseconds,epoch:null!==(i=u.clique.epoch)&&void 0!==i?i:u.clique.epochlength}}:{type:"pow",algorithm:"ethash",ethash:{}}},_={[s.Hardfork.Homestead]:{name:"homesteadBlock"},[s.Hardfork.Dao]:{name:"daoForkBlock"},[s.Hardfork.TangerineWhistle]:{name:"eip150Block"},[s.Hardfork.SpuriousDragon]:{name:"eip155Block"},[s.Hardfork.Byzantium]:{name:"byzantiumBlock"},[s.Hardfork.Constantinople]:{name:"constantinopleBlock"},[s.Hardfork.Petersburg]:{name:"petersburgBlock"},[s.Hardfork.Istanbul]:{name:"istanbulBlock"},[s.Hardfork.MuirGlacier]:{name:"muirGlacierBlock"},[s.Hardfork.Berlin]:{name:"berlinBlock"},[s.Hardfork.London]:{name:"londonBlock"},[s.Hardfork.MergeForkIdTransition]:{name:"mergeForkBlock",postMerge:r},[s.Hardfork.Shanghai]:{name:"shanghaiTime",postMerge:!0,isTimestamp:!0},[s.Hardfork.ShardingForkDev]:{name:"shardingForkTime",postMerge:!0,isTimestamp:!0}},A=Object.keys(_).reduce(((e,t)=>(e[_[t].name]=t,e)),{}),T=Object.keys(u).filter((e=>void 0!==A[e]&&void 0!==u[e]&&null!==u[e]));if(E.hardforks=T.map((e=>({name:A[e],block:!0===_[A[e]].isTimestamp||"number"!=typeof u[e]?null:u[e],timestamp:!0===_[A[e]].isTimestamp&&"number"==typeof u[e]?u[e]:void 0}))).filter((e=>null!==e.block||void 0!==e.timestamp)),E.hardforks.sort(((e,t)=>{var r,n;return(null!==(r=e.block)&&void 0!==r?r:1/0)-(null!==(n=t.block)&&void 0!==n?n:1/0)})),E.hardforks.sort(((e,t)=>{var r,n;return(null!==(r=e.timestamp)&&void 0!==r?r:v)-(null!==(n=t.timestamp)&&void 0!==n?n:v)})),void 0!==u.terminalTotalDifficulty){const e={name:s.Hardfork.Merge,ttd:u.terminalTotalDifficulty,block:null},t=E.hardforks.findIndex((e=>{var t;return!0===(null===(t=_[e.name])||void 0===t?void 0:t.postMerge)}));-1!==t?E.hardforks.splice(t,0,e):E.hardforks.push(e)}const w=E.hardforks.length>0?E.hardforks.slice(-1)[0]:void 0;return E.hardfork=null==w?void 0:w.name,E.hardforks.unshift({name:s.Hardfork.Chainstart,block:0}),E}(e,o)}catch(e){throw new Error(`Error parsing parameters file: ${e.message}`)}},t.padToEven=u,t.intToUint8Array=function(e){const t=c(e);return(0,o.hexToBytes)(`0x${u(t.slice(2))}`)},t.toUint8Array=function(e){var r;if(null==e)return new Uint8Array;if(e instanceof Uint8Array)return e;if("Uint8Array"===(null===(r=null==e?void 0:e.constructor)||void 0===r?void 0:r.name))return Uint8Array.from(e);if(Array.isArray(e))return Uint8Array.from(e);if("string"==typeof e){if(!(0,n.isHexString)(e))throw new Error(`Cannot convert string to Uint8Array. only supports 0x-prefixed hex strings and this string was given: ${e}`);return(0,o.hexToBytes)(u((0,t.stripHexPrefix)(e)))}if("number"==typeof e)return(0,t.toUint8Array)((0,o.numberToHex)(e));if("bigint"==typeof e){if(e<BigInt(0))throw new Error(`Cannot convert negative bigint to Uint8Array. Given: ${e}`);let r=e.toString(16);return r.length%2&&(r=`0${r}`),(0,t.toUint8Array)(`0x${r}`)}if(e.toArray)return Uint8Array.from(e.toArray());throw new Error("invalid type")},t.uint8ArrayToBigInt=d,t.bigIntToUint8Array=l,t.zeros=function(e){return new Uint8Array(e).fill(0)},t.assertIsUint8Array=h,t.setLengthLeft=function(e,r){return h(e),function(e,r,n){const o=(0,t.zeros)(r);return e.length<r?(o.set(e,r-e.length),o):e.subarray(-r)}(e,r)},t.stripZeros=f,t.unpadUint8Array=function(e){return h(e),f(e)},t.bigIntToHex=e=>`0x${e.toString(16)}`,t.bigIntToUnpaddedUint8Array=function(e){return(0,t.unpadUint8Array)(l(e))},t.ecrecover=function(e,t,r,n,o){const s=function(e,t){return e===BigInt(0)||e===BigInt(1)?e:void 0===t?e-BigInt(27):e-(t*BigInt(2)+BigInt(35))}(t,o);if(!function(e){return e===BigInt(0)||e===BigInt(1)}(s))throw new Error("Invalid signature v value");return new i.secp256k1.Signature(d(r),d(n)).addRecoveryBit(Number(s)).recoverPublicKey(e).toRawBytes(!1).slice(1)},t.toType=function(e,r){if(null===e)return null;if(void 0===e)return;if("string"==typeof e&&!(0,n.isHexString)(e))throw new Error(`A string must be provided with a 0x-prefix, given: ${e}`);if("number"==typeof e&&!Number.isSafeInteger(e))throw new Error("The provided number is greater than MAX_SAFE_INTEGER (please use an alternative input type)");const i=(0,t.toUint8Array)(e);switch(r){case a.TypeOutput.Uint8Array:return i;case a.TypeOutput.BigInt:return d(i);case a.TypeOutput.Number:{const e=d(i);if(e>BigInt(Number.MAX_SAFE_INTEGER))throw new Error("The provided number is greater than MAX_SAFE_INTEGER (please use an alternative output type)");return Number(e)}case a.TypeOutput.PrefixedHexString:return(0,o.bytesToHex)(i);default:throw new Error("unknown outputType")}}},9247:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r);var o=Object.getOwnPropertyDescriptor(t,r);o&&!("get"in o?!t.__esModule:o.writable||o.configurable)||(o={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,o)}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),o=this&&this.__exportStar||function(e,t){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(t,r)||n(t,e,r)};Object.defineProperty(t,"__esModule",{value:!0}),o(r(8632),t),o(r(1560),t),o(r(4874),t),o(r(5774),t),o(r(8317),t),o(r(9275),t)},5774:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.keyStoreSchema=void 0,t.keyStoreSchema={type:"object",required:["crypto","id","version","address"],properties:{crypto:{type:"object",required:["cipher","ciphertext","cipherparams","kdf","kdfparams","mac"],properties:{cipher:{type:"string"},ciphertext:{type:"string"},cipherparams:{type:"object"},kdf:{type:"string"},kdfparams:{type:"object"},salt:{type:"string"},mac:{type:"string"}}},id:{type:"string"},version:{type:"number"},address:{type:"string"}}}},7592:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.Address=void 0;const n=r(7423),o=r(9634),i=r(4555),s=r(2290);class a{constructor(e){if(20!==e.length)throw new Error("Invalid address length");this.buf=e}static zero(){return new a((0,s.zeros)(20))}equals(e){return(0,o.uint8ArrayEquals)(this.buf,e.buf)}isZero(){return this.equals(a.zero())}toString(){return(0,o.bytesToHex)(this.buf)}toArray(){return this.buf}static publicToAddress(e,t=!1){let r=e;if((0,s.assertIsUint8Array)(r),t&&64!==r.length&&(r=i.secp256k1.ProjectivePoint.fromHex(r).toRawBytes(!1).slice(1)),64!==r.length)throw new Error("Expected pubKey to be of length 64");return(0,n.keccak256)(r).slice(-20)}}t.Address=a},915:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.BaseTransaction=void 0;const n=r(9634),o=r(4555),i=r(2290),s=r(6664),a=r(4443),c=r(9964),u=r(7592),d=r(4562);t.BaseTransaction=class{constructor(e,t){var r,n;this.cache={hash:void 0,dataFee:void 0},this.activeCapabilities=[],this.DEFAULT_CHAIN=a.Chain.Mainnet,this.DEFAULT_HARDFORK=a.Hardfork.Merge;const{nonce:o,gasLimit:s,to:c,value:l,data:h,v:f,r:p,s:m,type:g}=e;this._type=Number((0,i.uint8ArrayToBigInt)((0,i.toUint8Array)(g))),this.txOptions=t;const y=(0,i.toUint8Array)(""===c?"0x":c),v=(0,i.toUint8Array)(""===f?"0x":f),b=(0,i.toUint8Array)(""===p?"0x":p),E=(0,i.toUint8Array)(""===m?"0x":m);this.nonce=(0,i.uint8ArrayToBigInt)((0,i.toUint8Array)(""===o?"0x":o)),this.gasLimit=(0,i.uint8ArrayToBigInt)((0,i.toUint8Array)(""===s?"0x":s)),this.to=y.length>0?new u.Address(y):void 0,this.value=(0,i.uint8ArrayToBigInt)((0,i.toUint8Array)(""===l?"0x":l)),this.data=(0,i.toUint8Array)(""===h?"0x":h),this.v=v.length>0?(0,i.uint8ArrayToBigInt)(v):void 0,this.r=b.length>0?(0,i.uint8ArrayToBigInt)(b):void 0,this.s=E.length>0?(0,i.uint8ArrayToBigInt)(E):void 0,this._validateCannotExceedMaxInteger({value:this.value,r:this.r,s:this.s}),this._validateCannotExceedMaxInteger({gasLimit:this.gasLimit},64),this._validateCannotExceedMaxInteger({nonce:this.nonce},64,!0);const _=void 0===this.to||null===this.to,A=null!==(r=t.allowUnlimitedInitCodeSize)&&void 0!==r&&r,T=null!==(n=t.common)&&void 0!==n?n:this._getCommon();_&&T.isActivatedEIP(3860)&&!A&&(0,d.checkMaxInitCodeSize)(T,this.data.length)}get type(){return this._type}supports(e){return this.activeCapabilities.includes(e)}validate(e=!1){const t=[];return this.getBaseFee()>this.gasLimit&&t.push(`gasLimit is too low. given ${this.gasLimit}, need at least ${this.getBaseFee()}`),this.isSigned()&&!this.verifySignature()&&t.push("Invalid Signature"),e?t:0===t.length}_validateYParity(){const{v:e}=this;if(void 0!==e&&e!==BigInt(0)&&e!==BigInt(1)){const e=this._errorMsg("The y-parity of the transaction should either be 0 or 1");throw new Error(e)}}_validateHighS(){const{s:e}=this;if(this.common.gteHardfork("homestead")&&void 0!==e&&e>o.SECP256K1_ORDER_DIV_2){const e=this._errorMsg("Invalid Signature: s-values greater than secp256k1n/2 are considered invalid");throw new Error(e)}}getBaseFee(){const e=this.common.param("gasPrices","tx");let t=this.getDataFee();if(e&&(t+=e),this.common.gteHardfork("homestead")&&this.toCreationAddress()){const e=this.common.param("gasPrices","txCreation");e&&(t+=e)}return t}getDataFee(){const e=this.common.param("gasPrices","txDataZero"),t=this.common.param("gasPrices","txDataNonZero");let r=BigInt(0);for(let n=0;n<this.data.length;n+=1)0===this.data[n]?r+=e:r+=t;if((void 0===this.to||null===this.to)&&this.common.isActivatedEIP(3860)){const e=BigInt(Math.ceil(this.data.length/32));r+=this.common.param("gasPrices","initCodeWordCost")*e}return r}toCreationAddress(){return void 0===this.to||0===this.to.buf.length}isSigned(){const{v:e,r:t,s:r}=this;return void 0!==e&&void 0!==t&&void 0!==r}verifySignature(){try{const e=this.getSenderPublicKey();return 0!==(0,i.unpadUint8Array)(e).length}catch(e){return!1}}getSenderAddress(){return new u.Address(u.Address.publicToAddress(this.getSenderPublicKey()))}sign(e){if(32!==e.length){const e=this._errorMsg("Private key must be 32 bytes in length.");throw new Error(e)}let t=!1;0===this.type&&this.common.gteHardfork("spuriousDragon")&&!this.supports(c.Capability.EIP155ReplayProtection)&&(this.activeCapabilities.push(c.Capability.EIP155ReplayProtection),t=!0);const r=this.getMessageToSign(!0),{v:n,r:o,s:i}=this._ecsign(r,e),s=this._processSignature(n,o,i);if(t){const e=this.activeCapabilities.indexOf(c.Capability.EIP155ReplayProtection);e>-1&&this.activeCapabilities.splice(e,1)}return s}_getCommon(e,t){var r,n,o,a;if(void 0!==t){const r=(0,i.uint8ArrayToBigInt)((0,i.toUint8Array)(t));if(e){if(e.chainId()!==r){const e=this._errorMsg("The chain ID does not match the chain ID of Common");throw new Error(e)}return e.copy()}return s.Common.isSupportedChainId(r)?new s.Common({chain:r,hardfork:this.DEFAULT_HARDFORK}):s.Common.custom({name:"custom-chain",networkId:r,chainId:r},{baseChain:this.DEFAULT_CHAIN,hardfork:this.DEFAULT_HARDFORK})}if((null==e?void 0:e.copy)&&"function"==typeof(null==e?void 0:e.copy))return e.copy();if(e){const t="function"==typeof e.hardfork?e.hardfork():e.hardfork;return s.Common.custom({name:"custom-chain",networkId:e.networkId?e.networkId():null!==(n=BigInt(null===(r=e.customChain)||void 0===r?void 0:r.networkId))&&void 0!==n?n:void 0,chainId:e.chainId?e.chainId():null!==(a=BigInt(null===(o=e.customChain)||void 0===o?void 0:o.chainId))&&void 0!==a?a:void 0},{baseChain:this.DEFAULT_CHAIN,hardfork:t||this.DEFAULT_HARDFORK})}return new s.Common({chain:this.DEFAULT_CHAIN,hardfork:this.DEFAULT_HARDFORK})}_validateCannotExceedMaxInteger(e,t=256,r=!1){for(const[n,i]of Object.entries(e))switch(t){case 64:if(r){if(void 0!==i&&i>=o.MAX_UINT64){const e=this._errorMsg(`${n} cannot equal or exceed MAX_UINT64 (2^64-1), given ${i}`);throw new Error(e)}}else if(void 0!==i&&i>o.MAX_UINT64){const e=this._errorMsg(`${n} cannot exceed MAX_UINT64 (2^64-1), given ${i}`);throw new Error(e)}break;case 256:if(r){if(void 0!==i&&i>=o.MAX_INTEGER){const e=this._errorMsg(`${n} cannot equal or exceed MAX_INTEGER (2^256-1), given ${i}`);throw new Error(e)}}else if(void 0!==i&&i>o.MAX_INTEGER){const e=this._errorMsg(`${n} cannot exceed MAX_INTEGER (2^256-1), given ${i}`);throw new Error(e)}break;default:{const e=this._errorMsg("unimplemented bits value");throw new Error(e)}}}static _validateNotArray(e){const t=["nonce","gasPrice","gasLimit","to","value","data","v","r","s","type","baseFee","maxFeePerGas","chainId"];for(const[r,n]of Object.entries(e))if(t.includes(r)&&Array.isArray(n))throw new Error(`${r} cannot be an array`)}_getSharedErrorPostfix(){let e="";try{e=this.isSigned()?(0,n.bytesToHex)(this.hash()):"not available (unsigned)"}catch(t){e="error"}let t="";try{t=this.isSigned().toString()}catch(t){e="error"}let r="";try{r=this.common.hardfork()}catch(e){r="error"}let o=`tx type=${this.type} hash=${e} nonce=${this.nonce} value=${this.value} `;return o+=`signed=${t} hf=${r}`,o}_ecsign(e,t,r){const n=o.secp256k1.sign(e,t),i=n.toCompactRawBytes();return{r:i.subarray(0,32),s:i.subarray(32,64),v:void 0===r?BigInt(n.recovery+27):BigInt(n.recovery+35)+BigInt(r)*BigInt(2)}}static fromSerializedTx(e,t={}){}static fromTxData(e,t={}){}}},4555:function(e,t,r){"use strict";var n,o=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r);var o=Object.getOwnPropertyDescriptor(t,r);o&&!("get"in o?!t.__esModule:o.writable||o.configurable)||(o={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,o)}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),i=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),s=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var r in e)"default"!==r&&Object.prototype.hasOwnProperty.call(e,r)&&o(t,e,r);return i(t,e),t};Object.defineProperty(t,"__esModule",{value:!0}),t.SECP256K1_ORDER_DIV_2=t.SECP256K1_ORDER=t.MAX_INTEGER=t.MAX_UINT64=t.secp256k1=void 0;const a=s(r(5473));t.secp256k1=null!==(n=a.secp256k1)&&void 0!==n?n:a,t.MAX_UINT64=BigInt("0xffffffffffffffff"),t.MAX_INTEGER=BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"),t.SECP256K1_ORDER=t.secp256k1.CURVE.n,t.SECP256K1_ORDER_DIV_2=t.SECP256K1_ORDER/BigInt(2)},6135:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.FeeMarketEIP1559Transaction=void 0;const n=r(7423),o=r(7345),i=r(7256),s=r(9634),a=r(4555),c=r(915),u=r(4562),d=r(2290),l=(0,s.hexToBytes)(2..toString(16).padStart(2,"0"));class h extends c.BaseTransaction{constructor(e,t={}){var r;super(Object.assign(Object.assign({},e),{type:2}),t),this.DEFAULT_HARDFORK="london";const{chainId:n,accessList:o,maxFeePerGas:i,maxPriorityFeePerGas:s}=e;if(this.common=this._getCommon(t.common,n),this.chainId=this.common.chainId(),!this.common.isActivatedEIP(1559))throw new Error("EIP-1559 not enabled on Common");this.activeCapabilities=this.activeCapabilities.concat([1559,2718,2930]);const l=(0,u.getAccessListData)(null!=o?o:[]);if(this.accessList=l.accessList,this.AccessListJSON=l.AccessListJSON,(0,u.verifyAccessList)(this.accessList),this.maxFeePerGas=(0,d.uint8ArrayToBigInt)((0,d.toUint8Array)(""===i?"0x":i)),this.maxPriorityFeePerGas=(0,d.uint8ArrayToBigInt)((0,d.toUint8Array)(""===s?"0x":s)),this._validateCannotExceedMaxInteger({maxFeePerGas:this.maxFeePerGas,maxPriorityFeePerGas:this.maxPriorityFeePerGas}),c.BaseTransaction._validateNotArray(e),this.gasLimit*this.maxFeePerGas>a.MAX_INTEGER){const e=this._errorMsg("gasLimit * maxFeePerGas cannot exceed MAX_INTEGER (2^256-1)");throw new Error(e)}if(this.maxFeePerGas<this.maxPriorityFeePerGas){const e=this._errorMsg("maxFeePerGas cannot be less than maxPriorityFeePerGas (The total must be the larger of the two)");throw new Error(e)}this._validateYParity(),this._validateHighS(),(null===(r=null==t?void 0:t.freeze)||void 0===r||r)&&Object.freeze(this)}static fromTxData(e,t={}){return new h(e,t)}static fromSerializedTx(e,t={}){if(!(0,s.uint8ArrayEquals)(e.subarray(0,1),l))throw new Error(`Invalid serialized tx input: not an EIP-1559 transaction (wrong tx type, expected: 2, received: ${(0,s.bytesToHex)(e.subarray(0,1))}`);const r=i.RLP.decode(e.subarray(1));if(!Array.isArray(r))throw new Error("Invalid serialized tx input: must be array");return h.fromValuesArray(r,t)}static fromValuesArray(e,t={}){if(9!==e.length&&12!==e.length)throw new Error("Invalid EIP-1559 transaction. Only expecting 9 values (for unsigned tx) or 12 values (for signed tx).");const[r,n,i,s,a,c,u,l,f,p,m,g]=e;return this._validateNotArray({chainId:r,v:p}),(0,o.validateNoLeadingZeroes)({nonce:n,maxPriorityFeePerGas:i,maxFeePerGas:s,gasLimit:a,value:u,v:p,r:m,s:g}),new h({chainId:(0,d.uint8ArrayToBigInt)(r),nonce:n,maxPriorityFeePerGas:i,maxFeePerGas:s,gasLimit:a,to:c,value:u,data:l,accessList:null!=f?f:[],v:void 0!==p?(0,d.uint8ArrayToBigInt)(p):void 0,r:m,s:g},t)}getDataFee(){if(this.cache.dataFee&&this.cache.dataFee.hardfork===this.common.hardfork())return this.cache.dataFee.value;let e=super.getDataFee();return e+=BigInt((0,u.getDataFeeEIP2930)(this.accessList,this.common)),Object.isFrozen(this)&&(this.cache.dataFee={value:e,hardfork:this.common.hardfork()}),e}getUpfrontCost(e=BigInt(0)){const t=this.maxPriorityFeePerGas,r=this.maxFeePerGas-e,n=(t<r?t:r)+e;return this.gasLimit*n+this.value}raw(){return[(0,d.bigIntToUnpaddedUint8Array)(this.chainId),(0,d.bigIntToUnpaddedUint8Array)(this.nonce),(0,d.bigIntToUnpaddedUint8Array)(this.maxPriorityFeePerGas),(0,d.bigIntToUnpaddedUint8Array)(this.maxFeePerGas),(0,d.bigIntToUnpaddedUint8Array)(this.gasLimit),void 0!==this.to?this.to.buf:Uint8Array.from([]),(0,d.bigIntToUnpaddedUint8Array)(this.value),this.data,this.accessList,void 0!==this.v?(0,d.bigIntToUnpaddedUint8Array)(this.v):Uint8Array.from([]),void 0!==this.r?(0,d.bigIntToUnpaddedUint8Array)(this.r):Uint8Array.from([]),void 0!==this.s?(0,d.bigIntToUnpaddedUint8Array)(this.s):Uint8Array.from([])]}serialize(){const e=this.raw();return(0,s.uint8ArrayConcat)(l,i.RLP.encode(e))}getMessageToSign(e=!0){const t=this.raw().slice(0,9),r=(0,s.uint8ArrayConcat)(l,i.RLP.encode(t));return e?(0,n.keccak256)(r):r}hash(){if(!this.isSigned()){const e=this._errorMsg("Cannot call hash method if transaction is not signed");throw new Error(e)}return Object.isFrozen(this)?(this.cache.hash||(this.cache.hash=(0,n.keccak256)(this.serialize())),this.cache.hash):(0,n.keccak256)(this.serialize())}getMessageToVerifySignature(){return this.getMessageToSign()}getSenderPublicKey(){if(!this.isSigned()){const e=this._errorMsg("Cannot call this method if transaction is not signed");throw new Error(e)}const e=this.getMessageToVerifySignature(),{v:t,r,s:n}=this;this._validateHighS();try{return(0,d.ecrecover)(e,t+BigInt(27),(0,d.bigIntToUnpaddedUint8Array)(r),(0,d.bigIntToUnpaddedUint8Array)(n))}catch(e){const t=this._errorMsg("Invalid Signature");throw new Error(t)}}_processSignature(e,t,r){const n=Object.assign(Object.assign({},this.txOptions),{common:this.common});return h.fromTxData({chainId:this.chainId,nonce:this.nonce,maxPriorityFeePerGas:this.maxPriorityFeePerGas,maxFeePerGas:this.maxFeePerGas,gasLimit:this.gasLimit,to:this.to,value:this.value,data:this.data,accessList:this.accessList,v:e-BigInt(27),r:(0,d.uint8ArrayToBigInt)(t),s:(0,d.uint8ArrayToBigInt)(r)},n)}toJSON(){const e=(0,u.getAccessListJSON)(this.accessList);return{chainId:(0,d.bigIntToHex)(this.chainId),nonce:(0,d.bigIntToHex)(this.nonce),maxPriorityFeePerGas:(0,d.bigIntToHex)(this.maxPriorityFeePerGas),maxFeePerGas:(0,d.bigIntToHex)(this.maxFeePerGas),gasLimit:(0,d.bigIntToHex)(this.gasLimit),to:void 0!==this.to?this.to.toString():void 0,value:(0,d.bigIntToHex)(this.value),data:(0,s.bytesToHex)(this.data),accessList:e,v:void 0!==this.v?(0,d.bigIntToHex)(this.v):void 0,r:void 0!==this.r?(0,d.bigIntToHex)(this.r):void 0,s:void 0!==this.s?(0,d.bigIntToHex)(this.s):void 0}}errorStr(){let e=this._getSharedErrorPostfix();return e+=` maxFeePerGas=${this.maxFeePerGas} maxPriorityFeePerGas=${this.maxPriorityFeePerGas}`,e}_errorMsg(e){return`${e} (${this.errorStr()})`}}t.FeeMarketEIP1559Transaction=h},9013:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.AccessListEIP2930Transaction=void 0;const n=r(7423),o=r(7345),i=r(7256),s=r(9634),a=r(4555),c=r(4562),u=r(2290),d=r(915),l=(0,s.hexToBytes)(1..toString(16).padStart(2,"0"));class h extends d.BaseTransaction{constructor(e,t={}){var r;super(Object.assign(Object.assign({},e),{type:1}),t),this.DEFAULT_HARDFORK="berlin";const{chainId:n,accessList:o,gasPrice:i}=e;if(this.common=this._getCommon(t.common,n),this.chainId=this.common.chainId(),!this.common.isActivatedEIP(2930))throw new Error("EIP-2930 not enabled on Common");this.activeCapabilities=this.activeCapabilities.concat([2718,2930]);const s=(0,c.getAccessListData)(null!=o?o:[]);if(this.accessList=s.accessList,this.AccessListJSON=s.AccessListJSON,(0,c.verifyAccessList)(this.accessList),this.gasPrice=(0,u.uint8ArrayToBigInt)((0,u.toUint8Array)(""===i?"0x":i)),this._validateCannotExceedMaxInteger({gasPrice:this.gasPrice}),d.BaseTransaction._validateNotArray(e),this.gasPrice*this.gasLimit>a.MAX_INTEGER){const e=this._errorMsg("gasLimit * gasPrice cannot exceed MAX_INTEGER");throw new Error(e)}this._validateYParity(),this._validateHighS(),(null===(r=null==t?void 0:t.freeze)||void 0===r||r)&&Object.freeze(this)}static fromTxData(e,t={}){return new h(e,t)}static fromSerializedTx(e,t={}){if(!(0,s.uint8ArrayEquals)(e.subarray(0,1),l))throw new Error(`Invalid serialized tx input: not an EIP-2930 transaction (wrong tx type, expected: 1, received: ${(0,s.bytesToHex)(e.subarray(0,1))}`);const r=i.RLP.decode(Uint8Array.from(e.subarray(1)));if(!Array.isArray(r))throw new Error("Invalid serialized tx input: must be array");return h.fromValuesArray(r,t)}static fromValuesArray(e,t={}){if(8!==e.length&&11!==e.length)throw new Error("Invalid EIP-2930 transaction. Only expecting 8 values (for unsigned tx) or 11 values (for signed tx).");const[r,n,i,s,a,c,d,l,f,p,m]=e;return this._validateNotArray({chainId:r,v:f}),(0,o.validateNoLeadingZeroes)({nonce:n,gasPrice:i,gasLimit:s,value:c,v:f,r:p,s:m}),new h({chainId:(0,u.uint8ArrayToBigInt)(r),nonce:n,gasPrice:i,gasLimit:s,to:a,value:c,data:d,accessList:null!=l?l:[],v:void 0!==f?(0,u.uint8ArrayToBigInt)(f):void 0,r:p,s:m},t)}getDataFee(){if(this.cache.dataFee&&this.cache.dataFee.hardfork===this.common.hardfork())return this.cache.dataFee.value;let e=super.getDataFee();return e+=BigInt((0,c.getDataFeeEIP2930)(this.accessList,this.common)),Object.isFrozen(this)&&(this.cache.dataFee={value:e,hardfork:this.common.hardfork()}),e}getUpfrontCost(){return this.gasLimit*this.gasPrice+this.value}raw(){return[(0,u.bigIntToUnpaddedUint8Array)(this.chainId),(0,u.bigIntToUnpaddedUint8Array)(this.nonce),(0,u.bigIntToUnpaddedUint8Array)(this.gasPrice),(0,u.bigIntToUnpaddedUint8Array)(this.gasLimit),void 0!==this.to?this.to.buf:Uint8Array.from([]),(0,u.bigIntToUnpaddedUint8Array)(this.value),this.data,this.accessList,void 0!==this.v?(0,u.bigIntToUnpaddedUint8Array)(this.v):Uint8Array.from([]),void 0!==this.r?(0,u.bigIntToUnpaddedUint8Array)(this.r):Uint8Array.from([]),void 0!==this.s?(0,u.bigIntToUnpaddedUint8Array)(this.s):Uint8Array.from([])]}serialize(){const e=this.raw();return(0,s.uint8ArrayConcat)(l,i.RLP.encode(e))}getMessageToSign(e=!0){const t=this.raw().slice(0,8),r=(0,s.uint8ArrayConcat)(l,i.RLP.encode(t));return e?(0,n.keccak256)(r):r}hash(){if(!this.isSigned()){const e=this._errorMsg("Cannot call hash method if transaction is not signed");throw new Error(e)}return Object.isFrozen(this)?(this.cache.hash||(this.cache.hash=(0,n.keccak256)(this.serialize())),this.cache.hash):(0,n.keccak256)(this.serialize())}getMessageToVerifySignature(){return this.getMessageToSign()}getSenderPublicKey(){if(!this.isSigned()){const e=this._errorMsg("Cannot call this method if transaction is not signed");throw new Error(e)}const e=this.getMessageToVerifySignature(),{v:t,r,s:n}=this;this._validateHighS();try{return(0,u.ecrecover)(e,t+BigInt(27),(0,u.bigIntToUnpaddedUint8Array)(r),(0,u.bigIntToUnpaddedUint8Array)(n))}catch(e){const t=this._errorMsg("Invalid Signature");throw new Error(t)}}_processSignature(e,t,r){const n=Object.assign(Object.assign({},this.txOptions),{common:this.common});return h.fromTxData({chainId:this.chainId,nonce:this.nonce,gasPrice:this.gasPrice,gasLimit:this.gasLimit,to:this.to,value:this.value,data:this.data,accessList:this.accessList,v:e-BigInt(27),r:(0,u.uint8ArrayToBigInt)(t),s:(0,u.uint8ArrayToBigInt)(r)},n)}toJSON(){const e=(0,c.getAccessListJSON)(this.accessList);return{chainId:(0,u.bigIntToHex)(this.chainId),nonce:(0,u.bigIntToHex)(this.nonce),gasPrice:(0,u.bigIntToHex)(this.gasPrice),gasLimit:(0,u.bigIntToHex)(this.gasLimit),to:void 0!==this.to?this.to.toString():void 0,value:(0,u.bigIntToHex)(this.value),data:(0,s.bytesToHex)(this.data),accessList:e,v:void 0!==this.v?(0,u.bigIntToHex)(this.v):void 0,r:void 0!==this.r?(0,u.bigIntToHex)(this.r):void 0,s:void 0!==this.s?(0,u.bigIntToHex)(this.s):void 0}}errorStr(){var e,t;let r=this._getSharedErrorPostfix();return r+=` gasPrice=${this.gasPrice} accessListCount=${null!==(t=null===(e=this.accessList)||void 0===e?void 0:e.length)&&void 0!==t?t:0}`,r}_errorMsg(e){return`${e} (${this.errorStr()})`}}t.AccessListEIP2930Transaction=h},9275:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r);var o=Object.getOwnPropertyDescriptor(t,r);o&&!("get"in o?!t.__esModule:o.writable||o.configurable)||(o={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,o)}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),o=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),i=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var r in e)"default"!==r&&Object.prototype.hasOwnProperty.call(e,r)&&n(t,e,r);return o(t,e),t},s=this&&this.__exportStar||function(e,t){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(t,r)||n(t,e,r)};Object.defineProperty(t,"__esModule",{value:!0}),t.txUtils=t.BaseTransaction=t.TransactionFactory=t.Transaction=t.AccessListEIP2930Transaction=t.FeeMarketEIP1559Transaction=void 0;var a=r(6135);Object.defineProperty(t,"FeeMarketEIP1559Transaction",{enumerable:!0,get:function(){return a.FeeMarketEIP1559Transaction}});var c=r(9013);Object.defineProperty(t,"AccessListEIP2930Transaction",{enumerable:!0,get:function(){return c.AccessListEIP2930Transaction}});var u=r(5381);Object.defineProperty(t,"Transaction",{enumerable:!0,get:function(){return u.Transaction}});var d=r(7668);Object.defineProperty(t,"TransactionFactory",{enumerable:!0,get:function(){return d.TransactionFactory}});var l=r(915);Object.defineProperty(t,"BaseTransaction",{enumerable:!0,get:function(){return l.BaseTransaction}}),t.txUtils=i(r(4562)),s(r(9964),t)},5381:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.Transaction=void 0;const n=r(7256),o=r(7423),i=r(9634),s=r(7345),a=r(2290),c=r(4555),u=r(915),d=r(9964);function l(e,t){const r=Number(e),n=2*Number(t);return r===n+35||r===n+36}class h extends u.BaseTransaction{constructor(e,t={}){var r;if(super(Object.assign(Object.assign({},e),{type:0}),t),this.common=this._validateTxV(this.v,t.common),this.gasPrice=(0,a.uint8ArrayToBigInt)((0,a.toUint8Array)(""===e.gasPrice?"0x":e.gasPrice)),this.gasPrice*this.gasLimit>c.MAX_INTEGER){const e=this._errorMsg("gas limit * gasPrice cannot exceed MAX_INTEGER (2^256-1)");throw new Error(e)}this._validateCannotExceedMaxInteger({gasPrice:this.gasPrice}),u.BaseTransaction._validateNotArray(e),this.common.gteHardfork("spuriousDragon")&&(this.isSigned()?l(this.v,this.common.chainId())&&this.activeCapabilities.push(d.Capability.EIP155ReplayProtection):this.activeCapabilities.push(d.Capability.EIP155ReplayProtection)),(null===(r=null==t?void 0:t.freeze)||void 0===r||r)&&Object.freeze(this)}static fromTxData(e,t={}){return new h(e,t)}static fromSerializedTx(e,t={}){const r=n.RLP.decode(e);if(!Array.isArray(r))throw new Error("Invalid serialized tx input. Must be array");return this.fromValuesArray(r,t)}static fromValuesArray(e,t={}){if(6!==e.length&&9!==e.length)throw new Error("Invalid transaction. Only expecting 6 values (for unsigned tx) or 9 values (for signed tx).");const[r,n,o,i,a,c,u,d,l]=e;return(0,s.validateNoLeadingZeroes)({nonce:r,gasPrice:n,gasLimit:o,value:a,v:u,r:d,s:l}),new h({nonce:r,gasPrice:n,gasLimit:o,to:i,value:a,data:c,v:u,r:d,s:l},t)}raw(){return[(0,a.bigIntToUnpaddedUint8Array)(this.nonce),(0,a.bigIntToUnpaddedUint8Array)(this.gasPrice),(0,a.bigIntToUnpaddedUint8Array)(this.gasLimit),void 0!==this.to?this.to.buf:Uint8Array.from([]),(0,a.bigIntToUnpaddedUint8Array)(this.value),this.data,void 0!==this.v?(0,a.bigIntToUnpaddedUint8Array)(this.v):Uint8Array.from([]),void 0!==this.r?(0,a.bigIntToUnpaddedUint8Array)(this.r):Uint8Array.from([]),void 0!==this.s?(0,a.bigIntToUnpaddedUint8Array)(this.s):Uint8Array.from([])]}serialize(){return n.RLP.encode(this.raw())}_getMessageToSign(){const e=[(0,a.bigIntToUnpaddedUint8Array)(this.nonce),(0,a.bigIntToUnpaddedUint8Array)(this.gasPrice),(0,a.bigIntToUnpaddedUint8Array)(this.gasLimit),void 0!==this.to?this.to.buf:Uint8Array.from([]),(0,a.bigIntToUnpaddedUint8Array)(this.value),this.data];return this.supports(d.Capability.EIP155ReplayProtection)&&(e.push((0,a.toUint8Array)(this.common.chainId())),e.push((0,a.unpadUint8Array)((0,a.toUint8Array)(0))),e.push((0,a.unpadUint8Array)((0,a.toUint8Array)(0)))),e}getMessageToSign(e=!0){const t=this._getMessageToSign();return e?(0,o.keccak256)(n.RLP.encode(t)):t}getDataFee(){return this.cache.dataFee&&this.cache.dataFee.hardfork===this.common.hardfork()?this.cache.dataFee.value:(Object.isFrozen(this)&&(this.cache.dataFee={value:super.getDataFee(),hardfork:this.common.hardfork()}),super.getDataFee())}getUpfrontCost(){return this.gasLimit*this.gasPrice+this.value}hash(){if(!this.isSigned()){const e=this._errorMsg("Cannot call hash method if transaction is not signed");throw new Error(e)}return Object.isFrozen(this)?(this.cache.hash||(this.cache.hash=(0,o.keccak256)(n.RLP.encode(this.raw()))),this.cache.hash):(0,o.keccak256)(n.RLP.encode(this.raw()))}getMessageToVerifySignature(){if(!this.isSigned()){const e=this._errorMsg("This transaction is not signed");throw new Error(e)}const e=this._getMessageToSign();return(0,o.keccak256)(n.RLP.encode(e))}getSenderPublicKey(){const e=this.getMessageToVerifySignature(),{v:t,r,s:n}=this;this._validateHighS();try{return(0,a.ecrecover)(e,t,(0,a.bigIntToUnpaddedUint8Array)(r),(0,a.bigIntToUnpaddedUint8Array)(n),this.supports(d.Capability.EIP155ReplayProtection)?this.common.chainId():void 0)}catch(e){const t=this._errorMsg("Invalid Signature");throw new Error(t)}}_processSignature(e,t,r){let n=e;this.supports(d.Capability.EIP155ReplayProtection)&&(n+=this.common.chainId()*BigInt(2)+BigInt(8));const o=Object.assign(Object.assign({},this.txOptions),{common:this.common});return h.fromTxData({nonce:this.nonce,gasPrice:this.gasPrice,gasLimit:this.gasLimit,to:this.to,value:this.value,data:this.data,v:n,r:(0,a.uint8ArrayToBigInt)(t),s:(0,a.uint8ArrayToBigInt)(r)},o)}toJSON(){return{nonce:(0,a.bigIntToHex)(this.nonce),gasPrice:(0,a.bigIntToHex)(this.gasPrice),gasLimit:(0,a.bigIntToHex)(this.gasLimit),to:void 0!==this.to?this.to.toString():void 0,value:(0,a.bigIntToHex)(this.value),data:(0,i.bytesToHex)(this.data),v:void 0!==this.v?(0,a.bigIntToHex)(this.v):void 0,r:void 0!==this.r?(0,a.bigIntToHex)(this.r):void 0,s:void 0!==this.s?(0,a.bigIntToHex)(this.s):void 0}}_validateTxV(e,t){let r;const n=void 0!==e?Number(e):void 0;if(void 0!==n&&n<37&&27!==n&&28!==n)throw new Error(`Legacy txs need either v = 27/28 or v >= 37 (EIP-155 replay protection), got v = ${n}`);if(void 0!==n&&0!==n&&(!t||t.gteHardfork("spuriousDragon"))&&27!==n&&28!==n)if(t){if(!l(BigInt(n),t.chainId()))throw new Error(`Incompatible EIP155-based V ${n} and chain id ${t.chainId()}. See the Common parameter of the Transaction constructor to set the chain id.`)}else{let e;e=(n-35)%2==0?35:36,r=BigInt(n-e)/BigInt(2)}return this._getCommon(t,r)}errorStr(){let e=this._getSharedErrorPostfix();return e+=` gasPrice=${this.gasPrice}`,e}_errorMsg(e){return`${e} (${this.errorStr()})`}}t.Transaction=h},7668:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.TransactionFactory=void 0;const n=r(9634),o=r(2290),i=r(6135),s=r(9013),a=r(5381),c=new Map;class u{constructor(){}static typeToInt(e){return Number((0,o.uint8ArrayToBigInt)((0,o.toUint8Array)(e)))}static registerTransactionType(e,t){const r=u.typeToInt(e);c.set(r,t)}static fromTxData(e,t={}){if(!("type"in e)||void 0===e.type)return a.Transaction.fromTxData(e,t);const r=u.typeToInt(e.type);if(0===r)return a.Transaction.fromTxData(e,t);if(1===r)return s.AccessListEIP2930Transaction.fromTxData(e,t);if(2===r)return i.FeeMarketEIP1559Transaction.fromTxData(e,t);const n=c.get(r);if(null==n?void 0:n.fromTxData)return n.fromTxData(e,t);throw new Error(`Tx instantiation with type ${r} not supported`)}static fromSerializedData(e,t={}){if(!(e[0]<=127))return a.Transaction.fromSerializedTx(e,t);switch(e[0]){case 1:return s.AccessListEIP2930Transaction.fromSerializedTx(e,t);case 2:return i.FeeMarketEIP1559Transaction.fromSerializedTx(e,t);default:{const r=c.get(Number(e[0]));if(null==r?void 0:r.fromSerializedTx)return r.fromSerializedTx(e,t);throw new Error(`TypedTransaction with ID ${e[0]} unknown`)}}}static fromBlockBodyData(e,t={}){if((0,n.isUint8Array)(e))return this.fromSerializedData(e,t);if(Array.isArray(e))return a.Transaction.fromValuesArray(e,t);throw new Error("Cannot decode transaction: unknown type input")}}t.TransactionFactory=u},9964:(e,t)=>{"use strict";function r(e){if(0===e.length)return!0;const t=e[0];return!!Array.isArray(t)}var n;Object.defineProperty(t,"__esModule",{value:!0}),t.isAccessList=t.isAccessListUint8Array=t.Capability=void 0,(n=t.Capability||(t.Capability={}))[n.EIP155ReplayProtection=155]="EIP155ReplayProtection",n[n.EIP1559FeeMarket=1559]="EIP1559FeeMarket",n[n.EIP2718TypedTransaction=2718]="EIP2718TypedTransaction",n[n.EIP2930AccessLists=2930]="EIP2930AccessLists",t.isAccessListUint8Array=r,t.isAccessList=function(e){return!r(e)}},4562:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getDataFeeEIP2930=t.getAccessListJSON=t.verifyAccessList=t.getAccessListData=t.checkMaxInitCodeSize=void 0;const n=r(9634),o=r(2290),i=r(9964);t.checkMaxInitCodeSize=(e,t)=>{const r=e.param("vm","maxInitCodeSize");if(r&&BigInt(t)>r)throw new Error(`the initcode size of this transaction is too large: it is ${t} while the max is ${e.param("vm","maxInitCodeSize")}`)},t.getAccessListData=e=>{let t,r;if((0,i.isAccessList)(e)){t=e;const n=[];for(let t=0;t<e.length;t+=1){const r=e[t],i=(0,o.toUint8Array)(r.address),s=[];for(let e=0;e<r.storageKeys.length;e+=1)s.push((0,o.toUint8Array)(r.storageKeys[e]));n.push([i,s])}r=n}else{r=null!=e?e:[];const o=[];for(let e=0;e<r.length;e+=1){const t=r[e],i=(0,n.bytesToHex)(t[0]),s=[];for(let e=0;e<t[1].length;e+=1)s.push((0,n.bytesToHex)(t[1][e]));const a={address:i,storageKeys:s};o.push(a)}t=o}return{AccessListJSON:t,accessList:r}},t.verifyAccessList=e=>{for(let t=0;t<e.length;t+=1){const r=e[t],n=r[0],o=r[1];if(void 0!==r[2])throw new Error("Access list item cannot have 3 elements. It can only have an address, and an array of storage slots.");if(20!==n.length)throw new Error("Invalid EIP-2930 transaction: address length should be 20 bytes");for(let e=0;e<o.length;e+=1)if(32!==o[e].length)throw new Error("Invalid EIP-2930 transaction: storage slot length should be 32 bytes")}},t.getAccessListJSON=e=>{const t=[];for(let r=0;r<e.length;r+=1){const i=e[r],s={address:(0,n.bytesToHex)((0,o.setLengthLeft)(i[0],20)),storageKeys:[]},a=i&&i[1];for(let e=0;e<a.length;e+=1){const t=a[e];s.storageKeys.push((0,n.bytesToHex)((0,o.setLengthLeft)(t,32)))}t.push(s)}return t},t.getDataFeeEIP2930=(e,t)=>{const r=t.param("gasPrices","accessListStorageKeyCost"),n=t.param("gasPrices","accessListAddressCost");let o=0;for(let t=0;t<e.length;t+=1)o+=e[t][1].length;return e.length*Number(n)+o*Number(r)}},4874:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0})},8632:function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.Wallet=void 0;const o=r(9970),i=r(7345);class s extends o.Web3BaseWallet{constructor(){super(...arguments),this._addressMap=new Map,this._defaultKeyName="web3js_wallet"}static getStorage(){let e;try{e=window.localStorage;const t="__storage_test__";return e.setItem(t,t),e.removeItem(t),e}catch(t){return!t||22!==t.code&&1014!==t.code&&"QuotaExceededError"!==t.name&&"NS_ERROR_DOM_QUOTA_REACHED"!==t.name||(0,i.isNullish)(e)||0===e.length?void 0:e}}create(e){for(let t=0;t<e;t+=1)this.add(this._accountProvider.create());return this}add(e){var t;if("string"==typeof e)return this.add(this._accountProvider.privateKeyToAccount(e));let r=this.length;return this.get(e.address)&&(console.warn(`Account ${e.address.toLowerCase()} already exists.`),r=null!==(t=this._addressMap.get(e.address.toLowerCase()))&&void 0!==t?t:r),this._addressMap.set(e.address.toLowerCase(),r),this[r]=e,this}get(e){if("string"==typeof e){const t=this._addressMap.get(e.toLowerCase());return(0,i.isNullish)(t)?void 0:this[t]}return this[e]}remove(e){if("string"==typeof e){const t=this._addressMap.get(e.toLowerCase());return!(0,i.isNullish)(t)&&(this._addressMap.delete(e.toLowerCase()),this.splice(t,1),!0)}return!!this[e]&&(this.splice(e,1),!0)}clear(){return this._addressMap.clear(),this.length=0,this}encrypt(e,t){return n(this,void 0,void 0,(function*(){return Promise.all(this.map((r=>n(this,void 0,void 0,(function*(){return r.encrypt(e,t)})))))}))}decrypt(e,t,r){return n(this,void 0,void 0,(function*(){const o=yield Promise.all(e.map((e=>n(this,void 0,void 0,(function*(){return this._accountProvider.decrypt(e,t,r)})))));for(const e of o)this.add(e);return this}))}save(e,t){return n(this,void 0,void 0,(function*(){const r=s.getStorage();if(!r)throw new Error("Local storage not available.");return r.setItem(null!=t?t:this._defaultKeyName,JSON.stringify(yield this.encrypt(e))),!0}))}load(e,t){return n(this,void 0,void 0,(function*(){const r=s.getStorage();if(!r)throw new Error("Local storage not available.");const n=r.getItem(null!=t?t:this._defaultKeyName);return n&&(yield this.decrypt(JSON.parse(n)||[],e)),this}))}}t.Wallet=s},6658:function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.Contract=void 0;const o=r(6527),i=r(5071),s=r(6637),a=r(8381),c=r(9970),u=r(9634),d=r(7345),l=r(5537),h=r(7388),f=r(3948),p={logs:h.LogsSubscription,newHeads:s.NewHeadsSubscription,newBlockHeaders:s.NewHeadsSubscription};class m extends o.Web3Context{constructor(e,t,r,n,s){var a,c,l;const h=(0,u.isContractInitOptions)(t)?t:(0,u.isContractInitOptions)(r)?r:void 0;let g,y;if(g=(0,f.isWeb3ContractContext)(t)?t:(0,f.isWeb3ContractContext)(r)?r:n,y="object"==typeof t&&"provider"in t?t.provider:"object"==typeof r&&"provider"in r?r.provider:"object"==typeof n&&"provider"in n?n.provider:m.givenProvider,super(Object.assign(Object.assign({},g),{provider:y,registeredSubscriptions:p})),this.syncWithContext=!1,this._functions={},(null==g?void 0:g.wallet)&&(this._wallet=g.wallet),(null==g?void 0:g.accountProvider)&&(this._accountProvider=g.accountProvider),!(0,d.isNullish)(h)&&!(0,d.isNullish)(h.data)&&!(0,d.isNullish)(h.input)&&"both"!==this.config.contractDataInputFill)throw new i.ContractTransactionDataAndInputError({data:h.data,input:h.input});this._overloadedMethodAbis=new Map;const v=(0,u.isDataFormat)(n)?n:(0,u.isDataFormat)(r)?r:null!=s?s:this.defaultReturnFormat,b="string"==typeof t?t:void 0;this.config.contractDataInputFill=null!==(a=null==h?void 0:h.dataInputFill)&&void 0!==a?a:this.config.contractDataInputFill,this._parseAndSetJsonInterface(e,v),this.defaultReturnFormat!==v&&(this.defaultReturnFormat=v),(0,d.isNullish)(b)||this._parseAndSetAddress(b,v),this.options={address:b,jsonInterface:this._jsonInterface,gas:null!==(c=null==h?void 0:h.gas)&&void 0!==c?c:null==h?void 0:h.gasLimit,gasPrice:null==h?void 0:h.gasPrice,from:null==h?void 0:h.from,input:null==h?void 0:h.input,data:null==h?void 0:h.data},this.syncWithContext=null!==(l=null==h?void 0:h.syncWithContext)&&void 0!==l&&l,g instanceof o.Web3Context&&this.subscribeToContextEvents(g),Object.defineProperty(this.options,"address",{set:e=>this._parseAndSetAddress(e,v),get:()=>this._address}),Object.defineProperty(this.options,"jsonInterface",{set:e=>this._parseAndSetJsonInterface(e,v),get:()=>this._jsonInterface}),g instanceof o.Web3Context&&g.on(o.Web3ConfigEvent.CONFIG_CHANGE,(e=>{this.setConfig({[e.name]:e.newValue})}))}get events(){return this._events}get methods(){return this._methods}clone(){let e;return e=this.options.address?new m([...this._jsonInterface,...this._errorsInterface],this.options.address,{gas:this.options.gas,gasPrice:this.options.gasPrice,from:this.options.from,input:this.options.input,data:this.options.data,provider:this.currentProvider,syncWithContext:this.syncWithContext,dataInputFill:this.config.contractDataInputFill},this.getContextObject()):new m([...this._jsonInterface,...this._errorsInterface],{gas:this.options.gas,gasPrice:this.options.gasPrice,from:this.options.from,input:this.options.input,data:this.options.data,provider:this.currentProvider,syncWithContext:this.syncWithContext,dataInputFill:this.config.contractDataInputFill},this.getContextObject()),this.context&&e.subscribeToContextEvents(this.context),e}deploy(e){var t,r,o;let s=this._jsonInterface.find((e=>"constructor"===e.type));s||(s={type:"constructor",stateMutability:""});const a=(0,u.format)({format:"bytes"},null!==(t=null==e?void 0:e.input)&&void 0!==t?t:this.options.input,c.DEFAULT_RETURN_FORMAT),d=(0,u.format)({format:"bytes"},null!==(r=null==e?void 0:e.data)&&void 0!==r?r:this.options.data,c.DEFAULT_RETURN_FORMAT);if(!(a&&"0x"!==a.trim()||d&&"0x"!==d.trim()))throw new i.Web3ContractError("contract creation without any data provided.");const h=null!==(o=null==e?void 0:e.arguments)&&void 0!==o?o:[],f=Object.assign(Object.assign({},this.options),{input:a,data:d}),p=null!=a?a:d;return{arguments:h,send:e=>{const t=Object.assign({},e);return this._contractMethodDeploySend(s,h,t,f)},estimateGas:(e,t=this.defaultReturnFormat)=>n(this,void 0,void 0,(function*(){const r=Object.assign({},e);return this._contractMethodEstimateGas({abi:s,params:h,returnFormat:t,options:r,contractOptions:f})})),encodeABI:()=>(0,l.encodeMethodABI)(s,h,(0,u.format)({format:"bytes"},p,this.defaultReturnFormat)),decodeData:e=>Object.assign(Object.assign({},(0,l.decodeMethodParams)(s,e.replace(p,""),!1)),{__method__:s.type})}}getPastEvents(e,t,r){var o;return n(this,void 0,void 0,(function*(){const n="string"==typeof e?e:s.ALL_EVENTS,a="string"==typeof e||(0,u.isDataFormat)(e)?(0,u.isDataFormat)(t)?{}:t:e,c=(0,u.isDataFormat)(e)?e:(0,u.isDataFormat)(t)?t:null!=r?r:this.defaultReturnFormat,d="allEvents"===n||n===s.ALL_EVENTS?s.ALL_EVENTS_ABI:this._jsonInterface.find((e=>"name"in e&&e.name===n));if(!d)throw new i.Web3ContractError(`Event ${n} not found.`);const{fromBlock:h,toBlock:f,topics:p,address:m}=(0,l.encodeEventABI)(this.options,d,null!=a?a:{}),g=yield(0,s.getLogs)(this,{fromBlock:h,toBlock:f,topics:p,address:m},c),y=g?g.map((e=>"string"==typeof e?e:(0,s.decodeEventABI)(d,e,this._jsonInterface,c))):[],v=null!==(o=null==a?void 0:a.filter)&&void 0!==o?o:{},b=Object.keys(v);return b.length>0?y.filter((e=>"string"==typeof e||b.every((t=>{var r;if(Array.isArray(v[t]))return v[t].some((r=>String(e.returnValues[t]).toUpperCase()===String(r).toUpperCase()));const n=null===(r=d.inputs)||void 0===r?void 0:r.filter((e=>e.name===t))[0];return!(!(null==n?void 0:n.indexed)||"string"!==n.type||(0,u.keccak256)(v[t])!==String(e.returnValues[t]))||String(e.returnValues[t]).toUpperCase()===String(v[t]).toUpperCase()})))):y}))}_parseAndSetAddress(e,t=this.defaultReturnFormat){this._address=e?(0,u.toChecksumAddress)((0,u.format)({format:"address"},e,t)):e}decodeMethodData(e){const t=e.slice(0,10),r=this._jsonInterface.filter((e=>"error"!==e.type)).find((e=>t===(0,a.encodeFunctionSignature)((0,a.jsonInterfaceMethodToString)(e))));if(!r)throw new i.Web3ContractError(`The ABI for the provided method signature ${t} was not found.`);return Object.assign(Object.assign({},(0,l.decodeMethodParams)(r,e)),{__method__:(0,a.jsonInterfaceMethodToString)(r)})}_parseAndSetJsonInterface(e,t=this.defaultReturnFormat){var r,n,o,i,c;this._functions={},this._methods={},this._events={};let u=[];const d=e.filter((e=>"error"!==e.type)),l=e.filter((e=>(0,a.isAbiErrorFragment)(e)));for(const e of d){const s=Object.assign(Object.assign({},e),{signature:""});if((0,a.isAbiFunctionFragment)(s)){const e=(0,a.jsonInterfaceMethodToString)(s),t=(0,a.encodeFunctionSignature)(e);s.methodNameWithInputs=e,s.signature=t,s.constant=null!==(n=null!==(r="view"===s.stateMutability)&&void 0!==r?r:"pure"===s.stateMutability)&&void 0!==n?n:s.constant,s.payable=null!==(o="payable"===s.stateMutability)&&void 0!==o?o:s.payable,this._overloadedMethodAbis.set(s.name,[...null!==(i=this._overloadedMethodAbis.get(s.name))&&void 0!==i?i:[],s]);const u=null!==(c=this._overloadedMethodAbis.get(s.name))&&void 0!==c?c:[],d=this._createContractMethod(u,l),h=this._createContractMethod(u,l,!0);this._functions[e]={signature:t,method:h},this._methods[s.name]=d,this._methods[e]=h,this._methods[t]=h}else if((0,a.isAbiEventFragment)(s)){const e=(0,a.jsonInterfaceMethodToString)(s),r=(0,a.encodeEventSignature)(e),n=this._createContractEvent(s,t);s.signature=r,e in this._events&&"bound"!==s.name||(this._events[e]=n),this._events[s.name]=n,this._events[r]=n}u=[...u,s]}this._events.allEvents=this._createContractEvent(s.ALL_EVENTS_ABI,t),this._jsonInterface=[...u],this._errorsInterface=l}_getAbiParams(e,t){var r;try{return d.utils.transformJsonDataToAbiFormat(null!==(r=e.inputs)&&void 0!==r?r:[],t)}catch(t){throw new i.Web3ContractError(`Invalid parameters for method ${e.name}: ${t.message}`)}}_createContractMethod(e,t,r=!1){const o=e[e.length-1];return(...e)=>{var i,s,a;let c;const u=null!==(s=r?null===(i=this._overloadedMethodAbis.get(o.name))||void 0===i?void 0:i.filter((e=>e.signature===o.signature)):this._overloadedMethodAbis.get(o.name))&&void 0!==s?s:[];let h=u[0];const f=t,p=u.filter((t=>{var r;return(null!==(r=t.inputs)&&void 0!==r?r:[]).length===e.length}));if(1===u.length||0===p.length)c=this._getAbiParams(h,e),d.validator.validate(null!==(a=o.inputs)&&void 0!==a?a:[],c);else{const t=[],r=[];for(const n of p)try{c=this._getAbiParams(n,e),d.validator.validate(n.inputs,c),r.push(n)}catch(e){t.push(e)}if(1===r.length?[h]=r:r.length>1&&([h]=r,console.warn(`Multiple methods found that is compatible with the given inputs.\n\tFound ${r.length} compatible methods: ${JSON.stringify(r.map((e=>`${e.methodNameWithInputs} (signature: ${e.signature})`)))} \n\tThe first one will be used: ${h.methodNameWithInputs}`)),t.length===p.length)throw new d.Web3ValidatorError(t)}const m={arguments:c,call:(e,t)=>n(this,void 0,void 0,(function*(){return this._contractMethodCall(h,c,f,e,t)})),send:e=>this._contractMethodSend(h,c,f,e),estimateGas:(e,t=this.defaultReturnFormat)=>n(this,void 0,void 0,(function*(){return this._contractMethodEstimateGas({abi:h,params:c,returnFormat:t,options:e})})),encodeABI:()=>(0,l.encodeMethodABI)(h,c),decodeData:e=>(0,l.decodeMethodParams)(h,e),createAccessList:(e,t)=>n(this,void 0,void 0,(function*(){return this._contractMethodCreateAccessList(h,c,f,e,t)}))};return h.stateMutability,m}}_contractMethodCall(e,t,r,o,c){var u;return n(this,void 0,void 0,(function*(){const n=(0,f.getEthTxCallParams)({abi:e,params:t,options:Object.assign(Object.assign({},o),{dataInputFill:this.config.contractDataInputFill}),contractOptions:Object.assign(Object.assign({},this.options),{from:null!==(u=this.options.from)&&void 0!==u?u:this.config.defaultAccount})});try{const t=yield(0,s.call)(this,n,c,this.defaultReturnFormat);return(0,l.decodeMethodReturn)(e,t)}catch(e){throw e instanceof i.ContractExecutionError&&(0,a.decodeContractErrorData)(r,e.cause),e}}))}_contractMethodCreateAccessList(e,t,r,o,c){var u;return n(this,void 0,void 0,(function*(){const n=(0,f.getCreateAccessListParams)({abi:e,params:t,options:Object.assign(Object.assign({},o),{dataInputFill:this.config.contractDataInputFill}),contractOptions:Object.assign(Object.assign({},this.options),{from:null!==(u=this.options.from)&&void 0!==u?u:this.config.defaultAccount})});try{return(0,s.createAccessList)(this,n,c,this.defaultReturnFormat)}catch(e){throw e instanceof i.ContractExecutionError&&(0,a.decodeContractErrorData)(r,e.cause),e}}))}_contractMethodSend(e,t,r,n,o){var c,u;let d=null!=o?o:this.options;d=Object.assign(Object.assign({},d),{input:void 0,from:null!==(u=null!==(c=d.from)&&void 0!==c?c:this.defaultAccount)&&void 0!==u?u:void 0});const l=(0,f.getSendTxParams)({abi:e,params:t,options:Object.assign(Object.assign({},n),{dataInputFill:this.config.contractDataInputFill}),contractOptions:d}),h=(0,s.sendTransaction)(this,l,this.defaultReturnFormat,{checkRevertBeforeSending:!1,contractAbi:this._jsonInterface});return h.on("error",(e=>{e instanceof i.ContractExecutionError&&(0,a.decodeContractErrorData)(r,e.cause)})),h}_contractMethodDeploySend(e,t,r,n){var o,a;let c=null!=n?n:this.options;c=Object.assign(Object.assign({},c),{from:null!==(a=null!==(o=c.from)&&void 0!==o?o:this.defaultAccount)&&void 0!==a?a:void 0});const u=(0,f.getSendTxParams)({abi:e,params:t,options:Object.assign(Object.assign({},r),{dataInputFill:this.contractDataInputFill}),contractOptions:c});return(0,s.sendTransaction)(this,u,this.defaultReturnFormat,{transactionResolver:e=>{if(e.status===BigInt(0))throw new i.Web3ContractError("code couldn't be stored",e);const t=this.clone();return t.options.address=e.contractAddress,t},contractAbi:this._jsonInterface,checkRevertBeforeSending:!1})}_contractMethodEstimateGas({abi:e,params:t,returnFormat:r,options:o,contractOptions:i}){return n(this,void 0,void 0,(function*(){const n=(0,f.getEstimateGasParams)({abi:e,params:t,options:Object.assign(Object.assign({},o),{dataInputFill:this.config.contractDataInputFill}),contractOptions:null!=i?i:this.options});return(0,s.estimateGas)(this,n,c.BlockTags.LATEST,null!=r?r:this.defaultReturnFormat)}))}_createContractEvent(e,t=this.defaultReturnFormat){return(...r)=>{var n;const{topics:o,fromBlock:s}=(0,l.encodeEventABI)(this.options,e,r[0]),a=new h.LogsSubscription({address:this.options.address,topics:o,abi:e,jsonInterface:this._jsonInterface},{subscriptionManager:this.subscriptionManager,returnFormat:t});return(0,d.isNullish)(s)||this.getPastEvents(e.name,{fromBlock:s,topics:o},t).then((e=>{e&&e.forEach((e=>a.emit("data",e)))})).catch((e=>{a.emit("error",new i.SubscriptionError("Failed to get past events.",e))})),null===(n=this.subscriptionManager)||void 0===n||n.addSubscription(a).catch((e=>{a.emit("error",new i.SubscriptionError("Failed to subscribe.",e))})),a}}subscribeToContextEvents(e){const t=this;this.context=e,t.syncWithContext&&e.on(o.Web3ConfigEvent.CONFIG_CHANGE,(e=>{t.setConfig({[e.name]:e.newValue})}))}}t.Contract=m},5537:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.decodeMethodReturn=t.decodeMethodParams=t.encodeMethodABI=t.encodeEventABI=t.decodeEventABI=void 0;const n=r(9634),o=r(9970),i=r(8381),s=r(6637),a=r(5071);var c=r(6637);Object.defineProperty(t,"decodeEventABI",{enumerable:!0,get:function(){return c.decodeEventABI}}),t.encodeEventABI=({address:e},t,r)=>{var a,c;const u=null==r?void 0:r.topics,d=null!==(a=null==r?void 0:r.filter)&&void 0!==a?a:{},l={};if((0,n.isNullish)(null==r?void 0:r.fromBlock)||(l.fromBlock=(0,n.format)(s.blockSchema.properties.number,null==r?void 0:r.fromBlock,{number:o.FMT_NUMBER.HEX,bytes:o.FMT_BYTES.HEX})),(0,n.isNullish)(null==r?void 0:r.toBlock)||(l.toBlock=(0,n.format)(s.blockSchema.properties.number,null==r?void 0:r.toBlock,{number:o.FMT_NUMBER.HEX,bytes:o.FMT_BYTES.HEX})),u&&Array.isArray(u))l.topics=[...u];else if(l.topics=[],!t||t.anonymous||[s.ALL_EVENTS,"allEvents"].includes(t.name)||l.topics.push(null!==(c=t.signature)&&void 0!==c?c:(0,i.encodeEventSignature)((0,i.jsonInterfaceMethodToString)(t))),![s.ALL_EVENTS,"allEvents"].includes(t.name)&&t.inputs)for(const e of t.inputs){if(!e.indexed)continue;const t=d[e.name];t?Array.isArray(t)?l.topics.push(t.map((t=>(0,i.encodeParameter)(e.type,t)))):"string"===e.type?l.topics.push((0,n.keccak256)(t)):l.topics.push((0,i.encodeParameter)(e.type,t)):l.topics.push(null)}return l.topics.length||delete l.topics,e&&(l.address=e.toLowerCase()),l},t.encodeMethodABI=(e,t,r)=>{const n=Array.isArray(e.inputs)?e.inputs.length:0;if(e.inputs&&n!==t.length)throw new a.Web3ContractError(`The number of arguments is not matching the methods required number. You need to pass ${n} arguments.`);let o;if(o=e.inputs?(0,i.encodeParameters)(Array.isArray(e.inputs)?e.inputs:[],t).replace("0x",""):(0,i.inferTypesAndEncodeParameters)(t).replace("0x",""),(0,i.isAbiConstructorFragment)(e)){if(!r)throw new a.Web3ContractError("The contract has no contract data option set. This is necessary to append the constructor parameters.");return r.startsWith("0x")?`${r}${o}`:`0x${r}${o}`}return`${(0,i.encodeFunctionSignature)(e)}${o}`},t.decodeMethodParams=(e,t,r=!0)=>{const n=r&&t&&t.length>=10&&t.startsWith("0x")?t.slice(10):t;if(!e.inputs)throw new a.Web3ContractError("No inputs found in the ABI");return(0,i.decodeParameters)([...e.inputs],n)},t.decodeMethodReturn=(e,t)=>{if("constructor"===e.type)return t;if(!t)return null;const r=t.length>=2?t.slice(2):t;if(!e.outputs)return null;const n=(0,i.decodeParameters)([...e.outputs],r);return 1===n.__length__?n[0]:n}},3211:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r);var o=Object.getOwnPropertyDescriptor(t,r);o&&!("get"in o?!t.__esModule:o.writable||o.configurable)||(o={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,o)}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),o=this&&this.__exportStar||function(e,t){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(t,r)||n(t,e,r)};Object.defineProperty(t,"__esModule",{value:!0});const i=r(6658);o(r(5537),t),o(r(6658),t),o(r(7388),t),o(r(3951),t),o(r(3948),t),t.default=i.Contract},7388:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.LogsSubscription=void 0;const n=r(6527),o=r(6637);class i extends n.Web3Subscription{constructor(e,t){super(e,t),this.address=e.address,this.topics=e.topics,this.abi=e.abi,this.jsonInterface=e.jsonInterface}_buildSubscriptionParams(){return["logs",{address:this.address,topics:this.topics}]}formatSubscriptionResult(e){return(0,o.decodeEventABI)(this.abi,e,this.jsonInterface,super.returnFormat)}}t.LogsSubscription=i},3951:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0})},3948:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getCreateAccessListParams=t.isWeb3ContractContext=t.getEstimateGasParams=t.getEthTxCallParams=t.getSendTxParams=void 0;const n=r(5071),o=r(9634),i=r(5537),s=(e,t,r,n)=>{var s,a;const c={};return(0,o.isNullish)(e.data)&&"both"!==n||(c.data=(0,i.encodeMethodABI)(t,r,null!==(s=e.data)&&void 0!==s?s:e.input)),(0,o.isNullish)(e.input)&&"both"!==n||(c.input=(0,i.encodeMethodABI)(t,r,null!==(a=e.input)&&void 0!==a?a:e.data)),(0,o.isNullish)(c.input)&&(0,o.isNullish)(c.data)&&(c[n]=(0,i.encodeMethodABI)(t,r)),{data:c.data,input:c.input}};t.getSendTxParams=({abi:e,params:t,options:r,contractOptions:i})=>{var a,c,u;if(!(null!==(u=null!==(c=null!==(a=null==r?void 0:r.input)&&void 0!==a?a:null==r?void 0:r.data)&&void 0!==c?c:i.input)&&void 0!==u?u:i.data)&&!(null==r?void 0:r.to)&&!i.address)throw new n.Web3ContractError("Contract address not specified");if(!(null==r?void 0:r.from)&&!i.from)throw new n.Web3ContractError('Contract "from" address not specified');let d=(0,o.mergeDeep)({to:i.address,gas:i.gas,gasPrice:i.gasPrice,from:i.from,input:i.input,maxPriorityFeePerGas:i.maxPriorityFeePerGas,maxFeePerGas:i.maxFeePerGas,data:i.data},r);const l=s(d,e,t,null==r?void 0:r.dataInputFill);return d=Object.assign(Object.assign({},d),{data:l.data,input:l.input}),d},t.getEthTxCallParams=({abi:e,params:t,options:r,contractOptions:i})=>{if(!(null==r?void 0:r.to)&&!i.address)throw new n.Web3ContractError("Contract address not specified");let a=(0,o.mergeDeep)({to:i.address,gas:i.gas,gasPrice:i.gasPrice,from:i.from,input:i.input,maxPriorityFeePerGas:i.maxPriorityFeePerGas,maxFeePerGas:i.maxFeePerGas,data:i.data},r);const c=s(a,e,t,null==r?void 0:r.dataInputFill);return a=Object.assign(Object.assign({},a),{data:c.data,input:c.input}),a},t.getEstimateGasParams=({abi:e,params:t,options:r,contractOptions:n})=>{let i=(0,o.mergeDeep)({to:n.address,gas:n.gas,gasPrice:n.gasPrice,from:n.from,input:n.input,data:n.data},r);const a=s(i,e,t,null==r?void 0:r.dataInputFill);return i=Object.assign(Object.assign({},i),{data:a.data,input:a.input}),i},t.isWeb3ContractContext=e=>"object"==typeof e&&!(0,o.isNullish)(e)&&0!==Object.keys(e).length&&!(0,o.isContractInitOptions)(e),t.getCreateAccessListParams=({abi:e,params:t,options:r,contractOptions:i})=>{if(!(null==r?void 0:r.to)&&!i.address)throw new n.Web3ContractError("Contract address not specified");if(!(null==r?void 0:r.from)&&!i.from)throw new n.Web3ContractError('Contract "from" address not specified');let a=(0,o.mergeDeep)({to:i.address,gas:i.gas,gasPrice:i.gasPrice,from:i.from,input:i.input,maxPriorityFeePerGas:i.maxPriorityFeePerGas,maxFeePerGas:i.maxFeePerGas,data:i.data},r);const c=s(a,e,t,null==r?void 0:r.dataInputFill);return a=Object.assign(Object.assign({},a),{data:c.data,input:c.input}),a}},6919:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.ENSRegistryAbi=void 0,t.ENSRegistryAbi=[{anonymous:!1,inputs:[{indexed:!0,internalType:"bytes32",name:"node",type:"bytes32"},{indexed:!0,internalType:"bytes32",name:"label",type:"bytes32"},{indexed:!1,internalType:"address",name:"owner",type:"address"}],name:"NewOwner",type:"event"},{anonymous:!1,inputs:[{indexed:!0,internalType:"bytes32",name:"node",type:"bytes32"},{indexed:!1,internalType:"address",name:"resolver",type:"address"}],name:"NewResolver",type:"event"},{anonymous:!1,inputs:[{indexed:!0,internalType:"bytes32",name:"node",type:"bytes32"},{indexed:!1,internalType:"address",name:"owner",type:"address"}],name:"Transfer",type:"event"},{inputs:[{internalType:"address",name:"owner",type:"address"},{internalType:"address",name:"operator",type:"address"}],name:"isApprovedForAll",outputs:[{internalType:"bool",name:"",type:"bool"}],stateMutability:"view",type:"function"},{inputs:[{internalType:"bytes32",name:"node",type:"bytes32"}],name:"owner",outputs:[{internalType:"address",name:"",type:"address"}],stateMutability:"view",type:"function"},{inputs:[{internalType:"bytes32",name:"node",type:"bytes32"}],name:"recordExists",outputs:[{internalType:"bool",name:"",type:"bool"}],stateMutability:"view",type:"function"},{inputs:[{internalType:"bytes32",name:"node",type:"bytes32"}],name:"resolver",outputs:[{internalType:"address",name:"",type:"address"}],stateMutability:"view",type:"function"},{inputs:[{internalType:"bytes32",name:"node",type:"bytes32"}],name:"ttl",outputs:[{internalType:"uint64",name:"",type:"uint64"}],stateMutability:"view",type:"function"}]},172:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.PublicResolverAbi=void 0,t.PublicResolverAbi=[{anonymous:!1,inputs:[{indexed:!0,internalType:"bytes32",name:"node",type:"bytes32"},{indexed:!1,internalType:"address",name:"a",type:"address"}],name:"AddrChanged",type:"event"},{anonymous:!1,inputs:[{indexed:!0,internalType:"bytes32",name:"node",type:"bytes32"},{indexed:!1,internalType:"uint256",name:"coinType",type:"uint256"},{indexed:!1,internalType:"bytes",name:"newAddress",type:"bytes"}],name:"AddressChanged",type:"event"},{anonymous:!1,inputs:[{indexed:!0,internalType:"address",name:"owner",type:"address"},{indexed:!0,internalType:"address",name:"operator",type:"address"},{indexed:!1,internalType:"bool",name:"approved",type:"bool"}],name:"ApprovalForAll",type:"event"},{anonymous:!1,inputs:[{indexed:!0,internalType:"bytes32",name:"node",type:"bytes32"},{indexed:!1,internalType:"bytes",name:"hash",type:"bytes"}],name:"ContenthashChanged",type:"event"},{anonymous:!1,inputs:[{indexed:!0,internalType:"bytes32",name:"node",type:"bytes32"},{indexed:!1,internalType:"bytes",name:"name",type:"bytes"},{indexed:!1,internalType:"uint16",name:"resource",type:"uint16"},{indexed:!1,internalType:"bytes",name:"record",type:"bytes"}],name:"DNSRecordChanged",type:"event"},{anonymous:!1,inputs:[{indexed:!0,internalType:"bytes32",name:"node",type:"bytes32"},{indexed:!1,internalType:"bytes",name:"name",type:"bytes"},{indexed:!1,internalType:"uint16",name:"resource",type:"uint16"}],name:"DNSRecordDeleted",type:"event"},{anonymous:!1,inputs:[{indexed:!0,internalType:"bytes32",name:"node",type:"bytes32"}],name:"DNSZoneCleared",type:"event"},{anonymous:!1,inputs:[{indexed:!0,internalType:"bytes32",name:"node",type:"bytes32"},{indexed:!1,internalType:"bytes",name:"lastzonehash",type:"bytes"},{indexed:!1,internalType:"bytes",name:"zonehash",type:"bytes"}],name:"DNSZonehashChanged",type:"event"},{anonymous:!1,inputs:[{indexed:!0,internalType:"bytes32",name:"node",type:"bytes32"},{indexed:!0,internalType:"bytes4",name:"interfaceID",type:"bytes4"},{indexed:!1,internalType:"address",name:"implementer",type:"address"}],name:"InterfaceChanged",type:"event"},{anonymous:!1,inputs:[{indexed:!0,internalType:"bytes32",name:"node",type:"bytes32"},{indexed:!1,internalType:"string",name:"name",type:"string"}],name:"NameChanged",type:"event"},{anonymous:!1,inputs:[{indexed:!0,internalType:"bytes32",name:"node",type:"bytes32"},{indexed:!1,internalType:"bytes32",name:"x",type:"bytes32"},{indexed:!1,internalType:"bytes32",name:"y",type:"bytes32"}],name:"PubkeyChanged",type:"event"},{anonymous:!1,inputs:[{indexed:!0,internalType:"bytes32",name:"node",type:"bytes32"},{indexed:!0,internalType:"string",name:"indexedKey",type:"string"},{indexed:!1,internalType:"string",name:"key",type:"string"}],name:"TextChanged",type:"event"},{inputs:[{internalType:"bytes32",name:"node",type:"bytes32"},{internalType:"uint256",name:"contentTypes",type:"uint256"}],name:"ABI",outputs:[{internalType:"uint256",name:"",type:"uint256"},{internalType:"bytes",name:"",type:"bytes"}],stateMutability:"view",type:"function"},{inputs:[{internalType:"bytes32",name:"node",type:"bytes32"}],name:"addr",outputs:[{internalType:"address payable",name:"",type:"address"}],stateMutability:"view",type:"function"},{inputs:[{internalType:"bytes32",name:"node",type:"bytes32"},{internalType:"uint256",name:"coinType",type:"uint256"}],name:"addr",outputs:[{internalType:"bytes",name:"",type:"bytes"}],stateMutability:"view",type:"function"},{inputs:[{internalType:"bytes32",name:"node",type:"bytes32"}],name:"contenthash",outputs:[{internalType:"bytes",name:"",type:"bytes"}],stateMutability:"view",type:"function"},{inputs:[{internalType:"bytes32",name:"node",type:"bytes32"},{internalType:"bytes32",name:"name",type:"bytes32"},{internalType:"uint16",name:"resource",type:"uint16"}],name:"dnsRecord",outputs:[{internalType:"bytes",name:"",type:"bytes"}],stateMutability:"view",type:"function"},{inputs:[{internalType:"bytes32",name:"node",type:"bytes32"},{internalType:"bytes32",name:"name",type:"bytes32"}],name:"hasDNSRecords",outputs:[{internalType:"bool",name:"",type:"bool"}],stateMutability:"view",type:"function"},{inputs:[{internalType:"bytes32",name:"node",type:"bytes32"},{internalType:"bytes4",name:"interfaceID",type:"bytes4"}],name:"interfaceImplementer",outputs:[{internalType:"address",name:"",type:"address"}],stateMutability:"view",type:"function"},{inputs:[{internalType:"address",name:"account",type:"address"},{internalType:"address",name:"operator",type:"address"}],name:"isApprovedForAll",outputs:[{internalType:"bool",name:"",type:"bool"}],stateMutability:"view",type:"function"},{inputs:[{internalType:"bytes32",name:"node",type:"bytes32"}],name:"name",outputs:[{internalType:"string",name:"",type:"string"}],stateMutability:"view",type:"function"},{inputs:[{internalType:"bytes32",name:"node",type:"bytes32"}],name:"pubkey",outputs:[{internalType:"bytes32",name:"x",type:"bytes32"},{internalType:"bytes32",name:"y",type:"bytes32"}],stateMutability:"view",type:"function"},{inputs:[{internalType:"bytes4",name:"interfaceID",type:"bytes4"}],name:"supportsInterface",outputs:[{internalType:"bool",name:"",type:"bool"}],stateMutability:"view",type:"function"},{inputs:[{internalType:"bytes32",name:"node",type:"bytes32"},{internalType:"string",name:"key",type:"string"}],name:"text",outputs:[{internalType:"string",name:"",type:"string"}],stateMutability:"view",type:"function"},{inputs:[{internalType:"bytes32",name:"node",type:"bytes32"}],name:"zonehash",outputs:[{internalType:"bytes",name:"",type:"bytes"}],stateMutability:"view",type:"function"},{inputs:[{internalType:"bytes32",name:"node",type:"bytes32"},{internalType:"address",name:"a",type:"address"}],name:"setAddr",outputs:[],stateMutability:"nonpayable",type:"function"}]},8677:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.networkIds=t.registryAddresses=t.methodsInInterface=t.interfaceIds=void 0,t.interfaceIds={addr:"0x3b3b57de",name:"0x691f3431",abi:"0x2203ab56",pubkey:"0xc8690233",text:"0x59d1d43c",contenthash:"0xbc1c58d1"},t.methodsInInterface={setAddr:"addr",addr:"addr",setPubkey:"pubkey",pubkey:"pubkey",setContenthash:"contenthash",contenthash:"contenthash",text:"text",name:"name"},t.registryAddresses={main:"0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",goerli:"0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e"},t.networkIds={"0x1":"main","0x5":"goerli"}},9142:function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.ENS=void 0;const o=r(6527),i=r(5071),s=r(6637),a=r(9820),c=r(9970),u=r(7345),d=r(8677),l=r(67),h=r(8067);class f extends o.Web3Context{constructor(e,t){super(null!=t?t:""),this.registryAddress=null!=e?e:d.registryAddresses.main,this._registry=new l.Registry(this.getContextObject(),e),this._resolver=new h.Resolver(this._registry)}getResolver(e){return n(this,void 0,void 0,(function*(){return this._registry.getResolver(e)}))}recordExists(e){return n(this,void 0,void 0,(function*(){return this._registry.recordExists(e)}))}getTTL(e){return n(this,void 0,void 0,(function*(){return this._registry.getTTL(e)}))}getOwner(e){return n(this,void 0,void 0,(function*(){return this._registry.getOwner(e)}))}getAddress(e,t=60){return n(this,void 0,void 0,(function*(){return this._resolver.getAddress(e,t)}))}getText(e,t){return n(this,void 0,void 0,(function*(){return(0,u.isAddress)(e)?this._resolver.getText(yield this._resolver.getName(e,!1),t):this._resolver.getText(e,t)}))}getName(e,t=!0){return n(this,void 0,void 0,(function*(){return this._resolver.getName(e,t)}))}getPubkey(e){return n(this,void 0,void 0,(function*(){return this._resolver.getPubkey(e)}))}getContenthash(e){return n(this,void 0,void 0,(function*(){return this._resolver.getContenthash(e)}))}checkNetwork(){return n(this,void 0,void 0,(function*(){const e=Date.now()/1e3;if(!this._lastSyncCheck||e-this._lastSyncCheck>3600){const t=yield(0,s.isSyncing)(this);if("boolean"!=typeof t||t)throw new i.ENSNetworkNotSyncedError;this._lastSyncCheck=e}if(this._detectedAddress)return this._detectedAddress;const t=yield(0,a.getId)(this,Object.assign(Object.assign({},this.defaultReturnFormat),{number:c.FMT_NUMBER.HEX})),r=d.registryAddresses[d.networkIds[t]];if(void 0===r)throw new i.ENSUnsupportedNetworkError(t);return this._detectedAddress=r,this._detectedAddress}))}supportsInterface(e,t){return n(this,void 0,void 0,(function*(){return this._resolver.supportsInterface(e,t)}))}get events(){return this._registry.events}setAddress(e,t,r){return n(this,void 0,void 0,(function*(){return this._resolver.setAddress(e,t,r)}))}}t.ENS=f},1698:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r);var o=Object.getOwnPropertyDescriptor(t,r);o&&!("get"in o?!t.__esModule:o.writable||o.configurable)||(o={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,o)}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),o=this&&this.__exportStar||function(e,t){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(t,r)||n(t,e,r)};Object.defineProperty(t,"__esModule",{value:!0}),t.registryAddresses=void 0;const i=r(8677);Object.defineProperty(t,"registryAddresses",{enumerable:!0,get:function(){return i.registryAddresses}}),o(r(9142),t)},67:function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.Registry=void 0;const o=r(3211),i=r(6919),s=r(172),a=r(8677),c=r(8196);t.Registry=class{constructor(e,t){this.contract=new o.Contract(i.ENSRegistryAbi,null!=t?t:a.registryAddresses.main,e),this.context=e}getOwner(e){return n(this,void 0,void 0,(function*(){try{return this.contract.methods.owner((0,c.namehash)(e)).call()}catch(e){throw new Error}}))}getTTL(e){return n(this,void 0,void 0,(function*(){try{return this.contract.methods.ttl((0,c.namehash)(e)).call()}catch(e){throw new Error}}))}recordExists(e){return n(this,void 0,void 0,(function*(){try{return this.contract.methods.recordExists((0,c.namehash)(e)).call()}catch(e){throw new Error}}))}getResolver(e){return n(this,void 0,void 0,(function*(){try{return this.contract.methods.resolver((0,c.namehash)(e)).call().then((e=>{if("string"==typeof e)return new o.Contract(s.PublicResolverAbi,e,this.context);throw new Error}))}catch(e){throw new Error}}))}get events(){return this.contract.events}}},8067:function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.Resolver=void 0;const o=r(5071),i=r(9634),s=r(7345),a=r(8677),c=r(8196);t.Resolver=class{constructor(e){this.registry=e}getResolverContractAdapter(e){return n(this,void 0,void 0,(function*(){return this.registry.getResolver(e)}))}checkInterfaceSupport(e,t){var r,s;return n(this,void 0,void 0,(function*(){if((0,i.isNullish)(a.interfaceIds[t]))throw new o.ResolverMethodMissingError(null!==(r=e.options.address)&&void 0!==r?r:"",t);if(!(yield e.methods.supportsInterface(a.interfaceIds[t]).call()))throw new o.ResolverMethodMissingError(null!==(s=e.options.address)&&void 0!==s?s:"",t)}))}supportsInterface(e,t){var r;return n(this,void 0,void 0,(function*(){const n=yield this.getResolverContractAdapter(e);let o=t;if(!(0,s.isHexStrict)(o)){if(o=null!==(r=(0,i.sha3)(t))&&void 0!==r?r:"",""===t)throw new Error("Invalid interface Id");o=o.slice(0,10)}return n.methods.supportsInterface(o).call()}))}getAddress(e,t=60){return n(this,void 0,void 0,(function*(){const r=yield this.getResolverContractAdapter(e);return yield this.checkInterfaceSupport(r,a.methodsInInterface.addr),r.methods.addr((0,c.namehash)(e),t).call()}))}getPubkey(e){return n(this,void 0,void 0,(function*(){const t=yield this.getResolverContractAdapter(e);return yield this.checkInterfaceSupport(t,a.methodsInInterface.pubkey),t.methods.pubkey((0,c.namehash)(e)).call()}))}getContenthash(e){return n(this,void 0,void 0,(function*(){const t=yield this.getResolverContractAdapter(e);return yield this.checkInterfaceSupport(t,a.methodsInInterface.contenthash),t.methods.contenthash((0,c.namehash)(e)).call()}))}setAddress(e,t,r){return n(this,void 0,void 0,(function*(){const n=yield this.getResolverContractAdapter(e);return yield this.checkInterfaceSupport(n,a.methodsInInterface.setAddr),n.methods.setAddr((0,c.namehash)(e),t).send(r)}))}getText(e,t){return n(this,void 0,void 0,(function*(){const r=yield this.getResolverContractAdapter(e);return yield this.checkInterfaceSupport(r,a.methodsInInterface.text),r.methods.text((0,c.namehash)(e),t).call()}))}getName(e,t=!0){return n(this,void 0,void 0,(function*(){const r=`${e.toLowerCase().substring(2)}.addr.reverse`,n=yield this.getResolverContractAdapter(r);return t&&(yield this.checkInterfaceSupport(n,a.methodsInInterface.name)),n.methods.name((0,c.namehash)(r)).call()}))}}},8196:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.namehash=t.normalize=void 0;const n=r(9634),o=r(6608);t.normalize=e=>(0,o.ens_normalize)(e),t.namehash=e=>{let r="";for(let e=0;e<32;e+=1)r+="00";if(e){const o=(0,t.normalize)(e).split(".");for(let e=o.length-1;e>=0;e-=1){const t=(0,n.sha3Raw)(o[e]).slice(2);r=(0,n.sha3Raw)(`0x${r}${t}`).slice(2)}}return`0x${r}`}},5609:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.Iban=void 0;const n=r(9634),o=r(7345),i=r(5071);class s{constructor(e){if(this.toAddress=()=>{if(this.isDirect()){const e=this._iban.slice(4),t=s._parseInt(e,36),r=(0,n.leftPad)(t,40);return(0,n.toChecksumAddress)(r)}throw new Error("Iban is indirect and cannot be converted. Must be length of 34 or 35")},!s.isIndirect(e)&&!s.isDirect(e))throw new Error("Invalid IBAN was provided");this._iban=e}static isDirect(e){return 34===e.length||35===e.length}isDirect(){return s.isDirect(this._iban)}static isIndirect(e){return 20===e.length}isIndirect(){return s.isIndirect(this._iban)}static isValid(e){return/^XE[0-9]{2}(ETH[0-9A-Z]{13}|[0-9A-Z]{30,31})$/.test(e)&&1===s._mod9710(s._iso13616Prepare(e))}isValid(){return s.isValid(this._iban)}static fromBban(e){const t=`0${(98-this._mod9710(this._iso13616Prepare(`XE00${e}`))).toString()}`.slice(-2);return new s(`XE${t}${e}`)}static createIndirect(e){return s.fromBban(`ETH${e.institution}${e.identifier}`)}static fromAddress(e){if(!(0,o.isAddress)(e))throw new i.InvalidAddressError(e);const t=BigInt((0,n.hexToNumber)(e)).toString(36),r=(0,n.leftPad)(t,15);return s.fromBban(r.toUpperCase())}static toIban(e){return s.fromAddress(e).toString()}client(){return this.isIndirect()?this._iban.slice(11):""}checksum(){return this._iban.slice(2,4)}institution(){return this.isIndirect()?this._iban.slice(7,11):""}toString(){return this._iban}}t.Iban=s,s._iso13616Prepare=e=>{const t="A".charCodeAt(0),r="Z".charCodeAt(0),n=e.toUpperCase();return`${n.slice(4)}${n.slice(0,4)}`.split("").map((e=>{const n=e.charCodeAt(0);return n>=t&&n<=r?n-t+10:e})).join("")},s._parseInt=(e,t)=>[...e].reduce(((e,r)=>BigInt(parseInt(r,t))+BigInt(t)*e),BigInt(0)),s._mod9710=e=>{let t,r=e;for(;r.length>2;)t=r.slice(0,9),r=`${(parseInt(t,10)%97).toString()}${r.slice(t.length)}`;return parseInt(r,10)%97},s.toAddress=e=>new s(e).toAddress()},9910:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r);var o=Object.getOwnPropertyDescriptor(t,r);o&&!("get"in o?!t.__esModule:o.writable||o.configurable)||(o={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,o)}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),o=this&&this.__exportStar||function(e,t){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(t,r)||n(t,e,r)};Object.defineProperty(t,"__esModule",{value:!0});const i=r(5609);o(r(5609),t),o(r(1965),t),t.default=i.Iban},1965:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0})},9757:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r);var o=Object.getOwnPropertyDescriptor(t,r);o&&!("get"in o?!t.__esModule:o.writable||o.configurable)||(o={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,o)}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),o=this&&this.__exportStar||function(e,t){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(t,r)||n(t,e,r)};Object.defineProperty(t,"__esModule",{value:!0});const i=r(9638);o(r(9638),t),t.default=i.Personal},9638:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r);var o=Object.getOwnPropertyDescriptor(t,r);o&&!("get"in o?!t.__esModule:o.writable||o.configurable)||(o={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,o)}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),o=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),i=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var r in e)"default"!==r&&Object.prototype.hasOwnProperty.call(e,r)&&n(t,e,r);return o(t,e),t},s=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.Personal=void 0;const a=r(6527),c=i(r(706));class u extends a.Web3Context{getAccounts(){return s(this,void 0,void 0,(function*(){return c.getAccounts(this.requestManager)}))}newAccount(e){return s(this,void 0,void 0,(function*(){return c.newAccount(this.requestManager,e)}))}unlockAccount(e,t,r){return s(this,void 0,void 0,(function*(){return c.unlockAccount(this.requestManager,e,t,r)}))}lockAccount(e){return s(this,void 0,void 0,(function*(){return c.lockAccount(this.requestManager,e)}))}importRawKey(e,t){return s(this,void 0,void 0,(function*(){return c.importRawKey(this.requestManager,e,t)}))}sendTransaction(e,t){return s(this,void 0,void 0,(function*(){return c.sendTransaction(this.requestManager,e,t)}))}signTransaction(e,t){return s(this,void 0,void 0,(function*(){return c.signTransaction(this.requestManager,e,t)}))}sign(e,t,r){return s(this,void 0,void 0,(function*(){return c.sign(this.requestManager,e,t,r)}))}ecRecover(e,t){return s(this,void 0,void 0,(function*(){return c.ecRecover(this.requestManager,e,t)}))}}t.Personal=u},706:function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.ecRecover=t.sign=t.signTransaction=t.sendTransaction=t.importRawKey=t.lockAccount=t.unlockAccount=t.newAccount=t.getAccounts=void 0;const o=r(9634),i=r(6637),s=r(9970),a=r(7345),c=r(1181);t.getAccounts=e=>n(void 0,void 0,void 0,(function*(){return(yield c.personalRpcMethods.getAccounts(e)).map(o.toChecksumAddress)})),t.newAccount=(e,t)=>n(void 0,void 0,void 0,(function*(){a.validator.validate(["string"],[t]);const r=yield c.personalRpcMethods.newAccount(e,t);return(0,o.toChecksumAddress)(r)})),t.unlockAccount=(e,t,r,o)=>n(void 0,void 0,void 0,(function*(){return a.validator.validate(["address","string","uint"],[t,r,o]),c.personalRpcMethods.unlockAccount(e,t,r,o)})),t.lockAccount=(e,t)=>n(void 0,void 0,void 0,(function*(){return a.validator.validate(["address"],[t]),c.personalRpcMethods.lockAccount(e,t)})),t.importRawKey=(e,t,r)=>n(void 0,void 0,void 0,(function*(){return a.validator.validate(["string","string"],[t,r]),c.personalRpcMethods.importRawKey(e,t,r)})),t.sendTransaction=(e,t,r)=>n(void 0,void 0,void 0,(function*(){const n=(0,i.formatTransaction)(t,s.ETH_DATA_FORMAT);return c.personalRpcMethods.sendTransaction(e,n,r)})),t.signTransaction=(e,t,r)=>n(void 0,void 0,void 0,(function*(){const n=(0,i.formatTransaction)(t,s.ETH_DATA_FORMAT);return c.personalRpcMethods.signTransaction(e,n,r)})),t.sign=(e,t,r,i)=>n(void 0,void 0,void 0,(function*(){a.validator.validate(["string","address","string"],[t,r,i]);const n=(0,a.isHexStrict)(t)?t:(0,o.utf8ToHex)(t);return c.personalRpcMethods.sign(e,n,r,i)})),t.ecRecover=(e,t,r)=>n(void 0,void 0,void 0,(function*(){a.validator.validate(["string","string"],[t,r]);const n=(0,a.isHexStrict)(t)?t:(0,o.utf8ToHex)(t);return c.personalRpcMethods.ecRecover(e,n,r)}))},9326:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.NUMBER_DATA_FORMAT=t.ALL_EVENTS_ABI=t.ALL_EVENTS=void 0;const n=r(9970);t.ALL_EVENTS="ALLEVENTS",t.ALL_EVENTS_ABI={name:t.ALL_EVENTS,signature:"",type:"event",inputs:[]},t.NUMBER_DATA_FORMAT={bytes:n.FMT_BYTES.HEX,number:n.FMT_NUMBER.NUMBER}},6637:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r);var o=Object.getOwnPropertyDescriptor(t,r);o&&!("get"in o?!t.__esModule:o.writable||o.configurable)||(o={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,o)}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),o=this&&this.__exportStar||function(e,t){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(t,r)||n(t,e,r)};Object.defineProperty(t,"__esModule",{value:!0}),t.SendTxHelper=t.trySendTransaction=t.waitForTransactionReceipt=t.getTransactionFromOrToAttr=t.transactionBuilder=t.detectTransactionType=void 0,r(6985);const i=r(1435);o(r(1435),t),o(r(7543),t),o(r(1922),t),o(r(9326),t),o(r(4832),t),o(r(8650),t),o(r(3222),t),o(r(5140),t),o(r(1258),t),o(r(7460),t);var s=r(7350);Object.defineProperty(t,"detectTransactionType",{enumerable:!0,get:function(){return s.detectTransactionType}});var a=r(223);Object.defineProperty(t,"transactionBuilder",{enumerable:!0,get:function(){return a.transactionBuilder}}),Object.defineProperty(t,"getTransactionFromOrToAttr",{enumerable:!0,get:function(){return a.getTransactionFromOrToAttr}});var c=r(4745);Object.defineProperty(t,"waitForTransactionReceipt",{enumerable:!0,get:function(){return c.waitForTransactionReceipt}});var u=r(8425);Object.defineProperty(t,"trySendTransaction",{enumerable:!0,get:function(){return u.trySendTransaction}});var d=r(7322);Object.defineProperty(t,"SendTxHelper",{enumerable:!0,get:function(){return d.SendTxHelper}}),t.default=i.Web3Eth},3222:function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))},o=this&&this.__rest||function(e,t){var r={};for(var n in e)Object.prototype.hasOwnProperty.call(e,n)&&t.indexOf(n)<0&&(r[n]=e[n]);if(null!=e&&"function"==typeof Object.getOwnPropertySymbols){var o=0;for(n=Object.getOwnPropertySymbols(e);o<n.length;o++)t.indexOf(n[o])<0&&Object.prototype.propertyIsEnumerable.call(e,n[o])&&(r[n[o]]=e[n[o]])}return r};Object.defineProperty(t,"__esModule",{value:!0}),t.signTypedData=t.createAccessList=t.getFeeHistory=t.getProof=t.getChainId=t.getLogs=t.estimateGas=t.call=t.signTransaction=t.sign=t.sendSignedTransaction=t.sendTransaction=t.getTransactionCount=t.getTransactionReceipt=t.getTransactionFromBlock=t.getPendingTransactions=t.getTransaction=t.getUncle=t.getBlockUncleCount=t.getBlockTransactionCount=t.getBlock=t.getCode=t.getStorageAt=t.getBalance=t.getBlockNumber=t.getMaxPriorityFeePerGas=t.getGasPrice=t.getHashRate=t.isMining=t.getCoinbase=t.isSyncing=t.getProtocolVersion=void 0;const i=r(9970),s=r(6527),a=r(9634),c=r(9247),u=r(7345),d=r(5071),l=r(1181),h=r(5900),f=r(1922),p=r(223),m=r(5140),g=r(8425),y=r(4745),v=r(9326),b=r(7322);t.getProtocolVersion=e=>n(void 0,void 0,void 0,(function*(){return l.ethRpcMethods.getProtocolVersion(e.requestManager)})),t.isSyncing=e=>n(void 0,void 0,void 0,(function*(){return l.ethRpcMethods.getSyncing(e.requestManager)})),t.getCoinbase=e=>n(void 0,void 0,void 0,(function*(){return l.ethRpcMethods.getCoinbase(e.requestManager)})),t.isMining=e=>n(void 0,void 0,void 0,(function*(){return l.ethRpcMethods.getMining(e.requestManager)})),t.getHashRate=function(e,t){return n(this,void 0,void 0,(function*(){const r=yield l.ethRpcMethods.getHashRate(e.requestManager);return(0,a.format)({format:"uint"},r,null!=t?t:e.defaultReturnFormat)}))},t.getGasPrice=function(e,t){return n(this,void 0,void 0,(function*(){const r=yield l.ethRpcMethods.getGasPrice(e.requestManager);return(0,a.format)({format:"uint"},r,null!=t?t:e.defaultReturnFormat)}))},t.getMaxPriorityFeePerGas=function(e,t){return n(this,void 0,void 0,(function*(){const r=yield l.ethRpcMethods.getMaxPriorityFeePerGas(e.requestManager);return(0,a.format)({format:"uint"},r,null!=t?t:e.defaultReturnFormat)}))},t.getBlockNumber=function(e,t){return n(this,void 0,void 0,(function*(){const r=yield l.ethRpcMethods.getBlockNumber(e.requestManager);return(0,a.format)({format:"uint"},r,null!=t?t:e.defaultReturnFormat)}))},t.getBalance=function(e,t,r=e.defaultBlock,o){return n(this,void 0,void 0,(function*(){const n=(0,u.isBlockTag)(r)?r:(0,a.format)({format:"uint"},r,i.ETH_DATA_FORMAT),s=yield l.ethRpcMethods.getBalance(e.requestManager,t,n);return(0,a.format)({format:"uint"},s,null!=o?o:e.defaultReturnFormat)}))},t.getStorageAt=function(e,t,r,o=e.defaultBlock,s){return n(this,void 0,void 0,(function*(){const n=(0,a.format)({format:"uint"},r,i.ETH_DATA_FORMAT),c=(0,u.isBlockTag)(o)?o:(0,a.format)({format:"uint"},o,i.ETH_DATA_FORMAT),d=yield l.ethRpcMethods.getStorageAt(e.requestManager,t,n,c);return(0,a.format)({format:"bytes"},d,null!=s?s:e.defaultReturnFormat)}))},t.getCode=function(e,t,r=e.defaultBlock,o){return n(this,void 0,void 0,(function*(){const n=(0,u.isBlockTag)(r)?r:(0,a.format)({format:"uint"},r,i.ETH_DATA_FORMAT),s=yield l.ethRpcMethods.getCode(e.requestManager,t,n);return(0,a.format)({format:"bytes"},s,null!=o?o:e.defaultReturnFormat)}))},t.getBlock=function(e,t=e.defaultBlock,r=!1,o){return n(this,void 0,void 0,(function*(){let n;if((0,u.isBytes)(t)){const o=(0,a.format)({format:"bytes32"},t,i.ETH_DATA_FORMAT);n=yield l.ethRpcMethods.getBlockByHash(e.requestManager,o,r)}else{const o=(0,u.isBlockTag)(t)?t:(0,a.format)({format:"uint"},t,i.ETH_DATA_FORMAT);n=yield l.ethRpcMethods.getBlockByNumber(e.requestManager,o,r)}return(0,a.format)(f.blockSchema,n,null!=o?o:e.defaultReturnFormat)}))},t.getBlockTransactionCount=function(e,t=e.defaultBlock,r){return n(this,void 0,void 0,(function*(){let n;if((0,u.isBytes)(t)){const r=(0,a.format)({format:"bytes32"},t,i.ETH_DATA_FORMAT);n=yield l.ethRpcMethods.getBlockTransactionCountByHash(e.requestManager,r)}else{const r=(0,u.isBlockTag)(t)?t:(0,a.format)({format:"uint"},t,i.ETH_DATA_FORMAT);n=yield l.ethRpcMethods.getBlockTransactionCountByNumber(e.requestManager,r)}return(0,a.format)({format:"uint"},n,null!=r?r:e.defaultReturnFormat)}))},t.getBlockUncleCount=function(e,t=e.defaultBlock,r){return n(this,void 0,void 0,(function*(){let n;if((0,u.isBytes)(t)){const r=(0,a.format)({format:"bytes32"},t,i.ETH_DATA_FORMAT);n=yield l.ethRpcMethods.getUncleCountByBlockHash(e.requestManager,r)}else{const r=(0,u.isBlockTag)(t)?t:(0,a.format)({format:"uint"},t,i.ETH_DATA_FORMAT);n=yield l.ethRpcMethods.getUncleCountByBlockNumber(e.requestManager,r)}return(0,a.format)({format:"uint"},n,null!=r?r:e.defaultReturnFormat)}))},t.getUncle=function(e,t=e.defaultBlock,r,o){return n(this,void 0,void 0,(function*(){const n=(0,a.format)({format:"uint"},r,i.ETH_DATA_FORMAT);let s;if((0,u.isBytes)(t)){const r=(0,a.format)({format:"bytes32"},t,i.ETH_DATA_FORMAT);s=yield l.ethRpcMethods.getUncleByBlockHashAndIndex(e.requestManager,r,n)}else{const r=(0,u.isBlockTag)(t)?t:(0,a.format)({format:"uint"},t,i.ETH_DATA_FORMAT);s=yield l.ethRpcMethods.getUncleByBlockNumberAndIndex(e.requestManager,r,n)}return(0,a.format)(f.blockSchema,s,null!=o?o:e.defaultReturnFormat)}))},t.getTransaction=function(e,t,r=e.defaultReturnFormat){return n(this,void 0,void 0,(function*(){const n=(0,a.format)({format:"bytes32"},t,i.DEFAULT_RETURN_FORMAT),o=yield l.ethRpcMethods.getTransactionByHash(e.requestManager,n);return(0,u.isNullish)(o)?o:(0,m.formatTransaction)(o,r,{fillInputAndData:!0})}))},t.getPendingTransactions=function(e,t){return n(this,void 0,void 0,(function*(){return(yield l.ethRpcMethods.getPendingTransactions(e.requestManager)).map((r=>(0,m.formatTransaction)(r,null!=t?t:e.defaultReturnFormat,{fillInputAndData:!0})))}))},t.getTransactionFromBlock=function(e,t=e.defaultBlock,r,o){return n(this,void 0,void 0,(function*(){const n=(0,a.format)({format:"uint"},r,i.ETH_DATA_FORMAT);let s;if((0,u.isBytes)(t)){const r=(0,a.format)({format:"bytes32"},t,i.ETH_DATA_FORMAT);s=yield l.ethRpcMethods.getTransactionByBlockHashAndIndex(e.requestManager,r,n)}else{const r=(0,u.isBlockTag)(t)?t:(0,a.format)({format:"uint"},t,i.ETH_DATA_FORMAT);s=yield l.ethRpcMethods.getTransactionByBlockNumberAndIndex(e.requestManager,r,n)}return(0,u.isNullish)(s)?s:(0,m.formatTransaction)(s,null!=o?o:e.defaultReturnFormat,{fillInputAndData:!0})}))},t.getTransactionReceipt=function(e,t,r){return n(this,void 0,void 0,(function*(){const n=(0,a.format)({format:"bytes32"},t,i.DEFAULT_RETURN_FORMAT),o=yield l.ethRpcMethods.getTransactionReceipt(e.requestManager,n);return(0,u.isNullish)(o)?o:(0,a.format)(f.transactionReceiptSchema,o,null!=r?r:e.defaultReturnFormat)}))},t.getTransactionCount=function(e,t,r=e.defaultBlock,o){return n(this,void 0,void 0,(function*(){const n=(0,u.isBlockTag)(r)?r:(0,a.format)({format:"uint"},r,i.ETH_DATA_FORMAT),s=yield l.ethRpcMethods.getTransactionCount(e.requestManager,t,n);return(0,a.format)({format:"uint"},s,null!=o?o:e.defaultReturnFormat)}))},t.sendTransaction=function(e,t,r,o={checkRevertBeforeSending:!0},c){const d=new s.Web3PromiEvent(((s,l)=>{setImmediate((()=>{(()=>{n(this,void 0,void 0,(function*(){const n=new b.SendTxHelper({web3Context:e,promiEvent:d,options:o,returnFormat:r});let h=Object.assign({},t);(0,u.isNullish)(c)||(h=yield c.processTransaction(h));let g=(0,m.formatTransaction)(Object.assign(Object.assign({},h),{from:(0,p.getTransactionFromOrToAttr)("from",e,h),to:(0,p.getTransactionFromOrToAttr)("to",e,h)}),i.ETH_DATA_FORMAT);try{let t;g=yield n.populateGasPrice({transaction:h,transactionFormatted:g}),yield n.checkRevertBeforeSending(g),n.emitSending(g),e.wallet&&!(0,u.isNullish)(g.from)&&(t=e.wallet.get(g.from));const o=yield n.signAndSend({wallet:t,tx:g}),i=(0,a.format)({format:"bytes32"},o,null!=r?r:e.defaultReturnFormat);n.emitSent(g),n.emitTransactionHash(i);const c=yield(0,y.waitForTransactionReceipt)(e,o,null!=r?r:e.defaultReturnFormat),d=n.getReceiptWithEvents((0,a.format)(f.transactionReceiptSchema,c,null!=r?r:e.defaultReturnFormat));n.emitReceipt(d),s(yield n.handleResolve({receipt:d,tx:g})),n.emitConfirmation({receipt:d,transactionHash:o})}catch(e){l(yield n.handleError({error:e,tx:g}))}}))})()}))}));return d},t.sendSignedTransaction=function(e,t,r,u={checkRevertBeforeSending:!0}){const d=new s.Web3PromiEvent(((s,h)=>{setImmediate((()=>{(()=>{n(this,void 0,void 0,(function*(){const p=new b.SendTxHelper({web3Context:e,promiEvent:d,options:u,returnFormat:r}),m=(0,a.format)({format:"bytes"},t,i.ETH_DATA_FORMAT),v=c.TransactionFactory.fromSerializedData((0,a.bytesToUint8Array)((0,a.hexToBytes)(m))),E=Object.assign(Object.assign({},v.toJSON()),{from:v.getSenderAddress().toString()});try{const{v:t,r:i,s:c}=E,u=o(E,["v","r","s"]);yield p.checkRevertBeforeSending(u),p.emitSending(m);const d=yield(0,g.trySendTransaction)(e,(()=>n(this,void 0,void 0,(function*(){return l.ethRpcMethods.sendRawTransaction(e.requestManager,m)}))));p.emitSent(m);const h=(0,a.format)({format:"bytes32"},d,null!=r?r:e.defaultReturnFormat);p.emitTransactionHash(h);const v=yield(0,y.waitForTransactionReceipt)(e,d,null!=r?r:e.defaultReturnFormat),b=p.getReceiptWithEvents((0,a.format)(f.transactionReceiptSchema,v,null!=r?r:e.defaultReturnFormat));p.emitReceipt(b),s(yield p.handleResolve({receipt:b,tx:E})),p.emitConfirmation({receipt:b,transactionHash:d})}catch(e){h(yield p.handleError({error:e,tx:E}))}}))})()}))}));return d},t.sign=function(e,t,r,o=e.defaultReturnFormat){var s;return n(this,void 0,void 0,(function*(){const n=(0,a.format)({format:"bytes"},t,i.DEFAULT_RETURN_FORMAT);if(null===(s=e.wallet)||void 0===s?void 0:s.get(r)){const t=e.wallet.get(r).sign(n);return(0,a.format)(f.SignatureObjectSchema,t,o)}if("number"==typeof r)throw new d.SignatureError(t,'RPC method "eth_sign" does not support index signatures');const c=yield l.ethRpcMethods.sign(e.requestManager,r,n);return(0,a.format)({format:"bytes"},c,o)}))},t.signTransaction=function(e,t,r=e.defaultReturnFormat){return n(this,void 0,void 0,(function*(){const n=yield l.ethRpcMethods.signTransaction(e.requestManager,(0,m.formatTransaction)(t,i.ETH_DATA_FORMAT));return(0,u.isString)(n)?(0,h.decodeSignedTransaction)(n,r,{fillInputAndData:!0}):{raw:(0,a.format)({format:"bytes"},n.raw,r),tx:(0,m.formatTransaction)(n.tx,r,{fillInputAndData:!0})}}))},t.call=function(e,t,r=e.defaultBlock,o=e.defaultReturnFormat){return n(this,void 0,void 0,(function*(){const n=(0,u.isBlockTag)(r)?r:(0,a.format)({format:"uint"},r,i.ETH_DATA_FORMAT),s=yield l.ethRpcMethods.call(e.requestManager,(0,m.formatTransaction)(t,i.ETH_DATA_FORMAT),n);return(0,a.format)({format:"bytes"},s,o)}))},t.estimateGas=function(e,t,r=e.defaultBlock,o){return n(this,void 0,void 0,(function*(){const n=(0,m.formatTransaction)(t,i.ETH_DATA_FORMAT),s=(0,u.isBlockTag)(r)?r:(0,a.format)({format:"uint"},r,i.ETH_DATA_FORMAT),c=yield l.ethRpcMethods.estimateGas(e.requestManager,n,s);return(0,a.format)({format:"uint"},c,null!=o?o:e.defaultReturnFormat)}))},t.getLogs=function(e,t,r){return n(this,void 0,void 0,(function*(){let{toBlock:n,fromBlock:o}=t;(0,u.isNullish)(n)||"number"!=typeof n&&"bigint"!=typeof n||(n=(0,a.numberToHex)(n)),(0,u.isNullish)(o)||"number"!=typeof o&&"bigint"!=typeof o||(o=(0,a.numberToHex)(o));const i=Object.assign(Object.assign({},t),{fromBlock:o,toBlock:n});return(yield l.ethRpcMethods.getLogs(e.requestManager,i)).map((t=>"string"==typeof t?t:(0,a.format)(f.logSchema,t,null!=r?r:e.defaultReturnFormat)))}))},t.getChainId=function(e,t){return n(this,void 0,void 0,(function*(){const r=yield l.ethRpcMethods.getChainId(e.requestManager);return(0,a.format)({format:"uint"},r,null!=t?t:e.defaultReturnFormat)}))},t.getProof=function(e,t,r,o=e.defaultBlock,s){return n(this,void 0,void 0,(function*(){const n=r.map((e=>(0,a.format)({format:"bytes"},e,i.ETH_DATA_FORMAT))),c=(0,u.isBlockTag)(o)?o:(0,a.format)({format:"uint"},o,i.ETH_DATA_FORMAT),d=yield l.ethRpcMethods.getProof(e.requestManager,t,n,c);return(0,a.format)(f.accountSchema,d,null!=s?s:e.defaultReturnFormat)}))},t.getFeeHistory=function(e,t,r=e.defaultBlock,o,s){return n(this,void 0,void 0,(function*(){const n=(0,a.format)({format:"uint"},t,i.ETH_DATA_FORMAT),c=(0,u.isBlockTag)(r)?r:(0,a.format)({format:"uint"},r,i.ETH_DATA_FORMAT),d=(0,a.format)({type:"array",items:{format:"uint"}},o,v.NUMBER_DATA_FORMAT),h=yield l.ethRpcMethods.getFeeHistory(e.requestManager,n,c,d);return(0,a.format)(f.feeHistorySchema,h,null!=s?s:e.defaultReturnFormat)}))},t.createAccessList=function(e,t,r=e.defaultBlock,o){return n(this,void 0,void 0,(function*(){const n=(0,u.isBlockTag)(r)?r:(0,a.format)({format:"uint"},r,i.ETH_DATA_FORMAT),s=yield l.ethRpcMethods.createAccessList(e.requestManager,(0,m.formatTransaction)(t,i.ETH_DATA_FORMAT),n);return(0,a.format)(f.accessListResultSchema,s,null!=o?o:e.defaultReturnFormat)}))},t.signTypedData=function(e,t,r,o,i){return n(this,void 0,void 0,(function*(){const n=yield l.ethRpcMethods.signTypedData(e.requestManager,t,r,o);return(0,a.format)({format:"bytes"},n,null!=i?i:e.defaultReturnFormat)}))}},1922:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.accountSchema=t.storageProofSchema=t.feeHistorySchema=t.SignatureObjectSchema=t.transactionReceiptSchema=t.syncSchema=t.logSchema=t.blockHeaderSchema=t.blockSchema=t.withdrawalsSchema=t.transactionInfoSchema=t.transactionSchema=t.customChainSchema=t.hardforkSchema=t.chainSchema=t.accessListResultSchema=t.accessListSchema=t.accessListItemSchema=void 0,t.accessListItemSchema={type:"object",properties:{address:{format:"address"},storageKeys:{type:"array",items:{format:"bytes32"}}}},t.accessListSchema={type:"array",items:Object.assign({},t.accessListItemSchema)},t.accessListResultSchema={type:"object",properties:{accessList:Object.assign({},t.accessListSchema),gasUsed:{type:"string"}}},t.chainSchema={type:"string",enum:["goerli","kovan","mainnet","rinkeby","ropsten","sepolia"]},t.hardforkSchema={type:"string",enum:["arrowGlacier","berlin","byzantium","chainstart","constantinople","dao","homestead","istanbul","london","merge","muirGlacier","petersburg","shanghai","spuriousDragon","tangerineWhistle"]},t.customChainSchema={type:"object",properties:{name:{format:"string"},networkId:{format:"uint"},chainId:{format:"uint"}}},t.transactionSchema={type:"object",properties:{from:{format:"address"},to:{oneOf:[{format:"address"},{type:"null"}]},value:{format:"uint"},gas:{format:"uint"},gasPrice:{format:"uint"},effectiveGasPrice:{format:"uint"},type:{format:"uint"},maxFeePerGas:{format:"uint"},maxPriorityFeePerGas:{format:"uint"},accessList:Object.assign({},t.accessListSchema),data:{format:"bytes"},input:{format:"bytes"},nonce:{format:"uint"},chain:Object.assign({},t.chainSchema),hardfork:Object.assign({},t.hardforkSchema),chainId:{format:"uint"},networkId:{format:"uint"},common:{type:"object",properties:{customChain:Object.assign({},t.customChainSchema),baseChain:Object.assign({},t.chainSchema),hardfork:Object.assign({},t.hardforkSchema)}},gasLimit:{format:"uint"},v:{format:"uint"},r:{format:"bytes32"},s:{format:"bytes32"}}},t.transactionInfoSchema={type:"object",properties:Object.assign(Object.assign({},t.transactionSchema.properties),{blockHash:{format:"bytes32"},blockNumber:{format:"uint"},hash:{format:"bytes32"},transactionIndex:{format:"uint"},from:{format:"address"},to:{oneOf:[{format:"address"},{type:"null"}]},value:{format:"uint"},gas:{format:"uint"},gasPrice:{format:"uint"},effectiveGasPrice:{format:"uint"},type:{format:"uint"},maxFeePerGas:{format:"uint"},maxPriorityFeePerGas:{format:"uint"},accessList:Object.assign({},t.accessListSchema),data:{format:"bytes"},input:{format:"bytes"},nonce:{format:"uint"},gasLimit:{format:"uint"},v:{format:"uint"},r:{format:"bytes32"},s:{format:"bytes32"}})},t.withdrawalsSchema={type:"object",properties:{index:{format:"uint"},validatorIndex:{format:"uint"},address:{format:"address"},amount:{format:"uint"}}},t.blockSchema={type:"object",properties:{baseFeePerGas:{format:"uint"},blobGasUsed:{format:"uint"},difficulty:{format:"uint"},excessBlobGas:{format:"uint"},extraData:{format:"bytes"},gasLimit:{format:"uint"},gasUsed:{format:"uint"},hash:{format:"bytes32"},logsBloom:{format:"bytes256"},miner:{format:"bytes"},mixHash:{format:"bytes32"},nonce:{format:"uint"},number:{format:"uint"},parentBeaconBlockRoot:{format:"bytes32"},parentHash:{format:"bytes32"},receiptsRoot:{format:"bytes32"},sha3Uncles:{format:"bytes32"},size:{format:"uint"},stateRoot:{format:"bytes32"},timestamp:{format:"uint"},totalDifficulty:{format:"uint"},transactions:{oneOf:[{type:"array",items:Object.assign({},t.transactionInfoSchema)},{type:"array",items:{format:"bytes32"}}]},transactionsRoot:{format:"bytes32"},uncles:{type:"array",items:{format:"bytes32"}},withdrawals:{type:"array",items:Object.assign({},t.withdrawalsSchema)},withdrawalsRoot:{format:"bytes32"}}},t.blockHeaderSchema={type:"object",properties:{author:{format:"bytes32"},excessDataGas:{format:"uint"},baseFeePerGas:{format:"uint"},blobGasUsed:{format:"uint"},difficulty:{format:"uint"},excessBlobGas:{format:"uint"},extraData:{format:"bytes"},gasLimit:{format:"uint"},gasUsed:{format:"uint"},hash:{format:"bytes32"},logsBloom:{format:"bytes256"},miner:{format:"bytes"},mixHash:{format:"bytes32"},nonce:{format:"uint"},number:{format:"uint"},parentBeaconBlockRoot:{format:"bytes32"},parentHash:{format:"bytes32"},receiptsRoot:{format:"bytes32"},sha3Uncles:{format:"bytes32"},size:{format:"uint"},stateRoot:{format:"bytes32"},timestamp:{format:"uint"},totalDifficulty:{format:"uint"},transactions:{type:"array",items:{format:"bytes32"}},transactionsRoot:{format:"bytes32"},uncles:{type:"array",items:{format:"bytes32"}},withdrawals:{type:"array",items:Object.assign({},t.withdrawalsSchema)},withdrawalsRoot:{format:"bytes32"}}},t.logSchema={type:"object",properties:{removed:{format:"bool"},logIndex:{format:"uint"},transactionIndex:{format:"uint"},transactionHash:{format:"bytes32"},blockHash:{format:"bytes32"},blockNumber:{format:"uint"},address:{format:"address"},data:{format:"bytes"},topics:{type:"array",items:{format:"bytes32"}}}},t.syncSchema={type:"object",properties:{startingBlock:{format:"string"},currentBlock:{format:"string"},highestBlock:{format:"string"},knownStates:{format:"string"},pulledStates:{format:"string"}}},t.transactionReceiptSchema={type:"object",properties:{transactionHash:{format:"bytes32"},transactionIndex:{format:"uint"},blockHash:{format:"bytes32"},blockNumber:{format:"uint"},from:{format:"address"},to:{format:"address"},cumulativeGasUsed:{format:"uint"},gasUsed:{format:"uint"},effectiveGasPrice:{format:"uint"},contractAddress:{format:"address"},logs:{type:"array",items:Object.assign({},t.logSchema)},logsBloom:{format:"bytes"},root:{format:"bytes"},status:{format:"uint"},type:{format:"uint"}}},t.SignatureObjectSchema={type:"object",properties:{messageHash:{format:"bytes"},r:{format:"bytes32"},s:{format:"bytes32"},v:{format:"bytes"},message:{format:"bytes"},signature:{format:"bytes"}}},t.feeHistorySchema={type:"object",properties:{oldestBlock:{format:"uint"},baseFeePerGas:{type:"array",items:{format:"uint"}},reward:{type:"array",items:{type:"array",items:{format:"uint"}}},gasUsedRatio:{type:"array",items:{type:"number"}}}},t.storageProofSchema={type:"object",properties:{key:{format:"bytes32"},value:{format:"uint"},proof:{type:"array",items:{format:"bytes32"}}}},t.accountSchema={type:"object",properties:{balance:{format:"uint"},codeHash:{format:"bytes32"},nonce:{format:"uint"},storageHash:{format:"bytes32"},accountProof:{type:"array",items:{format:"bytes32"}},storageProof:{type:"array",items:Object.assign({},t.storageProofSchema)}}}},4832:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0})},5900:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.decodeSignedTransaction=void 0;const n=r(9634),o=r(9247),i=r(7350),s=r(5140);t.decodeSignedTransaction=function(e,t,r={fillInputAndData:!1}){return{raw:(0,n.format)({format:"bytes"},e,t),tx:(0,s.formatTransaction)(Object.assign(Object.assign({},o.TransactionFactory.fromSerializedData((0,n.hexToBytes)(e)).toJSON()),{hash:(0,n.bytesToHex)((0,n.keccak256)((0,n.hexToBytes)(e))),type:(0,i.detectRawTransactionType)((0,n.hexToBytes)(e))}),t,{fillInputAndData:r.fillInputAndData})}}},7543:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.decodeEventABI=void 0;const n=r(9634),o=r(9970),i=r(8381),s=r(1922),a=r(9326);t.decodeEventABI=(e,t,r,c=o.DEFAULT_RETURN_FORMAT)=>{var u,d,l,h,f;let p=Object.assign({},e);const m=(0,n.format)(s.logSchema,t,c);if([a.ALL_EVENTS,"allEvents"].includes(p.name)){p=r.find((e=>e.signature===t.topics[0]))||{anonymous:!0}}if(p.inputs=null!==(d=null!==(u=p.inputs)&&void 0!==u?u:e.inputs)&&void 0!==d?d:[],!p.anonymous){let e=0;(null!==(l=p.inputs)&&void 0!==l?l:[]).forEach((t=>{t.indexed&&(e+=1)})),e>0&&(null==t?void 0:t.topics)&&(null==t?void 0:t.topics.length)!==e+1&&(p=Object.assign(Object.assign({},p),{anonymous:!0,inputs:[]}))}const g=p.anonymous?t.topics:(null!==(h=t.topics)&&void 0!==h?h:[]).slice(1);return Object.assign(Object.assign({},m),{returnValues:(0,i.decodeLog)([...null!==(f=p.inputs)&&void 0!==f?f:[]],t.data,g),event:p.name,signature:!p.anonymous&&t.topics&&0!==t.topics.length&&t.topics[0]?t.topics[0]:void 0,raw:{data:t.data,topics:t.topics}})}},7350:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.detectRawTransactionType=t.detectTransactionType=t.defaultTransactionTypeParser=void 0;const n=r(9634),o=r(9970),i=r(7345),s=r(5071),a={type:"object",properties:{accessList:{type:"null"},maxFeePerGas:{type:"null"},maxPriorityFeePerGas:{type:"null"}}},c={type:"object",properties:{maxFeePerGas:{type:"null"},maxPriorityFeePerGas:{type:"null"}}},u={type:"object",properties:{gasPrice:{type:"null"}}},d=(e,t,r)=>{try{i.validator.validateJSONSchema(e,t)}catch(e){if(e instanceof i.Web3ValidatorError)throw new s.InvalidPropertiesForTransactionTypeError(e.errors,r);throw e}};t.defaultTransactionTypeParser=e=>{var t,r;const s=e;if(!(0,i.isNullish)(s.type)){let e;switch(s.type){case"0x0":e=a;break;case"0x1":e=c;break;case"0x2":e=u;break;default:return(0,n.format)({format:"uint"},s.type,o.ETH_DATA_FORMAT)}return d(e,s,s.type),(0,n.format)({format:"uint"},s.type,o.ETH_DATA_FORMAT)}if(!(0,i.isNullish)(s.maxFeePerGas)||!(0,i.isNullish)(s.maxPriorityFeePerGas))return d(u,s,"0x2"),"0x2";if(!(0,i.isNullish)(s.accessList))return d(c,s,"0x1"),"0x1";const l=null!==(t=s.hardfork)&&void 0!==t?t:null===(r=s.common)||void 0===r?void 0:r.hardfork;if(!(0,i.isNullish)(l)){const e=Object.keys(o.HardforksOrdered).indexOf(l);if(e>=Object.keys(o.HardforksOrdered).indexOf("london"))return(0,i.isNullish)(s.gasPrice)?"0x2":"0x0";if(e===Object.keys(o.HardforksOrdered).indexOf("berlin"))return"0x0"}return(0,i.isNullish)(s.gasPrice)?void 0:(d(a,s,"0x0"),"0x0")},t.detectTransactionType=(e,r)=>{var n;return(null!==(n=null==r?void 0:r.transactionTypeParser)&&void 0!==n?n:t.defaultTransactionTypeParser)(e)},t.detectRawTransactionType=e=>e[0]>127?"0x0":(0,n.toHex)(e[0])},5140:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.formatTransaction=void 0;const n=r(9970),o=r(7345),i=r(9634),s=r(5071),a=r(1922);t.formatTransaction=function(e,t=n.DEFAULT_RETURN_FORMAT,r={transactionSchema:a.transactionInfoSchema,fillInputAndData:!1}){var c,u;let d=(0,i.mergeDeep)({},e);if((0,o.isNullish)(null==e?void 0:e.common)||(d.common=Object.assign({},e.common),(0,o.isNullish)(null===(c=e.common)||void 0===c?void 0:c.customChain)||(d.common.customChain=Object.assign({},e.common.customChain))),d=(0,i.format)(null!==(u=r.transactionSchema)&&void 0!==u?u:a.transactionInfoSchema,d,t),!(0,o.isNullish)(d.data)&&!(0,o.isNullish)(d.input)&&(0,i.toHex)(d.data)!==(0,i.toHex)(d.input))throw new s.TransactionDataAndInputError({data:(0,i.bytesToHex)(d.data),input:(0,i.bytesToHex)(d.input)});return r.fillInputAndData&&((0,o.isNullish)(d.data)?(0,o.isNullish)(d.input)||(d.data=d.input):d.input=d.data),(0,o.isNullish)(d.gasLimit)||(d.gas=d.gasLimit,delete d.gasLimit),d}},4429:function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.getRevertReason=t.parseTransactionError=void 0;const o=r(5071),i=r(8381),s=r(3222);t.parseTransactionError=(e,t)=>{var r,n,s,a,c;if(e instanceof o.ContractExecutionError&&e.cause instanceof o.Eip838ExecutionError){if(void 0!==t){const o=t.filter((e=>(0,i.isAbiErrorFragment)(e)));return(0,i.decodeContractErrorData)(o,e.cause),{reason:e.cause.message,signature:null===(r=e.cause.data)||void 0===r?void 0:r.slice(0,10),data:null===(n=e.cause.data)||void 0===n?void 0:n.substring(10),customErrorName:e.cause.errorName,customErrorDecodedSignature:e.cause.errorSignature,customErrorArguments:e.cause.errorArgs}}return{reason:e.cause.message,signature:null===(s=e.cause.data)||void 0===s?void 0:s.slice(0,10),data:null===(a=e.cause.data)||void 0===a?void 0:a.substring(10)}}if(e instanceof o.InvalidResponseError&&!Array.isArray(null===(c=e.cause)||void 0===c?void 0:c.errors)&&void 0!==e.cause)return e.cause.message;throw e},t.getRevertReason=function(e,r,o,i=e.defaultReturnFormat){return n(this,void 0,void 0,(function*(){try{return void(yield(0,s.call)(e,r,e.defaultBlock,i))}catch(e){return(0,t.parseTransactionError)(e,o)}}))}},1882:function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.getTransactionError=void 0;const o=r(5071),i=r(4429);t.getTransactionError=function(e,t,r,s,a,c){return n(this,void 0,void 0,(function*(){let n,u=c;if(void 0===u&&(void 0!==s?u=(0,i.parseTransactionError)(s):e.handleRevert&&void 0!==t&&(u=yield(0,i.getRevertReason)(e,t,a))),void 0===u)n=new o.TransactionRevertedWithoutReasonError(r);else if("string"==typeof u)n=new o.TransactionRevertInstructionError(u,void 0,r);else if(void 0!==u.customErrorName&&void 0!==u.customErrorDecodedSignature&&void 0!==u.customErrorArguments){const e=u;n=new o.TransactionRevertWithCustomError(e.reason,e.customErrorName,e.customErrorDecodedSignature,e.customErrorArguments,e.signature,r,e.data)}else n=new o.TransactionRevertInstructionError(u.reason,u.signature,r,u.data);return n}))}},8736:function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.getTransactionGasPricing=void 0;const o=r(9970),i=r(7345),s=r(5071),a=r(9634),c=r(3222),u=r(223);t.getTransactionGasPricing=function(e,t,r){return n(this,void 0,void 0,(function*(){const d=(0,u.getTransactionType)(e,t);if(!(0,i.isNullish)(d)){if(d.startsWith("-"))throw new s.UnsupportedTransactionTypeError(d);if(Number(d)<0||Number(d)>127)throw new s.UnsupportedTransactionTypeError(d);if((0,i.isNullish)(e.gasPrice)&&("0x0"===d||"0x1"===d))return{gasPrice:yield(0,c.getGasPrice)(t,r),maxPriorityFeePerGas:void 0,maxFeePerGas:void 0};if("0x2"===d)return Object.assign({gasPrice:void 0},yield function(e,t,r){var u,d,l,h;return n(this,void 0,void 0,(function*(){const n=yield(0,c.getBlock)(t,t.defaultBlock,!1,o.ETH_DATA_FORMAT);if((0,i.isNullish)(n.baseFeePerGas))throw new s.Eip1559NotSupportedError;let f;if((0,i.isNullish)(e.gasPrice)&&BigInt(n.baseFeePerGas)===BigInt(0)&&(f=yield(0,c.getGasPrice)(t,r)),!(0,i.isNullish)(e.gasPrice)||!(0,i.isNullish)(f)){const t=(0,a.format)({format:"uint"},null!==(u=e.gasPrice)&&void 0!==u?u:f,r);return{maxPriorityFeePerGas:t,maxFeePerGas:t}}return{maxPriorityFeePerGas:(0,a.format)({format:"uint"},null!==(d=e.maxPriorityFeePerGas)&&void 0!==d?d:t.defaultMaxPriorityFeePerGas,r),maxFeePerGas:(0,a.format)({format:"uint"},null!==(l=e.maxFeePerGas)&&void 0!==l?l:BigInt(n.baseFeePerGas)*BigInt(2)+BigInt(null!==(h=e.maxPriorityFeePerGas)&&void 0!==h?h:t.defaultMaxPriorityFeePerGas),r)}}))}(e,t,r))}}))}},1258:function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.prepareTransactionForSigning=void 0;const o=r(9970),i=r(9634),s=r(9247),a=r(7345),c=r(8650),u=r(5140),d=r(223);t.prepareTransactionForSigning=(e,t,r,l=!1,h=!0)=>n(void 0,void 0,void 0,(function*(){const n=yield(0,d.transactionBuilder)({transaction:e,web3Context:t,privateKey:r,fillGasPrice:l,fillGasLimit:h}),f=(0,u.formatTransaction)(n,o.ETH_DATA_FORMAT);return(0,c.validateTransactionForSigning)(f),s.TransactionFactory.fromTxData((e=>{var t,r;return{nonce:e.nonce,gasPrice:e.gasPrice,gasLimit:null!==(t=e.gasLimit)&&void 0!==t?t:e.gas,to:e.to,value:e.value,data:null!==(r=e.data)&&void 0!==r?r:e.input,type:e.type,chainId:e.chainId,accessList:e.accessList,maxPriorityFeePerGas:e.maxPriorityFeePerGas,maxFeePerGas:e.maxFeePerGas}})(f),((e,t)=>{var r,n,o,c,u,d,l,h,f,p,m,g,y,v,b,E,_,A;let T;if(((0,a.isNullish)(e.chain)||(0,a.isNullish)(e.hardfork))&&(0,a.isNullish)(e.common))t.defaultCommon?(T=Object.assign({},t.defaultCommon),(0,a.isNullish)(T.hardfork)&&(T.hardfork=null!==(r=e.hardfork)&&void 0!==r?r:t.defaultHardfork),(0,a.isNullish)(T.baseChain)&&(T.baseChain=t.defaultChain)):T=s.Common.custom({name:"custom-network",chainId:(0,i.toNumber)(e.chainId),networkId:(0,a.isNullish)(e.networkId)?void 0:(0,i.toNumber)(e.networkId),defaultHardfork:null!==(n=e.hardfork)&&void 0!==n?n:t.defaultHardfork},{baseChain:t.defaultChain});else{const r=null!==(d=null!==(u=null===(c=null===(o=null==e?void 0:e.common)||void 0===o?void 0:o.customChain)||void 0===c?void 0:c.name)&&void 0!==u?u:e.chain)&&void 0!==d?d:"custom-network",n=(0,i.toNumber)(null!==(f=null===(h=null===(l=null==e?void 0:e.common)||void 0===l?void 0:l.customChain)||void 0===h?void 0:h.chainId)&&void 0!==f?f:null==e?void 0:e.chainId),a=(0,i.toNumber)(null!==(g=null===(m=null===(p=null==e?void 0:e.common)||void 0===p?void 0:p.customChain)||void 0===m?void 0:m.networkId)&&void 0!==g?g:null==e?void 0:e.networkId),w=null!==(b=null!==(v=null===(y=null==e?void 0:e.common)||void 0===y?void 0:y.hardfork)&&void 0!==v?v:null==e?void 0:e.hardfork)&&void 0!==b?b:t.defaultHardfork,I=null!==(A=null!==(_=null===(E=e.common)||void 0===E?void 0:E.baseChain)&&void 0!==_?_:e.chain)&&void 0!==A?A:t.defaultChain;n&&a&&r&&(T=s.Common.custom({name:r,chainId:n,networkId:a,defaultHardfork:w},{baseChain:I}))}return{common:T}})(f,t))}))},4659:function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.rejectIfBlockTimeout=void 0;const o=r(9634),i=r(5071),s=r(9326),a=r(3222);function c(e,t,r){const c=e.transactionPollingInterval,[u,d]=(0,o.rejectIfConditionAtInterval)((()=>n(this,void 0,void 0,(function*(){let n;try{n=yield(0,a.getBlockNumber)(e,s.NUMBER_DATA_FORMAT)}catch(e){return void console.warn("An error happen while trying to get the block number",e)}const o=n-t;if(o>=e.transactionBlockTimeout)return new i.TransactionBlockTimeoutError({starterBlockNumber:t,numberOfBlocks:o,transactionHash:r})}))),c);return[d,{clean:()=>{clearInterval(u)}}]}t.rejectIfBlockTimeout=function(e,t){var r,o;return n(this,void 0,void 0,(function*(){const{provider:u}=e.requestManager;let d;const l=yield(0,a.getBlockNumber)(e,s.NUMBER_DATA_FORMAT);return d=(null===(o=(r=u).supportsSubscriptions)||void 0===o?void 0:o.call(r))&&e.enableExperimentalFeatures.useSubscriptionWhenCheckingBlockTimeout?yield function(e,t,r){var o;return n(this,void 0,void 0,(function*(){let n,s,a=!0;function u(n,o){o&&console.warn("error happened at subscription. So revert to polling...",o),s.clean(),a=!1;const[i,u]=c(e,t,r);s.clean=u.clean,i.catch((e=>n(e)))}try{n=yield null===(o=e.subscriptionManager)||void 0===o?void 0:o.subscribe("newHeads"),s={clean:()=>{var t;n.id&&(null===(t=e.subscriptionManager)||void 0===t||t.removeSubscription(n).then((()=>{})).catch((()=>{})))}}}catch(n){return c(e,t,r)}return[new Promise(((o,s)=>{try{n.on("data",(n=>{if(a=!1,!(null==n?void 0:n.number))return;const o=Number(BigInt(n.number)-BigInt(t));o>=e.transactionBlockTimeout&&s(new i.TransactionBlockTimeoutError({starterBlockNumber:t,numberOfBlocks:o,transactionHash:r}))})),n.on("error",(e=>{u(s,e)}))}catch(e){u(s,e)}setTimeout((()=>{a&&u(s)}),1e3*e.blockHeaderTimeout)})),s]}))}(e,l,t):c(e,l,t),d}))}},7322:function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.SendTxHelper=void 0;const o=r(9970),i=r(7345),s=r(5071),a=r(1181),c=r(8736),u=r(8425),d=r(2117),l=r(9326),h=r(1882),f=r(4429),p=r(7543);t.SendTxHelper=class{constructor({options:e,web3Context:t,promiEvent:r,returnFormat:n}){this.options={checkRevertBeforeSending:!0},this.options=e,this.web3Context=t,this.promiEvent=r,this.returnFormat=n}getReceiptWithEvents(e){var t,r;const n=Object.assign({},null!=e?e:{});if((null===(t=this.options)||void 0===t?void 0:t.contractAbi)&&n.logs&&n.logs.length>0){n.events={};for(const e of n.logs){const t=(0,p.decodeEventABI)(l.ALL_EVENTS_ABI,e,null===(r=this.options)||void 0===r?void 0:r.contractAbi,this.returnFormat);t.event&&(n.events[t.event]=t)}}return n}checkRevertBeforeSending(e){return n(this,void 0,void 0,(function*(){if(!1!==this.options.checkRevertBeforeSending){let t=e;(0,i.isNullish)(e.data)&&(0,i.isNullish)(e.input)&&(0,i.isNullish)(e.gas)&&(t=Object.assign(Object.assign({},e),{gas:21e3}));const r=yield(0,f.getRevertReason)(this.web3Context,t,this.options.contractAbi);if(void 0!==r)throw yield(0,h.getTransactionError)(this.web3Context,e,void 0,void 0,this.options.contractAbi,r)}}))}emitSending(e){this.promiEvent.listenerCount("sending")>0&&this.promiEvent.emit("sending",e)}populateGasPrice({transactionFormatted:e,transaction:t}){var r;return n(this,void 0,void 0,(function*(){let n=e;return!(null===(r=this.options)||void 0===r?void 0:r.ignoreGasPricing)&&(0,i.isNullish)(e.gasPrice)&&((0,i.isNullish)(t.maxPriorityFeePerGas)||(0,i.isNullish)(t.maxFeePerGas))&&(n=Object.assign(Object.assign({},e),yield(0,c.getTransactionGasPricing)(e,this.web3Context,o.ETH_DATA_FORMAT))),n}))}signAndSend({wallet:e,tx:t}){return n(this,void 0,void 0,(function*(){if(e){const r=yield e.signTransaction(t);return(0,u.trySendTransaction)(this.web3Context,(()=>n(this,void 0,void 0,(function*(){return a.ethRpcMethods.sendRawTransaction(this.web3Context.requestManager,r.rawTransaction)}))),r.transactionHash)}return(0,u.trySendTransaction)(this.web3Context,(()=>n(this,void 0,void 0,(function*(){return a.ethRpcMethods.sendTransaction(this.web3Context.requestManager,t)}))))}))}emitSent(e){this.promiEvent.listenerCount("sent")>0&&this.promiEvent.emit("sent",e)}emitTransactionHash(e){this.promiEvent.listenerCount("transactionHash")>0&&this.promiEvent.emit("transactionHash",e)}emitReceipt(e){this.promiEvent.listenerCount("receipt")>0&&this.promiEvent.emit("receipt",e)}handleError({error:e,tx:t}){var r;return n(this,void 0,void 0,(function*(){let n=e;return n instanceof s.ContractExecutionError&&this.web3Context.handleRevert&&(n=yield(0,h.getTransactionError)(this.web3Context,t,void 0,void 0,null===(r=this.options)||void 0===r?void 0:r.contractAbi)),(n instanceof s.InvalidResponseError||n instanceof s.ContractExecutionError||n instanceof s.TransactionRevertWithCustomError||n instanceof s.TransactionRevertedWithoutReasonError||n instanceof s.TransactionRevertInstructionError||n instanceof s.TransactionPollingTimeoutError)&&this.promiEvent.listenerCount("error")>0&&this.promiEvent.emit("error",n),n}))}emitConfirmation({receipt:e,transactionHash:t,customTransactionReceiptSchema:r}){this.promiEvent.listenerCount("confirmation")>0&&(0,d.watchTransactionForConfirmations)(this.web3Context,this.promiEvent,e,t,this.returnFormat,r)}handleResolve({receipt:e,tx:t}){var r,o,i;return n(this,void 0,void 0,(function*(){if(null===(r=this.options)||void 0===r?void 0:r.transactionResolver)return null===(o=this.options)||void 0===o?void 0:o.transactionResolver(e);if(e.status===BigInt(0)){const r=yield(0,h.getTransactionError)(this.web3Context,t,e,void 0,null===(i=this.options)||void 0===i?void 0:i.contractAbi);throw this.promiEvent.listenerCount("error")>0&&this.promiEvent.emit("error",r),r}return e}))}}},223:function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.transactionBuilder=t.defaultTransactionBuilder=t.getTransactionType=t.getTransactionNonce=t.getTransactionFromOrToAttr=void 0;const o=r(9970),i=r(9247),s=r(9820),a=r(7345),c=r(5071),u=r(9634),d=r(9326),l=r(3222),h=r(7350),f=r(1922),p=r(8736);function m(e){var r,i;return n(this,void 0,void 0,(function*(){let n=(0,u.format)(f.transactionSchema,e.transaction,e.web3Context.defaultReturnFormat);if((0,a.isNullish)(n.from)&&(n.from=(0,t.getTransactionFromOrToAttr)("from",e.web3Context,void 0,e.privateKey)),(0,a.isNullish)(n.nonce)&&(n.nonce=yield(0,t.getTransactionNonce)(e.web3Context,n.from,o.ETH_DATA_FORMAT)),(0,a.isNullish)(n.value)&&(n.value="0x0"),(0,a.isNullish)(n.data))(0,a.isNullish)(n.input)?n.input="0x":n.input.startsWith("0x")||(n.input=`0x${n.input}`);else{if(!(0,a.isNullish)(n.input)&&n.data!==n.input)throw new c.TransactionDataAndInputError({data:(0,u.bytesToHex)(n.data),input:(0,u.bytesToHex)(n.input)});n.data.startsWith("0x")||(n.data=`0x${n.data}`)}if((0,a.isNullish)(n.common)){if(e.web3Context.defaultCommon){const t=e.web3Context.defaultCommon,r=t.customChain.chainId,o=t.customChain.networkId,i=t.customChain.name;n.common=Object.assign(Object.assign({},t),{customChain:{chainId:r,networkId:o,name:i}})}(0,a.isNullish)(n.chain)&&(n.chain=e.web3Context.defaultChain),(0,a.isNullish)(n.hardfork)&&(n.hardfork=e.web3Context.defaultHardfork)}if((0,a.isNullish)(n.chainId)&&(0,a.isNullish)(null===(r=n.common)||void 0===r?void 0:r.customChain.chainId)&&(n.chainId=yield(0,l.getChainId)(e.web3Context,o.ETH_DATA_FORMAT)),(0,a.isNullish)(n.networkId)&&(n.networkId=null!==(i=e.web3Context.defaultNetworkId)&&void 0!==i?i:yield(0,s.getId)(e.web3Context,o.ETH_DATA_FORMAT)),(0,a.isNullish)(n.gasLimit)&&!(0,a.isNullish)(n.gas)&&(n.gasLimit=n.gas),n.type=(0,t.getTransactionType)(n,e.web3Context),!(0,a.isNullish)(n.accessList)||"0x1"!==n.type&&"0x2"!==n.type||(n.accessList=[]),e.fillGasPrice&&(n=Object.assign(Object.assign({},n),yield(0,p.getTransactionGasPricing)(n,e.web3Context,o.ETH_DATA_FORMAT))),(0,a.isNullish)(n.gas)&&(0,a.isNullish)(n.gasLimit)&&e.fillGasLimit){const t=yield(0,l.estimateGas)(e.web3Context,n,"latest",o.ETH_DATA_FORMAT);n=Object.assign(Object.assign({},n),{gas:(0,u.format)({format:"uint"},t,o.ETH_DATA_FORMAT)})}return n}))}t.getTransactionFromOrToAttr=(e,t,r,n)=>{if(void 0!==r&&e in r&&void 0!==r[e]){if("string"==typeof r[e]&&(0,a.isAddress)(r[e]))return r[e];if(!(0,a.isHexStrict)(r[e])&&(0,a.isNumber)(r[e])){if(t.wallet){const n=t.wallet.get((0,u.format)({format:"uint"},r[e],d.NUMBER_DATA_FORMAT));if(!(0,a.isNullish)(n))return n.address;throw new c.LocalWalletNotAvailableError}throw new c.LocalWalletNotAvailableError}throw"from"===e?new c.InvalidTransactionWithSender(r.from):new c.InvalidTransactionWithReceiver(r.to)}if("from"===e){if(!(0,a.isNullish)(n))return(0,i.privateKeyToAddress)(n);if(!(0,a.isNullish)(t.defaultAccount))return t.defaultAccount}},t.getTransactionNonce=(e,t,r=e.defaultReturnFormat)=>n(void 0,void 0,void 0,(function*(){if((0,a.isNullish)(t))throw new c.UnableToPopulateNonceError;return(0,l.getTransactionCount)(e,t,e.defaultBlock,r)})),t.getTransactionType=(e,t)=>{const r=(0,h.detectTransactionType)(e,t);return(0,a.isNullish)(r)?(0,a.isNullish)(t.defaultTransactionType)?void 0:(0,u.format)({format:"uint"},t.defaultTransactionType,o.ETH_DATA_FORMAT):r},t.defaultTransactionBuilder=m,t.transactionBuilder=e=>n(void 0,void 0,void 0,(function*(){var t;return(null!==(t=e.web3Context.transactionBuilder)&&void 0!==t?t:m)(Object.assign(Object.assign({},e),{transaction:e.transaction}))}))},8425:function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.trySendTransaction=void 0;const o=r(9634),i=r(5071),s=r(4659);t.trySendTransaction=function(e,t,r){return n(this,void 0,void 0,(function*(){const[n,a]=(0,o.rejectIfTimeout)(e.transactionSendTimeout,new i.TransactionSendTimeoutError({numberOfSeconds:e.transactionSendTimeout/1e3,transactionHash:r})),[c,u]=yield(0,s.rejectIfBlockTimeout)(e,r);try{return yield Promise.race([t(),a,c])}finally{clearTimeout(n),u.clean()}}))}},4745:function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.waitForTransactionReceipt=void 0;const o=r(5071),i=r(9634),s=r(4659),a=r(3222);t.waitForTransactionReceipt=function(e,t,r,c){var u;return n(this,void 0,void 0,(function*(){const d=null!==(u=e.transactionReceiptPollingInterval)&&void 0!==u?u:e.transactionPollingInterval,[l,h]=(0,i.pollTillDefinedAndReturnIntervalId)((()=>n(this,void 0,void 0,(function*(){try{return(null!=c?c:a.getTransactionReceipt)(e,t,r)}catch(e){return void console.warn("An error happen while trying to get the transaction receipt",e)}}))),d),[f,p]=(0,i.rejectIfTimeout)(e.transactionPollingTimeout,new o.TransactionPollingTimeoutError({numberOfSeconds:e.transactionPollingTimeout/1e3,transactionHash:t})),[m,g]=yield(0,s.rejectIfBlockTimeout)(e,t);try{return yield Promise.race([l,p,m])}finally{f&&clearTimeout(f),h&&clearInterval(h),g.clean()}}))}},8717:function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.watchTransactionByPolling=void 0;const o=r(9634),i=r(1181),s=r(1922);t.watchTransactionByPolling=({web3Context:e,transactionReceipt:t,transactionPromiEvent:r,customTransactionReceiptSchema:a,returnFormat:c})=>{var u;let d=1;const l=setInterval((()=>{n(void 0,void 0,void 0,(function*(){d>=e.transactionConfirmationBlocks&&clearInterval(l);const n=yield i.ethRpcMethods.getBlockByNumber(e.requestManager,(0,o.numberToHex)(BigInt(t.blockNumber)+BigInt(d)),!1);(null==n?void 0:n.hash)&&(d+=1,r.emit("confirmation",{confirmations:(0,o.format)({format:"uint"},d,c),receipt:(0,o.format)(null!=a?a:s.transactionReceiptSchema,t,c),latestBlockHash:(0,o.format)({format:"bytes32"},n.hash,c)}))}))}),null!==(u=e.transactionReceiptPollingInterval)&&void 0!==u?u:e.transactionPollingInterval)}},2539:function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.watchTransactionBySubscription=void 0;const o=r(9634),i=r(1922),s=r(8717);t.watchTransactionBySubscription=({web3Context:e,transactionReceipt:t,transactionPromiEvent:r,customTransactionReceiptSchema:a,returnFormat:c})=>{let u,d=!0;setImmediate((()=>{var l;null===(l=e.subscriptionManager)||void 0===l||l.subscribe("newHeads").then((l=>{l.on("data",(s=>n(void 0,void 0,void 0,(function*(){var n;if(d=!1,!(null==s?void 0:s.number)||u===(null==s?void 0:s.parentHash))return;u=null==s?void 0:s.parentHash;const h=BigInt(s.number)-BigInt(t.blockNumber)+BigInt(1);r.emit("confirmation",{confirmations:(0,o.format)({format:"uint"},h,c),receipt:(0,o.format)(null!=a?a:i.transactionReceiptSchema,t,c),latestBlockHash:(0,o.format)({format:"bytes32"},s.parentHash,c)}),h>=e.transactionConfirmationBlocks&&(yield null===(n=e.subscriptionManager)||void 0===n?void 0:n.removeSubscription(l))})))),l.on("error",(()=>n(void 0,void 0,void 0,(function*(){var n;yield null===(n=e.subscriptionManager)||void 0===n?void 0:n.removeSubscription(l),d=!1,(0,s.watchTransactionByPolling)({web3Context:e,transactionReceipt:t,transactionPromiEvent:r,customTransactionReceiptSchema:a,returnFormat:c})}))))})).catch((()=>{d=!1,(0,s.watchTransactionByPolling)({web3Context:e,transactionReceipt:t,customTransactionReceiptSchema:a,transactionPromiEvent:r,returnFormat:c})}))})),setTimeout((()=>{d&&(0,s.watchTransactionByPolling)({web3Context:e,transactionReceipt:t,transactionPromiEvent:r,returnFormat:c})}),1e3*e.blockHeaderTimeout)}},2117:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.watchTransactionForConfirmations=void 0;const n=r(9634),o=r(7345),i=r(5071),s=r(1922),a=r(8717),c=r(2539);t.watchTransactionForConfirmations=function(e,t,r,u,d,l){if((0,o.isNullish)(r)||(0,o.isNullish)(r.blockHash))throw new i.TransactionMissingReceiptOrBlockHashError({receipt:r,blockHash:(0,n.format)({format:"bytes32"},null==r?void 0:r.blockHash,d),transactionHash:(0,n.format)({format:"bytes32"},u,d)});if(!r.blockNumber)throw new i.TransactionReceiptMissingBlockNumberError({receipt:r});t.emit("confirmation",{confirmations:(0,n.format)({format:"uint"},1,d),receipt:(0,n.format)(null!=l?l:s.transactionReceiptSchema,r,d),latestBlockHash:(0,n.format)({format:"bytes32"},r.blockHash,d)});const h=e.requestManager.provider;h&&"supportsSubscriptions"in h&&h.supportsSubscriptions()?(0,c.watchTransactionBySubscription)({web3Context:e,transactionReceipt:r,transactionPromiEvent:t,customTransactionReceiptSchema:l,returnFormat:d}):(0,a.watchTransactionByPolling)({web3Context:e,transactionReceipt:r,transactionPromiEvent:t,customTransactionReceiptSchema:l,returnFormat:d})}},8650:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.validateTransactionForSigning=t.validateGas=t.validateFeeMarketGas=t.validateLegacyGas=t.validateHardfork=t.validateBaseChain=t.validateChainInfo=t.validateCustomChainInfo=t.validateTransactionCall=t.isTransactionCall=t.validateTransactionWithSender=t.isTransactionWithSender=t.isTransactionLegacyUnsigned=t.isTransaction2930Unsigned=t.isTransaction1559Unsigned=t.isAccessList=t.isAccessListEntry=t.isBaseTransaction=void 0;const n=r(9970),o=r(7345),i=r(5071),s=r(5140);function a(e){return!(!(0,o.isNullish)(e.to)&&!(0,o.isAddress)(e.to)||!(0,o.isHexStrict)(e.type)&&!(0,o.isNullish)(e.type)&&2!==e.type.length||!(0,o.isHexStrict)(e.nonce)||!(0,o.isHexStrict)(e.gas)||!(0,o.isHexStrict)(e.value)||!(0,o.isHexStrict)(e.input)||e.chainId&&!(0,o.isHexStrict)(e.chainId))}function c(e){return!(!(0,o.isNullish)(e.address)&&!(0,o.isAddress)(e.address)||!(0,o.isNullish)(e.storageKeys)&&!e.storageKeys.every((e=>(0,o.isHexString32Bytes)(e))))}function u(e){return!(!Array.isArray(e)||!e.every((e=>c(e))))}function d(e){return!!(a(e)&&(0,o.isHexStrict)(e.maxFeePerGas)&&(0,o.isHexStrict)(e.maxPriorityFeePerGas)&&u(e.accessList))}function l(e){return!!a(e)&&!!(0,o.isHexStrict)(e.gasPrice)&&!!u(e.accessList)}function h(e){return!!a(e)&&!!(0,o.isHexStrict)(e.gasPrice)}function f(e){return!!(0,o.isAddress)(e.from)&&!!a(e)&&!!(d(e)||l(e)||h(e))}function p(e){return!(!(0,o.isNullish)(e.from)&&!(0,o.isAddress)(e.from)||!(0,o.isAddress)(e.to)||!(0,o.isNullish)(e.gas)&&!(0,o.isHexStrict)(e.gas)||!(0,o.isNullish)(e.gasPrice)&&!(0,o.isHexStrict)(e.gasPrice)||!(0,o.isNullish)(e.value)&&!(0,o.isHexStrict)(e.value)||!(0,o.isNullish)(e.data)&&!(0,o.isHexStrict)(e.data)||!(0,o.isNullish)(e.input)&&!(0,o.isHexStrict)(e.input)||!(0,o.isNullish)(e.type)||d(e)||l(e))}t.isBaseTransaction=a,t.isAccessListEntry=c,t.isAccessList=u,t.isTransaction1559Unsigned=d,t.isTransaction2930Unsigned=l,t.isTransactionLegacyUnsigned=h,t.isTransactionWithSender=f,t.validateTransactionWithSender=function(e){if(!f(e))throw new i.InvalidTransactionWithSender(e)},t.isTransactionCall=p,t.validateTransactionCall=function(e){if(!p(e))throw new i.InvalidTransactionCall(e)},t.validateCustomChainInfo=e=>{if(!(0,o.isNullish)(e.common)){if((0,o.isNullish)(e.common.customChain))throw new i.MissingCustomChainError;if((0,o.isNullish)(e.common.customChain.chainId))throw new i.MissingCustomChainIdError;if(!(0,o.isNullish)(e.chainId)&&e.chainId!==e.common.customChain.chainId)throw new i.ChainIdMismatchError({txChainId:e.chainId,customChainId:e.common.customChain.chainId})}},t.validateChainInfo=e=>{if(!(0,o.isNullish)(e.common)&&!(0,o.isNullish)(e.chain)&&!(0,o.isNullish)(e.hardfork))throw new i.CommonOrChainAndHardforkError;if(!(0,o.isNullish)(e.chain)&&(0,o.isNullish)(e.hardfork)||!(0,o.isNullish)(e.hardfork)&&(0,o.isNullish)(e.chain))throw new i.MissingChainOrHardforkError({chain:e.chain,hardfork:e.hardfork})},t.validateBaseChain=e=>{if(!(0,o.isNullish)(e.common)&&!(0,o.isNullish)(e.common.baseChain)&&!(0,o.isNullish)(e.chain)&&e.chain!==e.common.baseChain)throw new i.ChainMismatchError({txChain:e.chain,baseChain:e.common.baseChain})},t.validateHardfork=e=>{if(!(0,o.isNullish)(e.common)&&!(0,o.isNullish)(e.common.hardfork)&&!(0,o.isNullish)(e.hardfork)&&e.hardfork!==e.common.hardfork)throw new i.HardforkMismatchError({txHardfork:e.hardfork,commonHardfork:e.common.hardfork})},t.validateLegacyGas=e=>{if((0,o.isNullish)(e.gas)||!(0,o.isUInt)(e.gas)||(0,o.isNullish)(e.gasPrice)||!(0,o.isUInt)(e.gasPrice))throw new i.InvalidGasOrGasPrice({gas:e.gas,gasPrice:e.gasPrice});if(!(0,o.isNullish)(e.maxFeePerGas)||!(0,o.isNullish)(e.maxPriorityFeePerGas))throw new i.UnsupportedFeeMarketError({maxFeePerGas:e.maxFeePerGas,maxPriorityFeePerGas:e.maxPriorityFeePerGas})},t.validateFeeMarketGas=e=>{if(!(0,o.isNullish)(e.gasPrice)&&"0x2"===e.type)throw new i.Eip1559GasPriceError(e.gasPrice);if("0x0"===e.type||"0x1"===e.type)throw new i.UnsupportedFeeMarketError({maxFeePerGas:e.maxFeePerGas,maxPriorityFeePerGas:e.maxPriorityFeePerGas});if((0,o.isNullish)(e.maxFeePerGas)||!(0,o.isUInt)(e.maxFeePerGas)||(0,o.isNullish)(e.maxPriorityFeePerGas)||!(0,o.isUInt)(e.maxPriorityFeePerGas))throw new i.InvalidMaxPriorityFeePerGasOrMaxFeePerGas({maxPriorityFeePerGas:e.maxPriorityFeePerGas,maxFeePerGas:e.maxFeePerGas})},t.validateGas=e=>{const r=!(0,o.isNullish)(e.gas)||!(0,o.isNullish)(e.gasLimit),n=r&&!(0,o.isNullish)(e.gasPrice),s=r&&!(0,o.isNullish)(e.maxPriorityFeePerGas)&&!(0,o.isNullish)(e.maxFeePerGas);if(!n&&!s)throw new i.MissingGasError({gas:e.gas,gasPrice:e.gasPrice,maxPriorityFeePerGas:e.maxPriorityFeePerGas,maxFeePerGas:e.maxFeePerGas});if(n&&s)throw new i.TransactionGasMismatchError({gas:e.gas,gasPrice:e.gasPrice,maxPriorityFeePerGas:e.maxPriorityFeePerGas,maxFeePerGas:e.maxFeePerGas});(n?t.validateLegacyGas:t.validateFeeMarketGas)(e),(!(0,o.isNullish)(e.type)&&e.type>"0x1"?t.validateFeeMarketGas:t.validateLegacyGas)(e)},t.validateTransactionForSigning=(e,r)=>{if(!(0,o.isNullish)(r))return void r(e);if("object"!=typeof e||(0,o.isNullish)(e))throw new i.InvalidTransactionObjectError(e);(0,t.validateCustomChainInfo)(e),(0,t.validateChainInfo)(e),(0,t.validateBaseChain)(e),(0,t.validateHardfork)(e);const a=(0,s.formatTransaction)(e,n.ETH_DATA_FORMAT);if((0,t.validateGas)(a),(0,o.isNullish)(a.nonce)||(0,o.isNullish)(a.chainId)||a.nonce.startsWith("-")||a.chainId.startsWith("-"))throw new i.InvalidNonceOrChainIdError({nonce:e.nonce,chainId:e.chainId})}},1435:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r);var o=Object.getOwnPropertyDescriptor(t,r);o&&!("get"in o?!t.__esModule:o.writable||o.configurable)||(o={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,o)}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),o=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),i=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var r in e)"default"!==r&&Object.prototype.hasOwnProperty.call(e,r)&&n(t,e,r);return o(t,e),t},s=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.Web3Eth=t.registeredSubscriptions=void 0;const a=r(9970),c=r(6527),u=r(5071),d=r(9634),l=r(1181),h=i(r(3222)),f=r(7460);t.registeredSubscriptions={logs:f.LogsSubscription,newPendingTransactions:f.NewPendingTransactionsSubscription,newHeads:f.NewHeadsSubscription,syncing:f.SyncingSubscription,pendingTransactions:f.NewPendingTransactionsSubscription,newBlockHeaders:f.NewHeadsSubscription};class p extends c.Web3Context{constructor(e){"string"==typeof e||(0,c.isSupportedProvider)(e)?super({provider:e,registeredSubscriptions:t.registeredSubscriptions}):e.registeredSubscriptions?super(e):(super(Object.assign(Object.assign({},e),{registeredSubscriptions:t.registeredSubscriptions})),this.getFeeData=this.calculateFeeData)}setTransactionMiddleware(e){this.transactionMiddleware=e}getTransactionMiddleware(){return this.transactionMiddleware}getProtocolVersion(){return s(this,void 0,void 0,(function*(){return l.ethRpcMethods.getProtocolVersion(this.requestManager)}))}isSyncing(){return s(this,void 0,void 0,(function*(){return l.ethRpcMethods.getSyncing(this.requestManager)}))}getCoinbase(){return s(this,void 0,void 0,(function*(){return l.ethRpcMethods.getCoinbase(this.requestManager)}))}isMining(){return s(this,void 0,void 0,(function*(){return l.ethRpcMethods.getMining(this.requestManager)}))}getHashrate(e){var t;return void 0===e&&(e=null!==(t=this.defaultReturnFormat)&&void 0!==t?t:a.DEFAULT_RETURN_FORMAT),s(this,void 0,void 0,(function*(){return this.getHashRate(e)}))}getHashRate(e=this.defaultReturnFormat){return s(this,void 0,void 0,(function*(){return h.getHashRate(this,e)}))}getGasPrice(e=this.defaultReturnFormat){return s(this,void 0,void 0,(function*(){return h.getGasPrice(this,e)}))}getMaxPriorityFeePerGas(e=this.defaultReturnFormat){return s(this,void 0,void 0,(function*(){return h.getMaxPriorityFeePerGas(this,e)}))}calculateFeeData(e=BigInt(2),t=d.ethUnitMap.Gwei){var r;return s(this,void 0,void 0,(function*(){const n=yield this.getBlock(void 0,!1),o=null!==(r=null==n?void 0:n.baseFeePerGas)&&void 0!==r?r:void 0;let i,s,a;try{i=yield this.getGasPrice()}catch(e){}try{s=yield this.getMaxPriorityFeePerGas()}catch(e){}return o&&(s=null!=s?s:t,a=o*e+s),{gasPrice:i,maxFeePerGas:a,maxPriorityFeePerGas:s,baseFeePerGas:o}}))}getAccounts(){var e;return s(this,void 0,void 0,(function*(){return(null!==(e=yield l.ethRpcMethods.getAccounts(this.requestManager))&&void 0!==e?e:[]).map((e=>(0,d.toChecksumAddress)(e)))}))}getBlockNumber(e=this.defaultReturnFormat){return s(this,void 0,void 0,(function*(){return h.getBlockNumber(this,e)}))}getBalance(e,t=this.defaultBlock,r=this.defaultReturnFormat){return s(this,void 0,void 0,(function*(){return h.getBalance(this,e,t,r)}))}getStorageAt(e,t,r=this.defaultBlock,n=this.defaultReturnFormat){return s(this,void 0,void 0,(function*(){return h.getStorageAt(this,e,t,r,n)}))}getCode(e,t=this.defaultBlock,r=this.defaultReturnFormat){return s(this,void 0,void 0,(function*(){return h.getCode(this,e,t,r)}))}getBlock(e=this.defaultBlock,t=!1,r=this.defaultReturnFormat){return s(this,void 0,void 0,(function*(){return h.getBlock(this,e,t,r)}))}getBlockTransactionCount(e=this.defaultBlock,t=this.defaultReturnFormat){return s(this,void 0,void 0,(function*(){return h.getBlockTransactionCount(this,e,t)}))}getBlockUncleCount(e=this.defaultBlock,t=this.defaultReturnFormat){return s(this,void 0,void 0,(function*(){return h.getBlockUncleCount(this,e,t)}))}getUncle(e=this.defaultBlock,t,r=this.defaultReturnFormat){return s(this,void 0,void 0,(function*(){return h.getUncle(this,e,t,r)}))}getTransaction(e,t=this.defaultReturnFormat){return s(this,void 0,void 0,(function*(){const r=yield h.getTransaction(this,e,t);if(!r)throw new u.TransactionNotFound;return r}))}getPendingTransactions(e=this.defaultReturnFormat){return s(this,void 0,void 0,(function*(){return h.getPendingTransactions(this,e)}))}getTransactionFromBlock(e=this.defaultBlock,t,r=this.defaultReturnFormat){return s(this,void 0,void 0,(function*(){return h.getTransactionFromBlock(this,e,t,r)}))}getTransactionReceipt(e,t=this.defaultReturnFormat){return s(this,void 0,void 0,(function*(){const r=yield h.getTransactionReceipt(this,e,t);if(!r)throw new u.TransactionNotFound;return r}))}getTransactionCount(e,t=this.defaultBlock,r=this.defaultReturnFormat){return s(this,void 0,void 0,(function*(){return h.getTransactionCount(this,e,t,r)}))}sendTransaction(e,t=this.defaultReturnFormat,r){return h.sendTransaction(this,e,t,r,this.transactionMiddleware)}sendSignedTransaction(e,t=this.defaultReturnFormat,r){return h.sendSignedTransaction(this,e,t,r)}sign(e,t,r=this.defaultReturnFormat){return s(this,void 0,void 0,(function*(){return h.sign(this,e,t,r)}))}signTransaction(e,t=this.defaultReturnFormat){return s(this,void 0,void 0,(function*(){return h.signTransaction(this,e,t)}))}call(e,t=this.defaultBlock,r=this.defaultReturnFormat){return s(this,void 0,void 0,(function*(){return h.call(this,e,t,r)}))}estimateGas(e,t=this.defaultBlock,r=this.defaultReturnFormat){return s(this,void 0,void 0,(function*(){return h.estimateGas(this,e,t,r)}))}getPastLogs(e,t=this.defaultReturnFormat){return s(this,void 0,void 0,(function*(){return h.getLogs(this,e,t)}))}getWork(){return s(this,void 0,void 0,(function*(){return l.ethRpcMethods.getWork(this.requestManager)}))}submitWork(e,t,r){return s(this,void 0,void 0,(function*(){return l.ethRpcMethods.submitWork(this.requestManager,e,t,r)}))}requestAccounts(){return s(this,void 0,void 0,(function*(){return l.ethRpcMethods.requestAccounts(this.requestManager)}))}getChainId(e=this.defaultReturnFormat){return s(this,void 0,void 0,(function*(){return h.getChainId(this,e)}))}getNodeInfo(){return s(this,void 0,void 0,(function*(){return l.ethRpcMethods.getNodeInfo(this.requestManager)}))}getProof(e,t,r=this.defaultBlock,n=this.defaultReturnFormat){return s(this,void 0,void 0,(function*(){return h.getProof(this,e,t,r,n)}))}getFeeHistory(e,t=this.defaultBlock,r,n=this.defaultReturnFormat){return s(this,void 0,void 0,(function*(){return h.getFeeHistory(this,e,t,r,n)}))}createAccessList(e,t=this.defaultBlock,r=this.defaultReturnFormat){return s(this,void 0,void 0,(function*(){return h.createAccessList(this,e,t,r)}))}signTypedData(e,t,r,n){var o;return void 0===r&&(r=!1),void 0===n&&(n=null!==(o=this.defaultReturnFormat)&&void 0!==o?o:a.DEFAULT_RETURN_FORMAT),s(this,void 0,void 0,(function*(){return h.signTypedData(this,e,t,r,n)}))}subscribe(e,t,r){var n,o;return void 0===r&&(r=null!==(n=this.defaultReturnFormat)&&void 0!==n?n:a.DEFAULT_RETURN_FORMAT),s(this,void 0,void 0,(function*(){const n=yield null===(o=this.subscriptionManager)||void 0===o?void 0:o.subscribe(e,t,r);return n instanceof f.LogsSubscription&&"logs"===e&&"object"==typeof t&&!(0,d.isNullish)(t.fromBlock)&&Number.isFinite(Number(t.fromBlock))&&setImmediate((()=>{this.getPastLogs(t).then((e=>{for(const t of e)n._processSubscriptionResult(t)})).catch((e=>{n._processSubscriptionError(e)}))})),n}))}static shouldClearSubscription({sub:e}){return!(e instanceof f.SyncingSubscription)}clearSubscriptions(e=!1){var t;return null===(t=this.subscriptionManager)||void 0===t?void 0:t.unsubscribe(e?p.shouldClearSubscription:void 0)}}t.Web3Eth=p},7460:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.SyncingSubscription=t.NewHeadsSubscription=t.NewPendingTransactionsSubscription=t.LogsSubscription=void 0;const n=r(9634),o=r(6527),i=r(1922);class s extends o.Web3Subscription{_buildSubscriptionParams(){return["logs",this.args]}formatSubscriptionResult(e){return(0,n.format)(i.logSchema,e,super.returnFormat)}}t.LogsSubscription=s;class a extends o.Web3Subscription{_buildSubscriptionParams(){return["newPendingTransactions"]}formatSubscriptionResult(e){return(0,n.format)({format:"string"},e,super.returnFormat)}}t.NewPendingTransactionsSubscription=a;class c extends o.Web3Subscription{_buildSubscriptionParams(){return["newHeads"]}formatSubscriptionResult(e){return(0,n.format)(i.blockHeaderSchema,e,super.returnFormat)}}t.NewHeadsSubscription=c;class u extends o.Web3Subscription{_buildSubscriptionParams(){return["syncing"]}_processSubscriptionResult(e){if("boolean"==typeof e)this.emit("changed",e);else{const t=Object.fromEntries(Object.entries(e.status).map((([e,t])=>[e.charAt(0).toLowerCase()+e.substring(1),t])));this.emit("changed",e.syncing),this.emit("data",(0,n.format)(i.syncSchema,t,super.returnFormat))}}}t.SyncingSubscription=u},9820:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r);var o=Object.getOwnPropertyDescriptor(t,r);o&&!("get"in o?!t.__esModule:o.writable||o.configurable)||(o={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,o)}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),o=this&&this.__exportStar||function(e,t){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(t,r)||n(t,e,r)};Object.defineProperty(t,"__esModule",{value:!0});const i=r(2491);o(r(2491),t),o(r(7961),t),t.default=i.Net},2491:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r);var o=Object.getOwnPropertyDescriptor(t,r);o&&!("get"in o?!t.__esModule:o.writable||o.configurable)||(o={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,o)}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),o=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),i=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var r in e)"default"!==r&&Object.prototype.hasOwnProperty.call(e,r)&&n(t,e,r);return o(t,e),t},s=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.Net=void 0;const a=r(6527),c=i(r(7961));class u extends a.Web3Context{getId(e=this.defaultReturnFormat){return s(this,void 0,void 0,(function*(){return c.getId(this,e)}))}getPeerCount(e=this.defaultReturnFormat){return s(this,void 0,void 0,(function*(){return c.getPeerCount(this,e)}))}isListening(){return s(this,void 0,void 0,(function*(){return c.isListening(this)}))}}t.Net=u},7961:function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.isListening=t.getPeerCount=t.getId=void 0;const o=r(9634),i=r(1181);t.getId=function(e,t){return n(this,void 0,void 0,(function*(){const r=yield i.netRpcMethods.getId(e.requestManager);return(0,o.format)({format:"uint"},r,t)}))},t.getPeerCount=function(e,t){return n(this,void 0,void 0,(function*(){const r=yield i.netRpcMethods.getPeerCount(e.requestManager);return(0,o.format)({format:"uint"},r,t)}))},t.isListening=e=>n(void 0,void 0,void 0,(function*(){return i.netRpcMethods.isListening(e.requestManager)}))},2636:function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))},o=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.HttpProvider=void 0;const i=o(r(6279)),s=r(9970),a=r(5071);class c extends s.Web3BaseProvider{constructor(e,t){if(super(),!c.validateClientUrl(e))throw new a.InvalidClientError(e);this.clientUrl=e,this.httpProviderOptions=t}static validateClientUrl(e){return"string"==typeof e&&/^http(s)?:\/\//i.test(e)}getStatus(){throw new a.MethodNotImplementedError}supportsSubscriptions(){return!1}request(e,t){var r;return n(this,void 0,void 0,(function*(){const n=Object.assign(Object.assign({},null===(r=this.httpProviderOptions)||void 0===r?void 0:r.providerOptions),t),o=yield(0,i.default)(this.clientUrl,Object.assign(Object.assign({},n),{method:"POST",headers:Object.assign(Object.assign({},n.headers),{"Content-Type":"application/json"}),body:JSON.stringify(e)}));if(!o.ok)throw new a.ResponseError(yield o.json());return yield o.json()}))}on(){throw new a.MethodNotImplementedError}removeListener(){throw new a.MethodNotImplementedError}once(){throw new a.MethodNotImplementedError}removeAllListeners(){throw new a.MethodNotImplementedError}connect(){throw new a.MethodNotImplementedError}disconnect(){throw new a.MethodNotImplementedError}reset(){throw new a.MethodNotImplementedError}reconnect(){throw new a.MethodNotImplementedError}}t.default=c,t.HttpProvider=c},1161:function(e,t,r){"use strict";var n=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.WebSocketProvider=void 0;const o=n(r(7475)),i=r(9634),s=r(5071);class a extends i.SocketProvider{constructor(e,t,r){super(e,t,r)}_validateProviderPath(e){return"string"==typeof e&&/^ws(s)?:\/\//i.test(e)}getStatus(){if(this._socketConnection&&!(0,i.isNullish)(this._socketConnection))switch(this._socketConnection.readyState){case this._socketConnection.CONNECTING:return"connecting";case this._socketConnection.OPEN:return"connected";default:return"disconnected"}return"disconnected"}_openSocketConnection(){this._socketConnection=new o.default(this._socketPath,void 0,this._socketOptions&&0===Object.keys(this._socketOptions).length?void 0:this._socketOptions)}_closeSocketConnection(e,t){var r;null===(r=this._socketConnection)||void 0===r||r.close(e,t)}_sendToSocket(e){var t;if("disconnected"===this.getStatus())throw new s.ConnectionNotOpenError;null===(t=this._socketConnection)||void 0===t||t.send(JSON.stringify(e))}_parseResponses(e){return this.chunkResponseParser.parseResponse(e.data)}_addSocketListeners(){var e,t,r,n;null===(e=this._socketConnection)||void 0===e||e.addEventListener("open",this._onOpenHandler),null===(t=this._socketConnection)||void 0===t||t.addEventListener("message",this._onMessageHandler),null===(r=this._socketConnection)||void 0===r||r.addEventListener("close",(e=>this._onCloseHandler(e))),null===(n=this._socketConnection)||void 0===n||n.addEventListener("error",this._onErrorHandler)}_removeSocketListeners(){var e,t,r;null===(e=this._socketConnection)||void 0===e||e.removeEventListener("message",this._onMessageHandler),null===(t=this._socketConnection)||void 0===t||t.removeEventListener("open",this._onOpenHandler),null===(r=this._socketConnection)||void 0===r||r.removeEventListener("close",this._onCloseHandler)}_onCloseEvent(e){var t;!this._reconnectOptions.autoReconnect||[1e3,1001].includes(e.code)&&e.wasClean?(this._clearQueues(e),this._removeSocketListeners(),this._onDisconnect(e.code,e.reason),null===(t=this._socketConnection)||void 0===t||t.removeEventListener("error",this._onErrorHandler)):this._reconnect()}}t.default=a,t.WebSocketProvider=a},9298:function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.getProof=t.getChainId=t.requestAccounts=t.getPendingTransactions=t.getFeeHistory=t.submitHashrate=t.submitWork=t.getWork=t.getLogs=t.getFilterLogs=t.getFilterChanges=t.uninstallFilter=t.newPendingTransactionFilter=t.newBlockFilter=t.newFilter=t.compileSerpent=t.compileLLL=t.compileSolidity=t.getCompilers=t.getUncleByBlockNumberAndIndex=t.getUncleByBlockHashAndIndex=t.getTransactionReceipt=t.getTransactionByBlockNumberAndIndex=t.getTransactionByBlockHashAndIndex=t.getTransactionByHash=t.getBlockByNumber=t.getBlockByHash=t.estimateGas=t.call=t.sendRawTransaction=t.sendTransaction=t.signTransaction=t.sign=t.getCode=t.getUncleCountByBlockNumber=t.getUncleCountByBlockHash=t.getBlockTransactionCountByNumber=t.getBlockTransactionCountByHash=t.getTransactionCount=t.getStorageAt=t.getBalance=t.getBlockNumber=t.getAccounts=t.getMaxPriorityFeePerGas=t.getGasPrice=t.getHashRate=t.getMining=t.getCoinbase=t.getSyncing=t.getProtocolVersion=void 0,t.signTypedData=t.createAccessList=t.getNodeInfo=void 0;const o=r(7345);t.getProtocolVersion=function(e){return n(this,void 0,void 0,(function*(){return e.send({method:"eth_protocolVersion",params:[]})}))},t.getSyncing=function(e){return n(this,void 0,void 0,(function*(){return e.send({method:"eth_syncing",params:[]})}))},t.getCoinbase=function(e){return n(this,void 0,void 0,(function*(){return e.send({method:"eth_coinbase",params:[]})}))},t.getMining=function(e){return n(this,void 0,void 0,(function*(){return e.send({method:"eth_mining",params:[]})}))},t.getHashRate=function(e){return n(this,void 0,void 0,(function*(){return e.send({method:"eth_hashrate",params:[]})}))},t.getGasPrice=function(e){return n(this,void 0,void 0,(function*(){return e.send({method:"eth_gasPrice",params:[]})}))},t.getMaxPriorityFeePerGas=function(e){return n(this,void 0,void 0,(function*(){return e.send({method:"eth_maxPriorityFeePerGas",params:[]})}))},t.getAccounts=function(e){return n(this,void 0,void 0,(function*(){return e.send({method:"eth_accounts",params:[]})}))},t.getBlockNumber=function(e){return n(this,void 0,void 0,(function*(){return e.send({method:"eth_blockNumber",params:[]})}))},t.getBalance=function(e,t,r){return n(this,void 0,void 0,(function*(){return o.validator.validate(["address","blockNumberOrTag"],[t,r]),e.send({method:"eth_getBalance",params:[t,r]})}))},t.getStorageAt=function(e,t,r,i){return n(this,void 0,void 0,(function*(){return o.validator.validate(["address","hex","blockNumberOrTag"],[t,r,i]),e.send({method:"eth_getStorageAt",params:[t,r,i]})}))},t.getTransactionCount=function(e,t,r){return n(this,void 0,void 0,(function*(){return o.validator.validate(["address","blockNumberOrTag"],[t,r]),e.send({method:"eth_getTransactionCount",params:[t,r]})}))},t.getBlockTransactionCountByHash=function(e,t){return n(this,void 0,void 0,(function*(){return o.validator.validate(["bytes32"],[t]),e.send({method:"eth_getBlockTransactionCountByHash",params:[t]})}))},t.getBlockTransactionCountByNumber=function(e,t){return n(this,void 0,void 0,(function*(){return o.validator.validate(["blockNumberOrTag"],[t]),e.send({method:"eth_getBlockTransactionCountByNumber",params:[t]})}))},t.getUncleCountByBlockHash=function(e,t){return n(this,void 0,void 0,(function*(){return o.validator.validate(["bytes32"],[t]),e.send({method:"eth_getUncleCountByBlockHash",params:[t]})}))},t.getUncleCountByBlockNumber=function(e,t){return n(this,void 0,void 0,(function*(){return o.validator.validate(["blockNumberOrTag"],[t]),e.send({method:"eth_getUncleCountByBlockNumber",params:[t]})}))},t.getCode=function(e,t,r){return n(this,void 0,void 0,(function*(){return o.validator.validate(["address","blockNumberOrTag"],[t,r]),e.send({method:"eth_getCode",params:[t,r]})}))},t.sign=function(e,t,r){return n(this,void 0,void 0,(function*(){return o.validator.validate(["address","hex"],[t,r]),e.send({method:"eth_sign",params:[t,r]})}))},t.signTransaction=function(e,t){return n(this,void 0,void 0,(function*(){return e.send({method:"eth_signTransaction",params:[t]})}))},t.sendTransaction=function(e,t){return n(this,void 0,void 0,(function*(){return e.send({method:"eth_sendTransaction",params:[t]})}))},t.sendRawTransaction=function(e,t){return n(this,void 0,void 0,(function*(){return o.validator.validate(["hex"],[t]),e.send({method:"eth_sendRawTransaction",params:[t]})}))},t.call=function(e,t,r){return n(this,void 0,void 0,(function*(){return o.validator.validate(["blockNumberOrTag"],[r]),e.send({method:"eth_call",params:[t,r]})}))},t.estimateGas=function(e,t,r){return n(this,void 0,void 0,(function*(){return o.validator.validate(["blockNumberOrTag"],[r]),e.send({method:"eth_estimateGas",params:[t,r]})}))},t.getBlockByHash=function(e,t,r){return n(this,void 0,void 0,(function*(){return o.validator.validate(["bytes32","bool"],[t,r]),e.send({method:"eth_getBlockByHash",params:[t,r]})}))},t.getBlockByNumber=function(e,t,r){return n(this,void 0,void 0,(function*(){return o.validator.validate(["blockNumberOrTag","bool"],[t,r]),e.send({method:"eth_getBlockByNumber",params:[t,r]})}))},t.getTransactionByHash=function(e,t){return n(this,void 0,void 0,(function*(){return o.validator.validate(["bytes32"],[t]),e.send({method:"eth_getTransactionByHash",params:[t]})}))},t.getTransactionByBlockHashAndIndex=function(e,t,r){return n(this,void 0,void 0,(function*(){return o.validator.validate(["bytes32","hex"],[t,r]),e.send({method:"eth_getTransactionByBlockHashAndIndex",params:[t,r]})}))},t.getTransactionByBlockNumberAndIndex=function(e,t,r){return n(this,void 0,void 0,(function*(){return o.validator.validate(["blockNumberOrTag","hex"],[t,r]),e.send({method:"eth_getTransactionByBlockNumberAndIndex",params:[t,r]})}))},t.getTransactionReceipt=function(e,t){return n(this,void 0,void 0,(function*(){return o.validator.validate(["bytes32"],[t]),e.send({method:"eth_getTransactionReceipt",params:[t]})}))},t.getUncleByBlockHashAndIndex=function(e,t,r){return n(this,void 0,void 0,(function*(){return o.validator.validate(["bytes32","hex"],[t,r]),e.send({method:"eth_getUncleByBlockHashAndIndex",params:[t,r]})}))},t.getUncleByBlockNumberAndIndex=function(e,t,r){return n(this,void 0,void 0,(function*(){return o.validator.validate(["blockNumberOrTag","hex"],[t,r]),e.send({method:"eth_getUncleByBlockNumberAndIndex",params:[t,r]})}))},t.getCompilers=function(e){return n(this,void 0,void 0,(function*(){return e.send({method:"eth_getCompilers",params:[]})}))},t.compileSolidity=function(e,t){return n(this,void 0,void 0,(function*(){return o.validator.validate(["string"],[t]),e.send({method:"eth_compileSolidity",params:[t]})}))},t.compileLLL=function(e,t){return n(this,void 0,void 0,(function*(){return o.validator.validate(["string"],[t]),e.send({method:"eth_compileLLL",params:[t]})}))},t.compileSerpent=function(e,t){return n(this,void 0,void 0,(function*(){return o.validator.validate(["string"],[t]),e.send({method:"eth_compileSerpent",params:[t]})}))},t.newFilter=function(e,t){return n(this,void 0,void 0,(function*(){return o.validator.validate(["filter"],[t]),e.send({method:"eth_newFilter",params:[t]})}))},t.newBlockFilter=function(e){return n(this,void 0,void 0,(function*(){return e.send({method:"eth_newBlockFilter",params:[]})}))},t.newPendingTransactionFilter=function(e){return n(this,void 0,void 0,(function*(){return e.send({method:"eth_newPendingTransactionFilter",params:[]})}))},t.uninstallFilter=function(e,t){return n(this,void 0,void 0,(function*(){return o.validator.validate(["hex"],[t]),e.send({method:"eth_uninstallFilter",params:[t]})}))},t.getFilterChanges=function(e,t){return n(this,void 0,void 0,(function*(){return o.validator.validate(["hex"],[t]),e.send({method:"eth_getFilterChanges",params:[t]})}))},t.getFilterLogs=function(e,t){return n(this,void 0,void 0,(function*(){return o.validator.validate(["hex"],[t]),e.send({method:"eth_getFilterLogs",params:[t]})}))},t.getLogs=function(e,t){return n(this,void 0,void 0,(function*(){return o.validator.validate(["filter"],[t]),e.send({method:"eth_getLogs",params:[t]})}))},t.getWork=function(e){return n(this,void 0,void 0,(function*(){return e.send({method:"eth_getWork",params:[]})}))},t.submitWork=function(e,t,r,i){return n(this,void 0,void 0,(function*(){return o.validator.validate(["bytes8","bytes32","bytes32"],[t,r,i]),e.send({method:"eth_submitWork",params:[t,r,i]})}))},t.submitHashrate=function(e,t,r){return n(this,void 0,void 0,(function*(){return o.validator.validate(["bytes32","bytes32"],[t,r]),e.send({method:"eth_submitHashrate",params:[t,r]})}))},t.getFeeHistory=function(e,t,r,i){return n(this,void 0,void 0,(function*(){o.validator.validate(["hex","blockNumberOrTag"],[t,r]);for(const e of i)o.validator.validate(["number"],[e]);return e.send({method:"eth_feeHistory",params:[t,r,i]})}))},t.getPendingTransactions=function(e){return n(this,void 0,void 0,(function*(){return e.send({method:"eth_pendingTransactions",params:[]})}))},t.requestAccounts=function(e){return n(this,void 0,void 0,(function*(){return e.send({method:"eth_requestAccounts",params:[]})}))},t.getChainId=function(e){return n(this,void 0,void 0,(function*(){return e.send({method:"eth_chainId",params:[]})}))},t.getProof=function(e,t,r,i){return n(this,void 0,void 0,(function*(){return o.validator.validate(["address","bytes32[]","blockNumberOrTag"],[t,r,i]),e.send({method:"eth_getProof",params:[t,r,i]})}))},t.getNodeInfo=function(e){return n(this,void 0,void 0,(function*(){return e.send({method:"web3_clientVersion",params:[]})}))},t.createAccessList=function(e,t,r){return n(this,void 0,void 0,(function*(){return o.validator.validate(["blockNumberOrTag"],[r]),e.send({method:"eth_createAccessList",params:[t,r]})}))},t.signTypedData=function(e,t,r,i=!1){return n(this,void 0,void 0,(function*(){return o.validator.validate(["address"],[t]),e.send({method:"eth_signTypedData"+(i?"":"_v4"),params:[t,r]})}))}},1181:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r);var o=Object.getOwnPropertyDescriptor(t,r);o&&!("get"in o?!t.__esModule:o.writable||o.configurable)||(o={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,o)}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),o=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),i=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var r in e)"default"!==r&&Object.prototype.hasOwnProperty.call(e,r)&&n(t,e,r);return o(t,e),t};Object.defineProperty(t,"__esModule",{value:!0}),t.personalRpcMethods=t.netRpcMethods=t.ethRpcMethods=void 0;const s=i(r(9298));t.ethRpcMethods=s;const a=i(r(9960));t.netRpcMethods=a;const c=i(r(6745));t.personalRpcMethods=c},9960:function(e,t){"use strict";var r=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.isListening=t.getPeerCount=t.getId=void 0,t.getId=function(e){return r(this,void 0,void 0,(function*(){return e.send({method:"net_version",params:[]})}))},t.getPeerCount=function(e){return r(this,void 0,void 0,(function*(){return e.send({method:"net_peerCount",params:[]})}))},t.isListening=function(e){return r(this,void 0,void 0,(function*(){return e.send({method:"net_listening",params:[]})}))}},6745:function(e,t){"use strict";var r=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.ecRecover=t.sign=t.signTransaction=t.sendTransaction=t.importRawKey=t.lockAccount=t.unlockAccount=t.newAccount=t.getAccounts=void 0,t.getAccounts=e=>r(void 0,void 0,void 0,(function*(){return e.send({method:"personal_listAccounts",params:[]})})),t.newAccount=(e,t)=>r(void 0,void 0,void 0,(function*(){return e.send({method:"personal_newAccount",params:[t]})})),t.unlockAccount=(e,t,n,o)=>r(void 0,void 0,void 0,(function*(){return e.send({method:"personal_unlockAccount",params:[t,n,o]})})),t.lockAccount=(e,t)=>r(void 0,void 0,void 0,(function*(){return e.send({method:"personal_lockAccount",params:[t]})})),t.importRawKey=(e,t,n)=>r(void 0,void 0,void 0,(function*(){return e.send({method:"personal_importRawKey",params:[t,n]})})),t.sendTransaction=(e,t,n)=>r(void 0,void 0,void 0,(function*(){return e.send({method:"personal_sendTransaction",params:[t,n]})})),t.signTransaction=(e,t,n)=>r(void 0,void 0,void 0,(function*(){return e.send({method:"personal_signTransaction",params:[t,n]})})),t.sign=(e,t,n,o)=>r(void 0,void 0,void 0,(function*(){return e.send({method:"personal_sign",params:[t,n,o]})})),t.ecRecover=(e,t,n)=>r(void 0,void 0,void 0,(function*(){return e.send({method:"personal_ecRecover",params:[t,n]})}))},294:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r);var o=Object.getOwnPropertyDescriptor(t,r);o&&!("get"in o?!t.__esModule:o.writable||o.configurable)||(o={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,o)}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),o=this&&this.__exportStar||function(e,t){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(t,r)||n(t,e,r)};Object.defineProperty(t,"__esModule",{value:!0}),t.mainnet=void 0;const i=r(8590);o(r(4740),t),o(r(8590),t),o(r(7214),t),t.mainnet=new i.QuickNodeProvider},4740:(e,t)=>{"use strict";var r,n;Object.defineProperty(t,"__esModule",{value:!0}),t.Network=t.Transport=void 0,(n=t.Transport||(t.Transport={})).HTTPS="https",n.WebSocket="wss",(r=t.Network||(t.Network={})).ETH_MAINNET="eth_mainnet",r.ETH_GOERLI="eth_goerli",r.ETH_SEPOLIA="eth_sepolia",r.ETH_HOLESKY="eth_holesky",r.POLYGON_MAINNET="polygon_mainnet",r.POLYGON_MUMBAI="polygon_mumbai",r.POLYGON_AMONY="polygon_amony",r.ARBITRUM_MAINNET="arbitrum_mainnet",r.ARBITRUM_SEPOLIA="arbitrum_sepolia",r.BASE_MAINNET="base_mainnet",r.BASE_SEPOLIA="base_sepolia",r.OPTIMISM_MAINNET="optimism_mainnet",r.OPTIMISM_SEPOLIA="optimism_sepolia",r.BNB_MAINNET="bnb_mainnet",r.BNB_TESTNET="bnb_testnet"},7214:function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))},o=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.Web3ExternalProvider=void 0;const i=o(r(2636)),s=o(r(1161)),a=r(9634),c=r(4740);class u extends a.Eip1193Provider{constructor(e,t,r,n){super(),this.transport=t,t===c.Transport.HTTPS?this.provider=new i.default(this.getRPCURL(e,t,r,n)):t===c.Transport.WebSocket&&(this.provider=new s.default(this.getRPCURL(e,t,r,n)))}request(e,t){return n(this,void 0,void 0,(function*(){return this.transport===c.Transport.HTTPS?this.provider.request(e,t):this.provider.request(e)}))}getStatus(){return this.provider.getStatus()}supportsSubscriptions(){return this.provider.supportsSubscriptions()}once(e,t){var r;(null===(r=this.provider)||void 0===r?void 0:r.once)&&this.provider.once(e,t)}removeAllListeners(e){var t;(null===(t=this.provider)||void 0===t?void 0:t.removeAllListeners)&&this.provider.removeAllListeners(e)}connect(){var e;(null===(e=this.provider)||void 0===e?void 0:e.connect)&&this.provider.connect()}disconnect(e,t){var r;(null===(r=this.provider)||void 0===r?void 0:r.disconnect)&&this.provider.disconnect(e,t)}reset(){var e;(null===(e=this.provider)||void 0===e?void 0:e.reset)&&this.provider.reset()}on(e,t){this.provider&&this.provider.on(e,t)}removeListener(e,t){this.provider&&this.provider.removeListener(e,t)}}t.Web3ExternalProvider=u},8590:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.QuickNodeProvider=void 0;const n=r(4740),o=r(7214),i=e=>void 0!==e&&e.trim().length>0;class s extends o.Web3ExternalProvider{constructor(e=n.Network.ETH_MAINNET,t=n.Transport.HTTPS,r="",o=""){super(e,t,r,o)}getRPCURL(e,t,r,o){let s="",a="";switch(e){case n.Network.ETH_MAINNET:s=i(o)?o:"powerful-holy-bush.quiknode.pro",a=i(r)?r:"3240624a343867035925ff7561eb60dfdba2a668";break;case n.Network.ETH_SEPOLIA:s=i(o)?o:"dimensional-fabled-glitter.ethereum-sepolia.quiknode.pro",a=i(r)?r:"382a3b5a4b938f2d6e8686c19af4b22921fde2cd";break;case n.Network.ETH_HOLESKY:s=i(o)?o:"yolo-morning-card.ethereum-holesky.quiknode.pro",a=i(r)?r:"481ebe70638c4dcf176af617a16d02ab866b9af9";break;case n.Network.ARBITRUM_MAINNET:s=i(o)?o:"autumn-divine-dinghy.arbitrum-mainnet.quiknode.pro",a=i(r)?r:"a5d7bfbf60b5ae9ce3628e53d69ef50d529e9a8c";break;case n.Network.ARBITRUM_SEPOLIA:s=i(o)?o:"few-patient-pond.arbitrum-sepolia.quiknode.pro",a=i(r)?r:"3be985450970628c860b959c65cd2642dcafe53c";break;case n.Network.BNB_MAINNET:s=i(o)?o:"purple-empty-reel.bsc.quiknode.pro",a=i(r)?r:"ebf6c532961e21f092ff2facce1ec4c89c540158";break;case n.Network.BNB_TESTNET:s=i(o)?o:"floral-rough-scion.bsc-testnet.quiknode.pro",a=i(r)?r:"5b297e5acff5f81f4c37ebf6f235f7299b6f9d28";break;case n.Network.POLYGON_MAINNET:s=i(o)?o:"small-chaotic-moon.matic.quiknode.pro",a=i(r)?r:"847569f8a017e84d985e10d0f44365d965a951f1";break;case n.Network.POLYGON_AMONY:s=i(o)?o:"prettiest-side-shape.matic-amoy.quiknode.pro",a=i(r)?r:"79a9476eea661d4f82de614db1d8a895b14b881c";break;default:throw new Error("Network info not avalible.")}return`${t}://${s}/${a}`}}t.QuickNodeProvider=s},6325:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0})},5529:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0})},2453:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0})},2856:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0})},6877:(e,t)=>{"use strict";var r,n;Object.defineProperty(t,"__esModule",{value:!0}),t.ETH_DATA_FORMAT=t.DEFAULT_RETURN_FORMAT=t.FMT_BYTES=t.FMT_NUMBER=void 0,function(e){e.NUMBER="NUMBER_NUMBER",e.HEX="NUMBER_HEX",e.STR="NUMBER_STR",e.BIGINT="NUMBER_BIGINT"}(r=t.FMT_NUMBER||(t.FMT_NUMBER={})),function(e){e.HEX="BYTES_HEX",e.UINT8ARRAY="BYTES_UINT8ARRAY"}(n=t.FMT_BYTES||(t.FMT_BYTES={})),t.DEFAULT_RETURN_FORMAT={number:r.BIGINT,bytes:n.HEX},t.ETH_DATA_FORMAT={number:r.HEX,bytes:n.HEX}},9779:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0})},1517:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0})},8223:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0})},4205:(e,t)=>{"use strict";var r,n;Object.defineProperty(t,"__esModule",{value:!0}),t.HardforksOrdered=t.BlockTags=void 0,(n=t.BlockTags||(t.BlockTags={})).EARLIEST="earliest",n.LATEST="latest",n.PENDING="pending",n.SAFE="safe",n.FINALIZED="finalized",(r=t.HardforksOrdered||(t.HardforksOrdered={})).chainstart="chainstart",r.frontier="frontier",r.homestead="homestead",r.dao="dao",r.tangerineWhistle="tangerineWhistle",r.spuriousDragon="spuriousDragon",r.byzantium="byzantium",r.constantinople="constantinople",r.petersburg="petersburg",r.istanbul="istanbul",r.muirGlacier="muirGlacier",r.berlin="berlin",r.london="london",r.altair="altair",r.arrowGlacier="arrowGlacier",r.grayGlacier="grayGlacier",r.bellatrix="bellatrix",r.merge="merge",r.capella="capella",r.shanghai="shanghai"},9970:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r);var o=Object.getOwnPropertyDescriptor(t,r);o&&!("get"in o?!t.__esModule:o.writable||o.configurable)||(o={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,o)}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),o=this&&this.__exportStar||function(e,t){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(t,r)||n(t,e,r)};Object.defineProperty(t,"__esModule",{value:!0}),o(r(9779),t),o(r(6325),t),o(r(2453),t),o(r(2856),t),o(r(5529),t),o(r(6877),t),o(r(4205),t),o(r(1517),t),o(r(8223),t),o(r(2196),t),o(r(8887),t),o(r(8173),t),o(r(1040),t),o(r(5640),t),o(r(1436),t),o(r(4933),t)},2196:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0})},8887:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.TypedArray=void 0,t.TypedArray=Object.getPrototypeOf(Uint8Array)},8173:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0})},1040:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0})},5640:function(e,t){"use strict";var r=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.Web3BaseProvider=void 0;const n=Symbol.for("web3/base-provider");class o{static isWeb3Provider(e){return e instanceof o||Boolean(e&&e[n])}get[n](){return!0}send(e,t){this.request(e).then((e=>{t(null,e)})).catch((e=>{t(e)}))}sendAsync(e){return r(this,void 0,void 0,(function*(){return this.request(e)}))}asEIP1193Provider(){const e=Object.create(this),t=e.request;return e.request=function(e){return r(this,void 0,void 0,(function*(){return(yield t(e)).result}))},e.asEIP1193Provider=void 0,e}}t.Web3BaseProvider=o},1436:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.Web3BaseWallet=void 0,t.Web3BaseWallet=class extends Array{constructor(e){super(),this._accountProvider=e}}},4933:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0})},4108:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.ChunkResponseParser=void 0;const n=r(5071);t.ChunkResponseParser=class{constructor(e,t){this.eventEmitter=e,this.autoReconnect=t,this.chunkTimeout=15e3}clearQueues(){"function"==typeof this._clearQueues&&this._clearQueues()}onError(e){this._clearQueues=e}parseResponse(e){const t=[];return e.replace(/\}[\n\r]?\{/g,"}|--|{").replace(/\}\][\n\r]?\[\{/g,"}]|--|[{").replace(/\}[\n\r]?\[\{/g,"}|--|[{").replace(/\}\][\n\r]?\{/g,"}]|--|{").split("|--|").forEach((e=>{let r,o=e;this.lastChunk&&(o=this.lastChunk+o);try{r=JSON.parse(o)}catch(e){return this.lastChunk=o,this.lastChunkTimeout&&clearTimeout(this.lastChunkTimeout),void(this.lastChunkTimeout=setTimeout((()=>{this.autoReconnect||(this.clearQueues(),this.eventEmitter.emit("error",new n.InvalidResponseError({id:1,jsonrpc:"2.0",error:{code:2,message:"Chunk timeout"}})))}),this.chunkTimeout))}clearTimeout(this.lastChunkTimeout),this.lastChunk=void 0,r&&t.push(r)})),t}}},7086:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.toBool=t.toChecksumAddress=t.toWei=t.fromWei=t.toBigInt=t.toNumber=t.toHex=t.toAscii=t.hexToAscii=t.fromAscii=t.asciiToHex=t.hexToString=t.utf8ToBytes=t.toUtf8=t.hexToUtf8=t.stringToHex=t.fromUtf8=t.utf8ToHex=t.hexToNumberString=t.fromDecimal=t.numberToHex=t.toDecimal=t.hexToNumber=t.hexToBytes=t.bytesToHex=t.bytesToUint8Array=t.ethUnitMap=void 0;const n=r(3687),o=r(5487),i=r(7345),s=r(5071),a=r(7541);t.ethUnitMap={noether:BigInt(0),wei:BigInt(1),kwei:BigInt(1e3),Kwei:BigInt(1e3),babbage:BigInt(1e3),femtoether:BigInt(1e3),mwei:BigInt(1e6),Mwei:BigInt(1e6),lovelace:BigInt(1e6),picoether:BigInt(1e6),gwei:BigInt(1e9),Gwei:BigInt(1e9),shannon:BigInt(1e9),nanoether:BigInt(1e9),nano:BigInt(1e9),szabo:BigInt(1e12),microether:BigInt(1e12),micro:BigInt(1e12),finney:BigInt(1e15),milliether:BigInt(1e15),milli:BigInt(1e15),ether:BigInt("1000000000000000000"),kether:BigInt("1000000000000000000000"),grand:BigInt("1000000000000000000000"),mether:BigInt("1000000000000000000000000"),gether:BigInt("1000000000000000000000000000"),tether:BigInt("1000000000000000000000000000000")};const c="Warning: Using type `number` with values that are large or contain many decimals may cause loss of precision, it is recommended to use type `string` or `BigInt` when using conversion methods";t.bytesToUint8Array=e=>{if(i.validator.validate(["bytes"],[e]),(0,a.isUint8Array)(e))return e;if(Array.isArray(e))return new Uint8Array(e);if("string"==typeof e)return i.utils.hexToUint8Array(e);throw new s.InvalidBytesError(e)};const{uint8ArrayToHexString:u}=i.utils;t.bytesToHex=e=>u((0,t.bytesToUint8Array)(e)),t.hexToBytes=e=>"string"==typeof e&&"0x"!==e.slice(0,2).toLowerCase()?(0,t.bytesToUint8Array)(`0x${e}`):(0,t.bytesToUint8Array)(e),t.hexToNumber=e=>(i.validator.validate(["hex"],[e]),i.utils.hexToNumber(e)),t.toDecimal=t.hexToNumber,t.numberToHex=(e,t)=>{"bigint"!=typeof e&&i.validator.validate(["int"],[e]);let r=i.utils.numberToHex(e);return t&&(r.startsWith("-")||r.length%2!=1?r.length%2==0&&r.startsWith("-")&&(r="-0x0".concat(r.slice(3))):r="0x0".concat(r.slice(2))),r},t.fromDecimal=t.numberToHex,t.hexToNumberString=e=>(0,t.hexToNumber)(e).toString(),t.utf8ToHex=e=>{i.validator.validate(["string"],[e]);let r=e.replace(/^(?:\u0000)/,"");return r=r.replace(/(?:\u0000)$/,""),(0,t.bytesToHex)((new TextEncoder).encode(r))},t.fromUtf8=t.utf8ToHex,t.stringToHex=t.utf8ToHex,t.hexToUtf8=e=>(0,o.bytesToUtf8)((0,t.hexToBytes)(e)),t.toUtf8=e=>"string"==typeof e?(0,t.hexToUtf8)(e):(i.validator.validate(["bytes"],[e]),(0,o.bytesToUtf8)(e)),t.utf8ToBytes=o.utf8ToBytes,t.hexToString=t.hexToUtf8,t.asciiToHex=e=>{i.validator.validate(["string"],[e]);let t="";for(let r=0;r<e.length;r+=1){const n=e.charCodeAt(r).toString(16);t+=n.length%2!=0?`0${n}`:n}return`0x${t}`},t.fromAscii=t.asciiToHex,t.hexToAscii=e=>new TextDecoder("ascii").decode((0,t.hexToBytes)(e)),t.toAscii=t.hexToAscii,t.toHex=(e,r)=>{if("string"==typeof e&&(0,i.isAddress)(e))return r?"address":`0x${e.toLowerCase().replace(/^0x/i,"")}`;if("boolean"==typeof e)return r?"bool":e?"0x01":"0x00";if("number"==typeof e)return r?e<0?"int256":"uint256":(0,t.numberToHex)(e);if("bigint"==typeof e)return r?"bigint":(0,t.numberToHex)(e);if((0,a.isUint8Array)(e))return r?"bytes":(0,t.bytesToHex)(e);if("object"==typeof e&&e)return r?"string":(0,t.utf8ToHex)(JSON.stringify(e));if("string"==typeof e){if(e.startsWith("-0x")||e.startsWith("-0X"))return r?"int256":(0,t.numberToHex)(e);if((0,i.isHexStrict)(e))return r?"bytes":e;if((0,i.isHex)(e)&&!(0,i.isInt)(e)&&!(0,i.isUInt)(e))return r?"bytes":`0x${e}`;if((0,i.isHex)(e)&&!(0,i.isInt)(e)&&(0,i.isUInt)(e))return r?"uint":(0,t.numberToHex)(e);if(!Number.isFinite(e))return r?"string":(0,t.utf8ToHex)(e)}throw new s.HexProcessingError(e)},t.toNumber=e=>{if("number"==typeof e)return e>1e20?(console.warn(c),BigInt(e)):e;if("bigint"==typeof e)return e>=Number.MIN_SAFE_INTEGER&&e<=Number.MAX_SAFE_INTEGER?Number(e):e;if("string"==typeof e&&(0,i.isHexStrict)(e))return(0,t.hexToNumber)(e);try{return(0,t.toNumber)(BigInt(e))}catch(t){throw new s.InvalidNumberError(e)}},t.toBigInt=e=>{if("number"==typeof e)return BigInt(e);if("bigint"==typeof e)return e;if("string"==typeof e&&(0,i.isHex)(e))return e.startsWith("-")?-BigInt(e.substring(1)):BigInt(e);throw new s.InvalidNumberError(e)},t.fromWei=(e,r)=>{let n;if("string"==typeof r){if(n=t.ethUnitMap[r],!n)throw new s.InvalidUnitError(r)}else{if(r<0||!Number.isInteger(r))throw new s.InvalidIntegerError(r);n=(0,i.bigintPower)(BigInt(10),BigInt(r))}const o=String((0,t.toNumber)(e)),a=n.toString().length-1;if(a<=0)return o.toString();const c=o.padStart(a,"0"),u=c.slice(0,-a),d=c.slice(-a).replace(/\.?0+$/,"");return""===u?`0.${d}`:""===d?u:`${u}.${d}`.slice(0,u.length+a+1)},t.toWei=(e,r)=>{let n;if(i.validator.validate(["number"],[e]),"string"==typeof r){if(n=t.ethUnitMap[r],!n)throw new s.InvalidUnitError(r)}else{if(r<0||!Number.isInteger(r))throw new s.InvalidIntegerError(r);n=(0,i.bigintPower)(BigInt(10),BigInt(r))}let o=e;"number"==typeof o&&(o<1e-15&&console.warn(c),o>1e20?(console.warn(c),o=BigInt(o)):o=o.toLocaleString("fullwide",{useGrouping:!1,maximumFractionDigits:20}));const[a,u]=String("string"!=typeof o||(0,i.isHexStrict)(o)?(0,t.toNumber)(o):o).split(".").concat(""),d=BigInt(`${a}${u}`)*n,l=u.length;return 0===l?d.toString():d.toString().slice(0,-l)},t.toChecksumAddress=e=>{if(!(0,i.isAddress)(e,!1))throw new s.InvalidAddressError(e);const r=e.toLowerCase().replace(/^0x/i,""),o=i.utils.uint8ArrayToHexString((0,n.keccak256)(i.utils.ensureIfUint8Array((0,t.utf8ToBytes)(r))));if((0,i.isNullish)(o)||"0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"===o)return"";let a="0x";const c=o.replace(/^0x/i,"");for(let e=0;e<r.length;e+=1)parseInt(c[e],16)>7?a+=r[e].toUpperCase():a+=r[e];return a},t.toBool=e=>{if("boolean"==typeof e)return e;if("number"==typeof e&&(0===e||1===e))return Boolean(e);if("bigint"==typeof e&&(e===BigInt(0)||e===BigInt(1)))return Boolean(e);if("string"==typeof e&&!(0,i.isHexStrict)(e)&&("1"===e||"0"===e||"false"===e||"true"===e))return"true"===e||"false"!==e&&Boolean(Number(e));if("string"==typeof e&&(0,i.isHexStrict)(e)&&("0x1"===e||"0x0"===e))return Boolean((0,t.toNumber)(e));throw new s.InvalidBooleanError(e)}},8512:function(e,t,r){"use strict";var n=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.EventEmitter=void 0;const o=n(r(9386));class i extends o.default{constructor(){super(...arguments),this.maxListeners=Number.MAX_SAFE_INTEGER}setMaxListeners(e){return this.maxListeners=e,this}getMaxListeners(){return this.maxListeners}}t.EventEmitter=i},3065:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.format=t.convert=t.convertScalarValue=t.isDataFormat=void 0;const n=r(5071),o=r(9970),i=r(7345),s=r(7086),a=r(7151),c=r(2557),u=r(7541),{parseBaseType:d}=i.utils;t.isDataFormat=e=>"object"==typeof e&&!(0,i.isNullish)(e)&&"number"in e&&"bytes"in e;const l=(e,t,r=[])=>{let n,o=Object.assign({},e);for(const e of t){if(o.oneOf&&n){const e=n,t=r.find((([t])=>t===e));t&&t[0]===n&&(o=o.oneOf[t[1]])}if(!o.properties&&!o.items)return;o.properties?o=o.properties[e]:o.items&&o.items.properties?o=o.items.properties[e]:o.items&&(0,i.isObject)(o.items)?o=o.items:o.items&&Array.isArray(o.items)&&(o=o.items[parseInt(e,10)]),o&&e&&(n=e)}return o};t.convertScalarValue=(e,t,r)=>{try{const{baseType:i,baseTypeSize:a}=d(t);if("int"===i||"uint"===i)switch(r.number){case o.FMT_NUMBER.NUMBER:return Number((0,s.toBigInt)(e));case o.FMT_NUMBER.HEX:return(0,s.numberToHex)((0,s.toBigInt)(e));case o.FMT_NUMBER.STR:return(0,s.toBigInt)(e).toString();case o.FMT_NUMBER.BIGINT:return(0,s.toBigInt)(e);default:throw new n.FormatterError(`Invalid format: ${String(r.number)}`)}if("bytes"===i){let t;switch(a?"string"==typeof e?t=(0,c.padLeft)(e,2*a):(0,u.isUint8Array)(e)&&(t=(0,u.uint8ArrayConcat)(new Uint8Array(a-e.length),e)):t=e,r.bytes){case o.FMT_BYTES.HEX:return(0,s.bytesToHex)((0,s.bytesToUint8Array)(t));case o.FMT_BYTES.UINT8ARRAY:return(0,s.bytesToUint8Array)(t);default:throw new n.FormatterError(`Invalid format: ${String(r.bytes)}`)}}}catch(t){return e}return e};const h=({value:e,schemaProp:r,schema:n,object:o,key:s,dataPath:a,format:c,oneOfPath:u=[]})=>{var d,l;if(Array.isArray(e)){let h=r;if(void 0!==(null==r?void 0:r.oneOf)&&r.oneOf.forEach(((t,n)=>{var o,i;!Array.isArray(null==r?void 0:r.items)&&("object"==typeof e[0]&&"object"===(null===(o=null==t?void 0:t.items)||void 0===o?void 0:o.type)||"string"==typeof e[0]&&"object"!==(null===(i=null==t?void 0:t.items)||void 0===i?void 0:i.type))&&(h=t,u.push([s,n]))})),(0,i.isNullish)(null==h?void 0:h.items))return delete o[s],a.pop(),!0;if((0,i.isObject)(h.items)&&!(0,i.isNullish)(h.items.format)){for(let r=0;r<e.length;r+=1)o[s][r]=(0,t.convertScalarValue)(e[r],null===(d=null==h?void 0:h.items)||void 0===d?void 0:d.format,c);return a.pop(),!0}if(!Array.isArray(null==h?void 0:h.items)&&"object"===(null===(l=null==h?void 0:h.items)||void 0===l?void 0:l.type)){for(const r of e)(0,t.convert)(r,n,a,c,u);return a.pop(),!0}if(Array.isArray(null==h?void 0:h.items)){for(let r=0;r<e.length;r+=1)o[s][r]=(0,t.convertScalarValue)(e[r],h.items[r].format,c);return a.pop(),!0}}return!1};t.convert=(e,r,n,o,s=[])=>{var a;if(!(0,i.isObject)(e)&&!Array.isArray(e))return(0,t.convertScalarValue)(e,null==r?void 0:r.format,o);const c=e;if(Array.isArray(c)&&"array"===(null==r?void 0:r.type)&&"object"===(null===(a=null==r?void 0:r.items)||void 0===a?void 0:a.type))h({value:c,schemaProp:r,schema:r,object:c,key:"",dataPath:n,format:o,oneOfPath:s});else for(const[e,a]of Object.entries(c)){n.push(e);const u=l(r,n,s);(0,i.isNullish)(u)?(delete c[e],n.pop()):(0,i.isObject)(a)?((0,t.convert)(a,r,n,o,s),n.pop()):h({value:a,schemaProp:u,schema:r,object:c,key:e,dataPath:n,format:o,oneOfPath:s})||(c[e]=(0,t.convertScalarValue)(a,u.format,o),n.pop())}return c},t.format=(e,r,s=o.DEFAULT_RETURN_FORMAT)=>{let c;c=(0,i.isObject)(r)?(0,a.mergeDeep)({},r):Array.isArray(r)?[...r]:r;const u=(0,i.isObject)(e)?e:i.utils.ethAbiToJsonSchema(e);if(!u.properties&&!u.items&&!u.format)throw new n.FormatterError("Invalid json schema for formatting");return(0,t.convert)(c,u,[],s)}},3561:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.getStorageSlotNumForLongString=t.soliditySha3Raw=t.soliditySha3=t.encodePacked=t.processSolidityEncodePackedArgs=t.keccak256=t.keccak256Wrapper=t.sha3Raw=t.sha3=void 0;const n=r(3687),o=r(5487),i=r(5071),s=r(7345),a=r(7086),c=r(2557),u="0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470";t.sha3=e=>{let t;t="string"==typeof e?e.startsWith("0x")&&(0,s.isHexStrict)(e)?(0,a.hexToBytes)(e):(0,o.utf8ToBytes)(e):e;const r=(0,a.bytesToHex)((0,n.keccak256)(s.utils.ensureIfUint8Array(t)));return r===u?void 0:r},t.sha3Raw=e=>{const r=(0,t.sha3)(e);return(0,s.isNullish)(r)?u:r},t.keccak256Wrapper=e=>{let t;return t="bigint"==typeof e||"number"==typeof e?(0,o.utf8ToBytes)(e.toString()):Array.isArray(e)?new Uint8Array(e):"string"!=typeof e||(0,s.isHexStrict)(e)?(0,a.bytesToUint8Array)(e):(0,o.utf8ToBytes)(e),(0,a.bytesToHex)((0,n.keccak256)(s.utils.ensureIfUint8Array(t)))},t.keccak256=t.keccak256Wrapper;const d=(e,t)=>{const r=/^(\d+).*$/.exec(e.slice(t));return r?parseInt(r[1],10):0},l=e=>e.toString(2).length,h=(e,t)=>{const r=t.toString();if("string"===e){if("string"==typeof t)return(0,a.utf8ToHex)(t);throw new i.InvalidStringError(t)}if("bool"===e||"boolean"===e){if("boolean"==typeof t)return t?"01":"00";throw new i.InvalidBooleanError(t)}if("address"===e){if(!(0,s.isAddress)(r))throw new i.InvalidAddressError(r);return r}const n=(e=>e.startsWith("int[")?`int256${e.slice(3)}`:"int"===e?"int256":e.startsWith("uint[")?`uint256'${e.slice(4)}`:"uint"===e?"uint256":e)(e);if(e.startsWith("uint")){const e=d(n,"uint".length);if(e%8||e<8||e>256)throw new i.InvalidSizeError(r);const t=(0,a.toNumber)(r);if(l(t)>e)throw new i.InvalidLargeValueError(r);if(t<BigInt(0))throw new i.InvalidUnsignedIntegerError(r);return e?(0,c.leftPad)(t.toString(16),e/8*2):t.toString(16)}if(e.startsWith("int")){const t=d(n,"int".length);if(t%8||t<8||t>256)throw new i.InvalidSizeError(e);const o=(0,a.toNumber)(r);if(l(o)>t)throw new i.InvalidLargeValueError(r);return o<BigInt(0)?(0,c.toTwosComplement)(o.toString(),t/8*2):t?(0,c.leftPad)(o.toString(16),t/4):o.toString(16)}if("bytes"===n){if(r.replace(/^0x/i,"").length%2!=0)throw new i.InvalidBytesError(r);return r}if(e.startsWith("bytes")){if(r.replace(/^0x/i,"").length%2!=0)throw new i.InvalidBytesError(r);const t=d(e,"bytes".length);if(!t||t<1||t>64||t<r.replace(/^0x/i,"").length/2)throw new i.InvalidBytesError(r);return(0,c.rightPad)(r,2*t)}return""};t.processSolidityEncodePackedArgs=e=>{const[t,r]=(e=>{if(Array.isArray(e))throw new Error("Autodetection of array types is not supported.");let t,r;if("object"==typeof e&&("t"in e||"type"in e)&&("v"in e||"value"in e))t="t"in e?e.t:e.type,r="v"in e?e.v:e.value,t="bigint"===t.toLowerCase()?"int":t;else{if("bigint"==typeof e)return["int",e];t=(0,a.toHex)(e,!0),r=(0,a.toHex)(e),t.startsWith("int")||t.startsWith("uint")||(t="bytes")}return!t.startsWith("int")&&!t.startsWith("uint")||"string"!=typeof r||/^(-)?0x/i.test(r)||(r=(0,a.toBigInt)(r)),[t,r]})(e);return Array.isArray(r)?r.map((e=>h(t,e).replace("0x",""))).join(""):h(t,r).replace("0x","")},t.encodePacked=(...e)=>`0x${e.map(t.processSolidityEncodePackedArgs).join("").toLowerCase()}`,t.soliditySha3=(...e)=>(0,t.sha3)((0,t.encodePacked)(...e)),t.soliditySha3Raw=(...e)=>(0,t.sha3Raw)((0,t.encodePacked)(...e)),t.getStorageSlotNumForLongString=e=>(0,t.sha3)(`0x${("number"==typeof e?e.toString():e).padStart(64,"0")}`)},9634:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r);var o=Object.getOwnPropertyDescriptor(t,r);o&&!("get"in o?!t.__esModule:o.writable||o.configurable)||(o={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,o)}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),o=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),i=this&&this.__exportStar||function(e,t){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(t,r)||n(t,e,r)},s=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var r in e)"default"!==r&&Object.prototype.hasOwnProperty.call(e,r)&&n(t,e,r);return o(t,e),t};Object.defineProperty(t,"__esModule",{value:!0}),t.jsonRpc=void 0,i(r(7086),t),i(r(8512),t),i(r(4578),t),i(r(3065),t),i(r(3561),t),i(r(4822),t),i(r(2557),t),i(r(7151),t),i(r(3718),t),i(r(9250),t),t.jsonRpc=s(r(9250)),i(r(6982),t),i(r(4108),t),i(r(7717),t),i(r(997),t),i(r(222),t),i(r(7541),t)},9250:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.isBatchRequest=t.toBatchPayload=t.toPayload=t.setRequestIdStart=t.isBatchResponse=t.isValidResponse=t.validateResponse=t.isSubscriptionResult=t.isResponseWithNotification=t.isResponseWithError=t.isResponseWithResult=t.isResponseRpcError=void 0;const n=r(7345),o=r(5071),i=r(7717);let s;t.isResponseRpcError=e=>{const t=e.error.code;return o.rpcErrorsMap.has(t)||t>=-32099&&t<=-32e3},t.isResponseWithResult=e=>!Array.isArray(e)&&!!e&&"2.0"===e.jsonrpc&&"result"in e&&(0,n.isNullish)(e.error)&&("number"==typeof e.id||"string"==typeof e.id),t.isResponseWithError=e=>!Array.isArray(e)&&"2.0"===e.jsonrpc&&!!e&&(0,n.isNullish)(e.result)&&"error"in e&&("number"==typeof e.id||"string"==typeof e.id),t.isResponseWithNotification=e=>!(Array.isArray(e)||!e||"2.0"!==e.jsonrpc||(0,n.isNullish)(e.params)||(0,n.isNullish)(e.method)),t.isSubscriptionResult=e=>!Array.isArray(e)&&!!e&&"2.0"===e.jsonrpc&&"id"in e&&"result"in e,t.validateResponse=e=>(0,t.isResponseWithResult)(e)||(0,t.isResponseWithError)(e),t.isValidResponse=e=>Array.isArray(e)?e.every(t.validateResponse):(0,t.validateResponse)(e),t.isBatchResponse=e=>Array.isArray(e)&&e.length>0&&(0,t.isValidResponse)(e),t.setRequestIdStart=e=>{s=e},t.toPayload=e=>{var t,r,n,o;return void 0!==s&&(s+=1),{jsonrpc:null!==(t=e.jsonrpc)&&void 0!==t?t:"2.0",id:null!==(n=null!==(r=e.id)&&void 0!==r?r:s)&&void 0!==n?n:(0,i.uuidV4)(),method:e.method,params:null!==(o=e.params)&&void 0!==o?o:void 0}},t.toBatchPayload=e=>e.map((e=>(0,t.toPayload)(e))),t.isBatchRequest=e=>Array.isArray(e)&&e.length>0},7151:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.mergeDeep=void 0;const n=r(9970),o=r(7345),i=e=>!("object"!=typeof e||(0,o.isNullish)(e)||Array.isArray(e)||e instanceof n.TypedArray);t.mergeDeep=(e,...r)=>{if(!i(e))return e;const s=Object.assign({},e);for(const e of r)for(const r in e)i(e[r])?(s[r]||(s[r]={}),s[r]=(0,t.mergeDeep)(s[r],e[r])):!(0,o.isNullish)(e[r])&&Object.hasOwnProperty.call(e,r)&&(Array.isArray(e[r])||e[r]instanceof n.TypedArray?s[r]=e[r].slice(0):s[r]=e[r]);return s}},3718:function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.rejectIfConditionAtInterval=t.rejectIfTimeout=t.pollTillDefined=t.pollTillDefinedAndReturnIntervalId=t.waitWithTimeout=t.isPromise=void 0;const o=r(7345);function i(e,t,r){return n(this,void 0,void 0,(function*(){let n;const o=yield Promise.race([e instanceof Promise?e:e(),new Promise(((e,o)=>{n=setTimeout((()=>r?o(r):e(void 0)),t)}))]);if(n&&clearTimeout(n),o instanceof Error)throw o;return o}))}function s(e,t){let r;return[new Promise(((s,a)=>{r=setInterval(function c(){return(()=>{n(this,void 0,void 0,(function*(){try{const n=yield i(e,t);(0,o.isNullish)(n)||(clearInterval(r),s(n))}catch(e){clearInterval(r),a(e)}}))})(),c}(),t)})),r]}t.isPromise=function(e){return("object"==typeof e||"function"==typeof e)&&"function"==typeof e.then},t.waitWithTimeout=i,t.pollTillDefinedAndReturnIntervalId=s,t.pollTillDefined=function(e,t){return n(this,void 0,void 0,(function*(){return s(e,t)[0]}))},t.rejectIfTimeout=function(e,t){let r;const n=new Promise(((n,o)=>{r=setTimeout((()=>{o(t)}),e)}));return[r,n]},t.rejectIfConditionAtInterval=function(e,t){let r;const o=new Promise(((o,i)=>{r=setInterval((()=>{(()=>{n(this,void 0,void 0,(function*(){const t=yield e();t&&(clearInterval(r),i(t))}))})()}),t)}));return[r,o]}},4822:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.randomHex=t.randomBytes=void 0;const n=r(1341),o=r(7086);t.randomBytes=e=>(0,n.getRandomBytesSync)(e),t.randomHex=e=>(0,o.bytesToHex)((0,t.randomBytes)(e))},222:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r);var o=Object.getOwnPropertyDescriptor(t,r);o&&!("get"in o?!t.__esModule:o.writable||o.configurable)||(o={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,o)}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),o=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),i=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var r in e)"default"!==r&&Object.prototype.hasOwnProperty.call(e,r)&&n(t,e,r);return o(t,e),t},s=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.SocketProvider=void 0;const a=r(5071),c=r(997),u=r(4108),d=r(4578),l=r(6982),h=i(r(9250)),f={autoReconnect:!0,delay:5e3,maxAttempts:5};class p extends c.Eip1193Provider{constructor(e,t,r){if(super(),this._connectionStatus="connecting",this._onMessageHandler=this._onMessage.bind(this),this._onOpenHandler=this._onConnect.bind(this),this._onCloseHandler=this._onCloseEvent.bind(this),this._onErrorHandler=this._onError.bind(this),!this._validateProviderPath(e))throw new a.InvalidClientError(e);this._socketPath=e,this._socketOptions=t,this._reconnectOptions=Object.assign(Object.assign({},f),null!=r?r:{}),this._pendingRequestsQueue=new Map,this._sentRequestsQueue=new Map,this._init(),this.connect(),this.chunkResponseParser=new u.ChunkResponseParser(this._eventEmitter,this._reconnectOptions.autoReconnect),this.chunkResponseParser.onError((()=>{this._clearQueues()})),this.isReconnecting=!1}get SocketConnection(){return this._socketConnection}_init(){this._reconnectAttempts=0}connect(){try{this._openSocketConnection(),this._connectionStatus="connecting",this._addSocketListeners()}catch(e){if(!this.isReconnecting)throw this._connectionStatus="disconnected",e&&e.message?new a.ConnectionError(`Error while connecting to ${this._socketPath}. Reason: ${e.message}`):new a.InvalidClientError(this._socketPath);setImmediate((()=>{this._reconnect()}))}}_validateProviderPath(e){return!!e}getPendingRequestQueueSize(){return this._pendingRequestsQueue.size}getSentRequestsQueueSize(){return this._sentRequestsQueue.size}supportsSubscriptions(){return!0}on(e,t){this._eventEmitter.on(e,t)}once(e,t){this._eventEmitter.once(e,t)}removeListener(e,t){this._eventEmitter.removeListener(e,t)}_onDisconnect(e,t){this._connectionStatus="disconnected",super._onDisconnect(e,t)}disconnect(e,t){const r=null!=e?e:1e3;this._removeSocketListeners(),"disconnected"!==this.getStatus()&&this._closeSocketConnection(r,t),this._onDisconnect(r,t)}safeDisconnect(e,t,r=!1,n=1e3){return s(this,void 0,void 0,(function*(){let o=0;yield(()=>s(this,void 0,void 0,(function*(){return new Promise((e=>{const t=setInterval((()=>{r&&o>=5&&this.clearQueues(),0===this.getPendingRequestQueueSize()&&0===this.getSentRequestsQueueSize()&&(clearInterval(t),e(!0)),o+=1}),n)}))})))(),this.disconnect(e,t)}))}removeAllListeners(e){this._eventEmitter.removeAllListeners(e)}_onError(e){this.isReconnecting?this._reconnect():this._eventEmitter.emit("error",e)}reset(){this._sentRequestsQueue.clear(),this._pendingRequestsQueue.clear(),this._init(),this._removeSocketListeners(),this._addSocketListeners()}_reconnect(){this.isReconnecting||(this.isReconnecting=!0,this._sentRequestsQueue.size>0&&this._sentRequestsQueue.forEach(((e,t)=>{e.deferredPromise.reject(new a.PendingRequestsOnReconnectingError),this._sentRequestsQueue.delete(t)})),this._reconnectAttempts<this._reconnectOptions.maxAttempts?(this._reconnectAttempts+=1,setTimeout((()=>{this._removeSocketListeners(),this.connect(),this.isReconnecting=!1}),this._reconnectOptions.delay)):(this.isReconnecting=!1,this._clearQueues(),this._removeSocketListeners(),this._eventEmitter.emit("error",new a.MaxAttemptsReachedOnReconnectingError(this._reconnectOptions.maxAttempts))))}request(e){return s(this,void 0,void 0,(function*(){if((0,d.isNullish)(this._socketConnection))throw new Error("Connection is undefined");"disconnected"===this.getStatus()&&this.connect();const t=h.isBatchRequest(e)?e[0].id:e.id;if(!t)throw new a.Web3WSProviderError("Request Id not defined");if(this._sentRequestsQueue.has(t))throw new a.RequestAlreadySentError(t);const r=new l.Web3DeferredPromise;r.catch((e=>{this._eventEmitter.emit("error",e)}));const n={payload:e,deferredPromise:r};if("connecting"===this.getStatus())return this._pendingRequestsQueue.set(t,n),n.deferredPromise;this._sentRequestsQueue.set(t,n);try{this._sendToSocket(n.payload)}catch(e){this._sentRequestsQueue.delete(t),this._eventEmitter.emit("error",e)}return r}))}_onConnect(){this._connectionStatus="connected",this._reconnectAttempts=0,super._onConnect(),this._sendPendingRequests()}_sendPendingRequests(){for(const[e,t]of this._pendingRequestsQueue.entries())this._sendToSocket(t.payload),this._pendingRequestsQueue.delete(e),this._sentRequestsQueue.set(e,t)}_onMessage(e){const t=this._parseResponses(e);if(!(0,d.isNullish)(t)&&0!==t.length)for(const e of t){if(h.isResponseWithNotification(e)&&e.method.endsWith("_subscription"))return void this._eventEmitter.emit("message",e);const t=h.isBatchResponse(e)?e[0].id:e.id,r=this._sentRequestsQueue.get(t);if(!r)return;(h.isBatchResponse(e)||h.isResponseWithResult(e)||h.isResponseWithError(e))&&(this._eventEmitter.emit("message",e),r.deferredPromise.resolve(e)),this._sentRequestsQueue.delete(t)}}clearQueues(e){this._clearQueues(e)}_clearQueues(e){this._pendingRequestsQueue.size>0&&this._pendingRequestsQueue.forEach(((t,r)=>{t.deferredPromise.reject(new a.ConnectionNotOpenError(e)),this._pendingRequestsQueue.delete(r)})),this._sentRequestsQueue.size>0&&this._sentRequestsQueue.forEach(((t,r)=>{t.deferredPromise.reject(new a.ConnectionNotOpenError(e)),this._sentRequestsQueue.delete(r)})),this._removeSocketListeners()}}t.SocketProvider=p},2557:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.fromTwosComplement=t.toTwosComplement=t.leftPad=t.rightPad=t.padRight=t.padLeft=void 0;const n=r(5071),o=r(7345),i=r(7086);t.padLeft=(e,t,r="0")=>"string"==typeof e?(0,o.isHexStrict)(e)?o.utils.padLeft(e,t,r):e.padStart(t,r):(o.validator.validate(["int"],[e]),o.utils.padLeft(e,t,r)),t.padRight=(e,t,r="0")=>{if("string"==typeof e&&!(0,o.isHexStrict)(e))return e.padEnd(t,r);o.validator.validate(["int"],[e]);const n="string"==typeof e&&(0,o.isHexStrict)(e)?e:(0,i.numberToHex)(e),s=n.startsWith("-")?3:2;return n.padEnd(t+s,r)},t.rightPad=t.padRight,t.leftPad=t.padLeft,t.toTwosComplement=(e,r=64)=>{o.validator.validate(["int"],[e]);const s=(0,i.toNumber)(e);if(s>=0)return(0,t.padLeft)((0,i.toHex)(s),r);const a=(0,o.bigintPower)(BigInt(2),BigInt(4*r));if(-s>=a)throw new n.NibbleWidthError(`value: ${e}, nibbleWidth: ${r}`);const c=BigInt(s)+a;return(0,t.padLeft)((0,i.numberToHex)(c),r)},t.fromTwosComplement=(e,t=64)=>{o.validator.validate(["int"],[e]);const r=(0,i.toNumber)(e);if(r<0)return r;const s=Math.ceil(Math.log(Number(r))/Math.log(2));if(s>4*t)throw new n.NibbleWidthError(`value: "${e}", nibbleWidth: "${t}"`);if(4*t!==s)return r;const a=(0,o.bigintPower)(BigInt(2),BigInt(t)*BigInt(4));return(0,i.toNumber)(BigInt(r)-a)}},7541:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.uint8ArrayEquals=t.uint8ArrayConcat=t.isUint8Array=void 0,t.isUint8Array=function(e){var t,r;return e instanceof Uint8Array||"Uint8Array"===(null===(t=null==e?void 0:e.constructor)||void 0===t?void 0:t.name)||"Buffer"===(null===(r=null==e?void 0:e.constructor)||void 0===r?void 0:r.name)},t.uint8ArrayConcat=function(...e){const t=e.reduce(((e,t)=>e+t.length),0),r=new Uint8Array(t);let n=0;for(const t of e)r.set(t,n),n+=t.length;return r},t.uint8ArrayEquals=function(e,t){if(e===t)return!0;if(e.byteLength!==t.byteLength)return!1;for(let r=0;r<e.byteLength;r+=1)if(e[r]!==t[r])return!1;return!0}},7717:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.uuidV4=void 0;const n=r(7086),o=r(4822);t.uuidV4=()=>{const e=(0,o.randomBytes)(16);e[6]=15&e[6]|64,e[8]=63&e[8]|128;const t=(0,n.bytesToHex)(e);return[t.substring(2,10),t.substring(10,14),t.substring(14,18),t.substring(18,22),t.substring(22,34)].join("-")}},4578:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.isNullish=t.isContractInitOptions=t.compareBlockNumbers=t.isTopicInBloom=t.isTopic=t.isContractAddressInBloom=t.isUserEthereumAddressInBloom=t.isInBloom=t.isBloom=t.isAddress=t.checkAddressCheckSum=t.isHex=t.isHexStrict=void 0;const n=r(5071),o=r(7345),i=r(9970);t.isHexStrict=o.isHexStrict,t.isHex=o.isHex,t.checkAddressCheckSum=o.checkAddressCheckSum,t.isAddress=o.isAddress,t.isBloom=o.isBloom,t.isInBloom=o.isInBloom,t.isUserEthereumAddressInBloom=o.isUserEthereumAddressInBloom,t.isContractAddressInBloom=o.isContractAddressInBloom,t.isTopic=o.isTopic,t.isTopicInBloom=o.isTopicInBloom,t.compareBlockNumbers=(e,t)=>{const r="string"==typeof e&&(0,o.isBlockTag)(e),s="string"==typeof t&&(0,o.isBlockTag)(t);if(e===t||("earliest"===e||0===e)&&("earliest"===t||0===t))return 0;if("earliest"===e&&t>0)return-1;if("earliest"===t&&e>0)return 1;if(r&&s){const r={[i.BlockTags.EARLIEST]:1,[i.BlockTags.FINALIZED]:2,[i.BlockTags.SAFE]:3,[i.BlockTags.LATEST]:4,[i.BlockTags.PENDING]:5};return r[e]<r[t]?-1:1}if(r&&!s||!r&&s)throw new n.InvalidBlockError("Cannot compare blocktag with provided non-blocktag input.");const a=BigInt(e),c=BigInt(t);return a<c?-1:a===c?0:1},t.isContractInitOptions=e=>"object"==typeof e&&!(0,o.isNullish)(e)&&0!==Object.keys(e).length&&["input","data","from","gas","gasPrice","gasLimit","address","jsonInterface","syncWithContext","dataInputFill"].some((t=>t in e)),t.isNullish=o.isNullish},6982:function(e,t,r){"use strict";var n,o=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.Web3DeferredPromise=void 0;const i=r(5071);t.Web3DeferredPromise=class{constructor({timeout:e,eagerStart:t,timeoutMessage:r}={timeout:0,eagerStart:!1,timeoutMessage:"DeferredPromise timed out"}){this[n]="Promise",this._state="pending",this._promise=new Promise(((e,t)=>{this._resolve=e,this._reject=t})),this._timeoutMessage=r,this._timeoutInterval=e,t&&this.startTimer()}get state(){return this._state}then(e,t){return o(this,void 0,void 0,(function*(){return this._promise.then(e,t)}))}catch(e){return o(this,void 0,void 0,(function*(){return this._promise.catch(e)}))}finally(e){return o(this,void 0,void 0,(function*(){return this._promise.finally(e)}))}resolve(e){this._resolve(e),this._state="fulfilled",this._clearTimeout()}reject(e){this._reject(e),this._state="rejected",this._clearTimeout()}startTimer(){this._timeoutInterval&&this._timeoutInterval>0&&(this._timeoutId=setTimeout(this._checkTimeout.bind(this),this._timeoutInterval))}_checkTimeout(){"pending"===this._state&&this._timeoutId&&this.reject(new i.OperationTimeoutError(this._timeoutMessage))}_clearTimeout(){this._timeoutId&&clearTimeout(this._timeoutId)}},n=Symbol.toStringTag},997:function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.Eip1193Provider=void 0;const o=r(9970),i=r(9386),s=r(5071),a=r(9250);class c extends o.Web3BaseProvider{constructor(){super(...arguments),this._eventEmitter=new i.EventEmitter,this._chainId="",this._accounts=[]}_getChainId(){var e;return n(this,void 0,void 0,(function*(){const t=yield this.request((0,a.toPayload)({method:"eth_chainId",params:[]}));return null!==(e=null==t?void 0:t.result)&&void 0!==e?e:""}))}_getAccounts(){var e;return n(this,void 0,void 0,(function*(){const t=yield this.request((0,a.toPayload)({method:"eth_accounts",params:[]}));return null!==(e=null==t?void 0:t.result)&&void 0!==e?e:[]}))}_onConnect(){Promise.all([this._getChainId().then((e=>{e!==this._chainId&&(this._chainId=e,this._eventEmitter.emit("chainChanged",this._chainId))})).catch((e=>{console.error(e)})),this._getAccounts().then((e=>{this._accounts.length===e.length&&e.every((t=>e.includes(t)))||(this._accounts=e,this._onAccountsChanged())})).catch((e=>{console.error(e)}))]).then((()=>this._eventEmitter.emit("connect",{chainId:this._chainId}))).catch((e=>{console.error(e)}))}_onDisconnect(e,t){this._eventEmitter.emit("disconnect",new s.EIP1193ProviderRpcError(e,t))}_onAccountsChanged(){this._eventEmitter.emit("accountsChanged",this._accounts)}}t.Eip1193Provider=c},1438:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.VALID_ETH_BASE_TYPES=void 0,t.VALID_ETH_BASE_TYPES=["bool","int","uint","bytes","string","address","tuple"]},3637:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.validator=void 0;const n=r(7985);t.validator=new n.Web3Validator},356:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.Web3ValidatorError=void 0;const n=r(5071),o=e=>e.message?e.message:"unspecified error";class i extends n.BaseWeb3Error{constructor(e){super(),this.code=n.ERR_VALIDATION,this.errors=e,super.message=`Web3 validator found ${e.length} error[s]:\n${this._compileErrors().join("\n")}`}_compileErrors(){return this.errors.map(o)}}t.Web3ValidatorError=i},2677:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0});const n=r(2681),o=r(6660),i=r(5191),s=r(4416),a=r(3921),c=r(5164),u=r(7420),d=r(6378),l={address:e=>(0,n.isAddress)(e),bloom:e=>(0,i.isBloom)(e),blockNumber:e=>(0,o.isBlockNumber)(e),blockTag:e=>(0,o.isBlockTag)(e),blockNumberOrTag:e=>(0,o.isBlockNumberOrTag)(e),bool:e=>(0,s.isBoolean)(e),bytes:e=>(0,a.isBytes)(e),filter:e=>(0,c.isFilterObject)(e),hex:e=>(0,u.isHexStrict)(e),uint:e=>(0,d.isUInt)(e),int:e=>(0,d.isInt)(e),number:e=>(0,d.isNumber)(e),string:e=>(0,u.isString)(e)};for(let e=8;e<=256;e+=8)l[`int${e}`]=t=>(0,d.isInt)(t,{bitSize:e}),l[`uint${e}`]=t=>(0,d.isUInt)(t,{bitSize:e});for(let e=1;e<=32;e+=1)l[`bytes${e}`]=t=>(0,a.isBytes)(t,{size:e});l.bytes256=l.bytes,t.default=l},7345:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r);var o=Object.getOwnPropertyDescriptor(t,r);o&&!("get"in o?!t.__esModule:o.writable||o.configurable)||(o={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,o)}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),o=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),i=this&&this.__exportStar||function(e,t){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(t,r)||n(t,e,r)},s=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var r in e)"default"!==r&&Object.prototype.hasOwnProperty.call(e,r)&&n(t,e,r);return o(t,e),t};Object.defineProperty(t,"__esModule",{value:!0}),t.utils=void 0,i(r(7985),t),i(r(3637),t),i(r(5421),t),t.utils=s(r(8171)),i(r(356),t),i(r(1438),t),i(r(1851),t)},5421:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0})},8171:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.ensureIfUint8Array=t.hexToUint8Array=t.uint8ArrayToHexString=t.padLeft=t.numberToHex=t.hexToNumber=t.codePointToInt=t.transformJsonDataToAbiFormat=t.fetchArrayElement=t.ethAbiToJsonSchema=t.abiSchemaToJsonSchema=t.parseBaseType=void 0;const n=r(5071),o=r(1438),i=r(1283),s=r(7420),a=r(356),c=["hex","number","blockNumber","blockNumberOrTag","filter","bloom"];t.parseBaseType=e=>{let t,r=e.replace(/ /,""),n=!1,i=[];if(e.includes("[")&&(r=r.slice(0,r.indexOf("[")),i=[...e.matchAll(/(?:\[(\d*)\])/g)].map((e=>parseInt(e[1],10))).map((e=>Number.isNaN(e)?-1:e)),n=i.length>0),o.VALID_ETH_BASE_TYPES.includes(r))return{baseType:r,isArray:n,baseTypeSize:t,arraySizes:i};if(r.startsWith("int"))t=parseInt(r.substring(3),10),r="int";else if(r.startsWith("uint"))t=parseInt(e.substring(4),10),r="uint";else{if(!r.startsWith("bytes"))return{baseType:void 0,isArray:!1,baseTypeSize:void 0,arraySizes:i};t=parseInt(r.substring(5),10),r="bytes"}return{baseType:r,isArray:n,baseTypeSize:t,arraySizes:i}};const u=(e,r={})=>{if(Object.keys(r).includes("type"))throw new a.Web3ValidatorError([{keyword:"eth",message:'Either "eth" or "type" can be presented in schema',params:{eth:e},instancePath:"",schemaPath:""}]);const{baseType:n,baseTypeSize:o}=(0,t.parseBaseType)(e);if(!n&&!c.includes(e))throw new a.Web3ValidatorError([{keyword:"eth",message:`Eth data type "${e}" is not valid`,params:{eth:e},instancePath:"",schemaPath:""}]);if(n){if("tuple"===n)throw new Error('"tuple" type is not implemented directly.');return{format:`${n}${null!=o?o:""}`,required:!0}}return e?{format:e,required:!0}:{}};t.abiSchemaToJsonSchema=(e,r="/0")=>{const n={type:"array",items:[],maxItems:e.length,minItems:e.length};for(const[o,s]of e.entries()){let e,a,c=[];(0,i.isAbiParameterSchema)(s)?(e=s.type,a=s.name||`${r}/${o}`,c=s.components):"string"==typeof s?(e=s,a=`${r}/${o}`):Array.isArray(s)&&(s[0]&&"string"==typeof s[0]&&s[0].startsWith("tuple")&&!Array.isArray(s[0])&&s[1]&&Array.isArray(s[1])?(e=s[0],a=`${r}/${o}`,c=s[1]):(e="tuple",a=`${r}/${o}`,c=s));const{baseType:d,isArray:l,arraySizes:h}=(0,t.parseBaseType)(e);let f,p=n;for(let e=h.length-1;e>0;e-=1)f={type:"array",$id:a,items:[],maxItems:h[e],minItems:h[e]},h[e]<0&&(delete f.maxItems,delete f.minItems),Array.isArray(p.items)?0===p.items.length?p.items=[f]:p.items.push(f):p.items=[p.items,f],p=f;if("tuple"!==d||l)if("tuple"===d&&l){const e=h[0],r=Object.assign({type:"array",$id:a,items:(0,t.abiSchemaToJsonSchema)(c,a)},e>=0&&{minItems:e,maxItems:e});p.items.push(r)}else if(l){const t=h[0],r=Object.assign({type:"array",$id:a,items:u(e)},t>=0&&{minItems:t,maxItems:t});p.items.push(r)}else Array.isArray(p.items),p.items.push(Object.assign({$id:a},u(e)));else{const e=(0,t.abiSchemaToJsonSchema)(c,a);e.$id=a,p.items.push(e)}p=n}return n},t.ethAbiToJsonSchema=e=>(0,t.abiSchemaToJsonSchema)(e),t.fetchArrayElement=(e,r)=>1===r?e:(0,t.fetchArrayElement)(e[0],r-1),t.transformJsonDataToAbiFormat=(e,r,n)=>{const o=[];for(const[s,a]of e.entries()){let e,c,u=[];(0,i.isAbiParameterSchema)(a)?(e=a.type,c=a.name,u=a.components):"string"==typeof a?e=a:Array.isArray(a)&&(a[1]&&Array.isArray(a[1])?(e=a[0],u=a[1]):(e="tuple",u=a));const{baseType:d,isArray:l,arraySizes:h}=(0,t.parseBaseType)(e),f=Array.isArray(r)?r[s]:r[c];if("tuple"!==d||l)if("tuple"===d&&l){const e=[];for(const r of f)if(h.length>1){const o=(0,t.fetchArrayElement)(r,h.length-1),i=[];for(const e of o)i.push((0,t.transformJsonDataToAbiFormat)(u,e,n));e.push(i)}else e.push((0,t.transformJsonDataToAbiFormat)(u,r,n));o.push(e)}else o.push(f);else o.push((0,t.transformJsonDataToAbiFormat)(u,f,n))}return(n=null!=n?n:[]).push(...o),n},t.codePointToInt=e=>{if(e>=48&&e<=57)return e-48;if(e>=65&&e<=70)return e-55;if(e>=97&&e<=102)return e-87;throw new Error(`Invalid code point: ${e}`)},t.hexToNumber=e=>{if(!(0,s.isHexStrict)(e))throw new Error("Invalid hex string");const[t,r]=e.startsWith("-")?[!0,e.slice(1)]:[!1,e],n=BigInt(r);return n>Number.MAX_SAFE_INTEGER?t?-n:n:n<Number.MIN_SAFE_INTEGER?n:t?-1*Number(n):Number(n)},t.numberToHex=e=>{if(("number"==typeof e||"bigint"==typeof e)&&e<0)return`-0x${e.toString(16).slice(1)}`;if(("number"==typeof e||"bigint"==typeof e)&&e>=0)return`0x${e.toString(16)}`;if("string"==typeof e&&(0,s.isHexStrict)(e)){const[t,r]=e.startsWith("-")?[!0,e.slice(1)]:[!1,e];return`${t?"-":""}0x${r.split(/^(-)?0(x|X)/).slice(-1)[0].replace(/^0+/,"").toLowerCase()}`}if("string"==typeof e&&!(0,s.isHexStrict)(e))return(0,t.numberToHex)(BigInt(e));throw new n.InvalidNumberError(e)},t.padLeft=(e,r,n="0")=>{if("string"==typeof e&&!(0,s.isHexStrict)(e))return e.padStart(r,n);const o="string"==typeof e&&(0,s.isHexStrict)(e)?e:(0,t.numberToHex)(e),[i,a]=o.startsWith("-")?["-0x",o.slice(3)]:["0x",o.slice(2)];return`${i}${a.padStart(r,n)}`},t.uint8ArrayToHexString=function(e){let t="0x";for(const r of e){const e=r.toString(16);t+=1===e.length?`0${e}`:e}return t};function d(e){return e>=48&&e<=57?e-48:e>=65&&e<=70?e-55:e>=97&&e<=102?e-87:void 0}t.hexToUint8Array=function(e){let t=0;if(!e.startsWith("0")||"x"!==e[1]&&"X"!==e[1]||(t=2),e.length%2!=0)throw new n.InvalidBytesError(`hex string has odd length: ${e}`);const r=(e.length-t)/2,o=new Uint8Array(r);for(let i=0,s=t;i<r;i+=1){const t=d(e.charCodeAt(s++)),r=d(e.charCodeAt(s++));if(void 0===t||void 0===r)throw new n.InvalidBytesError(`Invalid byte sequence ("${e[s-2]}${e[s-1]}" in "${e}").`);o[i]=16*t+r}return o},t.ensureIfUint8Array=function(e){var t;return e instanceof Uint8Array||"Uint8Array"!==(null===(t=null==e?void 0:e.constructor)||void 0===t?void 0:t.name)?e:Uint8Array.from(e)}},1283:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.isAbiParameterSchema=void 0,t.isAbiParameterSchema=e=>"object"==typeof e&&"type"in e&&"name"in e},2681:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.isAddress=t.checkAddressCheckSum=void 0;const n=r(4488),o=r(7737),i=r(8171),s=r(7420),a=r(3921);t.checkAddressCheckSum=e=>{if(!/^(0x)?[0-9a-f]{40}$/i.test(e))return!1;const t=e.slice(2),r=(0,o.utf8ToBytes)(t.toLowerCase()),s=(0,i.uint8ArrayToHexString)((0,n.keccak256)((0,i.ensureIfUint8Array)(r))).slice(2);for(let e=0;e<40;e+=1)if(parseInt(s[e],16)>7&&t[e].toUpperCase()!==t[e]||parseInt(s[e],16)<=7&&t[e].toLowerCase()!==t[e])return!1;return!0},t.isAddress=(e,r=!0)=>{if("string"!=typeof e&&!(0,a.isUint8Array)(e))return!1;let n;return n=(0,a.isUint8Array)(e)?(0,i.uint8ArrayToHexString)(e):"string"!=typeof e||(0,s.isHexStrict)(e)||e.toLowerCase().startsWith("0x")?e:`0x${e}`,!!/^(0x)?[0-9a-f]{40}$/i.test(n)&&(!(!/^(0x|0X)?[0-9a-f]{40}$/.test(n)&&!/^(0x|0X)?[0-9A-F]{40}$/.test(n))||!r||(0,t.checkAddressCheckSum)(n))}},6660:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.isBlockNumberOrTag=t.isBlockTag=t.isBlockNumber=void 0;const n=r(9970),o=r(6378);t.isBlockNumber=e=>(0,o.isUInt)(e),t.isBlockTag=e=>Object.values(n.BlockTags).includes(e),t.isBlockNumberOrTag=e=>(0,t.isBlockTag)(e)||(0,t.isBlockNumber)(e)},5191:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.isContractAddressInBloom=t.isUserEthereumAddressInBloom=t.isInBloom=t.isBloom=void 0;const n=r(4488),o=r(8171),i=r(2681),s=r(7420);t.isBloom=e=>!("string"!=typeof e||!/^(0x)?[0-9a-f]{512}$/i.test(e)||!/^(0x)?[0-9a-f]{512}$/.test(e)&&!/^(0x)?[0-9A-F]{512}$/.test(e)),t.isInBloom=(e,r)=>{if("string"==typeof r&&!(0,s.isHexStrict)(r))return!1;if(!(0,t.isBloom)(e))return!1;const i="string"==typeof r?(0,o.hexToUint8Array)(r):r,a=(0,o.uint8ArrayToHexString)((0,n.keccak256)(i)).slice(2);for(let t=0;t<12;t+=4){const r=(parseInt(a.slice(t,t+2),16)<<8)+parseInt(a.slice(t+2,t+4),16)&2047,n=1<<r%4;if(((0,o.codePointToInt)(e.charCodeAt(e.length-1-Math.floor(r/4)))&n)!==n)return!1}return!0},t.isUserEthereumAddressInBloom=(e,r)=>{if(!(0,t.isBloom)(e))return!1;if(!(0,i.isAddress)(r))return!1;const n=(0,o.padLeft)(r,64);return(0,t.isInBloom)(e,n)},t.isContractAddressInBloom=(e,r)=>!!(0,t.isBloom)(e)&&!!(0,i.isAddress)(r)&&(0,t.isInBloom)(e,r)},4416:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.isBoolean=void 0;const n=r(7420);t.isBoolean=e=>!!["number","string","boolean"].includes(typeof e)&&("boolean"==typeof e||("string"!=typeof e||(0,n.isHexStrict)(e)?"string"==typeof e&&(0,n.isHexStrict)(e)?"0x1"===e||"0x0"===e:1===e||0===e:"1"===e||"0"===e))},3921:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.isBytes=t.isUint8Array=void 0;const n=r(8171),o=r(7420);t.isUint8Array=e=>{var t,r;return e instanceof Uint8Array||"Uint8Array"===(null===(t=null==e?void 0:e.constructor)||void 0===t?void 0:t.name)||"Buffer"===(null===(r=null==e?void 0:e.constructor)||void 0===r?void 0:r.name)},t.isBytes=(e,r={abiType:"bytes"})=>{if("string"!=typeof e&&!Array.isArray(e)&&!(0,t.isUint8Array)(e))return!1;if("string"==typeof e&&(0,o.isHexStrict)(e)&&e.startsWith("-"))return!1;if("string"==typeof e&&!(0,o.isHexStrict)(e))return!1;let i;if("string"==typeof e){if(e.length%2!=0)return!1;i=(0,n.hexToUint8Array)(e)}else if(Array.isArray(e)){if(e.some((e=>e<0||e>255||!Number.isInteger(e))))return!1;i=new Uint8Array(e)}else i=e;if(null==r?void 0:r.abiType){const{baseTypeSize:e}=(0,n.parseBaseType)(r.abiType);return!e||i.length===e}return!(null==r?void 0:r.size)||i.length===(null==r?void 0:r.size)}},1478:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.isValidEthBaseType=void 0;const n=r(8171);t.isValidEthBaseType=e=>{const{baseType:t,baseTypeSize:r}=(0,n.parseBaseType)(e);return!!t&&(t===e||("int"!==t&&"uint"!==t||!r||r<=256&&r%8==0)&&("bytes"!==t||!r||r>=1&&r<=32))}},5164:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.isFilterObject=void 0;const n=r(2681),o=r(6660),i=r(2102),s=r(5702);t.isFilterObject=e=>{const t=["fromBlock","toBlock","address","topics","blockHash"];if((0,i.isNullish)(e)||"object"!=typeof e)return!1;if(!Object.keys(e).every((e=>t.includes(e))))return!1;if(!(0,i.isNullish)(e.fromBlock)&&!(0,o.isBlockNumberOrTag)(e.fromBlock)||!(0,i.isNullish)(e.toBlock)&&!(0,o.isBlockNumberOrTag)(e.toBlock))return!1;if(!(0,i.isNullish)(e.address))if(Array.isArray(e.address)){if(!e.address.every((e=>(0,n.isAddress)(e))))return!1}else if(!(0,n.isAddress)(e.address))return!1;return!(!(0,i.isNullish)(e.topics)&&!e.topics.every((e=>!!(0,i.isNullish)(e)||(Array.isArray(e)?e.every((e=>(0,s.isTopic)(e))):!!(0,s.isTopic)(e)))))}},1851:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r);var o=Object.getOwnPropertyDescriptor(t,r);o&&!("get"in o?!t.__esModule:o.writable||o.configurable)||(o={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,o)}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),o=this&&this.__exportStar||function(e,t){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(t,r)||n(t,e,r)};Object.defineProperty(t,"__esModule",{value:!0}),o(r(2681),t),o(r(6660),t),o(r(5191),t),o(r(4416),t),o(r(3921),t),o(r(1478),t),o(r(5164),t),o(r(6378),t),o(r(7420),t),o(r(5702),t),o(r(2102),t)},6378:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.isNumber=t.isInt=t.isUInt=t.bigintPower=t.isBigInt=void 0;const n=r(8171),o=r(7420);t.isBigInt=e=>"bigint"==typeof e,t.bigintPower=(e,t)=>{if(t===BigInt(0))return BigInt(1);let r=e;for(let n=1;n<t;n+=1)r*=e;return r},t.isUInt=(e,r={abiType:"uint"})=>{if(!["number","string","bigint"].includes(typeof e)||"string"==typeof e&&0===e.length)return!1;let i;if(null==r?void 0:r.abiType){const{baseTypeSize:e}=(0,n.parseBaseType)(r.abiType);e&&(i=e)}else r.bitSize&&(i=r.bitSize);const s=(0,t.bigintPower)(BigInt(2),BigInt(null!=i?i:256))-BigInt(1);try{const t="string"==typeof e&&(0,o.isHexStrict)(e)?BigInt((0,n.hexToNumber)(e)):BigInt(e);return t>=0&&t<=s}catch(e){return!1}},t.isInt=(e,r={abiType:"int"})=>{if(!["number","string","bigint"].includes(typeof e))return!1;if("number"==typeof e&&e>Number.MAX_SAFE_INTEGER)return!1;let i;if(null==r?void 0:r.abiType){const{baseTypeSize:e,baseType:t}=(0,n.parseBaseType)(r.abiType);if("int"!==t)return!1;e&&(i=e)}else r.bitSize&&(i=r.bitSize);const s=(0,t.bigintPower)(BigInt(2),BigInt((null!=i?i:256)-1)),a=BigInt(-1)*(0,t.bigintPower)(BigInt(2),BigInt((null!=i?i:256)-1));try{const t="string"==typeof e&&(0,o.isHexStrict)(e)?BigInt((0,n.hexToNumber)(e)):BigInt(e);return t>=a&&t<=s}catch(e){return!1}},t.isNumber=e=>!!(0,t.isInt)(e)||!("string"!=typeof e||!/[0-9.]/.test(e)||e.indexOf(".")!==e.lastIndexOf("."))||"number"==typeof e},2102:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.isObject=t.isNullish=void 0;const n=r(9970);t.isNullish=e=>null==e,t.isObject=e=>!("object"!=typeof e||(0,t.isNullish)(e)||Array.isArray(e)||e instanceof n.TypedArray)},7420:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.validateNoLeadingZeroes=t.isHexPrefixed=t.isHexString32Bytes=t.isHexString8Bytes=t.isHex=t.isHexString=t.isHexStrict=t.isString=void 0,t.isString=e=>"string"==typeof e,t.isHexStrict=e=>"string"==typeof e&&/^((-)?0x[0-9a-f]+|(0x))$/i.test(e),t.isHexString=function(e,t){return!("string"!=typeof e||!e.match(/^0x[0-9A-Fa-f]*$/)||void 0!==t&&t>0&&e.length!==2+2*t)},t.isHex=e=>"number"==typeof e||"bigint"==typeof e||"string"==typeof e&&/^((-0x|0x|-)?[0-9a-f]+|(0x))$/i.test(e),t.isHexString8Bytes=(e,r=!0)=>r?(0,t.isHexStrict)(e)&&18===e.length:(0,t.isHex)(e)&&16===e.length,t.isHexString32Bytes=(e,r=!0)=>r?(0,t.isHexStrict)(e)&&66===e.length:(0,t.isHex)(e)&&64===e.length,t.isHexPrefixed=function(e){if("string"!=typeof e)throw new Error("[isHexPrefixed] input must be type 'string', received type "+typeof e);return e.startsWith("0x")},t.validateNoLeadingZeroes=function(e){for(const[t,r]of Object.entries(e))if(void 0!==r&&r.length>0&&0===r[0])throw new Error(`${t} cannot have leading zeroes, received: ${r.toString()}`)}},5702:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.isTopicInBloom=t.isTopic=void 0;const n=r(5191);t.isTopic=e=>!("string"!=typeof e||!/^(0x)?[0-9a-f]{64}$/i.test(e)||!/^(0x)?[0-9a-f]{64}$/.test(e)&&!/^(0x)?[0-9A-F]{64}$/.test(e)),t.isTopicInBloom=(e,r)=>!!(0,n.isBloom)(e)&&!!(0,t.isTopic)(r)&&(0,n.isInBloom)(e,r)},1714:function(e,t,r){"use strict";var n=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.Validator=void 0;const o=r(5071),i=r(6750),s=r(356),a=n(r(2677)),c=e=>{if((!(null==e?void 0:e.type)||"object"===(null==e?void 0:e.type))&&(null==e?void 0:e.properties)){const t={};for(const r of Object.keys(e.properties)){const n=c(e.properties[r]);n&&(t[r]=n)}return Array.isArray(e.required)?i.z.object(t).partial().required(e.required.reduce(((e,t)=>Object.assign(Object.assign({},e),{[t]:!0})),{})):i.z.object(t).partial()}if("array"===(null==e?void 0:e.type)&&(null==e?void 0:e.items)){if(Array.isArray(e.items)&&e.items.length>1&&void 0!==e.maxItems&&new Set(e.items.map((e=>e.$id))).size===e.items.length){const t=[];for(const r of e.items){const e=c(r);e&&t.push(e)}return i.z.tuple(t)}const t=Array.isArray(e.items)?e.items[0]:e.items;let r=i.z.array(c(t));return r=void 0!==e.minItems?r.min(e.minItems):r,r=void 0!==e.maxItems?r.max(e.maxItems):r,r}if(e.oneOf&&Array.isArray(e.oneOf))return i.z.union(e.oneOf.map((e=>c(e))));if(null==e?void 0:e.format){if(!a.default[e.format])throw new o.SchemaFormatError(e.format);return i.z.any().refine(a.default[e.format],(t=>({params:{value:t,format:e.format}})))}return(null==e?void 0:e.type)&&"object"!==(null==e?void 0:e.type)&&"function"==typeof i.z[String(e.type)]?i.z[String(e.type)]():i.z.object({data:i.z.any()}).partial()};class u{static factory(){return u.validatorInstance||(u.validatorInstance=new u),u.validatorInstance}validate(e,t,r){var n,o;const i=c(e).safeParse(t);if(!i.success){const e=this.convertErrors(null!==(o=null===(n=i.error)||void 0===n?void 0:n.issues)&&void 0!==o?o:[]);if(e){if(null==r?void 0:r.silent)return e;throw new s.Web3ValidatorError(e)}}}convertErrors(e){if(e&&Array.isArray(e)&&e.length>0)return e.map((e=>{var t;let r,n,o,s;s=e.path.join("/");const a=String(e.path[e.path.length-1]),c=e.path.join("/");if(e.code===i.ZodIssueCode.too_big)n="maxItems",s=`${c}/maxItems`,o={limit:e.maximum},r=`must NOT have more than ${e.maximum} items`;else if(e.code===i.ZodIssueCode.too_small)n="minItems",s=`${c}/minItems`,o={limit:e.minimum},r=`must NOT have fewer than ${e.minimum} items`;else if(e.code===i.ZodIssueCode.custom){const{value:n,format:i}=null!==(t=e.params)&&void 0!==t?t:{};r=void 0===n?`value at "/${s}" is required`:`value "${"object"==typeof n?JSON.stringify(n):n}" at "/${s}" must pass "${i}" validation`,o={value:n}}return{keyword:null!=n?n:a,instancePath:c?`/${c}`:"",schemaPath:s?`#${s}`:"#",params:null!=o?o:{value:e.message},message:null!=r?r:e.message}}))}}t.Validator=u},7985:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.Web3Validator=void 0;const n=r(1714),o=r(8171),i=r(356);t.Web3Validator=class{constructor(){this._validator=n.Validator.factory()}validateJSONSchema(e,t,r){return this._validator.validate(e,t,r)}validate(e,t,r={silent:!1}){var n,s;const a=(0,o.ethAbiToJsonSchema)(e);if(!Array.isArray(a.items)||0!==(null===(n=a.items)||void 0===n?void 0:n.length)||0!==t.length){if(Array.isArray(a.items)&&0===(null===(s=a.items)||void 0===s?void 0:s.length)&&0!==t.length)throw new i.Web3ValidatorError([{instancePath:"/0",schemaPath:"/",keyword:"required",message:"empty schema against data can not be validated",params:t}]);return this._validator.validate(a,t,r)}}}},1655:(e,t,r)=>{"use strict";function n(e,t){return e.exec(t)?.groups}r.r(t),r.d(t,{BaseError:()=>u,narrow:()=>d,parseAbi:()=>M,parseAbiItem:()=>L,parseAbiParameter:()=>D,parseAbiParameters:()=>F});var o=/^bytes([1-9]|1[0-9]|2[0-9]|3[0-2])?$/,i=/^u?int(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/,s=/^\(.+?\).*?$/,a=Object.defineProperty,c=(e,t,r)=>(((e,t,r)=>{t in e?a(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r})(e,"symbol"!=typeof t?t+"":t,r),r),u=class extends Error{constructor(e,t={}){const r=t.cause instanceof u?t.cause.details:t.cause?.message?t.cause.message:t.details,n=t.cause instanceof u&&t.cause.docsPath||t.docsPath;super([e||"An error occurred.","",...t.metaMessages?[...t.metaMessages,""]:[],...n?[`Docs: https://abitype.dev${n}`]:[],...r?[`Details: ${r}`]:[],"Version: abitype@0.7.1"].join("\n")),c(this,"details"),c(this,"docsPath"),c(this,"metaMessages"),c(this,"shortMessage"),c(this,"name","AbiTypeError"),t.cause&&(this.cause=t.cause),this.details=r,this.docsPath=n,this.metaMessages=t.metaMessages,this.shortMessage=e}};function d(e){return e}var l=/^error (?<name>[a-zA-Z0-9_]+)\((?<parameters>.*?)\)$/,h=/^event (?<name>[a-zA-Z0-9_]+)\((?<parameters>.*?)\)$/,f=/^function (?<name>[a-zA-Z0-9_]+)\((?<parameters>.*?)\)(?: (?<scope>external|public{1}))?(?: (?<stateMutability>pure|view|nonpayable|payable{1}))?(?: returns \((?<returns>.*?)\))?$/,p=/^struct (?<name>[a-zA-Z0-9_]+) \{(?<properties>.*?)\}$/;function m(e){return p.test(e)}function g(e){return n(p,e)}var y=/^constructor\((?<parameters>.*?)\)(?:\s(?<stateMutability>payable{1}))?$/,v=/^fallback\(\)$/,b=/^receive\(\) external payable$/,E=new Set(["memory","indexed","storage","calldata"]),_=new Set(["indexed"]),A=new Set(["calldata","memory","storage"]),T=new Map([["address",{type:"address"}],["bool",{type:"bool"}],["bytes",{type:"bytes"}],["bytes32",{type:"bytes32"}],["int",{type:"int256"}],["int256",{type:"int256"}],["string",{type:"string"}],["uint",{type:"uint256"}],["uint8",{type:"uint8"}],["uint16",{type:"uint16"}],["uint24",{type:"uint24"}],["uint32",{type:"uint32"}],["uint64",{type:"uint64"}],["uint96",{type:"uint96"}],["uint112",{type:"uint112"}],["uint160",{type:"uint160"}],["uint192",{type:"uint192"}],["uint256",{type:"uint256"}],["address owner",{type:"address",name:"owner"}],["address to",{type:"address",name:"to"}],["bool approved",{type:"bool",name:"approved"}],["bytes _data",{type:"bytes",name:"_data"}],["bytes data",{type:"bytes",name:"data"}],["bytes signature",{type:"bytes",name:"signature"}],["bytes32 hash",{type:"bytes32",name:"hash"}],["bytes32 r",{type:"bytes32",name:"r"}],["bytes32 root",{type:"bytes32",name:"root"}],["bytes32 s",{type:"bytes32",name:"s"}],["string name",{type:"string",name:"name"}],["string symbol",{type:"string",name:"symbol"}],["string tokenURI",{type:"string",name:"tokenURI"}],["uint tokenId",{type:"uint256",name:"tokenId"}],["uint8 v",{type:"uint8",name:"v"}],["uint256 balance",{type:"uint256",name:"balance"}],["uint256 tokenId",{type:"uint256",name:"tokenId"}],["uint256 value",{type:"uint256",name:"value"}],["event:address indexed from",{type:"address",name:"from",indexed:!0}],["event:address indexed to",{type:"address",name:"to",indexed:!0}],["event:uint indexed tokenId",{type:"uint256",name:"tokenId",indexed:!0}],["event:uint256 indexed tokenId",{type:"uint256",name:"tokenId",indexed:!0}]]);function w(e,t={}){if(function(e){return f.test(e)}(e)){const r=function(e){return n(f,e)}(e);if(!r)throw new u("Invalid function signature.",{details:e});const o=O(r.parameters),i=[],s=o.length;for(let e=0;e<s;e++)i.push(x(o[e],{modifiers:A,structs:t,type:"function"}));const a=[];if(r.returns){const e=O(r.returns),n=e.length;for(let r=0;r<n;r++)a.push(x(e[r],{modifiers:A,structs:t,type:"function"}))}return{name:r.name,type:"function",stateMutability:r.stateMutability??"nonpayable",inputs:i,outputs:a}}if(function(e){return h.test(e)}(e)){const r=function(e){return n(h,e)}(e);if(!r)throw new u("Invalid event signature.",{details:e});const o=O(r.parameters),i=[],s=o.length;for(let e=0;e<s;e++)i.push(x(o[e],{modifiers:_,structs:t,type:"event"}));return{name:r.name,type:"event",inputs:i}}if(function(e){return l.test(e)}(e)){const r=function(e){return n(l,e)}(e);if(!r)throw new u("Invalid error signature.",{details:e});const o=O(r.parameters),i=[],s=o.length;for(let e=0;e<s;e++)i.push(x(o[e],{structs:t,type:"error"}));return{name:r.name,type:"error",inputs:i}}if(function(e){return y.test(e)}(e)){const r=function(e){return n(y,e)}(e);if(!r)throw new u("Invalid constructor signature.",{details:e});const o=O(r.parameters),i=[],s=o.length;for(let e=0;e<s;e++)i.push(x(o[e],{structs:t,type:"constructor"}));return{type:"constructor",stateMutability:r.stateMutability??"nonpayable",inputs:i}}if(function(e){return v.test(e)}(e))return{type:"fallback"};if(function(e){return b.test(e)}(e))return{type:"receive",stateMutability:"payable"};throw new u("Unknown signature.",{details:e})}var I=/^(?<type>[a-zA-Z0-9_]+?)(?<array>(?:\[\d*?\])+?)?(?:\s(?<modifier>calldata|indexed|memory|storage{1}))?(?:\s(?<name>[a-zA-Z0-9_]+))?$/,R=/^\((?<type>.+?)\)(?<array>(?:\[\d*?\])+?)?(?:\s(?<modifier>calldata|indexed|memory|storage{1}))?(?:\s(?<name>[a-zA-Z0-9_]+))?$/,P=/^u?int$/;function x(e,t){const r=function(e,t){return t?`${t}:${e}`:e}(e,t?.type);if(T.has(r))return T.get(r);const a=s.test(e),c=n(a?R:I,e);if(!c)throw new u("Invalid ABI parameter.",{details:e});if(c.name&&function(e){return"address"===e||"bool"===e||"function"===e||"string"===e||"tuple"===e||o.test(e)||i.test(e)||C.test(e)}(c.name))throw new u("Invalid ABI parameter.",{details:e,metaMessages:[`"${c.name}" is a protected Solidity keyword. More info: https://docs.soliditylang.org/en/latest/cheatsheet.html`]});const d=c.name?{name:c.name}:{},l="indexed"===c.modifier?{indexed:!0}:{},h=t?.structs??{};let f,p={};if(a){f="tuple";const e=O(c.type),t=[],r=e.length;for(let n=0;n<r;n++)t.push(x(e[n],{structs:h}));p={components:t}}else if(c.type in h)f="tuple",p={components:h[c.type]};else if(P.test(c.type))f=`${c.type}256`;else if(f=c.type,"struct"!==t?.type&&!S(f))throw new u("Unknown type.",{metaMessages:[`Type "${f}" is not a valid ABI type.`]});if(c.modifier){if(!t?.modifiers?.has?.(c.modifier))throw new u("Invalid ABI parameter.",{details:e,metaMessages:[`Modifier "${c.modifier}" not allowed${t?.type?` in "${t.type}" type`:""}.`]});if(A.has(c.modifier)&&!function(e,t){return t||"bytes"===e||"string"===e||"tuple"===e}(f,!!c.array))throw new u("Invalid ABI parameter.",{details:e,metaMessages:[`Modifier "${c.modifier}" not allowed${t?.type?` in "${t.type}" type`:""}.`,`Data location can only be specified for array, struct, or mapping types, but "${c.modifier}" was given.`]})}const m={type:`${f}${c.array??""}`,...d,...l,...p};return T.set(r,m),m}function O(e,t=[],r="",n=0){if(""===e){if(""===r)return t;if(0!==n)throw new u("Unbalanced parentheses.",{metaMessages:[`"${r.trim()}" has too many ${n>0?"opening":"closing"} parentheses.`],details:`Depth "${n}"`});return[...t,r.trim()]}const o=e.length;for(let i=0;i<o;i++){const o=e[i],s=e.slice(i+1);switch(o){case",":return 0===n?O(s,[...t,r.trim()]):O(s,t,`${r}${o}`,n);case"(":return O(s,t,`${r}${o}`,n+1);case")":return O(s,t,`${r}${o}`,n-1);default:return O(s,t,`${r}${o}`,n)}}return[]}function S(e){return"address"===e||"bool"===e||"function"===e||"string"===e||o.test(e)||i.test(e)}var C=/^(?:after|alias|anonymous|apply|auto|byte|calldata|case|catch|constant|copyof|default|defined|error|event|external|false|final|function|immutable|implements|in|indexed|inline|internal|let|mapping|match|memory|mutable|null|of|override|partial|private|promise|public|pure|reference|relocatable|return|returns|sizeof|static|storage|struct|super|supports|switch|this|true|try|typedef|typeof|var|view|virtual)$/;function B(e){const t={},r=e.length;for(let n=0;n<r;n++){const r=e[n];if(!m(r))continue;const o=g(r);if(!o)throw new u("Invalid struct signature.",{details:r});const i=o.properties.split(";"),s=[],a=i.length;for(let e=0;e<a;e++){const t=i[e].trim();if(!t)continue;const r=x(t,{type:"struct"});s.push(r)}if(!s.length)throw new u("Invalid struct signature.",{details:r,metaMessages:["No properties exist."]});t[o.name]=s}const n={},o=Object.entries(t),i=o.length;for(let e=0;e<i;e++){const[r,i]=o[e];n[r]=N(i,t)}return n}var k=/^(?<type>[a-zA-Z0-9_]+?)(?<array>(?:\[\d*?\])+?)?$/;function N(e,t,r=new Set){const o=[],i=e.length;for(let a=0;a<i;a++){const i=e[a];if(s.test(i.type))o.push(i);else{const e=n(k,i.type);if(!e?.type)throw new u("Invalid ABI parameter.",{details:JSON.stringify(i,null,2),metaMessages:["ABI parameter type is invalid."]});const{array:s,type:a}=e;if(a in t){if(r.has(a))throw new u("Circular reference detected.",{metaMessages:[`Struct "${a}" is a circular reference.`]});o.push({...i,type:`tuple${s??""}`,components:N(t[a]??[],t,new Set([...r,a]))})}else{if(!S(a))throw new u("Unknown type.",{metaMessages:[`Type "${a}" is not a valid ABI type. Perhaps you forgot to include a struct signature?`]});o.push(i)}}}return o}function M(e){const t=B(e),r=[],n=e.length;for(let o=0;o<n;o++){const n=e[o];m(n)||r.push(w(n,t))}return r}function L(e){let t;if("string"==typeof e)t=w(e);else{const r=B(e),n=e.length;for(let o=0;o<n;o++){const n=e[o];if(!m(n)){t=w(n,r);break}}}if(!t)throw new u("Failed to parse ABI item.",{details:`parseAbiItem(${JSON.stringify(e,null,2)})`,docsPath:"/api/human.html#parseabiitem-1"});return t}function D(e){let t;if("string"==typeof e)t=x(e,{modifiers:E});else{const r=B(e),n=e.length;for(let o=0;o<n;o++){const n=e[o];if(!m(n)){t=x(n,{modifiers:E,structs:r});break}}}if(!t)throw new u("Failed to parse ABI parameter.",{details:`parseAbiParameter(${JSON.stringify(e,null,2)})`,docsPath:"/api/human.html#parseabiparameter-1"});return t}function F(e){const t=[];if("string"==typeof e){const r=O(e),n=r.length;for(let e=0;e<n;e++)t.push(x(r[e],{modifiers:E}))}else{const r=B(e),n=e.length;for(let o=0;o<n;o++){const n=e[o];if(m(n))continue;const i=O(n),s=i.length;for(let e=0;e<s;e++)t.push(x(i[e],{modifiers:E,structs:r}))}}if(0===t.length)throw new u("Failed to parse ABI parameters.",{details:`parseAbiParameters(${JSON.stringify(e,null,2)})`,docsPath:"/api/human.html#parseabiparameters-1"});return t}}},t={};function r(n){var o=t[n];if(void 0!==o)return o.exports;var i=t[n]={id:n,loaded:!1,exports:{}};return e[n].call(i.exports,i,i.exports,r),i.loaded=!0,i.exports}r.d=(e,t)=>{for(var n in t)r.o(t,n)&&!r.o(e,n)&&Object.defineProperty(e,n,{enumerable:!0,get:t[n]})},r.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"==typeof window)return window}}(),r.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),r.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.nmd=e=>(e.paths=[],e.children||(e.children=[]),e);var n=r(9375);return n.default})()));

}).call(this)}).call(this,require("timers").setImmediate)
},{"timers":34}],32:[function(require,module,exports){

},{}],33:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],34:[function(require,module,exports){
(function (setImmediate,clearImmediate){(function (){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this)}).call(this,require("timers").setImmediate,require("timers").clearImmediate)
},{"process/browser.js":33,"timers":34}]},{},[1]);
