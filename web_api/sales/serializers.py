from rest_framework import serializers
from .models import SaleOrder, SaleOrderItem


class SaleOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaleOrderItem
        fields = ['id', 'product', 'product_name', 'qty', 'unit_price', 'subtotal']


class SaleOrderSerializer(serializers.ModelSerializer):
    items = SaleOrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = SaleOrder
        fields = [
            'id', 'invoice_no', 'cashier_name', 'subtotal',
            'discount_amount', 'tax_amount', 'grand_total',
            'payment_method', 'amount_received', 'change_given',
            'status', 'created_at', 'items'
        ]
