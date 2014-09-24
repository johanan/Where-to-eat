var config = require('../config'),
    redis = require('redis'),
    url = require('url');

var redisConfig = url.parse(config.REDISURL);
var client = redis.createClient(redisConfig.port, redisConfig.hostname);

if (redisConfig.auth !== null)
  client.auth(redisConfig.auth.split(':')[1]);

client.on('error', function(e){
  console.log(e);
});

module.exports = client;
