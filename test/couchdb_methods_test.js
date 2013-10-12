var COUCH = require('../index')

exports["Configs"] = {

  "get configs": function (test) {
    test.expect(8);

    function success(res) {
      test.strictEqual(res.statusCode, 200, 'Status Code');
      test.assertJSON(res, 'Content type JSON');
      test.ok(res.body.hasOwnProperty('stats'), 'stats property');
      test.ok(res.body.hasOwnProperty('replicator'), 'replicator property');
      test.ok(res.body.hasOwnProperty('log'), 'log property');
      test.ok(res.body.hasOwnProperty('httpd'), 'httpd property');
      test.ok(res.body.hasOwnProperty('couch_httpd_auth'), 'couch_httpd_auth property');
      test.ok(res.body.hasOwnProperty('couchdb'), 'couchdb property');
      return test.done();
    }

    COUCH.request({
      method: 'GET'
    , path: '/_config'
    , hostname: HOSTNAME
    , port: PORT
    , username: USERNAME
    , password: PASSWORD
    }).then(success).failure(test.done);
  }
};

exports["create a database"] = {

  setUp: function (done) {
    this.dbname = 'create_couchdb_raw_tests';
    COUCH.request({
      method: 'DELETE'
    , path: '/'+ this.dbname
    , hostname: HOSTNAME
    , port: PORT
    , username: USERNAME
    , password: PASSWORD
    })
    .then(function () { return done() })
    .failure(done)
  },

  "create a database": function (test) {
    test.expect(3);

    function success(res) {
      test.strictEqual(res.statusCode, 201, 'status code')
      test.assertJSON(res, 'JSON')
      test.ok(res.body.ok, 'ok')
      return test.done();
    }

    COUCH.request({
      method: 'PUT'
    , path: '/'+ this.dbname
    , hostname: HOSTNAME
    , port: PORT
    , username: USERNAME
    , password: PASSWORD
    }).then(success).failure(test.done);
  }
};

exports["delete a database"] = {

  setUp: function (done) {
    this.dbname = 'delete_couchdb_raw_tests';
    COUCH.request({
      method: 'PUT'
    , path: '/'+ this.dbname
    , hostname: HOSTNAME
    , port: PORT
    , username: USERNAME
    , password: PASSWORD
    })
    .then(function () { return done() })
    .failure(done)
  },

  "create a database": function (test) {
    test.expect(3);

    function success(res) {
      test.strictEqual(res.statusCode, 200, 'status code')
      test.assertJSON(res, 'JSON')
      test.ok(res.body.ok, 'ok')
      return test.done();
    }

    COUCH.request({
      method: 'DELETE'
    , path: '/'+ this.dbname
    , hostname: HOSTNAME
    , port: PORT
    , username: USERNAME
    , password: PASSWORD
    }).then(success).failure(test.done);
  }
};
