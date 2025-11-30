# Super Admin Feature Roadmap

## Overview
This document outlines all features and capabilities that should be available to Super Admins for managing the platform, schools, and users.

## Current Status
✅ **Completed:**
- View platform-wide statistics
- View all schools list
- Create new schools (basic fields only)
- Create school admins
- Search schools

❌ **Missing:**
- Edit schools
- Delete/deactivate schools
- Enhanced school creation form
- Edit/delete admins
- View all users
- School details page
- And more...

---

## Feature List & Priority

### 🔴 **HIGH PRIORITY - Core Management**

#### 1. School Management
- [ ] **Edit School** - Update school details (name, contact info, address, subscription, limits, etc.)
- [ ] **Delete/Deactivate School** - Soft delete or deactivate schools (with confirmation)
- [ ] **Enhanced Create School Form** - Include all fields:
  - Basic: name, name_ar, contact_email, contact_phone, address
  - Subscription: subscription_status, subscription_plan, subscription_end
  - Limits: max_students, max_teachers
  - Branding: logo_url, theme_color
  - Settings: timezone, settings (JSONB)
- [ ] **School Details Page** - View individual school with:
  - Complete school information
  - Statistics (students, teachers, classes, subjects)
  - List of admins
  - List of users
  - Activity history
  - Quick actions (edit, deactivate, etc.)

#### 2. Admin Management
- [ ] **Edit School Admin** - Update admin details (name, email, phone, password reset)
- [ ] **Delete/Deactivate School Admin** - Remove or deactivate admins
- [ ] **View All Admins Page** - List all admins across all schools with:
  - School association
  - Status (active/inactive)
  - Last login
  - Quick actions (edit, delete, view school)
- [ ] **Transfer Admin** - Move admins between schools or reassign ownership

#### 3. User Management
- [ ] **View All Users Page** - List all users (teachers, parents, HR) across all schools
  - Filter by role, school, status
  - Search by name, email
  - View user details
  - Edit user information
  - Deactivate users
  - View user activity

---

### 🟡 **MEDIUM PRIORITY - Enhanced Features**

#### 4. Platform Analytics & Monitoring
- [ ] **Platform Audit Logs** - View all audit logs across all schools
  - Filter by school, user, action type, date range
  - Export logs
- [ ] **School Statistics Dashboard** - Individual school statistics with:
  - Charts and graphs
  - Growth trends
  - User activity
  - Resource usage
- [ ] **Platform Health Monitoring** - Monitor:
  - Active schools count
  - Subscription statuses
  - System usage
  - Error rates

#### 5. Subscription Management
- [ ] **Manage Subscriptions** - Update subscription status, plan, expiry dates
- [ ] **Subscription Overview** - View all subscriptions with:
  - Expiring soon alerts
  - Payment status
  - Usage vs limits
- [ ] **Billing Information** - Track and manage billing data

#### 6. Advanced Filtering & Search
- [ ] **Enhanced School Filters** - Filter by:
  - Status (active/inactive)
  - Subscription status
  - Subscription plan
  - Date created
  - Region/location
  - Number of users
- [ ] **Global Search** - Search across:
  - Schools
  - Users
  - Admins
  - Classes
  - Students

---

### 🟢 **LOW PRIORITY - Nice to Have**

#### 7. Bulk Operations
- [ ] **Bulk School Management** - Bulk activate/deactivate schools
- [ ] **Bulk User Management** - Bulk operations on users
- [ ] **Bulk Data Import** - Import schools, users from CSV/Excel

#### 8. Data Export
- [ ] **Export School Data** - Export school information to CSV/Excel
- [ ] **Export User Data** - Export user lists
- [ ] **Export Statistics Reports** - Generate and export platform statistics

#### 9. System Configuration
- [ ] **Platform Settings** - Configure platform-wide settings
- [ ] **Email Templates** - Manage email templates
- [ ] **Notification Settings** - Configure notification preferences

---

## Database Schema Reference

### Schools Table Fields (from schema):
```sql
- id (UUID)
- name (VARCHAR)
- name_ar (VARCHAR)
- logo_url (TEXT)
- theme_color (VARCHAR) - default '#3B82F6'
- subscription_status (ENUM: 'trial', 'active', 'expired', 'cancelled')
- subscription_plan (VARCHAR) - default 'basic'
- subscription_end (DATE)
- max_students (INTEGER) - default 100
- max_teachers (INTEGER) - default 10
- contact_email (VARCHAR)
- contact_phone (VARCHAR)
- address (TEXT)
- timezone (VARCHAR) - default 'Africa/Tripoli'
- settings (JSONB) - default '{}'
- is_active (BOOLEAN) - default true
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Current Create School Form Only Captures:
- name
- name_ar
- contact_email
- contact_phone
- address

### Missing Fields in Create Form:
- logo_url
- theme_color
- subscription_status (currently hardcoded to 'active')
- subscription_plan (currently hardcoded to 'basic')
- subscription_end
- max_students
- max_teachers
- timezone
- settings (JSONB)

---

## Implementation Order (Recommended)

### Phase 1: Core CRUD Operations
1. Edit School functionality
2. Delete/Deactivate School functionality
3. Enhanced Create School form (all fields)
4. Edit School Admin functionality
5. Delete/Deactivate School Admin functionality

### Phase 2: View & List Pages
6. View All Admins page
7. View All Users page
8. School Details page

### Phase 3: Advanced Features
9. Platform Audit Logs view
10. Subscription Management
11. Advanced Filtering & Search
12. Data Export

### Phase 4: Bulk Operations & System Config
13. Bulk Operations
14. System Configuration
15. Platform Health Monitoring

---

## Notes
- All features should be fully translated (English & Arabic)
- All features should use the service role client to bypass RLS
- All features should have proper error handling and user feedback
- All features should be accessible and responsive
- Consider adding confirmation dialogs for destructive actions
- Consider adding undo functionality where appropriate

