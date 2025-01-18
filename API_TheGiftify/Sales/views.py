from rest_framework.pagination import PageNumberPagination
from rest_framework.viewsets import ModelViewSet
from .serializers import SaleSerializer
from rest_framework import filters
from .models import Sale

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 1000

class SaleViewSet(ModelViewSet):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    pagination_class = StandardResultsSetPagination  # Corrected to singular
    filter_backends = [filters.SearchFilter]
    search_fields = ['id', 'ItCode']