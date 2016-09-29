from rest_framework.authtoken import views as auth_views
from django.conf.urls import url, include
from rest_framework import routers
from . import views



router = routers.DefaultRouter()
#router.register(r'profile', views.ProfileViewSet)
#router.register(r'room-status', views.RoomStatusViewSet)
#router.register(r'rooms', views.RoomViewSet)
#router.register(r'comment', views.CommentViewSet)
#router.register(r'user', views.UserViewSet)
#router.register(r'user-role', views.UserRoleViewSet)
#router.register(r'user-unit-role', views.UserUnitRoleViewSet)
#router.register(r'unit', views.UnitViewSet)
#router.register(r'user-unit-enrolment', views.UserUnitEnrolmentViewSet)
#router.register(r'scheduled-room', views.ScheduledRoomViewSet)


# Wire up our API using automatic URL routing.
# Additionally, we include login URLs for the browsable API.

urlpatterns = [
    url(r'^api/auth/',                      		auth_views.obtain_auth_token),
    url(r'^api/user/current',               		views.current_user),
    url(r'^api/user/rooms',                 		views.get_rooms),

    url(r'^api/room/(?P<room_id>[0-9]+)/comments',     views.get_comments),
    url(r'^api/room/(?P<room_id>[0-9]+)/blacklist',    views.blacklist_users),
    url(r'^api/room/(?P<room_id>[0-9]+)/settings',     views.room_settings),

    url(r'^api/',                           		include(router.urls)),
    url(r'^$',                              		views.index, name='index'),
    url(r'^docs/',                          		include('rest_framework_docs.urls')),
]