from django.contrib import admin
from . import models

class UserAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "emp_id", 
        "username", 
        "first_name",         
        "last_name",         
    )
    
admin.site.register(models.User, UserAdmin)