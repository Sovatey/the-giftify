from rest_framework import serializers
from .models import StockMovement


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_barcode = serializers.CharField(source='product.barcode', read_only=True)

    class Meta:
        model = StockMovement
        fields = [
            'id', 'product', 'product_name', 'product_barcode',
            'movement_type', 'qty', 'unit_price', 'sub_total_price',
            'delivery_price', 'supplier', 'description',
            'order_date', 'received_date', 'created_by', 'created_at'
        ]
