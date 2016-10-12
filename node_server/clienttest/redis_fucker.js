var redis = require('redis');
var Promise = require('bluebird');
Promise.promisifyAll(redis);
var rclient = redis.createClient();


// client.lrange("connected", 0, -1, function(err, reply) {
// 	console.log(reply);

// 	for (i of reply) {
// 		listUserCorn(i);
// 	}
// });


// function listUserCorn(user) {
// 	client.get(user, function(err, reply) {
// 		console.log(user + ":" + reply);
// 	});
// }

rclient.lrangeAsync("connected", 0, -1).map(function(reply) {
	return rclient.getAsync(reply);
}).then(function (res) {
	console.log(res);

	votes = {"yes": 0, "no": 0};

	for (vote of res) {
		if (vote === "yes") {
			votes["yes"] += 1;
		} else if (vote === "no") {
			votes["no"] += 1;
		}
	}

	console.log(votes);

	//broad cast the votes
	return;
});