from rest_framework import views, status, viewsets
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate
from .models import User, UserGroup, UserRoutes, UserPermission
from .serializers import UserSerializer, UserGroupSerializer, UserRoutesSerializer, UserPermissionSerializer


class LoginView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)
        if not user:
            # Fallback check for custom user check if authenticate returns None
            user_obj = User.objects.filter(username=username).first()
            if user_obj and user_obj.check_password(password):
                user = user_obj

        if not user:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'error': 'Account is inactive'}, status=status.HTTP_403_FORBIDDEN)

        token, _ = Token.objects.get_or_create(user=user)
        
        # Get permissions for user's group
        permissions_data = []
        if user.group:
            perms = UserPermission.objects.filter(group=user.group, status=True)
            permissions_data = UserPermissionSerializer(perms, many=True).data

        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
            'role': user.group.name if user.group else ('Admin' if user.is_superuser else 'Cashier'),
            'permissions': permissions_data
        }, status=status.HTTP_200_OK)


class ProfileView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        permissions_data = []
        if user.group:
            perms = UserPermission.objects.filter(group=user.group, status=True)
            permissions_data = UserPermissionSerializer(perms, many=True).data

        return Response({
            'user': UserSerializer(user).data,
            'role': user.group.name if user.group else ('Admin' if user.is_superuser else 'Cashier'),
            'permissions': permissions_data
        })


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-id')
    serializer_class = UserSerializer
    permission_classes = [AllowAny]  # Flexible for frontend initial setup


class UserGroupViewSet(viewsets.ModelViewSet):
    queryset = UserGroup.objects.all().order_by('id')
    serializer_class = UserGroupSerializer
    permission_classes = [AllowAny]


class UserRoutesViewSet(viewsets.ModelViewSet):
    queryset = UserRoutes.objects.all().order_by('id')
    serializer_class = UserRoutesSerializer
    permission_classes = [AllowAny]


class UserPermissionViewSet(viewsets.ModelViewSet):
    queryset = UserPermission.objects.all().order_by('group_id', 'route_id')
    serializer_class = UserPermissionSerializer
    permission_classes = [AllowAny]


class SeedRBACView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        """Seed default routes and roles for POS System"""
        default_routes = [
            {'path': '/pos', 'name': 'POS Checkout'},
            {'path': '/inventory', 'name': 'Inventory & Stock'},
            {'path': '/dashboard', 'name': 'Sales Analytics'},
            {'path': '/user', 'name': 'User & Role Management'},
        ]

        route_objs = {}
        for r in default_routes:
            obj, _ = UserRoutes.objects.get_or_create(
                path=r['path'],
                defaults={'name': r['name'], 'view': True, 'add': True, 'edit': True, 'delete': True}
            )
            route_objs[r['path']] = obj

        default_groups = [
            {'name': 'Admin', 'description': 'Full System Access'},
            {'name': 'Manager', 'description': 'Inventory & Sales Management'},
            {'name': 'Cashier', 'description': 'POS Sales & Checkout Only'},
        ]

        group_objs = {}
        for g in default_groups:
            obj, _ = UserGroup.objects.get_or_create(name=g['name'], defaults={'description': g['description']})
            group_objs[g['name']] = obj

        # Set Admin permissions (Full access to all routes)
        for route_obj in route_objs.values():
            UserPermission.objects.update_or_create(
                group=group_objs['Admin'],
                route=route_obj,
                defaults={'view': True, 'add': True, 'edit': True, 'delete': True}
            )

        # Set Manager permissions (POS, Inventory, Dashboard)
        for path in ['/pos', '/inventory', '/dashboard']:
            UserPermission.objects.update_or_create(
                group=group_objs['Manager'],
                route=route_objs[path],
                defaults={'view': True, 'add': True, 'edit': True, 'delete': False}
            )

        # Set Cashier permissions (POS Checkout view & add)
        UserPermission.objects.update_or_create(
            group=group_objs['Cashier'],
            route=route_objs['/pos'],
            defaults={'view': True, 'add': True, 'edit': False, 'delete': False}
        )

        return Response({'message': 'Default RBAC seeded successfully!'}, status=status.HTTP_200_OK)
