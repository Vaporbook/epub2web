
// example usage: reading epubs in your browser

var http = require('http');
var fs = require('fs');
var mime = require('mime');

var epub2web = require('../index.js');
var port = 8124;
var cacheDir = __dirname+'/../www/cache';
var epubDir = __dirname+'/epubs';

var myTemplateName = 'vaporbook';
var myTemplateHtml = fs.readFileSync(__dirname+'/testreader.html');

// for on-the-fly script injection into content docs

//var htmlparser = require('htmlparser');
//var jsdom = require("jsdom").jsdom;

// add custom reading template

epub2web.addTemplate(myTemplateName, myTemplateHtml.toString());


function injectScript(rs,content,cb) {
	
/*
	jsdom.env(
		content.toString(),
		[],
		function (errors, window) {

			var b = window.document.getElementsByTagName('body').item(0);

			var html = b.innerHTML + rs;

			b.innerHTML = html;

			cb(window.document.innerHTML);

		}

	); */

	var newcontent = content.toString().replace(/<\/body>/igm, rs+'<!-- foo --></body>');
	cb(newcontent);

}

function refreshTemplate()
{
	// function to ease development, call to refresh the html
	// without a server restart. should not be used in production.
	
	console.log('refreshing template...');

	myTemplateHtml = fs.readFileSync(__dirname+'/testreader.html');

	epub2web.addTemplate(myTemplateName, myTemplateHtml.toString());


}

// attach to any cache dir you want for cache location of exploded epubs

epub2web.attach(cacheDir);

// your server will be much more sophisticated than this, of course ...

var server = http.createServer(function (req,res) {

	console.log(req.url);



	var urlparts;

	if(req.url=='/favicon.ico') {

		res.writeHead(200, {'Content-Type': 'image/png'});
		res.end('');


	} else if(req.url=='/') {

		// serves up the test launch page with a convenient link to an epub in our test dir

		    res.writeHead(200, ['Content-Type', 'text/html']);
		    res.write('<p>Append an epub filename onto the /read/ URL ');
		    res.end('to read the file! (try <a href="http://'+req.headers.host+'/read/testbook.epub">the test file</a> for starters)');


	} else if (urlparts = req.url.match(/\/cache\/([^\/]+?)\/?$/)) { /* get from cacheId */

			refreshTemplate();
			epub2web.reader(
				urlparts[1],
				myTemplateName, /* template name for reading system */
				function (err, cacheId, htmlApp) { /* callback after webify complete */

					// the htmlApp is the whole reading system,
					// fully configured for this cacheId, so
					// just pass it right to the browser

					if(err) {
						res.writeHead(500, {'Content-Type': 'text/html'});
						res.end('An error occurred');
					}

					res.writeHead(200, {'Content-Type': 'text/html'});
					res.end(htmlApp);

				});


	} else if (urlparts = req.url.match(/\/cache\/([^\/]+?)\/(.+?)$/)) { /* get file from cache */



			var cid = urlparts[1];
			
			var filename = cacheDir +'/'+urlparts[1]+'/'+urlparts[2];

			try {

				var realpath = fs.realpathSync(filename);

				var stat = fs.statSync(realpath);

				var content = fs.readFileSync(filename);

				if(filename.match(/ml$/i)) { // is xml html xhtml


					var rs = '<script>var rsconf = { base: "http://api.readsocial.net", api_base: "http://api.readsocial.net", partner_id: 8, group_id:"partner-testing-channel", container: document.body, load_handler: function () { ; }, hashgroups: [{name: "Partner Testing Channel"}], use_ui: true, use_sso: false, use_iframe: true }; var s1 = document.createElement("sc"+"ript"); s1.onload=function() { ReadSocial.API.load(rsconf); }; s1.src = "http://api.readsocial.net/js/readsocial/libRSAPI.js"; document.body.appendChild(s1);</script>';

					injectScript(rs, content.toString(), function (html) {

						res.writeHead(200, {
							'Content-Type': mime.lookup(filename)
						});

					    res.end(html);

					});

				} else {
					res.writeHead(200, {
						'Content-Type': mime.lookup(filename),
						'Content-Length': stat.size
					});

				    res.end(content);				
				}

	

			} catch (e) {

				console.log(e);
			    res.end('Not Found');

			}



	} else if (urlparts = req.url.match(/\/read\/(.+?\.epub)(.*?)$/)) { /* get from epub filename */

			refreshTemplate();

			epub2web.webify(
				epubDir+'/'+urlparts[1], /* full path of epub file */
				myTemplateName, /* template name for reading system */
				function (err, cacheId, htmlApp) { /* callback after webify complete */

					// the htmlApp is the whole reading system,
					// fully configured for this cacheId, so
					// just pass it right to the browser

					var cacheurl = '/cache/'+cacheId+'/';

					res.writeHead(302, {
						'Location': cacheurl
					});
					res.end();

//					res.writeHead(200, ['Content-Type', 'text/html']);
//					res.end(htmlApp);

				});

	} else 	if(req.url=='/close') {

		    res.writeHead(200, ['Content-Type', 'text/html']);
		    res.end('Goodbye!');

	}


});

console.log('server created - go to http://localhost:'+port+'/ to start');


server.listen( port );