const Promise      = require('bluebird');
const redis        = require('redis')

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);
const rclient              = redis.createClient();




module.exports= {
  rclient
}