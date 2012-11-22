
var cat = require('../lib/localcat.js');
var fs = require('fs');

var catalogDir = '/Users/asm/epubs/tmpy';
var coverDir = catalogDir + '/covers';

cat.maxFiles = 3; // if not specified, all the epubs in the directory will get indexed

console.log('building catalog index from directory ...'+catalogDir);

cat.on('newItem', function (data) {
	console.log('listing event:');
	console.log(data);
	console.log(data.epubData.easy.md5);
	ext = data.cover.match(/\.([^\.]{3,4})$/i)[1];
	fs.writeFileSync(coverDir+'/'+data.epubData.easy.md5+'.'+ext, data.coverData,'binary');
});

cat.buildIndex(catalogDir, function (err, index) { // build a new index and replace the old (if it exists)

	if(err) throw err;

	var d = JSON.stringify(index);

	// store it in a file

	fs.writeFileSync(catalogDir+'/index.json', d);

	// restore it from the file 
	
	var saved = fs.readFileSync(catalogDir+'/index.json');

	console.log('loading saved index...');

	cat.loadIndex(saved, function (err, index) {

		console.log('loaded '+index.length+' entries');

	});

});


