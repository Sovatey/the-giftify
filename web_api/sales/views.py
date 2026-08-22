from rest_framework import viewsets, status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db import transaction
from django.db.models import Sum, Count, F
from django.utils import timezone
from .models import SaleOrder, SaleOrderItem
from .serializers import SaleOrderSerializer
from products.models import Product
from inventory.models import StockMovement


from utils.tenant_mixin import TenantViewSetMixin


class SaleOrderViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = SaleOrder.objects.select_related('company').prefetch_related('items').all().order_by('-created_at')
    serializer_class = SaleOrderSerializer
    permission_classes = [AllowAny]


class POSCheckoutView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Handles POS sales checkout transaction:
        1. Creates SaleOrder & SaleOrderItems
        2. Deducts product stock_qty
        3. Creates StockMovement records
        """
        data = request.data
        items_data = data.get('items', [])

        if not items_data:
            return Response({'error': 'Cart items are required for checkout'}, status=status.HTTP_400_BAD_REQUEST)

        user_company = request.user.company if request.user.is_authenticated and hasattr(request.user, 'company') else None

        with transaction.atomic():
            cashier_name = data.get('cashier_name', request.user.username if request.user.is_authenticated else 'Cashier')
            discount_amount = float(data.get('discount_amount', 0))
            tax_amount = float(data.get('tax_amount', 0))
            payment_method = data.get('payment_method', 'CASH')
            amount_received = float(data.get('amount_received', 0))

            calc_subtotal = 0
            order_items_to_create = []

            for item in items_data:
                product_id = item.get('product_id')
                qty = int(item.get('qty', 1))

                try:
                    product = Product.objects.get(id=product_id)
                except Product.DoesNotExist:
                    return Response({'error': f'Product ID {product_id} not found'}, status=status.HTTP_400_BAD_REQUEST)

                unit_price = float(product.price)
                item_subtotal = unit_price * qty
                calc_subtotal += item_subtotal

                selected_color = item.get('selected_color') or item.get('color')
                order_items_to_create.append({
                    'product': product,
                    'product_name': product.name,
                    'selected_color': selected_color,
                    'qty': qty,
                    'unit_price': unit_price,
                    'subtotal': item_subtotal
                })

            grand_total = max(0.0, calc_subtotal - discount_amount + tax_amount)
            change_given = max(0.0, amount_received - grand_total) if payment_method == 'CASH' else 0.0

            sale_order = SaleOrder.objects.create(
                company=user_company or (order_items_to_create[0]['product'].company if order_items_to_create else None),
                cashier_name=cashier_name,
                subtotal=calc_subtotal,
                discount_amount=discount_amount,
                tax_amount=tax_amount,
                grand_total=grand_total,
                payment_method=payment_method,
                amount_received=amount_received,
                change_given=change_given,
                status='COMPLETED'
            )

            for item_info in order_items_to_create:
                prod = item_info['product']
                qty = item_info['qty']

                SaleOrderItem.objects.create(
                    sale_order=sale_order,
                    product=prod,
                    product_name=item_info['product_name'],
                    selected_color=item_info.get('selected_color'),
                    qty=qty,
                    unit_price=item_info['unit_price'],
                    subtotal=item_info['subtotal']
                )

                # Deduct inventory & record movement
                prod.stock_qty = max(0, prod.stock_qty - qty)
                prod.save()

                StockMovement.objects.create(
                    company=sale_order.company,
                    product=prod,
                    movement_type='SALE',
                    qty=qty,
                    unit_price=item_info['unit_price'],
                    sub_total_price=item_info['subtotal'],
                    created_by=cashier_name,
                    description=f"POS Sale Invoice {sale_order.invoice_no}"
                )

            return Response(SaleOrderSerializer(sale_order).data, status=status.HTTP_201_CREATED)


class SalesDashboardView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        """Returns analytics summary for dashboard"""
        today = timezone.now().date()

        user = request.user
        company_id = request.query_params.get('company_id') or request.headers.get('X-Company-ID')

        sales_qs = SaleOrder.objects.filter(status='COMPLETED')
        products_qs = Product.objects.filter(is_active=True)

        if user.is_authenticated and not user.is_superuser and getattr(user, 'company', None):
            sales_qs = sales_qs.filter(company=user.company)
            products_qs = products_qs.filter(company=user.company)
        elif company_id:
            sales_qs = sales_qs.filter(company_id=company_id)
            products_qs = products_qs.filter(company_id=company_id)

        today_sales = sales_qs.filter(created_at__date=today)

        total_revenue_today = today_sales.aggregate(total=Sum('grand_total'))['total'] or 0
        total_orders_today = today_sales.count()

        all_time_revenue = sales_qs.aggregate(total=Sum('grand_total'))['total'] or 0
        all_time_orders = sales_qs.count()

        top_items = SaleOrderItem.objects.filter(sale_order__in=sales_qs).values('product_name').annotate(
            total_qty=Sum('qty'),
            total_sales=Sum('subtotal')
        ).order_by('-total_qty')[:5]

        low_stock_count = products_qs.filter(stock_qty__lte=F('min_stock_alert')).count()

        return Response({
            'today_revenue': float(total_revenue_today),
            'today_orders': total_orders_today,
            'all_time_revenue': float(all_time_revenue),
            'all_time_orders': all_time_orders,
            'low_stock_count': low_stock_count,
            'top_products': list(top_items),
        })
