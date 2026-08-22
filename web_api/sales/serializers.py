from rest_framework import serializers
from .models import SaleOrder, SaleOrderItem


class SaleOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaleOrderItem
        fields = ['id', 'product', 'product_name', 'selected_color', 'qty', 'unit_price', 'subtotal']


class SaleOrderSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True, allow_null=True)
    company_code = serializers.CharField(source='company.code', read_only=True, allow_null=True)
    items = SaleOrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = SaleOrder
        fields = [
            'id', 'invoice_no', 'company', 'company_name', 'company_code', 'cashier_name', 'subtotal',
            'discount_amount', 'tax_amount', 'grand_total',
            'payment_method', 'amount_received', 'change_given',
            'status', 'created_at', 'items'
        ]
