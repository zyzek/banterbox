#!/usr/bin/env python
import os
from os.path import dirname,join
import sys

from dotenv import load_dotenv


dotenv_path = join(dirname(__file__), '.env')
load_dotenv(dotenv_path)

def passthrough(args):
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")

    from django.core.management import execute_from_command_line
    
    execute_from_command_line(args)


if __name__ == "__main__":
    passthrough(sys.argv)
