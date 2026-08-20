import os
from django.apps import AppConfig

class SocialPublisherConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'social_publisher'

    def ready(self):
        # Prevent scheduler from starting twice during Django dev server reloads
        if os.environ.get('RUN_MAIN') == 'true' or not os.environ.get('DJANGO_SETTINGS_MODULE'):
            try:
                from .scheduler import start_scheduler
                start_scheduler()
            except Exception as e:
                print(f"[SocialPublisher] Scheduler init notice: {e}")
