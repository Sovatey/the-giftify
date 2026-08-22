import random
from django.db import models
from django.utils import timezone
from products.models import Product


from user.models import Company


def generate_invoice_no():
    stamp = timezone.now().strftime('%Y%m%d%H%M')
    rand = random.randint(100, 999)
    return f"INV-{stamp}-{rand}"


class SaleOrder(models.Model):
    PAYMENT_METHODS = (
        ('CASH', 'Cash'),
        ('KHQR', 'ABA KHQR / Mobile'),
        ('CARD', 'Credit / Debit Card'),
    )

    STATUS_CHOICES = (
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    )

    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True, related_name='sale_orders')
    invoice_no = models.CharField(max_length=50, unique=True, default=generate_invoice_no)
    cashier_name = models.CharField(max_length=100, default='Cashier')
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    grand_total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='CASH')
    amount_received = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    change_given = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='COMPLETED')
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'tbl_sale_orders'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.invoice_no} (${self.grand_total})"


class SaleOrderItem(models.Model):
    sale_order = models.ForeignKey(SaleOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, related_name='sale_items')
    product_name = models.CharField(max_length=255)
    selected_color = models.CharField(max_length=100, blank=True, null=True)
    qty = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    class Meta:
        db_table = 'tbl_sale_order_items'

    def __str__(self):
        color_str = f" ({self.selected_color})" if self.selected_color else ""
        return f"{self.product_name}{color_str} x {self.qty}"
