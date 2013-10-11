var NFS = require('fs')
  , NPATH = require('path')

  , NODEUNIT = require('nodeunit')

  , testPath = NPATH.resolve(process.argv[3])
  , fileMatcher = /test\.js$/
  , files


function readTree(dir) {
	var collection = []
	  , list = NFS.readdirSync(dir)

	list.forEach(function (item) {
		var filepath = NPATH.join(dir, item)
		  , stats = NFS.statSync(filepath)

		if (stats.isDirectory()) {
			collection = collection.concat(readTree(filepath))
		} else if (stats.isFile() && fileMatcher.test(filepath)) {
			collection.push(NPATH.relative(process.cwd(), filepath));
		}
	})

	return collection;
}

// Parse arguments.
!(function () {
  var uri = process.argv[2] || '@'
    , parts = uri.split('@')
    , creds, host

  if (parts.length > 1) {
    creds = parts[0];
    host = parts[1];
  } else {
    creds = ':';
    host = parts[0];
  }

  parts = creds.split(':');
  global.USERNAME = parts[0] || '';
  global.PASSWORD = parts[1] || '';
  parts = host.split(':');
  global.HOSTNAME = parts[0] || 'localhost';
  global.PORT = parts[1] || 5984;
}());

files = readTree(testPath);

console.log('Testing with:');
console.log("username:", USERNAME)
console.log("password:", PASSWORD)
console.log("hostname:", HOSTNAME)
console.log("port:", PORT)

NODEUNIT.reporters.default.run(files);