from datetime import datetime
import json
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from django.conf import settings
from django.contrib.auth.hashers import make_password

from API_TheGiftify.services import deleteDocurmentFromMedia
from rest_framework import views, response, exceptions, status
from django.views.decorators.csrf import csrf_exempt
from django.db.models import F, Window
from django.db.models.functions import RowNumber

import logging
from .serializers import UserGroupSerializer, UserRouteSerializer, UsersSerializer, UserPermissionSerializer
from .models import User, UserGroup, UserPermission, UserRoutes
from .services import create_user, create_user_token, get_user_by_token, clear_user_token

logger = logging.getLogger(__name__)
class RegisterUser(views.APIView):
    def post(self, request):
        try:
            username = request.data.get('username')
            password = request.data.get('password')
            email = request.data.get('email')

            if not username or not password or not email:
                raise exceptions.ValidationError("Username, password, and email are required")

            if User.objects.filter(username=username).exists():
                raise exceptions.ValidationError("Username already exists")

            user = User.objects.create(
                username=username,
                password=make_password(password),
                email=email
            )

            return Response({"message": "User registered successfully"}, status=status.HTTP_201_CREATED)
        except exceptions.ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": "An error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
      
    def put(self, request): 
        with transaction.atomic():
            _data = json.loads(request.data["data"])
            try:
                if (_data["email"] == "N/A"):
                    del _data["email"] 
                if (request.FILES): 
                    file_obj = request.FILES['file']
                    _data["avatar"] = file_obj
                    
                if "app_password" in _data: 
                    _data["app_password"] = make_password(_data["app_password"])
                    
                user = User.objects.get(username=_data["username"])
                    
                serializer = UsersSerializer(user, data=_data)
                if (serializer.is_valid(raise_exception=True)): 
                    serializer.save()
                    
                    # Broadcast
                    _data["ref_id"]         = user.id
                    if 'avatar' in _data:
                        del _data["avatar"]
                    if ("app_password" in _data): 
                        _data["app_password"] = json.loads(request.data["data"])["app_password"]
                    
                    # delete old image
                    if "old_avatar" in _data and "avatar" in _data: 
                        deleteDocurmentFromMedia("/user", _data["old_avatar"])

                    

                    return response.Response({"detail": "success"}, status=status.HTTP_200_OK)
                transaction.set_rollback(True)   
                raise exceptions.NotAcceptable("Data is not validate")

            except Exception as err:
                print(err)
                transaction.set_rollback(True) 
                raise err
        
class Login(views.APIView):
    authentication_classes = ()
    permission_classes = ()
    
    @csrf_exempt
    def post(self, request): 
        
        try: 
            username = request.data["username"]
            password = request.data["password"]

            user = User.objects.filter(username=username).first()

            if user is None:
                raise exceptions.AuthenticationFailed("User and Password is not correct!")

            if not user.check_password(raw_password=password):
                raise exceptions.AuthenticationFailed("User and Password is not correct!")

            #create token
            token = create_user_token(user)
            return response.Response(data={
                "expiry"                : timezone.now() + timezone.timedelta(hours=1), 
                "token"                 : token, 
                "id"                    : user.id,
                "username"              : user.username,
                "email"                 : user.email,
                "first_name"            : user.first_name, 
                "last_name"             : user.last_name, 
                "last_login"            : user.last_login, 
                "last_ip_address"       : "",
                "avatar"                : "", 
                "gender"                : 1, 
                "group_id"              : user.group_id, 
                "view_right"            : "",
                "edit_right"            : "", 
                "allow_discount"        : False, 
                "show_cost"             : False,
                "show_price"            : False, 
                "currentAuthority"      : "admin"
            }, status=status.HTTP_200_OK)
        except Exception as err: 
            print(err)
            raise err
           
class Logout(views.APIView):
    def post(self, request): 
        
        token = request.headers.get('Authorization').split(' ')[1]
        if not token: 
            raise exceptions.AuthenticationFailed("Unauthorized access")
        
        if not clear_user_token(token):
            raise exceptions.AuthenticationFailed("Unauthorized access")
        
        respo = response.Response()
        respo.delete_cookie("ASP.NET_SessionId")
        respo.data = {"message": "Logout"}
        
        return respo
        
class GetUser(views.APIView):
    def get(self, request): 
        try: 
            auth_header = request.headers.get('Authorization')
            if not auth_header:
                raise exceptions.AuthenticationFailed("Authorization header missing")
            
            token_key = auth_header.split(' ')[1]

            if not token_key: 
                raise exceptions.AuthenticationFailed("Unauthorized access")

            try:
                token = Token.objects.get(key=token_key)
            except Token.DoesNotExist:
                raise exceptions.AuthenticationFailed("Invalid token")

            user = token.user

            return Response(data={
                "data": {
                    "name"              : user.username, 
                    "userid"            : user.id,
                    "avatar"            : settings.IMAGE_URL + user.profile.avatar if user.profile.avatar else None,
                    "id"                : user.username,
                    "emp_id"            : user.profile.emp_id,
                    # "first_name"      : "sothea",
                    # "last_name"       : "loeung",
                    # "email"           : "sothea.loeung@onemoreresturant.com",
                    # "signature"       : 'string',
                    # "title"           : 'Sothea',
                }
            })
        except exceptions.AuthenticationFailed as e:
            logger.error(f"Authentication failed: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        except KeyError as e:
            logger.error(f"Key error: {str(e)}")
            return Response({"error": "Invalid token or user data"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"An unexpected error occurred: {str(e)}")
            return Response({"error": "An error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)   
           
class UserSet(views.APIView):
    serializer_class = UsersSerializer
    
    def get_object(self, pk, token=None):
        if (pk == "0"):
            return User.objects.raw("""
                SELECT 
                    ROW_NUMBER() OVER(ORDER BY U.ID DESC) as row_number, 
                    G.name as groupName,
                    U.* 
                FROM tbl_users U 
                    INNER JOIN tbl_groups G ON G.id = U.group_id 
                WHERE U.is_superuser = 0
            """)
        elif pk == "-1": # checking token get user
            return User.objects.raw("""
                SELECT 
                    U.* 
                FROM tbl_users U 
                	INNER JOIN authtoken_token A ON A.user_id = U.id 
                WHERE A.[key] = '"""+ token +"""'
                    AND U.is_superuser = 0
            """)
        else:
            return User.objects.filter(pk=pk)
    
    def get(self, request, pk, format=None):
        
        token = request.META['HTTP_AUTHORIZATION'].replace("Token ", "")
        
        queryset = self.get_object(pk, token)
        data = self.serializer_class(queryset, many=True)
        
        if data is None:
            raise exceptions.NotFound("Data is not exist!")
        
        respo = response.Response()
        respo.data = data.data
        return respo
    
class UserRouteView(views.APIView):
    serializer_class = UserRouteSerializer
    
    def get(self, request): 
        queryset = UserRoutes.objects.raw("""
            SELECT 
                ROW_NUMBER() OVER(ORDER BY R.order_id) as row_number,
            	R2.name as main_name,
                R.*
            FROM tbl_routes R 
            	INNER JOIN tbl_routes R2 ON R2.id = R.parent_id
            		AND R2.status = 1
            WHERE R.status = 1 
            	AND R.outlet_id = 1                          
        """)
        
        serializer = self.serializer_class(queryset, many=True)
        
        respo = response.Response()
        respo.data = serializer.data
        return respo    
      
class UserPermissionView(views.APIView):
    serializer_class = UserPermissionSerializer
    
    def get_object(self, pk): 
        try:
            return UserPermission.objects.raw("""
            SELECT 
                ROW_NUMBER() OVER(ORDER BY R.order_id) as row_number,
            	R.path as path, 
            	R.is_main_menu, 
                R.parent_id as parent,
                P.*
            FROM tbl_permission P 
            	INNER JOIN tbl_routes R ON R.id = P.route_id 
            		AND R.outlet_id = P.outlet_id
            		AND R.status = 1 
            WHERE P.status = 1 
            	AND P.outlet_id = 1 
            	AND P.group_id = """+ pk +"""                             
        """)
        except UserPermission.DoesNotExist:
            raise exceptions.NotFound("Permission is not found!")
        
    def get(self, request, pk, format=None):
        queryset = self.get_object(pk)
        
        serializer = self.serializer_class(queryset, many=True)
        
        respo = response.Response()
        respo.data = serializer.data
        return respo
    
    def post(self, request, pk, format=None):
        
        _data = request.data
        try: 
            with transaction.atomic():
                serializer = UserPermissionSerializer(data=_data, many=True)
                serializer.is_valid(raise_exception=True)
                data = serializer.validated_data
                if not data:
                    raise exceptions.NotAcceptable("Data is not validate")

                UserPermission.objects.filter(
                    outlet_id=_data[0]["outlet_id"], 
                    group_id=_data[0]["group_id"]
                ).delete()

                serializer.save()
                return response.Response({"status": "success"}, status=status.HTTP_200_OK)
        except NameError:
            transaction.set_rollback(True)
        raise exceptions.ParseError("Can not update the data")
        
class UserGroupView(views.APIView):
    serializer_class = UserGroupSerializer
    
    def get(self, request): 
        queryset = UserGroup.objects.filter(status=True, outlet_id=1).annotate(row_number=Window(
                expression=RowNumber(), order_by=F('id').desc()
            ))
        data = self.serializer_class(queryset, many=True)
        
        respo = response.Response()
        respo.data = data.data
        return respo
    
    