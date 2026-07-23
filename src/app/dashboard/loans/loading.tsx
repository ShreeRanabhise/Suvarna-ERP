import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    </div>
  )
}
