from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LoginView, ProfileView, UserViewSet, UserGroupViewSet,
    UserRoutesViewSet, UserPermissionViewSet, SeedRBACView, CompanyViewSet
)

router = DefaultRouter()
router.register(r'companies', CompanyViewSet, basename='company')
router.register(r'users', UserViewSet, basename='user')
router.register(r'roles', UserGroupViewSet, basename='role')
router.register(r'routes', UserRoutesViewSet, basename='route')
router.register(r'permissions', UserPermissionViewSet, basename='permission')

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('seed-rbac/', SeedRBACView.as_view(), name='seed-rbac'),
    path('', include(router.urls)),
]
