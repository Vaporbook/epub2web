var cacher = require('epub-cache');
var fs = require('fs');

exports.attach = function attach(cacheDir) {


	cacher.init({

		cacheDir: cacheDir,
		idLimit: 100

	});

}


exports.webify = function webify(epubfile, cb) {

	cacher.cache(epubfile, function (cacheId, bundle) {

		console.log('cached epub file '+epubfile+'. cacheId is '+cacheId);

		var config = JSON.stringify(bundle);
		var template = fs.readFileSync(__dirname+'/../www/read.html');

		var html = load(config, {
			template: template.toString(),
			configline: 'reader.config = {};'
		});

		cb(null, cacheId, html);

	});

}


function load(contentConfig, readerConfig) {

	// load a cacher generated config block
	// into the reader templates
	// and return the decorated html
	return readerConfig.template.replace(
		readerConfig.configline,
		readerConfig.configline.replace(/\{\}/, contentConfig)
	);

}

