from os import path
from django.http import HttpRequest, HttpResponse
from django.contrib.staticfiles import finders
from django.views.decorators.csrf import ensure_csrf_cookie

@ensure_csrf_cookie
def index(request: HttpRequest):
    language = request.LANGUAGE_CODE

    """ Thin wrapper for the static index.html that adds the CSRF cookie."""
    return HttpResponse(content=open(finders.find(path.join(language, 'index.html'))))
