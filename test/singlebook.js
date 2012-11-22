
// example usage: reading epubs in your browser

var http = require('http');
var fs = require('fs');
var mime = require('mime');

var epub2web = require('../index.js');
var port = 8124;
var bookfile = process.argv[2];
var cacheDir = __dirname+"/../www/cache";

if(!bookfile) {
	throw "you must specify an epub file for this example to work.";
}

var epubDir = cacheDir;

// attach to any cache dir you want for cache location of exploded epubs

epub2web.attach(cacheDir);

// your server will be much more sophisticated than this, of course ...

var server = http.createServer(function (req,res) {

	var urlparts;

	if(req.url=='/') {

			epub2web.webify(
				bookfile, /* full path of epub file */
				'read', /* template name for reading system */
				function (err, cacheId, htmlApp) { /* callback after webify complete */

					var cacheurl = '/cache/'+cacheId+'/';

					res.writeHead(302, {
						'Location': cacheurl
					});
					res.end();

				});
	} else if (urlparts = req.url.match(/\/cache\/([^\/]+?)\/?$/)) { /* get from cacheId */

			epub2web.reader(
				urlparts[1],
				'read', /* template name for reading system */
				function (err, cacheId, htmlApp) { /* callback after webify complete */

					// the htmlApp is the whole reading system,
					// fully configured for this cacheId, so
					// just pass it right to the browser

					res.writeHead(200, ['Content-Type', 'text/html']);
					res.end(htmlApp);

				});


	} else if (urlparts = req.url.match(/\/cache\/([^\/]+?)\/(.+?)$/)) { /* get file from cache */

			var filename = cacheDir +'/'+urlparts[1]+'/'+urlparts[2];
			
			//application/vnd.adobe-page-template+xml causes warning in Chrome

			mime.define({
				'text/css': ['xpgt']
			});

			res.writeHead(200, {
				'Content-Type': mime.lookup(filename),
				'Content-Length': fs.statSync(fs.realpathSync(filename)).size
			});

		    res.end(fs.readFileSync(filename));

	} else if (req.url == '/close') {

			res.end('Done');
			process.exit(0);

	} else {

			res.writeHead(404, {
				'Content-Type':'text/html'
			})
			res.end('404');

	}
	
});

console.log('Server created for epub file '+bookfile+' - go to http://localhost:'+port+'/ to start');


server.listen( port );