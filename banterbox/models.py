from django.db import models
from django.contrib.auth.models import User
from uuid import uuid4

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    public_id = models.UUIDField(primary_key=True, default=uuid4)
    active = models.BooleanField()
    join_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class RoomStatus(models.Model):
    name = models.CharField(max_length=255, unique=True)
    
    def __str__(self):
        return self.name

class Room(models.Model):
    public_id = models.UUIDField(primary_key=True, default=uuid4)
    name = models.CharField(max_length=255)
    lecturer = models.ForeignKey(User)
    unit = models.ForeignKey('Unit', models.SET_NULL, null=True)
    status = models.ForeignKey(RoomStatus, models.SET_NULL, null=True)
    private = models.BooleanField(default=False)
    password_protected = models.BooleanField(default=False)
    password = models.CharField(max_length=255, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class Comment(models.Model):
    public_id = models.UUIDField(primary_key=True, default=uuid4)
    room = models.ForeignKey(Room, models.CASCADE)
    user = models.ForeignKey(User, models.SET_NULL, null=True)

    content = models.TextField()
    private = models.BooleanField(default=False)
    
    def __str__(self):
        return self.content[:40]

class UserRole(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name

class UserRoomRole(models.Model):
    user = models.ForeignKey(User, models.CASCADE)
    room = models.ForeignKey(Room, models.CASCADE)

    role = models.ForeignKey(UserRole, models.CASCADE)
    
    class Meta:
        unique_together = ('user', 'room')

    def __str__(self):
        return "{} is {} in {}".format(self.user.name, self.role.name, self.room.name)

class Unit(models.Model):
    public_id = models.UUIDField(primary_key=True, default=uuid4)
    name = models.CharField(max_length=255)
    lecturer = models.ForeignKey(User, models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class UserUnitEnrolment(models.Model):
    unit = models.ForeignKey(Unit, models.CASCADE)
    user = models.ForeignKey(User, models.CASCADE)

    def __str__(self):
        return "{} takes {}".format(self.unit.name, self.user.name)

class ScheduledRoom(models.Model):
    day = models.PositiveIntegerField()
    unit = models.ForeignKey(Unit, models.CASCADE)
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self):
        return "{}: {}, [{} - {}]".format(self.unit.name, self.day, self.start_time, self.end_time)

    
