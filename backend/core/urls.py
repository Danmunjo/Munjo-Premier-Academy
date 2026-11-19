from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StudentViewSet, FeeTransactionViewSet, CBCAssessmentViewSet,
    mpesa_c2b_confirmation, current_user
)

router = DefaultRouter()
router.register(r'students', StudentViewSet)
router.register(r'transactions', FeeTransactionViewSet)
router.register(r'assessments', CBCAssessmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('me/', current_user, name='current-user'),
    path('mpesa/c2b/confirm/', mpesa_c2b_confirmation, name='mpesa-c2b-confirm'),
]
