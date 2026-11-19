import React, { useState, useEffect } from 'react';
import api from './api';
import axios from 'axios';
import {
  School, Wallet, BookOpen, LogOut, Smartphone,
  CheckCircle, AlertCircle, Users, Receipt, UserPlus, Printer
} from 'lucide-react';


export default function App() {
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState('fees');
  const [students, setStudents] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [notification, setNotification] = useState(null);

  // M-Pesa Simulator State
  const [mpesaAdm, setMpesaAdm] = useState('ADM001');
  const [mpesaAmount, setMpesaAmount] = useState('2500');
  const [mpesaCode, setMpesaCode] = useState('TKL9021ABC');

  // CBC Grading Form State
  const [selectedStudent, setSelectedStudent] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [strand, setStrand] = useState('Numbers & Algebra');
  const [rubric, setRubric] = useState('EE');
  const [term, setTerm] = useState('Term 1 2026');
   // New Student Form State
const [showEnrollModal, setShowEnrollModal] = useState(false);
const [newAdm, setNewAdm] = useState('');
const [newName, setNewName] = useState('');
const [newGrade, setNewGrade] = useState('Grade 4');
const [newBalance, setNewBalance] = useState('18000');
const [reportStudent, setReportStudent] = useState(null);

  
 
  

  const showToast = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchDashboardData = async () => {
    try {
      const [studRes, txRes, cbcRes] = await Promise.all([
        api.get('students/'),
        api.get('transactions/'),
        api.get('assessments/'),
      ]);
      setStudents(studRes.data);
      setTransactions(txRes.data);
      setAssessments(cbcRes.data);
      if (studRes.data.length > 0 && !selectedStudent) {
        setSelectedStudent(studRes.data[0].id);
      }

    } catch (err) {
      if (err.response?.status === 401) handleLogout();
    }
  };

  useEffect(() => {
    if (token) fetchDashboardData();
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await api.post('token/', { username, password });
      localStorage.setItem('access_token', res.data.access);
      setToken(res.data.access);
    } catch {
      setLoginError('Invalid username or password. Use your Django superuser login.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
  };

  const handleSimulateMpesa = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:8080/api/mpesa/c2b/confirm/', {
        TransID: mpesaCode,
        TransAmount: parseFloat(mpesaAmount),
        BillRefNumber: mpesaAdm,
      });
      showToast('success', res.data.ResultDesc);
      setMpesaCode('MP' + Math.floor(10000000 + Math.random() * 90000000));
      fetchDashboardData();
    } catch (err) {
      showToast('error', err.response?.data?.ResultDesc || 'M-Pesa reconciliation failed');
    }
  };


  const handleAddCBC = async (e) => {
    e.preventDefault();
    try {
      await api.post('assessments/', {
        student: selectedStudent,
        subject,
        strand,
        rubric,
        term,
      });
      showToast('success', 'CBC Assessment saved successfully!');
      fetchDashboardData();
    } catch {
      showToast('error', 'Failed to save CBC assessment');
    }
  };


const handleAddStudent = async (e) => {
  e.preventDefault();
  try {
    await api.post('students/', {
      admission_number: newAdm.trim().toUpperCase(),
      full_name: newName.trim(),
      grade: newGrade,
      fee_balance: parseFloat(newBalance),
    });
    showToast('success', `${newName} enrolled successfully!`);
    setShowEnrollModal(false);
    setNewAdm('');
    setNewName('');
    fetchDashboardData();
  } catch {
    showToast('error', 'Failed to enroll student. Check if Admission No already exists.');
  }
};



  // 1. LOGIN SCREEN
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-emerald-600 p-3 rounded-xl text-white">
              <School size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">ShuleERP Kenya</h1>
              <p className="text-sm text-slate-500">CBC & M-Pesa School Management</p>
            </div>
          </div>

          {loginError && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4 flex items-center gap-2">
              <AlertCircle size={16} /> {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter admin username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg transition"
            >
              Sign In to Portal
            </button>
          </form>
        </div>
      </div>
    );
  }

  const totalArrears = students.reduce((sum, s) => sum + parseFloat(s.fee_balance), 0);
  const totalCollected = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

  // 2. MAIN DASHBOARD
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navbar */}
      <nav className="bg-emerald-800 text-white px-6 py-4 flex justify-between items-center shadow">
        <div className="flex items-center gap-3">
          <School size={26} />
          <span className="font-bold text-lg">Munjo Premier Academy — ShuleERP</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('fees')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 ${activeTab === 'fees' ? 'bg-white text-emerald-900' : 'hover:bg-emerald-700'
              }`}
          >
            <Wallet size={16} /> Fees & M-Pesa
          </button>
          <button
            onClick={() => setActiveTab('cbc')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 ${activeTab === 'cbc' ? 'bg-white text-emerald-900' : 'hover:bg-emerald-700'
              }`}
          >
            <BookOpen size={16} /> CBC Grading
          </button>
          <button
            onClick={handleLogout}
            className="bg-emerald-900 hover:bg-red-600 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      {/* Toast Notification */}
      {notification && (
        <div className={`max-w-6xl mx-auto mt-4 px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-medium ${notification.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
          }`}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {notification.message}
        </div>
      )}

      <main className="max-w-6xl mx-auto p-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 text-sm mb-1">
              <span>Enrolled Students</span>
              <Users size={18} className="text-emerald-600" />
            </div>
            <p className="text-3xl font-bold text-slate-800">{students.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 text-sm mb-1">
              <span>M-Pesa Collections</span>
              <Receipt size={18} className="text-emerald-600" />
            </div>
            <p className="text-3xl font-bold text-emerald-600">KES {totalCollected.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 text-sm mb-1">
              <span>Pending Fee Arrears</span>
              <Wallet size={18} className="text-amber-600" />
            </div>
            <p className="text-3xl font-bold text-amber-600">KES {totalArrears.toLocaleString()}</p>
          </div>
        </div>

        {/* TAB 1: FEES & M-PESA RECONCILIATION */}
        {activeTab === 'fees' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Student Balances Table */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Student Fee Balances</h2>
              <button
                onClick={() => setShowEnrollModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <UserPlus size={15} /> Enroll Student
              </button>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-xs">
                    <tr>
                      <th className="p-3">Adm No</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Grade</th>
                      <th className="p-3 text-right">Fee Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {students.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-semibold text-emerald-700">{s.admission_number}</td>
                        <td className="p-3 font-medium text-slate-800">{s.full_name}</td>
                        <td className="p-3 text-slate-600">{s.grade}</td>
                        <td className="p-3 text-right font-bold text-slate-800"> <button
                          onClick={() => setReportStudent(s)}
                          className="text-emerald-700 hover:underline text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <Printer size={14} /> Report
                        </button>
                          KES {parseFloat(s.fee_balance).toLocaleString()}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="text-md font-bold text-slate-800 mt-8 mb-3">Recent M-Pesa Paybill Receipts</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-xs">
                    <tr>
                      <th className="p-3">M-Pesa Code</th>
                      <th className="p-3">Adm No</th>
                      <th className="p-3">Student</th>
                      <th className="p-3 text-right">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {transactions.map((t) => (
                      <tr key={t.id}>
                        <td className="p-3 font-mono text-xs bg-emerald-50 text-emerald-800">{t.transaction_code}</td>
                        <td className="p-3 font-medium">{t.admission_number}</td>
                        <td className="p-3">{t.student_name}</td>
                        <td className="p-3 text-right font-semibold text-emerald-600">
                          + KES {parseFloat(t.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Live M-Pesa Paybill Webhook Simulator */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-lg mb-2">
                <Smartphone size={22} />
                <h2>M-Pesa Paybill Simulator</h2>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Simulates a Safaricom Daraja C2B Paybill callback to test real-time ledger reconciliation.
              </p>
              <form onSubmit={handleSimulateMpesa} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Account Ref (Admission No)
                  </label>
                  <input
                    type="text"
                    required
                    value={mpesaAdm}
                    onChange={(e) => setMpesaAdm(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Amount (KES)
                  </label>
                  <input
                    type="number"
                    required
                    value={mpesaAmount}
                    onChange={(e) => setMpesaAmount(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    M-Pesa Receipt Code
                  </label>
                  <input
                    type="text"
                    required
                    value={mpesaCode}
                    onChange={(e) => setMpesaCode(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono uppercase"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg text-sm transition"
                >
                  Trigger M-Pesa Payment
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: CBC GRADING PORTAL */}
        {activeTab === 'cbc' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Record CBC Rubric</h2>
              <form onSubmit={handleAddCBC} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Student</label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.admission_number} — {s.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Learning Area / Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Strand / Sub-Strand
                  </label>
                  <input
                    type="text"
                    required
                    value={strand}
                    onChange={(e) => setStrand(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    CBC Performance Rubric
                  </label>
                  <select
                    value={rubric}
                    onChange={(e) => setRubric(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="EE">EE — Exceeding Expectations</option>
                    <option value="ME">ME — Meeting Expectations</option>
                    <option value="AE">AE — Approaching Expectations</option>
                    <option value="BE">BE — Below Expectations</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg text-sm transition"
                >
                  Save CBC Assessment
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Termly CBC Assessment Records</h2>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600 uppercase text-xs">
                  <tr>
                    <th className="p-3">Student</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Strand</th>
                    <th className="p-3">Rubric</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {assessments.map((a) => (
                    <tr key={a.id}>
                      <td className="p-3 font-medium">{a.student_name}</td>
                      <td className="p-3">{a.subject}</td>
                      <td className="p-3 text-slate-600">{a.strand}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          {a.rubric}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* ENROLL STUDENT MODAL */}
        {showEnrollModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Enroll New Student</h3>
              <form onSubmit={handleAddStudent} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Admission Number (e.g. ADM002)"
                  value={newAdm}
                  onChange={(e) => setNewAdm(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm uppercase"
                />
                <input
                  type="text"
                  required
                  placeholder="Student Full Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  required
                  placeholder="Grade (e.g. Grade 6)"
                  value={newGrade}
                  onChange={(e) => setNewGrade(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  required
                  placeholder="Opening Term Fee Balance (KES)"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEnrollModal(false)}
                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm bg-emerald-600 text-white font-semibold rounded-lg"
                  >
                    Save Student
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PRINTABLE OFFICIAL FEE STATEMENT & CBC REPORT CARD */}
        {reportStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full p-8 shadow-xl">
              <div className="border-b pb-4 mb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-emerald-900">MUNJO PREMIER ACADEMY</h2>
                  <p className="text-xs text-slate-500">Official Termly Fee Statement & CBC Progress Report</p>
                </div>
                <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                  ADM: {reportStudent.admission_number}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div><span className="text-slate-500">Student:</span> <strong>{reportStudent.full_name}</strong></div>
                <div><span className="text-slate-500">Class:</span> <strong>{reportStudent.grade}</strong></div>
                <div><span className="text-slate-500">Fee Balance:</span> <strong className="text-amber-700">KES {parseFloat(reportStudent.fee_balance).toLocaleString()}</strong></div>
                <div><span className="text-slate-500">Paybill No:</span> <strong>0790839039</strong></div>
              </div>

              <h4 className="font-bold text-xs uppercase text-slate-500 mb-2">CBC Performance Summary</h4>
              <div className="border rounded-lg overflow-hidden mb-6">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-2">Subject</th>
                      <th className="p-2">Strand</th>
                      <th className="p-2">Rubric</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {assessments.filter(a => a.student === reportStudent.id).map(a => (
                      <tr key={a.id}>
                        <td className="p-2 font-medium">{a.subject}</td>
                        <td className="p-2">{a.strand}</td>
                        <td className="p-2 font-bold text-emerald-700">{a.rubric}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 print:hidden">
                <button
                  onClick={() => setReportStudent(null)}
                  className="px-4 py-2 text-sm border rounded-lg"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 text-sm bg-emerald-600 text-white font-semibold rounded-lg flex items-center gap-2"
                >
                  <Printer size={16} /> Print / Save as PDF
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
