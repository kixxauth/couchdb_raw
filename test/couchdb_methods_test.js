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
