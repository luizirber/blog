#!/usr/bin/env python
# -*- coding: utf-8 -*- #

import sys
sys.path.append('.')
from pelicanconf import *

# keep the .com address to properly find disqus comments
SITEURL = 'http://blog.luizirber.org'

DELETE_OUTPUT_DIRECTORY = True

# Following items are often useful when publishing

# Uncomment following line for absolute URLs in production:
#RELATIVE_URLS = False

GOOGLE_ANALYTICS = 'UA-41354041-1'
DISQUS_SITENAME = 'gabbleblotchits'

STATIC_PATHS += ['content/CNAME']
EXTRA_PATH_METADATA.update(
    {'content/CNAME': {'path': 'CNAME'}},
)
