from django.conf.urls import url, include
from django.conf.urls import url
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
router.register(r'cl', views.ClassViewSet)
router.register(r'profile', views.ProfileViewSet)
router.register(r'roomstatus', views.RoomStatusViewSet)
router.register(r'room', views.RoomViewSet)
router.register(r'comment', views.CommentViewSet)
router.register(r'userrole', views.UserRoleViewSet)
router.register(r'userunitrole', views.UserUnitRoleViewSet)
router.register(r'unit', views.UnitViewSet)
router.register(r'user', views.UserViewSet)





# Wire up our API using automatic URL routing.
# Additionally, we include login URLs for the browsable API.

urlpatterns = [
    url(r'^', include(router.urls)),
    url(r'^api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    url(r'^$', views.index, name='index'),
    url(r'^time', views.current_datetime, name='date_time')
]
