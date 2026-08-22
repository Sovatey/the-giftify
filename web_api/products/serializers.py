from rest_framework import serializers
from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True, allow_null=True)
    company_code = serializers.CharField(source='company.code', read_only=True, allow_null=True)
    product_count = serializers.IntegerField(source='products.count', read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'company', 'company_name', 'company_code', 'description', 'icon', 'product_count', 'created_at']


class ProductSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True, allow_null=True)
    company_code = serializers.CharField(source='company.code', read_only=True, allow_null=True)
    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True, allow_null=True, default='gift')
    display_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'barcode', 'name', 'company', 'company_name', 'company_code', 'category', 'category_name', 'category_icon',
            'price', 'cost', 'stock_qty', 'min_stock_alert', 'uom', 'color', 'size',
            'image_file', 'image_url', 'display_image_url',
            'description', 'is_active', 'created_at'
        ]

    def get_display_image_url(self, obj):
        if obj.image_file:
            request = self.context.get('request')
            url = obj.image_file.url
            if request:
                return request.build_absolute_uri(url)
            return f"http://127.0.0.1:8000{url}" if url.startswith('/') else url
        return obj.image_url
