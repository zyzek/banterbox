# -*- coding: utf-8 -*-
# Generated by Django 1.10 on 2016-08-30 05:32
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('banterbox', '0001_initial'),
    ]

    operations = [
        migrations.RenameField(
            model_name='class',
            old_name='id',
            new_name='public_id',
        ),
        migrations.RenameField(
            model_name='comment',
            old_name='id',
            new_name='public_id',
        ),
        migrations.RenameField(
            model_name='room',
            old_name='id',
            new_name='public_id',
        ),
        migrations.RenameField(
            model_name='user',
            old_name='id',
            new_name='public_id',
        ),
    ]