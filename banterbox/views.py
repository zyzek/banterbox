from django.http import HttpResponse
import datetime


def index(request):
    return HttpResponse("You're at the root dir!")


def current_datetime(request):
    now = datetime.datetime.now()
    html = "<html><body>It is now %s.</body></html>" % now
    return HttpResponse(html)