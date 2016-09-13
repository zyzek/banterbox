import datetime
from django.http import HttpResponse
from django.shortcuts import render
from django.template import loader
from random import random
from rest_framework import viewsets
from banterbox.serializers import *


class ClassViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all().order_by('-created_at')
    serializer_class = ClassSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-join_date')
    serializer_class = UserSerializer


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all().order_by('-created_at')
    serializer_class = RoomSerializer


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = ClassSerializer


def index(request):


    context = {
        'g': random()
    }

    return render(request, 'index.html', context)

def room(request):
    return render(request, 'room.html')

def current_datetime(request):
    now = datetime.datetime.now()
    html = "<html><body>It is now %s.</body></html>" % now
    return HttpResponse(html)
