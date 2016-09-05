#!/usr/bin/env python
import os
import sys

def passthrough(args):
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")

    from django.core.management import execute_from_command_line
    
    execute_from_command_line(args)


if __name__ == "__main__":
    passthrough(sys.argv)
