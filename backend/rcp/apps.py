from django.apps import AppConfig


class RcpConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'rcp'
    verbose_name = 'Réunions RCP'


    def ready(self):
        # يشتغل مرة واحدة لما يبدأ Django
        import os
        # نتفادى التشغيل المزدوج في development
        if os.environ.get('RUN_MAIN') != 'true':
            return
        try:
            from . import scheduler
            scheduler.start()
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Scheduler error: {e}")