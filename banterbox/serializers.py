from django.contrib.auth.models import User, Group
from rest_framework import serializers
from banterbox.models import *


class ProfileSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Profile
        fields = ('id', 'user', 'icon', 'email_notifications')


class RoomStatusSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = RoomStatus
        fields = ('name')


class RoomSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Room
        fields = ('id', 'name', 'lecturer', 'unit', 'status', 'private', 'password_protected', 'password', 'created_at', 'commenced_at', 'concluded_at', 'closed_at')


class CommentSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Comment
        fields = ('id', 'room', 'user', 'timestamp', 'content', 'private')


class UserRoleSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = UserRole
        fields = ('name')


class UserUnitRoleSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = UserUnitRole
        fields = ('user', 'unit', 'role')


class UnitSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Unit
        fields = ('id', 'name', 'code', 'lecturer', 'created_at', 'icon')

class UserUnitEnrolement(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = UserUnitEnrolement
        fields = ('unit', 'user')


class ProfileSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ('public_id', 'name', 'email', 'active', 'active', 'password', 'join_date')


class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ('public_id', 'name', 'email', 'active', 'active', 'password', 'join_date')



