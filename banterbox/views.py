from django.http import HttpResponse
from django.shortcuts import render
from django.template import loader
from random import random
from rest_framework import viewsets
from banterbox.serializers import *


class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer

class RoomStatusViewSet(viewsets.ModelViewSet):
    queryset = RoomStatus.objects.all()
    serializer_class = RoomStatusSerializer

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all().order_by('-created_at')
    serializer_class = RoomSerializer

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer

class UserRoleViewSet(viewsets.ModelViewSet):
    queryset = UserRole.objects.all()
    serializer_class = UserRoleSerializer

class UserUnitRoleViewSet(viewsets.ModelViewSet):
    queryset = UserUnitRole.objects.all()
    serializer_class = UserUnitRoleSerializer

class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all().order_by('-created_at')
    serializer_class = UnitSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-join_date')
    serializer_class = UserSerializer




def index(request):


    context = {
        'g': random()
    }

    return render(request, 'index.html', context)


def current_datetime(request):
    now = datetime.datetime.now()
    html = "<html><body>It is now %s.</body></html>" % now
    return HttpResponse(html)
