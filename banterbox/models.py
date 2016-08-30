from django.db import models
from uuidfield import UUIDField

class User(models.Model):
    id = UUIDField(auto=True, primary_key=True)
    name = models.TextField(unique=True)
    email = models.TextField(unique=True)
    active = models.BooleanField()
    password = models.TextField()
    join_date = models.DateTimeField(auto_now_add=True)

class PasswordReset(models.Model):
    email = models.TextField()
    token = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class Status(models.Model):
    name = models.TextField(unique=True)

class Room(models.Model):
    id = UUIDField(auto=True, primary_key=True)
    name = models.TextField()
    lecturer_id = models.OneToOneField(User.id)
    class_id = models.OneToOneField(Class.id, models.SET_NULL, null=True)
    status_id = models.OneToOneField(Status.name, models.SET_NULL, null=True)
    private = models.BooleanField(default=False)
    password_protected = models.BooleanField(default=False)
    password = models.TextField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Comment(models.Model):
    id = UUIDField(auto=True, primary_key=True)
    room_id = models.OneToOneField(Room.id, models.CASCADE)
    user_id = models.OneToOneField(User.id, models.SET_NULL, null=True)

    content = models.TextField()
    private = models.BooleanField(default=False)

class Roles(models.Model):
    name = models.TextField(unique=True)

class UserRoomRole:
    user_id = models.OneToOneField(User.id, models.CASCADE)
    role_id = models.OneToOneField(Roles.id, models.CASCADE)
    room_id = models.OneToOneField(Room.id, models.CASCADE)

class Class:
    id = UUIDField(auto=True, primary_key=True)
    name = models.TextField()
    lecturer_id = models.OneToOneField(User.id, models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class UserClassEnrolment:
    class_id = models.OneToOneField(Class.id, models.CASCADE)
    user_id = models.OneToOneField(User.id, models.CASCADE)

class ScheduledRoom:
    day = models.PositiveIntegerField()
    class_id = models.OneToOneField(Class.id, models.CASCADE)
    start_time = models.TimeField()
    end_time = models.TimeField()
    



