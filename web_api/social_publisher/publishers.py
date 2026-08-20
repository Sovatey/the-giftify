import os
import json
import requests
from django.utils import timezone
from .models import SocialAccount, SocialPost, SocialPostLog

DEFAULT_BASE_DOMAIN = os.environ.get('BASE_DOMAIN', 'http://127.0.0.1:8000')

def get_all_media_items(post: SocialPost, media_type='image'):
    items = []
    base_domain = DEFAULT_BASE_DOMAIN
    
    if media_type == 'image':
        if post.image_file:
            path = post.image_file.path if hasattr(post.image_file, 'path') else None
            url = f"{base_domain}{post.image_file.url}" if post.image_file.url.startswith('/') else post.image_file.url
            items.append({'type': 'image', 'file_path': path, 'url': url})
        elif post.image_url:
            url_str = post.image_url
            if url_str.startswith('/'):
                url_str = f"{base_domain}{url_str}"
            items.append({'type': 'image', 'file_path': None, 'url': url_str})

    elif media_type == 'video':
        if post.video_file:
            path = post.video_file.path if hasattr(post.video_file, 'path') else None
            url = f"{base_domain}{post.video_file.url}" if post.video_file.url.startswith('/') else post.video_file.url
            items.append({'type': 'video', 'file_path': path, 'url': url})
        elif post.video_url:
            url_str = post.video_url
            if url_str.startswith('/'):
                url_str = f"{base_domain}{url_str}"
            items.append({'type': 'video', 'file_path': None, 'url': url_str})

    # Attachments gallery items
    if post.pk:
        for att in post.attachments.filter(media_type=media_type.upper()):
            if att.file:
                path = att.file.path if hasattr(att.file, 'path') else None
                url = f"{base_domain}{att.file.url}" if att.file.url.startswith('/') else att.file.url
                items.append({'type': media_type, 'file_path': path, 'url': url})
            elif att.url:
                url_str = att.url
                if url_str.startswith('/'):
                    url_str = f"{base_domain}{url_str}"
                items.append({'type': media_type, 'file_path': None, 'url': url_str})

    # Deduplicate by url
    seen = set()
    unique_items = []
    for item in items:
        if item['url'] and item['url'] not in seen:
            seen.add(item['url'])
            unique_items.append(item)

    return unique_items


class FacebookPublisher:
    @staticmethod
    def publish(account: SocialAccount, post: SocialPost):
        image_items = get_all_media_items(post, 'image')
        video_items = get_all_media_items(post, 'video')
        post_type = post.fb_post_type or 'FEED'

        media_count = len(image_items) + len(video_items)

        if account.is_simulated or not account.access_token or not account.page_id_or_chat_id:
            msg_prefix = "[Simulated FB Reel]" if post_type == 'REEL' else "[Simulated FB Multi-Photo Album]" if len(image_items) > 1 else "[Simulated FB Post]"
            return {
                'success': True,
                'external_id': f"sim_fb_{int(timezone.now().timestamp())}",
                'message': f"{msg_prefix} Published successfully ({media_count} media items) to Page ID: {account.page_id_or_chat_id or 'Demo-Page-101'}"
            }
        
        page_id = account.page_id_or_chat_id
        access_token = account.access_token
        
        try:
            if post_type == 'REEL' or video_items:
                # Facebook Video / Reels Upload endpoint
                url = f"https://graph.facebook.com/v19.0/{page_id}/videos"
                data = {
                    'description': f"{post.title}\n\n{post.content}",
                    'access_token': access_token
                }
                
                vid_item = video_items[0] if video_items else None
                if vid_item and vid_item.get('file_path') and os.path.exists(vid_item['file_path']):
                    with open(vid_item['file_path'], 'rb') as vf:
                        response = requests.post(url, data=data, files={'source': vf}, timeout=60)
                else:
                    video_url = vid_item['url'] if vid_item else ''
                    data['file_url'] = video_url
                    response = requests.post(url, data=data, timeout=60)

            elif len(image_items) > 1:
                # Multi-photo album post (upload photos unpublished first, then attach to feed post)
                photo_ids = []
                for item in image_items:
                    upload_url = f"https://graph.facebook.com/v19.0/{page_id}/photos"
                    
                    if item.get('file_path') and os.path.exists(item['file_path']):
                        with open(item['file_path'], 'rb') as pf:
                            res = requests.post(upload_url, data={'published': 'false', 'access_token': access_token}, files={'source': pf}, timeout=30).json()
                    else:
                        res = requests.post(upload_url, data={'url': item['url'], 'published': 'false', 'access_token': access_token}, timeout=30).json()

                    if 'id' in res:
                        photo_ids.append({'media_fbid': res['id']})

                url = f"https://graph.facebook.com/v19.0/{page_id}/feed"
                payload = {
                    'message': f"{post.title}\n\n{post.content}",
                    'attached_media': photo_ids,
                    'access_token': access_token
                }
                response = requests.post(url, json=payload, timeout=20)

            elif image_items:
                # Single photo post
                url = f"https://graph.facebook.com/v19.0/{page_id}/photos"
                data = {
                    'caption': f"{post.title}\n\n{post.content}",
                    'access_token': access_token
                }
                img_item = image_items[0]
                if img_item.get('file_path') and os.path.exists(img_item['file_path']):
                    with open(img_item['file_path'], 'rb') as pf:
                        response = requests.post(url, data=data, files={'source': pf}, timeout=30)
                else:
                    data['url'] = img_item['url']
                    response = requests.post(url, data=data, timeout=30)

            else:
                # Standard text feed
                url = f"https://graph.facebook.com/v19.0/{page_id}/feed"
                data = {
                    'message': f"{post.title}\n\n{post.content}",
                    'access_token': access_token
                }
                response = requests.post(url, data=data, timeout=15)
            
            res_data = response.json()
            
            if response.status_code == 200 and ('id' in res_data or 'video_id' in res_data):
                ext_id = res_data.get('id') or res_data.get('video_id')
                return {
                    'success': True,
                    'external_id': ext_id,
                    'message': f'Successfully published Facebook {post_type}'
                }
            else:
                err_msg = res_data.get('error', {}).get('message', response.text)
                return {
                    'success': False,
                    'external_id': None,
                    'message': f"Facebook API Error ({post_type}): {err_msg}"
                }
        except Exception as e:
            return {
                'success': False,
                'external_id': None,
                'message': f"Facebook Exception: {str(e)}"
            }


class TelegramPublisher:
    @staticmethod
    def publish(account: SocialAccount, post: SocialPost):
        bot_token = account.app_id_or_bot_token
        chat_id = account.page_id_or_chat_id
        image_items = get_all_media_items(post, 'image')
        video_items = get_all_media_items(post, 'video')
        all_items = image_items + video_items
        post_type = post.telegram_post_type or ('VIDEO' if video_items else 'PHOTO' if image_items else 'TEXT')

        total_media_count = len(all_items)

        if account.is_simulated or not bot_token or not chat_id:
            msg_type = f"Media Album ({total_media_count} files)" if total_media_count > 1 else post_type
            return {
                'success': True,
                'external_id': f"sim_tg_{int(timezone.now().timestamp())}",
                'message': f"[Simulated Telegram Post] Sent {msg_type} successfully to Chat ID: {chat_id or '@demo_group'}"
            }
            
        try:
            caption_html = f"<b>{post.title}</b>\n\n{post.content}"
            file_handles = []

            # 1. Multi-media album (sendMediaGroup)
            if total_media_count > 1:
                url = f"https://api.telegram.org/bot{bot_token}/sendMediaGroup"
                media_group = []
                files = {}

                for idx, item in enumerate(all_items):
                    attach_name = f"media_{idx}"
                    if item.get('file_path') and os.path.exists(item['file_path']):
                        fh = open(item['file_path'], 'rb')
                        file_handles.append(fh)
                        files[attach_name] = (f"file_{idx}", fh)
                        media_ref = f"attach://{attach_name}"
                    else:
                        media_ref = item['url']

                    media_group.append({
                        'type': 'photo' if item['type'] == 'image' else 'video',
                        'media': media_ref,
                        'caption': caption_html if idx == 0 else '',
                        'parse_mode': 'HTML'
                    })


                data = {
                    'chat_id': chat_id,
                    'media': json.dumps(media_group)
                }
                response = requests.post(url, data=data, files=files if files else None, timeout=30)

            # 2. Single Video (sendVideo)
            elif post_type == 'VIDEO' and video_items:
                url = f"https://api.telegram.org/bot{bot_token}/sendVideo"
                data = {
                    'chat_id': chat_id,
                    'caption': caption_html,
                    'parse_mode': 'HTML'
                }
                item = video_items[0]
                if item.get('file_path') and os.path.exists(item['file_path']):
                    fh = open(item['file_path'], 'rb')
                    file_handles.append(fh)
                    response = requests.post(url, data=data, files={'video': fh}, timeout=30)
                else:
                    data['video'] = item['url']
                    response = requests.post(url, data=data, timeout=30)

            # 3. Single Photo (sendPhoto)
            elif post_type == 'PHOTO' and image_items:
                url = f"https://api.telegram.org/bot{bot_token}/sendPhoto"
                data = {
                    'chat_id': chat_id,
                    'caption': caption_html,
                    'parse_mode': 'HTML'
                }
                item = image_items[0]
                if item.get('file_path') and os.path.exists(item['file_path']):
                    fh = open(item['file_path'], 'rb')
                    file_handles.append(fh)
                    response = requests.post(url, data=data, files={'photo': fh}, timeout=30)
                else:
                    data['photo'] = item['url']
                    response = requests.post(url, data=data, timeout=30)

            # 4. Text Only (sendMessage)
            else:
                url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
                data = {
                    'chat_id': chat_id,
                    'text': caption_html,
                    'parse_mode': 'HTML'
                }
                response = requests.post(url, data=data, timeout=15)

            # Close open file handles
            for fh in file_handles:
                try:
                    fh.close()
                except Exception:
                    pass

            res_data = response.json()

            if res_data.get('ok'):
                msg_id = str(res_data.get('result', [{}])[0].get('message_id', '')) if isinstance(res_data.get('result'), list) else str(res_data.get('result', {}).get('message_id', ''))
                return {
                    'success': True,
                    'external_id': msg_id,
                    'message': f'Successfully sent Telegram post ({total_media_count} media files)'
                }
            else:
                err_msg = res_data.get('description', response.text)
                return {
                    'success': False,
                    'external_id': None,
                    'message': f"Telegram API Error: {err_msg}"
                }
        except Exception as e:
            return {
                'success': False,
                'external_id': None,
                'message': f"Telegram Exception: {str(e)}"
            }


class TikTokPublisher:
    @staticmethod
    def publish(account: SocialAccount, post: SocialPost):
        image_items = get_all_media_items(post, 'image')
        video_items = get_all_media_items(post, 'video')
        post_type = post.tiktok_post_type or ('PHOTO_CAROUSEL' if len(image_items) > 0 and not video_items else 'VIDEO')

        if account.is_simulated or not account.access_token:
            media_info = f"{len(image_items)} photos slideshow" if post_type == 'PHOTO_CAROUSEL' else "video"
            return {
                'success': True,
                'external_id': f"sim_tt_{int(timezone.now().timestamp())}",
                'message': f"[Simulated TikTok Post] Published ({media_info}) to user: {account.page_id_or_chat_id or 'TikTokUser_Demo'}"
            }

        try:
            url = "https://open.tiktokapis.com/v2/post/publish/content/init/"
            headers = {
                "Authorization": f"Bearer {account.access_token}",
                "Content-Type": "application/json; charset=UTF-8"
            }

            image_urls = [item['url'] for item in image_items if item.get('url')]
            video_urls = [item['url'] for item in video_items if item.get('url')]

            if post_type == 'PHOTO_CAROUSEL' or len(image_urls) > 1:
                body = {
                    "post_info": {
                        "title": post.title[:150],
                        "description": post.content,
                        "privacy_level": "PUBLIC_TO_EVERYONE",
                    },
                    "source_info": {
                        "source": "PULL_FROM_URL",
                        "photo_cover_index": 1,
                        "photo_images": image_urls
                    },
                    "post_mode": "MEDIA_UPLOAD"
                }
            else:
                body = {
                    "post_info": {
                        "title": post.title[:150],
                        "privacy_level": "PUBLIC_TO_EVERYONE",
                        "disable_duet": False,
                        "disable_stitch": False,
                        "disable_comment": False
                    },
                    "source_info": {
                        "source": "PULL_FROM_URL",
                        "video_url": video_urls[0] if video_urls else image_urls[0] if image_urls else ""
                    }
                }
            
            response = requests.post(url, headers=headers, json=body, timeout=15)
            res_data = response.json()
            
            if response.status_code == 200 and res_data.get('data', {}).get('publish_id'):
                pub_id = res_data['data']['publish_id']
                return {
                    'success': True,
                    'external_id': pub_id,
                    'message': f'Successfully initialized TikTok post ({len(image_urls)} items)'
                }
            else:
                err_msg = res_data.get('error', {}).get('message', response.text)
                return {
                    'success': False,
                    'external_id': None,
                    'message': f"TikTok API Error ({post_type}): {err_msg}"
                }
        except Exception as e:
            return {
                'success': False,
                'external_id': None,
                'message': f"TikTok Exception: {str(e)}"
            }


class PublisherEngine:
    @classmethod
    def publish_post(cls, post: SocialPost):
        target_platforms = post.platforms or []
        if not target_platforms:
            return {'success': False, 'message': 'No platforms selected for post'}

        overall_success = False

        for platform in target_platforms:
            account = SocialAccount.objects.filter(platform=platform, is_active=True).first()

            if not account:
                account = SocialAccount.objects.create(
                    platform=platform,
                    name=f"Default {platform.capitalize()} Account (Simulation)",
                    is_simulated=True,
                    is_active=True
                )

            if platform == 'facebook':
                result = FacebookPublisher.publish(account, post)
            elif platform == 'telegram':
                result = TelegramPublisher.publish(account, post)
            elif platform == 'tiktok':
                result = TikTokPublisher.publish(account, post)
            else:
                result = {'success': False, 'external_id': None, 'message': f'Unsupported platform: {platform}'}

            status_str = 'SUCCESS' if result['success'] else 'FAILED'
            SocialPostLog.objects.create(
                post=post,
                platform=platform,
                status=status_str,
                message=result['message'],
                external_post_id=result.get('external_id')
            )

            if result['success']:
                overall_success = True

        post.last_published_at = timezone.now()
        if post.schedule_type == 'ONE_TIME':
            post.status = 'PUBLISHED' if overall_success else 'FAILED'
        elif post.schedule_type == 'DAILY_RECURRING':
            post.status = 'PUBLISHED'
        elif post.schedule_type == 'IMMEDIATE':
            post.status = 'PUBLISHED' if overall_success else 'FAILED'

        post.save()
        return {'success': overall_success, 'post_id': post.id}
