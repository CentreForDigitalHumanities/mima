from django.urls import include, path
from .views import upload_view

urlpatterns = [
    path('upload/', upload_view)
]
