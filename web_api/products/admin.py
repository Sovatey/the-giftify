from django.contrib import admin
from .models import Category, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'company', 'icon', 'created_at')
    search_fields = ('name',)
    list_filter = ('company',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'barcode', 'company', 'category', 'uom', 'color', 'size', 'price', 'cost', 'stock_qty', 'is_active')
    search_fields = ('name', 'barcode', 'color', 'size')
    list_filter = ('company', 'category', 'uom', 'is_active')
