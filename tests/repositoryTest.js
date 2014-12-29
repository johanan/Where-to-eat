var assert = require('assert'),
    client = require('fakeredis').createClient('test'),
    repo = require('../data/repository');

describe('Repository Test', function(){

  beforeEach(function(){
    client.flushdb();
  });

  afterEach(function(){
    client.flushdb();
  });

  it('should add votes for getVote', function(done){
    var noUsername = repo.getVote('default:users:josh', client);
    noUsername.done(null, function(err){
      assert.equal(err, 'Username is null');
    });

    //setup the data
    client.set('default:users:josh', 'josh');
    client.set('default:users:josh:vote', JSON.stringify({test: 'test'}));

    //make sure the function gets the correct keys
    var getVote = repo.getVote('default:users:josh', client);
    getVote.done(function(vote){
      assert.equal(vote.username, 'josh');
      assert.equal(vote.fs.test, 'test');
      done();
    });
  });

  it('should return votes with getVotes', function(done){
    var empty = repo.getVotes('default', client);
    empty.done(function(votes){
      assert.equal(votes.length, 0);
    });

    //set data
    client.sadd('default:votes', 'default:users:josh');
    client.set('default:users:josh', 'josh');
    client.set('default:users:josh:vote', JSON.stringify({test: 'test'}));

    var oneVote = repo.getVotes('default', client);
    oneVote.done(function(votes){
      assert.equal(votes.length, 1);
      var vote = votes[0];
      assert.equal(vote.username, 'josh');
      assert.equal(vote.fs.test, 'test');
      done();
    });
  });

  it('should remove the user with removeUser', function(done){
    client.sadd('default:users', 'default:users:josh');

    var rem = repo.removeUser('josh', 'default', client);
    rem.done(function(){
      client.smembers('default:users', function(err, users){
        assert.equal(users.length, 0);
        done();
      })
    });
  });

  it('setUser should set username', function(done){
    var user = repo.setUser('josh', 'default', 7200, client);
    user.done(function(){
      client.get('default:users:josh', function(e, d){
        assert.equal(d, 'josh');
        done();
      });
    });
  });

  it('should set a string in the set', function(done){
    var user = repo.setUser('josh', 'default', 7200, client);
    user.done(function(){
      client.smembers('default:users', function(e, d){
        assert.equal(d.length, 1);
        done();
      });
    });
  });

  it('should expire the key', function(done){
    var user = repo.setUser('josh', 'default', 7200, client);
    user.done(function(){
      client.smembers('expireKeys', function(e, d){
        assert.equal(d.length, 1);
        done();
      });
    });
  });

  it('should set vote', function(done){
    var vote = repo.setVote('josh', 'default', {test: 'test'}, 7200, client);
    vote.done(function(){
      done();
    });
  });
});
