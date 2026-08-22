from rest_framework import serializers
from .models import SocialAccount, SocialPost, SocialPostAttachment, SocialPostLog

class SocialAccountSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True, allow_null=True)
    platform_display = serializers.CharField(source='get_platform_display', read_only=True)

    class Meta:
        model = SocialAccount
        fields = '__all__'


class SocialPostLogSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True, allow_null=True)

    class Meta:
        model = SocialPostLog
        fields = '__all__'


class SocialPostAttachmentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = SocialPostAttachment
        fields = '__all__'

    def get_file_url(self, obj):
        if obj.file:
            return obj.file.url
        return obj.url


class SocialPostSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True, allow_null=True)
    logs = SocialPostLogSerializer(many=True, read_only=True)
    attachments = SocialPostAttachmentSerializer(many=True, read_only=True)
    schedule_type_display = serializers.CharField(source='get_schedule_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    image_file_url = serializers.SerializerMethodField()
    video_file_url = serializers.SerializerMethodField()

    class Meta:
        model = SocialPost
        fields = '__all__'

    def get_image_file_url(self, obj):
        if obj.image_file:
            return obj.image_file.url
        return None

    def get_video_file_url(self, obj):
        if obj.video_file:
            return obj.video_file.url
        return None
