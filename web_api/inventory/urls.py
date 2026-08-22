from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StockMovementViewSet, LowStockAlertView

router = DefaultRouter()
router.register(r'movements', StockMovementViewSet, basename='stockmovement')
router.register(r'stock-movements', StockMovementViewSet, basename='stockmovement_alt')

urlpatterns = [
    path('low-stock/', LowStockAlertView.as_view(), name='low-stock-alert'),
    path('', include(router.urls)),
]
