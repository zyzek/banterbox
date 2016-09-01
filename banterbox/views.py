from django.http import HttpResponse
from rest_framework import viewsets
from banterbox.serializers import *


class ClassViewSet(viewsets.ModelViewSet):
    queryset = Class.objects.all().order_by('-created_at')
    serializer_class = ClassSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-join_date')
    serializer_class = UserSerializer


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all().order_by('-created_at')
    serializer_class = RoomSerializer

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all().


def index(request):
    return HttpResponse("You're at the root dir!")
