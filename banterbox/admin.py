from django.contrib import admin

from .models import *

# Register your models here.
admin.site.register(User)
admin.site.register(PasswordReset)
admin.site.register(Status)
admin.site.register(Room)
admin.site.register(Comment)
admin.site.register(Role)
admin.site.register(UserRoomRole)
admin.site.register(Class)
admin.site.register(UserClassEnrolment)
admin.site.register(ScheduledRoom)

