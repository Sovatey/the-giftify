from django.utils import timezone
from django.db import models
from django.contrib.auth import models as auth_models


def upload_to(instance, filename):
    extension = filename.split('.')[-1]
    stamp = timezone.now().strftime('%Y-%m-%d-%H-%M-%S')
    return f"user/user_{stamp}.{extension}"


class UserManager(auth_models.BaseUserManager):
    def create_user(self, username: str, password: str = None, emp_id: int = 0, status: bool = True, is_staff: bool = False, is_superuser: bool = False) -> "User":
        if not username:
            raise ValueError("User must have username")
        if not password:
            raise ValueError("User must have password")

        user = self.model()
        user.username = username
        user.set_password(password)
        user.emp_id = int(emp_id) if emp_id else 0
        user.is_active = status
        user.is_staff = is_staff
        user.is_superuser = is_superuser
        user.save()
        return user

    def create_superuser(self, username: str, password: str = None, emp_id: int = 0, status: bool = True) -> "User":
        return self.create_user(
            emp_id=int(emp_id),
            password=password,
            username=username,
            status=status,
            is_staff=True,
            is_superuser=True
        )


class Company(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True, help_text="Unique company identifier code")
    logo = models.FileField(upload_to=upload_to, blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(max_length=255, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "tbl_companies"
        verbose_name = "Company"
        verbose_name_plural = "Companies"

    def __str__(self):
        return f"{self.name} ({self.code})"


class UserGroup(models.Model):
    name = models.CharField(max_length=255)
    description = models.CharField(max_length=255, blank=True, null=True)
    created_date = models.DateTimeField(default=timezone.now)
    created_by = models.IntegerField(default=0)
    status = models.BooleanField(default=True)

    class Meta:
        db_table = "tbl_groups"

    def __str__(self):
        return self.name


class User(auth_models.AbstractUser):
    emp_id = models.IntegerField(default=0, blank=True, null=True)
    ad_user = models.IntegerField(default=0, blank=True, null=True)
    username = models.CharField(max_length=255, unique=True)
    password = models.CharField(max_length=255, blank=True, null=True)
    name_kh = models.CharField(max_length=255, blank=True, null=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    last_login = models.DateTimeField(blank=True, null=True)
    created_date = models.DateTimeField(blank=True, default=timezone.now)
    created_by = models.IntegerField(blank=True, default=0)
    avatar = models.FileField(blank=True, upload_to=upload_to, null=True)
    group = models.ForeignKey(UserGroup, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    company = models.ForeignKey(Company, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    companies = models.ManyToManyField(Company, blank=True, related_name='assigned_users')
    ref_id = models.IntegerField(default=0, blank=True, null=True)

    objects = UserManager()

    REQUIRED_FIELDS = []
    USERNAME_FIELD = "username"

    class Meta:
        db_table = "tbl_users"


class UserRoutes(models.Model):
    path = models.CharField(max_length=255, unique=True)
    name = models.CharField(max_length=255)
    view = models.BooleanField(default=True)
    add = models.BooleanField(default=True)
    edit = models.BooleanField(default=True)
    delete = models.BooleanField(default=True)
    other = models.CharField(max_length=255, blank=True, null=True)
    created_date = models.DateTimeField(default=timezone.now)
    created_by = models.IntegerField(default=0)
    status = models.BooleanField(default=True)

    class Meta:
        db_table = "tbl_routes"


class UserPermission(models.Model):
    group = models.ForeignKey(UserGroup, on_delete=models.CASCADE, related_name='permissions')
    route = models.ForeignKey(UserRoutes, on_delete=models.CASCADE, related_name='permissions')
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
        unique_together = ('group', 'route')
