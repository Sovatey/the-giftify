from rest_framework import viewsets, status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db import transaction
from .models import StockMovement
from .serializers import StockMovementSerializer
from products.models import Product


class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.all().order_by('-created_at')
    serializer_class = StockMovementSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        with transaction.atomic():
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            stock_movement = serializer.save()

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
