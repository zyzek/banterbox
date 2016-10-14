const Promise = require('bluebird')
const DB     = require('./database')
const moment = require('moment')

const room_states = {}

function updateRoomStatement(room, status, status_verbose) {
  room_states[room] = {status_id: status, status : status_verbose}
  return {text: 'UPDATE banterbox_room SET status_id = $1 WHERE id = $2', values: [status, room]}
}


/**
 * Updates all rooms according to the time.
 */
function updateRooms() {

  const statuses = {}
  return DB.connection()
    .any('SELECT * FROM banterbox_roomstatus;')
    .then(rows => {
      rows.map(x => statuses[x.name] = x.id)
      console.log(statuses)

      return Promise.resolve()
    })
    .then(() => {
      return DB.connection().any(`SELECT U.*, S.*, R.id AS room_id, R.status_id, ST.name as status_name
      FROM banterbox_scheduledroom S
        INNER JOIN banterbox_unit U
          ON S.unit_id = U.id
      LEFT JOIN banterbox_room R
          ON U.id = R.unit_id
        INNER JOIN banterbox_roomstatus ST
          ON R.status_id = ST.id`)
    })
    .then(rows => {
      const time_now   = moment(Date.now())
      const day        = time_now.day() - 1
      const statements = []

      rows.map(row => {
        if (row.day === day) {

          const start_time = moment(row.start_time, 'HH:mm')
          const end_time   = moment(row.end_time, 'HH:mm')

          const diff_start = time_now.diff(start_time, 'minutes')
          const diff_end   = time_now.diff(end_time, 'minutes')
          const length     = end_time.diff(start_time, 'minutes')


          // If time between -10 and 0
          if (diff_start >= -10 && diff_start < 0) {
            // room is commencing
            statements.push(updateRoomStatement(row.room_id, statuses['commencing'], 'commencing'))
          }
          else if (diff_start >= 0) {
            if (diff_end >= 0  && diff_end < 10) {
              statements.push(updateRoomStatement(row.room_id,statuses['concluding'], 'concluding'))
            }
            else if (diff_end >= 10) {
              statements.push(updateRoomStatement(row.room_id, statuses['closed'], 'closed'))
            }
            else {
              statements.push(updateRoomStatement(row.room_id, statuses['running'], 'running'))
            }
          }
        }
        else {
          statements.push(updateRoomStatement(row.room_id, statuses['closed'], 'closed'))
        }
      })
      return Promise.resolve(statements)
    })
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