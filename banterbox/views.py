from functools import wraps

from django.http import HttpResponse, HttpRequest
from django.shortcuts import render
from django.template import loader
from random import random
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.request import Request
from banterbox.models import UserRole, UserUnitRole

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


class UserUnitEnrolmentViewSet(viewsets.ModelViewSet):
    queryset = UserUnitEnrolment.objects.all()
    serializer_class = UserUnitEnrolmentSerializer


class ScheduledRoomViewSet(viewsets.ModelViewSet):
    queryset = ScheduledRoom.objects.all()
    serializer_class = ScheduledRoomSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


# Custom API view/responses etc
@api_view(['GET'])
def current_user(request):
    profile = request.user.profile

    output = {
        'id'        : profile.id,
        'icon'      : profile.icon,
        'email'     : profile.user.email,
        'first_name': profile.user.first_name,
        'last_name' : profile.user.last_name,
        'username'  : profile.user.username,
    }

    return Response(output)


'''
include lecutrer object with name and email

'''


@api_view(['GET'])
def rooms(request):
    rooms = []
    for userEnrolement in UserUnitEnrolment.objects.filter(user_id=request.user.id):
        unit = Unit.objects.get(id=userEnrolement.unit_id)
        room = Room.objects.get(unit_id=unit.id)
        rooms.append({
            "id"        : room.id,
            "lecturer"  : {"email"   : unit.lecturer.email, "name": '{0} {1}'.format(unit.lecturer.first_name, unit.lecturer.last_name)},
            "created_at": room.created_at,
            "name"      : room.name,
            "code"      : unit.code,
            "icon"      : unit.icon,
            "status"    : room.status.name,
            # next_session: {day: , time: "14:00"},
        })
    return Response({'rooms':rooms})

'''
include lecutrer object with name and email

'''

# Custom API view/responses etc
@api_view(['GET'])
def get_comments(request):

    #check whether room id exists in the request, if not return 400 response
    if 'room_id' not in request.GET:
        #THere is a better way to do this
        return HttpResponse(400)

    #check if there is no timestamp parameter
    time_filter = False
    if 'timestamp' in request.GET:
        time_filter = True

    #a request will always include the room id
    requested_room = request.GET['room_id']

    #A list to store all of the comment objects
    queryset = []

    #if there was a time specified, get tiems within a range, else get all of the comments
    if time_filter:
        query_time = requested_room = request.GET['timestamp']
        queryset = Comment.objects.filter(room_id=requested_room, timestamp__gt=query_time)
    else:
        queryset = Comment.objects.filter(room_id=requested_room)


    #outer_dict is an object to hold the list, so it's jsonable
    outer_dict = {}
    response = []

    #loop throughh every comment object and serialise it
    for comment in queryset:
        output = {
            'id'        : comment.id,
            'timestamp' : comment.timestamp,
            'content'   : comment.content,
            'private'   : comment.private,
            'room_id'   : comment.room_id,
            'user_id'   : comment.user_id,
        }
        response.append(output)

    outer_dict['values'] = response

    return Response(outer_dict)

def worm(request):
    return render(request, 'worm.html')

def index(request):
    return render(request, 'index.html')
