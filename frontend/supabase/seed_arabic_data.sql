-- =============================================
-- TILMEEDHY - COMPREHENSIVE ARABIC TEST DATA
-- Large-scale test data for Arabic region schools
-- Run via: supabase db seed seed_arabic_data.sql
-- Or via SQL Editor in Supabase Dashboard
-- =============================================

-- IMPORTANT: You MUST create auth users FIRST before running this script!
-- 
-- Run this command first:
--   node supabase/scripts/create-all-auth-users.js
--
-- This will create all auth users with the correct emails that this script expects.
-- The seed script will then look up these auth users by email and create user profiles.

-- =============================================
-- HELPER FUNCTION: Generate random date within range
-- =============================================
CREATE OR REPLACE FUNCTION random_date(start_date DATE, end_date DATE)
RETURNS DATE AS $$
BEGIN
    RETURN start_date + (random() * (end_date - start_date))::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ARABIC DATA ARRAYS
-- =============================================

-- Arabic first names (male)
DO $$
DECLARE
    male_names TEXT[] := ARRAY[
        'أحمد', 'محمد', 'علي', 'حسن', 'حسين', 'عمر', 'خالد', 'يوسف', 'إبراهيم', 'محمود',
        'عبدالله', 'عبدالرحمن', 'سعد', 'طارق', 'باسم', 'فادي', 'رامي', 'وليد', 'نادر', 'مروان',
        'زياد', 'عصام', 'أسامة', 'هشام', 'مازن', 'بسام', 'جمال', 'كمال', 'عادل', 'صالح'
    ];
    
    -- Arabic first names (female)
    female_names TEXT[] := ARRAY[
        'فاطمة', 'عائشة', 'خديجة', 'مريم', 'زينب', 'سارة', 'نور', 'ليلى', 'ريم', 'سلمى',
        'هند', 'نورا', 'لينا', 'دانا', 'رنا', 'راما', 'تالا', 'يارا', 'ميرا', 'لارا',
        'ميساء', 'هالة', 'نادية', 'سهام', 'منى', 'هدى', 'أمل', 'نجوى', 'وفاء', 'إيمان'
    ];
    
    -- Arabic last names
    last_names TEXT[] := ARRAY[
        'المحمدي', 'الإبراهيمي', 'الحسني', 'العلي', 'الخالدي', 'العباسي', 'الزهراني', 'الغامدي',
        'القحطاني', 'العتيبي', 'الدوسري', 'الشمري', 'الرشيد', 'المالكي', 'النجار', 'الحداد',
        'الصباح', 'الخليفة', 'المنصور', 'السلطان', 'الأمير', 'الشيخ', 'الحكيم', 'العارف',
        'الطيب', 'الكريم', 'الفتاح', 'الرحيم', 'الغفور', 'الودود'
    ];
    
    -- Arabic school names
    school_names_en TEXT[] := ARRAY[
        'Al-Noor International School', 'Al-Fajr Academy', 'Al-Andalus School',
        'Al-Quds Educational Complex', 'Al-Azhar Private School', 'Al-Rashid School',
        'Al-Madinah International Academy', 'Al-Khaleej School', 'Al-Amal School',
        'Al-Najah Educational Institute'
    ];
    
    school_names_ar TEXT[] := ARRAY[
        'مدرسة النور العالمية', 'أكاديمية الفجر', 'مدرسة الأندلس',
        'مجمع القدس التعليمي', 'مدرسة الأزهر الخاصة', 'مدرسة الرشيد',
        'أكاديمية المدينة المنورة العالمية', 'مدرسة الخليج', 'مدرسة الأمل',
        'معهد النجاح التعليمي'
    ];
    
    -- Arabic subjects
    subjects_en TEXT[] := ARRAY[
        'Mathematics', 'Arabic Language', 'Science', 'Islamic Education', 'English Language',
        'History', 'Geography', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
        'Art', 'Physical Education', 'Music', 'Social Studies'
    ];
    
    subjects_ar TEXT[] := ARRAY[
        'الرياضيات', 'اللغة العربية', 'العلوم', 'التربية الإسلامية', 'اللغة الإنجليزية',
        'التاريخ', 'الجغرافيا', 'الفيزياء', 'الكيمياء', 'الأحياء', 'علوم الحاسوب',
        'الرسم', 'التربية البدنية', 'الموسيقى', 'الدراسات الاجتماعية'
    ];
    
    -- Grade levels
    grade_levels TEXT[] := ARRAY['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 
                                  'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 
                                  'Grade 11', 'Grade 12'];
    
    sections TEXT[] := ARRAY['A', 'B', 'C', 'D', 'E'];
    
    -- Exam names in Arabic
    exam_names_ar TEXT[] := ARRAY[
        'امتحان الفصل الأول', 'امتحان منتصف الفصل', 'امتحان نهائي', 'اختبار قصير',
        'واجب منزلي', 'مشروع', 'اختبار شهري', 'امتحان تجريبي', 'اختبار يومي', 'تقييم أداء'
    ];
    
    exam_names_en TEXT[] := ARRAY[
        'First Term Exam', 'Midterm Exam', 'Final Exam', 'Quiz',
        'Homework Assignment', 'Project', 'Monthly Test', 'Mock Exam', 'Daily Test', 'Performance Assessment'
    ];
    
    -- Feedback messages in Arabic
    feedback_ar TEXT[] := ARRAY[
        'أداء ممتاز! استمر في التقدم', 'عمل جيد جداً', 'تحسن ملحوظ', 'يحتاج إلى مزيد من الجهد',
        'أداء جيد ولكن يمكن التحسين', 'ممتاز في الفهم والاستيعاب', 'يحتاج إلى مراجعة إضافية',
        'أداء متميز في هذا الاختبار', 'حافظ على هذا المستوى', 'تحسن كبير في الأداء'
    ];
    
    -- Homework titles in Arabic
    homework_titles_ar TEXT[] := ARRAY[
        'حل تمارين الفصل الثالث', 'قراءة درس جديد', 'كتابة موضوع تعبير', 'حل مسائل الرياضيات',
        'مراجعة القواعد النحوية', 'إعداد بحث علمي', 'حل أسئلة الفيزياء', 'كتابة تقرير',
        'حفظ قصيدة', 'حل تمارين الكيمياء', 'إعداد عرض تقديمي', 'حل واجبات إضافية'
    ];
    
    homework_titles_en TEXT[] := ARRAY[
        'Solve Chapter 3 Exercises', 'Read New Lesson', 'Write Essay', 'Solve Math Problems',
        'Review Grammar Rules', 'Prepare Science Research', 'Solve Physics Questions', 'Write Report',
        'Memorize Poem', 'Solve Chemistry Exercises', 'Prepare Presentation', 'Solve Additional Exercises'
    ];
    
    -- Announcement titles in Arabic
    announcement_titles_ar TEXT[] := ARRAY[
        'بداية العام الدراسي الجديد', 'موعد الامتحانات النهائية', 'رحلة مدرسية', 'يوم مفتوح',
        'ورشة عمل للطلاب', 'احتفال يوم العلم', 'اجتماع أولياء الأمور', 'إعلان هام',
        'تغيير في الجدول الدراسي', 'نشاطات إضافية'
    ];
    
    announcement_titles_en TEXT[] := ARRAY[
        'New Academic Year Start', 'Final Exams Schedule', 'School Trip', 'Open Day',
        'Student Workshop', 'Flag Day Celebration', 'Parents Meeting', 'Important Announcement',
        'Schedule Change', 'Additional Activities'
    ];
    
    -- Variables
    school_id UUID;
    class_id UUID;
    teacher_id UUID;
    student_id UUID;
    subject_id UUID;
    parent_id UUID;
    admin_id UUID;
    i INTEGER;
    j INTEGER;
    k INTEGER;
    l INTEGER;
    m INTEGER;
    n INTEGER;
    school_count INTEGER := 5;
    teachers_per_school INTEGER := 12;
    classes_per_school INTEGER := 8;
    students_per_class INTEGER := 25;
    -- Create all subjects once per school (shared across all classes)
    total_subjects INTEGER := 15; -- All subjects from the array
    school_subjects_array UUID[] := ARRAY[]::UUID[]; -- Store subjects created once per school
    attendance_days INTEGER := 60; -- Last 60 school days
    grades_per_student INTEGER := 15; -- Various grades per student
    homework_per_subject INTEGER := 5;
    notes_per_teacher INTEGER := 10;
    announcements_per_school INTEGER := 8;
    current_date_val DATE := CURRENT_DATE;
    school_date DATE;
    random_name TEXT;
    random_last_name TEXT;
    random_email TEXT;
    random_phone TEXT;
    random_gender TEXT;
    random_dob DATE;
    random_grade_level TEXT;
    random_section TEXT;
    random_subject_idx INTEGER;
    random_exam_type TEXT;
    random_status TEXT;
    random_note_type TEXT;
    random_priority TEXT;
    random_audience TEXT;
    attendance_date DATE;
    grade_date DATE;
    rand_val INTEGER;
    homework_due_date TIMESTAMP WITH TIME ZONE;
    exam_name_ar TEXT;
    exam_name_en TEXT;
    feedback_text TEXT;
    homework_title_ar TEXT;
    homework_title_en TEXT;
    homework_desc TEXT;
    note_content TEXT;
    announcement_title_ar TEXT;
    announcement_title_en TEXT;
    announcement_content TEXT;
    student_count INTEGER;
    class_students UUID[];
    class_subjects UUID[];
    teacher_subjects UUID[];
    
BEGIN
    -- Loop through schools
    FOR i IN 1..school_count LOOP
        -- Create School
        INSERT INTO schools (
            name, name_ar, contact_email, contact_phone, address,
            subscription_status, subscription_plan, max_students, max_teachers,
            timezone, is_active
        ) VALUES (
            school_names_en[i],
            school_names_ar[i],
            'info@school' || i || '.ly',
            '+218-91-' || LPAD((100 + i * 10)::TEXT, 6, '0'),
            CASE i % 4
                WHEN 0 THEN 'طرابلس، ليبيا'
                WHEN 1 THEN 'بنغازي، ليبيا'
                WHEN 2 THEN 'مصراتة، ليبيا'
                WHEN 3 THEN 'سبها، ليبيا'
                ELSE 'طرابلس، ليبيا'
            END,
            (CASE WHEN i <= 3 THEN 'active' ELSE 'trial' END)::subscription_status_type,
            CASE WHEN i <= 2 THEN 'premium' WHEN i <= 4 THEN 'standard' ELSE 'basic' END,
            500 + (i * 100),
            30 + (i * 5),
            'Africa/Tripoli',
            true
        ) RETURNING id INTO school_id;
        
        RAISE NOTICE 'Created school: % (%)', school_names_ar[i], school_id;
        
        -- Create Admin for this school
        random_name := male_names[1 + floor(random() * array_length(male_names, 1))::INTEGER];
        random_last_name := last_names[1 + floor(random() * array_length(last_names, 1))::INTEGER];
        random_email := 'admin' || i || '@school' || i || '.ly';
        random_phone := '+218-91-' || LPAD((200 + i * 10)::TEXT, 6, '0');
        
        -- Get auth user ID by email (auth user must be created first)
        SELECT id INTO admin_id FROM auth.users WHERE email = random_email;
        
        -- If auth user exists, create user profile
        IF admin_id IS NOT NULL THEN
            INSERT INTO users (id, name, role, email, phone, school_id, language_preference, is_active)
            VALUES (admin_id, random_name || ' ' || random_last_name, 'admin'::user_role, random_email, random_phone, school_id, 'ar', true)
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
        ELSE
            RAISE NOTICE 'Warning: Auth user not found for email: %', random_email;
        END IF;
        
        -- Create Teachers for this school
        teacher_subjects := ARRAY[]::UUID[];
        FOR j IN 1..teachers_per_school LOOP
            random_name := CASE WHEN j % 3 = 0 
                THEN female_names[1 + floor(random() * array_length(female_names, 1))::INTEGER]
                ELSE male_names[1 + floor(random() * array_length(male_names, 1))::INTEGER]
            END;
            random_last_name := last_names[1 + floor(random() * array_length(last_names, 1))::INTEGER];
            random_email := 'teacher' || j || '@school' || i || '.ly';
            random_phone := '+218-92-' || LPAD((j * 100 + i)::TEXT, 6, '0');
            
            -- Get auth user ID by email (auth user must be created first)
            SELECT id INTO teacher_id FROM auth.users WHERE email = random_email;
            
            -- If auth user exists, create user profile
            IF teacher_id IS NOT NULL THEN
                INSERT INTO users (id, name, role, email, phone, school_id, language_preference, is_active)
                VALUES (teacher_id, random_name || ' ' || random_last_name, 'teacher'::user_role, random_email, random_phone, school_id, 'ar', true)
                ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
            ELSE
                RAISE NOTICE 'Warning: Auth user not found for email: %', random_email;
                -- Skip this teacher
                CONTINUE;
            END IF;
            
            teacher_subjects := array_append(teacher_subjects, teacher_id);
            
            -- Create Parents (2 per teacher for variety)
            FOR k IN 1..2 LOOP
                random_name := male_names[1 + floor(random() * array_length(male_names, 1))::INTEGER];
                random_last_name := last_names[1 + floor(random() * array_length(last_names, 1))::INTEGER];
                random_email := 'parent' || (j * 2 + k) || '@school' || i || '.ly';
                random_phone := '+218-93-' || LPAD((j * 100 + k * 10 + i)::TEXT, 6, '0');
                
                -- Get auth user ID by email (auth user must be created first)
                SELECT id INTO parent_id FROM auth.users WHERE email = random_email;
                
                -- If auth user exists, create user profile
                IF parent_id IS NOT NULL THEN
                    INSERT INTO users (id, name, role, email, phone, school_id, language_preference, is_active)
                    VALUES (parent_id, random_name || ' ' || random_last_name, 'parent'::user_role, random_email, random_phone, school_id, 'ar', true)
                    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
                ELSE
                    RAISE NOTICE 'Warning: Auth user not found for email: %', random_email;
                END IF;
            END LOOP;
        END LOOP;
        
        -- Create ALL subjects ONCE globally (before creating schools)
        -- All schools share the same 15 subjects
        -- Subjects are created only once with school_id = NULL (global subjects)
        -- This is done outside the school loop, so we check if subjects already exist
        IF i = 1 THEN
            -- Create global subjects only once (on first school iteration)
            school_subjects_array := ARRAY[]::UUID[];
            
            FOR k IN 1..array_length(subjects_ar, 1) LOOP
                -- Check if subject already exists globally
                SELECT s.id INTO subject_id FROM subjects s
                WHERE s.name = subjects_en[k] AND s.school_id IS NULL;
                
                IF subject_id IS NULL THEN
                    -- Create global subject (school_id = NULL means shared by all schools)
                    INSERT INTO subjects (
                        name, name_ar, code, class_id, teacher_id, school_id, max_grade, is_active
                    ) VALUES (
                        subjects_en[k], -- Subject name in English
                        subjects_ar[k], -- Subject name in Arabic
                        UPPER(SUBSTRING(subjects_en[k], 1, 4)), -- Code (first 4 letters)
                        NULL, -- NULL = not tied to specific class
                        NULL, -- NULL = no specific teacher assigned (schools assign teachers manually)
                        NULL, -- NULL = global subject, shared by all schools
                        100.00,
                        true
                    ) RETURNING id INTO subject_id;
                END IF;
                
                school_subjects_array := array_append(school_subjects_array, subject_id);
            END LOOP;
        ELSE
            -- For subsequent schools, get the global subjects
            SELECT COALESCE(ARRAY_AGG(s.id ORDER BY s.name), ARRAY[]::UUID[]) INTO school_subjects_array 
            FROM subjects s
            WHERE s.school_id IS NULL;
            
            -- If no subjects found, something went wrong
            IF array_length(school_subjects_array, 1) IS NULL THEN
                RAISE EXCEPTION 'Global subjects not found. Please ensure subjects are created for first school.';
            END IF;
        END IF;
        
        -- Create Classes for this school
        class_students := ARRAY[]::UUID[];
        FOR j IN 1..classes_per_school LOOP
            random_grade_level := grade_levels[1 + (j - 1) % array_length(grade_levels, 1)];
            random_section := sections[1 + (j - 1) % array_length(sections, 1)];
            
            -- Assign a random teacher as main teacher
            teacher_id := teacher_subjects[1 + floor(random() * array_length(teacher_subjects, 1))::INTEGER];
            
            INSERT INTO classes (
                name, grade_level, section, academic_year, school_id, main_teacher_id,
                max_capacity, room_number, is_active
            ) VALUES (
                random_grade_level || random_section,
                random_grade_level,
                random_section,
                '2024-2025',
                school_id,
                teacher_id,
                30,
                'R' || LPAD(j::TEXT, 3, '0'),
                true
            ) RETURNING id INTO class_id;
            
            -- Use the school-wide subjects for this class
            class_subjects := school_subjects_array;
            
            -- Create Students for this class
            FOR k IN 1..students_per_class LOOP
                random_gender := CASE WHEN k % 2 = 0 THEN 'male' ELSE 'female' END;
                random_name := CASE WHEN random_gender = 'female'
                    THEN female_names[1 + floor(random() * array_length(female_names, 1))::INTEGER]
                    ELSE male_names[1 + floor(random() * array_length(male_names, 1))::INTEGER]
                END;
                random_last_name := last_names[1 + floor(random() * array_length(last_names, 1))::INTEGER];
                
                -- Calculate DOB based on grade level (approximately)
                random_dob := CURRENT_DATE - INTERVAL '1 year' * (6 + (j - 1) % 12) - INTERVAL '1 day' * floor(random() * 365)::INTEGER;
                
                -- Get a parent (cycle through parents)
                DECLARE
                    current_school_id UUID := school_id;
                BEGIN
                    SELECT u.id INTO parent_id FROM users u
                    WHERE u.school_id = current_school_id AND u.role = 'parent' 
                    ORDER BY u.created_at 
                    LIMIT 1 OFFSET ((k - 1) % (teachers_per_school * 2));
                END;
                
                -- If no parent found, try to get one from auth.users by email pattern
                IF parent_id IS NULL THEN
                    random_email := 'parent' || (j * students_per_class + k) || '@school' || i || '.ly';
                    SELECT id INTO parent_id FROM auth.users WHERE email = random_email;
                    
                    IF parent_id IS NOT NULL THEN
                        random_name := male_names[1 + floor(random() * array_length(male_names, 1))::INTEGER];
                        random_last_name := last_names[1 + floor(random() * array_length(last_names, 1))::INTEGER];
                        random_phone := '+218-94-' || LPAD((j * 1000 + k * 10)::TEXT, 6, '0');
                        
                        INSERT INTO users (id, name, role, email, phone, school_id, language_preference, is_active)
                        VALUES (parent_id, random_name || ' ' || random_last_name, 'parent'::user_role, random_email, random_phone, school_id, 'ar', true)
                        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
                    ELSE
                        -- Get any available parent from this school
                        DECLARE
                            current_school_id UUID := school_id;
                        BEGIN
                            SELECT u.id INTO parent_id FROM users u
                            WHERE u.school_id = current_school_id AND u.role = 'parent' 
                            ORDER BY random() 
                            LIMIT 1;
                        END;
                    END IF;
                END IF;
                
                INSERT INTO students (
                    name, student_id_number, date_of_birth, gender, class_id, parent_id, school_id,
                    enrollment_date, is_active
                ) VALUES (
                    random_name || ' ' || random_last_name,
                    'SCH' || i || '-' || LPAD(j::TEXT, 2, '0') || '-' || LPAD(k::TEXT, 3, '0'),
                    random_dob,
                    random_gender::gender_type,
                    class_id,
                    parent_id,
                    school_id,
                    CURRENT_DATE - INTERVAL '1 month' * floor(random() * 6)::INTEGER,
                    true
                ) RETURNING id INTO student_id;
                
                class_students := array_append(class_students, student_id);
                
                -- Create Attendance records (last 60 school days, excluding weekends)
                FOR l IN 1..attendance_days LOOP
                    attendance_date := CURRENT_DATE - INTERVAL '1 day' * l;
                    -- Skip weekends (Saturday = 6, Sunday = 0 in PostgreSQL)
                    IF EXTRACT(DOW FROM attendance_date) NOT IN (0, 6) THEN
                        rand_val := floor(random() * 100)::INTEGER;
                        random_status := CASE 
                            WHEN rand_val BETWEEN 0 AND 5 THEN 'excused'
                            WHEN rand_val BETWEEN 6 AND 10 THEN 'late'
                            WHEN rand_val BETWEEN 11 AND 15 THEN 'absent'
                            ELSE 'present'
                        END;
                        
                        -- Get class teacher or random teacher
                        SELECT c.main_teacher_id INTO teacher_id FROM classes c WHERE c.id = class_id;
                        IF teacher_id IS NULL THEN
                            teacher_id := teacher_subjects[1 + floor(random() * array_length(teacher_subjects, 1))::INTEGER];
                        END IF;
                        
                        BEGIN
                            INSERT INTO attendance (
                                student_id, class_id, date, status, marked_by, school_id, note
                            ) 
                            SELECT 
                                student_id, class_id, attendance_date, random_status::attendance_status,
                                teacher_id, school_id,
                                CASE WHEN random_status IN ('absent', 'late') 
                                    THEN 'سجل تلقائياً' 
                                    ELSE NULL 
                                END;
                        EXCEPTION WHEN unique_violation THEN
                            -- Skip if already exists
                            NULL;
                        END;
                    END IF;
                END LOOP;
                
                -- Create Grades for this student
                FOR l IN 1..grades_per_student LOOP
                    -- Random subject from class subjects
                    subject_id := class_subjects[1 + floor(random() * array_length(class_subjects, 1))::INTEGER];
                    
                    -- Get teacher for this subject
                    SELECT s.teacher_id INTO teacher_id FROM subjects s WHERE s.id = subject_id;
                    IF teacher_id IS NULL THEN
                        teacher_id := teacher_subjects[1 + floor(random() * array_length(teacher_subjects, 1))::INTEGER];
                    END IF;
                    
                    random_exam_type := (ARRAY['quiz', 'midterm', 'final', 'assignment', 'participation'])[
                        1 + floor(random() * 5)::INTEGER
                    ];
                    
                    exam_name_ar := exam_names_ar[1 + floor(random() * array_length(exam_names_ar, 1))::INTEGER];
                    exam_name_en := exam_names_en[1 + floor(random() * array_length(exam_names_en, 1))::INTEGER];
                    
                    feedback_text := feedback_ar[1 + floor(random() * array_length(feedback_ar, 1))::INTEGER];
                    
                    -- Grade date within last 3 months
                    grade_date := CURRENT_DATE - INTERVAL '1 day' * floor(random() * 90)::INTEGER;
                    
                    -- Generate realistic grade (tendency towards 70-95)
                    DECLARE
                        grade_val DECIMAL(5,2);
                        max_grade_val DECIMAL(5,2) := 100.00;
                    BEGIN
                        grade_val := 70 + (random() * 25)::DECIMAL(5,2);
                        
                        INSERT INTO grades (
                            student_id, subject_id, grade, max_grade, exam_type, exam_name,
                            feedback, teacher_id, date, school_id
                        )
                        SELECT 
                            student_id, subject_id, grade_val, max_grade_val, random_exam_type::exam_type,
                            exam_name_ar || ' / ' || exam_name_en, feedback_text, teacher_id, grade_date, school_id;
                    END;
                END LOOP;
            END LOOP;
            
            -- Create Homework for each subject
            FOR k IN 1..array_length(class_subjects, 1) LOOP
                subject_id := class_subjects[k];
                -- Assign a random teacher from this school (subjects are global, so no teacher assigned to subject)
                teacher_id := teacher_subjects[1 + floor(random() * array_length(teacher_subjects, 1))::INTEGER];
                
                FOR l IN 1..homework_per_subject LOOP
                    homework_title_ar := homework_titles_ar[1 + floor(random() * array_length(homework_titles_ar, 1))::INTEGER];
                    homework_title_en := homework_titles_en[1 + floor(random() * array_length(homework_titles_en, 1))::INTEGER];
                    homework_desc := 'يرجى إكمال ' || homework_title_ar || ' قبل الموعد المحدد. ' ||
                                    'Please complete ' || homework_title_en || ' before the due date.';
                    
                    homework_due_date := CURRENT_TIMESTAMP + INTERVAL '1 day' * (3 + floor(random() * 14)::INTEGER);
                    
                    INSERT INTO homework (
                        title, description, subject_id, class_id, teacher_id, school_id,
                        due_date, is_published, completion_count, view_count
                    ) VALUES (
                        homework_title_ar || ' / ' || homework_title_en,
                        homework_desc,
                        subject_id,
                        class_id,
                        teacher_id,
                        school_id,
                        homework_due_date,
                        true,
                        floor(random() * students_per_class)::INTEGER,
                        floor(random() * students_per_class * 2)::INTEGER
                    );
                END LOOP;
            END LOOP;
            
            -- Create Teacher Notes
            FOR k IN 1..array_length(teacher_subjects, 1) LOOP
                teacher_id := teacher_subjects[k];
                
                FOR l IN 1..notes_per_teacher LOOP
                    -- Random student from any class in this school
                    DECLARE
                        current_school_id UUID := school_id;
                    BEGIN
                        SELECT s.id INTO student_id FROM students s
                        WHERE s.school_id = current_school_id 
                        ORDER BY random() 
                        LIMIT 1;
                    END;
                    
                    IF student_id IS NOT NULL THEN
                        -- Random subject
                        subject_id := class_subjects[1 + floor(random() * array_length(class_subjects, 1))::INTEGER];
                        
                        random_note_type := (ARRAY['positive', 'concern', 'general', 'behavioral'])[
                            1 + floor(random() * 4)::INTEGER
                        ];
                        
                        note_content := CASE random_note_type
                            WHEN 'positive' THEN 'أداء ممتاز! الطالب يظهر تحسناً ملحوظاً في ' || 
                                                 (SELECT s.name_ar FROM subjects s WHERE s.id = subject_id)
                            WHEN 'concern' THEN 'يحتاج الطالب إلى دعم إضافي في ' ||
                                                (SELECT s.name_ar FROM subjects s WHERE s.id = subject_id)
                            WHEN 'behavioral' THEN 'سلوك جيد في الصف. يستمر في المشاركة الفعالة.'
                            ELSE 'ملاحظة عامة: أداء الطالب جيد بشكل عام.'
                        END;
                        
                        INSERT INTO teacher_notes (
                            student_id, teacher_id, subject_id, content, note_type, school_id, is_read
                        )
                        SELECT 
                            student_id, teacher_id, subject_id, note_content, random_note_type::note_type,
                            school_id, CASE WHEN random() > 0.3 THEN true ELSE false END;
                    END IF;
                END LOOP;
            END LOOP;
        END LOOP;
        
        -- Create Announcements for this school
        FOR j IN 1..announcements_per_school LOOP
            announcement_title_ar := announcement_titles_ar[1 + floor(random() * array_length(announcement_titles_ar, 1))::INTEGER];
            announcement_title_en := announcement_titles_en[1 + floor(random() * array_length(announcement_titles_en, 1))::INTEGER];
            
            announcement_content := 'إعلان هام: ' || announcement_title_ar || 
                                   '. يرجى الاطلاع على التفاصيل أدناه. ' ||
                                   'Important Announcement: ' || announcement_title_en || 
                                   '. Please review the details below.';
            
            random_priority := (ARRAY['urgent', 'normal', 'info'])[1 + floor(random() * 3)::INTEGER];
            random_audience := (ARRAY['all', 'parents', 'teachers', 'class'])[1 + floor(random() * 4)::INTEGER];
            
            INSERT INTO announcements (
                title, content, school_id, author_id, priority, target_audience,
                is_published, published_at, expires_at, view_count
            ) VALUES (
                announcement_title_ar || ' / ' || announcement_title_en,
                announcement_content,
                school_id,
                admin_id,
                random_priority::priority_type,
                random_audience::audience_type,
                true,
                CURRENT_TIMESTAMP - INTERVAL '1 day' * floor(random() * 30)::INTEGER,
                CURRENT_TIMESTAMP + INTERVAL '1 day' * (30 + floor(random() * 60)::INTEGER),
                floor(random() * 500)::INTEGER
            );
        END LOOP;
        
        RAISE NOTICE 'Completed school %: %', i, school_names_ar[i];
    END LOOP;
    
    RAISE NOTICE 'Seed data generation completed successfully!';
END $$;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Count summary
SELECT 
    'Schools' as entity, COUNT(*) as count FROM schools
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Teachers', COUNT(*) FROM users WHERE role = 'teacher'
UNION ALL
SELECT 'Parents', COUNT(*) FROM users WHERE role = 'parent'
UNION ALL
SELECT 'Admins', COUNT(*) FROM users WHERE role = 'admin'
UNION ALL
SELECT 'Classes', COUNT(*) FROM classes
UNION ALL
SELECT 'Students', COUNT(*) FROM students
UNION ALL
SELECT 'Subjects', COUNT(*) FROM subjects
UNION ALL
SELECT 'Attendance Records', COUNT(*) FROM attendance
UNION ALL
SELECT 'Grades', COUNT(*) FROM grades
UNION ALL
SELECT 'Homework', COUNT(*) FROM homework
UNION ALL
SELECT 'Teacher Notes', COUNT(*) FROM teacher_notes
UNION ALL
SELECT 'Announcements', COUNT(*) FROM announcements;

-- School details
SELECT 
    s.name_ar as "اسم المدرسة",
    s.name as "School Name",
    COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'teacher') as "عدد المعلمين",
    COUNT(DISTINCT st.id) as "عدد الطلاب",
    COUNT(DISTINCT c.id) as "عدد الفصول",
    COUNT(DISTINCT sub.id) as "عدد المواد"
FROM schools s
LEFT JOIN users u ON u.school_id = s.id
LEFT JOIN students st ON st.school_id = s.id
LEFT JOIN classes c ON c.school_id = s.id
LEFT JOIN subjects sub ON sub.school_id = s.id
GROUP BY s.id, s.name_ar, s.name
ORDER BY s.name_ar;

