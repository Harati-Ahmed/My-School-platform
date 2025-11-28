# 🏫 Parent-Focused School Management Platform - Tilmeedhy تلميذي
*(Multilingual: Arabic & English | Mobile-First | Best Practices)*

---

## 🌍 Overview
This project is a **web-based, bilingual (Arabic & English)** school management platform designed for **schools in Libya and similar regions** where parents are the primary users — not the students.  

It allows **parents** to view their children's:
- Homework  
- Grades  
- Attendance  
- Teacher notes  
- Announcements

Meanwhile, **teachers** and **admins** manage data from their dashboards.

The platform is **lightweight**, **mobile-first**, and **simple enough for older, non-technical users**.  

---

## 🎯 Main Objective
Create a modern, cloud-based system where:
- **Parents** can easily track their child's progress.
- **Teachers** can add homework, grades, and attendance.
- **Admins** can manage all users, classes, and announcements.
- **Students do not log in** — they exist as profiles linked to parents.
- **Multi-school support** — Platform can host multiple schools.

---

## 👥 User Roles & Responsibilities

### 🧑‍💼 School Admin
- Manage teachers, parents, and students.
- Assign students to classes and parents.
- Create subjects, classes, and announcements.
- Generate and export reports (grades, attendance, etc.).
- Customize school logo and theme colors.
- Manage subscription status and billing.
- View school-wide analytics and statistics.
- Configure notification settings.
- Manage emergency contacts.

### 👩‍🏫 Teacher
- Add homework (text format with optional attachments).
- Add grades for exams or assignments.
- Record attendance for each student.
- Add short notes or comments for parents.
- View class-level statistics and analytics.
- Create announcements for their classes.
- Export class reports to PDF.
- Track homework completion rates.
- View student performance trends.

### 👨‍👩‍👧 Parent (Main User)
- Log in with email or phone number.  
- View multiple children under one account.  
- For each child:
  - See homework list with due dates.
  - View grades & averages with trend charts.
  - See attendance status and history.
  - Read teacher notes and feedback.
  - View upcoming events and announcements.
- Option to **download or print PDF reports**.
- Receive notifications (in-app, email, optional SMS).
- Switch between Arabic and English.
- Choose **Light or Dark mode** for better readability.
- View calendar with all important dates.
- Mark notifications as read.

---

## 💡 Core Design Principles
1. **Simplicity First:** Clear layout, minimal clicks, no clutter.  
2. **Mobile-First:** Designed for phones — large buttons and text.  
3. **Multilingual:** Fully bilingual (Arabic RTL, English LTR).  
4. **Accessibility:** High contrast, readable fonts, ARIA tags, WCAG 2.1 AA compliant.  
5. **Dark Mode:** Automatic or manual toggle; stores preference in database.  
6. **Performance Optimized:** Lightweight, lazy loading, server-side rendering, code splitting.  
7. **Scalable:** Supports multiple schools under one platform.
8. **Offline-First:** PWA capabilities with offline data access.
9. **Real-time Updates:** Live notifications and data updates.
10. **Parent-Centric UX:** Every feature designed for non-technical users.

---

## 📱 UI Flow (Detailed)

### 1. Login Page
- **Role Selection:** Admin / Teacher / Parent (tabs or dropdown).  
- **Parent Login Options:**
  - Email + password
  - Phone number + password
  - "Forgot Password" link
- **Language Switch:** 🇸🇦 العربية / 🇬🇧 English (persists in localStorage).
- **Dark/Light Mode Toggle:** Moon/Sun icon.
- **Mobile-Optimized:**
  - Large input fields (min 48px touch target).
  - Clear visual feedback on tap.
  - Error messages below fields.
- **Remember Me** checkbox.
- **Installation prompt** for PWA (mobile browsers).

---

### 2. Parent Dashboard

**Top Bar:**
- School logo (left/right based on language).
- Notification bell icon with badge count.
- Language switch (AR/EN).
- Dark mode toggle.
- Profile menu (settings, logout).

**Sidebar / Bottom Navigation (Mobile):**
- 🏠 Dashboard  
- 👶 My Children  
- 📚 Homework  
- 📊 Grades  
- 📅 Attendance  
- 📝 Teacher Notes  
- 📢 Announcements
- 📄 Reports  

**Main View - Dashboard Home:**
- **Children Cards:** Quick overview for each child.
  - Child name and photo.
  - Current class/grade.
  - Today's homework count.
  - Latest grade.
  - Attendance percentage.
  - Unread notes count.
- **Recent Activity Feed:**
  - New homework assigned.
  - Grades posted.
  - Teacher notes.
  - Announcements.
- **Quick Actions:**
  - View today's homework.
  - Check this week's attendance.
  - Download monthly report.

**Child Detail View (Tab-Based):**
- **Homework Tab:**
  - Filterable list (all, pending, completed).
  - Each item shows: subject, title, due date, status.
  - Click to see full description.
  - Badge for overdue items.
  - Completion percentage for class.
  
- **Grades Tab:**
  - Subject-wise grade cards.
  - Line chart showing grade trends over time.
  - Average grade calculation per subject.
  - Comparison with class average (optional).
  - Filter by date range, subject, exam type.
  - Download grades report (PDF).
  
- **Attendance Tab:**
  - Monthly calendar view with color coding:
    - 🟢 Green = Present
    - 🔴 Red = Absent
    - 🟡 Yellow = Late
  - Attendance percentage (monthly, yearly).
  - Pie chart visualization.
  - Filter by date range.
  
- **Teacher Notes Tab:**
  - List of notes with date and teacher name.
  - Badge for unread notes.
  - Color coding by type:
    - ⭐ Blue = Positive
    - ⚠️ Orange = Concern
    - 📝 Gray = General
  - Mark as read functionality.

**Announcements Page:**
- Priority-based sorting (urgent first).
- Badge for unread items.
- Search and filter by date.
- Mark all as read option.

**Reports Page:**
- Select child.
- Select report type:
  - Monthly progress report.
  - Semester report.
  - Custom date range.
- Select sections to include:
  - Grades, attendance, homework, notes.
- Download as PDF.
- Print option.

---

### 3. Teacher Dashboard

**Sidebar:**
- 🏠 Dashboard  
- 📚 My Classes  
- 📝 Homework  
- 📊 Grades  
- 📅 Attendance  
- 💬 Notes  
- 📢 Announcements
- 📈 Reports  
- ⚙️ Settings

**Dashboard Home:**
- **Quick Stats:**
  - Total students across all classes.
  - Homework assigned this week.
  - Average class performance.
  - Attendance rate.
- **Recent Activity:**
  - Homework completion rates.
  - Recent grades entered.
  - Attendance marked today.
- **Upcoming:**
  - Homework due dates.
  - Exams scheduled.

**My Classes Page:**
- List of assigned classes.
- Each card shows:
  - Class name and grade level.
  - Number of students.
  - Subject(s) taught.
  - Quick actions: add homework, grades, attendance.

**Homework Page:**
- **View All Homework:** Table with filters.
- **Add Homework Form:**
  - Title (required).
  - Subject (dropdown, auto-populated from teacher's subjects).
  - Class selection (multi-select if teaching multiple classes).
  - Description (rich text editor).
  - Due date (date picker).
  - Optional: attach files (upload to Supabase Storage).
  - Submit button.
- **Edit/Delete:** Inline actions on table rows.
- **Completion Status:** See how many students viewed/completed.

**Grades Page:**
- **Class Selection:** Dropdown.
- **Subject Selection:** Dropdown.
- **Exam Type:** Quiz, Midterm, Final, Assignment.
- **Bulk Entry Mode:**
  - Table view with all students.
  - Columns: Student Name, Grade (input), Max Grade, Feedback (optional).
  - Auto-save on blur.
  - Save All button.
- **Individual Entry:** Add grade for specific student.
- **View History:** See all grades for a student/class.
- **Grade Distribution Chart:** Bar chart showing grade ranges.

**Attendance Page:**
- **Date Picker:** Default to today.
- **Class Selection:** Dropdown.
- **Student List:**
  - Checkboxes or buttons for each student:
    - ✅ Present
    - ❌ Absent
    - 🕐 Late
  - Optional note field per student.
- **Bulk Actions:** Mark all present/absent.
- **Submit Attendance.**
- **View History:** Calendar view with attendance records.

**Notes Page:**
- **Add Note Form:**
  - Student selection (searchable dropdown).
  - Note type: Positive, Concern, General.
  - Content (textarea).
  - Send button.
- **View Notes:** Filterable list of all notes sent.
- **Parent Read Status:** Indicator if parent has read.

**Announcements Page:**
- Create school-wide or class-specific announcements.
- Set priority level.
- Set expiration date (optional).
- View published announcements.

**Reports Page:**
- **Class Reports:**
  - Class performance summary.
  - Grade distribution.
  - Attendance summary.
  - Homework completion rates.
- **Individual Student Reports:**
  - Select student.
  - Generate comprehensive report.
- **Export Options:** PDF, Excel.

---

### 4. Admin Dashboard

**Sidebar:**
- 🏠 Overview  
- 🏫 Schools (if super-admin)
- 👨‍🏫 Teachers  
- 👨‍👩‍👧 Parents  
- 👶 Students  
- 📚 Classes & Subjects
- 📢 Announcements  
- 📊 Reports & Analytics
- ⚙️ Settings  
- 💳 Subscription

**Overview Page:**
- **Key Metrics Cards:**
  - Total students, teachers, parents.
  - Active classes.
  - Current attendance rate.
  - Platform usage stats.
- **Charts:**
  - Enrollment trends (line chart).
  - Grade distribution across school (bar chart).
  - Attendance trends (area chart).
  - User activity (heatmap).
- **Recent Activity Log:**
  - New registrations.
  - Recent grades, homework, notes.

**Teachers Page:**
- **List View:** Table with search and filters.
- **Add Teacher:**
  - Form: Name, Email, Phone, Password, Subjects, Classes.
  - Auto-send welcome email with login credentials.
- **Edit/Deactivate:** Row actions.
- **Assign Classes:** Bulk assignment tool.

**Parents Page:**
- **List View:** Table with search and filters.
- **Add Parent:**
  - Form: Name, Email, Phone, Password.
  - Link children (multi-select existing students).
- **Edit/Deactivate:** Row actions.
- **View Parent Profile:** See linked children and activity.

**Students Page:**
- **List View:** Table with filters (class, grade, status).
- **Add Student:**
  - Form: Name, Student ID, DOB, Gender, Class, Enrollment Date.
  - Link parent (dropdown).
- **Edit/Deactivate:** Row actions (soft delete).
- **Bulk Import:** CSV upload for batch student creation.
- **Transfer Student:** Move to different class.

**Classes & Subjects Page:**
- **Classes Tab:**
  - List of all classes with student count.
  - Add Class: Name, Grade Level, Academic Year, Main Teacher.
  - Edit/Archive class.
- **Subjects Tab:**
  - List of subjects with assigned teachers.
  - Add Subject: Name (EN & AR), Class, Teacher.
  - Edit/Delete subject.

**Announcements Page:**
- Create school-wide announcements.
- Target audience: All, Parents only, Teachers only.
- Priority: Urgent, Normal, Info.
- Schedule announcements (publish date).
- View analytics (views, clicks).

**Reports & Analytics Page:**
- **Predefined Reports:**
  - School performance summary.
  - Teacher effectiveness.
  - Student progress reports.
  - Attendance reports.
  - Homework completion rates.
- **Custom Report Builder:**
  - Select metrics.
  - Choose date range.
  - Apply filters.
  - Export (PDF, Excel, CSV).
- **Data Visualizations:**
  - Interactive charts with drill-down.
  - Export chart as image.

**Settings Page:**
- **School Profile:**
  - Upload logo (Supabase Storage).
  - School name (EN & AR).
  - Theme color picker.
  - Contact information.
- **Academic Year Settings:**
  - Set current academic year.
  - Define grading scale.
  - Set max grade per subject.
- **Notification Settings:**
  - Enable/disable email notifications.
  - SMS notification settings (Twilio).
  - Customize notification templates.
- **System Settings:**
  - Default language.
  - Timezone.
  - Date format.
  - Backup settings.

**Subscription Page:**
- Current plan details.
- Usage metrics (students, storage).
- Billing history.
- Upgrade/downgrade options.
- Payment method management.

---

## 🛠️ Technical Architecture

### **Frontend**
- **Framework:** Next.js 16.0.1 (App Router, Turbopack bundler)
- **Runtime:** Node.js 20.9.0+ required
- **Language:** TypeScript 5.1.0+
- **React:** React 19 (latest)
- **Styling:** Tailwind CSS + shadcn/ui components + custom Dark Mode  
- **UI Components:** 
  - Reusable + accessible
  - shadcn/ui for complex components (Calendar, Select, Dialog, etc.)
  - Custom components for domain-specific needs
- **State Management:** 
  - React Server Components (default)
  - URL search params for filters
  - Server Actions for mutations
  - React Context for theme/language (client-only)
- **Internationalization:** `next-intl` (better App Router support, Arabic RTL + English LTR)  
- **Forms:** React Hook Form + Zod validation  
- **Charts:** Recharts (attendance trends, grade distributions)
- **Animations:** framer-motion (page transitions, modals)
- **Notifications:** react-hot-toast
- **PDF Export:** @react-pdf/renderer or jsPDF
- **Icons:** lucide-react  
- **Date Handling:** date-fns or Day.js
- **PWA:** next-pwa plugin

**Important Next.js 16 Breaking Changes:**
1. **Async Request APIs:** `params`, `searchParams`, `cookies()`, `headers()`, and `draftMode()` now return Promises and must be awaited:
   ```typescript
   // ❌ Old way (Next.js 15)
   export default function Page({ params }) {
     const slug = params.slug;
   }
   
   // ✅ New way (Next.js 16)
   export default async function Page({ params }) {
     const { slug } = await params;
   }
   ```

2. **Turbopack Default:** Turbopack is now the default bundler (faster builds). Custom Webpack configs may need migration.

3. **Image Component:** Use `next/image` (not `next/legacy/image`). Default `minimumCacheTTL` changed from 60s to 4 hours.

4. **Linting:** Run ESLint directly with `npx eslint .` instead of `next lint` (command removed).

5. **Middleware:** Consider renaming `middleware.ts` to `proxy.ts` for clarity (optional but recommended).

---

### **Backend - Supabase**
- **Database:** PostgreSQL (fully managed)
- **Authentication:** Supabase Auth
  - Email + password
  - Phone + OTP (optional)
  - Magic links
  - Social auth (future: Google, Facebook)
  - Session management
- **Storage:** Supabase Storage
  - School logos
  - Profile pictures
  - Homework attachments
  - Generated reports (temporary)
- **Real-time:** Supabase Realtime
  - Live notifications
  - Real-time grade updates
  - Attendance changes
- **API:** Supabase Client + PostgreSQL Functions
  - Row Level Security (RLS) policies
  - Database triggers for notifications
  - Custom PostgreSQL functions for complex queries
- **Edge Functions (Optional):** 
  - PDF generation
  - Email sending (via Resend or SendGrid)
  - SMS sending (via Twilio)
  - Webhook handlers

**Why Supabase?**
- ✅ Open-source and transparent
- ✅ Built-in authentication with multi-provider support
- ✅ Row-level security for data isolation
- ✅ Real-time subscriptions out of the box
- ✅ Generous free tier
- ✅ Easy to scale
- ✅ PostgreSQL (powerful, ACID compliant)
- ✅ Excellent TypeScript support
- ✅ Built-in storage solution
- ✅ Self-hostable (future option)

---

### **Hosting & Infrastructure**
- **Frontend:** Vercel
  - Automatic deployments from Git
  - Preview deployments for PRs
  - Edge Functions support
  - Built-in analytics
  - Global CDN
  
- **Backend:** Supabase Cloud
  - Managed database
  - Automatic backups
  - Connection pooling
  - Database dashboard
  
- **Storage:** Supabase Storage
  - CDN delivery
  - Image transformations
  - Access control
  
- **Domain:** Custom domain (e.g., `tilmeedhy.ly`, `myschool.ly`)
- **SSL:** Automatic via Vercel  
- **Email Service:** Resend or SendGrid
- **SMS Service (Optional):** Twilio
- **Monitoring:** Sentry (error tracking), Vercel Analytics

---

## 💾 Database Schema

### users
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key (Supabase Auth user_id) |
| name | String | Full name |
| role | Enum | 'admin', 'teacher', 'parent' |
| email | String | Login email (unique) |
| phone | String | Phone number (optional for parent login) |
| school_id | UUID | Foreign key → schools |
| language_preference | String | 'ar' or 'en' |
| theme_preference | String | 'light' or 'dark' |
| is_active | Boolean | Soft delete flag |
| profile_picture_url | String | Supabase Storage URL |
| last_login | Timestamp | Last login time |
| created_at | Timestamp | Auto |
| updated_at | Timestamp | Auto |

### schools
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | School name (English) |
| name_ar | String | School name (Arabic) |
| logo_url | String | Supabase Storage URL |
| theme_color | String | Hex color (e.g., #3B82F6) |
| subscription_status | Enum | 'active', 'trial', 'expired' |
| subscription_plan | String | 'basic', 'standard', 'premium' |
| subscription_end | Date | Subscription expiry date |
| max_students | Integer | Plan limit |
| max_teachers | Integer | Plan limit |
| contact_email | String | School contact |
| contact_phone | String | School contact |
| address | Text | School address |
| timezone | String | e.g., 'Africa/Tripoli' |
| settings | JSONB | Custom settings object |
| created_at | Timestamp | Auto |
| updated_at | Timestamp | Auto |

### students
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | Student full name |
| student_id_number | String | School ID card number |
| date_of_birth | Date | DOB |
| gender | Enum | 'male', 'female' |
| class_id | UUID | Foreign key → classes |
| parent_id | UUID | Foreign key → users (role=parent) |
| school_id | UUID | Foreign key → schools |
| enrollment_date | Date | Date joined school |
| profile_picture_url | String | Supabase Storage URL |
| is_active | Boolean | Soft delete / graduation |
| emergency_contact | JSONB | { name, phone, relation } |
| medical_info | Text | Allergies, conditions (optional) |
| created_at | Timestamp | Auto |
| updated_at | Timestamp | Auto |

### classes
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | e.g., "Grade 5-A" |
| grade_level | String | e.g., "5" |
| section | String | e.g., "A" |
| academic_year | String | e.g., "2024-2025" |
| school_id | UUID | Foreign key → schools |
| main_teacher_id | UUID | Foreign key → users (role=teacher) |
| max_capacity | Integer | Max students (optional) |
| room_number | String | Physical room (optional) |
| is_active | Boolean | Archive old classes |
| created_at | Timestamp | Auto |
| updated_at | Timestamp | Auto |

### subjects
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | Subject name (English) |
| name_ar | String | Subject name (Arabic) |
| code | String | e.g., "MATH-5A" |
| class_id | UUID | Foreign key → classes |
| teacher_id | UUID | Foreign key → users (role=teacher) |
| school_id | UUID | Foreign key → schools |
| max_grade | Float | Max achievable grade (default 100) |
| is_active | Boolean | Soft delete |
| created_at | Timestamp | Auto |
| updated_at | Timestamp | Auto |

### homework
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| title | String | Homework title |
| subject_id | UUID | Foreign key → subjects |
| class_id | UUID | Foreign key → classes |
| teacher_id | UUID | Foreign key → users (role=teacher) |
| description | Text | Full homework details |
| due_date | Timestamp | Due date and time |
| attachments | JSONB | Array of file URLs |
| is_published | Boolean | Draft vs published |
| completion_count | Integer | How many marked complete |
| view_count | Integer | How many parents viewed |
| school_id | UUID | Foreign key → schools |
| created_at | Timestamp | Auto |
| updated_at | Timestamp | Auto |

### grades
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| student_id | UUID | Foreign key → students |
| subject_id | UUID | Foreign key → subjects |
| grade | Float | Actual grade received |
| max_grade | Float | Maximum possible grade |
| percentage | Float | Calculated (grade/max_grade)*100 |
| exam_type | Enum | 'quiz', 'midterm', 'final', 'assignment', 'participation' |
| exam_name | String | e.g., "Unit 3 Quiz" |
| feedback | Text | Teacher's comment (optional) |
| teacher_id | UUID | Who entered the grade |
| date | Date | Date of exam/assignment |
| school_id | UUID | Foreign key → schools |
| created_at | Timestamp | Auto |
| updated_at | Timestamp | Auto |

### attendance
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| student_id | UUID | Foreign key → students |
| class_id | UUID | Foreign key → classes |
| date | Date | Attendance date |
| status | Enum | 'present', 'absent', 'late', 'excused' |
| marked_by | UUID | Foreign key → users (teacher) |
| note | Text | Optional reason |
| school_id | UUID | Foreign key → schools |
| created_at | Timestamp | Auto |
| updated_at | Timestamp | Auto |

**Indexes:** `UNIQUE(student_id, date)`

### teacher_notes
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| student_id | UUID | Foreign key → students |
| teacher_id | UUID | Foreign key → users (role=teacher) |
| subject_id | UUID | Foreign key → subjects (optional) |
| content | Text | Note text |
| note_type | Enum | 'positive', 'concern', 'general', 'behavioral' |
| is_read | Boolean | Has parent read it? |
| read_at | Timestamp | When parent read it |
| school_id | UUID | Foreign key → schools |
| created_at | Timestamp | Auto |
| updated_at | Timestamp | Auto |

### announcements
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| title | String | Announcement title |
| content | Text | Full message body |
| school_id | UUID | Foreign key → schools |
| author_id | UUID | Foreign key → users (admin/teacher) |
| priority | Enum | 'urgent', 'normal', 'info' |
| target_audience | Enum | 'all', 'parents', 'teachers', 'class' |
| target_class_id | UUID | If targeting specific class |
| attachments | JSONB | File URLs (optional) |
| is_published | Boolean | Draft vs live |
| published_at | Timestamp | Publish time |
| expires_at | Timestamp | Auto-hide after this (optional) |
| view_count | Integer | Tracking |
| created_at | Timestamp | Auto |
| updated_at | Timestamp | Auto |

### notifications
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key → users (recipient) |
| type | Enum | 'homework', 'grade', 'attendance', 'note', 'announcement' |
| title | String | Notification title |
| message | Text | Notification body |
| link | String | Deep link to relevant page |
| related_id | UUID | ID of related entity (homework, grade, etc.) |
| is_read | Boolean | Read status |
| read_at | Timestamp | When marked read |
| sent_via | JSONB | { email: bool, sms: bool, push: bool } |
| school_id | UUID | Foreign key → schools |
| created_at | Timestamp | Auto |

**Indexes:** `(user_id, is_read, created_at DESC)`

### audit_logs
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key → users (who did the action) |
| action | String | e.g., "created_student", "deleted_grade" |
| entity_type | String | "student", "grade", "homework" |
| entity_id | UUID | ID of affected entity |
| old_values | JSONB | Before state (for updates) |
| new_values | JSONB | After state |
| ip_address | String | User's IP |
| user_agent | Text | Browser info |
| school_id | UUID | Foreign key → schools |
| created_at | Timestamp | Auto |

**Retention:** 90 days for compliance

---

## 🔐 Security & Authorization

### Row Level Security (RLS) Policies

**Parents:**
- Can only view data for their linked students
- Can read homework for their students' classes
- Can read grades for their students
- Can read attendance for their students
- Can read notes addressed to them
- Can read school-wide announcements
- Cannot modify any data (read-only)

**Teachers:**
- Can view all students in their assigned classes
- Can create/edit homework for their classes
- Can add/edit grades for their students
- Can mark attendance for their classes
- Can create notes for their students
- Can read class-specific announcements
- Cannot access other teachers' classes (unless shared)

**Admins:**
- Full access to all data within their school
- Can create/edit/delete users
- Can manage all classes and subjects
- Can view all reports
- Can modify school settings
- Cannot access data from other schools

**Super Admin (Platform Owner):**
- Access to all schools
- Can create new schools
- Can manage subscriptions
- Can view platform-wide analytics

### Security Best Practices
1. **Authentication:**
   - Supabase Auth with JWT tokens
   - Secure password requirements (min 8 chars, complexity)
   - Password reset via email
   - Session timeout after 30 days
   - Optional 2FA for admins (via authenticator app)
   - Rate limiting on auth endpoints

2. **Authorization:**
   - RLS policies on all tables
   - Role-based access control (RBAC)
   - API endpoints validate user roles
   - No direct database access from frontend
   - Use Supabase client with service role key only on server

3. **Data Protection:**
   - All passwords hashed (bcrypt, handled by Supabase)
   - Sensitive data encrypted at rest
   - HTTPS only (enforced)
   - CORS configured for allowed origins only
   - SQL injection prevention (parameterized queries)
   - XSS prevention (sanitize inputs)
   - CSRF tokens for forms

4. **Privacy Compliance:**
   - GDPR-ready data export
   - Right to be forgotten (soft delete + hard delete after 30 days)
   - Parental consent for student data
   - Data retention policies
   - Privacy policy and terms of service
   - Cookie consent banner

5. **File Upload Security:**
   - File type validation (whitelist)
   - File size limits (10MB per file)
   - Virus scanning (ClamAV or cloud service)
   - Secure file storage (Supabase Storage with policies)
   - No executable files allowed

6. **API Security:**
   - Rate limiting (1000 req/hour per user)
   - Request size limits
   - Input validation with Zod
   - Error messages don't leak sensitive info
   - Logging and monitoring

---

## 🔔 Notification System

### Notification Triggers
- **Homework Assigned:** Email + In-app to parents
- **Grade Posted:** Email + In-app to parents
- **Attendance Marked (Absent):** Email + SMS (optional) to parents
- **Teacher Note Added:** Email + In-app to parents
- **Announcement Published:** Email + In-app to target audience
- **Subscription Expiring:** Email to admin (7 days before)
- **Low Attendance Alert:** Email to parents (< 75% in a month)
- **Student Performance Alert:** Email to parents (grades dropping)

### Notification Channels
1. **In-App Notifications:**
   - Real-time using Supabase Realtime
   - Bell icon with badge count
   - Dropdown panel with recent notifications
   - Mark as read functionality
   - Link to relevant page

2. **Email Notifications:**
   - Transactional emails via Resend or SendGrid
   - Branded email templates (Arabic & English)
   - Unsubscribe option for non-critical emails
   - Digest option (daily summary instead of immediate)

3. **SMS Notifications (Optional):**
   - Via Twilio
   - Only for critical alerts (absence, urgent announcements)
   - User can opt-in/opt-out
   - Character limit: 160 chars

4. **Push Notifications (PWA):**
   - Browser push notifications
   - Require user permission
   - Work even when app is closed
   - Implemented using Service Workers

### Notification Settings
- **Per-User Preferences:**
  - Enable/disable each notification type
  - Choose channels (email, SMS, push)
  - Digest mode (daily summary)
  - Quiet hours (no push notifications 10 PM - 7 AM)

---

## 📊 Analytics & Reports

### Parent Reports (Downloadable PDF)
1. **Monthly Progress Report:**
   - All grades for the month
   - Attendance summary
   - Homework completion rate
   - Teacher notes
   - Charts: grade trends, attendance pie chart

2. **Semester Report Card:**
   - Final grades per subject
   - GPA calculation
   - Attendance percentage
   - Teacher comments
   - Ranking (optional)

3. **Custom Report:**
   - Select date range
   - Choose data to include
   - Multiple children in one report

### Teacher Reports
1. **Class Performance Report:**
   - Grade distribution (bar chart)
   - Average grade per assignment
   - Top performers
   - Students needing attention

2. **Attendance Report:**
   - Monthly attendance summary
   - Students with low attendance
   - Absence trends

3. **Homework Completion Report:**
   - Completion rates per assignment
   - Students who never complete
   - Overdue homework list

### Admin Analytics Dashboard
1. **School Overview:**
   - Total students, teachers, classes
   - Active users (daily, weekly, monthly)
   - Platform usage metrics

2. **Academic Performance:**
   - School-wide grade average
   - Grade trends over time
   - Subject-wise performance
   - Teacher effectiveness metrics

3. **Attendance Analytics:**
   - Overall attendance rate
   - Trends (seasonal patterns)
   - Students with chronic absence
   - Class-wise comparison

4. **Engagement Metrics:**
   - Parent login frequency
   - Notification open rates
   - Report downloads
   - Feature usage (most used pages)

5. **Financial Reports:**
   - Subscription revenue
   - Payment history
   - Outstanding invoices

### Chart Types (using Recharts)
- **Line Charts:** Grade trends, attendance over time
- **Bar Charts:** Grade distribution, subject comparison
- **Pie Charts:** Attendance breakdown, grade ranges
- **Area Charts:** Cumulative performance
- **Heatmaps:** Activity patterns, attendance calendar

---

## ⚡ Performance Optimization

### Frontend Optimization
1. **Next.js Features:**
   - Server Components by default (reduce client JS)
   - Streaming SSR for faster TTFB
   - Automatic code splitting
   - Image optimization (next/image)
   - Font optimization (next/font)

2. **Lazy Loading:**
   - Dynamic imports for heavy components (charts, PDF viewer)
   - Intersection Observer for below-the-fold content
   - Lazy load images with blur placeholders

3. **Caching Strategy:**
   - Static pages: ISR (revalidate every 1 hour)
   - Dynamic data: SWR with stale-while-revalidate
   - Supabase query caching
   - Service Worker caching for offline support

4. **Bundle Size:**
   - Tree-shaking unused code
   - Minimize dependencies
   - Use lightweight alternatives (date-fns over moment)
   - Analyze bundle with @next/bundle-analyzer

5. **Critical CSS:**
   - Inline critical CSS in HTML
   - Defer non-critical CSS
   - Purge unused Tailwind classes

6. **JavaScript Optimization:**
   - Minimize client-side JS
   - Use React Server Components for data fetching
   - Debounce search inputs
   - Virtualize long lists (react-window)

### Backend Optimization
1. **Database:**
   - Indexes on frequently queried columns
   - Connection pooling (Supabase handles this)
   - Materialized views for complex reports
   - Pagination for large datasets (cursor-based)
   - Query optimization (avoid N+1 problems)

2. **Supabase Optimization:**
   - Use `.select()` to fetch only needed columns
   - Batch operations where possible
   - Use database functions for complex logic
   - Enable PostgREST query optimization

3. **Caching:**
   - Redis for session storage (if needed)
   - Cache expensive queries (class statistics)
   - Invalidate cache on data changes
   - CDN caching for static assets

4. **File Storage:**
   - Image compression before upload
   - WebP format for images
   - Lazy load images
   - CDN delivery (Supabase CDN)
   - Image transformations on the fly

### Monitoring & Metrics
- **Core Web Vitals:**
  - LCP (Largest Contentful Paint) < 2.5s
  - FID (First Input Delay) < 100ms
  - CLS (Cumulative Layout Shift) < 0.1

- **Custom Metrics:**
  - Time to Interactive (TTI)
  - Server Response Time (TTFB)
  - API response times

- **Tools:**
  - Lighthouse CI in GitHub Actions
  - Vercel Analytics
  - Sentry Performance Monitoring
  - Supabase Dashboard (query performance)

---

## 🧪 Testing Strategy

### Unit Tests
- **Framework:** Jest + React Testing Library
- **Coverage Target:** 80%+
- **Test:**
  - Utility functions
  - Hooks
  - Form validation schemas (Zod)
  - API route handlers
  - Database functions

### Integration Tests
- **Test:**
  - Auth flow (login, logout, password reset)
  - CRUD operations (create student, add grade, etc.)
  - RLS policies (ensure users can only access their data)
  - Notification triggers
  - Report generation

### E2E Tests
- **Framework:** Playwright
- **Test Critical Paths:**
  - Parent: Login → View child → Check grades → Download report
  - Teacher: Login → Add homework → Enter grades → Mark attendance
  - Admin: Login → Create student → Assign to class → Link to parent
- **Cross-browser:** Chrome, Firefox, Safari (mobile & desktop)

### Accessibility Tests
- **Tools:** axe-core, Pa11y
- **Check:**
  - WCAG 2.1 AA compliance
  - Keyboard navigation
  - Screen reader compatibility
  - Color contrast ratios
  - ARIA labels

### Performance Tests
- **Tools:** Lighthouse, WebPageTest
- **Metrics:**
  - Page load time < 3s
  - Time to Interactive < 5s
  - Lighthouse score > 90

### Visual Regression Tests
- **Tool:** Percy or Chromatic
- **Prevent:** Unintended UI changes

### Security Tests
- **Static Analysis:** Snyk, SonarQube
- **Dependency Scanning:** npm audit, Dependabot
- **Penetration Testing:** Annual third-party audit

---

## 🚀 Deployment & DevOps

### Version Control
- **Platform:** GitHub
- **Branching Strategy:**
  - `main` → production (protected)
  - `develop` → staging
  - `feature/*` → feature branches
  - `hotfix/*` → urgent fixes
- **Commit Convention:** Conventional Commits
- **PR Requirements:** 
  - Passing tests
  - Code review approval
  - No merge conflicts

### CI/CD Pipeline (GitHub Actions)

**Setup Requirements:**
- Node.js 20.9.0+ in all CI/CD workflows
- npm 10.0.0+
- TypeScript 5.1.0+

**On Pull Request:**
1. Setup Node.js 20.9.0+
2. Run linter (`npx eslint .` and Prettier)
3. Run type check (TypeScript)
4. Run unit tests
5. Run integration tests
6. Build Next.js app (with Turbopack)
7. Lighthouse CI check
8. Deploy preview (Vercel)

**On Merge to `develop`:**
1. Run all tests
2. Build
3. Deploy to staging environment
4. Run E2E tests on staging
5. Notify team (Slack/Discord)

**On Merge to `main`:**
1. Run all checks
2. Build production bundle
3. Deploy to Vercel (production)
4. Run smoke tests
5. Tag release
6. Notify team
7. Update documentation

### Environments
1. **Development (Local):**
   - Local Next.js dev server
   - Supabase local instance (Docker) or cloud dev project
   - Hot reload enabled
   - Debug mode on

2. **Staging:**
   - Vercel preview deployment
   - Separate Supabase project
   - Production-like config
   - Testing with real data (anonymized)

3. **Production:**
   - Vercel production deployment
   - Supabase production project
   - Monitoring enabled
   - Error tracking (Sentry)
   - Analytics enabled

### Environment Variables
**Frontend (.env.local):**
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SENTRY_DSN=
```

**Backend (Supabase Dashboard):**
```env
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
RESEND_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

### Example GitHub Actions Workflow
**`.github/workflows/ci.yml`:**
```yaml
name: CI

on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.9.0'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npx eslint .
      
      - name: Run type check
        run: npx tsc --noEmit
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
```

### Monitoring & Alerting
- **Error Tracking:** Sentry
  - Real-time error notifications
  - Error grouping and prioritization
  - Source maps for debugging

- **Uptime Monitoring:** UptimeRobot or BetterUptime
  - Check every 5 minutes
  - Alert via email/SMS on downtime
  - Status page for users

- **Performance Monitoring:** Vercel Analytics + Sentry Performance
  - Track Core Web Vitals
  - API response times
  - Database query performance

- **Logging:**
  - Supabase logs (database, auth, storage)
  - Vercel logs (serverless functions)
  - Structured logging (JSON format)

### Backup Strategy
- **Database:**
  - Supabase automatic daily backups (retained 7 days)
  - Weekly full backup exported to external storage (AWS S3)
  - Point-in-time recovery (available in Supabase Pro)

- **File Storage:**
  - Supabase Storage has built-in redundancy
  - Weekly backup to external storage

- **Recovery Plan:**
  - RTO (Recovery Time Objective): 4 hours
  - RPO (Recovery Point Objective): 24 hours
  - Documented restore procedure
  - Quarterly restore tests

---

## 🔌 API Structure

### Authentication Endpoints
- `POST /api/auth/login` - User login (handled by Supabase)
- `POST /api/auth/logout` - User logout
- `POST /api/auth/reset-password` - Password reset request
- `POST /api/auth/update-password` - Update password
- `GET /api/auth/session` - Get current session

### Parent Endpoints
- `GET /api/parents/children` - Get all children linked to parent
- `GET /api/parents/children/:id/homework` - Get child's homework
- `GET /api/parents/children/:id/grades` - Get child's grades
- `GET /api/parents/children/:id/attendance` - Get child's attendance
- `GET /api/parents/children/:id/notes` - Get teacher notes for child
- `GET /api/parents/announcements` - Get school announcements
- `GET /api/parents/notifications` - Get user's notifications
- `PATCH /api/parents/notifications/:id/read` - Mark notification as read
- `POST /api/parents/reports/generate` - Generate PDF report
- `GET /api/parents/profile` - Get parent profile
- `PATCH /api/parents/profile` - Update parent profile

### Teacher Endpoints
- `GET /api/teachers/classes` - Get teacher's classes
- `GET /api/teachers/classes/:id/students` - Get students in a class
- `POST /api/teachers/homework` - Create homework
- `PUT /api/teachers/homework/:id` - Update homework
- `DELETE /api/teachers/homework/:id` - Delete homework
- `GET /api/teachers/homework/:id/stats` - Get homework completion stats
- `POST /api/teachers/grades` - Add grade(s)
- `PUT /api/teachers/grades/:id` - Update grade
- `DELETE /api/teachers/grades/:id` - Delete grade
- `GET /api/teachers/grades/class/:classId` - Get all grades for a class
- `POST /api/teachers/attendance` - Mark attendance (batch)
- `PUT /api/teachers/attendance/:id` - Update attendance record
- `GET /api/teachers/attendance/class/:classId` - Get attendance for class
- `POST /api/teachers/notes` - Create teacher note
- `GET /api/teachers/notes` - Get all notes created by teacher
- `DELETE /api/teachers/notes/:id` - Delete note
- `GET /api/teachers/reports/class/:classId` - Generate class report

### Admin Endpoints
- `GET /api/admin/dashboard/stats` - Get dashboard statistics
- `GET /api/admin/users` - Get all users (paginated, filterable)
- `POST /api/admin/users` - Create new user
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Soft delete user
- `GET /api/admin/students` - Get all students
- `POST /api/admin/students` - Create student
- `PUT /api/admin/students/:id` - Update student
- `DELETE /api/admin/students/:id` - Soft delete student
- `POST /api/admin/students/bulk-import` - Bulk import from CSV
- `GET /api/admin/classes` - Get all classes
- `POST /api/admin/classes` - Create class
- `PUT /api/admin/classes/:id` - Update class
- `DELETE /api/admin/classes/:id` - Archive class
- `GET /api/admin/subjects` - Get all subjects
- `POST /api/admin/subjects` - Create subject
- `PUT /api/admin/subjects/:id` - Update subject
- `DELETE /api/admin/subjects/:id` - Delete subject
- `POST /api/admin/announcements` - Create announcement
- `PUT /api/admin/announcements/:id` - Update announcement
- `DELETE /api/admin/announcements/:id` - Delete announcement
- `GET /api/admin/school` - Get school settings
- `PUT /api/admin/school` - Update school settings
- `POST /api/admin/school/logo` - Upload school logo
- `GET /api/admin/reports/:type` - Generate various reports
- `GET /api/admin/audit-logs` - Get audit logs

### File Upload Endpoints
- `POST /api/upload/profile-picture` - Upload profile picture
- `POST /api/upload/homework-attachment` - Upload homework file
- `POST /api/upload/school-logo` - Upload school logo
- `DELETE /api/upload/:fileId` - Delete uploaded file

### Notification Endpoints
- `GET /api/notifications` - Get user notifications (paginated)
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### Public Endpoints (No Auth)
- `GET /api/health` - Health check
- `GET /api/schools/:slug` - Get school public info

---

## 🧱 Recommended Folder Structure

```
/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-staging.yml
│       └── deploy-production.yml
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── reset-password/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (parent)/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── children/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── homework/
│   │   │   │       ├── grades/
│   │   │   │       ├── attendance/
│   │   │   │       └── notes/
│   │   │   ├── announcements/
│   │   │   │   └── page.tsx
│   │   │   ├── reports/
│   │   │   │   └── page.tsx
│   │   │   ├── notifications/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (teacher)/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── classes/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── homework/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   └── [id]/
│   │   │   ├── grades/
│   │   │   │   └── page.tsx
│   │   │   ├── attendance/
│   │   │   │   └── page.tsx
│   │   │   ├── notes/
│   │   │   │   └── page.tsx
│   │   │   ├── reports/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (admin)/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── teachers/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   ├── parents/
│   │   │   │   └── page.tsx
│   │   │   ├── students/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   ├── [id]/
│   │   │   │   └── bulk-import/
│   │   │   ├── classes/
│   │   │   │   └── page.tsx
│   │   │   ├── subjects/
│   │   │   │   └── page.tsx
│   │   │   ├── announcements/
│   │   │   │   └── page.tsx
│   │   │   ├── reports/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   ├── logout/
│   │   │   │   └── reset-password/
│   │   │   ├── parents/
│   │   │   │   ├── children/
│   │   │   │   ├── notifications/
│   │   │   │   └── reports/
│   │   │   ├── teachers/
│   │   │   │   ├── homework/
│   │   │   │   ├── grades/
│   │   │   │   ├── attendance/
│   │   │   │   └── notes/
│   │   │   ├── admin/
│   │   │   │   ├── users/
│   │   │   │   ├── students/
│   │   │   │   ├── classes/
│   │   │   │   └── reports/
│   │   │   ├── upload/
│   │   │   │   └── route.ts
│   │   │   └── health/
│   │   │       └── route.ts
│   │   │
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── error.tsx
│   │   └── not-found.tsx
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ... (shadcn/ui components)
│   │   │
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── mobile-nav.tsx
│   │   │   └── footer.tsx
│   │   │
│   │   ├── shared/
│   │   │   ├── language-switcher.tsx
│   │   │   ├── theme-toggle.tsx
│   │   │   ├── notification-bell.tsx
│   │   │   ├── profile-menu.tsx
│   │   │   ├── loading-spinner.tsx
│   │   │   ├── empty-state.tsx
│   │   │   └── error-boundary.tsx
│   │   │
│   │   ├── parent/
│   │   │   ├── child-card.tsx
│   │   │   ├── homework-list.tsx
│   │   │   ├── grade-chart.tsx
│   │   │   ├── attendance-calendar.tsx
│   │   │   └── notes-list.tsx
│   │   │
│   │   ├── teacher/
│   │   │   ├── homework-form.tsx
│   │   │   ├── grade-entry-table.tsx
│   │   │   ├── attendance-marker.tsx
│   │   │   └── note-form.tsx
│   │   │
│   │   ├── admin/
│   │   │   ├── stats-cards.tsx
│   │   │   ├── user-table.tsx
│   │   │   ├── student-form.tsx
│   │   │   ├── class-form.tsx
│   │   │   └── bulk-import-dialog.tsx
│   │   │
│   │   ├── charts/
│   │   │   ├── line-chart.tsx
│   │   │   ├── bar-chart.tsx
│   │   │   ├── pie-chart.tsx
│   │   │   └── area-chart.tsx
│   │   │
│   │   └── forms/
│   │       ├── login-form.tsx
│   │       ├── password-reset-form.tsx
│   │       └── profile-form.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts (browser client)
│   │   │   ├── server.ts (server client)
│   │   │   ├── middleware.ts
│   │   │   └── database.types.ts (generated)
│   │   │
│   │   ├── utils/
│   │   │   ├── cn.ts (classnames helper)
│   │   │   ├── date.ts (date formatting)
│   │   │   ├── validation.ts (shared validators)
│   │   │   └── pdf-generator.ts
│   │   │
│   │   ├── hooks/
│   │   │   ├── use-user.ts
│   │   │   ├── use-notifications.ts
│   │   │   ├── use-theme.ts
│   │   │   └── use-language.ts
│   │   │
│   │   ├── actions/
│   │   │   ├── auth.ts (Server Actions)
│   │   │   ├── homework.ts
│   │   │   ├── grades.ts
│   │   │   └── attendance.ts
│   │   │
│   │   └── constants/
│   │       ├── roles.ts
│   │       ├── permissions.ts
│   │       └── routes.ts
│   │
│   ├── types/
│   │   ├── database.ts
│   │   ├── user.ts
│   │   ├── student.ts
│   │   ├── homework.ts
│   │   ├── grade.ts
│   │   └── attendance.ts
│   │
│   ├── messages/
│   │   ├── en.json
│   │   └── ar.json
│   │
│   ├── public/
│   │   ├── images/
│   │   ├── icons/
│   │   ├── fonts/
│   │   ├── manifest.json
│   │   └── sw.js (Service Worker)
│   │
│   ├── styles/
│   │   └── globals.css
│   │
│   ├── middleware.ts (or proxy.ts in Next.js 16)
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── package.json
│   ├── .env.local
│   └── .env.example
│
├── supabase/
│   ├── migrations/
│   │   ├── 20240101_initial_schema.sql
│   │   ├── 20240102_add_rls_policies.sql
│   │   ├── 20240103_add_functions.sql
│   │   └── 20240104_add_triggers.sql
│   │
│   ├── functions/
│   │   ├── send-email/
│   │   │   ├── index.ts
│   │   │   └── deno.json
│   │   ├── send-sms/
│   │   │   └── index.ts
│   │   └── generate-pdf/
│   │       └── index.ts
│   │
│   ├── seed.sql
│   └── config.toml
│
├── tests/
│   ├── unit/
│   │   ├── utils.test.ts
│   │   ├── validation.test.ts
│   │   └── hooks.test.tsx
│   │
│   ├── integration/
│   │   ├── auth.test.ts
│   │   ├── homework.test.ts
│   │   └── grades.test.ts
│   │
│   └── e2e/
│       ├── parent-flow.spec.ts
│       ├── teacher-flow.spec.ts
│       └── admin-flow.spec.ts
│
├── docs/
│   ├── API.md
│   ├── SETUP.md
│   ├── DEPLOYMENT.md
│   ├── CONTRIBUTING.md
│   └── SECURITY.md
│
├── .gitignore
├── .env.example
├── README.md
├── project.md (this file)
├── LICENSE
└── package.json
```

---

## 📦 Tech Stack Summary

### Core
- **Next.js 16.0.1** (App Router, Turbopack, React 19)
- **TypeScript 5.1.0+**
- **Node.js 20.9.0+**
- **Supabase** (Database, Auth, Storage, Realtime)

### UI & Styling
- **Tailwind CSS**
- **shadcn/ui**
- **lucide-react** (icons)
- **framer-motion** (animations)
- **Recharts** (charts)
- **react-hot-toast** (notifications)

### Forms & Validation
- **React Hook Form**
- **Zod**

### Internationalization
- **next-intl** (i18n)

### PDF Generation
- **@react-pdf/renderer** or **jsPDF**

### PWA
- **next-pwa**

### Date Handling
- **date-fns**

### External Services
- **Resend** or **SendGrid** (emails)
- **Twilio** (SMS, optional)

### Development
- **ESLint** (run directly with `npx eslint .`)
- **Prettier**
- **Husky** (git hooks)
- **Jest** + **React Testing Library**
- **Playwright** (E2E)
- **Turbopack** (default bundler in Next.js 16)

### Monitoring
- **Sentry** (error tracking)
- **Vercel Analytics**

---

## 📦 Key Package Versions & Requirements

### Minimum Requirements
```json
{
  "engines": {
    "node": ">=20.9.0",
    "npm": ">=10.0.0"
  }
}
```

### Core Dependencies
```json
{
  "dependencies": {
    "next": "^16.0.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.1.0"
  }
}
```

### Installation Commands
```bash
# Install or upgrade to Next.js 16
npm install next@16.0.1 react@latest react-dom@latest

# Verify versions
node --version    # Should be 20.9.0+
npm --version     # Should be 10.0.0+
npx next --version # Should be 16.0.1
```

### Migration Checklist
- ✅ Update Node.js to 20.9.0 or higher
- ✅ Update TypeScript to 5.1.0 or higher
- ✅ Install Next.js 16.0.1 and React 19
- ✅ Convert all `params`, `searchParams` access to async/await
- ✅ Update `cookies()`, `headers()`, `draftMode()` to async
- ✅ Replace `next/legacy/image` with `next/image`
- ✅ Update lint scripts to use `npx eslint .`
- ✅ Test with Turbopack (or configure Webpack if needed)
- ✅ Update CI/CD pipeline Node.js version
- ✅ Update deployment platform Node.js version (Vercel, etc.)

---

## 🚦 Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- [ ] Setup Next.js 16.0.1 project with TypeScript 5.1.0+
- [ ] Verify Node.js 20.9.0+ installed
- [ ] Configure Tailwind CSS and shadcn/ui
- [ ] Setup Supabase project
- [ ] Create database schema and migrations
- [ ] Implement RLS policies
- [ ] Setup authentication (Supabase Auth)
- [ ] Create basic layouts (auth, parent, teacher, admin)
- [ ] Implement i18n with next-intl
- [ ] Setup dark mode
- [ ] Configure Turbopack (default) or Webpack if needed
- [ ] Update all async request APIs (params, searchParams, etc.)

### Phase 2: Parent Features (Weeks 3-4)
- [ ] Parent dashboard
- [ ] View children list
- [ ] View homework (list, detail)
- [ ] View grades with charts
- [ ] View attendance with calendar
- [ ] View teacher notes
- [ ] View announcements
- [ ] Notification system (in-app)
- [ ] Profile settings

### Phase 3: Teacher Features (Weeks 5-6)
- [ ] Teacher dashboard
- [ ] View classes and students
- [ ] Add/edit/delete homework
- [ ] Add/edit grades (bulk entry)
- [ ] Mark attendance (bulk)
- [ ] Add teacher notes
- [ ] View class statistics
- [ ] Generate class reports

### Phase 4: Admin Features (Weeks 7-8)
- [ ] Admin dashboard with analytics
- [ ] User management (CRUD)
- [ ] Student management (CRUD, bulk import)
- [ ] Class and subject management
- [ ] Create announcements
- [ ] School settings (logo, theme)
- [ ] Generate reports
- [ ] Audit logs

### Phase 5: Advanced Features (Weeks 9-10)
- [ ] Email notifications (Resend)
- [ ] SMS notifications (Twilio, optional)
- [ ] PDF report generation
- [ ] PWA implementation
- [ ] Advanced charts and analytics
- [ ] File upload (homework attachments, logos)
- [ ] Search and filters

### Phase 6: Testing & Polish (Weeks 11-12)
- [ ] Unit tests (80%+ coverage)
- [ ] Integration tests
- [ ] E2E tests (critical paths)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Bug fixes
- [ ] UI polish

### Phase 7: Deployment & Launch (Week 13)
- [ ] Setup CI/CD pipeline
- [ ] Deploy staging environment
- [ ] User acceptance testing
- [ ] Deploy production
- [ ] Setup monitoring and alerts
- [ ] Documentation
- [ ] Training materials
- [ ] Launch! 🚀

---

## 🌟 Future Enhancements (Post-MVP)

### V2 Features
- [ ] Mobile apps (React Native or Flutter)
- [ ] Video conferencing integration (Zoom/Jitsi)
- [ ] Online assignments with file submissions
- [ ] Gradebook with rubrics
- [ ] Behavior tracking
- [ ] Parent-teacher messaging (chat)
- [ ] Event calendar (school events, parent-teacher meetings)
- [ ] Fee management and online payments
- [ ] Library book tracking
- [ ] Transportation tracking (school bus)
- [ ] Cafeteria meal planning
- [ ] Multi-language support beyond Arabic & English

### V3 Features
- [ ] AI-powered insights (student at-risk detection)
- [ ] Automated report card generation
- [ ] Integration with government systems
- [ ] Advanced analytics with ML
- [ ] White-label solution for multiple schools
- [ ] Marketplace for educational content
- [ ] Parent community forums

---

## 📄 License
MIT License (or your preferred license)

---

## 👨‍💻 Contributors
- Your Name - Lead Developer
- (Add team members as project grows)

---

## 📞 Support
- Email: support@tilmeedhy.ly
- Website: https://tilmeedhy.ly
- Documentation: https://docs.tilmeedhy.ly

---

**Built with ❤️ for schools in Libya and beyond.**
