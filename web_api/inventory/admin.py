from django.contrib import admin
from .models import StockMovement


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'company', 'movement_type', 'qty', 'unit_price', 'delivery_price', 'sub_total_price', 'supplier', 'created_by', 'created_at')
    search_fields = ('product__name', 'supplier', 'description')
    list_filter = ('company', 'movement_type', 'created_at')
