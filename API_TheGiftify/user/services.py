from .serializers import UsersSerializer
from .models import User
from rest_framework.authtoken.models import Token
from django.utils import timezone


def create_user(user_dc):
    instance = User(
        username                = user_dc["username"], 
        emp_id                  = user_dc["emp_id"],
        first_name              = user_dc["name_kh"], 
        last_name               = user_dc["name_kh"], 
        name_kh                 = user_dc["name_kh"], 
        name                    = user_dc["name"], 
        email                   = user_dc["email"] if 'email' in user_dc else "", 
        created_by              = user_dc["created_by"], 
        group_id                = user_dc["group_id"], 
        is_active               = user_dc["is_active"], 
        is_staff                = True,
        date_joined             = timezone.now(), 
        is_superuser            = False, 
        avatar                  = user_dc["avatar"] if ("avatar" in user_dc) else ""
    )
    
    if "password" in user_dc:
        instance.set_password(user_dc["password"])
        
    
    instance.save()
    
    return instance



def create_user_token(user_dc):
    token, created = Token.objects.get_or_create(user=user_dc)
    if not created:
        # update the created time of the token to keep it valid
        token.created = timezone.now()
        token.save()
    else: 
        Token.objects.filter(key=token.key).update(created=timezone.now())
    
    return token.key

def clear_user_token(token):
    token = Token.objects.get(key=token)
    if not token:
        return None
    
    token.delete()
    return True

def update_token_expiry_time(token):
    token = Token.objects.get(key=token)
    if not token:
        return False
        
    token.created = timezone.now()
    token.save()
    return True


def get_user_by_token(token):
    row = Token.objects.get(key=token)
    if not row:
        return None
    
    queryset = User.objects.get(pk=row.user.id)
    data = UsersSerializer(queryset)
    
    if not data.data:
        return None
    
    return data.data
