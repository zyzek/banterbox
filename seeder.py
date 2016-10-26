#!/usr/bin/env python3

# Set up the environment so django doesn't throw a hissy fit.
import os
import sys
from django.contrib.auth.hashers import make_password
from django.core.wsgi import get_wsgi_application

os.environ["DJANGO_SETTINGS_MODULE"] = "project.settings"
application = get_wsgi_application()

# Actual imports
from faker import Factory
from random import choice, randint, sample
from datetime import date, datetime, timedelta, time

import manage
from banterbox import models
from banterbox import icons

UNITS = 10
LECTURES_PER_UNIT = 5
STUDENTS = 100
COMMENTS_PER_ROOM = 10

fake = Factory.create()
euro_fakers = [Factory.create(locale) for locale in \
               ["de_DE", "cs_CZ", "dk_DK", "es_ES", "fr_FR",
                "it_IT", "no_NO", "pl_PL", "ru_RU", "sl_SI"]]

user_password = make_password("password", salt=fake.bothify("#?#?#?#?#?#"))


def sample_with_dupes(population, num_items):
    remaining = num_items
    out_list = []
    while remaining > 0:
        to_remove = min(len(population), remaining)
        remaining -= to_remove
        out_list += sample(population, to_remove)
    return out_list


def add_statuses():
    for status in models.Statuses:
        m = models.RoomStatus()
        m.name = status.value
        m.save()


def add_roles():
    for role in models.Roles:
        m = models.UserRole()
        m.name = role.value
        m.save()


def make_superuser():
    admin = models.User()
    admin.username = "admin"
    admin.password = make_password("admin")
    admin.email = 'admin@banterbox.edu.au'
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
        user.email = fake.email()
        user.password = user_password
        user.save()

        # Profile is now auto generator when a user is created
        # profile = models.Profile()
        # profile.user = user
        # profile.icon = choice(icons.icons)
        # profile.save()


def make_units(num):
    all_users = list(models.User.objects.all())
    student_role = models.UserRole.objects.get(name=models.Roles.participant.value)
    tutor_role = models.UserRole.objects.get(name=models.Roles.moderator.value)

    for _ in range(num):
        # Generate a pretentious european professor
        eu_fake = choice(euro_fakers)
        lecturer = models.User()
        lecturer.first_name = eu_fake.first_name()
        lecturer.last_name = eu_fake.last_name()
        lecturer.username = make_unikey(lecturer.first_name, lecturer.last_name)
        lecturer.password = user_password
        lecturer.email = eu_fake.email()
        lecturer.save()
        
        # Make the unit itself.
        unit = models.Unit()
        unit.name = fake.catch_phrase()
        unit.code = fake.bothify("????####").upper()
        unit.lecturer = lecturer
        unit.icon = choice(icons.icons)
        unit.save()
        
        # Attach the lecturer to the unit
        role = models.UserUnitRole()
        role.user = lecturer
        role.unit = unit
        role.role = models.UserRole.objects.get(name=models.Roles.owner.value)
        role.save()

        # Select a bunch of users to be students of this unit.
        num_users = randint(STUDENTS//(2*UNITS), (2*STUDENTS)//UNITS)
        users = sample_with_dupes(all_users, num_users)

        for i, user in enumerate(users):
            enrolment = models.UserUnitEnrolment()
            enrolment.unit = unit
            enrolment.user = user
            enrolment.save()

            s_role = models.UserUnitRole()
            s_role.user = user
            s_role.unit = unit
            s_role.role = tutor_role if i < 5 else student_role
            s_role.save()


def make_schedules(lecs_per_unit):
    for unit in models.Unit.objects.all():
        for _ in range(lecs_per_unit):
            room = models.ScheduledRoom()
            room.day = randint(0, 4) # Python considers 0 to be monday and 6 to be sunday
            room.unit = unit
            room.start_time = time(hour=randint(0, 20), minute=15*randint(0,3))
            room.end_time = (datetime.combine(date.today(), room.start_time) \
                             + timedelta(minutes=15*randint(1, 12))).time()
            room.save()


def make_rooms(comments_per_room):
    statuses = list(models.RoomStatus.objects.all())

    for cur_unit in models.Unit.objects.all():
        room = models.Room()
        room.name = cur_unit.code + " Lecture"
        room.lecturer = cur_unit.lecturer
        room.unit = cur_unit
        room.status = choice(statuses)
        room.private = choice([True, False])
        room.password_protected = choice([True, False])
        if room.password_protected:
            room.password = "password"
        room.save()

        unit_user_enrolments = models.UserUnitEnrolment.objects.all().filter(unit=cur_unit)
        unit_users = [enrolment.user for enrolment in unit_user_enrolments]
        unit_user_sample = sample_with_dupes(unit_users, comments_per_room)

        for i in range(comments_per_room):
            comment = models.Comment()
            comment.room = room
            comment.user = unit_user_sample[i]
            comment.content = fake.text()
            comment.private = choice([True, False])
            comment.save()


def add_dummy_unit():
    #lecture_name = "The Prawn Hole"

    lecturer = models.User()
    lecturer.first_name = "Wikus"
    lecturer.last_name = "van der Merwe"
    lecturer.username = "wikus"
    lecturer.password = make_password("popcorn")
    lecturer.email = "wikus@d9.co.za"
    lecturer.save()

    unit = models.Unit()
    unit.name = "District 9"
    unit.code = "PRWN9001"
    unit.lecturer = lecturer
    unit.icon = "braille"
    unit.save()

    dud_unit = models.Unit()
    dud_unit.name = 'Intro to Gang Signs'
    dud_unit.code = 'WTUP8876'
    dud_unit.lecturer = lecturer
    dud_unit.icon = 'american-sign-language-interpreting'
    dud_unit.save()
    #
    dud_room = models.ScheduledRoom()
    dud_room.day = 2
    dud_room.unit = dud_unit
    dud_room.start_time = time(hour=10, minute=00, second=00)
    dud_room.end_time = time(hour=12, minute=00, second=00)
    dud_room.save()

    for i in range(7):
        room = models.ScheduledRoom()
        room.day = i
        room.unit = unit
        room.start_time = time(hour=0, minute=0, second=0)
        room.end_time = time(hour=23, minute=59, second=59)
        room.save()


    role = models.UserUnitRole()
    role.user = lecturer
    role.unit = unit
    role.role = models.UserRole.objects.get(name=models.Roles.owner.value)
    role.save()

    enrolment = models.UserUnitEnrolment()
    enrolment.unit = unit
    enrolment.user = lecturer
    enrolment.save()


    for uname in ["anton", "dominic", "patrick", "roy", "wafik"]:
        user = models.User()
        user.username = uname
        user.password = make_password("corn")
        user.is_staff = True
        user.save()


        enrolment = models.UserUnitEnrolment()
        enrolment.unit = unit
        enrolment.user = user
        enrolment.save()


def run_step(func, args, pre_string=None, fail_string=None):
    if pre_string is None:
        print("Running {}...".format(func.__name__), end=" ")
    else:
        print(pre_string, end=" ")
    sys.stdout.flush()
   
    try:
        func(*args)
        print("OK")
    except Exception as e:
        if fail_string is None:
            print("Failed")
        else:
            print("\n" + fail_string)

        with open("errors.log", "a") as logfile:
            logfile.write("Error Logged at {}:\n".format(str(datetime.now())))
            logfile.write("  {}\n\n".format(str(e)))

    sys.stdout.flush()


def hard_reset_db():
    def remove_migrations():
        for filename in os.listdir("banterbox/migrations/"):
            if not os.path.isdir(filename) and filename != "__init__.py":
              os.remove(filename)

    #run_step(remove_migrations, [], "Removing all migrations.")
    run_step(manage.passthrough, [['manage.py', 'migrate', 'banterbox', 'zero']], "Removing all migrations.")
    run_step(manage.passthrough, [['manage.py', 'makemigrations']], "Making migrations...\n")
    run_step(manage.passthrough, [['manage.py', 'migrate']], "Migrating...\n")
    print("Database purged.")


def populate_db():
    run_step(manage.passthrough, [['manage.py', 'flush']], "Flushing database...\n")
    run_step(add_roles, [], "Setting Roles...", "Roles already exist.")
    run_step(add_statuses, [], "Setting Statuses...", "Statuses already exist.")
    run_step(make_superuser, [], "Adding super-user...", "User 'admin' already exists.")
    run_step(make_users, [STUDENTS], "Adding {} users...".format(STUDENTS))
    run_step(make_units, [UNITS], "Adding {} units...".format(UNITS))
    run_step(make_schedules, [LECTURES_PER_UNIT], \
             "Adding {} scheduled lectures per unit...".format(LECTURES_PER_UNIT))
    run_step(add_dummy_unit, [], "Adding prawns...")
    # run_step(make_rooms(10),[],"Adding rooms...","Rooms failed")
    print("All Done.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Flags:")
        print("    --populate    :  populate the database with example data.")
        print("    --purge       :  delete the database and migrations.")
    elif sys.argv[1] == "--populate":
        populate_db()
    elif sys.argv[1] == "--purge":
        hard_reset_db()
