from django.shortcuts import render

# Create your views here.
from rest_framework.pagination import PageNumberPagination
from rest_framework.viewsets import ModelViewSet
from .serializers import StockInSerializer, StockOutSerializer
from rest_framework import filters
from .models import StockIn, StockOut


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 1000

# Stock In
class StockInViewSet(ModelViewSet):
    queryset = StockIn.objects.all()
    serializer_class = StockInSerializer
    pagination_class = StandardResultsSetPagination  # Corrected to singular
    filter_backends = [filters.SearchFilter]
    search_fields = ['id', 'ItCode']


# Stock Out
class StockOutViewSet(ModelViewSet):
    queryset = StockOut.objects.all()
    serializer_class = StockOutSerializer
    pagination_class = StandardResultsSetPagination  # Corrected to singular
    filter_backends = [filters.SearchFilter]
    search_fields = ['id', 'ItCode']