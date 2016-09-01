from django.db import models
from django.contrib.auth.models import User
from uuid import uuid4

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.Cascade)
    public_id = models.UUIDField(primary_key=True, default=uuid4)
    active = models.BooleanField()
    join_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Status(models.Model):
    name = models.TextField(unique=True)
    
    def __str__(self):
        return self.name

class Room(models.Model):
    public_id = models.UUIDField(primary_key=True, default=uuid4)
    name = models.TextField()
    lecturer = models.OneToOneField(User)
    room_class = models.OneToOneField('Class', models.SET_NULL, null=True)
    status = models.OneToOneField(Status, models.SET_NULL, null=True)
    private = models.BooleanField(default=False)
    password_protected = models.BooleanField(default=False)
    password = models.TextField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class Comment(models.Model):
    public_id = models.UUIDField(primary_key=True, default=uuid4)
    room = models.OneToOneField(Room, models.CASCADE)
    user = models.OneToOneField(User, models.SET_NULL, null=True)

    content = models.TextField()
    private = models.BooleanField(default=False)
    
    def __str__(self):
        return self.content[:40]

class Role(models.Model):
    name = models.TextField(unique=True)

    def __str__(self):
        return self.name

class UserRoomRole(models.Model):
    user = models.OneToOneField(User, models.CASCADE)
    role = models.OneToOneField(Role, models.CASCADE)
    room = models.OneToOneField(Room, models.CASCADE)
    
    def __str__(self):
        return "{} is {} in {}".format(self.user.name, self.role.name, self.room.name)

class Class(models.Model):
    public_id = models.UUIDField(primary_key=True, default=uuid4)
    name = models.TextField()
    lecturer = models.OneToOneField(User, models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class UserClassEnrolment(models.Model):
    enroled_class = models.OneToOneField(Class, models.CASCADE)
    enroled_user = models.OneToOneField(User, models.CASCADE)

    def __str__(self):
        return "{} takes {}".format(self.enroled_class.name, self.enroled_user.name)

class ScheduledRoom(models.Model):
    day = models.PositiveIntegerField()
    room_class = models.OneToOneField(Class, models.CASCADE)
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self):
        return "{}: {}, [{} - {}]".format(self.room_class.name, self.day, self.start_time, self.end_time)

    
