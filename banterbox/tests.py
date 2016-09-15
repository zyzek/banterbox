'''
	Django Rest Framework Model Testing 
'''
from myproject.apps.core.models import Account
from django.core.urlresolvers import reverse
from rest_framework.test import APITestCase
from rest_framework import status

'''
	Profile Model Tests
'''
class ProfileModelTests(APITestCase):

    def test_create_account(self):
        #TODO - Set Correct URL
        url = reverse('account-list')

        #set user data
        data = {'user': {'username' : 'Alex'}, 'icon' : 'iconString', 'email_notifications' : 'True'}
        response = self.client.post(url, data, format='json')

        #check responce code
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        #check object count
        self.assertEqual(Account.objects.count(), 1)

        #check attributes
        self.assertEqual(Account.objects.get().user, 'Alex')
        self.assertEqual(Account.objects.get().icon, 'iconString')
        self.assertEqual(Account.objects.get().email_notifications, 'True')
    

'''
    Room status Model Tests
'''
class RoomStatusModelTests(APITestCase):
    def __init__():
        pass
    #TESTS GO HERE

'''
    Room Model Tests
'''
class RoomModelTests(APITestCase):
    def __init__():
        pass
    #TESTS GO HERE

'''
    Comment Model Tests
'''
class CommentModelTests(APITestCase):
    def __init__():
        pass
    #TESTS GO HERE

'''
    User Role Model Tests
'''
class UserRoleModelTests(APITestCase):
    def __init__():
        pass
    #TESTS GO HERE

'''
    User Unit Model Tests
'''
class UserUnitModelTests(APITestCase):
    def __init__():
        pass
    #TESTS GO HERE

'''
    User Unit Enrolement Model Tests
'''
class UserUnitEnrolementModelTests(APITestCase):
    def __init__():
        pass
    #TESTS GO HERE

'''
    Scheduled Room model Model Tests
'''
class ScheduledroomModelTests(APITestCase):
    def __init__():
        pass
    #TESTS GO HERE















