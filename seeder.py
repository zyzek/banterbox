import os
import sys
from django.core.wsgi import get_wsgi_application

os.environ["DJANGO_SETTINGS_MODULE"] = "project.settings"
application = get_wsgi_application()

import manage


from banterbox import models
from faker import Factory
from random import choice, randint, sample
from django.contrib.auth.hashers import make_password

UNITS = 20
ROOMS_PER_UNIT = 10
STUDENTS = 1000

fake = Factory.create()
euro_fakers = [Factory.create(locale) for locale in \
               ["de_DE", "cs_CZ", "dk_DK", "es_ES", "fr_FR",
                "it_IT", "no_NO", "pl_PL", "ru_RU", "sl_SI"]]


user_password = make_password("password", salt=fake.bothify("#?#?#?#?#?#"))

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

def make_unikey(fname, lname):
    unikey_stub = fname[:1].lower() + lname[:3].lower() \
                  + "?"*(4 - (len(fname) + len(lname))) + "####"
    return fake.bothify(unikey_stub)

def make_users(num):
    for _ in range(num):
        user = models.User()
        user.first_name = fake.first_name()
        user.last_name = fake.last_name()
        user.username = make_unikey(user.first_name, user.last_name)
        user.password = user_password
        user.save()

        profile = models.Profile()
        profile.user = user
        profile.icon = get_icon()
        profile.save()

def make_units(num):
    all_users = list(models.User.objects.all())
    for _ in range(num):
        # Generate a pretentious european professor
        eu_fake = choice(euro_fakers)
        lecturer = models.User()
        lecturer.first_name = eu_fake.first_name()
        lecturer.last_name = eu_fake.last_name()
        lecturer.username = make_unikey(lecturer.first_name, lecturer.last_name)
        lecturer.password = user_password
        lecturer.save()
        
        # Make the unit itself.
        unit = models.Unit()
        unit.name = fake.catch_phrase()
        unit.code = fake.bothify("????####").upper()
        unit.lecturer = lecturer
        unit.icon = get_icon()
        unit.save()
        
        # Attack the lecturer to the unit
        role = models.UserUnitRole()
        role.user = lecturer
        role.unit = unit
        role.role = models.UserRole.objects.get(name="owner")
        role.save()

        # Select a bunch of users to be students of this unit.
        num_users = randint(STUDENTS//(2*UNITS), (2*STUDENTS)//UNITS)
        users = sample(all_users, num_users)
        student_role = models.UserRole.objects.get(name="participant")

        for user in users:
            enrolment = models.UserUnitEnrolment()
            enrolment.unit = unit
            enrolment.user = user
            enrolment.save()

            s_role = models.UserUnitRole()
            s_role.user = user
            s_role.unit = unit
            s_role.role = student_role
            s_role.save()


def run_step(func, args, pre_string=None, fail_string=None):
    if pre_string is None:
        print("Running {}...".format(func.__name__), end=" ")
    else:
        print(pre_string)
    sys.stdout.flush()
    
    try:
        func(*args)
        print("OK")
    except:
        if fail_string is None:
            print("Failed")
        else:
            print("\n" + fail_string)
    sys.stdout.flush()




if __name__ == "__main__":

    run_step(manage.passthrough, [['manage.py', 'flush']], "Purging database...\n")
    run_step(add_roles, [], "Setting Roles...", "Roles already exist.")
    run_step(add_statuses, [], "Setting Statuses...", "Statuses already exist.")
    run_step(make_superuser, [], "Adding super-user...", "User 'admin' already exists.")
    run_step(make_users, [STUDENTS], "Adding {} users...".format(STUDENTS))
    run_step(make_units, [UNITS], "Adding {} units...".format(UNITS))
