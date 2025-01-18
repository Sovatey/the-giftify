from rest_framework.routers import DefaultRouter
from .views import SaleViewSet

router = DefaultRouter()
router.register(r'crud_sales', SaleViewSet, basename='sale')

urlpatterns = router.urls