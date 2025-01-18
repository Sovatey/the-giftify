from django.db import models

# Create your models here.
from django.db import models
from Products.models import Product
# Create your models here.
class StockIn(models.Model):
    id                  = models.AutoField(primary_key=True)
    ItCode              = models.CharField(max_length=25)
    Unit                = models.CharField(max_length=25)
    Qty                 = models.CharField(max_length=25)
    UnitPrice           = models.CharField(max_length=25)
    TotalPrice          = models.CharField(max_length=25)
    StockInDate         = models.DateTimeField(auto_now_add=True, null=True)
    Remarks             = models.CharField(max_length=255, null=True)
    CreatedBy           = models.IntegerField(null=True)
    CreatedDate         = models.DateTimeField(auto_now_add=True)
    ModifiedBy          = models.IntegerField(null=True)
    ModifiedDate        = models.DateTimeField(auto_now=True, null=True)
    IsDeleted           = models.BooleanField(default=False)
    Status              = models.IntegerField(default=1)

    class Meta:
        db_table = "tbl_ItembalanceIn"
    def __str__(self):
        return self.ItCode
    
class StockOut(models.Model):
    id                  = models.AutoField(primary_key=True)
    ItCode              = models.CharField(max_length=25)
    Unit                = models.CharField(max_length=25)
    Qty                 = models.CharField(max_length=25)
    UnitPrice           = models.CharField(max_length=25)
    TotalPrice          = models.CharField(max_length=25)
    StockOutDate        = models.DateTimeField(auto_now_add=True)
    Remarks             = models.CharField(max_length=255)
    CreatedBy           = models.IntegerField(null=True)
    CreatedDate         = models.DateTimeField(auto_now_add=True)
    ModifiedBy          = models.IntegerField(null=True)
    ModifiedDate        = models.DateTimeField(auto_now=True)
    IsDeleted           = models.BooleanField(default=False)
    Status              = models.IntegerField(default=1)

    
    class Meta:
        db_table = "tbl_ItembalanceOut"
        
    def __str__(self):
        return self.ItCode

