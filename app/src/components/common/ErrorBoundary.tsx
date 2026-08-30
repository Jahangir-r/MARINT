import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("MARINT app error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-navy-deep text-white">
          <div className="text-center max-w-md px-6">
            <div className="text-sm uppercase tracking-[0.2em] text-cyan/70 mb-3">MARINT</div>
            <p className="text-white/70 text-sm mb-6">Something went wrong loading this view.</p>
            <button
              onClick={() => { this.setState({ error: null }); window.location.assign("/"); }}
              className="text-[13px] font-medium px-4 py-2 rounded-md border border-cyan/30 text-cyan hover:bg-cyan/10 transition-colors"
            >
              Return home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
