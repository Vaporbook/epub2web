var cacher = require('epub-cache');
var fs = require('fs');
var tmpl = require('epub-tmpl');
var util = require('util');
var epubdir;
var path, filelist, tm, endtm;
var listing = [];
var opened = 0;
var total = 0;
var finalCb = function () {};
var listeners = {};
var parser = cacher.getParser();

module.exports.maxFiles = 0;

module.exports.attach = function attach(cacheDir) {

	cacher.init({

		cacheDir: cacheDir,
		idLimit: 100

	});

}


module.exports.webify = function webify(epubfile, templateName, cb) {

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


module.exports.reader = function reader(cacheId, templateName, cb) {


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



module.exports.buildIndex = function (dir, cb) {

	epubdir = dir;
	finalCb = cb;
	fs.readdir(dir, opendirCallback);

}

module.exports.loadIndex = function (index, cb) {

	listing = JSON.parse(index);

	cb(null, listing);

}

module.exports.on = function (topic, listener) {

	if(typeof listeners[topic] == 'undefined') {
		listeners[topic] = [];
	}
	listeners[topic].push(listener);

}

function opendirCallback (err, files) {


	filelist = files;

	tm = (new Date()).getTime();

	if(module.exports.maxFiles > 0) {
		total = module.exports.maxFiles;
	} else {
		total = filelist.length-1;
	}

	for(var i = 0 ; i <= total; i++) {
	
		var name = filelist[i];

		if(name.match(/epub$/i)) {
	
			try {
				parser.open(epubdir + '/' +filelist[i], openCallback);
			} catch (e) {
				console.log(e);
			}
		}

	}

}

function openCallback(err, epubData) {

	if(!err) {
		

		path = epubdir + '/' +filelist[opened];

		console.log('------->'+Math.floor((opened/total)*100)+'%');

		var o = {
			path: path,
			primaryId: epubData.easy.primaryID.value,
			cover: epubData.easy.epub2CoverUrl,
			coverData: new Buffer(parser.extractBinary(epubData.easy.epub2CoverUrl),'binary'),
			simpleMeta: epubData.easy.simpleMeta,
			epubData: epubData
		};
		
		//console.log(util.inspect(process.memoryUsage()));

		//console.log(o);

		listing.push(o);

		notify('newItem',o);

		opened++;

		console.log('opened '+opened+' out of '+total);

		if(opened==total) {

			endtm = (new Date()).getTime();

			console.log('ending read ops at '+endtm);

			console.log('took '+((endtm-tm)/1000/60)+' minutes');
			console.log('opened '+opened+' files');

			finalCb(null, listing);

		}

	} else {
		console.log(err);
	}

}


function notify(topic, data) {

	for(topic in listeners) {

		for(var i = 0; i < listeners[topic].length; i ++) {
			listeners[topic][i].apply(this, [data]);
		}

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

