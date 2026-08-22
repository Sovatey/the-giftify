from django.db import models
from django.db.models import Q
from rest_framework import viewsets

class TenantViewSetMixin:
    """
    Mixin to automatically enforce multi-company tenant scoping for DRF ViewSets:
    1. SuperAdmin users can filter by any company using ?company_id=X or header X-Company-ID.
    2. Company Managers & Staff users are strictly scoped to their assigned company.
    3. On record creation, automatically attaches company context.
    """

    def get_queryset(self):
        queryset = super().get_queryset()
        user = getattr(self.request, 'user', None)

        model = getattr(queryset, 'model', None)
        if not model or not hasattr(model, 'company'):
            return queryset

        if self.request.query_params.get('all_companies') in ['true', '1', 'ALL']:
            return queryset

        # 1. SuperAdmin users: can filter by company_id, or see all if none requested
        if user and user.is_authenticated and getattr(user, 'is_superuser', False):
            company_id = (
                self.request.query_params.get('company_id') or 
                (self.request.headers.get('X-Company-ID') if hasattr(self.request, 'headers') else None) or
                (self.request.headers.get('x-company-id') if hasattr(self.request, 'headers') else None) or
                (self.request.META.get('HTTP_X_COMPANY_ID') if hasattr(self.request, 'META') else None)
            )
            if company_id and company_id != '':
                try:
                    cid = int(company_id)
                    return queryset.filter(Q(company_id=cid) | Q(company__isnull=True))
                except (ValueError, TypeError):
                    pass
            return queryset

        # 2. Company Managers & Staff: scoped to their assigned company or companies
        if user and user.is_authenticated:
            assigned_cids = list(user.companies.values_list('id', flat=True))
            if getattr(user, 'company_id', None) and user.company_id not in assigned_cids:
                assigned_cids.append(user.company_id)
            if assigned_cids:
                return queryset.filter(Q(company_id__in=assigned_cids) | Q(company__isnull=True))

        # 3. Request provided company_id (e.g. public endpoints without auth token)
        company_id = (
            self.request.query_params.get('company_id') or 
            (self.request.headers.get('X-Company-ID') if hasattr(self.request, 'headers') else None) or
            (self.request.headers.get('x-company-id') if hasattr(self.request, 'headers') else None) or
            (self.request.META.get('HTTP_X_COMPANY_ID') if hasattr(self.request, 'META') else None)
        )
        if company_id and company_id != '':
            try:
                cid = int(company_id)
                return queryset.filter(Q(company_id=cid) | Q(company__isnull=True))
            except (ValueError, TypeError):
                pass

        # 4. Default fallback
        return queryset

    def perform_create(self, serializer):
        user = getattr(self.request, 'user', None)
        model = getattr(serializer.Meta, 'model', None) if hasattr(serializer, 'Meta') else None

        if model and hasattr(model, 'company'):
            company = None

            # Regular company user's assigned company takes priority
            if user and user.is_authenticated and getattr(user, 'company', None):
                company = user.company

            # If superuser or unassigned user, read explicit company_id from request
            if not company:
                company_id = (
                    self.request.data.get('company_id') or 
                    (self.request.headers.get('X-Company-ID') if hasattr(self.request, 'headers') else None) or
                    (self.request.META.get('HTTP_X_COMPANY_ID') if hasattr(self.request, 'META') else None)
                )

                if company_id:
                    from user.models import Company
                    try:
                        company = Company.objects.filter(id=int(company_id)).first()
                    except (ValueError, TypeError):
                        pass

            if not company:
                from user.models import Company
                company = Company.objects.first()

            serializer.save(company=company)
        else:
            serializer.save()
