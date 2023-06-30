import codecs
import csv
from typing import List
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response
from django.core.files.uploadedfile import UploadedFile
from .models import Adverbial
# Create your views here.

@api_view(['POST'])
def upload_view(request: Request):
    uploadfile: UploadedFile = request.FILES['file']
    reader = csv.DictReader(codecs.iterdecode(uploadfile, 'utf-8'), delimiter=',', quotechar='"')
    result: List[Adverbial] = []
    errors = Adverbial.validate_fieldnames(reader.fieldnames)
    if errors:
        return Response(errors, status=500)

    for row in reader:
        result.append(
            Adverbial.from_csv_row(row).as_dict())

    return Response(result)

@api_view(['POST'])
def upload_pilot_view(filepath):  # Temporary view to help with quickly uploading data to view in frontend
    # filepath = "/Users/Stiph002/Projects/mima_materials/MiMA- Pilotdata clean-up utf-8.csv"
    with open(filepath.body, 'r') as file:
        reader = csv.DictReader(file, delimiter=',', quotechar='"')
        result: List[Adverbial] = []
        errors = Adverbial.validate_fieldnames(reader.fieldnames)
        if errors:
            return Response(errors, status=500)

        for row in reader:
            result.append(
                Adverbial.from_csv_row(row).as_dict())

    return Response(result)
