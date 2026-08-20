from django.db import models
from django.utils import timezone

def social_media_upload_path(instance, filename):
    stamp = timezone.now().strftime('%Y%m%d_%H%M%S')
    return f"social_posts/{stamp}_{filename}"


class SocialAccount(models.Model):
    PLATFORM_CHOICES = (
        ('facebook', 'Facebook Page'),
        ('telegram', 'Telegram Group/Channel'),
        ('tiktok', 'TikTok Account'),
    )

    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    name = models.CharField(max_length=255, help_text="Account/Channel Name")
    app_id_or_bot_token = models.CharField(max_length=500, blank=True, null=True, help_text="App ID / Bot Token")
    page_id_or_chat_id = models.CharField(max_length=255, blank=True, null=True, help_text="Facebook Page ID / Telegram Chat ID / TikTok User ID")
    access_token = models.TextField(blank=True, null=True, help_text="OAuth / Page Access Token")
    is_active = models.BooleanField(default=True)
    is_simulated = models.BooleanField(default=False, help_text="If True, simulates API responses for testing without sending real network calls")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tbl_social_accounts"
        verbose_name = "Social Account"
        verbose_name_plural = "Social Accounts"

    def __str__(self):
        return f"{self.get_platform_display()} - {self.name}"


class SocialPost(models.Model):
    SCHEDULE_TYPE_CHOICES = (
        ('IMMEDIATE', 'Publish Immediately'),
        ('ONE_TIME', 'One-time Scheduled'),
        ('DAILY_RECURRING', 'Daily Recurring ("Set 1 time, work forever")'),
        ('WEEKLY_RECURRING', 'Weekly Recurring Days ("Mon, Tue, Wed...")'),
    )


    STATUS_CHOICES = (
        ('DRAFT', 'Draft'),
        ('SCHEDULED', 'Scheduled'),
        ('PUBLISHED', 'Published'),
        ('FAILED', 'Failed / Error'),
    )

    FB_POST_TYPE_CHOICES = (
        ('FEED', 'Facebook Post / Photo Feed'),
        ('REEL', 'Facebook Reel (Video)'),
        ('STORY', 'Facebook Story'),
    )

    TIKTOK_POST_TYPE_CHOICES = (
        ('VIDEO', 'TikTok Video'),
        ('PHOTO_CAROUSEL', 'TikTok Photo Slideshow'),
    )

    TELEGRAM_POST_TYPE_CHOICES = (
        ('PHOTO', 'Telegram Photo'),
        ('VIDEO', 'Telegram Video'),
        ('TEXT', 'Telegram Text Message'),
    )

    title = models.CharField(max_length=255)
    content = models.TextField(help_text="Post body / caption")
    image_url = models.CharField(max_length=1000, blank=True, null=True, help_text="Primary image URL")
    video_url = models.CharField(max_length=1000, blank=True, null=True, help_text="Primary video URL")
    
    image_file = models.FileField(upload_to=social_media_upload_path, blank=True, null=True, help_text="Primary image file")
    video_file = models.FileField(upload_to=social_media_upload_path, blank=True, null=True, help_text="Primary video file")

    fb_post_type = models.CharField(max_length=20, choices=FB_POST_TYPE_CHOICES, default='FEED')
    tiktok_post_type = models.CharField(max_length=20, choices=TIKTOK_POST_TYPE_CHOICES, default='VIDEO')
    telegram_post_type = models.CharField(max_length=20, choices=TELEGRAM_POST_TYPE_CHOICES, default='PHOTO')

    # Store selected platforms list e.g. ["facebook", "telegram", "tiktok"]
    platforms = models.JSONField(default=list, help_text="Array of target platform names")
    
    schedule_type = models.CharField(max_length=20, choices=SCHEDULE_TYPE_CHOICES, default='IMMEDIATE')
    scheduled_at = models.DateTimeField(blank=True, null=True, help_text="For ONE_TIME scheduled posts")
    daily_time = models.TimeField(blank=True, null=True, help_text="For DAILY_RECURRING & WEEKLY_RECURRING posts e.g. 09:00:00")
    recurring_days = models.JSONField(default=list, blank=True, null=True, help_text='Selected days for WEEKLY_RECURRING e.g. ["MON", "WED", "FRI"]')

    
    is_active = models.BooleanField(default=True, help_text="If false, auto-posting scheduler ignores this post")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    last_published_at = models.DateTimeField(blank=True, null=True)
    created_by = models.IntegerField(default=0, blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tbl_social_posts"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.schedule_type})"


class SocialPostAttachment(models.Model):
    MEDIA_TYPE_CHOICES = (
        ('IMAGE', 'Image'),
        ('VIDEO', 'Video'),
    )

    post = models.ForeignKey(SocialPost, on_delete=models.CASCADE, related_name='attachments')
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPE_CHOICES, default='IMAGE')
    file = models.FileField(upload_to=social_media_upload_path, blank=True, null=True)
    url = models.CharField(max_length=1000, blank=True, null=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "tbl_social_post_attachments"
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"[{self.media_type}] {self.file or self.url}"


class SocialPostLog(models.Model):
    STATUS_CHOICES = (
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
    )

    post = models.ForeignKey(SocialPost, on_delete=models.CASCADE, related_name='logs')
    platform = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    message = models.TextField(blank=True, null=True)
    external_post_id = models.CharField(max_length=255, blank=True, null=True)
    executed_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "tbl_social_post_logs"
        ordering = ['-executed_at']

    def __str__(self):
        return f"[{self.executed_at.strftime('%Y-%m-%d %H:%M')}] {self.platform} - {self.status}"
