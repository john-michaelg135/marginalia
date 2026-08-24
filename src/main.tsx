import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", fontFamily: "monospace", color: "#efe9d8", background: "#0c1512", minHeight: "100vh" }}>
          <h1 style={{ color: "#e2a94e", fontSize: "1.5rem", marginBottom: "1rem" }}>Something went wrong</h1>
          <p style={{ color: "#a9bca8", marginBottom: "1rem" }}>{this.state.error?.message}</p>
          <button
            onClick={() => {
              localStorage.removeItem("marginalia.ledger.v1");
              window.location.reload();
            }}
            style={{
              background: "#de6a50",
              color: "#0c1512",
              border: "none",
              padding: "0.75rem 1.5rem",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "0.875rem",
            }}
          >
            Clear data & reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
