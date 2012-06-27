
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

usernameExists = function(event, username){
	client.get(event+':users:'+username, function(err, data){
		if(data == null){
			return false;
		}else{
			return true;
		}
	});
};

var users = io.of('/users').on('connection', function (socket) {
	socket.set('username', socket.id);
	
	socket.on('add', function(username, img){
	
	if(!usernameExists('test', username)){
		setUser(username, img, 7200);
		socket.set('username', username);
		console.log(socket.id + ' : ' + username);

	}
		//add the user to redis here
		//put all the users here
		
		socket.broadcast.emit('users', {username: username, img: img});
		socket.emit('users', {username: username, img: img, me: true});
		});
	
	
	socket.on('count', function(){
		checkUserSet('test:users');
		client.scard('test:users', function(err, count){
			socket.broadcast.emit('count', {count: count});
		});
	});
	
	socket.on('get', function(){
		checkUserSet('test:users');
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
	
	socket.on('disconnect', function(client){
		//console.log(socket.get('username', function(err, user){removeUser(user);}) + ' disconnected');
	});
	
});

function setUser(username, img, expire){
	client.set('test:users:' + username, username, redis.print);
	client.expire('test:users:' + username, expire, redis.print);
	client.set('test:users:' + username + ':img', img, redis.print);
	client.expire('test:users:' + username + ':img', expire, redis.print);
	client.set('test:users:timer', expire, redis.print);
	client.expire('test:users:timer', expire, redis.print);
	client.sadd('test:users', 'test:users:' + username, redis.print);
};

function removeUser(username){
	client.del('test:users:' + username);
	client.del('test:users:' + username + ':img');
	client.srem('test:users', 'test:users:' + username);
};

function checkUserSet(set){
	client.smembers(set + ':timer', function(err, data){
		 if(data == null){
			client.del(set);
		}
	});
};