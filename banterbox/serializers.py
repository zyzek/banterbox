from rest_framework import serializers
from banterbox.models import *

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('email', 'username', 'first_name','last_name','is_active','is_staff')


class RoomStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomStatus
        fields = ('id', 'name',)


class RoomSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Room
        fields = ('url', 'id', 'name', 'lecturer', 'unit', 'status', 'private', 'password_protected', 'created_at',
                  'commenced_at', 'concluded_at', 'closed_at')


class CommentSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Comment
        fields = ('id', 'room', 'user', 'timestamp', 'content', 'private')


class UserRoleSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = UserRole
        fields = ('id', 'name',)


class UserUnitRoleSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = UserUnitRole
        fields = ('id', 'user', 'unit', 'role')


class UnitSerializer(serializers.HyperlinkedModelSerializer):
    lecturer = UserSerializer()
    class Meta:
        model = Unit
        fields = ('url', 'id', 'name', 'code', 'lecturer', 'created_at', 'icon')


class UserUnitEnrolmentSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    unit = UnitSerializer()

    class Meta:
        model = UserUnitEnrolment
        fields = ('id','unit', 'user')


class ScheduledRoomSerializer(serializers.HyperlinkedModelSerializer):
    unit = UnitSerializer()
    class Meta:
        model = ScheduledRoom
        fields = ('id', 'day', 'start_time', 'end_time','unit')


class ProfileSerializer(serializers.HyperlinkedModelSerializer):
    # Foreign key to user profile done like so
    user = UserSerializer()

    class Meta:
        model = Profile
        fields = ('url', 'id','icon','email_notifications','user')
