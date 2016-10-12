from enum import Enum

# Room Statuses
class Statuses(Enum):
  commencing = "commencing"
  running = "running"
  paused = "paused"
  concluding = "concluding"
  closed = "closed"

# User Roles
class Roles(Enum):
  participant = "participant"
  owner = "owner"
  moderator = "moderator"
