from rest_framework.authtoken import views as auth_views
from django.conf.urls import url, include
from rest_framework import routers
from . import views

unit_pattern = "(?P<unit_code>[a-zA-Z]{4}[0-9]{4})"
router = routers.DefaultRouter()

urlpatterns = [

    url(r'^api/auth/?$', auth_views.obtain_auth_token),
    url(r'^api/user/?$', views.current_user),
    url(r'^api/units/?$', views.get_units),

    url(r'^api/unit/' + unit_pattern + r'/pause/?$', views.pause_room),  # pauses the room for 5 minutes
    url(r'^api/unit/' + unit_pattern + r'/comment/?$', views.comment),
    url(r'^api/unit/' + unit_pattern + r'/update/?$', views.get_update),
    url(r'^api/unit/' + unit_pattern + r'/blacklist/?$', views.blacklist),
    url(r'^api/unit/' + unit_pattern + r'/settings/?$', views.room_settings),
    url(r'^api/unit/' + unit_pattern + r'/run/?$', views.run),
    url(r'^api/unit/' + unit_pattern, views.enter_room),

    url(r'^$', views.index, name='index'),
    url(r'^api/', include(router.urls)),
    url(r'^docs/', include('rest_framework_docs.urls')),
    url(r'^worm', views.worm),
]
