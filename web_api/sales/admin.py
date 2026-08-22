from django.contrib import admin
from .models import SaleOrder, SaleOrderItem


class SaleOrderItemInline(admin.TabularInline):
    model = SaleOrderItem
    extra = 0


@admin.register(SaleOrder)
class SaleOrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'invoice_no', 'company', 'cashier_name', 'grand_total', 'payment_method', 'status', 'created_at')
    search_fields = ('invoice_no', 'cashier_name')
    list_filter = ('company', 'payment_method', 'status', 'created_at')
    inlines = [SaleOrderItemInline]


@admin.register(SaleOrderItem)
class SaleOrderItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'sale_order', 'product_name', 'qty', 'unit_price', 'subtotal')
    search_fields = ('product_name', 'sale_order__invoice_no')
