from decimal import Decimal
from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .models import Student, FeeTransaction, CBCAssessment
from .serializers import (
    StudentSerializer, FeeTransactionSerializer,
    CBCAssessmentSerializer, UserSerializer
)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Returns logged-in user details and role (ADMIN, BURSAR, TEACHER, PARENT)"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

from .models import Student, FeeTransaction, CBCAssessment, School

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all().order_by('admission_number')
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        default_school = School.objects.first()
        serializer.save(school=default_school)


class FeeTransactionViewSet(viewsets.ModelViewSet):
    queryset = FeeTransaction.objects.all().order_by('-created_at')
    serializer_class = FeeTransactionSerializer
    permission_classes = [IsAuthenticated]

class CBCAssessmentViewSet(viewsets.ModelViewSet):
    queryset = CBCAssessment.objects.all().order_by('-id')
    serializer_class = CBCAssessmentSerializer
    permission_classes = [IsAuthenticated]

@api_view(['POST'])
@permission_classes([AllowAny])  # Safaricom Daraja servers hit this without a JWT token
def mpesa_c2b_confirmation(request):
    """
    Reconciles M-Pesa Paybill payments automatically using Student Admission Number.
    Prevents duplicate credits and uses atomic row locking.
    """
    data = request.data
    trans_id = str(data.get('TransID', '')).strip().upper()
    amount = Decimal(str(data.get('TransAmount', '0')))
    admission_no = str(data.get('BillRefNumber', '')).strip().upper()

    if not trans_id or amount <= 0 or not admission_no:
        return Response({"ResultCode": 1, "ResultDesc": "Invalid payload"}, status=status.HTTP_400_BAD_REQUEST)

    # Idempotency check: stop duplicate M-Pesa callbacks from crediting twice
    if FeeTransaction.objects.filter(transaction_code=trans_id).exists():
        return Response({"ResultCode": 0, "ResultDesc": "Already processed"}, status=status.HTTP_200_OK)

    try:
        with transaction.atomic():
            student = Student.objects.select_for_update().get(admission_number=admission_no)
            FeeTransaction.objects.create(
                student=student,
                amount=amount,
                transaction_code=trans_id,
                payment_method='MPESA'
            )
            student.fee_balance -= amount
            student.save()

        return Response({
            "ResultCode": 0,
            "ResultDesc": f"Accepted. New balance for {student.full_name}: KES {student.fee_balance}"
        }, status=status.HTTP_200_OK)

    except Student.DoesNotExist:
        return Response({"ResultCode": 1, "ResultDesc": "Admission number not found"}, status=status.HTTP_404_NOT_FOUND)
