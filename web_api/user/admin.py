from django.contrib import admin
from .models import User, UserGroup, UserRoutes, UserPermission


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'username', 'email', 'name', 'group', 'is_active', 'created_date')
    search_fields = ('username', 'email', 'name')
    list_filter = ('is_active', 'group')


@admin.register(UserGroup)
class UserGroupAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'description', 'status', 'created_date')
    search_fields = ('name',)


@admin.register(UserRoutes)
class UserRoutesAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'path', 'status')
    search_fields = ('name', 'path')


@admin.register(UserPermission)
class UserPermissionAdmin(admin.ModelAdmin):
    list_display = ('id', 'group', 'route', 'view', 'add', 'edit', 'delete')
    list_filter = ('group', 'route')
