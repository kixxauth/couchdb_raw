var IOU = require('iou')
  , COUCH = require('../../index')


exports.ensureDatabase = (function () {
  var databases = {}

  return function (databaseName) {
    if (databases[databaseName]) {
      console.log("Database '"+ databaseName +"' already exists.");
      var deferred = IOU.newDefer()
      deferred.keep(databaseName);
      return deferred.promise();
    }

    console.log("Creating database '"+ databaseName +"'.");

    var promise = COUCH.request({
      method: 'PUT'
    , path: '/'+ databaseName
    , hostname: HOSTNAME
    , port: PORT
    , username: USERNAME
    , password: PASSWORD
    }).then(function (res) {
      if (res.statusCode !== 201 && res.statusCode !== 412) {
        var msg = "Unexpected response status in ensureDatabase: "+ res.statusCode;
        return done(new Error(msg));
      }
      return databaseName;
    });

    return promise;
  };
}());

exports.removeDocument = function (path) {
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
    });
  }

  var promise = COUCH.request({
    method: 'GET'
  , path: path
  , hostname: HOSTNAME
  , port: PORT
  , username: USERNAME
  , password: PASSWORD
  })
  .then(gotDocument)

  return promise;
};

exports.noop = function () {};
