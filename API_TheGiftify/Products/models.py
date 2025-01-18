from django.db import models

class Product(models.Model):
    id              = models.AutoField(primary_key=True)
    name            = models.CharField(max_length=255)
    name_kh         = models.CharField(max_length=255)
    category        = models.CharField(max_length=255)
    unit            = models.CharField(max_length=255)
    description     = models.TextField(blank=True)
    price           = models.DecimalField(max_digits=10, decimal_places=2)
    image_url       = models.URLField(max_length=255, null=True)
    status          = models.BooleanField(default=True)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)
    IsDeleted       = models.BooleanField(default=False)


    
    class Meta:
        db_table = "tbl_products"
       
    def __str__(self):
        return self.name