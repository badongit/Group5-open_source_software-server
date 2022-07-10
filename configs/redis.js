const redis = require("redis");

const redisClient = redis.createClient({
  socket: { port: process.env.REDIS_PORT, host: process.env.REDIS_HOST },
  password: process.env.REDIS_PASSWORD,
});

redisClient.on("connect", () => {
  console.log("Redis connected");
});

redisClient.on("error", (error) => {
  console.log(`Error to connect Redis: ${error.message}`);
});

module.exports = redisClient;
