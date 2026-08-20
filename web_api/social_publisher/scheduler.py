import logging
from apscheduler.schedulers.background import BackgroundScheduler
from django.utils import timezone
from datetime import datetime

logger = logging.getLogger(__name__)
scheduler = None

def check_and_publish_due_posts():
    """
    Background job running every 30-60s to check for posts due for posting:
    1. ONE_TIME scheduled posts whose timestamp has passed.
    2. DAILY_RECURRING posts whose daily_time matches current hour:minute,
       and haven't been published today.
    3. WEEKLY_RECURRING posts whose selected days (e.g. MON, TUE) match today,
       daily_time matches, and haven't been published today.
    """
    try:
        from .models import SocialPost
        from .publishers import PublisherEngine

        now = timezone.now()
        current_date = now.date()
        current_time = now.time()
        
        DAY_MAP = {0: 'MON', 1: 'TUE', 2: 'WED', 3: 'THU', 4: 'FRI', 5: 'SAT', 6: 'SUN'}
        today_code = DAY_MAP.get(now.weekday())

        # 1. Process ONE_TIME scheduled posts
        one_time_due = SocialPost.objects.filter(
            is_active=True,
            schedule_type='ONE_TIME',
            status='SCHEDULED',
            scheduled_at__lte=now
        )

        for post in one_time_due:
            logger.info(f"[AutoPoster] Triggering ONE_TIME scheduled post #{post.id}: {post.title}")
            PublisherEngine.publish_post(post)

        # 2. Process DAILY_RECURRING posts
        recurring_posts = SocialPost.objects.filter(
            is_active=True,
            schedule_type='DAILY_RECURRING',
            daily_time__isnull=False
        )

        for post in recurring_posts:
            already_ran_today = post.last_published_at and post.last_published_at.date() == current_date
            if not already_ran_today:
                post_time = post.daily_time
                if (current_time.hour > post_time.hour) or \
                   (current_time.hour == post_time.hour and current_time.minute >= post_time.minute):
                    logger.info(f"[AutoPoster] Triggering DAILY_RECURRING post #{post.id}: {post.title} (Daily at {post_time})")
                    PublisherEngine.publish_post(post)

        # 3. Process WEEKLY_RECURRING posts
        weekly_posts = SocialPost.objects.filter(
            is_active=True,
            schedule_type='WEEKLY_RECURRING',
            daily_time__isnull=False
        )

        for post in weekly_posts:
            days = post.recurring_days or []
            if today_code in days or now.weekday() in days:
                already_ran_today = post.last_published_at and post.last_published_at.date() == current_date
                if not already_ran_today:
                    post_time = post.daily_time
                    if (current_time.hour > post_time.hour) or \
                       (current_time.hour == post_time.hour and current_time.minute >= post_time.minute):
                        logger.info(f"[AutoPoster] Triggering WEEKLY_RECURRING post #{post.id}: {post.title} (Day: {today_code} at {post_time})")
                        PublisherEngine.publish_post(post)

    except Exception as e:
        logger.error(f"[AutoPoster Scheduler Error] {str(e)}")


def start_scheduler():
    global scheduler
    if scheduler and scheduler.running:
        return

    scheduler = BackgroundScheduler()
    scheduler.add_job(check_and_publish_due_posts, 'interval', seconds=30, id='auto_post_checker', replace_existing=True)
    scheduler.start()
    print("[SocialPublisher] Background Auto-Post Scheduler started successfully (Interval: 30s)")
