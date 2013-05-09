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
var attached = false;

module.exports.maxFiles = total;


module.exports.attach = function attach(cacheDir) {

	if(attached) return true;
	cacher.init({

		cacheDir: cacheDir

	});
	attached = true;

}

module.exports.addTemplate = function addTemplate(name, html) {

	// wraps epub-tmpl addTemplate function to add custom reading system templates

	console.log('adding template '+name+' with '+html.length+' bytes of HTML');

	tmpl.addTemplate(name, html);

}

// use webify if you don't have a cacheId or are not sure what it is

module.exports.webify = function webify(epubfile, templateName, cb) {

	/*
			epubfile can be a full local path to a valid epub file,
			a full canonical URL to an epub resource on the web,
			OR a valid node Buffer object (from a valid epub file)

	*/


	//console.log(arguments);
	
	var cacheId = null;

	if('function' !== typeof arguments[2]) { // if cb not 3rd arg
		cacheId = arguments[2]; // force cacheId from 2nd arg
		cb = arguments[3]; // assume cb is last arg
	}

	if(cacheId) {
		console.log('cacheId override: '+cacheId);
	}

	// pass the epubfile param directly through to the cacher

	cacher.cache(epubfile, cacheId, function (err, cacheId, bundle) {

		if(err) return cb(err, null, null);

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

// use reader if you already have a cacheId, use webify if you don't or are not sure what it is

module.exports.reader = function reader(cacheId, templateName, cb) {

		// read from already cached

		console.log('epub2web #reader() - cacheId is '+cacheId);

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

module.exports.getCacher = function () {
	return cacher;
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

	if(err) throw err;

	filelist = files;
	epublist = [];

	for(var i = 0 ; i < filelist.length; i++) {
		if(filelist[i].match(/\.epub$/i)) {
			epublist.push(filelist[i]);
		}
	}

	tm = (new Date()).getTime();

	if(module.exports.maxFiles > 0 && module.exports.maxFiles < epublist.length) {
		total = module.exports.maxFiles;
	} else {
		total = epublist.length;
	}

	for(var i = 0 ; i < epublist.length; i++) {
		try {
			console.log('opening: '+epubdir + '/' +epublist[i]);
			parser.open(epubdir + '/' +epublist[i], openCallback);
		} catch (e) {
			openCallback(e);
		}
	}

}

function openCallback(err, epubData) {

	if(!err) {
		

		path = epubdir + '/' +epublist[opened];

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
		
		opened++;
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

