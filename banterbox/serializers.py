from django.contrib.auth.models import User, Group
from rest_framework import serializers
from banterbox.models import *



class ClassSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Unit
        fields = ('public_id', 'name', 'lecturer', 'created_at')


class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ('public_id', 'name', 'email', 'active', 'active', 'password', 'join_date')\


class RoomSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Room
        field = ('public_id', 'name', 'lecturer', 'room_class', 'status', 'private', 'password_protected', 'password', 'created_at')


class CommentSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Comment
        field = ('public_id', 'room', 'user', 'content', 'is_private')
