from rest_framework.routers import DefaultRouter
from .views import StockInViewSet, StockOutViewSet

router = DefaultRouter()
router.register(r'crud_stockIn', StockInViewSet, basename="crudStockIn")
router.register(r'crud_stockOut', StockOutViewSet, basename="crudStockOut")

urlpatterns = router.urls