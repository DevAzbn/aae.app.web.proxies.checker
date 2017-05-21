'use strict';

var azbn = new require(__dirname + '/../../../../../system/bootstrap')({
	
});

var app = azbn.loadApp(module);

var argv = require('optimist').argv;
var fs = require('fs');
var async = require('async');

require('events').EventEmitter.prototype._maxListeners = 128;

var request = require('request').defaults({
	url : 'http://ifconfig.co/json',
	method : 'GET',
	//gzip : true,
	timeout : 700,
	headers: {
		'User-Agent' : 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.115 Safari/537.36 aaeEdition',
	},
	//
});

var proxylist = app.path.data + '/' + (argv.list || 'input.txt');

var proxies = fs.readFileSync(proxylist, 'utf8').toString().replace(/\r/ig, '').split('\n');

var result = app.loadJSON('valid');

if(proxies.length) {
	
	var async_arr = [];
	
	for(var i in proxies) {
		
		(function(proxy, __index){
			
			if(proxy != '') {
				
				async_arr.push(function(callback){
					
					azbn.echo('Checking ' + __index + ' ... ' + proxy);
					
					request({
						proxy : 'http://' + proxy,
					}, function(error, response, body){
						
						if (!error) {
							
							//response.statusCode = hey may be rate-limited (with a 429 response code) or dropped entirely.
							
							if(response.headers['content-type']) {
								
								var _type = response.headers['content-type'];
								
								//if(_type.toLowerCase() == 'application/json') {
								if(_type.toLowerCase().indexOf('application/json') > -1) {
									
									try {
										
										var info = JSON.parse(body);
										azbn.echo('**********' + ' Good proxy: ' + proxy + ', ' + info.ip);
										
										result.items.push({
											proxy : proxy,
											info : info,
											created_at : azbn.now(),
										});
										
										app.saveJSON('valid', result);
										
										callback(null, null);
										
									} catch(e) {
										
										//console.log(e);
										
										callback(null, null);
										
									}
									
								} else {
									
									//console.log('Not JSON:', proxy, _type.toLowerCase());
									
									callback(null, null);
									
								}
								
							} else {
								
								callback(null, null);
								
							}
							
						} else {
							
							//console.log(error);
							
							if(error.connect === true) {
								//console.log('Error, but connected to', proxy);
							}
							
							callback(null, null);
							
						}
						
					});
					
				});
				
			}
			
		})(proxies[i], i);
		
	}
	
	async.series(async_arr, function (__err, __results) {
		
		var __arr = {};
		
		for(var j in result.items) {
			
			var item = result.items[j];
			
			if(!__arr[item.proxy]) {
				
				__arr[item.proxy] = item;
				
				azbn.echo('Save ' + item.proxy);
				
			}
			
		}
		
		result.items = [];
		
		for(var j in __arr) {
			
			result.items.push(__arr[j]);
			
		}
		
		app.saveJSON('valid', result);
		
		azbn.saveJSON('data/proxies/valid', result);
		
	});
	
}

/*
var data = app.loadJSON('input');

console.log(data);
*/