from django.contrib import admin
from .models import SocialAccount, SocialPost, SocialPostAttachment, SocialPostLog


class SocialPostAttachmentInline(admin.TabularInline):
    model = SocialPostAttachment
    extra = 0


@admin.register(SocialAccount)
class SocialAccountAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'platform', 'company', 'is_active', 'is_simulated', 'created_at')
    search_fields = ('name', 'page_id_or_chat_id')
    list_filter = ('platform', 'company', 'is_active')


@admin.register(SocialPost)
class SocialPostAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'company', 'status', 'schedule_type', 'scheduled_at', 'created_at')
    search_fields = ('title', 'content')
    list_filter = ('company', 'status', 'schedule_type')
    inlines = [SocialPostAttachmentInline]


@admin.register(SocialPostLog)
class SocialPostLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'post', 'company', 'platform', 'status', 'executed_at')
    search_fields = ('post__title', 'message')
    list_filter = ('company', 'status', 'platform', 'executed_at')
