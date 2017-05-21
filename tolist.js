'use strict';

var azbn = new require(__dirname + '/../../../../../system/bootstrap')({
	
});

var app = azbn.loadApp(module);

var result = app.loadJSON('valid');

var ip_arr = [];

for(var i in result.items) {
	var item = result.items[i];
	ip_arr.push(item.proxy);
}

app.saveFile('valid.txt', ip_arr.join('\n'));
