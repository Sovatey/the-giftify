from django.db import models
from django.utils import timezone


from user.models import Company


class Category(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True, related_name='categories')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=100, default='gift')
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'tbl_categories'
        verbose_name_plural = 'Categories'
        unique_together = ('company', 'name')

    def __str__(self):
        return self.name


def product_image_upload_path(instance, filename):
    stamp = timezone.now().strftime('%Y%m%d_%H%M%S')
    return f"products/{stamp}_{filename}"


class Product(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True, related_name='products')
    barcode = models.CharField(max_length=100, unique=True, blank=True, null=True)
    name = models.CharField(max_length=255)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    stock_qty = models.IntegerField(default=0)
    min_stock_alert = models.IntegerField(default=5)
    uom = models.CharField(max_length=50, default='Pcs', help_text="Unit of Measure e.g. Pcs, Box, Set, Pack, Dozen")
    color = models.CharField(max_length=100, blank=True, null=True, help_text="Color variant e.g. Pink, Red, Blue, Gold")
    size = models.CharField(max_length=100, blank=True, null=True, help_text="Size/Spec variant e.g. Giant 80cm, Medium, XL")
    image_file = models.FileField(upload_to=product_image_upload_path, blank=True, null=True)
    image_url = models.CharField(max_length=500, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'tbl_products'

    def __str__(self):
        return self.name
