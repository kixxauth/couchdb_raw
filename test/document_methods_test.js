var COUCH = require('../index')

exports["document operations"] = {

  setUp: (function () {
    var dbname

    return function (done) {
      this.dbname = 'couchdb_raw_tests';
      this.docname = 'asdfoij4098asf234';
      var path = '/'+ this.dbname +'/'+ this.docname;

      if (dbname) {
        this.dbname = dbname;
        return deleteIfExists(path, done);
      }

      dbname = this.dbname;

      COUCH.request({
        method: 'PUT'
      , path: '/'+ this.dbname
      , hostname: HOSTNAME
      , port: PORT
      , username: USERNAME
      , password: PASSWORD
      }).then(function (res) {
        if (res.statusCode !== 201 && res.statusCode !== 412) {
          var msg = "Unexpected response status in setUp: "+ res.statusCode;
          return done(new Error(msg));
        }
        return deleteIfExists(path, done);
      }).failure(done);
    };
  }()),

  "PUT/create": function (test) {
    var docname = this.docname

    test.expect(5)

    function success(res) {
      test.strictEqual(res.statusCode, 201, 'status code')
      test.assertJSON(res, 'JSON')
      test.ok(res.body.ok, 'ok')
      test.equal(res.body.id, docname, 'doc.id')
      test.equal(typeof res.body.rev, 'string', 'doc.rev')
      return test.done();
    }

    COUCH.request({
      method: 'PUT'
    , path: '/'+ this.dbname +'/'+ this.docname
    , data: {model: 'Foo'}
    , hostname: HOSTNAME
    , port: PORT
    , username: USERNAME
    , password: PASSWORD
    }).then(success).failure(test.done);
  }
};


function deleteIfExists(path, callback) {
  function gotDocument(res) {
    if (res.statusCode !== 200) return;

    return COUCH.request({
      method: 'DELETE'
    , path: path
    , rev: res.body._rev
    , hostname: HOSTNAME
    , port: PORT
    , username: USERNAME
    , password: PASSWORD
    }).then(function () {});
  }

  COUCH.request({
    method: 'GET'
  , path: path
  , hostname: HOSTNAME
  , port: PORT
  , username: USERNAME
  , password: PASSWORD
  })
  .then(gotDocument)
  .then(callback)
  .failure(callback);
}
