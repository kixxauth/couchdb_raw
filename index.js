var HTTP = require('http')
  , QS = require('querystring')
  , IOU = require('iou')


// Public: Make an HTTP request to a CouchDB server.
//
// This is the main entry point for the RAW CouchDB API.
//
// opts - A hash Object of request options.
//   .hostname - Just the hostname String
//               (no protocol or port; default is 'localhost').
//   .port     - The Port Number (default is 5884).
//   .method   - The HTTP method String to use (GET, POST, PUT, or DELETE).
//   .path     - The URL path String. It must begin with a '/', and the query
//               string will be ignored.
//   .username - The username String if you want to authenticate (optional).
//   .password - The password String (required if you define a username).
//   .query    - A hash Object of URL query parameters to add (optional).
//   .data     - An Object of data to be JSON serialized and put into the
//               HTTP request body.
//   .rev      - If a rev String is included, it will cause the If-Match HTTP
//               header to be sent with this value (optional).
//
// Returns a Promise object, on which you can register callback functions by
// passing them to Promise#failure() and Promise#then().
exports.request = function (opts) {
  opts = opts || {};

  var d = IOU.newDefer()
    , reqOpts
    , req

  reqOpts = {
    hostname: opts.hostname || 'localhost'
  , port: opts.port || 5984
  , path: opts.path || '/'
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

  // Strip any existing query string.
  reqOpts.path = reqOpts.path.split('?')[0]
  if (opts.query) {
    reqOpts.path += ('?'+ QS.stringify(opts.query));
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
      try {
        rv.body = JSON.parse(body);
      } catch (err) {
        var msg = "Invalid JSON returned by CouchDB: "+ err.message;
        d.fail(new Error(msg));
        return;
      }
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
