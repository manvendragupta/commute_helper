import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  return (
    <div className={cn("animate-spin rounded-full border-2 border-slate-300 border-t-bart-blue", sizeClasses[size], className)} />
  );
}

export function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="animate-pulse flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-slate-200 rounded-full"></div>
              <div>
                <div className="h-4 bg-slate-200 rounded w-24"></div>
                <div className="h-3 bg-slate-200 rounded w-16 mt-1"></div>
              </div>
            </div>
            <div className="text-right">
              <div className="h-6 bg-slate-200 rounded w-8"></div>
              <div className="h-3 bg-slate-200 rounded w-6 mt-1"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
