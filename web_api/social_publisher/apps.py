import os
from django.apps import AppConfig

class SocialPublisherConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'social_publisher'

    def ready(self):
        try:
            from .scheduler import start_scheduler
            start_scheduler()
        except Exception as e:
            print(f"[SocialPublisher] Scheduler init notice: {e}")
