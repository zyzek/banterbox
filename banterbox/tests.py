from myproject.apps.core.models import Account
from django.core.urlresolvers import reverse
from rest_framework.test import APITestCase
from rest_framework import status

#account tests
class AccountTests(APITestCase):
    def test_create_account(self):
        """
        Ensure we can create a new account object.
        """
        url = reverse('account-list')
        print(url)

        data = {'name': 'myusername'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Account.objects.count(), 1)
        self.assertEqual(Account.objects.get().name, 'myusername')

#