import { DesignerProvider } from "@/components/designer/DesignerContext";
import { NeonDesignerClient } from "@/components/designer/NeonDesignerClient";

export default function DesignerPage() {
  return (
    <DesignerProvider>
      <NeonDesignerClient />
    </DesignerProvider>
  );
}
