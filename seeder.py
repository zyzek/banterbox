import os
from django.core.wsgi import get_wsgi_application

os.environ["DJANGO_SETTINGS_MODULE"] = "project.settings"
application = get_wsgi_application()


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
        unit.code = fake.bothify("????####")
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
        users = sample(models.User.objects.all(), num_users)
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

    print("Adding {} units...".format(UNITS), end=" ")
    make_units(UNITS)
    print("OK")

