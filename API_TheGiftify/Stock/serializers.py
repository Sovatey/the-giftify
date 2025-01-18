from rest_framework import serializers
from .models import StockIn, StockOut

class StockInSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockIn
        fields = '__all__'

class StockOutSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockOut
        fields = '__all__'
