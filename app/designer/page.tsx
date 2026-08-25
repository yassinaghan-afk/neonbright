import { DesignerProvider } from "@/components/designer/DesignerContext";
import { NeonDesignerClient } from "@/components/designer/NeonDesignerClient";
import { SignageDesignerClient } from "@/components/signage/SignageDesignerClient";

type Props = {
  searchParams: Promise<{ mode?: string }>;
};

export default async function DesignerPage({ searchParams }: Props) {
  const { mode } = await searchParams;

  // "Créer Mon Enseigne" — keep neon designer completely untouched.
  if (mode === "enseigne") {
    return <SignageDesignerClient />;
  }

  return (
    <DesignerProvider>
      <NeonDesignerClient />
    </DesignerProvider>
  );
}
