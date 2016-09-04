from django.contrib import admin

from .models import *

# Register your models here.
admin.site.register(Profile)
admin.site.register(Status)
admin.site.register(Room)
admin.site.register(Comment)
admin.site.register(Role)
admin.site.register(UserRoomRole)
admin.site.register(Unit)
admin.site.register(UserUnitEnrolment)
admin.site.register(ScheduledRoom)

