/*
 * Notes about the current state of the program:
 *
 * Redis is currently ONLY operating on db0, which means that concurrent rooms will overwrite each others data
 *  - This will be the case until we decide how we're actually going to be determining which redis inst we should use
 *
 * Functions that need implementing for interaction with client:
 *  - nothing here woo
 *
 * Things that will need changing for final release:
 *  - redis db location/instance code
 *  - testing lol
 *
 * Things that probably should be done
 *  - promisify auth code (db)
 *  - double check setup code (on 'connect')
 *  - consolidate magic numbers
 *  - remove express serving pages
 *  - do we need to check if the server accepted their vote?
 *  - handling most recent vote by including timestep info
 */


var Promise = require('bluebird');
var redis = require('redis');
var DB = require('./database')
var RoomManager = require('./room_manager')



const room_states = RoomManager.room_states

const updateRooms = () => {
    RoomManager.updateRooms().then(() => {
        console.log(RoomManager.room_states)
    }).then(() => {

      for(let key in room_states){
        if(room_states[key].status === 'running' && !room_states[key].is_broadcasting){
          room_states[key].is_broadcasting = true
          room_states[key].interval_id = startBroadcasting(key)
        }
      }
    })
};


updateRooms()
let interval_id = setInterval(updateRooms, 1000 * 60)


Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);
//TODO, move this into the room_states obj, to ensure each room operates in its own db/instance
var rclient = redis.createClient();

var io = require('socket.io').listen(3000)
require('socketio-auth')(io, {
    authenticate: authenticate,
    postAuthenticate: postAuthFn,
    timeout: 1000
});



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
function authenticate(socket, data, next) {
    let token_id = data.token_id;
    let room_id = data.room_id;

    DB.connection().one({
        name: 'get-user-from-token',
        text: `SELECT U.id, A.key 
           FROM authtoken_token A 
           INNER JOIN auth_user U 
            ON U.id = A.user_id 
           WHERE A.key = $1`,
        values: [token_id]
    }).then(user => {
      socket.client.user_id = user.id
        return DB.connection().one({
            name: 'get-room-for-user',
            text: `SELECT r.id
             FROM banterbox_userunitenrolment uue 
             INNER JOIN banterbox_room r 
              ON uue.unit_id = r.unit_id
             WHERE uue.user_id = $1
             AND r.id = $2;`,
            values: [user.id, room_id]
        })

    }, error => {
        next(new Error('User not found.'))
        return Promise.reject()
    }).then(room => {
      socket.client.room_id = room_id
      return next(null, !!room)
    }, error => {
        next(new Error('Room not found.'))
        return Promise.reject()
    })
}


/**
 * Helper function to return whether the room status determines if the room can be joined
 */
function allowedStatus(stat) {
    return stat === "running";
}


function allowedVote(vote) {
    return vote === "yes" || vote === "no"
}

/**
 * Sets up variables for the socket to join correct room
 * Gets called after authentication succeeds
 * @param socket
 * @param data
 */
function postAuthFn(socket, data) {
    var room = data.room_id;
    socket.client.room = room;

    //add them to the room
    socket.join(room);

    //TODO: check - perhaps define socket code here?
    setupEventListeners(socket);
}

/**
 * Set up event listeners to the client socket
 * @param socket
 */
function setupEventListeners(socket) {

    let client = socket.client

    //add user to redis db
    rclient.saddAsync("connected", client.user_id);
    //send current vote data
    sendVoteHistory(client.room, socket);

    socket.on('vote', data => {
        console.log({data})
        acceptVote(client.user_id, client.room_id, data.value)

        socket.emit('message', {
            message: 'vote recieved',
            vote: data.value,
            timestamp: data.timestamp,
            diff: Date.now() - data.timestamp
        })
    });

    socket.on('disconnect', function () {
        let client = this.client

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


    //check whether the room is still accepting votes
    if (room_id in room_states && allowedStatus(room_states[room_id]["status"])) {



        //check vote value
        // TODO: Cancel the vote if it's not allowed
        if (!allowedVote(vote_value)) {
            rclient.setAsync(user_id, 'cancel')
            console.log(`cancelled vote for user ${user_id}`)
            return
        }

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
function sendVoteHistory(room_id, socket) {

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
        return socket.emit("data", completeHist);
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
    rclient.smembersAsync("connected").map(function (reply) {
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

        var now = Date.now();
        votes["ts"] = now;
        //voteStr = JSON.stringify(votes);

        //broadcast the votes
        //TODO: test if clients will ever receive who's connected - could be vunerable
        io.to(room_id).emit('step', votes);

        votes["connected"] = connectedUsers;
        let histStr = JSON.stringify(votes);

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
          console.log("Imma send shit yall")
            sendVotes(room_id);
        }, updateDelay);
    }
}


/**
 * Starts the interval for broadcasting votes.
 * @param room_id
 */
function startBroadcasting(room_id) {
    //TODO: grab the dbnum for the room_id from redis

    //set up the N time interval timer (to broadcast votes out)
    return setInterval(function () {
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
        var stmt = db.prepare("UPDATE banterbox_room SET history=? WHERE id=?");
        var dbProm = stmt.runAsync([sendMsg, room_id]);

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
        startBroadcasting(message["room_id"]);
    }
    else if (message["action"] === "close") {
        closeRoom(message["room_id"]);
    }
}

