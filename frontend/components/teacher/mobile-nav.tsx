"use client";

import { useState } from "react";
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  BookOpen, 
  GraduationCap, 
  Calendar, 
  FileText, 
  BarChart, 
  Settings,
  type LucideIcon 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

type NavigationItem = {
  name: string;
  href: string;
  iconName: string;
};

interface TeacherMobileNavProps {
  navigation: NavigationItem[];
}

const iconMap: Record<string, LucideIcon> = {
  Home,
  Users,
  BookOpen,
  GraduationCap,
  Calendar,
  FileText,
  BarChart,
  Settings,
};

export function TeacherMobileNav({ navigation }: TeacherMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => setIsOpen(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Open navigation menu"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm md:hidden">
          <div className="flex items-center justify-between h-16 px-4 border-b border-border">
            <p className="text-lg font-semibold text-foreground">Tilmeedhy</p>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close navigation menu"
              onClick={handleClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="p-4 space-y-2">
            {navigation.map((item) => {
              const IconComponent = iconMap[item.iconName];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-base font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
                  onClick={handleClose}
                >
                  {IconComponent && <IconComponent className="h-5 w-5" />}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}
    </>
  );
}

