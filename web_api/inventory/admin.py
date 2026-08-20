from django.contrib import admin
from .models import StockMovement


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'movement_type', 'qty', 'unit_price', 'created_by', 'created_at')
    search_fields = ('product__name', 'supplier')
    list_filter = ('movement_type', 'created_at')
