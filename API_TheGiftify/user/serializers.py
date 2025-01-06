from rest_framework import serializers, fields

from datetime import datetime
from .models import User as UserModel, UserRoutes, UserGroup, UserPermission

class UsersSerializer(serializers.ModelSerializer): 
    key = fields.IntegerField(source='row_number', required=False)
    group_name = fields.CharField(max_length=255, source='groupName', required=False)
    class Meta: 
        model = UserModel
        fields = [
            "key", 
            "group_name",
            "id",
            "emp_id",
            "ad_user",
            "username",
            "password",
            "email",
            "name_kh",
            "name",
            "first_name",
            "last_name",
            "phone",
            "last_login",
            "created_date",
            "created_by",
            "avatar",
            "group_id",
            "ref_id",
            "is_active"
        ]
        read_only_fields = ['id', 'key']
        extra_kwargs = {
            'ref_id': {'write_only': True},
            'password': {'write_only': True},
            'first_name': {'write_only': True},
            'last_name': {'write_only': True},
            'last_login': {'write_only': True},
            'created_date': {'write_only': True},
            'created_by': {'write_only': True},
        }
        

class GetUserSerializer(serializers.Serializer): 
    key = fields.IntegerField(source='row_number', required=False)
    class Meta: 
        model = UserRoutes
        fields = [
            "key"
            "id",
            "path",
            "name",
            "view",
            "add",
            "edit",
            "delete",
            "other",
            "status"
        ]
        read_only_fields = ['id', 'key']
        
     
class UserRouteSerializer(serializers.ModelSerializer): 
    key = fields.IntegerField(source='row_number', required=False)
    main = fields.CharField(max_length=255, source='main_name', required=False)
    class Meta: 
        model = UserRoutes
        fields = [
            "key",
            "id",
            "main",
            "name",
            "view",
            "add",
            "edit",
            "delete",
            "other",
            "created_date",
            "created_by",
            "status",
        ]
        read_only_fields = ['id', 'key', 'parent_id']
        write_only_fields = ['created_by', 'created_date',"status"]     
        
        
class UserGroupSerializer(serializers.ModelSerializer): 
    key = fields.IntegerField(source='row_number', required=False)
    class Meta: 
        model = UserGroup
        fields = [
            "key",
            "id",
            "name",
            "created_date",
            "created_by",
            "status"
        ]
        read_only_fields = ['id', 'key']
        write_only_fields = ['created_by', 'created_date', 'status']
        
        
class UserPermissionSerializer(serializers.ModelSerializer): 
    key = fields.IntegerField(source='row_number', required=False)
    route = fields.CharField(max_length=255, source='path', required=False)
    isMainMenu = fields.BooleanField(source='is_main_menu', required=False)
    parent_id = fields.IntegerField(source='parent', required=False)
    
    class Meta: 
        model = UserPermission
        
        fields = [
            "key",
            "id",
            "route",
            "parent_id",
            "isMainMenu",
            "outlet_id",
            "group_id",
            "route_id",
            "view", 
            "add", 
            "edit", 
            "delete", 
            "other",
            "created_date",
            "created_by",
            "status"
        ]
        read_only_fields = ['id', 'key', 'is_main_menu', 'parent_id']
        write_only_fields = ['created_by', 'created_date', "status"]