import { MessageCircle, Mail, Globe, Radio } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  chat: MessageCircle,
  email: Mail,
  web: Globe,
  live: Radio,
};

export function ChannelIcon({ channel, className }: { channel: string; className?: string }) {
  const Icon = MAP[channel] ?? Globe;
  return <Icon className={className} />;
}

export function channelLabel(channel: string): string {
  if (channel === "chat") return "Chat";
  if (channel === "email") return "Email";
  if (channel === "web") return "Web form";
  if (channel === "live") return "Live chat";
  return channel;
}
