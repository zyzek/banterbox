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


/* Some notes about redis:
 * http://stackoverflow.com/a/36498590/3315133
 *
 * Multiple DBs
 * ============
 * Multiple DBs are frowned upon, and what is encouraged is the "Access pattern".
 * Basically, namespace keys, and keep a list of keys somewhere. That way most of the actions will be O(1)
 * and O(N) actions won't be too large.
 *
 * Naming Convention
 * =================
 * http://redis.io/topics/data-types-intro
 * 'Try to stick with a schema.  For instance "object-type:id" is a good idea, as in "user:1000".
 *
 * http://webcache.googleusercontent.com/search?q=cache:ThrFdvthOdIJ:instagram-engineering.tumblr.com/post/12202313862/storing-hundreds-of-millions-of-simple-key-value+&cd=3&hl=en&ct=clnk&gl=au
 * The most efficient storage we can use will be redis's Hash Maps, which efficiently store the keys we will need with
 * significantly less space.
 *
 * Our Schema
 * ==========
 *
 * Hashmap fields to be namespaced on what they are:
 * - user:USER-ID
 * - timestamp:TIMESTAMP
 *
 * Each room will have:
 *  A Hashmap for the values: room:ROOM-ID FIELD VALUE
 *  - room:ROOM-ID FIELD VALUE
 *
 *  A Set of keys for history
 *  - room:ROOM-ID:history
 *
 * A Set of keys for users
 * - room:ROOM-ID:users
 *
 * At the end we will only need to drop 3 items from redis and it will be cleaned of that table.
 * Also
 *
 *
 */


const Promise      = require('bluebird');
const redis        = require('redis')
const DB           = require('./database')
const RoomManager  = require('./room_manager')
const generateName = require('adjective-adjective-animal')
const moment       = require('moment-timezone')
const uuid         = require('uuid')

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

const io                   = require('socket.io').listen(3000)
const rclient              = redis.createClient();
const room_states          = RoomManager.room_states
const broadcast_interval   = 1000
const room_update_interval = 1000 * 60


/*
 * Authentication
 * ==============
 */
require('socketio-auth')(io, {
  authenticate    : authenticate,
  postAuthenticate: postAuth,
  timeout         : 1000
});

/**
 * Checks if user is allowed to access resource, and authenticates them if so.
 */
function authenticate(socket, data, next) {
  let token_id = data.token_id;
  let room_id  = data.room_id;

  DB.connection().one({
    name  : 'get-user-from-token',
    text  : `SELECT U.id, A.key 
           FROM authtoken_token A 
           INNER JOIN auth_user U 
            ON U.id = A.user_id 
           WHERE A.key = $1`,
    values: [token_id]
  }).then(user => {
    socket.client.user_id = user.id
    return DB.connection().one({
      name  : 'get-room-for-user',
      text  : `SELECT r.id
             FROM banterbox_userunitenrolment uue 
             INNER JOIN banterbox_room r 
              ON uue.unit_id = r.unit_id
             WHERE uue.user_id = $1
             AND r.id = $2;`,
      values: [user.id, room_id]
    })

  }, error => {
    next(new Error('User not found.'))
  }).then(room => {
    return next(null, !!room)
  }, error => {
    next(new Error('Room not found.'))
  })
}

/**
 * Sets up variables for the socket to join correct room
 * Gets called after authentication succeeds
 * @param socket
 * @param data
 */
function postAuth(socket, data) {
  //add them to the room

  let client = socket.client

  generateName('pascal').then(alias => {
    rclient.hsetAsync(`room:${data.room_id}:alias`, `user:${client.user_id}`, alias)
    client.alias = alias
  })

  client.room_id = data.room_id
  socket.join(data.room_id);

  setupEventListeners(socket);
}


/**
 * Set up event listeners to the client socket
 * @param socket
 */
function setupEventListeners(socket) {

  let client = socket.client

  //add user to redis db
  rclient.saddAsync(`room:${client.room_id}:users`, client.user_id);
  //send current vote data
  sendVoteHistory(client.room_id, socket);

  socket.on('vote', data => {
    acceptVote(client.user_id, client.room_id, data.value)
  });

  socket.on('leave_room', id => {
    socket.leave(id)
    socket.emit('message', 'Room leave success')
  })

  socket.on('comment', data => {
    console.log({data})

    const client = socket.client
    const now    = Date.now()

    // Todo : random icon like aliases

    // Anonymous comment system. Grab the user's room alias
    rclient.hgetAsync(`room:${client.room_id}:alias`, `user:${client.user_id}`)
      .then(alias => {
        const comment = {
          content  : data.comment,
          timestamp: Date.now(),
          date     : moment(now).format('DD/MM/YYYY'),
          time     : moment(now).format('HH:mm:ss'),
          author   : alias
        }

        io.to(client.room_id).emit('comment', comment);

        return comment
      })
      .then(comment => {

        const timezone_stamp = moment(comment.timestamp).tz('Australia/Sydney').format()

        return DB.connection().none({
          name  : 'insert-comment',
          text  : 'INSERT INTO banterbox_comment (id, timestamp, content, private, room_id, user_id) VALUES ($1, $2, $3, $4, $5, $6);',
          values: [uuid.v4(), timezone_stamp, comment.content, false, client.room_id, client.user_id]
        })
      })
      .catch(error => {
        console.log({error})
      })


    /* TODO : Comment looks like this
     author: "jgre8297"
     content: "Saepe voluptate explicabo quos ..." etc (140~ chars)
     date: "14/10/2016"
     icon: "cutlery"
     id: "bffb1c55-7d18-4abf-b28f-a1e32b5825ed"
     time: "13:31:47"
     timestamp: 1476412307.978371
     */

  })

  socket.on('disconnect', function () {
    let client = this.client

    //remove redis entry for this user in connected_users
    var remove_connection = rclient.sremAsync(`room:${client.room_id}:users`, client.user_id);

    //remove their key-val pair
    var remove_key = rclient.hdelAsync(`room:${client.room_id}`, `user:${client.user_id}`);

    Promise.join(remove_connection, remove_key).then(function () {
      console.log("removed " + client.user_id + " from " + client.room_id);
    });
  });
}


//setup redis subscriber - doesn't seem to be doing anything? It's the only use in the file
var subscriber = redis.createClient();
subscriber.on("message", redisMsg);


/**
 * Updates all the rooms and adjusts their current state accordingly
 */
function updateRooms() {
  RoomManager.updateRooms().then(() => {
    console.log(RoomManager.room_states)
  }).then(() => {
    for (let key in room_states) {
      const room = room_states[key]
      if (room.status === 'running' && !room.is_broadcasting) {
        openRoom(key)
      }
      else if (room.status === 'closed' && room.is_broadcasting) {
        closeRoom(key)
      }
    }
  })
}


// Immediately update the rooms on script load
updateRooms()

// Once per minute, update the rooms
setInterval(updateRooms, room_update_interval)

/**
 * Helper function to return whether the room status determines if the room can be joined
 */
function allowedStatus(stat) {
  return stat === "running";
}


function allowedVote(vote) {
  return vote === "yes" || vote === "no"
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
    if (!allowedVote(vote_value)) {
      rclient.hsetAsync(`room:${room_id}`, `user:${user_id}`, 'cancel')
      console.log(`cancelled vote for user ${user_id}`)
      return
    }

    const add_vote      = rclient.hsetAsync(`room:${room_id}`, `user:${user_id}`, vote_value)
    const add_connected = rclient.saddAsync(`room:${room_id}:users`, user_id);

    Promise.join(add_vote, add_connected).then(function () {
      console.log("added user" + user_id);
    });
  }
}

//send all the past votes from the room to the client

/**
 * Sends all the votes up until the current time to the user
 * @param room_id
 * @param socket
 */
function sendVoteHistory(room_id, socket) {

  // Collect timestamps
  rclient.lrangeAsync(`room:${room_id}:history`, 0, -1)
    .map(function (timestamp_key) {
      return rclient.hgetAsync(`room:${room_id}`, `timestamp:${timestamp_key}`);
    }).map(function (data) {
    const history = JSON.parse(data);
    delete history.connected;
    return history;
  }).then(function (history) {
    //send as array to client
    return socket.emit("vote_history", history);
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
  var connected_users = [];

  //grab the vote state
  rclient.smembersAsync(`room:${room_id}:users`).map(function (user_key) {
    connected_users.push(user_key)
    return rclient.hgetAsync(`room:${room_id}`, `user:${user_key}`);
  }).then(function (result) {


    const yes   = result.filter(x => x === 'yes').length
    const no    = result.filter(x => x === 'no').length
    const now   = Date.now();
    const votes = {votes: {yes, no}, timestamp: now};

    //broadcast the votes
    io.to(room_id).emit('step', votes);

    votes.connected = connected_users;
    let history     = JSON.stringify(votes);

    //glob the data of this timestep into the redis historical field
    return rclient.lpushAsync(`room:${room_id}:history`, now)
      .then(function () {
        return rclient.hsetAsync(`room:${room_id}`, `timestamp:${now}`, history)
      });

  }).catch(function (err) {
    console.log(err);
  });
}


/**
 * Opens a room and starts the interval for broadcasting votes.
 * Attaches interval object so that the room can be closed later.
 * @param room_id
 */
function openRoom(room_id) {
  console.log(`\n* Starting broadcast for room : ${room_id}\n`)
  room_states[room_id].is_broadcasting = true
  room_states[room_id].interval_id     = setInterval(function () {
    sendVotes(room_id);
  }, broadcast_interval);
}


/**
 * Closes the room and updates history for room
 * @param room_id
 */
function closeRoom(room_id) {

  // Stop the vote broadcast
  clearInterval(room_states[room_id].interval_id)

  // Alter room state
  room_states[room_id].status          = "closed"
  room_states[room_id].is_broadcasting = false

  // Detach all sockets from the room
  const clients = io.sockets.adapter.rooms[room_id].sockets;
  for (const id in clients) {
    const socket = io.sockets.connected[id];
    socket.leave(room_id);
  }

  // Bundle all the data from redis into the relational db
  rclient.lrangeAsync(`room:${room_id}:history`, 0, -1)
    .map(function (timestamp) {
      return rclient.hgetAsync(`room:${room_id}`, `timestamp:${timestamp}`);
    })
    .then(function (histories) {
      //send to reldb
      const json = JSON.stringify({value: histories});

      return DB.connection().none({
        name  : 'update-room-history',
        text  : `UPDATE banterbox_room
                 SET history = $1
                 WHERE id = $2`,
        values: [json, room_id]
      })
    })
    .then(function () {

      // Purge redis data for the room
      const remove_room_history = rclient.delAsync(`room:${room_id}:history`)
      const remove_room_users   = rclient.delAsync(`room:${room_id}:users`)
      const remove_alias        = rclient.delAsync(`room:${room_id}:alias`)
      const remove_room         = rclient.delAsync(`room:${room_id}`)

      // Remove the room from the global state
      delete room_states[room_id];

      return Promise.join(remove_room_history, remove_room_users, remove_room, remove_alias);

    })
    .then(function () {
      console.log("finished closing");
    });
}
