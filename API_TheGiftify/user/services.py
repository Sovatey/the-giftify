from datetime import datetime, date
import decimal
import json
import os

from django.db import connection

from API_TheGiftify import settings

OjectTransaction = []

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            return (str(o))        
        elif type(o) == datetime:
            return o.strftime('%Y-%m-%d %H:%M:%S')
        return super(JSONEncoder, self).default(o)


