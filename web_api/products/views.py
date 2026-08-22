from rest_framework import viewsets, status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer
from utils.tenant_mixin import TenantViewSetMixin


from django.db.models import Q, F


class CategoryViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('id')
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


from rest_framework.parsers import MultiPartParser, FormParser, JSONParser


class ProductViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('-id')
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = super().get_queryset()
        category_id = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        low_stock = self.request.query_params.get('low_stock')

        if category_id:
            queryset = queryset.filter(category_id=category_id)
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(barcode__icontains=search))
        if low_stock == 'true':
            queryset = queryset.filter(stock_qty__lte=F('min_stock_alert'))

        return queryset


class SeedProductsView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        """Seed sample gift products and categories for POS demo"""
        cat_gifts, _ = Category.objects.get_or_create(name='Plush & Toys', defaults={'icon': 'smile'})
        cat_flowers, _ = Category.objects.get_or_create(name='Flowers & Boxes', defaults={'icon': 'heart'})
        cat_cards, _ = Category.objects.get_or_create(name='Greeting Cards', defaults={'icon': 'file-text'})
        cat_accessories, _ = Category.objects.get_or_create(name='Accessories', defaults={'icon': 'gift'})

        sample_products = [
            {
                'barcode': 'GIFT-001',
                'name': 'Pink Teddy Bear (Giant 80cm)',
                'category': cat_gifts,
                'price': 24.50,
                'cost': 12.00,
                'stock_qty': 18,
                'min_stock_alert': 5,
                'image_url': 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=400',
                'description': 'Ultra fluffy pastel pink plush teddy bear with silk ribbon.'
            },
            {
                'barcode': 'GIFT-002',
                'name': 'Eternal Rose Glass Dome Box',
                'category': cat_flowers,
                'price': 35.00,
                'cost': 18.00,
                'stock_qty': 12,
                'min_stock_alert': 3,
                'image_url': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400',
                'description': 'Preserved luxury pink rose encased in glass with LED lights.'
            },
            {
                'barcode': 'GIFT-003',
                'name': 'Pastel Glitter Greeting Card Set',
                'category': cat_cards,
                'price': 4.99,
                'cost': 1.50,
                'stock_qty': 45,
                'min_stock_alert': 10,
                'image_url': 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400',
                'description': 'Handcrafted pastel birthday & love card with envelope.'
            },
            {
                'barcode': 'GIFT-004',
                'name': 'Rose Gold Pearl Bracelet',
                'category': cat_accessories,
                'price': 18.99,
                'cost': 8.00,
                'stock_qty': 8,
                'min_stock_alert': 4,
                'image_url': 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400',
                'description': 'Minimalist rose gold chain bracelet with freshwater pearl.'
            },
            {
                'barcode': 'GIFT-005',
                'name': 'Cute Bunny Soft Cushion',
                'category': cat_gifts,
                'price': 15.00,
                'cost': 7.50,
                'stock_qty': 3,
                'min_stock_alert': 5,
                'image_url': 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=400',
                'description': 'Soft bunny plush pillow for bedroom decor.'
            },
        ]

        for p_data in sample_products:
            Product.objects.get_or_create(
                barcode=p_data['barcode'],
                defaults=p_data
            )

        return Response({'message': 'Sample products seeded successfully!'}, status=status.HTTP_200_OK)
