"use client";

import { AdminAlert, AdminButton } from "@/components/admin/ui/AdminForm";

type AdminDraftToolbarProps = {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
  error?: string;
  success?: string;
};

export function AdminDraftToolbar({
  dirty,
  saving,
  onSave,
  onCancel,
  error,
  success,
}: AdminDraftToolbarProps) {
  return (
    <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-white/10 bg-[#050505]/95 px-4 py-4 backdrop-blur-md lg:-mx-8 lg:px-8">
      {dirty && (
        <div className="mb-3">
          <AdminAlert type="warning" message="Vous avez des modifications non enregistrées." />
        </div>
      )}
      {error && (
        <div className="mb-3">
          <AdminAlert type="error" message={error} />
        </div>
      )}
      {success && !dirty && (
        <div className="mb-3">
          <AdminAlert type="success" message={success} />
        </div>
      )}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <AdminButton variant="ghost" onClick={onCancel} disabled={!dirty || saving}>
          Annuler les modifications
        </AdminButton>
        <AdminButton variant="primary" onClick={onSave} disabled={!dirty || saving}>
          {saving ? "Enregistrement..." : "Enregistrer les modifications"}
        </AdminButton>
      </div>
    </div>
  );
}
