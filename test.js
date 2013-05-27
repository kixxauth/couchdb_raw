var ASSERT = require('assert')

  , OLDLADY = require('./index')

  , USERNAME
  , PASSWORD
  , HOSTNAME
  , PORT

// Parse arguments.
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


// Collect test functions.
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
    wrapAssertion(function () {
      assert(false, ".then() handler should not be called.")
    }, done);
  }

  function onFailure(err) {
    wrapAssertion(function () {
      equal(err.code, 'ENOTFOUND');
      equal(err.message, "No CouchDB server found at 'foo.bar.baz'.")
    }, done);
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
    assertContentType('json', res);
    equal(data.error, "unauthorized");
    equal(data.reason, "Authentication required.");
    return done();
  }

  var opts = defaultOpts({
    path: '/_config'
  , username: ''
  , password: ''
  });

  OLDLADY.request(opts)
    .then(onSuccess)
    .failure(catchFailure(done))
});

tests.push(function (done) {
  "It should respond with configurations.";

  function onSuccess(res) {
    data = res.body;
    equal(res.statusCode, 200);
    assertContentType('json', res);
    assert(data.hasOwnProperty('stats'), 'has stats');
    assert(data.hasOwnProperty('replicator'), 'has replicator');
    assert(data.hasOwnProperty('log'), 'has log');
    assert(data.hasOwnProperty('httpd'), 'has httpd');
    assert(data.hasOwnProperty('couch_httpd_auth'), 'has couch_httpd_auth');
    assert(data.hasOwnProperty('couchdb'), 'has couchdb');
    return done();
  }

  var opts = defaultOpts({
    path: '/_config'
  });

  OLDLADY.request(opts)
    .then(onSuccess)
    .failure(catchFailure(done))
});

tests.push(function (done) {
  "It should create a database.";

  function onSuccess(res) {
    data = res.body;
    equal(res.statusCode, 201);
    assertContentType('json', res);
    assert(data.ok);
    return done();
  }

  var opts = defaultOpts({
    method: 'PUT'
  , path: '/oldlady_tests'
  });

  OLDLADY.request(opts)
    .then(onSuccess)
    .failure(catchFailure(done))
});

(function () {
  "Create, update, and delete a document.";
  var rev, id;

  tests.push(function (done) {
    "It should PUT a new document.";

    function onSuccess(res) {
      data = res.body;
      equal(res.statusCode, 201);
      assertContentType('json', res);
      assert(data.ok);
      equal(data.id, 'mydocument');
      rev = data.rev;
      return done();
    }

    var opts = defaultOpts({
      method: 'PUT'
    , path: '/oldlady_tests/mydocument'
    , data: {model: "Foo"}
    });

    OLDLADY.request(opts)
      .then(onSuccess)
      .failure(catchFailure(done))
  });

  tests.push(function (done) {
    "It should DELETE a document.";

    function onSuccess(res) {
      data = res.body;
      equal(res.statusCode, 200);
      assertContentType('json', res);
      assert(data.ok);
      equal(data.id, 'mydocument');
      return done();
    }

    var opts = defaultOpts({
      method: 'DELETE'
    , path: '/oldlady_tests/mydocument'
    , rev: rev
    });

    OLDLADY.request(opts)
      .then(onSuccess)
      .failure(catchFailure(done))
  });

  tests.push(function (done) {
    "It should POST a new document.";

    function onSuccess(res) {
      data = res.body;
      equal(res.statusCode, 201);
      assertContentType('json', res);
      assert(data.ok, 'data.ok');
      equal(data.id.length, 32, 'uid length: '+ data.id.length);
      id = data.id;
      return done();
    }

    var opts = defaultOpts({
      method: 'POST'
    , path: '/oldlady_tests/'
    , data: {model: "Foo"}
    });

    OLDLADY.request(opts)
      .then(onSuccess)
      .failure(catchFailure(done))
  });

  tests.push(function (done) {
    "It should GET a document.";

    function onSuccess(res) {
      data = res.body;
      equal(res.statusCode, 200);
      assertContentType('json', res);
      keys = Object.keys(data);
      assert(keys.indexOf('_id') !== -1, '_id');
      assert(keys.indexOf('_rev') !== -1, '_rev');
      assert(keys.indexOf('model') !== -1, 'model');
      rev = data._rev;
      return done();
    }

    var opts = defaultOpts({
      path: '/oldlady_tests/'+ id
    });

    OLDLADY.request(opts)
      .then(onSuccess)
      .failure(catchFailure(done))
  });

  tests.push(function (done) {
    "It requires authentication to GET a document.";

    function onSuccess(res) {
      data = res.body;
      equal(res.statusCode, 401);
      assertContentType('json', res);
      equal(data.error, "unauthorized");
      equal(data.reason, "Authentication required.");
      return done();
    }

    var opts = defaultOpts({
      path: '/oldlady_tests/'+ id
    , username: ''
    , password: ''
    });

    OLDLADY.request(opts)
      .then(onSuccess)
      .failure(catchFailure(done))
  });

  tests.push(function (done) {
    "It should update document.";

    function onSuccess(res) {
      data = res.body;
      equal(res.statusCode, 201);
      assertContentType('json', res);
      assert(data.ok, 'data.ok');
      equal(data.id, id);
      return done();
    }

    var opts = defaultOpts({
      method: 'PUT'
    , path: '/oldlady_tests/'+ id
    , data: {model: "Bar"}
    , rev: rev
    });

    OLDLADY.request(opts)
      .then(onSuccess)
      .failure(catchFailure(done))
  });
}());

(function () {
  "Create, update, qeury, and delete a view.";
  var rev

  tests.push(function (done) {
    "It should PUT a new view.";

    function onSuccess(res) {
      data = res.body;
      equal(res.statusCode, 201);
      assertContentType('json', res);
      assert(data.ok);
      equal(data.id, '_design/app');
      rev = data.rev;
      return done();
    }

    var map = (function (doc) {
      emit(doc.color, doc);
    }).toString();

    var opts = defaultOpts({
      method: 'PUT'
    , path: '/oldlady_tests/_design/app'
    , data: {
        views: {
          by_color: {map: map}
        }
      }
    });

    OLDLADY.request(opts)
      .then(onSuccess)
      .failure(catchFailure(done))
  });

  tests.push(function (done) {
    "It should update a view document.";

    function onSuccess(res) {
      data = res.body;
      equal(res.statusCode, 201);
      assertContentType('json', res);
      assert(data.ok);
      equal(data.id, '_design/app');
      rev = data.rev;
      return done();
    }

    var map = (function (doc) {
      emit(doc.color, null);
    }).toString();

    var reduce = (function (key, values, rereduce) {
      var rv = {}, i, len, val, color;

      if (rereduce) {
        len = values.length;
        for (i = 0; i < len; i += 1) {
          val = values[i];
          for (color in val) {
            if (val.hasOwnProperty(color)) {
              rv[color] = rv[color] || 0;
              rv[color] += val[color];
            }
          }
        }
      } else {
        len = key.length;
        for (i = 0; i < len; i += 1) {
          color = key[i][0];
          rv[color] = rv[color] || 0;
          rv[color] += 1;
        }
      }

      return rv;
    }).toString();

    var opts = defaultOpts({
      method: 'PUT'
    , path: '/oldlady_tests/_design/app'
    , rev: rev
    , data: {
        views: {
          by_color: {map: map, reduce: reduce}
        }
      }
    });

    OLDLADY.request(opts)
      .then(onSuccess)
      .failure(catchFailure(done))
  });

  tests.push(function (done) {
    "It should create documents in bulk.";

    function onSuccess(res) {
      data = res.body;
      equal(res.statusCode, 201);
      assertContentType('json', res);
      assert(Array.isArray(data), 'data is an array');
      return done();
    }

    docs = [
      {color: 'red'},{color: 'green'},{color: 'blue'},
      {color: 'red'},{color: 'red'},{color: 'red'},
      {color: 'green'},{color: 'yellow'},{color: 'purple'}
    ];

    var opts = defaultOpts({
      method: 'POST'
    , path: '/oldlady_tests/_bulk_docs'
    , data: {docs: docs}
    });

    OLDLADY.request(opts)
      .then(onSuccess)
      .failure(catchFailure(done))
  });

  tests.push(function (done) {
    "It should query a view.";

    function onSuccess(res) {
      data = res.body;
      equal(res.statusCode, 200);
      assertContentType('json', res);
      rv = data.rows[0].value;

      // Reduce by default.
      equal(rv['red'], 4, 'total red');
      return done();
    }

    // Will reduce by default since there is a reduce function.
    var opts = defaultOpts({
      method: 'GET'
    , path: '/oldlady_tests/_design/app/_view/by_color'
    });

    OLDLADY.request(opts)
      .then(onSuccess)
      .failure(catchFailure(done))
  });

  tests.push(function (done) {
    "It should DELETE a view.";

    function onSuccess(res) {
      data = res.body;
      equal(res.statusCode, 200);
      assertContentType('json', res);
      assert(data.ok);
      equal(data.id, '_design/app');
      return done();
    }

    var opts = defaultOpts({
      method: 'DELETE'
    , path: '/oldlady_tests/_design/app'
    , rev: rev
    });

    OLDLADY.request(opts)
      .then(onSuccess)
      .failure(catchFailure(done))
  });
}());

tests.push(function (done) {
  "It should delete a database.";

  function onSuccess(res) {
    equal(res.statusCode, 200);
    assertContentType('json', res);
    data = res.body;
    assert(data.ok);
    return done();
  }

  var opts = defaultOpts({
    method: 'DELETE'
  , path: '/oldlady_tests'
  });

  OLDLADY.request(opts)
    .then(onSuccess)
    .failure(catchFailure(done))
});

// End of testing.
tests.push(function () { console.log('DONE'); });


// ---


// Helpers

function defaultOpts(opts) {
  var rv = {
    hostname: HOSTNAME
  , port: PORT
  , username: USERNAME
  , password: PASSWORD
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

function wrapAssertion(block, next) {
  try {
    block();
  } catch (err) {
    printError(err);
  }

  return next();
}

function catchFailure(next) {
  return function (err) {
    printError(err);
    return next();
  };
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

function assertContentType(type, res) {
  contentType = res.headers['content-type'];
  assert(/^application\/json/.test(contentType), contentType);
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
