from datetime import datetime
import json

from django.utils import timezone
from django.db import transaction
from django.conf import settings
from django.contrib.auth.hashers import make_password

from API_TheGiftify.services import convertDateTimeToStringDateTime, deleteDocurmentFromMedia
from rest_framework import views, response, exceptions, status
from django.views.decorators.csrf import csrf_exempt
from django.db.models import F, Window
from django.db.models.functions import RowNumber

from .serializers import UserGroupSerializer, UserRouteSerializer, UsersSerializer, UserPermissionSerializer
from .models import User, UserGroup, UserPermission, UserRoutes
from .services import create_user, create_user_token, get_user_by_token, clear_user_token


class RegisterUser(views.APIView):
    def post(self, request): 
        _data           = json.loads(request.data["data"])
        try:
            
            if (_data["email"] == "N/A"):
                del _data["email"] 
            if (request.FILES): 
                file_obj = request.FILES['file']
                _data["avatar"] = file_obj

            user33 = User.objects.filter(username=_data["username"])
            if len(user33.values()) > 0:
                raise exceptions.NotAcceptable("Username already exists.")

            serializer = UsersSerializer(data=_data)
            if not serializer.is_valid(raise_exception=True): 
                raise exceptions.NotAcceptable("dada")

            user = create_user(serializer.initial_data)
            
            # Broadcast To Outlets
            if "avatar" in _data:
                del _data["avatar"]
            _data["ref_id"]                 =  user.id
    
            return response.Response({"detail": "success", "user": user.id}, status=status.HTTP_200_OK)
        except Exception as err:
            print(err)
            raise err
      
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
                "expiry"                : timezone.now() + timezone.timedelta(days=1), 
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
            token = request.headers.get('Authorization').split(' ')[1]

            if not token: 
                raise exceptions.AuthenticationFailed("Unauthorized access")

            user = get_user_by_token(token)

            return response.Response(data={
                "data": {
                    "name"              : user["name"], 
                    "userid"            : user["id"],
                    "avatar"            : settings.IMAGE_URL + user["avatar"] if user["avatar"] else None,
                    "id"                : user["name"],
                    "emp_id"            : user["emp_id"],
                    # "first_name"      : "sothea",
                    # "last_name"       : "loeung",
                    # "email"           : "sothea.loeung@onemoreresturant.com",
                    # "signature"       : 'string',
                    # "title"           : 'Sothea',
                    # "group"           : 'admin',
                    # "notifyCount"     : 2,
                    # "unreadCount"     : 2,
                    # "is_hr"           : 0, 
                    "access"            : user["group_id"], 
                    "access_outlet"     : user["access_outlet"],
                    # "phone"         : "093381221",
                },
                "success": True
            })
        except Exception as err: 
            print(err)
            raise err
            
        
        
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
    
    