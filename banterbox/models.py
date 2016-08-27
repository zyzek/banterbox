from django.db import models

class User(models.Model):
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
    public_id = models.TextField(unique=True)
    name = models.TextField()
    owner_id = models.OneToOneField(User.id, models.SET_NULL, null=True)
    status_id = models.OneToOneField(Status.name, models.SET_NULL, null=True)
    private = models.BooleanField(default=False)
    password_protected = models.BooleanField(default=False)
    password = models.TextField(null=True)

class Comment(models.Model):
    room_id = models.OneToOneField(Room.id, models.CASCADE)
    user_id = models.OneToOneField(User.id, models.SET_NULL, null=True)
    public_id = models.TextField(unique=True)

    content = models.TextField()
    private = models.BooleanField(default=False)

class Roles(models.Model):
    name = models.TextField(unique=True)

class UserRoomRole:
    user_id = models.OneToOneField(User.id, models.CASCADE)
    role_id = models.OneToOneField(Roles.id, models.CASCADE)
    room_id = models.OneToOneField(Room.id, models.CASCADE)
