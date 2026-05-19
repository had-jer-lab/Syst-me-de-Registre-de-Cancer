import logging
from django_apscheduler.jobstores import DjangoJobStore
from apscheduler.schedulers.background import BackgroundScheduler
from django.utils import timezone

logger = logging.getLogger(__name__)


def send_reminders():
    """
    يشتغل كل 20 دقيقة — يرسل إشعارات:
    - 24h قبل الاجتماع
    - 1h  قبل الاجتماع
    """
    try:
        from .models import RcpMeeting, Notification

        now = timezone.now()

        # ── 24h قبل ──────────────────────────────────────
        in_24h_start = now + timezone.timedelta(hours=23, minutes=50)
        in_24h_end   = now + timezone.timedelta(hours=24, minutes=10)

        meetings_24h = RcpMeeting.objects.filter(
            status='scheduled',
            meeting_datetime__range=(in_24h_start, in_24h_end)
        ).select_related('cancer__patient')

        for rcp in meetings_24h:
            patient_name = rcp.cancer.patient.full_name
            dt_str       = rcp.meeting_datetime.strftime('%d/%m/%Y à %H:%M')

            for participant in rcp.participants.select_related('user'):
                already = Notification.objects.filter(
                    user=participant.user,
                    rcp_meeting=rcp,
                    message__startswith="[RAPPEL 24H]"
                ).exists()
                if not already:
                    Notification.objects.create(
                        user=participant.user,
                        rcp_meeting=rcp,
                        message=f"[RAPPEL 24H] ⏰ Demain vous avez une RCP pour {patient_name} à {dt_str}"
                    )
                    logger.info(f"Rappel 24h envoyé à {participant.user} pour {patient_name}")

        # ── 1h قبل ───────────────────────────────────────
        in_1h_start = now + timezone.timedelta(minutes=50)
        in_1h_end   = now + timezone.timedelta(minutes=70)

        meetings_1h = RcpMeeting.objects.filter(
            status='scheduled',
            meeting_datetime__range=(in_1h_start, in_1h_end)
        ).select_related('cancer__patient')

        for rcp in meetings_1h:
            patient_name = rcp.cancer.patient.full_name
            dt_str       = rcp.meeting_datetime.strftime('%H:%M')

            for participant in rcp.participants.select_related('user'):
                already = Notification.objects.filter(
                    user=participant.user,
                    rcp_meeting=rcp,
                    message__startswith="[RAPPEL 1H]"
                ).exists()
                if not already:
                    Notification.objects.create(
                        user=participant.user,
                        rcp_meeting=rcp,
                        message=f"[RAPPEL 1H] ⏰ Dans 1 heure RCP pour {patient_name} à {dt_str}"
                    )
                    logger.info(f"Rappel 1h envoyé à {participant.user} pour {patient_name}")

    except Exception as e:
        logger.error(f"Erreur send_reminders: {e}")


def start():
    scheduler = BackgroundScheduler(timezone=str(timezone.get_current_timezone()))
    scheduler.add_jobstore(DjangoJobStore(), "default")
    scheduler.add_job(
        send_reminders,
        'interval',
        minutes=20,
        id='send_reminders',
        replace_existing=True,
    )
    try:
        scheduler.start()
        logger.info("✅ Scheduler RCP démarré")
    except Exception as e:
        logger.error(f"Erreur démarrage scheduler: {e}")