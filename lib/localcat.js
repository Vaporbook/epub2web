
var util = require('util');
var fs = require('fs');
var epubdir;
var path, filelist, tm, endtm;
var listing = [];
var opened = 0;
var total = 0;
var finalCb = function () {};
var listeners = {};
var parser = require('../../epub-parser');

module.exports.maxFiles = 0;

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
		total = filelist.length;
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


		console.log(parser);

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

