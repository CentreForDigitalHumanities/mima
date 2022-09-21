from distutils.command.upload import upload
from django.db import models
import os

class UploadedCSV(models.Model):
    upload_path = "backend/upload/csv_files"
    name = models.CharField(max_length=200)
    file = models.FileField(upload_to=os.path.join(upload_path, name))

