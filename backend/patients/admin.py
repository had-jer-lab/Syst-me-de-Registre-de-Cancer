from django.contrib import admin
from .models import *

# ─── Basic Model Registration ─────────────────────────────────────────────────
admin.site.register(Patient)
admin.site.register(Cancer)
admin.site.register(CancerType)
admin.site.register(Wilaya)
admin.site.register(Commune)
admin.site.register(Hospital)


# ─── Custom Field Admin ───────────────────────────────────────────────────────

@admin.register(CustomField)
class CustomFieldAdmin(admin.ModelAdmin):
    list_display = ('label', 'field_type', 'section', 'is_active', 'is_required', 'order')
    list_filter = ('field_type', 'section', 'is_active', 'is_required')
    search_fields = ('name', 'label', 'description')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Informations de base', {
            'fields': ('name', 'label', 'description')
        }),
        ('Configuration', {
            'fields': ('field_type', 'options', 'section', 'order')
        }),
        ('Paramètres', {
            'fields': ('is_required', 'is_active')
        }),
        ('Horodatage', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(CancerCustomValue)
class CancerCustomValueAdmin(admin.ModelAdmin):
    list_display = ('field', 'cancer', 'value_preview', 'updated_at')
    list_filter = ('field', 'created_at')
    search_fields = ('cancer__patient__first_name', 'cancer__patient__last_name', 'value')
    readonly_fields = ('created_at', 'updated_at')

    def value_preview(self, obj):
        return obj.value[:100] if obj.value else '—'
    value_preview.short_description = 'Valeur'
