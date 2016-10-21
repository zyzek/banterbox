from django.http import HttpResponse, HttpRequest
from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from banterbox.serializers import *
from django.db import IntegrityError
from django.utils import timezone
from datetime import timedelta, datetime
import calendar
from .icons import icons

'''
---------------------------------------------------- /api/room/blacklist ------------------------------------------
'''

#TODO : Make this actually work
@api_view(['GET', 'POST'])
def blacklist(request, room_id):
    # get the room 
    try:
        room = Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return Response({"message": "room does not exist."}, status=404)
    # perform GET or POST request
    if request.method == "GET":
        return blacklist_GET(request, room)
    elif request.method == "POST":
        return blacklist_POST(request, room)

#TODO : Make this actually work
def blacklist_GET(request, room):
    return {
        'blacklisted_users': 'TBI'}  # return {'blacklisted_users' : [User.objects.get(id = UserRoomBlacklist.user_id).id for UserRoomBlacklist in UserRoomBlacklist.objects.filter(room_id=room.id)]}

#TODO : Make this actually work
def blacklist_POST(request, room):
    # check if admin
    user = request.user
    if user.is_staff != 1:
        return Response({"message": "permission denied."}, status=403)

        # get the userids
    try:
        user_ids = request.data["user_ids"].split(",")
    except KeyError:
        return Response({"message": "missing argument <user_ids>."}, status=400)

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




@api_view(['GET','PUT'])
def room_settings(request, room_id):
    if request.method == 'GET':
        return get_room_settings(request,room_id)
    elif request.method == 'PUT':
        return update_room_settings(request, room_id)


@api_view(['GET'])
def get_room_settings(request, room_id):
    """
    Collects data for a room to populate the settings form.
    :param request:
    :param room_id:
    :return:
    """
    user = request.user

    if user.is_staff != 1:
        return Response({"message": "permission denied."}, status=403)

    # get the room
    try:
        room = Room.objects.get(id=room_id)

    except Room.DoesNotExist:
        return Response({"message": "room does not exist."}, status=404)

    try:
        blacklist_ids = [u.user_id for u in UserRoomBLackList.objects.filter(room_id=room.id)]
    except UserRoomBLackList.DoesNotExist:
        blacklist_ids = []

    enrolled = User.objects.filter(userunitenrolment__unit_id=room.unit_id)
    enrolled_users = []

    for e in enrolled:
        enrolled_users.append({
            'blacklisted': e.id in blacklist_ids,
            'email'      : e.email,
            'username'   : e.username,
            'id'    : e.id
        })

    result = {
        'room_name'         : room.name,
        'visibility'        : ("private" if room.private else "public"),
        'password_protected': room.password_protected,
        'password'          : room.password,
        'icon'              : room.unit.icon,
        'unit_name'         : room.unit.name,
        'enrolled'          : enrolled_users,
        'icons'             : icons
    }

    return Response(result)


@api_view(['PUT'])
def update_room_settings(request, room_id):
    """
    Updates a room with the settings provided.
    :param request:
    :param room_id:
    :return:
    """
    try:
        room = Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return Response({'message' : 'Room does not exist'}, status=404)

    # Update and save room properties
    unit = room.unit
    unit.name = request.data.get('unit_name')
    unit.icon = request.data.get('unit_icon','graduation-cap')
    room.password_protected = request.data.get('password_protected', False)
    room.password = request.data.get('password', None)

    unit.save()
    room.save()


    blacklist = User.objects.filter(id__in=request.data.get('blacklist',[]))
    whitelist = User.objects.filter(id__in=request.data.get('whitelist',[]))


    # Remove people off the blacklist matching the whitelist IDs
    UserRoomBLackList.objects.filter(user_id__in=whitelist, room_id=room_id).delete()

    # Add people to blacklist if they are not already there
    for a in blacklist:
        UserRoomBLackList.objects.get_or_create(room_id=room_id,user=a)



    return Response({'message' : 'OK'})


'''
    ----------------------------------------- /api/user -----------------------------------------------------------
'''


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


# temp endpoint for testing
@api_view(['POST'])
def run(request, room_id):
    user = request.user
    try:
        room = Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return Response({"message": "room does not exist."}, status=404)
    status = RoomStatus.objects.get(name="running")
    room.status = status
    room.save()
    return Response({"message": "Success, room running."})


@api_view(['GET'])
def get_update(request, room_id):
    user = request.user
    try:
        room = Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return Response({"message": "room does not exist."}, status=404)

    next_session = ScheduledRoom.objects.filter(unit_id=room.unit_id).order_by("start_timestamp")[0]
    room = updateCheckRoomStatus(room, next_session)
    result = {
        "room_status": room.status.name
    }
    return Response(result)


@api_view(['POST'])
def pause_room(request, room_id):
    user = request.user
    if user.is_staff != 1:
        return Response({"error": "permission denied."}, status=403)
    try:
        room = Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return Response({"message": "room does not exist."}, status=400)
    if room.status != "paused" and room.pause_date_time is None:
        # pause the room
        room.pause_date_time = timezone.now()
        status = RoomStatus.objects.get(name="paused")
        room.status = status
        room.save()
        return Response({"success": "room paused, will unpause at " + str(timezone.now() + timedelta(minutes=5)) + "."})
    elif room.status == "paused":
        return Response({"message": "room has already been paused."}, status=400)
    else:
        return Response({"message": "room has already been paused."}, status=400)


def get_next_session(unit):
    """
    Gives back the next session's day and time for the unit.
    # TODO [Stretch Goal]: Handle the "multiple rooms on the same day" issue.
    """

    today = datetime.today().weekday()
    scheduled_rooms = ScheduledRoom.objects.filter(unit_id=unit.id).order_by('day')

    # There are three cases:
    #    1. The current day is the day of the next one schedule
    #    2. The day of the next one is in the future
    #    3. The day of the next one is in the past.

    next_session = next((x for x in scheduled_rooms if x.day == today), None) \
                   or next((x for x in scheduled_rooms if x.day > today), None) \
                   or next((x for x in scheduled_rooms if x.day < today), None)


    if next_session is None:
        return {'time': None, 'day': None}

    return {'time': next_session.start_time.strftime('%H:%M'), 'day': calendar.day_name[next_session.day]}


@api_view(['GET'])
def get_units(request):
    try:
        user = request.user
    except:
        return Response({'message': "no user."}, status=400)

    out_units = []
    for user_enrolment in UserUnitEnrolment.objects.filter(user_id=user.id):
        unit = Unit.objects.get(id=user_enrolment.unit_id)
        room = unit.room_set.first()

        if room and room.status:
            room_status = room.status.name
            room_id = room.id
        else:
            room_id = '---'
            room_status = 'unknown'


        result = {
            "id"          : room_id,
            "lecturer"    : {"email": unit.lecturer.email,
                             "name" : '{0} {1}'.format(unit.lecturer.first_name, unit.lecturer.last_name)},
            "code"        : unit.code,
            "icon"        : unit.icon,
            "status"      : room_status,
            "next_session": get_next_session(unit)
        }


        out_units.append(result)
    return Response({'units': out_units})


'''
    ----------------------------------------- COMMENTS -----------------------------------------------------------
'''


@api_view(['GET', 'POST'])
def comment(request, room_id):
    try:
        room = Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return Response({"error": "room does not exist."}, status=400)

    if request.method == "POST":
        return comment_post(request, room)
    elif request.method == "GET":
        return comment_get(request, room)


def comment_post(request, room):
    try:
        content = request.data['content']
    except:
        return Response({"message": "missing argument <content>."}, status=400)

    user = request.user
    rooms = []
    for user_enrolment in UserUnitEnrolment.objects.filter(user_id=user.id):
        if room == Room.objects.get(unit_id=user_enrolment.unit_id):

            if room.status.name != "running":
                return Response({"message": "room is not running."}, status=400)

            comment = Comment()
            comment.room = room
            comment.user = user
            comment.content = content
            comment.save()
            return Response({"message": "comment posted."})
    return Response({"message": "You're not enrolled in this room."}, status=400);


def comment_get(request, room):
    # get timestamp
    try:
        timestamp = request.GET['timestamp']
    except KeyError:
        timestamp = None

    # get query set
    try:
        queryset = Comment.objects.filter(room_id=room.id)  # , timestamp__gt = timestamp)
    except:
        # server error
        return Response({"message": "Could not find room."}, status=500)

    result = {'values': [{'id'       : comment.id,
                          'timestamp': comment.timestamp,
                          'content'  : comment.content,
                          'private'  : comment.private,
                          'room_id'  : comment.room_id,
                          'user_id'  : comment.user_id,
                          } for comment in queryset]}
    return Response(result)


def worm(request):
    return render(request, 'worm.html')


def index(request):
    return render(request, 'index.html')


@api_view(['GET'])
def enter_unit(request, unit_code):
    """
    Collects initial data for the display of a unit.
    """
    # First, check the existence of the room



    # TODO : Implement this process
    #
    # If there is a room in the querystring:
    # - attempt to find a unit_code <--> room_id match
    # - If one is found,
    #   - collect data and return
    # - else
    #   - return a 404
    #
    # Otherwise:
    # Try to get current running room.
    # If one does not exist, return a list of all prior rooms in history
    # If that doesn't exist, there's either no data for it in the past (unlikely), or it's fresh (likely)
    # Either way, return a message back with the right stuff





    room_id = request.GET.get('room_id',None)

    if room_id is not None:
        try:
            room = Room.objects.get(unit__code=unit_code, id=room_id)
        except Room.DoesNotExist:
            room = None # Todo : return list of prior rooms. See above
            return Response({'message' : 'Room not found.'},status=404)

    else:
        try:
            room = Room.objects.get(unit__code=unit_code, status__name='running')
        except Room.DoesNotExist:
            room = None # Todo : return list of prior rooms. See above
            return Response({'message' : 'No running rooms found.'},status=404)





    try:
        unit = Unit.objects.get(code=unit_code)
    except Unit.DoesNotExist:
        return Response({'message': 'The unit you are trying to access does not exist'}, status=404)


    # Collect a correct room
    room = unit.room_set.first()

    # TODO: Turn this into a decorator
    # Check authorization, if they're not allowed to enter we let them know they're unauthorized
    room_blacklist = room.userroomblacklist_set.all()
    for entry in room_blacklist:
        if entry.user_id == request.user.id:
            return Response({'message': 'Unauthorized'}, status=403)

    try:
        role = UserUnitRole.objects.get(unit_id=room.unit_id, user_id=request.user.id).role.name
    except UserUnitRole.DoesNotExist:
        role = None

    # Then , we will need the following things to start them off in a room:
    #   1. The Room's unit info : name,code

    return Response({
        'unit_code': unit.code,
        'unit_name': unit.name,
        'unit_icon': unit.icon,
        'role'     : role,
        'room_id' : room.id,
        'room_status' : room.status.name
    })
