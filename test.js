var ASSERT = require('assert')

  , OLDLADY = require('./index')

var tests = [];


tests.push(function (done) {
    "";

    function onSuccess(res) {
      console.log(res);
      return done();
    }

    function onFailure(err) {
      printError(err);
      wrapAssertion(function () {
        assert(false, ".failure() handler should not be called.")
      });
    };

    OLDLADY.request()
      .then(onSuccess)
      .failure(onFailure)
});

// End of testing.
tests.push(function () { console.log('PASSED'); });


// ---


// Helpers

function type(obj) {
  return typeof obj;
}

function printError(err) {
  err = err || {};
  console.error("Testing Error:");
  console.error(err.stack || err.message || err.toString());
}

function wrapAssertion(block) {
  try {
    block();
  } catch (err) {
    printError(err);
    process.exit(1);
  }
}

// Test vocabulary

function assert(val, msg) {
  msg = 'assert '+ val +'; '+ msg;
  return ASSERT.ok(val, msg);
}

function equal(actual, expected, msg) {
  msg = actual +' !== '+ expected +'; '+ msg;
  return ASSERT.strictEqual(actual, expected, msg);
}

function notEqual(actual, expected, msg) {
  msg = actual +' == '+ expected +'; '+ msg;
  return ASSERT.notEqual(actual, expected, msg);
}

// Compose test functions using continuation passing.
function asyncStack(functions) {
  var callback = functions.pop()
    , last = callback

  functions.reverse().forEach(function (fn) {
      var child = callback;
      callback = function () {
          fn(child);
      };
  });
  return callback;
}

// Run tests.
if (module === require.main) {
    asyncStack(tests)();
}
