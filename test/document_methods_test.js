var COUCH = require('../index')
  , LIB = require('./lib')

exports["document operations"] = {

  setUp: function (done) {
    var dbname = this.dbname = 'couchdb_raw_tests'
      , createDoc = this.createDoc = 'create_doc_fo4098asf234'
      , updateDoc = this.updateDoc = 'update_doc_3450d98sdljk'
      , removeDoc = this.removeDoc = 'remove_doc_3450d98sdljk'
      , fixture

    fixture = this.fixture = {
      model: 'Person'
    , name: 'Bill'
    , age: 41
    }

    function setCreatePath (res) {
      return '/'+ dbname +'/'+ createDoc;
    }

    function setUpdatePath (res) {
      return {path: '/'+ dbname +'/'+ updateDoc, data: fixture};
    }

    function captureFixture (res) {
      fixture._id = res.body._id;
      fixture._rev = res.body._rev;
      return;
    }

    LIB.ensureDatabase(dbname)
      .then(setCreatePath)
      .then(LIB.removeDocument)
      .then(setUpdatePath)
      .then(LIB.ensureDocument)
      .then(captureFixture)
      .then(done)
      .failure(done)
  },

  "PUT/create and GET": function (test) {
    var dbname = this.dbname
      , docname = this.createDoc

    test.expect(14);

    // Create the document:
    function putDocument() {
      var promise = COUCH.request({
        method: 'PUT'
      , path: '/'+ dbname +'/'+ docname
      , data: {model: 'Foo', some_attr: 1}
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
      , path: '/'+ dbname +'/'+ docname
      , hostname: HOSTNAME
      , port: PORT
      , username: USERNAME
      , password: PASSWORD
      }).then(function (res) {
        return {put: putResponse, get: res};
      });
      return promise;
    }

    // Test the results:
    function runTests(responses) {
      var get = responses.get
        , put = responses.put

      // Test the PUT
      test.strictEqual(put.statusCode, 201, 'PUT status code')
      test.assertJSON(put, 'PUT JSON')
      test.ok(put.body.ok, 'ok')
      test.equal(put.body.id, docname, 'doc.id')
      test.equal(typeof put.body.rev, 'string', 'doc.rev')
      test.equal(Object.keys(put.body).length, 3, 'PUT Object.keys(doc)')

      // Test the GET
      test.strictEqual(get.statusCode, 200, 'GET status code')
      test.assertJSON(get, 'GET JSON')
      test.equal(get.body._id, docname, 'doc._id')
      test.equal(typeof get.body._rev, 'string', 'doc._rev')
      test.equal(put.body.rev, get.body._rev, 'correct revision')
      test.equal(get.body.model, 'Foo', 'doc.model')
      test.equal(get.body.some_attr, 1, 'doc.some_attr')
      test.equal(Object.keys(get.body).length, 4, 'GET Object.keys(doc)')

      // Make sure to return undefined.
      return;
    }

    putDocument()
      .then(getDoc)
      .then(runTests)
      .then(test.done)
      .failure(test.done);
  },

  "PUT/update and GET": function (test) {
    var dbname = this.dbname
      , docname = this.updateDoc
      , fixture = this.fixture

    test.expect(17);

    // Update the document:
    function putDocument() {
      var doc = {
        model: 'Customer'
      , number: 1
      , name: fixture.name
      , age: fixture.age
      };

      var promise = COUCH.request({
        method: 'PUT'
      , path: '/'+ dbname +'/'+ docname
      , data: doc
      , rev: fixture._rev
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
      , path: '/'+ dbname +'/'+ docname
      , hostname: HOSTNAME
      , port: PORT
      , username: USERNAME
      , password: PASSWORD
      }).then(function (res) {
        return {put: putResponse, get: res};
      });
      return promise;
    }

    // Test the results:
    function runTests(responses) {
      var get = responses.get
        , put = responses.put

      // Test the PUT
      test.strictEqual(put.statusCode, 201, 'PUT status code')
      test.assertJSON(put, 'PUT JSON')
      test.ok(put.body.ok, 'ok')
      test.equal(put.body.id, docname, 'doc.id')
      test.equal(typeof put.body.rev, 'string', 'doc.rev')
      test.notEqual(put.body.rev, fixture._rev, 'new rev')
      test.equal(Object.keys(put.body).length, 3, 'PUT Object.keys(doc)')

      // Test the GET
      test.strictEqual(get.statusCode, 200, 'GET status code')
      test.assertJSON(get, 'GET JSON')
      test.equal(get.body._id, docname, 'doc._id')
      test.equal(typeof get.body._rev, 'string', 'doc._rev')
      test.equal(put.body.rev, get.body._rev, 'correct revision')
      test.equal(get.body.model, 'Customer', 'doc.model')
      test.equal(get.body.number, 1, 'doc.number')
      test.equal(get.body.age, 41, 'doc.age')
      test.equal(get.body.name, 'Bill', 'doc.name')
      test.equal(Object.keys(get.body).length, 6, 'GET Object.keys(doc)')

      // Make sure to return undefined.
      return;
    }

    putDocument()
      .then(getDoc)
      .then(runTests)
      .then(test.done)
      .failure(test.done);
  }
};

