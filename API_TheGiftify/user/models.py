from django.utils import timezone
from django.db import models
from django.contrib.auth import models as auth_models


def upload_to(instance, filename):
    extension = filename.split('.')[-1]
    og_filename = filename.split('.')[0]
   
    stamp = timezone.now().strftime('%Y-%m-%d-%H-%M-%S')
    new_fileName = "user/user_%s.%s" % (stamp, extension)
    return new_fileName


class UserManager(auth_models.BaseUserManager):
    def create_user(self, username: str, password: str = None, emp_id: int = 0, status: bool = True, is_staff: bool = False, is_superuser: bool = False) -> "User":
        if not username: 
            raise ValueError("User must have username")
        if not password: 
            raise ValueError("User must have password")
        if not emp_id: 
            raise ValueError("User must have employee id")
        
        user = self.model()
        user.username = username
        user.set_password(password)
        user.emp_id = int(emp_id)
        user.status = status
        user.is_staff = is_staff
        user.is_superuser = is_superuser
        user.save()
        
        return user
    
    def create_superuser(self, username: str, password: str = None, emp_id: int = 0, status: bool = True) -> "User": 
        user = self.create_user(
            emp_id=int(emp_id),
            password=password, 
            username=username, 
            status=status, 
            is_staff=True, 
            is_superuser=True
        )


class User(auth_models.AbstractUser):   
    id                          = models.BigAutoField(auto_created=True, primary_key=True, serialize=False)
    emp_id                      = models.IntegerField(default=0, blank=True, null=True)
    ad_user                     = models.IntegerField(default=0, blank=True, null=True)
    username                    = models.CharField(max_length=255, unique=True)
    password                    = models.CharField(max_length=255, blank=True, null=True)
    name_kh                     = models.CharField(max_length=255, blank=True, null=True)
    name                        = models.CharField(max_length=255, blank=True, null=True)
    email                       = models.EmailField(max_length=255, blank=True, null=True)
    phone                       = models.CharField(max_length=20, blank=True, null=True)
    last_login                  = models.DateTimeField(blank=True, null=True)
    created_date                = models.DateTimeField(blank=True, default=timezone.now)
    created_by                  = models.IntegerField(blank=True, default=0)
    avatar                      = models.FileField(blank=True, upload_to=upload_to)
    group_id                    = models.IntegerField(blank=True, default=0)
    ref_id                      = models.IntegerField(default=0, blank=True, null=True)
    

    objects = UserManager()
    
    REQUIRED_FIELDS = ["emp_id"]
    USERNAME_FIELD = "username"
    
    @property
    def get_file_url(self):
       from urllib.parse import urljoin
       from django.conf import settings

       return urljoin(settings.BACKEND_URL, self.file.url)
    
    class Meta: 
        db_table = "tbl_users"


class UserRoutes(models.Model):   
    id = models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')
    path = models.CharField(max_length=255, unique=True)
    name = models.CharField(max_length=255)
    view = models.BooleanField(default=0)
    add = models.BooleanField(default=0)
    edit = models.BooleanField(default=0)
    delete = models.BooleanField(default=0)
    other = models.CharField(max_length=255, blank=True, null=True)
    created_date = models.DateTimeField(default=timezone.now)
    created_by = models.IntegerField(default=0)
    status = models.BooleanField(default=True)

    class Meta: 
        db_table = "tbl_routes"
        

class UserGroup(models.Model):   
    id = models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')
    name = models.CharField(max_length=255)
    created_date = models.DateTimeField(default=timezone.now)
    created_by = models.IntegerField(default=0)
    status = models.BooleanField(default=True)
    

    class Meta: 
        db_table = "tbl_groups"
        
        
class UserPermission(models.Model):   
    
    id = models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')
    group_id = models.IntegerField(default=0)
    route_id = models.IntegerField(default=0)
    view = models.BooleanField(default=False)
    add = models.BooleanField(default=False)
    edit = models.BooleanField(default=False)
    delete = models.BooleanField(default=False)
    other = models.CharField(max_length=255, blank=True, null=True)
    created_date = models.DateTimeField(default=timezone.now)
    created_by = models.IntegerField(default=0)
    status = models.BooleanField(default=True)
    

    class Meta: 
        db_table = "tbl_permission"