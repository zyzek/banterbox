const Promise = require('bluebird')
const DB      = require('./database')
const moment  = require('moment')
const uuid    = require('uuid')

const room_states = {}

/**
 * A combined helper method that updates the global room states and generates SQL to correspond with it in the database.
 * @param room
 * @param status_id
 * @param status_verbose
 * @returns {{text: string, values: *[]}}
 */
function updateRoomStatement(room, status_id, status_verbose) {
  if (!room_states[room]) {
    room_states[room] = {
      status_id      : status_id,
      status         : status_verbose,
      is_broadcasting: false,
      interval_id    : null
    }
  }
  else {
    Object.assign(room_states[room], {
      status_id: status_id,
      status   : status_verbose,
    })
  }
  return {text: 'UPDATE banterbox_room SET status_id = $1 WHERE id = $2', values: [status_id, room]}
}


/**
 * Updates all rooms according to the time.
 */
function updateRooms() {

  const statuses = {}
  const time_now = moment(Date.now())
  // negative modulo fix & JS <-> Python day int conversion.
  // Magic number 7 for days in a week
  const day = (((time_now.day() - 1) % 7) + 7) % 7;
  return DB.connection()
    .any('SELECT * FROM banterbox_roomstatus;')
    .then(rows => {
      rows.map(x => statuses[x.name] = x.id)
      console.log(statuses)

      return Promise.resolve()
    })

    // Collect the room schedules
    .then(() => {
      return DB.connection().any({
        name  : "collect-room-schedule",
        text  : `SELECT
                 U.*,
                 SC.*,
                 R.id AS room_id, R.status_id, R.status_name
               FROM banterbox_scheduledroom SC
                 LEFT JOIN
                 (SELECT  banterbox_room.*, COALESCE(banterbox_roomstatus.name, 'unopened') AS status_name
                  FROM banterbox_room LEFT JOIN banterbox_roomstatus
                      ON banterbox_room.status_id = banterbox_roomstatus.id) R
                   ON R.unit_id = SC.unit_id
                   AND (R.status_id != 5 OR R.status_id IS NULL )
                 INNER JOIN banterbox_unit U ON SC.unit_id = U.id
               WHERE day = $1;`,
        values: [day]
      })
    })

    /* Iterate through the schedule and if the day matches with the current day,
     * perform calculations to see if the times are within current bounds and update
     * the room states.
     */
    .then(rows => {
      const promises = []

      rows.map(row => {
        if (row.status_name === null) {
          console.log("Creating room.")
          promises.push(DB.connection().any({
            name  : "create-room",
            text  : `INSERT INTO banterbox_room (id, name, created_at, lecturer_id, status_id, unit_id, private, password_protected)
                       VALUES (
                         $1,
                         $2,
                         NOW(),
                         $3,
                         NULL,
                         $4,
                         false,
                         false
                       );`,
            values: [uuid.v4(), `${row.code} lecture`, row.lecturer_id, row.unit_id]
          }))
        }
      })
      return Promise.join(...promises).then(() => {
        return rows
      })
    })


    .then(rows => {
      const statements = []

        rows = rows.filter(x => !!x.status_name)


        rows.map(row => {
        const start_time = moment(row.start_time, 'HH:mm')
        const end_time   = moment(row.end_time, 'HH:mm')

        const diff_start = time_now.diff(start_time, 'minutes')
        const diff_end   = time_now.diff(end_time, 'minutes')
        const length     = end_time.diff(start_time, 'minutes')



        /*
         * Room Lifecycle:
         *  Commencing --> Running --> Concluding --> Closed
         */

        if (diff_start >= -10 && diff_start < 0) {
          statements.push(updateRoomStatement(row.room_id, statuses['commencing'], 'commencing'))
        }
        else if (diff_start >= 0) {
          if (diff_end >= 0 && diff_end < 10) {
            statements.push(updateRoomStatement(row.room_id, statuses['concluding'], 'concluding'))
          }
          else if (diff_end >= 10) {
            statements.push(updateRoomStatement(row.room_id, statuses['closed'], 'closed'))
          }
          else {
            statements.push(updateRoomStatement(row.room_id, statuses['running'], 'running'))
          }
        }

      })

      return statements
    })


    /*
     *  Push and send all the statements together in a transaction instead of one by one.
     */
    .then(statements => {
      function source(index) {
        // create and return a promise object dynamically,
        // based on the index passed;
        if (index < statements.length) {
          return this.any(statements[index].text, statements[index].values);
        }
        // returning or resolving with undefined ends the sequence;
        // throwing an error will result in a reject;
      }

      return DB.connection().tx(function (t) {
        return this.sequence(source)
      })
    })
    .then(sequence => {
      console.log({sequence})
    })
    .catch(error => {
      console.log({error})
    })
}


module.exports = {
  updateRooms,
  room_states
}