/* Some notes about redis:
 * http://stackoverflow.com/a/36498590/3315133
 *
 * Multiple DBs
 * ============
 * Multiple DBs are frowned upon, and what is encouraged is the "Access pattern".
 * Basically, namespace keys, and keep a list of keys somewhere. That way most of the actions will be O(1)
 * or low O(N).
 *
 * Naming Convention
 * =================
 * http://redis.io/topics/data-types-intro
 * 'Try to stick with a schema.  For instance "object-type:id" is a good idea, as in "user:1000".
 *
 * http://webcache.googleusercontent.com/search?q=cache:ThrFdvthOdIJ:instagram-engineering.tumblr.com/post/12202313862/storing-hundreds-of-millions-of-simple-key-value+&cd=3&hl=en&ct=clnk&gl=au
 * The most efficient storage we can use will be redis's Hash Maps, which efficiently store the keys we will need with
 * significantly less space over just storing them all in global space.
 *
 * Our Schema
 * ==========
 *
 * Hashmap fields to be namespaced on what they are:
 * - user:<USER-ID>
 * - timestamp:<TIMESTAMP>
 *
 * Each room will have:
 *  A Hashmap for the values: room:ROOM-ID FIELD VALUE
 *  - room:<ROOM-ID> <FIELD> <VALUE>
 *
 *  A Hashmap for the aliases:
 *  - room:<ROOM-ID> <USER-ID> <ALIAS>
 *
 *  A List of keys for history
 *  - room:<ROOM-ID>:history
 *
 * A Set of keys for users
 * - room:<ROOM-ID>:users
 *
 * At the end we will only need to drop a total of 4 items from redis and all room data will be purged.
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
  let client   = socket.client

  // Check against their token they sent
  DB.connection().one({
    name  : 'get-user-from-token',
    text  : `SELECT U.id, A.key 
           FROM authtoken_token A 
           INNER JOIN auth_user U 
            ON U.id = A.user_id 
           WHERE A.key = $1`,
    values: [token_id]
  }).then(found => {
    return next(null, !!found)
  }, error => {
    console.log({error})
    next(new Error('Invalid user/token.'))
  })
}

/**
 * Sets up variables for the socket to join correct room
 * Gets called after authentication succeeds.
 * If the user is blacklisted from the room, they are unauthorized and their socket doesn't join a room.
 * @param socket
 * @param data
 */
function postAuth(socket, data) {

  let client = socket.client

  DB.connection().one({
    name  : 'get-room-for-user',
    text  : `SELECT
  EN.user_id,
  ROOM.id,
  ROLE.name                AS role,
  BLACKLIST.id IS NOT NULL AS blacklisted,
  U.username
  FROM banterbox_userunitenrolment EN
    INNER JOIN banterbox_room ROOM
      ON EN.unit_id = ROOM.unit_id
    LEFT JOIN banterbox_userunitrole ROOM_ROLE
      ON EN.unit_id = ROOM_ROLE.unit_id
         AND ROOM_ROLE.user_id = EN.user_id
    LEFT JOIN banterbox_userrole ROLE
      ON ROOM_ROLE.role_id = ROLE.id
    LEFT JOIN banterbox_userroomblacklist BLACKLIST
      ON ROOM.id = BLACKLIST.room_id
         AND BLACKLIST.user_id = EN.user_id
    LEFT JOIN auth_user U on EN.user_id = U.id
  WHERE EN.user_id = (SELECT user_id FROM authtoken_token WHERE key = $1)
        AND ROOM.id = $2;`,
    values: [data.token_id, data.room_id]
  }).then(result => {


    // If a user is blacklisted, do not register socket event listeners, return a message to the user.
    client.blacklisted = result.blacklisted
    if (client.blacklisted) {
      socket.emit('unauthorized', {message: 'You are blacklisted from this room'})
      return Promise.reject('User is blacklisted')
    }

    // Otherwise continue with assignment
    client.user_id  = result.user_id
    client.role     = result.role
    client.room_id  = result.id
    client.username = result.username


  })

  /*
   * Create an alias for the user for the sake of anon comments,
   * and set up their event listeners.
   *
   */
    .then(() => {
      generateName('pascal').then(alias => {
        let _alias = alias
        if (client.role === 'owner' || client.role === 'moderator') {
          _alias = client.username
        }
        rclient.hsetnxAsync(`room:${data.room_id}:alias`, `user:${client.user_id}`, _alias)
      })

      socket.join(data.room_id);

      setupEventListeners(socket);
    })


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
  sendCommentHistory(client.room_id, socket)

  socket.on('vote', data => {
    acceptVote(client.user_id, client.room_id, data.value)
  });

  socket.on('leave_room', id => {
    socket.leave(id)
    socket.emit('message', 'Room leave success')
  })


  /**
   * Broadcast a comment to the room's chat channel , and persist it to the database.
   */
  socket.on('comment', data => {

    const client = socket.client
    const now    = Date.now()

    // Anonymous comment system. Grab the user's room alias
    rclient.hgetAsync(`room:${client.room_id}:alias`, `user:${client.user_id}`)
      .then(alias => {
        const comment = {
          content  : data.comment,
          timestamp: Date.now(),
          date     : moment(now).format('DD/MM/YYYY'),
          time     : moment(now).format('HH:mm:ss'),
          author   : alias,
          icon     : ['owner', 'moderator'].indexOf(client.role) !== -1 ? 'user-secret' : null,
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
      console.log("added user: " + user_id);
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
 * Returns all comments so far.
 * Non moderator/owner comments are anonymous, therefore we set aliases
 * @param room_id
 * @param socket
 */
function sendCommentHistory(room_id, socket) {

  DB.connection().any({
    name  : 'grab-comments-for-room',
    text  : `SELECT COMMENT_DATA.*, UR.name as ROLE
             FROM (SELECT * FROM banterbox_comment C
               INNER JOIN banterbox_room  ROOM ON C.room_id = ROOM.id
               INNER JOIN auth_user ON C.user_id = auth_user.id
               LEFT JOIN banterbox_userunitrole ROLE ON ROOM.unit_id = ROLE.unit_id  AND ROLE.user_id = C.user_id
             WHERE room_id = $1
             AND C.private = FALSE ) COMMENT_DATA
             LEFT JOIN banterbox_userrole UR ON UR.id = COMMENT_DATA.role_id
             ORDER BY timestamp DESC ;`,
    values: [room_id]
  })
    .then(rows => {
      const promises = []
      for (let r of rows) {
        promises.push(
          generateName('pascal')
            .then(alias => {

              // Add alias if not exists
              let _alias = alias
              if (r.role === 'owner' || r.role === 'moderator') {
                _alias = r.username
              }
              rclient.hsetnxAsync(`room:${room_id}:alias`, `user:${r.user_id}`, _alias)
            })
        )
      }


      // When all aliases are created, set up alias lookup object
      return Promise.join(...promises)
        .then(() => {
          return rclient.hgetallAsync(`room:${room_id}:alias`).then(aliases => {
            return {aliases, rows}
          })

        })
    })
    .then(data => {
      const rows     = data.rows
      const aliases  = data.aliases
      const comments = []
      for (let r of rows) {
        comments.push({
          content  : r.content,
          timestamp: moment(r.timestamp).unix(),
          date     : moment(r.timestamp).format('DD/MM/YYYY'),
          time     : moment(r.timestamp).format('HH:mm:ss'),
          author   : aliases[`user:${r.user_id}`],
          icon     : ['owner', 'moderator'].indexOf(r.role) !== -1 ? 'user-secret' : null

        })
      }


      // Finally broadcast~! Phew!!!
      socket.emit('comment_history', comments)

    })

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
