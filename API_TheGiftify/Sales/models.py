from django.db import models

class Sale(models.Model):
    id                  = models.AutoField(primary_key=True)
    ItCode              = models.CharField(max_length=25)
    Unit                = models.CharField(max_length=25)
    Qty                 = models.CharField(max_length=25)
    UnitPrice           = models.CharField(max_length=25)
    TotalPrice          = models.CharField(max_length=25)
    DeliveryPrice       = models.CharField(max_length=25)
    Discount            = models.CharField(max_length=25)
    Tax                 = models.CharField(max_length=25)
    TotalAmount         = models.CharField(max_length=25)
    SaleDate            = models.DateTimeField(auto_now_add=True)
    Remarks             = models.CharField(max_length=255)
    CreatedBy           = models.IntegerField(null=True)
    CreatedDate         = models.DateTimeField(auto_now_add=True)
    IsDeleted           = models.BooleanField(default=False)
    Status              = models.IntegerField(default=1)

    class Meta:
        db_table = "tbl_Sale"


    def __str__(self):
        return self.ItCode