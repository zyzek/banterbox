from django.db import models
from uuid import uuid4

class User(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4)
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
    id = models.UUIDField(primary_key=True, default=uuid4)
    name = models.TextField()
    lecturer_id = models.OneToOneField(User)
    class_id = models.OneToOneField('Class', models.SET_NULL, null=True)
    status_id = models.OneToOneField(Status, models.SET_NULL, null=True)
    private = models.BooleanField(default=False)
    password_protected = models.BooleanField(default=False)
    password = models.TextField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Comment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4)
    room_id = models.OneToOneField(Room, models.CASCADE)
    user_id = models.OneToOneField(User, models.SET_NULL, null=True)

    content = models.TextField()
    private = models.BooleanField(default=False)

class Roles(models.Model):
    name = models.TextField(unique=True)

class UserRoomRole(models.Model):
    user_id = models.OneToOneField(User, models.CASCADE)
    role_id = models.OneToOneField(Roles, models.CASCADE)
    room_id = models.OneToOneField(Room, models.CASCADE)

class Class(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4)
    name = models.TextField()
    lecturer_id = models.OneToOneField(User, models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class UserClassEnrolment(models.Model):
    class_id = models.OneToOneField(Class, models.CASCADE)
    user_id = models.OneToOneField(User, models.CASCADE)

class ScheduledRoom(models.Model):
    day = models.PositiveIntegerField()
    class_id = models.OneToOneField(Class, models.CASCADE)
    start_time = models.TimeField()
    end_time = models.TimeField()
    
