// src/app/page.tsx
import ChatPanel from "@/components/ChatPanel";
import "./globals.css";

export default function Home() {
  return (
    <div className="app-shell">
      <section className="left-pane">
        {/* Replace this with your ArcDashboard embed or component */}
        <iframe
          src="https://www.arcgis.com/apps/dashboards/88d324cb1bbf48c1a1d76cc619b9dcea"  // TODO: set your ArcDashboard URL
          title="ArcDashboard"
          style={{ border: 0, width: "100%", height: "100vh" }}
        />
      </section>

      <section className="right-pane">
        <ChatPanel />
      </section>
    </div>
  );
}
