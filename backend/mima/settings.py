"""
Django settings for mima project.

For more information on this file, see
https://docs.djangoproject.com/en/3.0/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/3.0/ref/settings/
"""

import os
from mima.common_settings import *

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/3.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'kxreeb3bds$oibo7ex#f3bi5r+d(1x5zljo-#ms=i2%ih-!pvn'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = []


# Application definition

ROOT_URLCONF = 'mima.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'mima.wsgi.application'


# Database
# https://docs.djangoproject.com/en/3.0/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('PGDATABASE') or 'mima',
        'USER': os.environ.get('PGUSER') or 'mima',
        'PASSWORD': os.environ.get('PGPASSWORD') or 'mima',
        'HOST': os.environ.get('PGHOST') or 'localhost',
        'PORT': os.environ.get('PGPORT') or '5432',
    }
}


# Password validation
# https://docs.djangoproject.com/en/3.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/3.0/howto/static-files/
# It must start with a / or it will fail for paths containing multiple parts
STATIC_URL = '/static/'

STATICFILES_DIRS = []
PROXY_FRONTEND = None

## Path to the Meertens data in csv format
DATA_PATH = ""

## Path to the additional data, i.e. chapters, tags, glosses, and translations
ADDITIONAL_DATA_PATH = ""

## Path to the participants' data in csv format
PARTICIPANTS_PATH = ""

## Path to the output folder
OUTPUT_PATH = ""

PILOT_DATA_PATH = ""
QUESTIONNAIRE_DATA_PATH = ""
ABRIDGED_QUESIONNAIRE_DATA_PATH =  ""


if os.path.exists(os.path.join(BASE_DIR, 'mima/local_settings.py')):
    from mima.local_settings import *
