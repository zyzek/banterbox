from django.db import models
from django.contrib.auth.models import User
from uuid import uuid4

'''
    Profile Model
    description: TODO
'''
class Profile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4)
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    icon = models.CharField(max_length=255, default="user")
    email_notifications = models.BooleanField(default=False)

    def __str__(self):
        return self.user.username

'''
    Room Status 
    description: enumerates on ("commencing", "running", "paused", "concluding", "closed")
'''
class RoomStatus(models.Model):
    name = models.CharField(max_length=255, unique=True)
    
    def __str__(self):
        return self.name

'''
    Room model
    description: TODO
'''
class Room(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4)
    name = models.CharField(max_length=255)
    lecturer = models.ForeignKey(User)
    unit = models.ForeignKey('Unit', models.SET_NULL, null=True)
    status = models.ForeignKey(RoomStatus, models.SET_NULL, null=True)
    private = models.BooleanField(default=False)
    password_protected = models.BooleanField(default=False)
    password = models.CharField(max_length=255, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    commenced_at = models.DateTimeField(auto_now_add=True)
    concluded_at = models.DateTimeField(null=True)
    closed_at = models.DateTimeField(null=True)
    
    def __str__(self):
        return self.name

'''
    Comment model
    description: TODO
'''
class Comment(models.Model):
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

'''
    UserRole model
    description: TODO
'''
class UserRole(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name

'''
    User Unit model
    description: TODO
'''
class UserUnitRole(models.Model):
    user = models.ForeignKey(User, models.CASCADE)
    unit = models.ForeignKey('Unit', models.CASCADE)
    role = models.ForeignKey(UserRole, models.CASCADE)
    
    class Meta:
        unique_together = ('user', 'unit')

    def __str__(self):
        return "{} is {} in {}".format(self.user.username, self.role.name, self.unit.code)

'''
    Unit model
    description: TODO
'''
class Unit(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=8)
    lecturer = models.ForeignKey(User, models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    icon = models.CharField(max_length=255, default="pencil")
    
    def __str__(self):
        return "{}: {}".format(self.code, self.name)

'''
    User Unit Enrolement model
    description: TODO
'''
class UserUnitEnrolment(models.Model):
    unit = models.ForeignKey(Unit, models.CASCADE)
    user = models.ForeignKey(User, models.CASCADE)

    def __str__(self):
        return "{} takes {}".format(self.user.username, self.unit.code)

'''
    Scheduled Room model
    description: TODO
'''
class ScheduledRoom(models.Model):
    day = models.PositiveIntegerField()
    unit = models.ForeignKey(Unit, models.CASCADE)
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self):
        return "{}: {}, [{} - {}]".format(self.unit.code, self.day, self.start_time, self.end_time)

