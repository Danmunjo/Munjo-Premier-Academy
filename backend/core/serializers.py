from rest_framework import serializers
from .models import Student, FeeTransaction, CBCAssessment, User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'phone_number']

class StudentSerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.username', read_only=True)
    parent_phone = serializers.CharField(source='parent.phone_number', read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'admission_number', 'full_name', 'grade',
            'fee_balance', 'parent', 'parent_name', 'parent_phone'
        ]

class FeeTransactionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)

    class Meta:
        model = FeeTransaction
        fields = [
            'id', 'student', 'student_name', 'admission_number',
            'amount', 'transaction_code', 'payment_method', 'created_at'
        ]

class CBCAssessmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)

    class Meta:
        model = CBCAssessment
        fields = [
            'id', 'student', 'student_name', 'admission_number',
            'subject', 'strand', 'rubric', 'term', 'teacher'
        ]
