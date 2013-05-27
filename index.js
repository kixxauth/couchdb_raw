var HTTP = require('http')
  , IOU = require('iou')


exports.request = function (opts) {
  var d = IOU.newDefer()
    , reqOpts
    , req

  reqOpts = {
    hostname: opts.hostname
  , port: opts.port
  , path: opts.path
  , method: opts.method
  };

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
      rv.body = body;
      return Object.freeze(rv);
    });
  });

  req.on('error', function (err) {
    d.fail(err);
  });

  req.end();

  return d.promise
};
