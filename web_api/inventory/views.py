from rest_framework import viewsets, status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db import transaction
from .models import StockMovement
from .serializers import StockMovementSerializer
from products.models import Product
from utils.tenant_mixin import TenantViewSetMixin


class StockMovementViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = StockMovement.objects.all().order_by('-created_at')
    serializer_class = StockMovementSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        product_id = self.request.data.get('product')
        product = None
        if product_id:
            try:
                product = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                pass
        
        user_company = self.request.user.company if self.request.user.is_authenticated and getattr(self.request.user, 'company', None) else None
        company_to_assign = user_company or (product.company if product else None)
        
        if company_to_assign and not serializer.validated_data.get('company'):
            serializer.save(company=company_to_assign)
        else:
            serializer.save()

    def create(self, request, *args, **kwargs):
        with transaction.atomic():
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            stock_movement = serializer.instance

            # Update product stock_qty based on movement type
            product = stock_movement.product
            if stock_movement.movement_type in ['RESTOCK', 'RETURN']:
                product.stock_qty += stock_movement.qty
            elif stock_movement.movement_type in ['SALE', 'ADJUSTMENT']:
                product.stock_qty = max(0, product.stock_qty - stock_movement.qty)
            product.save()

            return Response(serializer.data, status=status.HTTP_201_CREATED)


class LowStockAlertView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        """Returns all products whose current stock is below or equal to min_stock_alert"""
        low_stock_products = []
        for p in Product.objects.filter(is_active=True):
            if p.stock_qty <= p.min_stock_alert:
                low_stock_products.append({
                    'id': p.id,
                    'barcode': p.barcode,
                    'name': p.name,
                    'stock_qty': p.stock_qty,
                    'min_stock_alert': p.min_stock_alert,
                    'category_name': p.category.name if p.category else 'N/A'
                })
        return Response({'low_stock_items': low_stock_products, 'count': len(low_stock_products)})
