import os
from django.core.wsgi import get_wsgi_application

os.environ["DJANGO_SETTINGS_MODULE"] = "project.settings"
application = get_wsgi_application()


from banterbox import models
from faker import Factory
from random import choice
from django.contrib.auth.hashers import make_password

UNITS = 10
ROOMS_PER_UNIT = 10
STUDENTS = 30

fake = Factory.create()

user_password = make_password(fake.password(), salt=fake.bothify("#?#?#?#?#?#"))

fa_icons = []
icons_loaded = False

def load_icons():
    global fa_icons
    with open("resources/fa_icons.txt", 'r') as icon_file:
        fa_icons = [icon[:-1] for icon in icon_file.readlines()] # [:-1] to remove trailing \n
        icons_loaded = True

def get_icon():
    if not icons_loaded:
        load_icons()

    return choice(fa_icons)

def add_statuses():
    for status in ["commencing", "running", "paused", "concluding", "closed"]:
        m = models.RoomStatus()
        m.name = status
        m.save()

def add_roles():
    for role in ["participant", "owner", "moderator"]:
        m = models.UserRole()
        m.name = role
        m.save()
    
def make_superuser():
    admin = models.User()
    admin.username = "admin"
    admin.password = make_password("admin")
    admin.is_superuser = True
    admin.is_staff = True
    admin.save()

def make_users(num):
    for _ in range(num):
        user = models.User()
        user.first_name = fake.first_name()
        user.last_name = fake.last_name()
        unikey_stub = user.first_name[:1].lower() + user.last_name[:3].lower() + "####"
        user.username = fake.numerify(unikey_stub)
        user.password = user_password
        user.save()

        profile = models.Profile()
        profile.user = user
        profile.icon = get_icon()
        profile.save()

#def make_units(num):
#   pass 

if __name__ == "__main__":
    print("Setting Roles and Statuses...", end=" ")
    try:
        add_roles()
    except:
        print("\nRoles already exist.")

    try:
        add_statuses()
    except:
        print("\nStatuses already exist.")

    print("OK")

    print("Adding super-user...", end=" ")
    try:
        make_superuser()
    except:
        print("\nUser 'admin' already exists.")
    print("OK")

    print("Adding {} users...".format(STUDENTS), end=" ")
    make_users(STUDENTS)
    print("OK")

