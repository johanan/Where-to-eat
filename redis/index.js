var config = require('../config'),
    redis = require('redis');

var client = redis.createClient(config.REDISPORT, config.REDISHOST);

client.on('error', function(e){
  console.log(e);
});

module.exports = client;
