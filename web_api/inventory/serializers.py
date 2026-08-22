from rest_framework import serializers
from .models import StockMovement


class StockMovementSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True, allow_null=True)
    company_code = serializers.CharField(source='company.code', read_only=True, allow_null=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_barcode = serializers.CharField(source='product.barcode', read_only=True)
    order_date = serializers.DateField(required=False, allow_null=True)
    received_date = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = StockMovement
        fields = [
            'id', 'company', 'company_name', 'company_code', 'product', 'product_name', 'product_barcode',
            'movement_type', 'qty', 'unit_price', 'sub_total_price',
            'delivery_price', 'supplier', 'description',
            'order_date', 'received_date', 'created_by', 'created_at'
        ]
