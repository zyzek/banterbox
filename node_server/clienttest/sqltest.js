var Promise = require('bluebird');

var sqlite3 = Promise.promisifyAll(require('sqlite3').verbose());
var db = new sqlite3.Database('../../db.sqlite3');

var stmt = db.prepare("SELECT u.id, a.key FROM authtoken_token a INNER JOIN auth_user u ON u.id = a.user_id WHERE a.key = ?");

var x = stmt.get(["4fba7390c7dcf552e9b6ae1a02c9680851e6f3f5"],function(err, row) {
	return row["id"];
});

console.log(x);


sleep(10);

// sleep time expects milliseconds
function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

// Usage!
sleep(500).then(() => {
    // Do something after the sleep!
	console.log(x);
});
