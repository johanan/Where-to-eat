var q = require('q');

module.exports.getVote = getVote;
module.exports.getVotes = getVotes;
module.exports.removeUser = removeUser;
module.exports.setUser = setUser;
module.exports.setVote = setVote;

function getVotes(area, client){
  return q.Promise(function(resolve, reject, notify){
    client.smembers(area+':votes', function(err, votes){
      if(err)
        reject(err);
      if(votes.length > 0){
        var length = votes.length;
        var returnVotes = [];
        votes.forEach(function(key){
          getVote(key, client).done(function(vote){
            returnVotes.push(vote);
            length--;
            if(length === 0)
              resolve(returnVotes);
          }, function(err){
            reject(err);
          });
        });
      }else{
        resolve([]);
      }
    });
  });
};

function getVote(key, client){
  return q.Promise(function(resolve, reject, notify){
    client.get(key, function(err, username){
      if(err)
        reject(err);
      if(username === null)
        reject('Username is null');

      client.get(key + ':vote', function(err, vote){
        if(err)
          reject(err);
        if(vote === null)
          reject('Vote is null');
          resolve({username: username, fs: JSON.parse(vote)});
      })
    });
  });
};

function removeUser(username, area, client){
  return q.Promise(function(resolve, reject, notify){
    client.srem(area+':users', area+':users:' + username, function(err){
      if(err)
        reject(err);
      resolve();
    });
  });
};

function setUser(username, area, expire, client){
  return q.Promise(function(resolve, reject, notify){
    client.multi()
      .setex(area+':users:' + username, expire, username)
      .sadd(area+':users', area+':users:' + username)
      .expire(area+':users', expire)
      .exec(function(err){
        if(err === null){
          resolve();
        }else{
          reject(err);
        }
      })
  });
};

function setVote(username, area, fs, expire, client){
  return q.Promise(function(resolve, reject, notify){
    client.multi()
      .setex(area+':users:' + username + ':vote', expire, JSON.stringify(fs))
      .sadd(area+':votes', area+':users:' + username)
      .expire(area+':votes', expire)
      .exec(function(err){
        if(err === null){
          resolve();
        }else{
          reject(err);
        }
      });
  });
};
