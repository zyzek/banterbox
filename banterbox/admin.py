from django.contrib import admin

from .models import *

# Register your models here.
admin.site.register(Profile)
admin.site.register(RoomStatus)
admin.site.register(Room)
admin.site.register(Comment)
admin.site.register(UserRole)
admin.site.register(UserUnitRole)
admin.site.register(Unit)
admin.site.register(UserUnitEnrolment)
admin.site.register(ScheduledRoom)

