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
  , method: (opts.method || 'get').toUpperCase()
  , headers: {
      'accept': 'application/json'
    }
  };

  if (!/^\//.test(reqOpts.path)) {
    throw new Error("opts.path must start with a '/'.");
  }

  if (opts.username) {
    if (!opts.password) {
      throw new Error("opts.password must be provided with opts.username");
    }
    var auth = exports.basicAuth(opts.username, opts.password);
    reqOpts.headers['Authorization'] = auth;
  }

  if (opts.rev) {
    reqOpts.headers['If-Match'] = opts.rev;
  }

  if (opts.data) {
    reqOpts.data = opts.data;
  }

  function handler(res) {
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
  }

  switch (reqOpts.method) {
  case 'GET':
    exports.do_GET_DELETE(reqOpts, d, handler);
    break;
  case 'DELETE':
    exports.do_GET_DELETE(reqOpts, d, handler);
    break;
  case 'POST':
    exports.do_POST_PUT(reqOpts, d, handler);
    break;
  case 'PUT':
    exports.do_POST_PUT(reqOpts, d, handler);
    break;
  default:
    throw new Error("Invalid HTTP method '"+ reqOpts.method +"'.");
  }

  return d.promise
};


exports.do_GET_DELETE = function (opts, deferred, handler) {
  req = HTTP.request(opts, handler);
  req.on('error', exports.newErrorHandler(opts, deferred));
  req.end();
  return req;
};


exports.do_POST_PUT = function (opts, deferred, handler) {
  opts.headers['Content-Type'] = 'application/json';
  req = HTTP.request(opts, handler);
  req.on('error', exports.newErrorHandler(opts, deferred));

  if (opts.data) {
    req.write(JSON.stringify(opts.data));
  }

  req.end();
  return req;
};

exports.newErrorHandler = function (opts, deferred) {
  return function (err) {
    err = err || {};
    var rv

    if (err.code === 'EHOSTUNREACH') {
      rv = new Error("CouchDB server could not be reached at '"+ opts.hostname +"'.");
      rv.code = err.code;
    } else if (err.code === 'ENOTFOUND') {
      rv = new Error("No CouchDB server found at '"+ opts.hostname +"'.");
      rv.code = err.code;
    } else if (err.code === 'ECONNREFUSED') {
      rv = new Error("The server at '"+ opts.hostname +"' refused the connection.");
      rv.code = err.code;
    } else {
      rv = err;
    }

    deferred.fail(rv);
  };
};


exports.basicAuth = function (username, password) {
  var str = username +':'+ password
  return 'Basic '+ new Buffer(str).toString('base64');
};
