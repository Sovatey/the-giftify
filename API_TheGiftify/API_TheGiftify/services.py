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



def deleteDocurmentFromMedia (path, docName): 
    if os.path.exists(settings.MEDIA_ROOT + path + "/" + docName):
        os.remove(os.path.join(settings.MEDIA_ROOT + path, docName))
        
   
def convertDateTimeToStringDateTime(data):
    for x in data:
        if type(data[x]) is datetime or type(data[x]) is date:
            if data[x].strftime("%H:%M:%S") != "00:00:00":
                data[x] = data[x].strftime("%Y-%m-%d %H:%M:%S")
            else:
                data[x] = data[x].strftime("%Y-%m-%d")
    
    return data


