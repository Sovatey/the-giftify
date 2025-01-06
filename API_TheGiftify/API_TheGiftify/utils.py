from datetime import datetime, timedelta


def convertDateTimeToAwareTime(date): 
    return datetime.fromisoformat(date.strftime("%Y-%m-%d %H:%M:%S"))