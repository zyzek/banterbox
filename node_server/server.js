var Promise = require('bluebird');

var redis = require('redis');
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);
var rclient = redis.createClient();

var socketio = require('socket.io');
Promise.promisifyAll(socketio);
var io = socketio();

//TODO: on release, replace sqlite with production db (e.g. postgres)
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('../db.sqlite3');

//TODO: replace this with something else
var room_states = {};
var updateDelay = 1000; //1000ms

//force socket auth
require('socketio-auth')(io, {
	authenticate: authFn,
	postAuthenticate: postAuthFn,
	timeout: 1000	
});

//setup redis subscriber
var subscriber = redis.createClient();
subscriber.on("message", redisMsg);

function authFn(socket, data, next) {
	var token_id = data.token_id;
	var room_id = data.room_id;

	//refer to https://github.com/facundoolano/socketio-auth#configuration
	//grabbing the associated user id to see if token valid
	var stmt = db.prepare("SELECT u.id, a.key FROM authtoken_token a INNER JOIN auth_user u ON u.id = a.user_id WHERE a.key = ?");
	//this perhaps needs a return in front of it, like the other db stmt2
	return stmt.get([token_id], function(err, row) {
		if (err || row === undefined || !("id" in row)) {
			//token does not exist, as user id does not exist for it
			return next(new Error("token unauthorised"));
		} 

		var user_id = row["id"];
		socket.client.user_id = user_id;

		//check if room_id is actually a room in the global state (and is able to be connected to)
		if (room_id in room_states && allowedStatus(room_states[room_id]["status"])) {
			//check that this room is in one of the rooms that this user can view
			var stmt2 = db.prepare("SELECT r.id FROM banterbox_userunitenrolment uue INNER JOIN banterbox_room r ON uue.unit_id = r.unit_id WHERE uue.user_id = ?;");

			return stmt2.all([user_id], function(err, rows) {
				if (err || rows === undefined || rows.length == 0) {
					return next(new Error("no rooms found for user"));
				}

				//return whether the room is in the user's list of rooms they can access
				return next(null, room_id in rows);
			});
		}
		return next(new Error("invalid room auth"));
	});
}

//helper fn to return whether the room status determines if the room can be joined
function allowedStatus(stat) {
	return stat == "open";
}

function postAuthFn(socket, data) {
	var room = data.room_id;

	//TODO: robust checker required
	socket.client.room = room;

	//TODO: add them to the room
	socket.join(room);

	//TODO: check - perhaps define socket code here?
	registerRoutes(socket);
}

function registerRoutes(socket) {
	socket.on('connect', function(client) {
		//TODO: setup client code

		//send current vote data
	});

	socket.on('vote', function(client) {
		//TODO: received client's vote
	});

	socket.on('disconnect', function(client) {
		//remove redis entry for this user in connected_users

		//operate on client.user_id i think..
	});
}

function redisMsg(channel, message) {

	//parse the message into JSON
	try {
		var jmsg = JSON.parse(message);
	} catch (err) {
		console.log("error in parsing message");
		return;
	}

	//depending on the channel, call the appropiate message handler fn
	if (channel === "room_update") {
		updateRoom(jmsg);
	} else {
		console.log("invalid channel supplied" + channel);
	}
}


function sendVotes(room_id) {

	//TODO: connect to the db for the room_id
	var connectedUsers = [];

		//grab the vote state
	rclient.lrangeAsync("connected", 0, -1).map(function(reply) {
		connectedUsers = reply;
		return rclient.getAsync(reply);
	}).then(function (res) {
		//tally up the votes
		votes = {"yes": 0, "no": 0};
		for (vote of res) {
			if (vote === "yes") {
				votes["yes"] += 1;
			} else if (vote === "no") {
				votes["no"] += 1;
			}
		}

		var now = Date.now();
		votes["ts"] = now;
		voteStr = JSON.stringify(votes);

		//broadcast the votes
		io.to(room_id).emit('data', voteStr);

		votes["connected"] = connectedUsers;
		histStr = JSON.stringify(votes);

		//glob the data of this timestep into the redis historical field
		return rclient.lpushAsync("history", now).then(function() {
			return rclient.setAsync(now, histStr);
		});

	}).then(function() {
		console.log("done");
	}).catch(function(err) {
		console.log(err);
	});	
	//call this fn again
	setTimeout(function() { sendVotes(room_id); }, updateDelay);
}

function openRoom(room_id) {
	//grab the dbnum for the room_id from redis

	//insert empty redis vals

	//update the room_states dict to reflect the room state

	//update the relational db to reflect the open status

	//set up the N time interval timer (to broadcast votes out)
}

function closeRoom(room_id) {
	//close all owned sockets in this room

	//bundle all the data from redis into the relational db

	//purge the redis for that room/db num

}

function updateRoom(message) {
	//e.g. kick all users from room
	//make room valid to join.. etc
	if (!("room_id" in message) || !("action" in message)) {
		//don't do anything, log as error
		console.log("error, invalid redis msg");
		console.log(message);
		return;
	}

	if (message["action"] === "open") {
		openRoom(message["room_id"]);
	} else if (message["action"] === "close") {
		closeRoom(message["room_id"]);
	}
}


//io.on('connection', function(client) {
//
	//console.log(client);
	//client.emit('an event', {'some': 'data'});
//});

io.listen(3000);


////////////// testing code
var express = require('express');
var app = express();

app.use(express.static('clienttest'));
app.listen(3001);

