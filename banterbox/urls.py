from rest_framework.authtoken import views as auth_views
from django.conf.urls import url, include
from rest_framework import routers
from . import views

room_pattern = "(?P<room_id>[0-9a-f-]{36})"
router = routers.DefaultRouter()

urlpatterns = [

    url(r'^api/auth/?$', auth_views.obtain_auth_token),
    url(r'^api/user/?$', views.current_user),
    url(r'^api/rooms/?$', views.get_rooms),

    url(r'^api/room/' + room_pattern + r'/pause/?$', views.pause_room),  # pauses the room for 5 minutes
    url(r'^api/room/' + room_pattern + r'/comment/?$', views.comment),
    url(r'^api/room/' + room_pattern + r'/update/?$', views.get_update),
    url(r'^api/room/' + room_pattern + r'/blacklist/?$', views.blacklist),
    url(r'^api/room/' + room_pattern + r'/settings/?$', views.room_settings),
    url(r'^api/room/' + room_pattern + r'/run/?$', views.run),
    url(r'^api/room/' + room_pattern, views.enter_room),

    url(r'^$', views.index, name='index'),
    url(r'^api/', include(router.urls)),
    url(r'^docs/', include('rest_framework_docs.urls')),
    url(r'^worm', views.worm),
]
