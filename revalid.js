'use strict';

var azbn = new require(__dirname + '/../../../../../system/bootstrap')({
	
});

var app = azbn.loadApp(module);

var argv = require('optimist').argv;
var fs = require('fs');
var async = require('async');

require('events').EventEmitter.prototype._maxListeners = 128;

var request = require('request').defaults({
	url : 'http://app.azbn.ru/process/req/',//'http://ifconfig.co/json',
	method : 'GET',
	//gzip : true,
	timeout : 2100,
	headers: {
		'User-Agent' : 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.115 Safari/537.36 aaeEdition',
	},
	//
});

var result = app.loadJSON('valid');

var revalid = {
	items :[],
};

if(result.items.length) {
	
	var async_arr = [];
	
	for(var i in result.items) {
		
		(function(item, __index){
			
			if(item.proxy != '') {
				
				async_arr.push(function(callback){
					
					azbn.echo('Checking ' + __index + ' ... ' + item.proxy);
					
					request({
						proxy : 'http://' + item.proxy,
					}, function(error, response, body){
						
						if (!error) {
							
							if(response.headers['content-type']) {
								
								var _type = response.headers['content-type'];
								
								//if(_type.toLowerCase() == 'application/json') {
								if(_type.toLowerCase().indexOf('application/json') > -1) {
									
									//"Привет, мир".indexOf("Привет")
									
									try {
										
										var info = JSON.parse(body);
										azbn.echo('**********' + ' Good proxy: ' + item.proxy + ', ' + info.ip);
										
										revalid.items.push({
											proxy : item.proxy,
											info : info,
											created_at : azbn.now(),
										});
										
										app.saveJSON('revalid', revalid);
										
										callback(null, null);
										
									} catch(e) {
										
										//console.log(e);
										
										callback(null, null);
										
									}
									
								} else {
									
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
			
		})(result.items[i], i);
		
	}
	
	async.series(async_arr, function (__err, __results) {
		
		app.saveJSON('revalid', revalid);
		
		//azbn.saveJSON('data/proxies/valid', result);
		
	});
	
}
