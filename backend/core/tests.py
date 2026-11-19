from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from .models import School, Student, FeeTransaction

class MpesaWebhookTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.school = School.objects.create(name="Munjo Premier Academy", paybill_number="247247")
        self.student = Student.objects.create(
            school=self.school,
            admission_number="ADM001",
            full_name="Kiki Kiara",
            grade="Grade 5",
            fee_balance=Decimal("10000.00")
        )

    def test_mpesa_payment_reconciles_balance_and_blocks_duplicates(self):
        payload = {"TransID": "UNIQUE123", "TransAmount": 4000, "BillRefNumber": "ADM001"}

        # First webhook call should deduct KES 4,000
        res1 = self.client.post('/api/mpesa/c2b/confirm/', payload, format='json')
        self.assertEqual(res1.status_code, 200)
        self.student.refresh_from_db()
        self.assertEqual(self.student.fee_balance, Decimal("6000.00"))

        # Duplicate webhook retry with same TransID must NOT deduct again
        res2 = self.client.post('/api/mpesa/c2b/confirm/', payload, format='json')
        self.assertEqual(res2.status_code, 200)
        self.student.refresh_from_db()
        self.assertEqual(self.student.fee_balance, Decimal("6000.00"))
        self.assertEqual(FeeTransaction.objects.count(), 1)
