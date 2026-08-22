from rest_framework import serializers
from .models import User, UserGroup, UserRoutes, UserPermission, Company


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__'


class UserGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserGroup
        fields = ['id', 'name', 'description', 'created_date', 'created_by', 'status']


class UserRoutesSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRoutes
        fields = ['id', 'path', 'name', 'view', 'add', 'edit', 'delete', 'other', 'status']


class UserPermissionSerializer(serializers.ModelSerializer):
    route_name = serializers.CharField(source='route.name', read_only=True)
    route_path = serializers.CharField(source='route.path', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)

    class Meta:
        model = UserPermission
        fields = ['id', 'group', 'group_name', 'route', 'route_name', 'route_path', 'view', 'add', 'edit', 'delete', 'other', 'status']


class UserSerializer(serializers.ModelSerializer):
    group_name = serializers.CharField(source='group.name', read_only=True, allow_null=True)
    company_name = serializers.CharField(source='company.name', read_only=True, allow_null=True)
    company_code = serializers.CharField(source='company.code', read_only=True, allow_null=True)
    companies_details = CompanySerializer(source='companies', many=True, read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'emp_id', 'username', 'password', 'name', 'name_kh', 'email', 'phone',
            'avatar', 'group', 'group_name', 'company', 'company_name', 'company_code',
            'companies', 'companies_details',
            'is_active', 'is_staff', 'is_superuser', 'last_login', 'created_date'
        ]
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        companies_data = validated_data.pop('companies', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
        if companies_data is not None:
            user.companies.set(companies_data)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        companies_data = validated_data.pop('companies', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
        if companies_data is not None:
            user.companies.set(companies_data)
        user.save()
        return user
