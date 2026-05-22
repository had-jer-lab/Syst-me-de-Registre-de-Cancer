from django.urls import path
from . import views
from .views import check_pending_meetings, set_vote_proposal, close_vote

urlpatterns = [
    # ── Patients & Cancers ──────────────────────────────────────
    path('mes-patients/',                        views.mes_patients,           name='mes-patients'),
    path('patients/<int:patient_id>/cancers/',   views.patient_cancers,        name='patient-cancers'),
    path('medecins/',                            views.list_medecins,          name='list-medecins'),

    # ── Gestion RCP ─────────────────────────────────────────────
    path('create/',                          views.create_rcp,             name='create-rcp'),
    path('history/',                         views.my_rcp_history,         name='rcp-history'),
    path('<int:rcp_id>/',                   views.rcp_details,            name='rcp-details'),

    # ── Chat, Vote, Décision ────────────────────────────────────
    path('<int:rcp_id>/start/',             views.start_rcp,              name='rcp-start'),
    path('<int:rcp_id>/chat/',              views.add_message,            name='rcp-chat'),
    path('<int:rcp_id>/vote/',              views.vote,                   name='rcp-vote'),
    path('<int:rcp_id>/set-vote/',          set_vote_proposal,            name='rcp-set-vote'),
    path('<int:rcp_id>/close-vote/',        close_vote,                   name='rcp-close-vote'),
    path('<int:rcp_id>/validate/',          views.validate_decision,      name='rcp-validate'),

    # ── Rapport ─────────────────────────────────────────────────
    path('<int:rcp_id>/rapport/',           views.download_rapport,       name='rcp-rapport'),

    # ── Check pending meetings
    path('check-pending/',              check_pending_meetings,       name='check-pending'),

    # ── Notifications ────────────────────────────────────────────
    path('notifications/',                       views.get_notifications,      name='notifications'),
    path('notifications/<int:notif_id>/read/',   views.mark_notification_read, name='notif-read'),

    # ── Vérification QR (public) ────────────────────────────────
    path('verify/<int:rcp_id>/',                views.verify_rcp,             name='verify-rcp'),
]