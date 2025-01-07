from django.urls import path
from .views import RegisterUser, Login, Logout, GetUser, UserGroupView, UserSet, UserPermissionView, UserRouteView



urlpatterns = [
    path(r'register/', RegisterUser.as_view(), name='registerUser'),
    path(r'login/', Login.as_view(), name='loginUser'),
    path(r'logout/', Logout.as_view(), name='logoutUser'),
    path(r'current-user/', GetUser.as_view(), name='currentUser'),
    path(r'user/<str:pk>/', UserSet.as_view(), name='userSet'),
    
    
    path(r'permission/<str:pk>/', UserPermissionView.as_view(), name='userPermissionView'),
    path(r'route/', UserRouteView.as_view(), name='userRouteView'),
    path(r'group/', UserGroupView.as_view(), name='userGroupView'),
    
]

