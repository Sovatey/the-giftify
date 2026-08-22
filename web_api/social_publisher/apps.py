import os
import sys
from django.apps import AppConfig

class SocialPublisherConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'social_publisher'

    def ready(self):
        # Ensure scheduler starts in worker process for runserver or production servers
        if os.environ.get('RUN_MAIN') == 'true' or 'runserver' not in sys.argv:
            try:
                from .scheduler import start_scheduler
                start_scheduler()
            except Exception as e:
                print(f"[SocialPublisher] Scheduler init notice: {e}")

