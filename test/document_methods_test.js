var COUCH = require('../index')
  , LIB = require('./lib')

exports["document operations"] = {

  setUp: function (done) {
    var dbname = this.dbname = 'couchdb_raw_tests';
    var docname = this.docname = 'asdfoij4098asf234';

    function setPath (res) {
      return '/'+ dbname +'/'+ docname;
    }

    LIB.ensureDatabase()
      .then(setPath)
      .then(LIB.removeDocument)
      .then(LIB.noop)
      .then(done)
  },

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

