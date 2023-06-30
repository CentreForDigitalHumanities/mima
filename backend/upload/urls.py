from django.urls import include, path
from .views import upload_view, upload_pilot_view

urlpatterns = [
    path('upload/', upload_view),
    path('pilot_upload/', upload_pilot_view)
]
