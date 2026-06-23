"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { clearSavedEditorState } from "@/lib/designer/editor/persist";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class DesignerErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[designer-error]", error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ error: null });
  };

  private handleReset = () => {
    clearSavedEditorState();
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#050505] px-6 text-center">
          <p className="text-lg font-semibold text-white">Designer encountered an error</p>
          <p className="max-w-md text-sm text-white/50">
            Your design is saved locally. Try reloading the editor or reset if the problem persists.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={this.handleRetry}>
              Try again
            </Button>
            <Button size="sm" variant="secondary" onClick={this.handleReset}>
              Reset editor
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
