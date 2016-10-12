from threading import Lock
from itertools import dropwhile
import redis

from . import models as m

POOL = redis.ConnectionPool(host="localhost", port=6379, db=0)
UPDATE_CHANNEL = "room_update"


class RoomDBManager:
  """Manages the mapping from running Rooms to redis db numbers."""

  # db 0 is reserved for communication between django and node
  _reserved = "RESERVED"
  db_room_map = [_reserved]
  mutex = Lock()

  @staticmethod
  def _rm_trailing_nones(seq):
    return list(dropwhile(lambda x: x is None, seq[::-1]))[::-1]

  @classmethod
  def get_room_db(cls, room_id):
    """Return the next unused database."""
    cls.mutex.acquire()
    try:
      index = cls.db_room_map.index(room_id)
    except:
      try:
        index = cls.db_room_map.index(None)
        cls.db_room_map[index] = room_id
      except:
        index = len(cls.db_room_map)
        cls.db_room_map.append(room_id)
    cls.mutex.release()
    return index

  @classmethod
  def clear_room_db(cls, room_id):
    """Free the given room's database."""
    if room_id == cls._reserved:
      return
    cls.mutex.acquire()
    try:
      index = cls.db_room_map.index(room_id)
      cls.db_room_map[index] = None
      if cls.db_room_map[-1] is None:
        cls.db_room_map = cls._rm_trailing_nones(cls.db_room_map)
    except:
      pass
    cls.mutex.release()


def open_room(room_id):
  """If a room exists in the database, tell node to open it."""

  room = m.Room.objects.get(pk=room_id)

  # add an entry into the redis communication db for the given room
  store = redis.Redis(connection_pool=POOL)
  store.set(room.id, RoomDBManager.get_room_db(room.id))

  room.status = m.RoomStatus.objects.get(name=m.Statuses.commencing.value)
  room.save()

  # tell the node server that the room is open
  store.publish(UPDATE_CHANNEL, redis_pub_msg(room.id, "open"))


def close_room(room_id):
  """If a room is running, tell django to close it."""

  room = m.Room.objects.get(pk=room_id)

  # Delete the room from the db mapping
  store = redis.Redis(connection_pool=POOL)
  store.delete(room.id)
  RoomDBManager.clear_room_db(room.id)

  room.status = m.RoomStatus.objects.get(name=m.Statuses.concluding.value)
  room.save()

  # tell the node server to close the room.
  store.publish(UPDATE_CHANNEL, redis_pub_msg(room.id, "close"))

  # Q: what happens if a room tries to open on the redis db
  # we just closed, before node has finshed handling it?


def redis_pub_msg(room_id, action):
  return {"room_id": room_id, "action": action}


