from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from io import BytesIO

# ✅ Import depuis patients
from patients.models import Cancer, Patient
from .models import (
    RcpMeeting, RcpParticipant, RcpDiscussion,
    RcpVote, RcpDecision, RcpRapport, Notification
)

User = get_user_model()


# ══════════════════════════════════════════════
# 🟢 MES PATIENTS
# ══════════════════════════════════════════════
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mes_patients(request):
    patients = Patient.objects.filter(
        created_by=request.user
    ).order_by('-created_at')

    data = []
    for p in patients:
        cancer = p.cancers.order_by('-created_at').first()
        data.append({
            "id":             p.id,
            "name":           p.full_name,
            "age":            p.age,
            "numero_dossier": p.numero_dossier,
            "sexe":           p.sexe,
            "stade":          cancer.stade_clinique if cancer else "",
            "cancer_type":    str(cancer.cancer_type) if cancer and cancer.cancer_type else "",
            "cancer_id":      cancer.id if cancer else None,
            "cancers_count":  p.cancers.count(),
        })
    return Response(data)


# ══════════════════════════════════════════════
# 🟢 CANCERS D'UN PATIENT
# ══════════════════════════════════════════════
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def patient_cancers(request, patient_id):
    patient = get_object_or_404(Patient, id=patient_id)
    cancers = patient.cancers.select_related('cancer_type').order_by('-created_at')

    data = []
    for c in cancers:
        rcp_count = RcpMeeting.objects.filter(cancer=c).count()
        data.append({
            "id":              c.id,
            "cancer_type":     str(c.cancer_type) if c.cancer_type else "Non spécifié",
            "stade":           c.stade_clinique or "—",
            "tnm":             c.tnm or "—",
            "grade":           c.grade or "—",
            "date_diagnostic": str(c.date_diagnostic) if c.date_diagnostic else None,
            "rcp_count":       rcp_count,
        })

    return Response({
        "patient_id":     patient.id,
        "patient_name":   patient.full_name,
        "age":            patient.age,
        "numero_dossier": patient.numero_dossier,
        "cancers":        data,
    })


# ══════════════════════════════════════════════
# 🟢 LISTE MÉDECINS
# ══════════════════════════════════════════════
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_medecins(request):
    users = User.objects.filter(
        role__in=['medecin']
    ).exclude(id=request.user.id)

    data = []
    for u in users:
        data.append({
            "id":            u.id,
            "name":          f"{u.prenom} {u.nom}".strip(),
            "email":         u.email,
            "role":          u.role,
            "specialite":    u.specialite,
            "etablissement": u.etablissement,
        })
    return Response(data)


# ══════════════════════════════════════════════
# 🟢 CREATE RCP + INVITE
# ══════════════════════════════════════════════
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_rcp(request):
    from django.utils.dateparse import parse_datetime
    from django.utils import timezone

    cancer = get_object_or_404(Cancer, id=request.data.get('cancer_id'))

    raw_dt     = request.data.get('meeting_datetime')
    meeting_dt = parse_datetime(str(raw_dt)) if raw_dt else None
    if meeting_dt and timezone.is_naive(meeting_dt):
        meeting_dt = timezone.make_aware(meeting_dt)

    rcp = RcpMeeting.objects.create(
        cancer=cancer,
        created_by=request.user,
        meeting_datetime=meeting_dt,
        status='scheduled',
        presentation_reason=request.data.get('presentation_reason', ''),
        clinical_summary=request.data.get('clinical_summary', ''),
    )
    rcp.refresh_from_db()

    # Le créateur est automatiquement participant
    RcpParticipant.objects.create(
        rcp_meeting=rcp,
        user=request.user,
        role_in_rcp="Présentateur"
    )

    invited = request.data.get('invited_users', [])
    for uid in invited:
        try:
            user = User.objects.get(id=uid)
            RcpParticipant.objects.get_or_create(
                rcp_meeting=rcp,
                user=user,
                defaults={'role_in_rcp': 'Participant'}
            )
            dt_str = rcp.meeting_datetime.strftime('%d/%m/%Y à %H:%M') if rcp.meeting_datetime else "—"
            Notification.objects.create(
                user=user,
                rcp_meeting=rcp,
                message=f"Nouveau RCP pour {cancer.patient.full_name} — le {dt_str}"
            )
        except User.DoesNotExist:
            pass

    return Response({"rcp_id": rcp.id, "message": "RCP créée avec succès"})


# ══════════════════════════════════════════════
# 🟢 DÉMARRER RCP
# ══════════════════════════════════════════════
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_rcp(request, rcp_id):
    """
    🔒 Règle de verrouillage :
    - Seul le créateur peut démarrer la réunion
    - La réunion doit être à l'heure prévue (ou passée) — vérification côté backend
    - Quand il démarre, tous les participants reçoivent une notification pour ouvrir la discussion
    """
    from django.utils import timezone

    rcp = get_object_or_404(RcpMeeting, id=rcp_id)

    # Seul le créateur
    if rcp.created_by != request.user:
        return Response({"error": "Seul le créateur peut démarrer la réunion"}, status=403)

    # Doit être scheduled
    if rcp.status != 'scheduled':
        return Response({"error": f"La réunion est déjà {rcp.status}"}, status=400)

    # 🔒 Vérification : on ne peut pas démarrer avant l'heure prévue
    now = timezone.now()
    if rcp.meeting_datetime and rcp.meeting_datetime > now:
        remaining = rcp.meeting_datetime - now
        minutes   = int(remaining.total_seconds() / 60)
        return Response({
            "error": f"La réunion ne peut pas démarrer avant l'heure prévue (encore {minutes} min)"
        }, status=403)

    rcp.status = 'ongoing'
    rcp.save()

    # 🔔 Notifier tous les participants (sauf le créateur)
    for participant in rcp.participants.select_related('user'):
        if participant.user != request.user:
            Notification.objects.create(
                user=participant.user,
                rcp_meeting=rcp,
                message=f"🟢 RCP démarrée maintenant — {rcp.cancer.patient.full_name} — cliquez pour rejoindre la discussion"
            )

    return Response({"message": "RCP démarrée", "status": "ongoing"})


# ══════════════════════════════════════════════
# 🟢 HISTORIQUE RCP
# ══════════════════════════════════════════════
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_rcp_history(request):
    meetings = RcpMeeting.objects.filter(
        participants__user=request.user
    ).select_related('cancer__patient', 'cancer__cancer_type').distinct().order_by('-created_at')

    data = []
    for m in meetings:
        patient       = m.cancer.patient
        decision_text = None
        if hasattr(m, 'decision'):
            decision_text = m.decision.decision_text

        data.append({
            "id":                m.id,
            "patient":           patient.full_name,
            "patient_id":        patient.id,
            "age":               patient.age,
            "stade":             m.cancer.stade_clinique,
            "cancer_type":       str(m.cancer.cancer_type) if m.cancer.cancer_type else "",
            "date":              m.meeting_datetime,
            "status":            m.status,
            "decision":          decision_text,
            "participants_count": m.participants.count(),
        })
    return Response(data)


# ══════════════════════════════════════════════
# 🟢 RCP DETAILS
# ══════════════════════════════════════════════
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def rcp_details(request, rcp_id):
    rcp     = get_object_or_404(RcpMeeting, id=rcp_id)
    patient = rcp.cancer.patient

    participants = []
    for p in rcp.participants.select_related('user'):
        participants.append({
            "id":    p.user.id,
            "name":  f"{p.user.prenom} {p.user.nom}".strip(),
            "role":  p.role_in_rcp,
            "email": p.user.email,
        })

    messages = []
    for m in rcp.messages.select_related('user').order_by('created_at'):
        msg_data = {
            "id":       m.id,
            "user":     f"{m.user.prenom} {m.user.nom}".strip(),
            "user_id":  m.user.id,
            "message":  m.message,
            "msg_type": m.msg_type,
            "time":     m.created_at.strftime("%H:%M"),
            "date":     m.created_at.strftime("%d/%m/%Y"),
        }
        # Inclure l'URL audio si c'est un message vocal
        if m.msg_type == 'voice' and m.audio_file:
            msg_data["audio_url"] = request.build_absolute_uri(m.audio_file.url)
            msg_data["duration"]  = _fmt_duration(m.duration or 0)
        messages.append(msg_data)

    # ── Vote details ─────────────────────────────────────────────
    is_creator = rcp.created_by == request.user

    votes = []
    if is_creator:
        for v in rcp.votes.select_related('user'):
            votes.append({
                "user": f"{v.user.prenom} {v.user.nom}".strip(),
                "vote": v.vote_value,
            })

    my_vote    = None
    user_vote  = rcp.votes.filter(user=request.user).first()
    if user_vote:
        my_vote = user_vote.vote_value

    vote_summary = {
        "approve": rcp.votes.filter(vote_value='approve').count(),
        "reject":  rcp.votes.filter(vote_value='reject').count(),
        "abstain": rcp.votes.filter(vote_value='abstain').count(),
        "total":   rcp.participants.count(),
        "voted":   rcp.votes.count(),
    }

    decision           = None
    treatment_protocol = ''
    signature_code     = ''
    rapport_url        = None

    if hasattr(rcp, 'decision'):
        decision           = rcp.decision.decision_text
        treatment_protocol = rcp.decision.treatment_protocol
        signature_code     = rcp.decision.signature_code
    if hasattr(rcp, 'rapport'):
        rapport_url = request.build_absolute_uri(rcp.rapport.file.url)

    return Response({
        "rcp_id":             rcp.id,
        "status":             rcp.status,
        "date":               rcp.meeting_datetime,
        "is_creator":         is_creator,
        "patient":            patient.full_name,
        "patient_id":         patient.id,
        "age":                patient.age,
        "numero_dossier":     patient.numero_dossier,
        "stade":              rcp.cancer.stade_clinique,
        "tnm":                rcp.cancer.tnm,
        "cancer_type":        str(rcp.cancer.cancer_type) if rcp.cancer.cancer_type else "",
        "participants":       participants,
        "messages":           messages,
        "votes":              votes,
        "vote_summary":       vote_summary,
        "vote_proposal":      rcp.vote_proposal or '',
        "vote_open":          rcp.vote_open,
        "my_vote":            my_vote,
        "decision":           decision,
        "treatment_protocol": treatment_protocol,
        "signature_code":     signature_code,
        "rapport_url":        rapport_url,
    })


# ══════════════════════════════════════════════
# 🟢 CHAT — Texte + Vocal
# ══════════════════════════════════════════════
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_message(request, rcp_id):
    """
    Accepte deux types de messages :
    • Texte  : Content-Type: application/json       → { "message": "..." }
    • Vocal  : Content-Type: multipart/form-data    → audio (file) + duration (int)
    DRF détecte automatiquement le parser selon le Content-Type.
    """
    rcp = get_object_or_404(RcpMeeting, id=rcp_id)

    if rcp.status == 'scheduled':
        return Response({"error": "La réunion n'a pas encore démarré"}, status=403)

    if rcp.status == 'closed':
        return Response({"error": "La réunion est fermée"}, status=403)

    # ── Détecter le type selon la présence d'un fichier audio ──────────────
    audio_file = request.FILES.get('audio')

    if audio_file:
        # ─── 🎤 Message Vocal ────────────────────────────────────────────────
        duration = 0
        try:
            duration = int(request.data.get('duration', 0))
        except (ValueError, TypeError):
            duration = 0

        msg = RcpDiscussion.objects.create(
            rcp_meeting=rcp,
            user=request.user,
            message='',
            msg_type='voice',
            duration=duration,
        )
        # Déduire l'extension depuis le nom ou le content-type du fichier
        content_type = audio_file.content_type or ''
        if 'ogg' in content_type:
            ext = 'ogg'
        elif 'mp4' in content_type or 'aac' in content_type:
            ext = 'm4a'
        else:
            ext = 'webm'

        name = f"voice_{rcp.id}_{msg.id}.{ext}"
        msg.audio_file.save(name, audio_file, save=True)

        resp = {
            "id":        msg.id,
            "user":      f"{request.user.prenom} {request.user.nom}".strip(),
            "user_id":   request.user.id,
            "message":   '',
            "msg_type":  'voice',
            "audio_url": request.build_absolute_uri(msg.audio_file.url),
            "duration":  _fmt_duration(duration),
            "time":      msg.created_at.strftime("%H:%M"),
            "date":      msg.created_at.strftime("%d/%m/%Y"),
        }
        notif_msg = f"🎤 Message vocal de {request.user.prenom} {request.user.nom}".strip()

    else:
        # ─── 💬 Message Texte (JSON) ─────────────────────────────────────────
        text = request.data.get('message', '').strip()
        if not text:
            return Response({"error": "Message vide"}, status=400)

        msg = RcpDiscussion.objects.create(
            rcp_meeting=rcp,
            user=request.user,
            message=text,
            msg_type='text',
        )
        resp = {
            "id":       msg.id,
            "user":     f"{request.user.prenom} {request.user.nom}".strip(),
            "user_id":  request.user.id,
            "message":  msg.message,
            "msg_type": 'text',
            "time":     msg.created_at.strftime("%H:%M"),
            "date":     msg.created_at.strftime("%d/%m/%Y"),
        }
        sender_name = f"{request.user.prenom} {request.user.nom}".strip()
        notif_msg   = f"💬 {sender_name}: {text[:60]}"

    # 🔔 Notifier les autres participants
    for participant in rcp.participants.select_related('user'):
        if participant.user != request.user:
            Notification.objects.create(
                user=participant.user,
                rcp_meeting=rcp,
                message=notif_msg
            )

    return Response(resp, status=201)


# ══════════════════════════════════════════════
# 🟢 SET VOTE PROPOSAL (créateur)
# ══════════════════════════════════════════════
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_vote_proposal(request, rcp_id):
    """
    Le créateur soumet une proposition au vote.
    Peut provenir d'un seul message ou d'une sélection multiple (multi-vote).
    Le frontend envoie { "proposal": "texte\n— autre texte" }
    """
    rcp = get_object_or_404(RcpMeeting, id=rcp_id)

    if rcp.created_by != request.user:
        return Response({"error": "Seul le créateur peut ouvrir un vote"}, status=403)

    if rcp.status != 'ongoing':
        return Response({"error": "La réunion doit être en cours"}, status=400)

    proposal = request.data.get('proposal', '').strip()
    if not proposal:
        return Response({"error": "Proposition requise"}, status=400)

    # Réinitialiser les anciens votes et ouvrir un nouveau vote
    rcp.votes.all().delete()
    rcp.vote_proposal = proposal
    rcp.vote_open     = True
    rcp.save()

    # 🔔 Notifier tous les participants
    for participant in rcp.participants.select_related('user'):
        if participant.user != request.user:
            Notification.objects.create(
                user=participant.user,
                rcp_meeting=rcp,
                message=f"🗳️ Vote ouvert : {proposal[:80]}"
            )

    return Response({"ok": True, "proposal": proposal})


# ══════════════════════════════════════════════
# 🟢 CLOSE VOTE (créateur)
# ══════════════════════════════════════════════
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def close_vote(request, rcp_id):
    rcp = get_object_or_404(RcpMeeting, id=rcp_id)
    if rcp.created_by != request.user:
        return Response({"error": "Seul le créateur peut fermer le vote"}, status=403)
    rcp.vote_open = False
    rcp.save()
    return Response({"ok": True})


# ══════════════════════════════════════════════
# 🟢 VOTE (participant)
# ══════════════════════════════════════════════
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vote(request, rcp_id):
    rcp = get_object_or_404(RcpMeeting, id=rcp_id)

    if not rcp.vote_open:
        return Response({"error": "Aucun vote en cours"}, status=400)

    vote_value = request.data.get('vote')
    if vote_value not in ['approve', 'reject', 'abstain']:
        return Response({"error": "Vote invalide"}, status=400)

    # Empêcher de voter deux fois
    if RcpVote.objects.filter(rcp_meeting=rcp, user=request.user).exists():
        return Response({"error": "Vous avez déjà voté"}, status=400)

    RcpVote.objects.create(
        rcp_meeting=rcp,
        user=request.user,
        vote_value=vote_value
    )

    summary = {
        "approve": rcp.votes.filter(vote_value='approve').count(),
        "reject":  rcp.votes.filter(vote_value='reject').count(),
        "abstain": rcp.votes.filter(vote_value='abstain').count(),
        "total":   rcp.participants.count(),
        "voted":   rcp.votes.count(),
    }

    return Response({"ok": True, "vote_summary": summary, "my_vote": vote_value})


# ══════════════════════════════════════════════
# 🟢 VALIDATE DECISION + PDF
# ══════════════════════════════════════════════
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_decision(request, rcp_id):
    rcp = get_object_or_404(RcpMeeting, id=rcp_id)

    if rcp.created_by != request.user:
        return Response({"error": "Seul le créateur de la RCP peut valider la décision finale."}, status=403)

    if rcp.status != 'ongoing':
        return Response({"error": "La réunion doit être en cours pour valider une décision."}, status=400)

    import hashlib, datetime
    decision_text      = request.data.get('decision_text', '').strip()
    treatment_protocol = request.data.get('treatment_protocol', '').strip()

    if not decision_text:
        return Response({"error": "Décision requise"}, status=400)

    raw            = f"{rcp.id}-{request.user.email}-{decision_text[:30]}-{datetime.datetime.now().isoformat()}"
    signature_code = hashlib.sha256(raw.encode()).hexdigest()[:16].upper()

    RcpDecision.objects.update_or_create(
        rcp_meeting=rcp,
        defaults={
            'decision_text':      decision_text,
            'treatment_protocol': treatment_protocol,
            'signature_code':     signature_code,
            'validated_by':       request.user,
        }
    )

    rcp.status = 'closed'
    rcp.save()

    try:
        _generate_rapport(rcp)
    except Exception as e:
        return Response({"message": "Décision validée, erreur PDF", "error": str(e)}, status=207)

    # 🔔 Notifier les participants de la décision finale
    for participant in rcp.participants.select_related('user'):
        if participant.user != request.user:
            Notification.objects.create(
                user=participant.user,
                rcp_meeting=rcp,
                message=f"✅ Décision validée pour {rcp.cancer.patient.full_name} : {decision_text[:80]}"
            )

    return Response({"message": "RCP clôturée, rapport généré"})


# ══════════════════════════════════════════════
# 🟢 DOWNLOAD RAPPORT
# ══════════════════════════════════════════════
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_rapport(request, rcp_id):
    rcp = get_object_or_404(RcpMeeting, id=rcp_id)
    if not hasattr(rcp, 'rapport'):
        return Response({"error": "Rapport non disponible"}, status=404)
    return Response({"url": request.build_absolute_uri(rcp.rapport.file.url)})


# ══════════════════════════════════════════════
# 🟢 VERIFY QR
# ══════════════════════════════════════════════
@api_view(['GET'])
@permission_classes([AllowAny])
def verify_rcp(request, rcp_id):
    rapport = RcpRapport.objects.filter(rcp_meeting_id=rcp_id).first()
    if not rapport:
        return Response({"valid": False, "message": "Rapport non valide"})

    rcp = rapport.rcp_meeting
    return Response({
        "valid":    True,
        "message":  "Rapport authentique",
        "patient":  rcp.cancer.patient.full_name,
        "date":     rcp.meeting_datetime,
        "decision": rcp.decision.decision_text if hasattr(rcp, 'decision') else None,
    })


# ══════════════════════════════════════════════
# 🟢 CHECK PENDING — يُستدعى كل دقيقة من Frontend
# ══════════════════════════════════════════════
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_pending_meetings(request):
    """
    يفحص الـ RCP المجدولة التي حان موعدها.
    يرسل إشعار [RAPPEL] للمنشئ ليضغط ▶ Démarrer.
    لا يفتح المناقشة تلقائياً — القرار للمنشئ فقط.
    """
    from django.utils import timezone
    now = timezone.now()

    pending = RcpMeeting.objects.filter(
        status='scheduled',
        meeting_datetime__lte=now,
    ).select_related('cancer__patient', 'created_by')

    notified_count = 0
    for rcp in pending:
        patient_name = rcp.cancer.patient.full_name
        dt_str       = rcp.meeting_datetime.strftime('%d/%m/%Y à %H:%M')

        for participant in rcp.participants.select_related('user'):
            user = participant.user

            # Éviter les doublons de notification RAPPEL
            already = Notification.objects.filter(
                user=user, rcp_meeting=rcp, message__startswith="[RAPPEL]"
            ).exists()

            if not already:
                if user == rcp.created_by:
                    msg = (
                        f"[RAPPEL] ⏰ Votre RCP pour {patient_name} ({dt_str}) "
                        f"a commencé. Veuillez démarrer la réunion."
                    )
                else:
                    msg = (
                        f"[RAPPEL] ⏰ La RCP pour {patient_name} ({dt_str}) "
                        f"a commencé. En attente du démarrage par le responsable."
                    )
                Notification.objects.create(user=user, rcp_meeting=rcp, message=msg)
                notified_count += 1

    return Response({"checked": pending.count(), "notified": notified_count})


# ══════════════════════════════════════════════
# 🟢 NOTIFICATIONS
# ══════════════════════════════════════════════
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    notifs = Notification.objects.filter(user=request.user).order_by('-created_at')[:20]
    data = []
    for n in notifs:
        data.append({
            "id":         n.id,
            "message":    n.message,
            "is_read":    n.is_read,
            "created_at": n.created_at,
            "rcp_id":     n.rcp_meeting_id,
            "patient":    n.rcp_meeting.cancer.patient.full_name if n.rcp_meeting else None,
        })
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notif_id):
    notif = get_object_or_404(Notification, id=notif_id, user=request.user)
    notif.is_read = True
    notif.save()
    return Response({"ok": True})


# ══════════════════════════════════════════════
# 🔒 HELPERS
# ══════════════════════════════════════════════
def _fmt_duration(seconds):
    """Convertit des secondes en mm:ss"""
    s = int(seconds)
    return f"{s // 60}:{str(s % 60).padStart(2, '0')}" if False else f"{s // 60}:{s % 60:02d}"


def _generate_rapport(rcp):
    try:
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        import qrcode
        import platform, os
    except ImportError:
        raise Exception("Installer: pip install reportlab qrcode[pil]")

    # Enregistrer une police Unicode selon l'OS
    if platform.system() == 'Windows':
        font_paths      = [r'C:\Windows\Fonts\arial.ttf',    r'C:\Windows\Fonts\calibri.ttf']
        font_bold_paths = [r'C:\Windows\Fonts\arialbd.ttf',  r'C:\Windows\Fonts\calibrib.ttf']
    else:
        font_paths      = ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
                           '/usr/share/fonts/truetype/freefont/FreeSans.ttf']
        font_bold_paths = ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
                           '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf']

    FONT_NAME = 'Helvetica'
    FONT_BOLD = 'Helvetica-Bold'
    for fp, fb in zip(font_paths, font_bold_paths):
        if os.path.exists(fp) and os.path.exists(fb):
            try:
                pdfmetrics.registerFont(TTFont('UniFont',      fp))
                pdfmetrics.registerFont(TTFont('UniFont-Bold', fb))
                FONT_NAME = 'UniFont'
                FONT_BOLD = 'UniFont-Bold'
            except Exception:
                pass
            break

    buffer  = BytesIO()
    doc     = SimpleDocTemplate(buffer, pagesize=A4, topMargin=40, bottomMargin=40)
    styles  = getSampleStyleSheet()

    for s in styles.byName.values():
        s.fontName = FONT_NAME

    elements = []
    patient  = rcp.cancer.patient

    title_style = ParagraphStyle('title', parent=styles['Heading1'], fontSize=16,
                                 fontName=FONT_BOLD,
                                 textColor=colors.HexColor('#1a2f6b'), spaceAfter=6)
    elements.append(Paragraph("COMPTE RENDU — RÉUNION DE CONCERTATION PLURIDISCIPLINAIRE", title_style))
    elements.append(Spacer(1, 10))

    info_data = [
        ["Patient",     patient.full_name,      "Dossier",  patient.numero_dossier],
        ["Âge",         f"{patient.age} ans",   "Sexe",     patient.get_sexe_display()],
        ["Type cancer", str(rcp.cancer.cancer_type) if rcp.cancer.cancer_type else "—",
         "Stade",       rcp.cancer.stade_clinique or "—"],
        ["TNM",         rcp.cancer.tnm or "—",  "Date RCP", rcp.meeting_datetime.strftime("%d/%m/%Y %H:%M")],
    ]
    t = Table(info_data, colWidths=[100, 150, 100, 150])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#EEF2FF')),
        ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#EEF2FF')),
        ('FONTNAME',   (0, 0), (-1, -1), FONT_NAME),
        ('FONTSIZE',   (0, 0), (-1, -1), 10),
        ('GRID',       (0, 0), (-1, -1), 0.5, colors.HexColor('#DDE4F3')),
        ('PADDING',    (0, 0), (-1, -1), 6),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 16))

    elements.append(Paragraph("Participants", styles['Heading2']))
    for p in rcp.participants.select_related('user'):
        full_name = f"{p.user.prenom} {p.user.nom}".strip()
        elements.append(Paragraph(f"• {full_name} — {p.role_in_rcp}", styles['Normal']))
    elements.append(Spacer(1, 12))

    approve = rcp.votes.filter(vote_value='approve').count()
    reject  = rcp.votes.filter(vote_value='reject').count()
    abstain = rcp.votes.filter(vote_value='abstain').count()
    elements.append(Paragraph("Résultats du Vote", styles['Heading2']))
    elements.append(Paragraph(f"Approuvé : {approve}   Rejeté : {reject}   Abstention : {abstain}", styles['Normal']))
    elements.append(Spacer(1, 12))

    if hasattr(rcp, 'decision'):
        dec = rcp.decision

        elements.append(Paragraph("Décision Finale", styles['Heading2']))
        elements.append(Paragraph(dec.decision_text, styles['Normal']))
        elements.append(Spacer(1, 12))

        if dec.treatment_protocol:
            elements.append(Paragraph("Protocole de Traitement", styles['Heading2']))
            for line in dec.treatment_protocol.strip().split('\n'):
                if line.strip():
                    elements.append(Paragraph(f"• {line.strip()}", styles['Normal']))
            elements.append(Spacer(1, 16))

        doctor      = dec.validated_by
        doctor_name = f"{doctor.prenom} {doctor.nom}".strip()
        validated_at = dec.validated_at.strftime('%d/%m/%Y à %H:%M') if dec.validated_at else ''

        sig_data = [
            ["Validé par :",       doctor_name],
            ["Spécialité :",       doctor.specialite or '—'],
            ["Établissement :",    doctor.etablissement or '—'],
            ["Date de validation :", validated_at],
            ["Code de signature :", dec.signature_code or '—'],
        ]
        sig_table = Table(sig_data, colWidths=[130, 370])
        sig_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#EBF4FF')),
            ('FONTNAME',   (0, 0), (0, -1), FONT_BOLD),
            ('FONTNAME',   (1, 0), (1, -1), FONT_NAME),
            ('FONTSIZE',   (0, 0), (-1, -1), 10),
            ('GRID',       (0, 0), (-1, -1), 0.5, colors.HexColor('#BEE3F8')),
            ('PADDING',    (0, 0), (-1, -1), 7),
            ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#1a2f6b')),
            ('TEXTCOLOR',  (0, 4), (-1, 4), colors.white),
            ('FONTNAME',   (0, 4), (-1, 4), FONT_BOLD),
            ('FONTSIZE',   (0, 4), (-1, 4), 11),
        ]))
        elements.append(Paragraph("Signature Numérique", styles['Heading2']))
        elements.append(sig_table)
        elements.append(Spacer(1, 20))

    qr_url = f"http://localhost:8000/api/rcp/verify/{rcp.id}/"
    qr_img = qrcode.make(qr_url)
    qr_buf = BytesIO()
    qr_img.save(qr_buf, format='PNG')
    qr_buf.seek(0)
    elements.append(Paragraph("Vérification d'authenticité", styles['Heading3']))
    elements.append(Paragraph("Scannez le QR code pour vérifier l'authenticité de ce document.", styles['Normal']))
    elements.append(RLImage(qr_buf, width=100, height=100))

    doc.build(elements)

    rapport, _ = RcpRapport.objects.get_or_create(rcp_meeting=rcp)
    rapport.file.save(
        f"RCP_{rcp.id}_{patient.numero_dossier}.pdf",
        ContentFile(buffer.getvalue()),
        save=True
    )