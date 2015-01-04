var assert = require('assert'),
    fakeRedis = require('fakeredis'),
    http = require('http'),
    socketio = require('../data/socket'),
    io = require('socket.io-client');

var options ={
  transports: ['websocket'],
  'force new connection': true
};

describe('Socket.io Test', function(){
  var ioClient,
      ioClient2,
      client = fakeRedis.createClient('test'),
      server = http.createServer().listen(0);

  socketio(server, client);

  beforeEach(function(done){
    ioClient = io('http://localhost:' + server.address().port + '/users', options);
    ioClient2 = io('http://localhost:' + server.address().port + '/users', options);
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
  var ioClient,
      ioClient2,
      client,
      server;

  beforeEach(function(done){
    client = fakeRedis.createClient();
    server = http.createServer().listen(0);

    socketio(server, client);
    ioClient2 = io('http://localhost:' + server.address().port + '/users', options);
    ioClient = io('http://localhost:' + server.address().port + '/users', options);
    ioClient.emit('add', 'josh', 'area', function(){
      client.quit();
      done();
    });
  });

  afterEach(function(){
    ioClient.disconnect()
    ioClient2.disconnect();
  });

  it('should send an add user error', function(done){
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

  it('should send a vote error when voting without logging in', function(done){
    ioClient2.on('serverError', function(m){
      assert.strictEqual(m.message, 'Something went wrong when adding your vote!');
      done();
    });

    ioClient2.emit('addVote', 'fs' );
  });

  it('should send a vote error when getting votes without logging in', function(done){
    ioClient2.on('serverError', function(m){
      assert.strictEqual(m.message, 'Something went wrong when getting the votes!');
      done();
    });

    ioClient2.emit('getVotes');
  });
});
