from django.db import models
from django.contrib.auth.models import AbstractUser

class School(models.Model):
    name = models.CharField(max_length=255)
    paybill_number = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Principal / Admin'),
        ('BURSAR', 'Bursar'),
        ('TEACHER', 'Teacher'),
        ('PARENT', 'Parent'),
    )
    school = models.ForeignKey(School, on_delete=models.CASCADE, null=True, blank=True)
    role = models.CharField(max_length=15, choices=ROLE_CHOICES, default='ADMIN')
    phone_number = models.CharField(max_length=15, unique=True, null=True, blank=True)

class Student(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    admission_number = models.CharField(max_length=50, unique=True)
    full_name = models.CharField(max_length=255)
    grade = models.CharField(max_length=20)
    parent = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, limit_choices_to={'role': 'PARENT'})
    fee_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.admission_number} - {self.full_name}"

class FeeTransaction(models.Model):
    PAYMENT_METHODS = (('MPESA', 'M-Pesa'), ('BANK', 'Bank Deposit'), ('CASH', 'Cash'))
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_code = models.CharField(max_length=50, unique=True)
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHODS, default='MPESA')
    created_at = models.DateTimeField(auto_now_add=True)

class CBCAssessment(models.Model):
    RUBRICS = (
        ('EE', 'Exceeding Expectations'),
        ('ME', 'Meeting Expectations'),
        ('AE', 'Approaching Expectations'),
        ('BE', 'Below Expectations'),
    )
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    subject = models.CharField(max_length=100)
    strand = models.CharField(max_length=150)
    rubric = models.CharField(max_length=2, choices=RUBRICS)
    term = models.CharField(max_length=20)
    teacher = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
