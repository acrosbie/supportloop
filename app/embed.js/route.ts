// Served at /embed.js — a tiny loader a customer drops on their site:
//   <script src="https://<host>/embed.js" data-org="acme" async></script>
// It injects a floating launcher + an iframe pointing at /widget?org=<slug>.
export const dynamic = "force-static";

const SCRIPT = `(function () {
  var s = document.currentScript;
  var org = s && s.getAttribute("data-org");
  if (!org) { console.error("[SupportLoop] embed script needs a data-org attribute"); return; }
  var base = new URL(s.src).origin;

  var iframe = document.createElement("iframe");
  iframe.title = "Support chat";
  iframe.src = base + "/widget?org=" + encodeURIComponent(org);
  iframe.style.cssText = "position:fixed;bottom:88px;right:20px;z-index:2147483000;width:400px;height:600px;max-width:calc(100vw - 40px);max-height:calc(100vh - 120px);border:none;border-radius:16px;box-shadow:0 12px 48px rgba(0,0,0,0.25);display:none;background:#fff;";

  var btn = document.createElement("button");
  btn.setAttribute("aria-label", "Open support chat");
  btn.style.cssText = "position:fixed;bottom:20px;right:20px;z-index:2147483001;width:56px;height:56px;border-radius:9999px;border:none;background:#5e6ad2;color:#fff;box-shadow:0 6px 24px rgba(0,0,0,0.2);cursor:pointer;font-size:22px;line-height:1;";
  btn.innerHTML = "&#128172;";

  var open = false;
  btn.addEventListener("click", function () {
    open = !open;
    iframe.style.display = open ? "block" : "none";
    btn.innerHTML = open ? "&#10005;" : "&#128172;";
  });

  function mount() { document.body.appendChild(iframe); document.body.appendChild(btn); }
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
})();
`;

export function GET() {
  return new Response(SCRIPT, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
