var COUCH = require('../index')


exports["Argument errors"] = {

  "path that does not begin with '/'": function (test) {
    test.expect(1);

    try {
      COUCH.request({path: 'foo'});
    } catch (err) {
      test.equal(err.message, "opts.path must start with a '/'.", "no '/' error");
    }

    return test.done();
  }
};