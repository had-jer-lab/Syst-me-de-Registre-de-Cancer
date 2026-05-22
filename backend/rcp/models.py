from django.db import models
from django.contrib.auth import get_user_model
from patients.models import Cancer


User = get_user_model()


class RcpMeeting(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('ongoing',   'Ongoing'),
        ('closed',    'Closed'),
        ('cancelled', 'Cancelled'),
    ]

    cancer              = models.ForeignKey('patients.Cancer', on_delete=models.CASCADE, related_name='rcp_meetings')
    created_by          = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_rcps')
    meeting_datetime    = models.DateTimeField()
    status              = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    presentation_reason = models.TextField(blank=True, null=True)
    clinical_summary    = models.TextField(blank=True, null=True)
    vote_proposal       = models.TextField(blank=True, null=True)   # الاقتراح الحالي للتصويت
    vote_open           = models.BooleanField(default=False)         # هل التصويت مفتوح؟
    created_at          = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"RCP #{self.id} — {self.cancer.patient.full_name} ({self.status})"


class RcpParticipant(models.Model):
    rcp_meeting  = models.ForeignKey(RcpMeeting, on_delete=models.CASCADE, related_name='participants')
    user         = models.ForeignKey(User, on_delete=models.CASCADE)
    role_in_rcp  = models.CharField(max_length=100)

    class Meta:
        unique_together = ('rcp_meeting', 'user')


class RcpDiscussion(models.Model):
    """
    رسالة في المحادثة — يمكن أن تكون نصية أو صوتية.
    """
    MSG_TYPE_CHOICES = [
        ('text',  'Texte'),
        ('voice', 'Vocal'),
    ]

    rcp_meeting  = models.ForeignKey(RcpMeeting, on_delete=models.CASCADE, related_name='messages')
    user         = models.ForeignKey(User, on_delete=models.CASCADE)
    message      = models.TextField(blank=True, default='')          # للرسائل النصية
    msg_type     = models.CharField(max_length=10, choices=MSG_TYPE_CHOICES, default='text')
    audio_file   = models.FileField(upload_to='voice_messages/', null=True, blank=True)  # للرسائل الصوتية
    duration     = models.PositiveIntegerField(null=True, blank=True)  # مدة الصوت بالثواني
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"[{self.msg_type}] {self.user} @ RCP#{self.rcp_meeting_id}"


class RcpVote(models.Model):
    VOTE_CHOICES = [
        ('approve', 'Approve'),
        ('reject',  'Reject'),
        ('abstain', 'Abstain'),
    ]

    rcp_meeting  = models.ForeignKey(RcpMeeting, on_delete=models.CASCADE, related_name='votes')
    user         = models.ForeignKey(User, on_delete=models.CASCADE)
    vote_value   = models.CharField(max_length=20, choices=VOTE_CHOICES)

    class Meta:
        unique_together = ('rcp_meeting', 'user')


class RcpDecision(models.Model):
    rcp_meeting        = models.OneToOneField(RcpMeeting, on_delete=models.CASCADE, related_name='decision')
    decision_text      = models.TextField()
    treatment_protocol = models.TextField(blank=True, default='')
    signature_code     = models.CharField(max_length=64, blank=True, default='')
    validated_by       = models.ForeignKey(User, on_delete=models.CASCADE)
    validated_at       = models.DateTimeField(auto_now_add=True)


class RcpRapport(models.Model):
    rcp_meeting  = models.OneToOneField(RcpMeeting, on_delete=models.CASCADE, related_name='rapport')
    file         = models.FileField(upload_to='rapports/')
    generated_at = models.DateTimeField(auto_now_add=True)


class Notification(models.Model):
    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    rcp_meeting = models.ForeignKey(RcpMeeting, on_delete=models.CASCADE, null=True, blank=True)
    message     = models.TextField()
    is_read     = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']