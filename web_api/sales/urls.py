from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SaleOrderViewSet, POSCheckoutView, SalesDashboardView

router = DefaultRouter()
router.register(r'orders', SaleOrderViewSet, basename='saleorder')

urlpatterns = [
    path('checkout/', POSCheckoutView.as_view(), name='pos-checkout'),
    path('dashboard-metrics/', SalesDashboardView.as_view(), name='dashboard-metrics'),
    path('', include(router.urls)),
]
