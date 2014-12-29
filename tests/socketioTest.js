var assert = require('assert'),
    client = require('fakeredis').createClient('test'),
    server = require('http').createServer().listen(3000),
    server2 = require('http').createServer().listen(4000),
    socketio = require('../data/socket'),
    io = require('socket.io-client');

socketio(server, client);

var options ={
  transports: ['websocket'],
  'force new connection': true
};

describe('Socket.io Test', function(){
  var ioClient,
      ioClient2;

  beforeEach(function(done){
    ioClient = io('http://localhost:3000/users', options);
    ioClient2 = io('http://localhost:3000/users', options);
    //all tests require a user created
    ioClient.on('connect', function(){
      ioClient2.on('connect', function(){
        ioClient.emit('add', 'josh', 'area', function(){
          ioClient2.emit('add', 'josh2', 'area', function(){
            done();
          });
        });
      });
    });
  });

  afterEach(function(){
    client.flushdb();
    ioClient.disconnect();
    ioClient2.disconnect();
  });

  it('should add a user', function(done){
    //the user was created in beforeEach
    client.multi()
      .get('area:users:josh')
      .exec(function(err, results) {
        assert.strictEqual(results[0], 'josh');
        done();
      });

  });

  it('should add a vote', function(done){
    ioClient.on('vote', function(vote){
      assert.strictEqual(vote.username, 'josh');
      assert.strictEqual(vote.fs, 'fs');
      done();
    });
    ioClient.emit('addVote', 'fs');
  });

  it('should broadcast the vote', function(done){
    ioClient.emit('addVote', 'fs');

    setTimeout(function(){
      ioClient2.on('vote', function(vote){
        assert.strictEqual(vote.username, 'josh');
        assert.strictEqual(vote.fs, 'fs');
        done();
      });
      ioClient2.emit('getVotes');
    }, 500);
  });

  it('should remove the user', function(done){
    ioClient.disconnect();
    setTimeout(function(){
      client.smembers('area:users', function(err, members){
        assert.strictEqual(members.length, 1);
        assert.strictEqual(members[0], 'area:users:josh2');
        done();
      });
    }, 500);
  });
});

describe('Socket.io failure Test', function(){
  var client = client;
  socketio(server2, client);



  beforeEach(function(done){
    ioClient = io('http://localhost:4000/users', options);
    ioClient.emit('add', 'josh', 'area', function(){ done();} );
  });

  it('should send an add user error', function(done){
    client = null;
    console.log(client);
    ioClient.on('serverError', function(m){
      assert.strictEqual(m.message, 'Something went wrong when adding your user!');
      done();
    });

    ioClient.emit('add', 'josh', 'area', function(){} );
  });

  it('should send a vote error', function(done){
    ioClient.on('serverError', function(m){
      assert.strictEqual(m.message, 'Something went wrong when getting the votes!');
      done();
    });

    ioClient.emit('getVotes');
  });

  it('should send an add vote error', function(done){
    ioClient.on('serverError', function(m){
      assert.strictEqual(m.message, 'Something went wrong when adding your vote!');
      done();
    });

    ioClient.emit('addVote', 'fs' );
  });
});