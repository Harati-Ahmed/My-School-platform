"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

interface QuickViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  entityId: string;
  entityType: "student" | "teacher" | "class" | "parent";
  children?: React.ReactNode;
  isLoading?: boolean;
}

/**
 * Quick View Dialog Component
 * Shows a preview/mini dashboard for an entity (student, teacher, class, or parent)
 */
export function QuickViewDialog({
  open,
  onOpenChange,
  title,
  entityId,
  entityType,
  children,
  isLoading = false,
}: QuickViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-4">
            {/* Header skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            {/* Cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
            {/* Content skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">{children}</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

