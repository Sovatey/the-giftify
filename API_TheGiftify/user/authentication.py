from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from API_TheGiftify.utils import convertDateTimeToAwareTime
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token 
from rest_framework import exceptions
from .services import update_token_expiry_time, clear_user_token



EXPIRE_HOURS = getattr(settings, 'REST_FRAMEWORK_TOKEN_EXPIRE_HOURS', 1)

class ExpiringTokenAuthentication(TokenAuthentication):
    def authenticate_credentials(self, key):
        
        try:
            token = Token.objects.get(key=key)
        except Token.DoesNotExist:
            raise exceptions.AuthenticationFailed('Invalid token')

        if not token.user.is_active:
            raise exceptions.AuthenticationFailed('User inactive or deleted')

        if convertDateTimeToAwareTime(token.created) < (timezone.now() - timedelta(hours=EXPIRE_HOURS)):
            if not clear_user_token(token): 
                raise exceptions.AuthenticationFailed('Can not clear token')
            raise exceptions.AuthenticationFailed('Token has expired')
        
        if not update_token_expiry_time(token):
            raise exceptions.AuthenticationFailed('Token can not be updated')

        return (token.user, token)
    
    
