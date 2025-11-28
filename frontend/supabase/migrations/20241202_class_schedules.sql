-- =============================================
-- Migration: Class Schedules / Timetables
-- =============================================
-- This migration creates tables to manage class schedules
-- allowing admins to assign teachers to specific time slots

-- Step 1: Create class_periods table (defines time slots for the school)
CREATE TABLE IF NOT EXISTS class_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    period_number INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    name VARCHAR(50), -- e.g., "Period 1", "Morning Break", "Lunch"
    is_break BOOLEAN DEFAULT false,
    academic_year VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, period_number, academic_year)
);

-- Step 2: Create class_schedules table (links teachers to classes/subjects at specific times)
CREATE TABLE IF NOT EXISTS class_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    period_id UUID NOT NULL REFERENCES class_periods(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 1=Monday, etc.
    room_number VARCHAR(50),
    academic_year VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, period_id, day_of_week, academic_year)
);

-- Step 3: Create indexes for performance
CREATE INDEX idx_class_periods_school ON class_periods(school_id);
CREATE INDEX idx_class_periods_academic_year ON class_periods(academic_year);
CREATE INDEX idx_class_schedules_school ON class_schedules(school_id);
CREATE INDEX idx_class_schedules_class ON class_schedules(class_id);
CREATE INDEX idx_class_schedules_teacher ON class_schedules(teacher_id);
CREATE INDEX idx_class_schedules_subject ON class_schedules(subject_id);
CREATE INDEX idx_class_schedules_period ON class_schedules(period_id);
CREATE INDEX idx_class_schedules_day ON class_schedules(day_of_week);
CREATE INDEX idx_class_schedules_academic_year ON class_schedules(academic_year);
CREATE INDEX idx_class_schedules_active ON class_schedules(is_active);

-- Step 4: Add RLS policies
ALTER TABLE class_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage periods in their school
CREATE POLICY "Admins can manage periods in their school"
    ON class_periods
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin' AND school_id = class_periods.school_id
        )
    );

-- Policy: Teachers can view periods in their school
CREATE POLICY "Teachers can view periods in their school"
    ON class_periods
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND school_id = class_periods.school_id
        )
    );

-- Policy: Admins can manage schedules in their school
CREATE POLICY "Admins can manage schedules in their school"
    ON class_schedules
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin' AND school_id = class_schedules.school_id
        )
    );

-- Policy: Teachers can view their own schedules
CREATE POLICY "Teachers can view their own schedules"
    ON class_schedules
    FOR SELECT
    USING (
        teacher_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin' AND school_id = class_schedules.school_id
        )
    );

-- Step 5: Add comments
COMMENT ON TABLE class_periods IS 'Defines time periods/slots for the school day (e.g., Period 1: 8:00-9:00, Break: 9:00-9:15)';
COMMENT ON TABLE class_schedules IS 'Links teachers to classes and subjects at specific time periods and days. Creates the school timetable.';
COMMENT ON COLUMN class_schedules.day_of_week IS '0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';

-- Step 6: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create triggers for updated_at
CREATE TRIGGER update_class_periods_updated_at
    BEFORE UPDATE ON class_periods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_schedules_updated_at
    BEFORE UPDATE ON class_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

