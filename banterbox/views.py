from functools import wraps

from django.http import HttpResponse, HttpRequest
from django.shortcuts import render
from django.template import loader
from random import random
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.request import Request
from banterbox.models import *
from banterbox.serializers import *
from django.db import IntegrityError
from django.utils import timezone
from datetime import timedelta
'''
---------------------------------------------------- /api/room/blacklist ------------------------------------------
'''
@api_view(['GET', 'POST'])
def blacklist(request, room_id):
    # get the room 
    try:
        room = Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return Response({"error":"room does not exist."})
    # perform GET or POST request
    if request.method == "GET":
        return blacklist_GET(request, room)
    elif request.method == "POST":
        return blacklist_POST(request, room)

def blacklist_GET(request, room):
    return {'blacklisted_users' : 'TBI'}#return {'blacklisted_users' : [User.objects.get(id = UserRoomBlacklist.user_id).id for UserRoomBlacklist in UserRoomBlacklist.objects.filter(room_id=room.id)]}

def blacklist_POST(request, room):
     #check if admin
    if user.is_staff != 1:
        return Response({"error":"permission denied."})

    #get the userids
    try:
        user_ids = request.data["user_ids"].split(",")
    except KeyError:
        return Response({"error":"missing argument <user_ids>."})

    for user_id in user_ids:
        user = User.objects.get(id=user_id)
        urb = UserRoomBlacklist()
        urb.user = user
        urb.room = room
        try:
            urb.save()
        except IntegrityError:
            continue
    return HttpResponse(200)

#blacklist a user/users from room
@api_view(['POST'])
def blacklist_users(request, room_id):
    user = request.user


# Custom API view/responses etc
@api_view(['GET'])
def room_settings(request, room_id):
    user = request.user
    print("room id<"+room_id+">.")
    print(Room.objects.get(id=room_id))

    if user.is_staff != 1:
        return Response({"error":"permission denied."})

    #get the room
    try:
        room = Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return Response({"error":"room does not exist."})

    result = {'name': room.name,
              'visibility' : ("private" if room.private else "public"),
              'password_protected' : room.password_protected,
              'password' : room.password,
              'icon' : room.unit.icon,
              'description' : room.unit.description,  
              'blacklisted_users' : [User.objects.get(id = UserRoomBlacklist.user_id).id for UserRoomBlacklist in UserRoomBlacklist.objects.filter(room_id=room.id)],
              }

    return Response(result)
'''
    ----------------------------------------- /api/current -----------------------------------------------------------
'''

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
    ----------------------------------------- /api/room/<room id>/run -----------------------------------------------------------
'''
#temp endpoint for testing
@api_view(['POST'])
def run(request, room_id):
    user = request.user
    try:
        room = Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return Response({"error":"room does not exist."})
    status = RoomStatus.objects.get(name="running")
    room.status = status
    room.save()
    return Response({"success" : "room running."})


@api_view(['GET'])
def get_update(request, room_id):
    user = request.user
    try:
        room = Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return Response({"error":"room does not exist."})
    
    next_session = ScheduledRoom.objects.filter(unit_id = room.unit_id).order_by("start_timestamp")[0]
    room = updateCheckRoomStatus(room, next_session)
    result = {
        "room_status" : room.status.name
    }
    return Response(result)


@api_view(['POST'])
def pause_room(request, room_id):
    user = request.user
    if user.is_staff != 1:
        return Response({"error":"permission denied."})
    try:
        room = Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return Response({"error":"room does not exist."})
    if room.status != "paused" and room.pause_date_time == None:
        #pause the room
        room.pause_date_time = timezone.now()
        status = RoomStatus.objects.get(name="paused")
        room.status = status
        room.save()
        return Response({"success" : "room paused, will unpause at "+str(timezone.now()+timedelta(minutes = 5))+"." })
    elif room.status == "paused":
        return Response({"error" : "room already paused."})
    else:
        return Response({"error" : "room has already been paused."})

@api_view(['GET'])
def get_rooms(request):
    #get the rooms associated to this user
    try:
        user = request.user
    except:
        return response({'rooms':'[]'})

    rooms = []
    for userEnrolement in UserUnitEnrolment.objects.filter(user_id = user.id):

        unit = Unit.objects.get(id=userEnrolement.unit_id)
        room = Room.objects.get(unit_id=unit.id)



        #next_session = ScheduledRoom.objects.filter(unit_id = unit.id, day ).order_by("day")[0].orderby("")
        #room = updateCheckRoomStatus(room, next_session)
        result = {
            "id"           : room.id,
            "lecturer"     : {"email"   : unit.lecturer.email, "name": '{0} {1}'.format(unit.lecturer.first_name, unit.lecturer.last_name)},
            "created_at"   : room.created_at,
            "name"         : room.name,
            "code"         : unit.code,
            "icon"         : unit.icon,
            "status"       : room.status.name,
            "next_session" : 'TO BE IMPLEMENTED - Im Hungry... Later'#next_session.start_timestamp,
        }

        # if room.status.name == "running":
        #     result["time_remaining"] = next_session.end_timestamp - timezone.now()
        # elif room.status.name == "commencing":
        #     result["time_until_commencing"] = next_session.start_timestamp - timezone.now()

        rooms.append(result)
    return Response({'rooms':rooms})
'''
    ----------------------------------------- COMMENTS -----------------------------------------------------------
'''
@api_view(['GET','POST'])
def comment(request, room_id):
    try:
        room = Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return Response({"error":"room does not exist."})

    if request.method == "POST":
        return comment_post(request, room)
    elif request.method == "GET":
        return comment_get(request, room)

def comment_post(request, room):
    try:
        content = request.data['content']
    except:
        return Response({"error":"missing argument <content>."})

    user = request.user
    rooms = []
    for userEnrolement in UserUnitEnrolment.objects.filter(user_id = user.id):
        if room == Room.objects.get(unit_id=userEnrolement.unit_id):

            if room.status.name != "running":
                return Response({"error" : "room is not running."})

            comment = Comment()
            comment.room = room
            comment.user = user
            comment.content = content
            comment.save()
            return Response({"success":"comment posted."})
    return Response({"error":"unable to post comment."})


def comment_get(request, room):
    #get timestamp
    try:
        timestamp = request.GET['timestamp']
    except KeyError:
        timestamp = None

    #get query set
    try:
        queryset = Comment.objects.filter(room_id = room.id)#, timestamp__gt = timestamp)
    except:
        #server error
        return HttpResponse(500)

    result = {'values' : [{'id'        : comment.id,
                           'timestamp' : comment.timestamp,
                           'content'   : comment.content,
                           'private'   : comment.private,
                           'room_id'   : comment.room_id,
                           'user_id'   : comment.user_id,
                           } for comment in queryset]}
    return Response( result )


def index(request):
    return render(request, 'index.html')


# def updateCheckRoomStatus(room, next_session):
#     #check the room status, update if required
    
#     roomCommenced = timezone.now() > next_session.start_timestamp
#     roomClosed = timezone.now() > next_session.end_timestamp

#     if roomClosed:
#         _name = "closed"
#     elif roomCommenced:
#         _name = "running"
#     else:
#         _name = "commencing"
#     status = RoomStatus.objects.get(name=_name)
#     room.status = status
#     room.save()
#     return room


