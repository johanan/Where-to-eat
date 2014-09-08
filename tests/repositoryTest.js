var nodeunit = require('nodeunit'),
    client = require('fakeredis').createClient('test'),
    repo = require('../data/repository');

exports.requireAuthTest = nodeunit.testCase({
  setUp: function(callback){
    client.flushdb();
    callback();
  },
  tearDown: function(callback){
    client.flushdb();
    callback();
  },

  'test getVote': function(test){
    //test branches
    var noUsername = repo.getVote('default:users:josh', client);
    noUsername.done(null, function(err){
      test.equal(err, 'Username is null');
    });

    //setup the data
    client.set('default:users:josh', 'josh');
    client.set('default:users:josh:vote', JSON.stringify({test: 'test'}));
    client.set('default:users:josh:img', 'josh_image');

    //make sure the function gets the correct keys
    var getVote = repo.getVote('default:users:josh', client);
    getVote.done(function(vote){
      test.equal(vote.username, 'josh');
      test.equal(vote.img, 'josh_image');
      test.equal(vote.fs.test, 'test');
      test.done();
    });
  },

  'test getVotes': function(test){
    var empty = repo.getVotes('default', client);
    empty.done(function(votes){
      test.equal(votes.length, 0);
    });

    //set data
    client.sadd('default:votes', 'default:users:josh');
    client.set('default:users:josh', 'josh');
    client.set('default:users:josh:vote', JSON.stringify({test: 'test'}));
    client.set('default:users:josh:img', 'josh_image');

    var oneVote = repo.getVotes('default', client);
    oneVote.done(function(votes){
      console.log(votes);
      test.equal(votes.length, 1);
      var vote = votes[0];
      test.equal(vote.username, 'josh');
      test.equal(vote.img, 'josh_image');
      test.equal(vote.fs.test, 'test');
      test.done();
    });
  },

  'test removeUser': function(test){
    client.sadd('default:users', 'default:users:josh');

    var rem = repo.removeUser('josh', 'default', client);
    rem.done(function(){
      client.smembers('default:users', function(err, users){
        test.equal(users.length, 0);
        test.done();
      })
    });
  },

  'test setUser username': function(test){
    var user = repo.setUser('josh', 'josh_image', 'default', 7200, client);
    user.done(function(){
      client.get('default:users:josh', function(e, d){
        test.equal(d, 'josh');
        test.done();
      });
    });
  },

  'test setUser img': function(test){
    var user = repo.setUser('josh', 'josh_image', 'default', 7200, client);
    user.done(function(){
      client.get('default:users:josh:img', function(e, d){
        test.equal(d, 'josh_image');
        test.done();
      });
    });
  },

  'test setUser user set': function(test){
    var user = repo.setUser('josh', 'josh_image', 'default', 7200, client);
    user.done(function(){
      client.smembers('default:users', function(e, d){
        test.equal(d.length, 1);
        test.done();
      });
    });
  },

  'test setUser expire set': function(test){
    var user = repo.setUser('josh', 'josh_image', 'default', 7200, client);
    user.done(function(){
      client.smembers('expireKeys', function(e, d){
        test.equal(d.length, 1);
        test.done();
      });
    });
  },

  'test setVote': function(test){
    var vote = repo.setVote('josh', 'default', {test: 'test'}, 7200, client);
    vote.done(function(){
      test.done();
    });
  }
});
