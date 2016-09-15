from django.conf.urls import url, include
from django.conf.urls import url
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
router.register(r'profile', views.ProfileViewSet)
router.register(r'room-status', views.RoomStatusViewSet)
router.register(r'room', views.RoomViewSet)
router.register(r'comment', views.CommentViewSet)
router.register(r'user', views.UserViewSet)
router.register(r'user-role', views.UserRoleViewSet)
router.register(r'user-unit-role', views.UserUnitRoleViewSet)
router.register(r'unit', views.UnitViewSet)
router.register(r'user-unit-enrolment', views.UserUnitEnrolmentViewSet)
router.register(r'scheduled-room', views.ScheduledRoomViewSet)





# Wire up our API using automatic URL routing.
# Additionally, we include login URLs for the browsable API.

urlpatterns = [
    url(r'^', include(router.urls)),
    # url(r'^api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    url(r'^$', views.index, name='index'),
]
