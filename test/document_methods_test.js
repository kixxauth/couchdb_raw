var COUCH = require('../index')
  , LIB = require('./lib')

exports["document operations"] = {

  setUp: function (done) {
    var dbname = this.dbname = 'couchdb_raw_tests'
      , createDoc = this.createDoc = 'create_doc_fo4098asf234'
      , removeDoc = this.removeDoc = 'remove_doc_3450d98sdljk'
      , updateDoc = this.updateDoc = 'update_doc_3450d98sdljk'

    function setCreatePath (res) {
      return '/'+ dbname +'/'+ createDoc;
    }

    LIB.ensureDatabase(dbname)
      .then(setCreatePath)
      .then(LIB.removeDocument)
      .then(LIB.noop)
      .then(done)
  },

  "PUT/create": function (test) {
    var docname = this.createDoc

    test.expect(7)

    function success(res) {
      test.strictEqual(res.statusCode, 201, 'status code')
      test.assertJSON(res, 'JSON')
      test.ok(res.body.ok, 'ok')
      test.equal(res.body.id, docname, 'doc.id')
      test.equal(typeof res.body.rev, 'string', 'doc.rev')
      test.equal(typeof res.body.model, 'undefined', 'doc.model')
      test.equal(Object.keys(res.body).length, 3, 'Object.keys(doc)')
      return test.done();
    }

    COUCH.request({
      method: 'PUT'
    , path: '/'+ this.dbname +'/'+ docname
    , data: {model: 'Foo'}
    , hostname: HOSTNAME
    , port: PORT
    , username: USERNAME
    , password: PASSWORD
    }).then(success).failure(test.done);
  }
};

