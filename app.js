
var express = require('express');
var path = require('path');
var app = express();

app.use(express.static(__dirname, 'public'));
app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function() {
	console.log('Express server listening on port ' + server.address().port);
});
var io = require('socket.io').listen(server);

var redis = require("redis");
var client = redis.createClient();

function handler (req, res) {
	//I don't know if I need this
	res.writeHead(200);
	res.end("Hello Socket");

}

usernameExists = function(area, username){
	client.get(area+':users:'+username, function(err, data){
		if(data == null){
			return false;
		}else{
			return true;
		}
	});
};

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

	socket.on('add', function(username, img, area){
		if(!usernameExists(area, username)){
			setUser(username, img, area, 7200);
		}
		//var test = new User(username, img, area, socket.id);
		socket.join(area);
		user = new User(username, img, area, socket.id);
		socket.set('user', user);

	});

	socket.on('addVote', function(fs){
		if(user !== null){
			setVote(user.username, user.area, fs, 7200);
			io.of('/users').in(user.area).emit('vote', {username: user.username, img: user.img, fs: fs});
			//socket.emit('vote', {username: user.username, img: user.img, fs: fs});
		}
	});

	socket.on('getVotes', function(){
		var area = user.area;
		client.smembers(area+':votes', function(err, votes){
			if(votes != null){
				votes.forEach(function(key){
					client.get(key, function(err, username){
						client.get(key + ':vote', function(err, vote){
							client.get(key + ':img', function(err, img){
								socket.emit('vote', {username: username, img: img, fs: JSON.parse(vote)});
							});
						});
					});
				});
			}
		});
	});

	socket.on('disconnect', function(client){
		socket.get('user', function(err, suser){
			if(suser !== null){
				socket.leave(suser.area);
				removeUser(suser.username, suser.area, function(){
				});
			}
		});
	});

});

function setVote(username, area, fs, expire){
	client.set(area+':users:' + username + ':vote', JSON.stringify(fs));
	client.sadd(area+':votes', area+':users:' + username);
	//add the set to the expire set
	client.sadd('expireKeys', area+':votes');
	//set a timer
	client.set(area+':votes:timer', expire);
	client.expire(area+':votes:timer', expire);
};

function setUser(username, img, area, expire){
	client.set(area+':users:' + username, username);
	client.expire(area+':users:' + username, expire);
	client.set(area+':users:' + username + ':img', img);
	client.expire(area+':users:' + username + ':img', expire);
	//set a timer
	client.set(area+':users:timer', expire);
	client.expire(area+':users:timer', expire);
	client.sadd(area+':users', area+':users:' + username);
	//add the set to the expire set
	client.sadd('expireKeys', area+':users');
};

function removeUser(username, area, callback){
	//this doesn't do anything right now
	client.srem(area+':users', area+':users:' + username);
	callback();
};

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