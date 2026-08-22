from datetime import datetime
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import json
import requests
from .models import SocialAccount, SocialPost, SocialPostAttachment, SocialPostLog
from .serializers import SocialAccountSerializer, SocialPostSerializer, SocialPostLogSerializer
from .publishers import PublisherEngine, FacebookPublisher, TelegramPublisher, TikTokPublisher
from .scheduler import check_and_publish_due_posts

def make_aware_scheduled_at(val):
    if not val:
        return None
    if isinstance(val, str):
        val_clean = val.replace('T', ' ')
        try:
            parsed_dt = datetime.strptime(val_clean.split('.')[0], '%Y-%m-%d %H:%M:%S')
        except Exception:
            parsed_dt = parse_datetime(val)
        if parsed_dt:
            if timezone.is_naive(parsed_dt):
                tz = timezone.get_current_timezone()
                return timezone.make_aware(parsed_dt, tz)
            return parsed_dt
    elif isinstance(val, datetime):
        if timezone.is_naive(val):
            tz = timezone.get_current_timezone()
            return timezone.make_aware(val, tz)
        return val
    return val


from utils.tenant_mixin import TenantViewSetMixin


class SocialAccountViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = SocialAccount.objects.all().order_by('-created_at')
    serializer_class = SocialAccountSerializer
    permission_classes = [AllowAny]

    @action(detail=True, methods=['post'], url_path='test-connection')
    def test_connection(self, request, pk=None):
        account = self.get_object()

        if account.is_simulated:
            return Response({
                'success': True,
                'message': f"Test connection successfully! (Simulated Mode: {account.name})"
            }, status=status.HTTP_200_OK)

        try:
            if account.platform == 'telegram':
                bot_token = account.app_id_or_bot_token
                if not bot_token:
                    return Response({'success': False, 'message': 'Telegram Bot Token is required'}, status=status.HTTP_400_BAD_REQUEST)
                
                url = f"https://api.telegram.org/bot{bot_token}/getMe"
                res = requests.get(url, timeout=10)
                res_data = res.json()
                if res_data.get('ok'):
                    username = res_data.get('result', {}).get('username', '')
                    msg = f"Test connection successfully! (Bot: @{username})" if username else "Test connection successfully!"
                    return Response({'success': True, 'message': msg}, status=status.HTTP_200_OK)
                else:
                    err_msg = res_data.get('description', 'Invalid Telegram Bot Token')
                    return Response({'success': False, 'message': f"Telegram API Error: {err_msg}"}, status=status.HTTP_400_BAD_REQUEST)

            elif account.platform == 'facebook':
                access_token = account.access_token
                page_id = account.page_id_or_chat_id
                if not access_token:
                    return Response({'success': False, 'message': 'Facebook Access Token is required'}, status=status.HTTP_400_BAD_REQUEST)
                
                target = page_id if page_id else 'me'
                url = f"https://graph.facebook.com/v19.0/{target}"
                res = requests.get(url, params={'access_token': access_token}, timeout=10)
                res_data = res.json()
                if res.status_code == 200 and 'id' in res_data:
                    name = res_data.get('name', account.name)
                    return Response({'success': True, 'message': f"Test connection successfully! (Page: {name})"}, status=status.HTTP_200_OK)
                else:
                    err_msg = res_data.get('error', {}).get('message', 'Invalid Access Token or Page ID')
                    return Response({'success': False, 'message': f"Facebook API Error: {err_msg}"}, status=status.HTTP_400_BAD_REQUEST)

            elif account.platform == 'tiktok':
                access_token = account.access_token
                if not access_token:
                    return Response({'success': False, 'message': 'TikTok Access Token is required'}, status=status.HTTP_400_BAD_REQUEST)
                
                url = "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,display_name"
                headers = {"Authorization": f"Bearer {access_token}"}
                res = requests.get(url, headers=headers, timeout=10)
                res_data = res.json()
                if res.status_code == 200 and 'data' in res_data:
                    display_name = res_data.get('data', {}).get('user', {}).get('display_name', account.name)
                    return Response({'success': True, 'message': f"Test connection successfully! (User: {display_name})"}, status=status.HTTP_200_OK)
                else:
                    err_msg = res_data.get('error', {}).get('message', 'Invalid TikTok Access Token')
                    return Response({'success': False, 'message': f"TikTok API Error: {err_msg}"}, status=status.HTTP_400_BAD_REQUEST)

            else:
                return Response({'success': False, 'message': 'Unknown platform'}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({'success': False, 'message': f"Connection exception: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=False, methods=['post'], url_path='tiktok-token-exchange')
    def tiktok_token_exchange(self, request):
        code = request.data.get('code')
        code_verifier = request.data.get('code_verifier')
        redirect_uri = request.data.get('redirect_uri', 'http://localhost:3000/social-publisher')
        client_key = request.data.get('client_key')
        client_secret = request.data.get('client_secret')
        account_id = request.data.get('account_id')

        if not code or not code_verifier:
            return Response({'success': False, 'message': 'Missing code or code_verifier'}, status=status.HTTP_400_BAD_REQUEST)

        acc = None
        if account_id:
            acc = SocialAccount.objects.filter(id=account_id).first()
        if not acc:
            acc = SocialAccount.objects.filter(platform='tiktok').first()

        if acc:
            client_key = client_key or acc.app_id_or_bot_token

        if not client_key:
            return Response({'success': False, 'message': 'TikTok Client Key not set'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            url = "https://open.tiktokapis.com/v2/oauth/token/"
            headers = {'Content-Type': 'application/x-www-form-urlencoded'}
            payload = {
                'client_key': client_key,
                'client_secret': client_secret or '',
                'code': code,
                'grant_type': 'authorization_code',
                'redirect_uri': redirect_uri,
                'code_verifier': code_verifier
            }
            res = requests.post(url, data=payload, headers=headers, timeout=15)
            res_data = res.json()

            access_token = res_data.get('access_token') or res_data.get('data', {}).get('access_token')
            open_id = res_data.get('open_id') or res_data.get('data', {}).get('open_id')

            if access_token:
                if not acc:
                    acc = SocialAccount.objects.create(
                        platform='tiktok',
                        name='Official TikTok Account',
                        app_id_or_bot_token=client_key,
                        is_simulated=False,
                        is_active=True
                    )
                acc.access_token = access_token
                if open_id:
                    acc.page_id_or_chat_id = open_id
                acc.is_simulated = False
                acc.save()

                return Response({
                    'success': True,
                    'access_token': access_token,
                    'open_id': open_id,
                    'account_id': acc.id,
                    'message': 'Successfully connected TikTok account!'
                }, status=status.HTTP_200_OK)
            else:
                err_msg = res_data.get('error_description') or res_data.get('error', {}).get('message', res.text)
                return Response({'success': False, 'message': f"TikTok OAuth Error: {err_msg}"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'success': False, 'message': f"TikTok OAuth Exception: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SocialPostViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = SocialPost.objects.all().order_by('-created_at')
    serializer_class = SocialPostSerializer
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def list(self, request, *args, **kwargs):
        try:
            check_and_publish_due_posts()
        except Exception:
            pass
        return super().list(request, *args, **kwargs)

    def _process_multi_attachments(self, request, post):
        image_files = request.FILES.getlist('image_files')
        for idx, img_f in enumerate(image_files):
            SocialPostAttachment.objects.create(
                post=post,
                media_type='IMAGE',
                file=img_f,
                order=idx
            )

        video_files = request.FILES.getlist('video_files')
        for idx, vid_f in enumerate(video_files):
            SocialPostAttachment.objects.create(
                post=post,
                media_type='VIDEO',
                file=vid_f,
                order=idx
            )


    def _prepare_data(self, request):
        data = {}
        for key in request.data:
            if key not in ['image_files', 'video_files']:
                data[key] = request.data[key]

        if 'image_file' in request.FILES:
            data['image_file'] = request.FILES['image_file']
        if 'video_file' in request.FILES:
            data['video_file'] = request.FILES['video_file']

        if isinstance(data.get('platforms'), str):
            try:
                data['platforms'] = json.loads(data['platforms'])
            except Exception:
                data['platforms'] = [data['platforms']]

        if isinstance(data.get('recurring_days'), str):
            try:
                data['recurring_days'] = json.loads(data['recurring_days'])
            except Exception:
                data['recurring_days'] = [data['recurring_days']]

        if isinstance(data.get('account_ids'), str):
            try:
                data['account_ids'] = json.loads(data['account_ids'])
            except Exception:
                data['account_ids'] = [data['account_ids']]

        if data.get('scheduled_at'):
            data['scheduled_at'] = make_aware_scheduled_at(data['scheduled_at'])

        if not data.get('company'):
            comp_id = (
                request.data.get('company_id') or
                request.query_params.get('company_id') or
                (request.headers.get('X-Company-ID') if hasattr(request, 'headers') else None) or
                (request.headers.get('x-company-id') if hasattr(request, 'headers') else None) or
                getattr(request.user, 'company_id', None)
            )
            if comp_id:
                data['company'] = comp_id

        return data



    def create(self, request, *args, **kwargs):
        data = self._prepare_data(request)
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        post = serializer.save()

        self._process_multi_attachments(request, post)

        if post.schedule_type == 'IMMEDIATE':
            post.status = 'PROCESSING'
            post.save(update_fields=['status'])
            PublisherEngine.publish_post(post)
        elif post.schedule_type in ['ONE_TIME', 'DAILY_RECURRING', 'WEEKLY_RECURRING']:
            post.status = 'SCHEDULED'
            post.save(update_fields=['status'])


        headers = self.get_success_headers(serializer.data)
        return Response(self.get_serializer(post).data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = self._prepare_data(request)

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        post = serializer.save()

        if post.schedule_type in ['ONE_TIME', 'DAILY_RECURRING', 'WEEKLY_RECURRING']:
            post.status = 'SCHEDULED'
            post.last_published_at = None
            post.save(update_fields=['status', 'last_published_at'])

        if 'image_files' in request.FILES or 'video_files' in request.FILES:
            post.attachments.all().delete()

        self._process_multi_attachments(request, post)

        return Response(self.get_serializer(post).data)


    @action(detail=True, methods=['post'], url_path='publish-now')
    def publish_now(self, request, pk=None):
        post = self.get_object()
        if post.status == 'PROCESSING':
            return Response({'success': False, 'message': 'Post is already currently publishing'}, status=status.HTTP_400_BAD_REQUEST)
        post.status = 'PROCESSING'
        post.save(update_fields=['status'])
        result = PublisherEngine.publish_post(post)
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='copy')
    def copy_post(self, request, pk=None):
        original_post = self.get_object()
        
        target_days = request.data.get('target_days') or request.data.get('recurring_days')
        target_date = request.data.get('target_date') or request.data.get('scheduled_at')
        schedule_type = request.data.get('schedule_type')
        daily_time = request.data.get('daily_time')
        title = request.data.get('title')

        if isinstance(target_days, str):
            try:
                target_days = json.loads(target_days)
            except Exception:
                target_days = [target_days]

        if not target_days and not target_date and not schedule_type:
            schedule_type = original_post.schedule_type
            target_days = original_post.recurring_days
            target_date = original_post.scheduled_at

        new_post = SocialPost.objects.create(
            company=original_post.company,
            title=title or original_post.title,
            content=original_post.content,
            image_url=original_post.image_url,
            video_url=original_post.video_url,
            image_file=original_post.image_file,
            video_file=original_post.video_file,
            fb_post_type=original_post.fb_post_type,
            tiktok_post_type=original_post.tiktok_post_type,
            telegram_post_type=original_post.telegram_post_type,
            platforms=original_post.platforms or [],
            account_ids=original_post.account_ids or [],
            schedule_type=schedule_type or original_post.schedule_type,
            daily_time=daily_time or original_post.daily_time,
            recurring_days=target_days if target_days is not None else (original_post.recurring_days or []),
            is_active=original_post.is_active,
            status='SCHEDULED' if (schedule_type or original_post.schedule_type) != 'IMMEDIATE' else 'DRAFT',
            created_by=original_post.created_by,
        )

        if target_date:
            new_post.scheduled_at = make_aware_scheduled_at(target_date)

        if new_post.schedule_type == 'ONE_TIME' and not new_post.scheduled_at:
            new_post.scheduled_at = timezone.now()

        new_post.save()

        # Copy attachments
        for att in original_post.attachments.all():
            SocialPostAttachment.objects.create(
                post=new_post,
                media_type=att.media_type,
                file=att.file,
                url=att.url,
                order=att.order
            )

        return Response(self.get_serializer(new_post).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='move')
    def move_post(self, request, pk=None):
        post = self.get_object()
        from_day = request.data.get('from_day')
        target_day = request.data.get('target_day')
        target_date = request.data.get('target_date')

        if target_day:
            if post.schedule_type == 'WEEKLY_RECURRING':
                current_days = list(post.recurring_days or [])
                if from_day and from_day in current_days:
                    current_days.remove(from_day)
                if target_day not in current_days:
                    current_days.append(target_day)
                post.recurring_days = current_days
            else:
                post.schedule_type = 'WEEKLY_RECURRING'
                post.recurring_days = [target_day]
        elif target_date:
            post.schedule_type = 'ONE_TIME'
            post.scheduled_at = make_aware_scheduled_at(target_date)

        post.status = 'SCHEDULED'
        post.save()
        return Response(self.get_serializer(post).data, status=status.HTTP_200_OK)


class SocialPostLogViewSet(TenantViewSetMixin, viewsets.ReadOnlyModelViewSet):
    queryset = SocialPostLog.objects.all().order_by('-executed_at')
    serializer_class = SocialPostLogSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = getattr(self.request, 'user', None)

        company_id = (
            self.request.query_params.get('company_id') or 
            (self.request.headers.get('X-Company-ID') if hasattr(self.request, 'headers') else None) or
            (self.request.headers.get('x-company-id') if hasattr(self.request, 'headers') else None) or
            (self.request.META.get('HTTP_X_COMPANY_ID') if hasattr(self.request, 'META') else None)
        )

        if user and user.is_authenticated and getattr(user, 'is_superuser', False):
            if company_id and company_id != '':
                try:
                    cid = int(company_id)
                    return queryset.filter(Q(company_id=cid) | Q(post__company_id=cid) | Q(post__company__isnull=True))
                except (ValueError, TypeError):
                    pass
            return queryset

        if user and user.is_authenticated and getattr(user, 'company_id', None):
            return queryset.filter(Q(company_id=user.company_id) | Q(post__company_id=user.company_id) | Q(post__company__isnull=True))

        if company_id and company_id != '':
            try:
                cid = int(company_id)
                return queryset.filter(Q(company_id=cid) | Q(post__company_id=cid) | Q(post__company__isnull=True))
            except (ValueError, TypeError):
                pass

        return queryset
