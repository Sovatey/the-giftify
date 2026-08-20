from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SocialAccountViewSet, SocialPostViewSet, SocialPostLogViewSet

router = DefaultRouter()
router.register(r'accounts', SocialAccountViewSet, basename='social-account')
router.register(r'posts', SocialPostViewSet, basename='social-post')
router.register(r'logs', SocialPostLogViewSet, basename='social-log')

urlpatterns = [
    path('', include(router.urls)),
]
