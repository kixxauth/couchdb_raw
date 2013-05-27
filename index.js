var HTTP = require('http')
  , IOU = require('iou')


exports.request = function (opts) {
  opts = opts || {};

  var d = IOU.newDefer()
    , reqOpts
    , req

  reqOpts = {
    hostname: opts.hostname || 'localhost'
  , port: opts.port || 5984
  , path: opts.path || ''
  , method: opts.method
  , headers: {
      'accept': 'application/json'
    }
  };

  if (opts.username) {
    if (!opts.password) {
      throw new Error("opts.password must be provided with opts.username");
    }
    var auth = exports.basicAuth(opts.username, opts.password);
    reqOpts.headers['Authorization'] = auth;
  }

  if (!/^\//.test(reqOpts.path)) {
    throw new Error("opts.path must start with a '/'.");
  }

  req = HTTP.request(reqOpts, function (res) {
    var rv = Object.create(null)
      , body = ''

    rv.statusCode = res.statusCode;
    rv.headers = Object.freeze(res.headers);

    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      body += chunk;
    });

    res.on('end', function () {
      rv.body = JSON.parse(body);
      d.keep(Object.freeze(rv));
      return;
    });
  });

  req.on('error', function (err) {
    err = err || {};
    var rv

    if (err.code === 'EHOSTUNREACH') {
      rv = new Error("CouchDB server could not be reached at '"+ reqOpts.hostname +"'.");
      rv.code = err.code;
    } else if (err.code === 'ENOTFOUND') {
      rv = new Error("No CouchDB server found at '"+ reqOpts.hostname +"'.");
      rv.code = err.code;
    } else if (err.code === 'ECONNREFUSED') {
      rv = new Error("The server at '"+ reqOpts.hostname +"' refused the connection.");
      rv.code = err.code;
    } else {
      rv = err;
    }

    d.fail(rv);
  });

  req.end();

  return d.promise
};

exports.basicAuth = function (username, password) {
  var str = username +':'+ password
  return 'Basic '+ new Buffer(str).toString('base64');
};
