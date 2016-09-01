from django.http import HttpResponse
from django.template import loader

import datetime


def index(request):
    template = loader.get_template('index.html')
    context = {
        'generic_var' : 123125
    }
    return HttpResponse(template.render(context,template))


def current_datetime(request):
    now = datetime.datetime.now()
    html = "<html><body>It is now %s.</body></html>" % now
    return HttpResponse(html)


