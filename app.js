
var https = require('https'),
		express = require('express'),
		path = require('path'),
		config = require('./config'),
		client = require('./redis'),
		socketio = require('./data/socket');


var app = express();

app.use(express.static(__dirname + '/static'));
app.set('port', config.PORT);

app.get('/foursquare', function(req, res){
	https.request({
		host: 'api.foursquare.com',
		path: '/v2/venues/search?ll=' + req.query.lat + ',' + req.query.lon + '&client_id=' + config.FOURSQUAREID + '&client_secret=' + config.FOURSQUARESECRET +'&v=20140128&query=' + req.query.query
	}, function(httpResponse){
		var responseStr = '';
		httpResponse.on('data', function(chunk){
			responseStr += chunk;
		});

		httpResponse.on('end', function(){
			res.setHeader('content-type', 'application/json');
			res.send(JSON.parse(responseStr));
		});
	}).end();
});

var server = app.listen(app.get('port'), function() {
	console.log('Express server listening on port ' + server.address().port);
});

//start up socket.io
socketio(server, client);

setInterval(checkExpires, 600000  );//ten minute check
checkExpires(); //run it once to clear everything out if it is restarting

function checkExpires(){
	//grab the expire set
	client.smembers('expireKeys', function(err, keys){
		if(keys != null){
			keys.forEach(function(key){
				client.get(key+':timer', function(err, timer){
					//grab the timer
					if(timer != null){
						//timer exists check the ttl on it
						client.ttl(key+':timer', function(err, ttl){
							//the ttl is two hours and if it is under
							//a half hour we delete it
							if(ttl < 1800){
								client.del(key);
								client.srem('expireKeys', key);
							}
						});
					}else{
						//the timer is gone delete the key
						client.del(key);
						client.srem('expireKeys', key);
					}
				})
			});
		}
	});
};
