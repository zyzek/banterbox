//Notes about the current state of the program:

//Redis is currently ONLY operating on db0, which means that concurrent rooms will overwrite each others data
// This will be the case until we decide how we're actually going to be determining which redis inst we should use

//Functions that need implementing for interaction with client:
// nothing here woo

//Things that will need changing for final release:
// redis db location/instance code
// testing lol

//Things that probably should be done
// promisify auth code (db)
// double check setup code (on 'connect')
// consolidate magic numbers
// remove express serving pages
// do we need to check if the server accepted their vote?
// handling most recent vote by including timestep info

var Promise = require('bluebird');

var redis = require('redis');
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);
//TODO, move this into the room_states obj, to ensure each room operates in its own db/instance
var rclient = redis.createClient();

var io = require('socket.io').listen(3000)
//force socket auth
require('socketio-auth')(io, {
  authenticate    : authFn,
  postAuthenticate: postAuthFn,
  timeout         : 1000
});


//TODO: on release, replace sqlite with production db (e.g. postgres)
var _sq3 = require('sqlite3')
Promise.promisifyAll(_sq3);
var sqlite3 = _sq3.verbose();
var db      = new sqlite3.Database('../db.sqlite3');

//TODO: replace this with something else - perhaps this is the best solution
var room_states = {};
//how frequently votes are sent out for each room
var updateDelay = 1000;


//setup redis subscriber
var subscriber = redis.createClient();
subscriber.on("message", redisMsg);


//TODO: convert into promises

/**
 * Checks if user is allowed to access resource, and authenticates them if so.
 * @param socket
 * @param data
 * @param next
 * @returns {*}
 */
function authFn(socket, data, next) {
  var token_id = data.token_id;
  var room_id  = data.room_id;

  //refer to https://github.com/facundoolano/socketio-auth#configuration
  //grabbing the associated user id to see if token valid
  var stmt = db.prepare(
    "SELECT u.id, a.key FROM authtoken_token a INNER JOIN auth_user u ON u.id = a.user_id WHERE a.key = ?");
  //this perhaps needs a return in front of it, like the other db stmt2
  return stmt.get([token_id], function (err, row) {
    if (err || row === undefined || !("id" in row)) {
      //token does not exist, as user id does not exist for it
      return next(new Error("token unauthorised"));
    }

    var user_id           = row["id"];
    socket.client.user_id = user_id;



    //check if room_id is actually a room in the global state (and is able to be connected to)
    if (room_id in room_states && allowedStatus(room_states[room_id]["status"])) {
      //check that this room is in one of the rooms that this user can view
      var stmt2 = db.prepare(
        "SELECT r.id FROM banterbox_userunitenrolment uue INNER JOIN banterbox_room r ON uue.unit_id = r.unit_id WHERE uue.user_id = ?;");

      return stmt2.all([user_id], function (err, rows) {
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

/**
 * Helper function to return whether the room status determines if the room can be joined
 */
function allowedStatus(stat) {
  return stat === "open";
}


function allowedVote(vote) {
  return vote === "yes" || vote === "no" || vote == "cancel";
}

/**
 * Sets up variables for the socket to join correct room
 * Gets called after authentication succeeds
 * @param socket
 * @param data
 */
function postAuthFn(socket, data) {
  var room           = data.room_id;
  socket.client.room = room;

  //add them to the room
  socket.join(room);

  //TODO: check - perhaps define socket code here?
  setupEventListeners(socket);
}

/**
 * Set up event listeners to the socket
 * @param socket
 */
function setupEventListeners(socket) {
  socket.on('connect', function (client) {
    //TODO: setup client code (double check)

    //add user to redis db
    rclient.saddAsync("connected", client.user_id);

    //send current vote data
    historicalVotes(client.room, client);
  });

  socket.on('vote', function (client, msg) {
    //received client's vote

    //TODO: check vote's ts to see if it's more recent, etc

    acceptVote(client.user_id, client.room_id, msg["vote"]["value"])
  });

  socket.on('disconnect', function (client) {
    //kick em from the room just in case
    client.leave(client.room);

    //remove redis entry for this user in connected_users
    var remCon = rclient.sremAsync("connected", client.user_id);
    //remove their key-val pair
    var remKey = rclient.delAsync(client.user_id);

    Promise.join(remCon, remKey).then(function () {
      console.log("removed " + client.user_id + " from " + client.room);
    });
  });
}

function redisMsg(channel, message) {
  //parse the message into JSON
  try {
    var jmsg = JSON.parse(message);
  }
  catch (err) {
    console.log("error in parsing message");
    return;
  }

  //depending on the channel, call the appropiate message handler fn
  if (channel === "room_update") {
    updateRoom(jmsg);
  }
  else {
    console.log("invalid channel supplied" + channel);
  }
}

/**
 * Updates a user's vote status.
 * If vote status is not allowed, it is ignored.
 * @param user_id
 * @param room_id
 * @param vote_value
 */
function acceptVote(user_id, room_id, vote_value) {

  //TODO: connect to the db for the room id


  //check whether the room is still accepting votes
  if (room_id in room_states && allowedStatus(room_states[room_id]["status"])) {

    //check vote value
    // TODO: Cancel the vote if it's not allowed
    if (!allowedVote(vote_value)) return;

    //set usr1 = vote value
    var userSet = rclient.setAsync(user_id, vote_value);

    //add usr1 to connected usrs if not already in
    var connectedAdd = rclient.saddAsync("connected", user_id);

    Promise.join(userSet, connectedAdd).then(function () {
      console.log("added user" + user_id);
    });
  }
}

//send all the past votes from the room to the client

/**
 * Sends all the votes up until the current time to the user
 * @param room_id
 * @param client
 */
function historicalVotes(room_id, client) {

  //TODO: connect to the db for the room id


  //grab each timestep
  rclient.lrangeAsync("history", 0, -1).map(function (reply) {
    return rclient.getAsync(reply);
  }).map(function (history) {
    //convert each history string into json
    var hisJ = JSON.parse(history);

    //remove the connected users string
    delete hisJ.connected;
    return hisJ;
  }).then(function (completeHist) {
    //send as array to client
    return client.emit("data", completeHist);
  }).catch(function (e) {
    console.log(e);
  });
}


/**
 * Counts and broadcast the votes to all users in the room
 * @param room_id
 */
function sendVotes(room_id) {
  //TODO: connect to the db for the room_id
  var connectedUsers = [];

  //grab the vote state
  rclient.smembersAsync("connected", 0, -1).map(function (reply) {
    connectedUsers.push(reply);
    return rclient.getAsync(reply);
  }).then(function (res) {
    //tally up the votes
    let votes = {"votes": {"yes": 0, "no": 0}};
    for (vote of res) {
      if (vote === "yes") {
        votes["votes"]["yes"] += 1;
      }
      else if (vote === "no") {
        votes["votes"]["no"] += 1;
      }
    }

    var now     = Date.now();
    votes["ts"] = now;
    //voteStr = JSON.stringify(votes);

    //broadcast the votes
    //TODO: test if clients will ever receive who's connected - could be vunerable
    io.to(room_id).emit('step', votes);

    votes["connected"] = connectedUsers;
    let histStr        = JSON.stringify(votes);

    //glob the data of this timestep into the redis historical field
    return rclient.lpushAsync("history", now).then(function () {
      return rclient.setAsync(now, histStr);
    });

  }).then(function () {
    console.log("done");
  }).catch(function (err) {
    console.log(err);
  });
  //call this fn again
  if (allowedStatus(room_states[room_id])) {
    setTimeout(function () {
      sendVotes(room_id);
    }, updateDelay);
  }
}


/**
 * Opens room and initialises the interval for pushing out votes.
 * @param room_id
 */
function openRoom(room_id) {
  //TODO: grab the dbnum for the room_id from redis

  //insert empty redis vals (TODO: is this even necessary?)

  //update the room_states dict to reflect the room state
  room_states[room_id]["status"] = "open";

  //TODO: update the relational db to reflect the open status

  //set up the N time interval timer (to broadcast votes out)
  setTimeout(function () {
    sendVotes(room_id);
  }, updateDelay);
}


/**
 * Closes the room and updates history for room
 * @param room_id
 */
function closeRoom(room_id) {
  //that room in the global object must be set to closed
  room_states[room_id]["status"] = "closed";

  //close all owned sockets in this room
  //does this even work?
  io.to(room_id).disconnect();

  //bundle all the data from redis into the relational db
  rclient.lrangeAsync("history", 0, -1).map(function (ts) {
    return rclient.getASync(ts);
  }).then(function (histories) {

    //send to reldb
    var sendMsg = JSON.stringify({"value": histories});
    var stmt    = db.prepare("UPDATE banterbox_room SET history=? WHERE id=?");
    var dbProm  = stmt.runAsync([sendMsg, room_id]);

    //purge the redis for that room/db num
    var redisProm = rclient.flushdbAsync();

    //del the global obj for this room
    delete room_states[room_id];

    return Promise.join(dbProm, redisProm);

  }).then(function () {
    console.log("finished closing");
  });
}

/**
 * Handles room status
 * @param message
 */
function updateRoom(message) {
  //make room valid to join.. etc
  if (!("room_id" in message) || !("action" in message)) {
    //don't do anything, log as error
    console.log("error, invalid redis msg");
    console.log(message);
    return;
  }

  if (message["action"] === "open") {
    openRoom(message["room_id"]);
  }
  else if (message["action"] === "close") {
    closeRoom(message["room_id"]);
  }
}