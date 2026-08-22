import datetime
from django.db import models
from django.utils import timezone
from user.models import Company
from products.models import Product


class StockMovement(models.Model):
    MOVEMENT_TYPES = (
        ('RESTOCK', 'Restock Intake'),
        ('SALE', 'POS Sale Deduction'),
        ('ADJUSTMENT', 'Manual Inventory Adjustment'),
        ('RETURN', 'Customer Return'),
    )

    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True, related_name='stock_movements')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_movements')
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES, default='RESTOCK')
    qty = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    sub_total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    delivery_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    supplier = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    order_date = models.DateField(default=datetime.date.today)
    received_date = models.DateField(default=datetime.date.today)
    created_by = models.CharField(max_length=100, default='System')
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'tbl_inventory'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if isinstance(self.order_date, datetime.datetime):
            self.order_date = self.order_date.date()
        if isinstance(self.received_date, datetime.datetime):
            self.received_date = self.received_date.date()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.movement_type} - {self.product.name} ({self.qty})"
