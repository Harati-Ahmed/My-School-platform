import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getClassStudents } from "@/lib/actions/teacher";
import { ArrowLeft, Mail, Phone, User, Calendar } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClassStudentsPage({ params }: Props) {
  const t = await getTranslations();
  const { id } = await params;
  
  const students = await getClassStudents(id);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/teacher/classes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{t("teacher.classes.classStudents")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("teacher.classes.manageStudents")}
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("teacher.classes.searchStudents")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder={t("teacher.classes.searchPlaceholder")}
              className="max-w-sm"
            />
            <Button variant="secondary">{t("common.search")}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {t("teacher.classes.students")} ({students.length})
          </h2>
        </div>

        {students.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("teacher.classes.noStudents")}</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                {t("teacher.classes.noStudentsDesc")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {students.map((student: any) => (
              <Card key={student.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Student Avatar */}
                    <div className="flex-shrink-0">
                      {student.profile_picture_url ? (
                        <img
                          src={student.profile_picture_url}
                          alt={student.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-2xl font-semibold text-primary">
                            {student.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Student Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold">{student.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            ID: {student.student_id_number || "N/A"}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          student.gender === "male" 
                            ? "bg-primary/10 text-primary"
                            : "bg-primary/10 text-primary"
                        }`}>
                          {student.gender === "male" ? t("teacher.classes.male") : t("teacher.classes.female")}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{t("teacher.classes.dob")}</span>
                          <span>{format(new Date(student.date_of_birth), "MMM dd, yyyy")}</span>
                        </div>

                        {student.users && (
                          <>
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{t("teacher.classes.parent")}</span>
                              <span className="truncate">{student.users.name}</span>
                            </div>

                            {student.users.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <a 
                                  href={`mailto:${student.users.email}`}
                                  className="text-primary hover:underline truncate"
                                >
                                  {student.users.email}
                                </a>
                              </div>
                            )}

                            {student.users.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <a 
                                  href={`tel:${student.users.phone}`}
                                  className="text-primary hover:underline"
                                >
                                  {student.users.phone}
                                </a>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/teacher/grades/${id}`}>
                            {t("teacher.classes.viewGrades")}
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/teacher/attendance/${id}/view`}>
                            {t("teacher.classes.viewAttendance")}
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/teacher/notes/create?student=${student.id}`}>
                            {t("teacher.classes.addNote")}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

