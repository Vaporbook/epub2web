
// example usage: reading epubs in your browser

var http = require('http');
var epub2web = require('../index.js');
var port = 8124;
var cacheDir = __dirname+'/cache';

epub2web.attach(cacheDir);

// your server will be much more sophisticated than this, of course ...

var server = http.createServer(function (req,res) {

	var urlparts;

	if(req.url=='/') {

		    res.writeHead(200, ['Content-Type', 'text/html']);
		    res.write('<p>Append an epub filename onto the /read/ URL ');
		    res.end('to read the file! (try <a href="http://'+req.headers.host+'/read/testbook.epub">the test file</a> for starters)');

	} else if (urlparts = req.url.match(/\/read\/(.+?\.epub)$/)) {


			epub2web.webify(
				__dirname+'/epubs/'+urlparts[1],
				function (err, cacheId, htmlApp) {

					// the htmlApp is the whole reading system,
					// fully configured for this cacheId, so
					// just pass it right to the browser

					res.writeHead(200, ['Content-Type', 'text/html']);
					res.end(htmlApp);

				});

	}
});

console.log('server created - go to http://localhost:'+port+'/ to start');


server.listen( port );