import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Phone, MessageSquare, Globe, Heart } from "lucide-react";

interface Props { open: boolean; onOpenChange: (o: boolean) => void; severity?: "medium" | "high" }

const resources = [
  { name: "iCall (India)", detail: "9152987821 — Mon–Sat, 8am–10pm", href: "tel:9152987821", icon: Phone },
  { name: "Vandrevala Foundation (India)", detail: "1860-2662-345 — free, 24/7", href: "tel:18602662345", icon: Phone },
  { name: "AASRA (India)", detail: "9820466726 — 24/7, confidential", href: "tel:9820466726", icon: Phone },
  { name: "KIRAN Mental Health Helpline", detail: "1800-599-0019 — Govt. of India, 24/7", href: "tel:18005990019", icon: Phone },
  { name: "International Association for Suicide Prevention", detail: "Find a hotline in your country", href: "https://www.iasp.info/resources/Crisis_Centres/", icon: Globe },
];

export const CrisisDialog = ({ open, onOpenChange, severity }: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <Heart className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <DialogTitle className="font-display text-2xl">You're not alone</DialogTitle>
            <DialogDescription>
              {severity === "high"
                ? "What you're carrying sounds heavy. Please reach out to a person who can help right now."
                : "If things feel like too much, real human support is available — anytime."}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>
      <div className="space-y-2 mt-2">
        {resources.map((r) => (
          <a
            key={r.name}
            href={r.href}
            target={r.href.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            className="flex items-start gap-3 p-4 rounded-2xl bg-muted/60 hover:bg-muted transition-soft"
          >
            <r.icon className="h-5 w-5 mt-0.5 text-primary" />
            <div>
              <div className="font-medium">{r.name}</div>
              <div className="text-sm text-muted-foreground">{r.detail}</div>
            </div>
          </a>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center pt-2">
        Solace is a supportive companion, not a substitute for professional care.
      </p>
    </DialogContent>
  </Dialog>
);
