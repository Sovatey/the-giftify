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

class SocialAccountViewSet(viewsets.ModelViewSet):
    queryset = SocialAccount.objects.all().order_by('-created_at')
    serializer_class = SocialAccountSerializer
    permission_classes = [AllowAny]

    @action(detail=True, methods=['post'], url_path='test-connection')
    def test_connection(self, request, pk=None):
        account = self.get_object()
        dummy_post = SocialPost.objects.create(
            title="Connection Test",
            content="Testing social publisher integration from The Giftify POS.",
            schedule_type='IMMEDIATE',
            status='DRAFT'
        )
        
        try:
            if account.platform == 'facebook':
                res = FacebookPublisher.publish(account, dummy_post)
            elif account.platform == 'telegram':
                res = TelegramPublisher.publish(account, dummy_post)
            elif account.platform == 'tiktok':
                res = TikTokPublisher.publish(account, dummy_post)
            else:
                res = {'success': False, 'message': 'Unknown platform'}
        finally:
            dummy_post.delete()

        return Response(res, status=status.HTTP_200_OK if res['success'] else status.HTTP_400_BAD_REQUEST)

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


class SocialPostViewSet(viewsets.ModelViewSet):
    queryset = SocialPost.objects.all().order_by('-created_at')
    serializer_class = SocialPostSerializer
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

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

        return data



    def create(self, request, *args, **kwargs):
        data = self._prepare_data(request)
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        post = serializer.save()

        self._process_multi_attachments(request, post)

        if post.schedule_type == 'IMMEDIATE':
            PublisherEngine.publish_post(post)
        elif post.schedule_type in ['ONE_TIME', 'DAILY_RECURRING', 'WEEKLY_RECURRING']:
            post.status = 'SCHEDULED'
            post.save()


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
            post.save()

        self._process_multi_attachments(request, post)

        return Response(self.get_serializer(post).data)


    @action(detail=True, methods=['post'], url_path='publish-now')
    def publish_now(self, request, pk=None):
        post = self.get_object()
        result = PublisherEngine.publish_post(post)
        return Response(result, status=status.HTTP_200_OK)


class SocialPostLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SocialPostLog.objects.all().order_by('-executed_at')
    serializer_class = SocialPostLogSerializer
    permission_classes = [AllowAny]
