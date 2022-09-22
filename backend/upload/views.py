import codecs
import csv
from typing import List
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response
from django.core.files.uploadedfile import UploadedFile
# Create your views here.

@api_view(['POST'])
def upload_view(request: Request):
    uploadfile: UploadedFile = request.FILES['file']
    reader = csv.DictReader(codecs.iterdecode(uploadfile, 'utf-8'), delimiter=',', quotechar='"')
    result: List[List[str]] = []
    for row in reader:
        result.append(row)

    return Response(result)
