var ASSERT = require('assert')

  , OLDLADY = require('./index')

  , USERNAME
  , PASSWORD
  , HOSTNAME
  , PORT

!(function () {
  var uri = process.argv[2] || '@'
    , parts = uri.split('@')
    , creds, host

  if (parts.length > 1) {
    creds = parts[0];
    host = parts[1];
  } else {
    creds = ':';
    host = parts[0];
  }

  parts = creds.split(':');
  USERNAME = parts[0] || '';
  PASSWORD = parts[1] || '';
  parts = host.split(':');
  HOSTNAME = parts[0] || 'localhost';
  PORT = parts[1] || 5984;
}());

console.log('Testing with:');
console.log("username:", USERNAME)
console.log("password:", PASSWORD)
console.log("hostname:", HOSTNAME)
console.log("port:", PORT)

var tests = [];


tests.push(function (done) {
  "It should throw an error if the path does not begin with a slash.";

  try {
    OLDLADY.request({path: 'foo'})
  } catch (err) {
    equal(err.message, "opts.path must start with a '/'.", "no '/' error");
  }

  return done();
});

tests.push(function (done) {
  "It should report unreachable host.";

  function onSuccess(res) {
    printError(err);
    wrapAssertion(function () {
      assert(false, ".then() handler should not be called.")
    });
  }

  function onFailure(err) {
    wrapAssertion(function () {
      equal(err.code, 'ENOTFOUND');
      equal(err.message, "No CouchDB server found at 'foo.bar.baz'.")
    });
    return done();
  };

  var opts = defaultOpts({
    hostname: 'foo.bar.baz'
  });

  OLDLADY.request(opts)
    .then(onSuccess)
    .failure(onFailure)
});

tests.push(function (done) {
  "It should deny access without credentials.";

  function onSuccess(res) {
    data = res.body;
    equal(res.statusCode, 401);
    contentType = res.headers['content-type'];
    assert(/^application\/json/.test(contentType), contentType);
    equal(data.error, "unauthorized");
    equal(data.reason, "You are not a server admin.");
    return done();
  }

  function onFailure(err) {
    printError(err);
    wrapAssertion(function () {
      assert(false, ".failure() handler should not be called.")
    });
  };

  var opts = defaultOpts({
    path: '/_config'
  });

  OLDLADY.request(opts)
    .then(onSuccess)
    .failure(onFailure)
});

tests.push(function (done) {
  "It should respond with configurations.";

  function onSuccess(res) {
    equal(res.statusCode, 200);
    contentType = res.headers['content-type'];
    data = res.body;

    assert(/^application\/json/.test(contentType), contentType);
    assert(data.hasOwnProperty('stats'), 'has stats');
    assert(data.hasOwnProperty('replicator'), 'has replicator');
    assert(data.hasOwnProperty('log'), 'has log');
    assert(data.hasOwnProperty('httpd'), 'has httpd');
    assert(data.hasOwnProperty('couch_httpd_auth'), 'has couch_httpd_auth');
    assert(data.hasOwnProperty('couchdb'), 'has couchdb');
    return done();
  }

  function onFailure(err) {
    printError(err);
    wrapAssertion(function () {
      assert(false, ".failure() handler should not be called.")
    });
  };

  var opts = defaultOpts({
    path: '/_config'
  , username: USERNAME
  , password: PASSWORD
  });

  OLDLADY.request(opts)
    .then(onSuccess)
    .failure(onFailure)
});

tests.push(function (done) {
  "It should create a database.";

  function onSuccess(res) {
    equal(res.statusCode, 201);
    contentType = res.headers['content-type'];
    assert(/^application\/json/.test(contentType), contentType);
    data = res.body;
    assert(data.ok);
    return done();
  }

  function onFailure(err) {
    printError(err);
    wrapAssertion(function () {
      assert(false, ".failure() handler should not be called.")
    });
  };

  var opts = defaultOpts({
    method: 'PUT'
  , path: '/oldlady_tests'
  , username: USERNAME
  , password: PASSWORD
  });

  OLDLADY.request(opts)
    .then(onSuccess)
    .failure(onFailure)
});

tests.push(function (done) {
  "It should delete a database.";

  function onSuccess(res) {
    equal(res.statusCode, 200);
    contentType = res.headers['content-type'];
    assert(/^application\/json/.test(contentType), contentType);
    data = res.body;
    assert(data.ok);
    return done();
  }

  function onFailure(err) {
    printError(err);
    wrapAssertion(function () {
      assert(false, ".failure() handler should not be called.")
    });
  };

  var opts = defaultOpts({
    method: 'DELETE'
  , path: '/oldlady_tests'
  , username: USERNAME
  , password: PASSWORD
  });

  OLDLADY.request(opts)
    .then(onSuccess)
    .failure(onFailure)
});

// End of testing.
tests.push(function () { console.log('PASSED'); });


// ---


// Helpers

function defaultOpts(opts) {
  var rv = {
    hostname: HOSTNAME
  , port: PORT
  , method: 'GET'
  , path: '/'
  };

  rv = Object.keys(opts).reduce(function (rv, key) {
    rv[key] = opts[key];
    return rv;
  }, rv);

  return rv;
}

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
