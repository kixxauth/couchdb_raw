var COUCH = require('../index')
  , LIB = require('./lib')

exports["view doument operations"] = {

  setUp: function (done) {
    var dbname = this.dbname = 'couchdb_raw_tests'
      , createDoc = this.createDoc = 'create_doc_app'
      , updateDoc = this.updateDoc = 'update_doc_app'
      , removeDoc = this.removeDoc = 'remove_doc_app'
      , views, fixture
      , removeFixture

    views = {
      'by_model': {map: "function (doc) { emit(doc.class_name, doc); }"}
    };

    fixture = this.fixture = {
      views: {'my_app': views}
    };

    removeFixture = this.removeFixture = {};

    function setCreatePath() {
      return '/'+ dbname +'/_design/'+ createDoc;
    }

    function setUpdatePath() {
      var views = {'foo': {map: "function (doc) { emit(doc.id, doc); }"}}
      return {path: '/'+ dbname +'/_design/'+ updateDoc, data: {views: views}};
    }

    function setDeletePath() {
      var views = {'bar': {map: "function (doc) { emit(doc.id, doc); }"}}
      return {path: '/'+ dbname +'/_design/'+ removeDoc, data: {views: views}};
    }

    function captureFixture(res) {
      fixture._id = res.body._id;
      fixture._rev = res.body._rev;
      return;
    }

    function captureRemoveFixture(res) {
      removeFixture._rev = res.body._rev;
      return;
    }

    LIB.ensureDatabase(dbname)
      .then(setCreatePath)
      .then(LIB.removeDocument)
      .then(setUpdatePath)
      .then(LIB.ensureDocument)
      .then(captureFixture)
      .then(setDeletePath)
      .then(LIB.ensureDocument)
      .then(captureRemoveFixture)
      .then(done)
      .failure(done)
  },

  "PUT/create and GET": function (test) {
    var dbname = this.dbname
      , docname = this.createDoc
      , views = {'baz': {map: "function (doc) { emit(doc.id, doc); }"}}

    test.expect(16);

    // Create the document:
    function putDocument() {
      var promise = COUCH.request({
        method: 'PUT'
      , path: '/'+ dbname +'/_design/'+ docname
      , data: {views: views}
      , hostname: HOSTNAME
      , port: PORT
      , username: USERNAME
      , password: PASSWORD
      });
      return promise;
    }

    // Retrieve the document:
    function getDoc(putResponse) {
      var promise = COUCH.request({
        method: 'GET'
      , path: '/'+ dbname +'/_design/'+ docname
      , hostname: HOSTNAME
      , port: PORT
      , username: USERNAME
      , password: PASSWORD
      }).then(function (res) {
        return {put: putResponse, get: res};
      });
      return promise;
    }

    function getView(responses) {
      var promise = COUCH.request({
        method: 'GET'
      , path: '/'+ dbname +'/_design/'+ docname + '/_view/baz'
      , hostname: HOSTNAME
      , port: PORT
      , username: USERNAME
      , password: PASSWORD
      }).then(function (res) {
        responses.getView = res;
        return responses;
      });
      return promise;
    }

    // Test the results:
    function runTests(responses) {
      var get = responses.get
        , put = responses.put
        , getView = responses.getView

      // Test the PUT
      test.strictEqual(put.statusCode, 201, 'PUT status code')
      test.assertJSON(put, 'PUT JSON')
      test.ok(put.body.ok, 'ok')
      test.equal(put.body.id, '_design/'+ docname, 'doc.id')
      test.equal(typeof put.body.rev, 'string', 'doc.rev')
      test.equal(Object.keys(put.body).length, 3, 'PUT Object.keys(doc)')

      // Test the GET
      test.strictEqual(get.statusCode, 200, 'GET status code')
      test.assertJSON(get, 'GET JSON')
      test.equal(get.body._id, '_design/'+ docname, 'GET doc._id')
      test.equal(typeof get.body._rev, 'string', 'GET doc._rev')
      test.equal(put.body.rev, get.body._rev, 'correct revision')
      test.equal(get.body.views.baz.map, 'function (doc) { emit(doc.id, doc); }', 'doc.views')

      // Test GET view
      test.strictEqual(getView.statusCode, 200, 'GET status code')
      test.assertJSON(getView, 'GET JSON')
      test.ok(typeof getView.body.total_rows === 'number', 'GET view total_rows')
      test.ok(Array.isArray(getView.body.rows), 'GET view rows')

      // Make sure to return undefined.
      return;
    }

    putDocument()
      .then(getDoc)
      .then(getView)
      .then(runTests)
      .then(test.done)
      .failure(test.done);
  },
};
