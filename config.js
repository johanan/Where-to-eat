var config = {
  REDISPORT: getEnv('REDISPORT'),
  REDISHOST: getEnv('REDISHOST'),
  PORT: getEnv('PORT')
};

function getEnv(variable){
  if (process.env[variable] === undefined){
    throw new Error('You must create an environment variable for ' + variable);
  }

  return process.env[variable];
};

module.exports = config;
