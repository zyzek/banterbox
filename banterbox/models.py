from django.db import models
from django.contrib.auth.models import User
from uuid import uuid4

# For creating auth tokens
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from rest_framework.authtoken.models import Token

from enum import Enum


class Statuses(Enum):
    """
    Room statuses
    """
    commencing = "commencing"
    running = "running"
    paused = "paused"
    concluding = "concluding"
    closed = "closed"


class Roles(Enum):
    """
    User roles
    """
    participant = "participant"
    owner = "owner"
    moderator = "moderator"


class Profile(models.Model):
    """
    Profiles for the user object since Django is a little bitch.
    """
    id = models.UUIDField(primary_key=True, default=uuid4)
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    icon = models.CharField(max_length=255, default="user")
    email_notifications = models.BooleanField(default=False)

    def __str__(self):
        return self.user.username


class RoomStatus(models.Model):
    """
    The status a room may have according to its lifecycle.
    """
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name



class Room(models.Model):
    """
    A room is an area where users can gather and vote or create comments.
    A room is created for a unit according to the schedule.
    """
    id = models.UUIDField(primary_key=True, default=uuid4)
    name = models.CharField(max_length=255)
    lecturer = models.ForeignKey(User)
    unit = models.ForeignKey('Unit', models.SET_NULL, null=True)
    status = models.ForeignKey(RoomStatus, models.SET_NULL, null=True)
    private = models.BooleanField(default=False)
    password_protected = models.BooleanField(default=False)
    password = models.CharField(max_length=255, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    commenced_at = models.DateTimeField(auto_now_add=True, null=True)
    concluded_at = models.DateTimeField(null=True)
    closed_at = models.DateTimeField(null=True)
    history = models.TextField(null=True)

    def __str__(self):
        return self.name


class UserRoomBLackList(models.Model):
    """
    Users can be blacklisted from entering a room
    """
    room = models.ForeignKey(Room, models.CASCADE)
    user = models.ForeignKey(User, models.SET_NULL, null=True)

    def __str__(self):
        return "{} blacklisted from {}.".format(self.user.username, self.room.id)


class Comment(models.Model):
    """
    Comments made by users in a room.
    """
    id = models.UUIDField(primary_key=True, default=uuid4)
    room = models.ForeignKey(Room, models.CASCADE)
    user = models.ForeignKey(User, models.SET_NULL, null=True)

    timestamp = models.DateTimeField(auto_now_add=True)
    content = models.TextField()
    private = models.BooleanField(default=False)

    def __str__(self):
        return "{} at {}:{} in {}: {}".format(self.user.username, self.timestamp.hour, \
                                              self.timestamp.minute, self.room.name, \
                                              self.content[:20])


class UserRole(models.Model):
    """
    Default Django user model
    """
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name



class UserUnitRole(models.Model):
    """
    The role of a user in a unit.
    With roles, certain users can have permissions for particular actions in rooms.
    """
    user = models.ForeignKey(User, models.CASCADE)
    unit = models.ForeignKey('Unit', models.CASCADE)
    role = models.ForeignKey(UserRole, models.CASCADE)

    class Meta:
        unique_together = ('user', 'unit')

    def __str__(self):
        return "{} is {} in {}".format(self.user.username, self.role.name, self.unit.code)


class Unit(models.Model):
    """
    This should represent a unit of study at a university.
    Students will be enrolled in units, and the scheduler will create rooms for units.
    """
    id = models.UUIDField(primary_key=True, default=uuid4)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=8)
    lecturer = models.ForeignKey(User, models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    icon = models.CharField(max_length=255, default="pencil")

    def __str__(self):
        return "{}: {}".format(self.code, self.name)


class UserUnitEnrolment(models.Model):
    """
    The units a user is enrolled in.
    If a user is not enrolled in a class, they may not enter a room.
    A lecturer should be enrolled in their own class.
    """
    # TODO: Unique constraint on tuple (user,unit).
    unit = models.ForeignKey(Unit, models.CASCADE)
    user = models.ForeignKey(User, models.CASCADE)

    def __str__(self):
        return "{} takes {}".format(self.user.username, self.unit.code)


class ScheduledRoom(models.Model):
    """
    The schedule/timetable for a unit.
    Used by the system to create rooms dynamically according to the daily schedule.
    """
    day = models.PositiveIntegerField()
    unit = models.ForeignKey(Unit, models.CASCADE)
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self):
        return "{}: {}, [{} - {}]".format(self.unit.code, self.day, self.start_time, self.end_time)


import random

student_icons = [
    'university',
    'american-sign-language-interpreting',
    'automobile',
    'blind',
    'bicycle',
    'camera',
    'child',
    'cutlery',
    'user',
    'mortar-board',
    'signing',
    'trash'

]


# Signal for auth tokens to create a token on save
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_extras(sender, instance=None, created=False, **kwargs):
    if created:
        Profile.objects.create(user_id=instance.id, icon=random.choice(student_icons))
        Token.objects.create(user=instance)
