import React from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import etFlag from 'country-flag-icons/string/3x2/ET';
import * as XLSX from 'xlsx';
import ClipLoader from 'react-spinners/ClipLoader';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import {
  LayoutDashboard, FileText, MessageSquare,
  ChevronRight, Star, Users, Plus, Trash2,
  Download, Search, Filter, ChevronLeft, X, Check, AlertCircle,
  TrendingUp, RefreshCw, Eye, EyeOff, Save, Edit3,
  BarChart3, Activity, ArrowUpDown, Calendar, 
  ThumbsUp, ThumbsDown, MessageCircle, Sparkles,
  Heart, Send, CheckCircle2, Circle, ArrowRight, ArrowLeft,
  ClipboardList, HeartPulse, Shield, Award, ChevronDown, FileSpreadsheet,
  Bell, LogOut, Settings, UserCog, History, Edit, ToggleLeft, ToggleRight, Power, Mail, Copy,
  Upload, Smartphone, Clock
} from 'lucide-react';
import DoctorRatingsPage from './DoctorRatingsPage';
import ReportsPage from './ReportsPage';
import SurveyReport from './SurveyReport';
import DeleteModal from '../components/ui/DeleteModal';
import StarRating from '../components/ui/StarRating';
import UsersSection from '../components/admin/sections/UsersSection';
import ActivitySection from '../components/admin/sections/ActivitySection';
import DoctorsSection from '../components/admin/sections/DoctorsSection';
import PatientsSection from '../components/admin/sections/PatientsSection';
import EncountersSection from '../components/admin/sections/EncountersSection';
import RolesSection from '../components/admin/sections/RolesSection';
import EmailSettingsSection from '../components/admin/sections/EmailSettingsSection';
import ImportSection from '../components/admin/sections/ImportSection';
import QuestionsSection from '../components/admin/sections/QuestionsSection';
import ResponsesSection from '../components/admin/sections/ResponsesSection';
import AdminSidebar from '../components/admin/layout/AdminSidebar';
import AdminHeader from '../components/admin/layout/AdminHeader';

export default function AdminDashboard({ authToken, currentUser, onLogout }) {
  function formatDate(date) {
    return date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0');
  }

  function getCurrentMonthRange() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      date_from: formatDate(firstDayOfMonth),
      date_to: formatDate(lastDayOfMonth)
    };
  }

  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'questions', label: 'Questions', icon: FileText },
    { id: 'responses', label: 'Responses', icon: MessageSquare },
    { id: 'doctor-ratings', label: 'Doctor Ratings', icon: Star },
    { id: 'doctors', label: 'Doctors', icon: Users },
    { id: 'patients', label: 'Patients', icon: HeartPulse },
    { id: 'encounters', label: 'Encounters', icon: ClipboardList },
    { id: 'reports', label: 'Reports', icon: BarChart3, children: [
      { id: 'doctor-report', label: 'Doctor Report', icon: Star },
      { id: 'general-report', label: 'General Report', icon: FileText },
      { id: 'survey-report', label: 'Survey Report', icon: MessageSquare }
    ]},
    { id: 'settings', label: 'Settings', icon: Settings, children: [
      { id: 'users', label: 'User Management', icon: UserCog },
      { id: 'roles', label: 'Roles', icon: Shield },
      { id: 'email-settings', label: 'Email', icon: Mail },
      { id: 'import', label: 'Import', icon: Upload },
      { id: 'activity', label: 'Activity Log', icon: History }
    ]}
  ];

  const userPerms = (currentUser && currentUser.permissions) || [];

  function getFirstPermittedTab() {
    for (const item of allMenuItems) {
      if (item.children) {
        const child = item.children.find(c => userPerms.includes(c.id));
        if (child) return child.id;
      }
      if (userPerms.includes(item.id)) return item.id;
    }
    return 'dashboard';
  }

  const [activeTab, setActiveTab] = React.useState(getFirstPermittedTab());
  const [sidebarOpen, setSidebarOpen] = React.useState(() => window.innerWidth >= 768);
  const [message, setMessage] = React.useState({ type: '', text: '' });
  const [analytics, setAnalytics] = React.useState(null);
  const [surveyStats, setSurveyStats] = React.useState(null);
  const [dashboardDateFilter, setDashboardDateFilter] = React.useState('today');
  const [dashboardDateRange, setDashboardDateRange] = React.useState({ date_from: '', date_to: '' });
  const dashboardDateFilterRef = React.useRef('today');
  const dashboardDateRangeRef = React.useRef({ date_from: '', date_to: '' });
  const [responses, setResponses] = React.useState([]);
  const [questions, setQuestions] = React.useState([]);
  const [doctorsList, setDoctorsList] = React.useState([]);
  const [users, setUsers] = React.useState([]);
  const [showUserModal, setShowUserModal] = React.useState(false);
  const [newUser, setNewUser] = React.useState({ username: '', email: '', password: '' });
  const [userLoading, setUserLoading] = React.useState(false);
  const [loadingUsers, setLoadingUsers] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [notifications, setNotifications] = React.useState([]);
  const [hasNewNotifications, setHasNewNotifications] = React.useState(false);
  const [editUserModal, setEditUserModal] = React.useState({ isOpen: false, user: null });
  const [editUserData, setEditUserData] = React.useState({ username: '', email: '', password: '', is_active: true });
  const [activityLogs, setActivityLogs] = React.useState([]);
  const [activityPagination, setActivityPagination] = React.useState({ page: 1, limit: 5, total: 0, total_pages: 0 });
  const [activityFilters, setActivityFilters] = React.useState(() => getCurrentMonthRange());
  const [loadingActivity, setLoadingActivity] = React.useState(false);
  const [userDeleteModal, setUserDeleteModal] = React.useState({ isOpen: false, user: null });

  const [importModule, setImportModule] = React.useState('doctors');
  const [importFile, setImportFile] = React.useState(null);
  const [importLoading, setImportLoading] = React.useState(false);
  const [importResults, setImportResults] = React.useState(null);

  const { date_from: defaultDateFrom, date_to: defaultDateTo } = getCurrentMonthRange();

  const [filters, setFilters] = React.useState({ search: '', date_from: defaultDateFrom, date_to: defaultDateTo });
  const [searchInput, setSearchInput] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState(new Set());
  const [loadingResponses, setLoadingResponses] = React.useState(false);
  const [pagination, setPagination] = React.useState({ page: 1, limit: 5, total: 0, total_pages: 0 });
  const [pageLimit, setPageLimit] = React.useState(5);
  const [dashboardLoading, setDashboardLoading] = React.useState(false);

  React.useEffect(() => {
    const today = new Date();
    const dateStr = today.getFullYear() + '-' + 
      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
      String(today.getDate()).padStart(2, '0');
    const range = { date_from: dateStr, date_to: dateStr };
    dashboardDateRangeRef.current = range;
    dashboardDateFilterRef.current = 'today';
    setDashboardDateRange(range);
  }, []);

  const [newQuestion, setNewQuestion] = React.useState({
    key: '',
    label_en: '',
    label_am: '',
    type: 'stars',
    required: true,
    options_en: [],
    options_am: [],
    options: [],
    min: 1,
    max: 5,
    page_number: 1,
    category: 'general'
  });
  const [questionFilter, setQuestionFilter] = React.useState('all');
  const [editingQuestion, setEditingQuestion] = React.useState(null);
  const [optionInput, setOptionInput] = React.useState('');
  const [optionInputAm, setOptionInputAm] = React.useState('');
  const [optionInputOm, setOptionInputOm] = React.useState('');
  const [deleteModal, setDeleteModal] = React.useState({ isOpen: false, question: null });
  const [responseDeleteModal, setResponseDeleteModal] = React.useState({ isOpen: false, ids: [], count: 0 });
  const [downloadDropdown, setDownloadDropdown] = React.useState(false);

  const [doctors, setDoctors] = React.useState([]);
  const [doctorsPagination, setDoctorsPagination] = React.useState({ page: 1, limit: 10, total: 0, total_pages: 0 });
  const [doctorsSearch, setDoctorsSearch] = React.useState('');
  const [doctorsSearchInput, setDoctorsSearchInput] = React.useState('');
  const [showDoctorModal, setShowDoctorModal] = React.useState(false);
  const [editingDoctor, setEditingDoctor] = React.useState(null);
  const [doctorForm, setDoctorForm] = React.useState({ name: '', department: '', email: '', image_url: '' });
  const [doctorLoading, setDoctorLoading] = React.useState(false);
  const [doctorsFilter, setDoctorsFilter] = React.useState('active');
  const [deleteDoctorModal, setDeleteDoctorModal] = React.useState({ isOpen: false, doctor: null });

  const [patients, setPatients] = React.useState([]);
  const [patientsPagination, setPatientsPagination] = React.useState({ page: 1, limit: 10, total: 0, total_pages: 0 });
  const [patientsSearch, setPatientsSearch] = React.useState('');
  const [patientsSearchInput, setPatientsSearchInput] = React.useState('');
  const [showPatientModal, setShowPatientModal] = React.useState(false);
  const [editingPatient, setEditingPatient] = React.useState(null);
  const phoneFlags = React.useMemo(() => [{ iso2: 'et', src: 'data:image/svg+xml,' + encodeURIComponent(etFlag) }], []);
  const [patientForm, setPatientForm] = React.useState({ name: '', phone: '+251' });
  const [patientLoading, setPatientLoading] = React.useState(false);
  const [deletePatientModal, setDeletePatientModal] = React.useState({ isOpen: false, patient: null });

  const [encounters, setEncounters] = React.useState([]);
  const [encountersPagination, setEncountersPagination] = React.useState({ page: 1, limit: 10, total: 0, total_pages: 0 });
  const [encountersSearch, setEncountersSearch] = React.useState('');
  const [encountersSearchInput, setEncountersSearchInput] = React.useState('');
  const [encountersDateFrom, setEncountersDateFrom] = React.useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [encountersDateTo, setEncountersDateTo] = React.useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 1, 0);
    return d.toISOString().split('T')[0];
  });
  const [encounterSurveyStatus, setEncounterSurveyStatus] = React.useState('');
  const [encounterSelectedIds, setEncounterSelectedIds] = React.useState(new Set());
  const [encounterDeleteBulkModal, setEncounterDeleteBulkModal] = React.useState({ isOpen: false, ids: [], count: 0 });
  const [sendingSms, setSendingSms] = React.useState(new Set());
  const [sendingAllSms, setSendingAllSms] = React.useState(false);
  const [showEncounterModal, setShowEncounterModal] = React.useState(false);
  const [encounterForm, setEncounterForm] = React.useState({ patient_id: '', doctor_ids: [], status: 'in_progress' });
  const [encounterLoading, setEncounterLoading] = React.useState(false);
  const [encounterPatients, setEncounterPatients] = React.useState([]);
  const [encounterDoctors, setEncounterDoctors] = React.useState([]);
  const [patientSearch, setPatientSearch] = React.useState('');
  const [doctorSearch, setDoctorSearch] = React.useState('');
  const [showPatientDropdown, setShowPatientDropdown] = React.useState(false);
  const [showDoctorDropdown, setShowDoctorDropdown] = React.useState(false);
  const doctorDropdownRef = React.useRef(null);
  const [deleteEncounterModal, setDeleteEncounterModal] = React.useState({ isOpen: false, encounter: null });
  const [viewEncounterModal, setViewEncounterModal] = React.useState({ isOpen: false, encounter: null });
  const [roles, setRoles] = React.useState([]);
  const [loadingRoles, setLoadingRoles] = React.useState(false);
  const [showRoleModal, setShowRoleModal] = React.useState(false);
  const [roleForm, setRoleForm] = React.useState({ name: '' });
  const [deleteRoleModal, setDeleteRoleModal] = React.useState({ isOpen: false, roleId: null, roleName: '' });
  const allModules = ['dashboard', 'questions', 'responses', 'doctor-ratings', 'doctors', 'patients', 'encounters', 'reports', 'users', 'activity', 'roles', 'import', 'upload', 'email-settings'];

  const [emailSettings, setEmailSettings] = React.useState({ smtp_host: '', smtp_port: '587', smtp_secure: 'false', smtp_user: '', smtp_pass: '', smtp_from: '' });
  const [loadingEmailSettings, setLoadingEmailSettings] = React.useState(false);
  const [emailSaving, setEmailSaving] = React.useState(false);
  const [emailTesting, setEmailTesting] = React.useState(false);
  const [showSmtpPass, setShowSmtpPass] = React.useState(false);
  const [initialPageLoading, setInitialPageLoading] = React.useState(true);
  const initialPageLoadedRef = React.useRef(false);
  const initialLoadedTabRef = React.useRef(null);

  const showMessage = (text, type = 'info') => {
    if (type === 'error') toast.error(text);
    else if (type === 'success') toast.success(text);
    else toast.info(text);
  };

  function headers() {
    return authToken ? { 'x-session-token': authToken } : {};
  }

  async function fetchEmailSettings() {
    setLoadingEmailSettings(true);
    try {
      const res = await fetch('/api/admin/settings', { headers: headers() });
      const data = await res.json();
      if (res.ok && data.settings) setEmailSettings(data.settings);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoadingEmailSettings(false);
    }
  }

  async function handleSaveEmailSettings() {
    setEmailSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: emailSettings })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      if (data.settings) setEmailSettings(data.settings);
      toast.success('Email settings saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEmailSaving(false);
    }
  }

  async function handleTestEmail() {
    setEmailTesting(true);
    try {
      const res = await fetch('/api/admin/settings/test-email', {
        method: 'POST',
        headers: { ...headers(), 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      toast.success(data.message || 'Test email sent');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEmailTesting(false);
    }
  }

  async function fetchUsers() {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users', { headers: headers() });
      const data = await res.json();
      if (res.ok) setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function fetchDoctors(page = 1, search = '', filter) {
    const active = filter || doctorsFilter;
    setDoctorLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: doctorsPagination.limit, active });
      if (search) params.set('search', search);
      const res = await fetch('/api/doctors?' + params.toString(), { headers: headers() });
      const data = await res.json();
      if (res.ok) {
        setDoctors(data.doctors || []);
        setDoctorsPagination({
          page: data.page || 1,
          limit: data.limit || 10,
          total: data.total || 0,
          total_pages: data.total_pages || 0
        });
      }
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    } finally {
      setDoctorLoading(false);
    }
  }

  async function fetchDoctorsWithLimit(page = 1, search = '', limit, filter) {
    const active = filter || doctorsFilter;
    setDoctorLoading(true);
    try {
      const params = new URLSearchParams({ page, limit, active });
      if (search) params.set('search', search);
      const res = await fetch('/api/doctors?' + params.toString(), { headers: headers() });
      const data = await res.json();
      if (res.ok) {
        setDoctors(data.doctors || []);
        setDoctorsPagination({
          page: data.page || 1,
          limit: data.limit || limit,
          total: data.total || 0,
          total_pages: data.total_pages || 0
        });
      }
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    } finally {
      setDoctorLoading(false);
    }
  }

  function handleDoctorsSearch(e) {
    e.preventDefault();
    setDoctorsSearch(doctorsSearchInput);
    fetchDoctors(1, doctorsSearchInput);
  }

  function changeDoctorsPage(newPage) {
    if (newPage < 1 || newPage > doctorsPagination.total_pages) return;
    fetchDoctors(newPage, doctorsSearch);
  }

  function clearDoctorsSearch() {
    setDoctorsSearchInput('');
    setDoctorsSearch('');
    fetchDoctors(1, '');
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    setUserLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('User created successfully');
      setNewUser({ username: '', email: '', password: '' });
      setShowUserModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUserLoading(false);
    }
  }

  async function handleDeleteUser(id) {
    try {
      const res = await fetch('/api/admin/users/' + id, {
        method: 'DELETE',
        headers: headers()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('User deleted');
      setUserDeleteModal({ isOpen: false, user: null });
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    }
  }

  function confirmDeleteUser(user) {
    setUserDeleteModal({ isOpen: true, user });
  }

  function handleOpenEditUser(user) {
    setEditUserData({
      username: user.username,
      email: user.email,
      password: '',
      is_active: user.is_active,
      role_id: user.role_id || ''
    });
    setEditUserModal({ isOpen: true, user });
    fetchRoles();
  }

  async function handleUpdateUser(e) {
    e.preventDefault();
    setUserLoading(true);
    try {
      const updates = {};
      if (editUserData.username !== editUserModal.user.username) updates.username = editUserData.username;
      if (editUserData.email !== editUserModal.user.email) updates.email = editUserData.email;
      if (editUserData.password) updates.password = editUserData.password;
      if (editUserData.is_active !== editUserModal.user.is_active) updates.is_active = editUserData.is_active;
      if (Number(editUserData.role_id) !== (editUserModal.user.role_id || null)) updates.role_id = editUserData.role_id ? Number(editUserData.role_id) : null;

      const res = await fetch('/api/admin/users/' + editUserModal.user.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('User updated successfully');
      setEditUserModal({ isOpen: false, user: null });
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUserLoading(false);
    }
  }

  async function handleCreateDoctor(e) {
    e.preventDefault();
    setDoctorLoading(true);
    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify(doctorForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('Doctor created successfully');
      setShowDoctorModal(false);
      setDoctorForm({ name: '', department: '', email: '', image_url: '' });
      fetchDoctors(doctorsPagination.page, doctorsSearch);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDoctorLoading(false);
    }
  }

  async function handleUpdateDoctor(e) {
    e.preventDefault();
    setDoctorLoading(true);
    try {
      const res = await fetch('/api/doctors/' + editingDoctor.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify(doctorForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('Doctor updated successfully');
      setEditingDoctor(null);
      setDoctorForm({ name: '', department: '', email: '', image_url: '' });
      fetchDoctors(doctorsPagination.page, doctorsSearch);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDoctorLoading(false);
    }
  }

  async function handleDeleteDoctor() {
    try {
      const res = await fetch('/api/doctors/' + deleteDoctorModal.doctor.id, {
        method: 'DELETE',
        headers: headers()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('Doctor deleted');
      setDeleteDoctorModal({ isOpen: false, doctor: null });
      fetchDoctors();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleReactivateDoctor(doctorId) {
    try {
      const res = await fetch('/api/doctors/' + doctorId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify({ is_active: true })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('Doctor reactivated');
      fetchDoctors();
    } catch (err) {
      toast.error(err.message);
    }
  }

  function handleDoctorsFilter(filter) {
    setDoctorsFilter(filter);
    setDoctorsSearchInput('');
    setDoctorsSearch('');
    fetchDoctors(1, '', filter);
  }

  async function fetchPatients(page = 1, search = '') {
    setPatientLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: patientsPagination.limit });
      if (search) params.set('search', search);
      const res = await fetch('/api/patients?' + params.toString(), { headers: headers() });
      const data = await res.json();
      if (res.ok) {
        setPatients(data.patients || []);
        setPatientsPagination({
          page: data.page || 1,
          limit: data.limit || 10,
          total: data.total || 0,
          total_pages: data.total_pages || 0
        });
      }
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    } finally {
      setPatientLoading(false);
    }
  }

  async function fetchPatientsWithLimit(page = 1, search = '', limit) {
    setPatientLoading(true);
    try {
      const params = new URLSearchParams({ page, limit });
      if (search) params.set('search', search);
      const res = await fetch('/api/patients?' + params.toString(), { headers: headers() });
      const data = await res.json();
      if (res.ok) {
        setPatients(data.patients || []);
        setPatientsPagination({
          page: data.page || 1,
          limit: data.limit || limit,
          total: data.total || 0,
          total_pages: data.total_pages || 0
        });
      }
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    } finally {
      setPatientLoading(false);
    }
  }

  function handlePatientsSearch(e) {
    e.preventDefault();
    setPatientsSearch(patientsSearchInput);
    fetchPatients(1, patientsSearchInput);
  }

  function changePatientsPage(newPage) {
    if (newPage < 1 || newPage > patientsPagination.total_pages) return;
    fetchPatients(newPage, patientsSearch);
  }

  function clearPatientsSearch() {
    setPatientsSearchInput('');
    setPatientsSearch('');
    fetchPatients(1, '');
  }

  async function handleCreatePatient(e) {
    e.preventDefault();
    setPatientLoading(true);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify(patientForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('Patient created successfully');
      setShowPatientModal(false);
      setPatientForm({ name: '', phone: '+251' });
      fetchPatients(patientsPagination.page, patientsSearch);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPatientLoading(false);
    }
  }

  async function handleUpdatePatient(e) {
    e.preventDefault();
    setPatientLoading(true);
    try {
      const res = await fetch('/api/patients/' + editingPatient.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify(patientForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('Patient updated successfully');
      setEditingPatient(null);
      setPatientForm({ name: '', phone: '+251' });
      fetchPatients(patientsPagination.page, patientsSearch);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPatientLoading(false);
    }
  }

  async function handleDeletePatient() {
    try {
      const res = await fetch('/api/patients/' + deletePatientModal.patient.id, {
        method: 'DELETE',
        headers: headers()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('Patient deleted');
      setDeletePatientModal({ isOpen: false, patient: null });
      fetchPatients();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function fetchEncounters(page = 1, search = '') {
    setEncounterLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: encountersPagination.limit });
      if (search) params.set('search', search);
      if (encountersDateFrom) params.set('date_from', encountersDateFrom);
      if (encountersDateTo) params.set('date_to', encountersDateTo);
      if (encounterSurveyStatus) params.set('survey_status', encounterSurveyStatus);
      const res = await fetch('/api/encounters?' + params.toString(), { headers: headers() });
      const data = await res.json();
      if (res.ok) {
        setEncounters(data.encounters || []);
        setEncountersPagination({
          page: data.page || 1,
          limit: data.limit || 10,
          total: data.total || 0,
          total_pages: data.total_pages || 0,
          in_progress: data.in_progress || 0,
          finished: data.finished || 0,
          survey_filled: data.survey_filled || 0,
          survey_not_filled: data.survey_not_filled || 0
        });
      }
    } catch (err) {
      console.error('Failed to fetch encounters:', err);
    } finally {
      setEncounterLoading(false);
    }
  }

  function handleEncountersSearch(e) {
    e.preventDefault();
    setEncountersSearch(encountersSearchInput);
    fetchEncounters(1, encountersSearchInput);
  }

  function changeEncountersPage(newPage) {
    if (newPage < 1 || newPage > encountersPagination.total_pages) return;
    fetchEncounters(newPage, encountersSearch);
  }

  async function fetchEncountersWithLimit(page, search, limit) {
    setEncountersPagination(p => ({ ...p, limit, page }));
    setEncounterLoading(true);
    try {
      const params = new URLSearchParams({ page, limit });
      if (search) params.set('search', search);
      if (encountersDateFrom) params.set('date_from', encountersDateFrom);
      if (encountersDateTo) params.set('date_to', encountersDateTo);
      if (encounterSurveyStatus) params.set('survey_status', encounterSurveyStatus);
      const res = await fetch('/api/encounters?' + params.toString(), { headers: headers() });
      const data = await res.json();
      if (res.ok) {
        setEncounters(data.encounters || []);
        setEncountersPagination({
          page: data.page || 1,
          limit: data.limit || limit,
          total: data.total || 0,
          total_pages: data.total_pages || 0,
          in_progress: data.in_progress || 0,
          finished: data.finished || 0,
          survey_filled: data.survey_filled || 0,
          survey_not_filled: data.survey_not_filled || 0
        });
      }
    } catch (err) {
      console.error('Failed to fetch encounters:', err);
    } finally {
      setEncounterLoading(false);
    }
  }

  function clearEncountersSearch() {
    setEncountersSearchInput('');
    setEncountersSearch('');
    fetchEncounters(1, '');
  }

  function toggleEncounterDoctor(doctorId) {
    setEncounterForm(prev => {
      const exists = prev.doctor_ids.includes(doctorId);
      return {
        ...prev,
        doctor_ids: exists
          ? prev.doctor_ids.filter(id => id !== doctorId)
          : [...prev.doctor_ids, doctorId]
      };
    });
  }

  async function handleCreateEncounter(e) {
    e.preventDefault();
    if (!encounterForm.patient_id) {
      toast.error('Please select a patient');
      return;
    }
    if (!encounterForm.doctor_ids.length) {
      toast.error('Please select at least one doctor');
      return;
    }
    setEncounterLoading(true);
    try {
      const res = await fetch('/api/encounters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify(encounterForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('Encounter created');
      setShowEncounterModal(false);
      setEncounterForm({ patient_id: '', doctor_ids: [] });
      setPatientSearch('');
      setDoctorSearch('');
      fetchEncounters(encountersPagination.page, encountersSearch);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEncounterLoading(false);
    }
  }

  async function handleFinishEncounter(encounterId) {
    try {
      const res = await fetch('/api/encounters/' + encounterId + '/finish', {
        method: 'PATCH',
        headers: headers()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('Encounter finished! Survey link generated.');
      fetchEncounters(encountersPagination.page, encountersSearch);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleDeleteEncounter() {
    try {
      const res = await fetch('/api/encounters/' + deleteEncounterModal.encounter.id, {
        method: 'DELETE',
        headers: headers()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('Encounter deleted');
      setDeleteEncounterModal({ isOpen: false, encounter: null });
      fetchEncounters();
    } catch (err) {
      toast.error(err.message);
    }
  }

  function toggleEncountersSelectAll() {
    if (encounterSelectedIds.size === encounters.length) {
      setEncounterSelectedIds(new Set());
    } else {
      setEncounterSelectedIds(new Set(encounters.map((e) => e.id)));
    }
  }

  function toggleEncountersSelect(id) {
    const next = new Set(encounterSelectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setEncounterSelectedIds(next);
  }

  function openEncountersDeleteBulkModal() {
    if (encounterSelectedIds.size === 0) return;
    setEncounterDeleteBulkModal({ isOpen: true, ids: Array.from(encounterSelectedIds), count: encounterSelectedIds.size });
  }

  async function confirmDeleteEncountersBulk() {
    if (encounterDeleteBulkModal.ids.length === 0) return;
    try {
      const res = await fetch('/api/encounters/delete-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify({ ids: encounterDeleteBulkModal.ids })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Delete failed');
      setEncounterDeleteBulkModal({ isOpen: false, ids: [], count: 0 });
      setEncounterSelectedIds(new Set());
      fetchEncounters();
      toast.success('Deleted ' + data.deleted + ' encounter(s)');
    } catch (err) {
      toast.error(err.message);
      setEncounterDeleteBulkModal({ isOpen: false, ids: [], count: 0 });
    }
  }

  function exportEncountersToCSV() {
    if (encounterSelectedIds.size === 0) return;
    const selected = encounters.filter((e) => encounterSelectedIds.has(e.id));
    if (selected.length === 0) return;
    const rows = selected.map((e) => ({
      'Encounter ID': e.id,
      Patient: e.patient_name,
      Mobile: e.patient_phone || '',
      Doctors: (e.doctors || []).map((d) => d.name).join('; '),
      Status: e.status,
      'Survey Filled': e.survey_filled ? 'Yes' : 'No',
      Created: e.created_at ? new Date(e.created_at).toLocaleDateString('en-GB') : ''
    }));
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => headers.map((h) => {
        const val = String(r[h] || '').replace(/"/g, '""');
        return '"' + val + '"';
      }).join(','))
    ].join('\n');
    downloadFile(csv, 'encounters_selected.csv', 'text/csv');
    toast.success('Downloaded ' + selected.length + ' encounters as CSV');
  }

  function exportEncountersToExcel() {
    if (encounterSelectedIds.size === 0) return;
    const selected = encounters.filter((e) => encounterSelectedIds.has(e.id));
    if (selected.length === 0) return;
    const rows = selected.map((e) => ({
      'Encounter ID': e.id,
      Patient: e.patient_name,
      Mobile: e.patient_phone || '',
      Doctors: (e.doctors || []).map((d) => d.name).join('; '),
      Status: e.status,
      'Survey Filled': e.survey_filled ? 'Yes' : 'No',
      Created: e.created_at ? new Date(e.created_at).toLocaleDateString('en-GB') : ''
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Encounters');
    XLSX.writeFile(wb, 'encounters_selected.xlsx');
    toast.success('Downloaded ' + selected.length + ' encounters as Excel');
  }

  async function handleSendSurveySms(encounterId) {
    setSendingSms(prev => new Set(prev).add(encounterId));
    try {
      const res = await fetch('/api/encounters/' + encounterId + '/send-sms', {
        method: 'POST',
        headers: headers()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('Survey sent via SMS');
      fetchEncounters();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSendingSms(prev => {
        const next = new Set(prev);
        next.delete(encounterId);
        return next;
      });
    }
  }

  async function handleSendAllSurveySms() {
    setSendingAllSms(true);
    try {
      const ids = encounterSelectedIds.size > 0 ? Array.from(encounterSelectedIds) : [];
      const res = await fetch('/api/encounters/send-all-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify({ ids })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('Sent to ' + data.sent + ' encounters' + (data.failed > 0 ? ', ' + data.failed + ' failed' : ''));
      fetchEncounters();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSendingAllSms(false);
    }
  }

  async function fetchRoles() {
    setLoadingRoles(true);
    try {
      const res = await fetch('/api/admin/roles', { headers: headers() });
      const data = await res.json();
      if (res.ok) setRoles(data.roles || []);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    } finally {
      setLoadingRoles(false);
    }
  }

  async function toggleRolePermission(roleId, module) {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;
    const newPerms = role.permissions.includes(module)
      ? role.permissions.filter(m => m !== module)
      : [...role.permissions, module];
    try {
      const res = await fetch('/api/admin/roles/' + roleId + '/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify({ modules: newPerms })
      });
      if (res.ok) {
        setRoles(roles.map(r => r.id === roleId ? { ...r, permissions: newPerms } : r));
        toast.success('Permissions updated');
      }
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleCreateRole(e) {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify(roleForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('Role created');
      setShowRoleModal(false);
      setRoleForm({ name: '' });
      fetchRoles();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleDeleteRole(roleId) {
    try {
      const res = await fetch('/api/admin/roles/' + roleId, { method: 'DELETE', headers: headers() });
      if (res.ok) {
        toast.success('Role deleted');
        setDeleteRoleModal({ isOpen: false, roleId: null, roleName: '' });
        fetchRoles();
      }
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function loadEncounterFormData() {
    try {
      const [patientsRes, doctorsRes] = await Promise.all([
        fetch('/api/patients?page=1&limit=1000', { headers: headers() }),
        fetch('/api/doctors?page=1&limit=1000&active=active', { headers: headers() })
      ]);
      if (patientsRes.ok) {
        const data = await patientsRes.json();
        setEncounterPatients(data.patients || []);
      }
      if (doctorsRes.ok) {
        const data = await doctorsRes.json();
        setEncounterDoctors(data.doctors || []);
      }
    } catch (err) {
      console.error('Failed to load encounter form data:', err);
    }
  }

  React.useEffect(() => {
    if (!showDoctorDropdown) return;
    function handleClick(e) {
      if (doctorDropdownRef.current && !doctorDropdownRef.current.contains(e.target)) {
        setShowDoctorDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDoctorDropdown]);

  async function fetchActivityLogs(page = 1, limit = activityPagination.limit, currentFilters = activityFilters) {
    setLoadingActivity(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (currentFilters.date_from) params.set('date_from', currentFilters.date_from);
      if (currentFilters.date_to) params.set('date_to', currentFilters.date_to);

      const res = await fetch('/api/admin/activity-logs?' + params.toString(), { headers: headers() });
      const data = await res.json();
      if (res.ok) {
        setActivityLogs(data.logs || []);
        setActivityPagination({
          page: data.page || 1,
          limit: data.limit || limit,
          total: data.total || 0,
          total_pages: data.total_pages || 0
        });
      }
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setLoadingActivity(false);
    }
  }

  function changeActivityPage(newPage) {
    if (newPage < 1 || newPage > activityPagination.total_pages) return;
    fetchActivityLogs(newPage, activityPagination.limit, activityFilters);
  }

  function handleActivityFilterChange(field, value) {
    const nextFilters = { ...activityFilters, [field]: value };
    setActivityFilters(nextFilters);
    setActivityPagination((previous) => ({ ...previous, page: 1 }));
    fetchActivityLogs(1, activityPagination.limit, nextFilters);
  }

  async function handleImportData() {
    if (!importFile) {
      toast.error('Please select a file');
      return;
    }

    setImportLoading(true);
    setImportResults(null);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('module', importModule);

      const res = await fetch('/api/import', {
        method: 'POST',
        headers: headers(),
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      setImportResults(data);
      toast.success('Import completed');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setImportLoading(false);
    }
  }

  React.useEffect(() => {
    if (!initialPageLoadedRef.current) return;
    if (initialPageLoading) return;

    if (initialLoadedTabRef.current) {
      if (activeTab === initialLoadedTabRef.current) {
        initialLoadedTabRef.current = null;
        return;
      }
      initialLoadedTabRef.current = null;
    }

    if (activeTab === 'responses') {
      fetchResponsesWithFilters(pagination.page, filters);
      return;
    }

    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'activity') fetchActivityLogs();
    if (activeTab === 'doctors') fetchDoctors();
    if (activeTab === 'patients') fetchPatients();
    if (activeTab === 'roles') fetchRoles();
    if (activeTab === 'email-settings') fetchEmailSettings();
    if (activeTab === 'encounters') {
      fetchEncounters();
      fetchPatients(1, '');
      fetchDoctors(1, '');
    }
  }, [activeTab, initialPageLoading]);

  const lastSeenIdRef = React.useRef(0);
  const pollIntervalRef = React.useRef(null);

  React.useEffect(() => {
    if (!currentUser?.permissions?.includes('responses')) return;

    async function syncAndStartPoll() {
      try {
        const res = await fetch('/api/notifications/last-seen', { headers: headers() });
        if (res.ok) {
          const data = await res.json();
          if (data.last_seen_submission_id > 0) {
            lastSeenIdRef.current = data.last_seen_submission_id;
          }
        }
      } catch (e) {
        console.error('Sync last-seen error:', e);
      }
    }

    syncAndStartPoll().then(() => {
      if (pollIntervalRef.current) return;

      async function pollForNewResponses() {
        try {
          const res = await fetch('/api/responses?grouped=true&page=1&limit=20', { headers: headers() });
          const data = await res.json();
          
          if (!res.ok) {
            console.error('Poll failed:', data.error);
            return;
          }
          
          if (data.responses && data.responses.length > 0) {
            const latestId = Math.max(...data.responses.map(r => r.submission_id));
            const lastKnownId = lastSeenIdRef.current;
            
            const newResponses = data.responses.filter(r => r.submission_id > lastKnownId);
            
            if (newResponses.length > 0) {
              setNotifications(prev => {
                const existingIds = new Set(prev.map(n => n.submission_id));
                const uniqueNew = newResponses.filter(n => !existingIds.has(n.submission_id));
                return [...uniqueNew, ...prev].slice(0, 10);
              });
              setHasNewNotifications(true);
            }
            
            lastSeenIdRef.current = latestId;
          }
        } catch (err) {
          console.error('Poll error:', err);
        }
      }

      pollForNewResponses();
      pollIntervalRef.current = setInterval(pollForNewResponses, 15000);
    });

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [activeTab, currentUser?.id]);

  function handleOpenNotifications() {
    setShowNotifications(!showNotifications);
    if (!showNotifications && !hasNewNotifications) {
      setShowNotifications(true);
    }
  }

  function handleCloseNotifications() {
    setShowNotifications(false);
    setHasNewNotifications(false);
    setNotifications([]);
    fetch('/api/notifications/mark-seen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers() },
      body: JSON.stringify({ last_seen_submission_id: lastSeenIdRef.current })
    }).catch(e => console.error('Mark-seen error:', e));
  }

  function formatAnswerValue(value) {
    if (Array.isArray(value)) return value.join(', ');
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  }

  function formatDoctorNames(questionAnswers, doctorNames) {
    if (doctorNames) return doctorNames;
    if (!questionAnswers || typeof questionAnswers !== 'object') return '-';
    const doctorIds = new Set();
    for (const key of Object.keys(questionAnswers)) {
      const match = key.match(/^doctor_([^_]+)_/);
      if (match) {
        doctorIds.add(match[1]);
      }
    }
    if (doctorIds.size === 0) return '-';
    return 'Doctors (' + doctorIds.size + ')';
  }

  function formatDoctorRatings(ratings) {
    const items = Array.isArray(ratings) ? ratings : [];
    if (!items.length) return '-';
    return items.map((x) => `${x.doctor_name}: ${'★'.repeat(Number(x.rating))}`).join(' | ');
  }

  function getRatingBg(rating) {
    if (rating >= 4.5) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (rating >= 3.5) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (rating >= 2.5) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-red-100 text-red-700 border-red-200';
  }

  function getDateString(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function handleDashboardDateFilterChange(filterType) {
    const now = new Date();
    let from = '';
    let to = '';
    
    if (filterType === 'today') {
      from = getDateString(now);
      to = getDateString(now);
    } else if (filterType === 'yesterday') {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      from = getDateString(d);
      to = getDateString(d);
    } else if (filterType === 'this_week') {
      const start = new Date(now);
      const day = start.getDay();
      // Monday is start of week: Sunday = 0, so adjust to subtract (day === 0 ? 6 : day - 1)
      const offset = day === 0 ? 6 : day - 1;
      start.setDate(start.getDate() - offset);
      
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      
      from = getDateString(start);
      to = getDateString(end);
    } else if (filterType === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      from = getDateString(start);
      to = getDateString(end);
    } else if (filterType === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      from = getDateString(start);
      to = getDateString(end);
    } else if (filterType === 'custom') {
      setDashboardDateFilter('custom');
      dashboardDateFilterRef.current = 'custom';
      return;
    }
    
    dashboardDateFilterRef.current = filterType;
    dashboardDateRangeRef.current = { date_from: from, date_to: to };
    
    setDashboardDateFilter(filterType);
    setDashboardDateRange({ date_from: from, date_to: to });
    loadDashboardData(from, to);
  }

  function handleCustomDateChange(type, value) {
    const range = { ...dashboardDateRangeRef.current, [type]: value };
    dashboardDateRangeRef.current = range;
    dashboardDateFilterRef.current = 'custom';
    setDashboardDateFilter('custom');
    setDashboardDateRange(range);
    loadDashboardData(range.date_from, range.date_to);
  }

  async function loadDashboardData(dateFrom, dateTo) {
    if (dashboardLoading) return;
    setDashboardLoading(true);
    try {
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      
      const url = '/api/analytics?' + new URLSearchParams(params).toString();
      const surveyParams = new URLSearchParams();
      if (dateFrom) surveyParams.set('date_from', dateFrom);
      if (dateTo) surveyParams.set('date_to', dateTo);
      const [aRes, qRes, dRes, sRes] = await Promise.all([
        fetch(url, { headers: headers() }),
        fetch('/api/questions?all=true', { headers: headers() }),
        fetch('/api/doctors/list', { headers: headers() }),
        fetch('/api/reports/survey-stats?' + surveyParams.toString(), { headers: headers() })
      ]);

      const [aData, qData, dData, sData] = await Promise.all([aRes.json(), qRes.json(), dRes.json(), sRes.json()]);

      if (aRes.ok && !aData.error) setAnalytics(aData);
      if (qRes.ok && !qData.error) setQuestions(qData.questions || []);
      if (dRes.ok && !dData.error) {
        const uniqueDoctors = [];
        const seen = new Set();
        for (const d of (dData.doctors || [])) {
          if (!seen.has(d.id)) {
            seen.add(d.id);
            uniqueDoctors.push(d);
          }
        }
        setDoctorsList(uniqueDoctors);
      }
      if (sRes.ok && !sData.error) setSurveyStats(sData);
    } catch (err) {
      console.error('Dashboard load error:', err);
} finally {
        setDashboardLoading(false);
      }
    }

    async function loadAll(showNotif = true) {
      try {
        if (showNotif) showMessage('Loading...', 'info');

        const range = dashboardDateRangeRef.current;
        const surveyParams = new URLSearchParams();
        if (range.date_from) surveyParams.set('date_from', range.date_from);
        if (range.date_to) surveyParams.set('date_to', range.date_to);
        const [aRes, rRes, qRes, dRes, sRes] = await Promise.all([
          fetch('/api/analytics?' + new URLSearchParams({
            date_from: range.date_from || '',
            date_to: range.date_to || ''
          }), { headers: headers() }),
          fetch(`/api/responses?grouped=true&page=1&limit=${pageLimit}&date_from=${range.date_from || ''}&date_to=${range.date_to || ''}`, { headers: headers() }),
        fetch('/api/questions?all=true', { headers: headers() }),
        fetch('/api/doctors/list', { headers: headers() }),
        fetch('/api/reports/survey-stats?' + surveyParams.toString(), { headers: headers() })
      ]);

      const [aData, rData, qData, dData, sData] = await Promise.all([aRes.json(), rRes.json(), qRes.json(), dRes.json(), sRes.json()]);

      if (!aRes.ok || aData.error) throw new Error(aData.error || 'Failed analytics');
      if (!rRes.ok || rData.error) throw new Error(rData.error || 'Failed responses');
      if (!qRes.ok || qData.error) throw new Error(qData.error || 'Failed questions');

      setAnalytics(aData);
      setResponses(rData.responses || []);
      setQuestions(qData.questions || []);
      if (sRes.ok && !sData.error) setSurveyStats(sData);
      if (dRes.ok && !dData.error) {
        const uniqueDoctors = [];
        const seen = new Set();
        for (const d of (dData.doctors || [])) {
          if (!seen.has(d.id)) {
            seen.add(d.id);
            uniqueDoctors.push(d);
          }
        }
        setDoctorsList(uniqueDoctors);
      }
        const newLimit = rData.limit || pageLimit;
        setPagination({
          page: rData.page || 1,
          limit: newLimit,
          total: rData.total || 0,
          total_pages: rData.total_pages || 0
        });
        if (rData.limit) setPageLimit(rData.limit);

      setSelectedIds(new Set());
      if (showNotif) showMessage('Loaded successfully', 'success');
    } catch (err) {
      if (showNotif) showMessage('Load failed: ' + err.message, 'error');
    }
}

  async function fetchResponsesWithFilters(pageOverride, currentFilters, limitOverride) {
    setLoadingResponses(true);
    const currentLimit = limitOverride || pageLimit;
    try {
      const params = new URLSearchParams({ grouped: 'true' });
      if (currentFilters.search) params.set('search', currentFilters.search);
      if (currentFilters.date_from) params.set('date_from', currentFilters.date_from);
      if (currentFilters.date_to) params.set('date_to', currentFilters.date_to);
      params.set('page', pageOverride);
      params.set('limit', currentLimit);

      const res = await fetch('/api/responses?' + params.toString(), { headers: headers() });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed');

      setResponses(data.responses || []);
      setPagination((p) => ({
        page: data.page || 1,
        limit: data.limit || p.limit,
        total: data.total || 0,
        total_pages: data.total_pages || 0
      }));
    } catch (err) {
      showMessage('Load failed: ' + err.message, 'error');
    } finally {
      setLoadingResponses(false);
    }
  }

  function changePage(newPage) {
    if (newPage < 1 || newPage > pagination.total_pages) return;
    fetchResponsesWithFilters(newPage, filters);
  }

  function handleFilterChange(newFilters) {
    setFilters(newFilters);
    setPagination((p) => ({ ...p, page: 1 }));
    setSelectedIds(new Set());
    fetchResponsesWithFilters(1, newFilters);
  }

  React.useEffect(() => {
    if (['dashboard', 'questions', 'responses'].includes(activeTab)) return;
    loadAll(false);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const tabAtLoadStart = activeTab;

    async function loadInitialVisibleTab() {
      try {
        if (activeTab === 'dashboard' || activeTab === 'questions' || activeTab === 'responses') {
          await loadAll(false);
        } else if (activeTab === 'users') {
          await fetchUsers();
        } else if (activeTab === 'activity') {
          await fetchActivityLogs(1, activityPagination.limit, activityFilters);
        } else if (activeTab === 'doctors') {
          await fetchDoctors();
        } else if (activeTab === 'patients') {
          await fetchPatients();
        } else if (activeTab === 'roles') {
          await fetchRoles();
        } else if (activeTab === 'email-settings') {
          await fetchEmailSettings();
        } else if (activeTab === 'encounters') {
          await Promise.all([
            fetchEncounters(),
            fetchPatients(1, ''),
            fetchDoctors(1, '')
          ]);
        }
      } finally {
        if (!cancelled) {
          initialLoadedTabRef.current = tabAtLoadStart;
          initialPageLoadedRef.current = true;
          setInitialPageLoading(false);
        }
      }
    }

    loadInitialVisibleTab();

    return () => {
      cancelled = true;
    };
  }, []);

  function setType(type) {
    setNewQuestion((prev) => ({
      ...prev,
      type,
      options: type === 'single_choice' || type === 'multi_choice' || type === 'yes_no' ? prev.options : [],
      options_en: type === 'single_choice' || type === 'multi_choice' || type === 'yes_no' ? prev.options_en : [],
      options_am: type === 'single_choice' || type === 'multi_choice' || type === 'yes_no' ? prev.options_am : [],
      min: type === 'stars' ? 1 : prev.min,
      max: type === 'stars' ? 5 : prev.max
    }));
  }

  function addOption() {
    const opt = optionInput.trim();
    if (!opt) return;
    setNewQuestion((prev) => {
      const currentOptions = prev.options_en || prev.options || [];
      if (currentOptions.includes(opt)) return prev;
      return { ...prev, options_en: [...currentOptions, opt], options: [...currentOptions, opt] };
    });
    setOptionInput('');
  }

  function addOptionAm() {
    const opt = optionInputAm.trim();
    if (!opt) return;
    setNewQuestion((prev) => {
      const currentOptions = prev.options_am || [];
      if (currentOptions.includes(opt)) return prev;
      return { ...prev, options_am: [...currentOptions, opt] };
    });
    setOptionInputAm('');
  }

  function removeOption(value) {
    setNewQuestion((prev) => {
      const options_en = (prev.options_en || prev.options || []).filter((x) => x !== value);
      const options_am = (prev.options_am || []).filter((x) => x !== value);
      return { ...prev, options: options_en, options_en, options_am };
    });
  }

  function removeOptionAm(value) {
    setNewQuestion((prev) => {
      const options_am = (prev.options_am || []).filter((x) => x !== value);
      return { ...prev, options_am };
    });
  }

  function addOptionOm() {
    const opt = optionInputOm.trim();
    if (!opt) return;
    setNewQuestion((prev) => {
      const currentOptions = prev.options_om || [];
      if (currentOptions.includes(opt)) return prev;
      return { ...prev, options_om: [...currentOptions, opt] };
    });
    setOptionInputOm('');
  }

  function removeOptionOm(value) {
    setNewQuestion((prev) => {
      const options_om = (prev.options_om || []).filter((x) => x !== value);
      return { ...prev, options_om };
    });
  }

  async function createQuestion(e) {
    e.preventDefault();
    try {
      if (!newQuestion.label_en.trim()) throw new Error('Question label (English) is required');
      const isChoice = newQuestion.type === 'single_choice' || newQuestion.type === 'multi_choice' || newQuestion.type === 'yes_no';
      if (isChoice && (newQuestion.options_en || newQuestion.options || []).length === 0) {
        throw new Error('Add at least one English option for choice question');
      }

      const payload = {
        key: newQuestion.key,
        label_en: newQuestion.label_en,
        label_am: newQuestion.label_am,
        label_om: newQuestion.label_om || '',
        type: newQuestion.type,
        required: newQuestion.required,
        options_en: newQuestion.options_en || newQuestion.options || [],
        options_am: newQuestion.options_am || [],
        options_om: newQuestion.options_om || [],
        min: newQuestion.min,
        max: newQuestion.max,
        page_number: newQuestion.page_number || 1,
        category: newQuestion.category
      };

      let res, data;
      if (editingQuestion) {
        res = await fetch('/api/questions/' + editingQuestion.id, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...headers() },
          body: JSON.stringify(payload)
        });
        data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Question update failed');
        setEditingQuestion(null);
        showMessage('Question updated successfully', 'success');
      } else {
        res = await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers() },
          body: JSON.stringify(payload)
        });
        data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Question create failed');
        showMessage('Question created successfully', 'success');
      }

      setNewQuestion({ key: '', label_en: '', label_am: '', label_om: '', type: 'stars', required: true, options_en: [], options_am: [], options_om: [], options: [], min: 1, max: 5, page_number: 1, category: 'general' });
      setOptionInput('');
      setOptionInputAm('');
      setOptionInputOm('');
      await loadAll(false);
    } catch (err) {
      showMessage(err.message, 'error');
    }
  }

  function editQuestion(q) {
    setEditingQuestion(q);
    const labelObj = q.label || q;
    const optionsObj = q.options || {};
    setNewQuestion({
      key: q.key || '',
      label_en: labelObj.en || labelObj,
      label_am: labelObj.am || '',
      label_om: labelObj.om || '',
      type: q.type || 'stars',
      required: q.required !== undefined ? q.required : true,
      options_en: optionsObj.en || (Array.isArray(q.options) ? q.options : []),
      options_am: optionsObj.am || [],
      options_om: optionsObj.om || [],
      options: optionsObj.en || (Array.isArray(q.options) ? q.options : []),
      min: q.min_value || q.min || 1,
      max: q.max_value || q.max || 5,
      page_number: q.page_number || 1,
      category: q.category || 'general'
    });
    setOptionInput('');
    setOptionInputAm('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingQuestion(null);
    setNewQuestion({ key: '', label_en: '', label_am: '', label_om: '', type: 'stars', required: true, options_en: [], options_am: [], options_om: [], options: [], min: 1, max: 5, page_number: 1, category: 'general' });
    setOptionInput('');
    setOptionInputAm('');
  }

  async function toggleQuestionActive(q) {
    try {
      const res = await fetch('/api/questions/' + q.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify({ is_active: !q.is_active })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Question update failed');
      await loadAll(false);
      showMessage(q.is_active ? 'Question disabled' : 'Question enabled', 'success');
    } catch (err) {
      showMessage(err.message, 'error');
    }
  }

  async function deleteQuestion(q) {
    setDeleteModal({ isOpen: true, question: q });
  }

  async function confirmDeleteQuestion() {
    if (!deleteModal.question) return;
    try {
      const res = await fetch('/api/questions/' + deleteModal.question.id, {
        method: 'DELETE',
        headers: headers()
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Question delete failed');
      setDeleteModal({ isOpen: false, question: null });
      await loadAll(false);
      showMessage('Question deleted', 'success');
    } catch (err) {
      showMessage(err.message, 'error');
      setDeleteModal({ isOpen: false, question: null });
    }
  }

  async function moveQuestion(questionId, direction) {
    const question = questions.find((x) => x.id === questionId);
    if (!question) return;
    
    const samePageQuestions = questions.filter((q) => (q.page_number || 1) === (question.page_number || 1));
    const idx = samePageQuestions.findIndex((x) => x.id === questionId);
    if (idx < 0) return;

    const next = [...samePageQuestions];
    const swapWith = idx + direction;
    if (swapWith < 0 || swapWith >= next.length) return;

    const temp = next[idx];
    next[idx] = next[swapWith];
    next[swapWith] = temp;

    const ids = next.map((q) => q.id);
    const res = await fetch('/api/questions/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers() },
      body: JSON.stringify({ ids })
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'Reorder failed');

    await loadAll(false);
  }

  function getExportData(data) {
    return data.map((r) => {
      const qa = r.question_answers || {};
      const row = {
        'Submission ID': r.submission_id,
        'Submitted At': r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '',
        'Visit ID': r.visit_id,
        'Patient Name': r.patient_name,
        'Doctors': r.doctor_names || '-'
      };
      
      questions.filter(q => q.category === 'doctor').forEach((q) => {
        const answers = [];
        const optionsObj = q.options || {};
        const optionsEn = Array.isArray(optionsObj) ? optionsObj : (optionsObj.en || []);
        const optionsAm = optionsObj.am || [];
        const matchKey = q.key || String(q.id);
        for (const key of Object.keys(qa)) {
          if (key.endsWith('_' + matchKey)) {
            const rawAnswer = qa[key];
            let displayAnswer = rawAnswer;
            if (q.type === 'text') {
              displayAnswer = rawAnswer;
            } else if (Array.isArray(rawAnswer)) {
              const translated = rawAnswer.map(ans => {
                const amIndex = optionsAm.indexOf(String(ans));
                return amIndex !== -1 && optionsEn[amIndex] ? optionsEn[amIndex] : ans;
              });
              displayAnswer = translated.join(', ');
            } else {
              const amIndex = optionsAm.indexOf(String(rawAnswer));
              if (amIndex !== -1 && optionsEn[amIndex]) {
                displayAnswer = optionsEn[amIndex];
              }
            }
            answers.push(displayAnswer);
          }
        }
        row[q.key || q.id] = formatAnswerValue(answers.length > 0 ? answers.join(', ') : '-');
      });
      
      questions.filter(q => q.category === 'general').forEach((q) => {
        const rawAnswer = qa[q.key];
        let displayAnswer = rawAnswer;
        if (q.type === 'text') {
          displayAnswer = rawAnswer;
        } else {
          const optionsObj = q.options || {};
          const optionsEn = Array.isArray(optionsObj) ? optionsObj : (optionsObj.en || []);
          const optionsAm = optionsObj.am || [];
          if (Array.isArray(rawAnswer)) {
            const translated = rawAnswer.map(ans => {
              const amIndex = optionsAm.indexOf(String(ans));
              return amIndex !== -1 && optionsEn[amIndex] ? optionsEn[amIndex] : ans;
            });
            displayAnswer = translated.join(', ');
          } else if (typeof rawAnswer === 'string') {
            const amIndex = optionsAm.indexOf(rawAnswer);
            if (amIndex !== -1 && optionsEn[amIndex]) {
              displayAnswer = optionsEn[amIndex];
            }
          }
        }
        row[q.key] = formatAnswerValue(displayAnswer);
      });
      return row;
    });
  }

  function exportToCSV(data) {
    const rows = getExportData(data);
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => headers.map((h) => {
        const val = String(r[h] || '').replace(/"/g, '""');
        return '"' + val + '"';
      }).join(','))
    ].join('\n');
    downloadFile(csv, 'responses.csv', 'text/csv');
  }

  function exportSelectedToCSV() {
    const selectedData = responses.filter((r) => selectedIds.has(r.submission_id));
    if (selectedData.length === 0) {
      showMessage('No responses selected', 'error');
      return;
    }
    const rows = getExportData(selectedData);
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => headers.map((h) => {
        const val = String(r[h] || '').replace(/"/g, '""');
        return '"' + val + '"';
      }).join(','))
    ].join('\n');
    downloadFile(csv, `responses_selected_${selectedIds.size}.csv`, 'text/csv');
    showMessage(`Downloaded ${selectedIds.size} responses as CSV`, 'success');
  }

  function exportSelectedToExcel() {
    const selectedData = responses.filter((r) => selectedIds.has(r.submission_id));
    if (selectedData.length === 0) {
      showMessage('No responses selected', 'error');
      return;
    }
    const rows = getExportData(selectedData);
    if (rows.length === 0) return;
    
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Responses');
    XLSX.writeFile(wb, `responses_selected_${selectedIds.size}.xlsx`);
    showMessage(`Downloaded ${selectedIds.size} responses as Excel`, 'success');
  }

  function exportToExcel() {
    if (responses.length === 0) {
      showMessage('No responses to export', 'error');
      return;
    }
    const rows = getExportData(responses);
    if (rows.length === 0) return;
    
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Responses');
    XLSX.writeFile(wb, 'all_responses.xlsx');
    showMessage(`Downloaded ${responses.length} responses as Excel`, 'success');
  }

  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function toggleSelectAll() {
    if (selectedIds.size === responses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(responses.map((r) => r.submission_id)));
    }
  }

  function toggleSelect(id) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function openDeleteModal() {
    if (selectedIds.size === 0) return;
    setResponseDeleteModal({ isOpen: true, ids: Array.from(selectedIds), count: selectedIds.size });
  }

  async function confirmDeleteResponses() {
    if (responseDeleteModal.ids.length === 0) return;
    try {
      const res = await fetch('/api/responses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify({ ids: responseDeleteModal.ids })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Delete failed');
      setResponseDeleteModal({ isOpen: false, ids: [], count: 0 });
      setSelectedIds(new Set());
      await fetchResponsesWithFilters(1, filters);
      showMessage('Deleted ' + data.deleted + ' response(s)', 'success');
    } catch (err) {
      showMessage('Delete failed: ' + err.message, 'error');
      setResponseDeleteModal({ isOpen: false, ids: [], count: 0 });
    }
  }

  function deleteSelected() {
    openDeleteModal();
  }

  function clearFilters() {
    setFilters({ search: '', date_from: '', date_to: '' });
    setSearchInput('');
    handleFilterChange({ search: '', date_from: '', date_to: '' });
  }

  const allSelected = responses.length > 0 && selectedIds.size === responses.length;
  const someSelected = selectedIds.size > 0;

  const questionTypeCards = [
    { id: 'stars', label: 'Stars', icon: '★' },
    { id: 'text', label: 'Text', icon: 'T' },
    { id: 'single_choice', label: 'Single', icon: '1' },
    { id: 'multi_choice', label: 'Multi', icon: '∞' },
    { id: 'number', label: 'Number', icon: '#' },
    { id: 'yes_no', label: 'Yes/No', icon: '?' }
  ];

  const isChoice = newQuestion.type === 'single_choice' || newQuestion.type === 'multi_choice' || newQuestion.type === 'yes_no';
  const isRanged = newQuestion.type === 'stars' || newQuestion.type === 'number';

  const menuItems = allMenuItems.filter(item => {
    if (item.children) {
      item.filteredChildren = item.children.filter(c => userPerms.includes(c.id) || userPerms.includes(item.id));
      return item.filteredChildren.length > 0 || userPerms.includes(item.id);
    }
    return userPerms.includes(item.id);
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        menuItems={menuItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className={`flex-1 overflow-hidden transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        <AdminHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          handleOpenNotifications={handleOpenNotifications}
          showNotifications={showNotifications}
          handleCloseNotifications={handleCloseNotifications}
          hasNewNotifications={hasNewNotifications}
          notifications={notifications}
          currentUser={currentUser}
          onLogout={onLogout}
        />

        <div className="p-8">
        {initialPageLoading ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <ClipLoader size={52} color="#3B82F6" />
          </div>
        ) : (
          <>
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-fade-in ${
            message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {message.type === 'error' && <AlertCircle className="w-5 h-5" />}
            {message.type === 'success' && <Check className="w-5 h-5" />}
            {message.type === 'info' && <Activity className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        {activeTab === 'dashboard' && !dashboardLoading && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
                <p className="text-gray-500">Overview of your patient feedback system</p>
              </div>
              
              <div className="flex items-center gap-3">
                <select
                  value={dashboardDateFilter}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      handleDashboardDateFilterChange('custom');
                    } else {
                      handleDashboardDateFilterChange(e.target.value);
                    }
                  }}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="custom">Custom Range</option>
                </select>
                
                {dashboardDateFilter === 'custom' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={dashboardDateRange.date_from}
                      onChange={(e) => { handleCustomDateChange('date_from', e.target.value); }}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="date"
                      value={dashboardDateRange.date_to}
                      onChange={(e) => { handleCustomDateChange('date_to', e.target.value); }}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => loadAll(false)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                    <MessageSquare className="w-7 h-7 text-white" />
                  </div>
                  <TrendingUp className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-gray-500 text-sm font-medium">Total Submissions</p>
                <p className="text-4xl font-bold text-gray-800 mt-1">{analytics?.total_submissions || 0}</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-purple-100 text-purple-600 rounded-full font-medium">Doctors</span>
                </div>
                <p className="text-gray-500 text-sm font-medium">Doctors Rated</p>
                <p className="text-4xl font-bold text-gray-800 mt-1">{analytics?.doctor_averages?.length || 0}</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-600 rounded-full font-medium">Questions</span>
                </div>
                <p className="text-gray-500 text-sm font-medium">Survey Questions</p>
                <p className="text-4xl font-bold text-gray-800 mt-1">{questions.length}</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
                    <Star className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-amber-100 text-amber-600 rounded-full font-medium">Avg</span>
                </div>
                <p className="text-gray-500 text-sm font-medium">Average Rating</p>
                <p className="text-4xl font-bold text-gray-800 mt-1">
                  {analytics?.doctor_averages?.length > 0
                    ? (analytics.doctor_averages.reduce((sum, d) => sum + Number(d.avg_rating), 0) / analytics.doctor_averages.length).toFixed(1)
                    : '0.0'}
                </p>
              </div>
</div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-green-600" />
                  </div>
                  Survey Status
                </h3>
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <PieChart width={220} height={220}>
                      <Pie
                        data={[
                          { name: "Filled", value: surveyStats?.filled || 0 },
                          { name: "Not Filled", value: surveyStats?.not_filled || 0 }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                      >
                        <Cell fill="#22c55e" />
                        <Cell fill="#d1d5db" />
                      </Pie>
                    </PieChart>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-gray-800">{surveyStats?.total_sent || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-8 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm text-gray-600">Filled: <strong className="text-gray-800">{surveyStats?.filled || 0}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-gray-300" />
                      <span className="text-sm text-gray-600">Not Filled: <strong className="text-gray-800">{surveyStats?.not_filled || 0}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                  </div>
                  Doctor Performance
                </h3>
              </div>

              {analytics?.doctor_averages?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics.doctor_averages.map((doctor, index) => {
                    const rating = Number(doctor.avg_rating || 0);
                    const percentage = (rating / 5) * 100;
                    const questionRatings = doctor.question_ratings || {};
                    const questionAnswers = doctor.question_answers || {};
                    const doctorQuestionsList = questions.filter(q => q.category === 'doctor');
                    const orderedKeys = doctorQuestionsList.map(q => q.key).filter(key => key && (questionRatings[key] !== undefined || questionAnswers[key] !== undefined));
                    const rank = index + 1;
                    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
                    
                    let badge = null;
                    if (rating >= 4.5) {
                      badge = { label: 'Top Performer', color: 'bg-gradient-to-r from-emerald-500 to-teal-500', text: 'text-white' };
                    } else if (rating >= 4.0) {
                      badge = { label: 'Excellent', color: 'bg-gradient-to-r from-blue-500 to-indigo-500', text: 'text-white' };
                    } else if (rating < 3.0) {
                      badge = { label: 'Needs Improvement', color: 'bg-gradient-to-r from-red-500 to-rose-500', text: 'text-white' };
                    }
                    
                    return (
                      <div key={doctor.doctor_id} className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100 hover:shadow-xl transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                {doctor.doctor_name.charAt(0)}
                              </div>
                              {rank <= 3 && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center text-xs">
                                  {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-800 text-sm">{doctor.doctor_name}</p>
                                {rank <= 3 && <span className="text-xs">{rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}</span>}
                              </div>
                              <p className="text-xs text-gray-500">{(doctor.patient_count ?? doctor.rating_count) || 0} patients</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className={`px-2 py-1 rounded-lg text-xs font-bold ${getRatingBg(rating)}`}>
                              {rating.toFixed(1)}
                            </div>
                            {badge && (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.color} ${badge.text}`}>
                                {badge.label}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                          <div
                            className={`h-1.5 rounded-full ${
                              rating >= 4.5 ? 'bg-emerald-500' :
                              rating >= 3.5 ? 'bg-blue-500' :
                              rating >= 2.5 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: percentage > 0 ? `${percentage}%` : '0%' }}
                          />
                        </div>
                        
                        {orderedKeys.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-gray-100">
                            {orderedKeys.map((qKey) => {
                              const starRating = questionRatings[qKey];
                              const otherAnswer = questionAnswers[qKey];
                              
                              if (starRating !== undefined) {
                                return (
                                  <div key={qKey} className="flex items-center justify-between py-0.5">
                                    <span className="text-xs text-gray-600 truncate flex-1">{qKey}</span>
                                    <div className="flex items-center gap-1 ml-2">
                                      <StarRating value={starRating} size="xs" />
                                      <span className="text-xs font-medium text-gray-600">{starRating.toFixed(1)}</span>
                                    </div>
                                  </div>
                                );
                              }
                              
                              if (otherAnswer) {
                                const counts = otherAnswer.counts || {};
                                const percentages = otherAnswer.percentages || {};
                                const total = otherAnswer.total || 0;
                                const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
                                
                                return (
                                  <div key={qKey} className="py-1">
                                    <div className="flex items-center justify-between py-0.5">
                                      <span className="text-xs text-gray-600 truncate flex-1">{qKey}</span>
                                    </div>
                                    <div className="space-y-0.5 ml-1">
                                      {entries.map(([answer, count]) => {
                                        const percent = percentages[answer] || 0;
                                        const isYes = answer.toLowerCase() === 'yes';
                                        return (
                                          <div key={answer} className="flex items-center justify-between">
                                            <span className={`text-xs font-medium ${isYes ? 'text-emerald-600' : 'text-red-600'}`}>{answer}</span>
                                            <div className="flex items-center gap-1">
                                              <span className="text-xs text-gray-500">{count}</span>
                                              <span className="text-xs text-gray-400">({percent}%)</span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              }
                              
                              return null;
                            })}
        </div>
      )}
    </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 font-medium">No ratings yet</p>
                  <p className="text-sm text-gray-400">Complete surveys to see analytics</p>
                </div>
              )}
</div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Star className="w-4 h-4 text-white" />
                </div>
                General Questions - Average Rating
              </h3>
              
              {(analytics?.question_breakdown?.length > 0 || analytics?.yesno_breakdown?.length > 0) ? (
                <div className="space-y-6">
                  {(() => {
                    const generalQuestionsList = questions.filter(q => q.category === 'general');
                    const orderedGeneralKeys = generalQuestionsList.map(q => q.key);
                    const starMap = new Map((analytics?.star_rating_breakdown || []).map(q => [q.question_key, q]));
                    const yesNoMap = new Map((analytics?.yesno_breakdown || []).map(q => [q.question_key, q]));
                    const orderedItems = [];
                    for (const key of orderedGeneralKeys) {
                      if (starMap.has(key)) orderedItems.push({ type: 'star', data: starMap.get(key) });
                      if (yesNoMap.has(key)) orderedItems.push({ type: 'yesno', data: yesNoMap.get(key) });
                    }
                    return orderedItems.filter(item => item.data).map((item) => {
                      if (item.type === 'star') {
                        const q = item.data;
                        const avg = q.average || 0;
                        const percentage = (avg / 5) * 100;
                        let color = '#ef4444';
                        if (avg >= 4) color = '#10b981';
                        else if (avg >= 3) color = '#f59e0b';
                        return (
                          <div key={q.question_key}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-gray-800">{q.question_key}</span>
                              <span className="font-bold text-lg" style={{ color }}>{avg.toFixed(1)} / 5</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: color }} />
                            </div>
                            <div className="flex justify-between mt-1 text-xs text-gray-500">
                              <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                            </div>
                          </div>
                        );
                      } else {
                        const yn = item.data;
                        return (
                          <div key={yn.question_key} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-gray-800">{yn.question_key}</span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                                  <span className="text-sm text-gray-700">Yes</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-gray-800">{yn.yes}</span>
                                  <span className="text-sm text-gray-500">({yn.yes_percent}%)</span>
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${yn.yes_percent}%` }} />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                                  <span className="text-sm text-gray-700">No</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-gray-800">{yn.no}</span>
                                  <span className="text-sm text-gray-500">({yn.no_percent}%)</span>
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div className="h-full bg-red-500 rounded-full" style={{ width: `${yn.no_percent}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      }
                    });
                  })()}
                </div>
              ) : (
                <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 font-medium">No data yet</p>
                  <p className="text-sm text-gray-400">Complete surveys to see analytics</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && dashboardLoading && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-center py-16"><ClipLoader size={40} color="#3B82F6" /></div>
          </div>
        )}

        {activeTab === 'questions' && (
          <QuestionsSection
            questions={questions}
            editingQuestion={editingQuestion}
            newQuestion={newQuestion}
            createQuestion={createQuestion}
            setNewQuestion={setNewQuestion}
            questionTypeCards={questionTypeCards}
            setType={setType}
            isChoice={isChoice}
            isRanged={isRanged}
            optionInput={optionInput}
            setOptionInput={setOptionInput}
            addOption={addOption}
            removeOption={removeOption}
            optionInputAm={optionInputAm}
            setOptionInputAm={setOptionInputAm}
            addOptionAm={addOptionAm}
            removeOptionAm={removeOptionAm}
            optionInputOm={optionInputOm}
            setOptionInputOm={setOptionInputOm}
            addOptionOm={addOptionOm}
            removeOptionOm={removeOptionOm}
            cancelEdit={cancelEdit}
            questionFilter={questionFilter}
            setQuestionFilter={setQuestionFilter}
            moveQuestion={moveQuestion}
            editQuestion={editQuestion}
            toggleQuestionActive={toggleQuestionActive}
            deleteQuestion={deleteQuestion}
          />
        )}

        {activeTab === 'responses' && (
          <ResponsesSection
            responses={responses}
            downloadDropdown={downloadDropdown}
            setDownloadDropdown={setDownloadDropdown}
            exportToCSV={exportToCSV}
            exportToExcel={exportToExcel}
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            handleFilterChange={handleFilterChange}
            filters={filters}
            clearFilters={clearFilters}
            someSelected={someSelected}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            allSelected={allSelected}
            toggleSelectAll={toggleSelectAll}
            exportSelectedToCSV={exportSelectedToCSV}
            exportSelectedToExcel={exportSelectedToExcel}
            deleteSelected={deleteSelected}
            questions={questions}
            loadingResponses={loadingResponses}
            toggleSelect={toggleSelect}
            formatDoctorNames={formatDoctorNames}
            formatAnswerValue={formatAnswerValue}
            pagination={pagination}
            setPageLimit={setPageLimit}
            setPagination={setPagination}
            fetchResponsesWithFilters={fetchResponsesWithFilters}
            changePage={changePage}
          />
        )}

        {activeTab === 'users' && (
          <UsersSection
            users={users}
            loadingUsers={loadingUsers}
            currentUser={currentUser}
            onAddUser={() => setShowUserModal(true)}
            onEditUser={handleOpenEditUser}
            onDeleteUser={confirmDeleteUser}
          />
        )}

          {editUserModal.isOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditUserModal({ isOpen: false, user: null })}>
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-modal shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Edit User</h3>
                <button onClick={() => setEditUserModal({ isOpen: false, user: null })} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={editUserData.username}
                    onChange={(e) => setEditUserData({ ...editUserData, username: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="Enter username"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editUserData.email}
                    onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="Enter email"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={editUserData.password}
                    onChange={(e) => setEditUserData({ ...editUserData, password: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="Leave empty to keep current password"
                    minLength={6}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Active Status</label>
                  <button
                    type="button"
                    onClick={() => setEditUserData({ ...editUserData, is_active: !editUserData.is_active })}
                    className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors"
                  >
                    {editUserData.is_active ? (
                      <ToggleRight className="w-10 h-10 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-gray-300" />
                    )}
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={editUserData.role_id}
                    onChange={(e) => setEditUserData({ ...editUserData, role_id: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                  >
                    <option value="">No Role</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditUserModal({ isOpen: false, user: null })}
                    className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={userLoading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg"
                  >
                    {userLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <ActivitySection
            activityLogs={activityLogs}
            activityFilters={activityFilters}
            activityPagination={activityPagination}
            loadingActivity={loadingActivity}
            onActivityFilterChange={handleActivityFilterChange}
            onRefresh={() => fetchActivityLogs(activityPagination.page, activityPagination.limit, activityFilters)}
            onChangePage={changeActivityPage}
            onChangeLimit={(limit) => fetchActivityLogs(1, limit, activityFilters)}
          />
        )}

        {activeTab === 'doctor-ratings' && (
          <DoctorRatingsPage showMessage={showMessage} />
        )}

        {activeTab === 'doctor-report' && (
          <ReportsPage showMessage={showMessage} reportType="doctor" />
        )}

        {activeTab === 'general-report' && (
          <ReportsPage showMessage={showMessage} reportType="general" />
        )}

        {activeTab === 'survey-report' && (
          <SurveyReport />
        )}

        {activeTab === 'doctors' && (
          <DoctorsSection
            doctors={doctors}
            doctorsFilter={doctorsFilter}
            doctorsSearch={doctorsSearch}
            doctorsSearchInput={doctorsSearchInput}
            setDoctorsSearchInput={setDoctorsSearchInput}
            handleDoctorsFilter={handleDoctorsFilter}
            handleDoctorsSearch={handleDoctorsSearch}
            clearDoctorsSearch={clearDoctorsSearch}
            doctorLoading={doctorLoading}
            onOpenCreateDoctor={() => {
              setDoctorForm({ name: '', department: '', email: '', image_url: '' });
              setShowDoctorModal(true);
            }}
            onOpenEditDoctor={(doctor) => {
              setDoctorForm({ name: doctor.name, department: doctor.department || '', email: doctor.email || '', image_url: doctor.image_url || '' });
              setEditingDoctor(doctor);
            }}
            onDeleteDoctor={(doctor) => setDeleteDoctorModal({ isOpen: true, doctor })}
            onReactivateDoctor={handleReactivateDoctor}
            doctorsPagination={doctorsPagination}
            changeDoctorsPage={changeDoctorsPage}
            fetchDoctorsWithLimit={fetchDoctorsWithLimit}
          />
        )}

        {activeTab === 'patients' && (
          <PatientsSection
            patients={patients}
            patientsSearch={patientsSearch}
            patientsSearchInput={patientsSearchInput}
            setPatientsSearchInput={setPatientsSearchInput}
            handlePatientsSearch={handlePatientsSearch}
            clearPatientsSearch={clearPatientsSearch}
            patientLoading={patientLoading}
            onOpenCreatePatient={() => {
              setPatientForm({ name: '', phone: '+251' });
              setShowPatientModal(true);
            }}
            onOpenEditPatient={(patient) => {
              setPatientForm({ name: patient.name, phone: patient.phone || '+251' });
              setEditingPatient(patient);
            }}
            onDeletePatient={(patient) => setDeletePatientModal({ isOpen: true, patient })}
            patientsPagination={patientsPagination}
            changePatientsPage={changePatientsPage}
            fetchPatientsWithLimit={fetchPatientsWithLimit}
          />
        )}

        {activeTab === 'encounters' && (
          <EncountersSection
            encounters={encounters}
            encountersPagination={encountersPagination}
            sendingAllSms={sendingAllSms}
            onSendAllSurveySms={handleSendAllSurveySms}
            onOpenCreateEncounter={() => {
              setEncounterForm({ patient_id: '', doctor_ids: [], status: 'in_progress' });
              loadEncounterFormData();
              setShowEncounterModal(true);
            }}
            encountersSearchInput={encountersSearchInput}
            setEncountersSearchInput={setEncountersSearchInput}
            onSearchEncounters={() => {
              setEncountersSearch(encountersSearchInput);
              fetchEncounters(1, encountersSearchInput);
            }}
            encountersDateFrom={encountersDateFrom}
            onChangeDateFrom={(value) => {
              setEncountersDateFrom(value);
              fetchEncounters(1, encountersSearch);
            }}
            encountersDateTo={encountersDateTo}
            onChangeDateTo={(value) => {
              setEncountersDateTo(value);
              fetchEncounters(1, encountersSearch);
            }}
            encounterSurveyStatus={encounterSurveyStatus}
            onChangeSurveyStatus={(value) => {
              setEncounterSurveyStatus(value);
              fetchEncounters(1, encountersSearch);
            }}
            onClearFilters={() => {
              setEncountersSearchInput('');
              setEncountersSearch('');
              setEncounterSurveyStatus('');
              const first = new Date();
              first.setDate(1);
              const last = new Date();
              last.setMonth(last.getMonth() + 1, 0);
              setEncountersDateFrom(first.toISOString().split('T')[0]);
              setEncountersDateTo(last.toISOString().split('T')[0]);
              fetchEncounters(1, '');
            }}
            encounterSelectedIds={encounterSelectedIds}
            onToggleSelectAll={toggleEncountersSelectAll}
            onClearSelected={() => setEncounterSelectedIds(new Set())}
            exportEncountersToCSV={exportEncountersToCSV}
            exportEncountersToExcel={exportEncountersToExcel}
            onDeleteSelected={openEncountersDeleteBulkModal}
            encounterLoading={encounterLoading}
            onToggleEncounterSelect={toggleEncountersSelect}
            sendingSms={sendingSms}
            onSendSurveySms={handleSendSurveySms}
            onViewEncounter={(encounter) => setViewEncounterModal({ isOpen: true, encounter })}
            onFinishEncounter={handleFinishEncounter}
            onDeleteEncounter={(encounter) => setDeleteEncounterModal({ isOpen: true, encounter })}
            onChangeLimit={(limit) => {
              setEncountersPagination((previous) => ({ ...previous, limit, page: 1 }));
              fetchEncountersWithLimit(1, encountersSearch, limit);
            }}
            onChangePage={changeEncountersPage}
          />
        )}

        {activeTab === 'roles' && (
          <RolesSection
            roles={roles}
            loadingRoles={loadingRoles}
            allModules={allModules}
            onAddRole={() => {
              setShowRoleModal(true);
              setRoleForm({ name: '' });
            }}
            onToggleRolePermission={toggleRolePermission}
            onDeleteRole={(role) => setDeleteRoleModal({ isOpen: true, roleId: role.id, roleName: role.name })}
          />
        )}

        {activeTab === 'email-settings' && (
          <EmailSettingsSection
            emailSettings={emailSettings}
            loadingEmailSettings={loadingEmailSettings}
            setEmailSettings={setEmailSettings}
            showSmtpPass={showSmtpPass}
            setShowSmtpPass={setShowSmtpPass}
            emailSaving={emailSaving}
            emailTesting={emailTesting}
            onSave={handleSaveEmailSettings}
            onTest={handleTestEmail}
          />
        )}

        {activeTab === 'import' && (
          <ImportSection
            importModule={importModule}
            onImportModuleChange={(value) => {
              setImportModule(value);
              setImportResults(null);
            }}
            importFile={importFile}
            setImportFile={setImportFile}
            importResults={importResults}
            importLoading={importLoading}
            onStartImport={handleImportData}
          />
        )}

        {showRoleModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Create Role</h3>
              <form onSubmit={handleCreateRole} className="space-y-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-2">Role Name</label>
                  <input
                    type="text"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-200"
                    placeholder="Enter role name"
                    required
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowRoleModal(false)} className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700">Create</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteRoleModal.isOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleteRoleModal({ isOpen: false, roleId: null, roleName: '' })}>
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden animate-modal shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Role</h3>
                <p className="text-gray-500 mb-1">Are you sure you want to delete</p>
                <p className="font-semibold text-gray-700 mb-4">"{deleteRoleModal.roleName}"?</p>
                <p className="text-sm text-gray-400 mb-6">Users with this role will lose module access.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteRoleModal({ isOpen: false, roleId: null, roleName: '' })}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteRole(deleteRoleModal.roleId)}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showUserModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowUserModal(false)}>
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-modal shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Add New User</h3>
                <button onClick={() => setShowUserModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="Enter username"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="Enter email"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="Enter password (min 6 characters)"
                    required
                    minLength={6}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUserModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={userLoading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg"
                  >
                    {userLoading ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, question: null })}
        onConfirm={confirmDeleteQuestion}
        title="Delete Question"
        message={`Are you sure you want to delete "${deleteModal.question?.label}"? This action cannot be undone.`}
        type="danger"
      />
      <DeleteModal
        isOpen={responseDeleteModal.isOpen}
        onClose={() => setResponseDeleteModal({ isOpen: false, ids: [], count: 0 })}
        onConfirm={confirmDeleteResponses}
        title="Delete Responses"
        message={`Are you sure you want to delete ${responseDeleteModal.count} response(s)? This action cannot be undone.`}
        type="danger"
      />
      <DeleteModal
        isOpen={encounterDeleteBulkModal.isOpen}
        onClose={() => setEncounterDeleteBulkModal({ isOpen: false, ids: [], count: 0 })}
        onConfirm={confirmDeleteEncountersBulk}
        title="Delete Encounters"
        message={`Are you sure you want to delete ${encounterDeleteBulkModal.count} encounter(s)? This action cannot be undone.`}
        type="danger"
      />
      {userDeleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setUserDeleteModal({ isOpen: false, user: null })}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-modal shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete User</h3>
              <p className="text-gray-500 mb-6">Are you sure you want to delete "{userDeleteModal.user?.username}"? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setUserDeleteModal({ isOpen: false, user: null })}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDeleteUser(userDeleteModal.user.id)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold rounded-xl transition-all shadow-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDoctorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Add Doctor</h3>
            <form onSubmit={handleCreateDoctor} className="space-y-4">
              <div>
                <label className="block font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={doctorForm.name}
                  onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-200"
                  placeholder="Dr. John Smith"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-2">Department</label>
                <input
                  type="text"
                  value={doctorForm.department}
                  onChange={(e) => setDoctorForm({ ...doctorForm, department: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-200"
                  placeholder="General Medicine"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={doctorForm.email}
                  onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-200"
                  placeholder="doctor@hospital.com"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-2">Photo</label>
                <label htmlFor="doctor-photo-upload" className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl cursor-pointer hover:bg-blue-600 transition-all">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm font-medium">{doctorForm.image_url ? 'Change Photo' : 'Upload Photo'}</span>
                </label>
                <input
                  id="doctor-photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    toast.loading('Uploading image...');
                    try {
                      const reader = new FileReader();
                      reader.onload = async () => {
                        const base64 = reader.result;
                        const res = await fetch('/api/upload/image', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', ...headers() },
                          body: JSON.stringify({ image_data: base64 })
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Upload failed');
                        toast.dismiss();
                        setDoctorForm({ ...doctorForm, image_url: data.url });
                        toast.success('Image uploaded');
                      };
                      reader.readAsDataURL(file);
                    } catch (err) {
                      toast.dismiss();
                      toast.error(err.message);
                    }
                  }}
                />
                {doctorForm.image_url && (
                  <div className="mt-2">
                    <img src={doctorForm.image_url} alt="Doctor" className="w-16 h-16 object-cover rounded-full" />
                  </div>
                )}
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDoctorModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={doctorLoading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50"
                >
                  {doctorLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingDoctor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Edit Doctor</h3>
            <form onSubmit={handleUpdateDoctor} className="space-y-4">
              <div>
                <label className="block font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={doctorForm.name}
                  onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-200"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-2">Department</label>
                <input
                  type="text"
                  value={doctorForm.department}
                  onChange={(e) => setDoctorForm({ ...doctorForm, department: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-200"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={doctorForm.email}
                  onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-200"
                  placeholder="doctor@hospital.com"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-2">Photo</label>
                <label htmlFor="doctor-photo-upload-edit" className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl cursor-pointer hover:bg-blue-600 transition-all">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm font-medium">{doctorForm.image_url ? 'Change Photo' : 'Upload Photo'}</span>
                </label>
                <input
                  id="doctor-photo-upload-edit"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    toast.loading('Uploading image...');
                    try {
                      const reader = new FileReader();
                      reader.onload = async () => {
                        const base64 = reader.result;
                        const res = await fetch('/api/upload/image', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', ...headers() },
                          body: JSON.stringify({ image_data: base64 })
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Upload failed');
                        toast.dismiss();
                        setDoctorForm({ ...doctorForm, image_url: data.url });
                        toast.success('Image uploaded');
                      };
                      reader.readAsDataURL(file);
                    } catch (err) {
                      toast.dismiss();
                      toast.error(err.message);
                    }
                  }}
                />
                {doctorForm.image_url && (
                  <div className="mt-2">
                    <img src={doctorForm.image_url} alt="Doctor" className="w-16 h-16 object-cover rounded-full" />
                  </div>
                )}
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingDoctor(null)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={doctorLoading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50"
                >
                  {doctorLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteDoctorModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Delete Doctor</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteDoctorModal.doctor?.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteDoctorModal({ isOpen: false, doctor: null })}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDoctor}
                className="flex-1 bg-red-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showPatientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Add Patient</h3>
            <form onSubmit={handleCreatePatient} className="space-y-4">
              <div>
                <label className="block font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={patientForm.name}
                  onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-200"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-2">Mobile *</label>
                <PhoneInput
                  defaultCountry="ET"
                  flags={phoneFlags}
                  value={patientForm.phone}
                  onChange={(value) => setPatientForm({ ...patientForm, phone: value || '+251' })}
                  required
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPatientModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={patientLoading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50"
                >
                  {patientLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Edit Patient</h3>
            <form onSubmit={handleUpdatePatient} className="space-y-4">
              <div>
                <label className="block font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={patientForm.name}
                  onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-200"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-2">Mobile *</label>
                <PhoneInput
                  defaultCountry="ET"
                  flags={phoneFlags}
                  value={patientForm.phone}
                  onChange={(value) => setPatientForm({ ...patientForm, phone: value || '+251' })}
                  required
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingPatient(null)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={patientLoading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50"
                >
                  {patientLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletePatientModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Delete Patient</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deletePatientModal.patient?.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeletePatientModal({ isOpen: false, patient: null })}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePatient}
                className="flex-1 bg-red-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showEncounterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Create Encounter</h3>
            <form onSubmit={handleCreateEncounter} className="space-y-4">
              <div className="relative">
                <label className="block font-medium text-gray-700 mb-2">Patient *</label>
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    setEncounterForm(prev => ({ ...prev, patient_id: '' }));
                    setShowPatientDropdown(true);
                  }}
                  onFocus={() => setShowPatientDropdown(true)}
                  onBlur={() => setTimeout(() => setShowPatientDropdown(false), 200)}
                  placeholder="Search patients..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-200"
                />
                {showPatientDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {encounterPatients
                      .filter(p => p.name.toLowerCase().includes(patientSearch.toLowerCase()))
                      .map(p => (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => {
                            setPatientSearch(p.name);
                            setEncounterForm(prev => ({ ...prev, patient_id: p.id }));
                            setShowPatientDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors ${encounterForm.patient_id === p.id ? 'bg-blue-50 font-semibold text-blue-700' : 'text-gray-700'}`}
                        >
                          {p.name}
                        </button>
                      ))}
                    {encounterPatients.filter(p => p.name.toLowerCase().includes(patientSearch.toLowerCase())).length === 0 && (
                      <p className="px-4 py-3 text-sm text-gray-400">No patients found</p>
                    )}
                  </div>
                )}
              </div>
              <div className="relative" ref={doctorDropdownRef}>
                <label className="block font-medium text-gray-700 mb-2">Doctors *</label>
                <input
                  type="text"
                  value={doctorSearch}
                  onChange={(e) => {
                    setDoctorSearch(e.target.value);
                    setShowDoctorDropdown(true);
                  }}
                  onFocus={() => setShowDoctorDropdown(true)}
                  placeholder="Search doctors..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-200"
                />
                {showDoctorDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {encounterDoctors
                      .filter(d => d.name.toLowerCase().includes(doctorSearch.toLowerCase()))
                      .map(d => (
                        <label key={d.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={encounterForm.doctor_ids.includes(d.id)}
                            onChange={() => toggleEncounterDoctor(d.id)}
                            className="w-4 h-4 text-blue-600 rounded shrink-0"
                          />
                          <div className="flex items-center gap-2 min-w-0">
                            {d.image_url ? (
                              <img src={d.image_url} alt={d.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
                                {d.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{d.name}</p>
                              {d.department && <p className="text-xs text-gray-500 truncate">{d.department}</p>}
                            </div>
                          </div>
                        </label>
                      ))}
                    {encounterDoctors.filter(d => d.name.toLowerCase().includes(doctorSearch.toLowerCase())).length === 0 && (
                      <p className="px-4 py-3 text-sm text-gray-400">No doctors found</p>
                    )}
                  </div>
                )}
                {encounterForm.doctor_ids.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {encounterForm.doctor_ids.map(id => {
                      const d = encounterDoctors.find(doc => doc.id === id);
                      if (!d) return null;
                      return (
                        <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                          {d.name}
                          <button type="button" onClick={() => toggleEncounterDoctor(id)} className="hover:text-blue-900">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={encounterForm.status}
                  onChange={(e) => setEncounterForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-200 bg-white"
                >
                  <option value="in_progress">In Progress</option>
                  <option value="finished">Finished</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEncounterModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={encounterLoading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50"
                >
                  {encounterLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteEncounterModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Delete Encounter</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this encounter? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteEncounterModal({ isOpen: false, encounter: null })}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEncounter}
                className="flex-1 bg-red-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {viewEncounterModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Encounter Details</h3>
              <button onClick={() => setViewEncounterModal({ isOpen: false, encounter: null })} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            {viewEncounterModal.encounter && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Encounter ID</p>
                  <p className="text-gray-800 font-mono text-sm">{viewEncounterModal.encounter.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Status</p>
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold ${
                    viewEncounterModal.encounter.status === 'in_progress'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {viewEncounterModal.encounter.status === 'in_progress' ? 'In Progress' : 'Finished'}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Patient</p>
                  <p className="text-gray-800 font-semibold">{viewEncounterModal.encounter.patient_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Mobile</p>
                  <p className="text-gray-800">{viewEncounterModal.encounter.patient_phone || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Survey Filled</p>
                  <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold ${
                    viewEncounterModal.encounter.survey_filled
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {viewEncounterModal.encounter.survey_filled ? 'Yes' : 'No'}
                  </span>
                </div>
                {viewEncounterModal.encounter.survey_link && viewEncounterModal.encounter.status === 'finished' && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Survey Link</p>
                    {viewEncounterModal.encounter.survey_sent ? (
                      <span className="inline-flex items-center gap-1 px-4 py-2 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-lg">
                        <CheckCircle2 className="w-4 h-4" />
                        Sent
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSendSurveySms(viewEncounterModal.encounter.id)}
                        disabled={sendingSms.has(viewEncounterModal.encounter.id)}
                        className="inline-flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingSms.has(viewEncounterModal.encounter.id) ? 'Sending...' : 'Send Survey'}
                      </button>
                    )}
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Created</p>
                  <p className="text-gray-800 text-sm">{new Date(viewEncounterModal.encounter.created_at).toLocaleDateString('en-GB')} {new Date(viewEncounterModal.encounter.created_at).toLocaleTimeString()}</p>
                </div>
                {viewEncounterModal.encounter.finished_at && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Finished</p>
                    <p className="text-gray-800 text-sm">{new Date(viewEncounterModal.encounter.finished_at).toLocaleDateString('en-GB')} {new Date(viewEncounterModal.encounter.finished_at).toLocaleTimeString()}</p>
                  </div>
                )}
                <div className="md:col-span-2 space-y-1">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Assigned Doctors</p>
                  <div className="flex flex-wrap gap-3">
                    {viewEncounterModal.encounter.doctors?.map(d => (
                      <div key={d.id} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                        {d.image_url ? (
                          <img src={d.image_url} alt={d.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {d.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{d.name}</p>
                          {d.department && <p className="text-xs text-gray-500">{d.department}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setViewEncounterModal({ isOpen: false, encounter: null })}
                className="px-8 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
          </>
        )}
        </div>
      </main>
    </div>
  );
}
