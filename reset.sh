#!/bin/bash
python manage.py migrate
python seeder.py —-purge
python seeder.py --populate
