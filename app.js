
var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app, {origins: '*:*'});

var redis = require("redis");
client = redis.createClient();

//client.set("test", "test", redis.print);


app.listen(8080);

function handler (req, res) {
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

var User = function(username, img, area, socketid){
	this.username = username;
	this.img = img;
	this.area = area;
	this.socketid = socketid;
};

var users = io.of('/users').on('connection', function (socket) {
	//socket.set('username', socket.id);
	var user;
	
	socket.on('add', function(username, img, area){
	console.log('area: ' + area);
	if(!usernameExists(area, username)){
		setUser(username, img, socket.id, area, 7200);
		var test = new User(username, img, area, socket.id);
		console.log(test);
		user = test;
		socket.set('user', test);
		//socket.set('img', img);
		console.log(socket.id + ' : ' + username);

	}
		//add the user to redis here
		//put all the users here
		
		//socket.broadcast.emit('users', {username: username, img: img});
		//socket.emit('users', {username: username, img: img, me: true});
		io.of('/users').sockets[user.socketid].emit('test', 'hello');
		});
	
	
	socket.on('count', function(){
		checkUserSet('test:users', function(){
			client.scard('test:users', function(err, count){
				socket.broadcast.emit('count', {count: count});
			});
		});
		
	});
	
	socket.on('get', function(){
		checkUserSet('test:users', function(){
			client.smembers('test:users', function(err, members){
				if(members != null){
				members.forEach(function(key){
					console.log('key ' + key);
					client.get(key, function(err, data){console.log(data);
						client.get(key+':img', function(err, imgdata){socket.emit('users', {username: data, img: imgdata});});
					
					});
				});
				}
			});
		});
	});
	
	socket.on('addVote', function(fs){
		socket.get('user', function(err, user){
			//socket.get('img', function(err, img){
				console.log(user.username + ' voted for : ' + JSON.stringify(fs));
				setVote(user.username, user.area, fs, 7200);
				//need to rewrite the broadcast
				//socket.broadcast.emit('vote', {username: user.username, img: user.img, fs: fs});
				areaBroadcast(user.username, user.area, io.of('/users'), 'vote', {username: user.username, img: user.img, fs: fs});
				socket.emit('vote', {username: user.username, img: user.img, fs: fs});
			//});
		});
	});
	
	socket.on('getVotes', function(){
		var area = user.area;
		checkUserSet(area+':votes', function(){
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
	});
	socket.on('disconnect', function(client){
		//console.log(socket.get('username', function(err, user){removeUser(user);}) + ' disconnected');
		if(user != null){
			removeUser(user.username, user.area, function(){
				console.log('user left:' + user.username );
			});
		}
	});
	
});

function setVote(username, area, fs, expire){
	client.set(area+':users:' + username + ':vote', JSON.stringify(fs), redis.print);
	client.sadd(area+':votes', area+':users:' + username, redis.print);
	//set a timer
	client.set(area+':votes:timer', expire, redis.print);
	client.expire(area+':votes:timer', expire, redis.print);
};

function setUser(username, img, socketid, area, expire){
	client.set(area+':users:' + username, username, redis.print);
	client.expire(area+':users:' + username, expire, redis.print);
	client.set(area+':users:' + username + ':img', img, redis.print);
	client.expire(area+':users:' + username + ':img', expire, redis.print);
	client.set(area+':users:' + username + ':socketid', socketid, redis.print);
	client.expire(area+':users:' + username + ':socketid', expire, redis.print);
	client.set(area+':users:timer', expire, redis.print);
	client.expire(area+':users:timer', expire, redis.print);
	client.sadd(area+':users', area+':users:' + username, redis.print);
};

function removeUser(username, area, callback){
	client.del(area+':users:' + username);
	client.del(area+':users:' + username + ':img');
	client.del(area+':users:' + username + ':socketid');
	client.srem(area+':users', area+':users:' + username);
	callback();
};

function checkUserSet(set, callback){
	client.get(set + ':timer', function(err, data){
		 if(data == null){
			client.del(set);
		}
		 callback();
	});
};

function areaBroadcast(username, area, connect, name, cast){
	client.smembers(area+':users', function(err, members){
		if(members != null){
			members.forEach(function(areaUser){
				console.log(areaUser);
				console.log(area+':users:' + areaUser + ':socketid');
				if(area+':users:'+username != areaUser){
					client.get(area+':users:' + areaUser + ':socketid', function(err, socks){
						if(socks != null)
							console.log(socks);
							//connect.sockets[socks].emit(name, cast);
					});
				}
			});
		}
	});
};