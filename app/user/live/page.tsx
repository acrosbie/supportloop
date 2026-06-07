import CustomerLiveChat from "@/components/customer/CustomerLiveChat";

export const dynamic = "force-dynamic";
export const metadata = { title: "Live chat" };

export default function LivePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Live chat</h1>
      <p className="mt-1 text-muted">Chat with our support team in real time.</p>
      <div className="mt-6">
        <CustomerLiveChat />
      </div>
    </div>
  );
}
