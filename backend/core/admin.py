from django.contrib import admin
from .models import School, User, Student, FeeTransaction, CBCAssessment

admin.site.register(School)
admin.site.register(User)
admin.site.register(Student)
admin.site.register(FeeTransaction)
admin.site.register(CBCAssessment)
