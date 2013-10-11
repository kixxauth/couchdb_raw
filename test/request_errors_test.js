var COUCH = require('../index')


exports["Argument errors"] = {

  "path that does not begin with '/'": function (test) {
    test.expect(1);

    try {
      COUCH.request({path: 'foo'});
    } catch (err) {
      test.equal(err.message, "opts.path must start with a '/'.", "no '/' error");
    }

    return test.done();
  }
};

exports["Connection errors"] = {

  "fail with unreachable host": function (test) {
    test.expect(2);

    function testError(err) {
      test.strictEqual(err.code, 'ENOTFOUND', "Error code");
      test.equal(err.message, "No CouchDB server found at 'foo.bar.baz'.", "Error message");
      return test.done();
    }

    COUCH.request({hostname: 'foo.bar.baz'})
      .then(noop).failure(testError)
      .failure(test.done)
  }
};

exports["Authentication errors"] = {

  "deny access without credentials": function (test) {
    test.expect(4);

    function testResult(res) {
      test.strictEqual(res.statusCode, 401, 'Status Code');
      test.assertJSON(res);
      test.equal(res.body.error, 'unauthorized', 'body.error');
      test.equal(res.body.reason, 'Authentication required.', 'body.reason');
      return test.done();
    }

    COUCH.request({
      method: 'GET'
    , path: '/_config'
    , hostname: HOSTNAME
    , port: PORT
    }).then(testResult).failure(test.done);
  }
};


function noop() {}