var cacher = require('epub-cache');
var fs = require('fs');
var tmpl = require('epub-tmpl');

exports.attach = function attach(cacheDir) {


	cacher.init({

		cacheDir: cacheDir,
		idLimit: 100

	});

}


exports.webify = function webify(epubfile, templateName, cb) {

	console.log(epubfile);

	cacher.cache(epubfile, function (cacheId, bundle) {

		console.log('cached epub file '+epubfile+'. cacheId is '+cacheId);

		var config = JSON.stringify(bundle);

		var template = tmpl.getTemplate(templateName);

		var html = load(config, {
			cacheId: cacheId,
			template: template,
			configline: 'reader.config = {};'
		});

		cb(null, cacheId, html);

	});

}


exports.reader = function reader(cacheId, templateName, cb) {


		console.log('cacheId is '+cacheId);

		try {

			var bundle = cacher.getBundle(cacheId);

			var config = JSON.stringify(bundle);

			var template = tmpl.getTemplate(templateName);

			var html = load(config, {
				cacheId: cacheId,
				template: template,
				configline: 'reader.config = {};'
			});

			cb(null, cacheId, html);

		} catch(e) {
			console.log(e);
			cb(e,null, null);
		}

}

function load(contentConfig, readerConfig) {

	// load a cacher generated config block
	// into the reader templates
	// and return the decorated html
	
	var cacheId = readerConfig.cacheId;

	return readerConfig.template.replace(
		readerConfig.configline,
		readerConfig.configline.replace(/\{\}/, contentConfig)+ '; var __epubCacheId="'+cacheId+'";'
	);

}

