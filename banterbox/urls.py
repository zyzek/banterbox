from django.conf.urls import url, include
from django.conf.urls import url
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
router.register(r'class', views.ClassViewSet)
router.register(r'user', views.UserViewSet)
router.register(r'room', views.RoomViewSet)
router.register(r'comment', views.CommentViewSet)

# Wire up our API using automatic URL routing.
# Additionally, we include login URLs for the browsable API.

urlpatterns = [
    url(r'^api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    url(r'^$', views.index, name='index'),
    url(r'^room$', views.room, name='room'),
    url(r'^time', views.current_datetime, name='date_time'),
    url(r'^', include(router.urls)),
]
