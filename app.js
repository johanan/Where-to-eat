
var https = require('https'),
		express = require('express'),
		path = require('path'),
		config = require('./config'),
		client = require('./redis'),
		repo = require('./data/repository');

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

var io = require('socket.io').listen(server);

setInterval(checkExpires, 600000  );//ten minute check
checkExpires(); //run it once to clear everything out if it is restarting

var User = function(username, img, area, socketid){
	this.username = username;
	this.img = img;
	this.area = area;
	this.socketid = socketid;
};

var users = io.of('/users').on('connection', function (socket) {
	var user;

	function serverError(err, message){
		console.log(err);
		socket.emit('serverError', {message: message});
	};

	socket.on('add', function(username, img, area, ack){
		user = new User(username, img, area, socket.id);
		repo.setUser(username, img, area, 7200, client)
			.done(function(){
				socket.join(area);
				ack();
			}, function(err){
				serverError(err, 'Something went wrong when adding your user!');
			});
	});

	socket.on('addVote', function(fs){
		if(user !== null){
			repo.setVote(user.username, user.area, fs, 7200, client).done(function(){
				io.of('/users').in(user.area).emit('vote', {username: user.username, img: user.img, fs: fs});
			}, function(err){
				serverError(err, 'Something went wrong when adding your vote!');
			});
		}
	});

	socket.on('getVotes', function(){
		var area = user.area;
		repo.getVotes(user.area, client).done(function(votes){
			votes.forEach(function(vote){
				socket.emit('vote', vote);
			})
		}, function(err){
			serverError(err, 'Something went wrong when getting the votes!');
		})
	});

	socket.on('disconnect', function(){
		if(user !== undefined){
			socket.leave(user.area);
			repo.removeUser(user.username, user.area, client).done(null,
			function(err){
				serverError(err, 'Something went wrong when leaving!');
			});
		}
		user = null;
	});

});

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
