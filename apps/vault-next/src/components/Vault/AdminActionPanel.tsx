import React from 'react';
import { Button } from '@pwmnger/ui';
import { Settings, Download, Upload } from 'lucide-react';
import styles from '../../styles/Dashboard.module.css';

interface AdminActionPanelProps {
  onImportVault: (content: string) => Promise<void>;
  onExportVault: () => Promise<string>;
  setToast: (toast: { message: string; type: "success" | "error" } | null) => void;
}

export const AdminActionPanel: React.FC<AdminActionPanelProps> = ({
  onImportVault,
  onExportVault,
  setToast,
}) => {
  return (
    <div className="card-premium" style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Settings size={16} style={{ color: "var(--slate-400)" }} />
        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Administration</h3>
      </div>
      
      <p style={{ fontSize: "12px", color: "var(--text-dim)", margin: "0 0 16px 0" }}>
        Manage encrypted backup files only. Plaintext password export is intentionally disabled in this frontend.
      </p>

      <div
        style={{
          marginBottom: 16,
          padding: "12px 14px",
          borderRadius: "var(--radius-md)",
          border: "1px solid rgba(245, 158, 11, 0.2)",
          background: "rgba(245, 158, 11, 0.08)",
          color: "#fbbf24",
          fontSize: "12px",
          lineHeight: 1.5,
        }}
      >
        Treat imported backups as sensitive and trusted-only. Exported files stay encrypted, but they should still be stored carefully.
      </div>
      
      <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
        <label style={{ flex: 1 }}>
          <div className={`${styles.fakeButton} card-premium`} style={{ 
            width: "100%", 
            fontSize: "12px", 
            height: "36px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            gap: 8,
            cursor: "pointer",
            background: "var(--slate-900)",
            color: "var(--text-primary)",
            fontWeight: 500
          }}>
            <Upload size={14} /> Import Backup
          </div>
          <input
            type="file"
            accept=".json"
            style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                const shouldImport = window.confirm(
                  "Import this encrypted backup and merge it into the current vault?",
                );

                if (!shouldImport) {
                  e.target.value = "";
                  return;
                }

                const reader = new FileReader();
                reader.onload = async (ev) => {
                  const content = ev.target?.result;
                  if (typeof content !== "string") {
                    setToast({ message: "Backup import failed", type: "error" });
                    return;
                  }

                  try {
                    await onImportVault(content);
                    setToast({ message: "Encrypted backup imported", type: "success" });
                  } catch (error: any) {
                    setToast({
                      message: error?.message || "Backup import failed",
                      type: "error",
                    });
                  } finally {
                    e.target.value = "";
                  }
                };
                reader.readAsText(file);
              }
            }}
          />
        </label>
        <Button 
          variant="secondary" 
          style={{ flex: 1, fontSize: "12px", height: "36px", gap: 8 }}
          onClick={async () => {
            const shouldExport = window.confirm(
              "Export an encrypted backup file for recovery or migration?",
            );

            if (!shouldExport) return;

            try {
              const json = await onExportVault();
              const blob = new Blob([json], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `encrypted-backup-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
              setToast({ message: "Encrypted backup exported", type: "success" });
            } catch (error: any) {
              setToast({
                message: error?.message || "Backup export failed",
                type: "error",
              });
            }
          }}
        >
          <Download size={14} /> Export Backup
        </Button>
      </div>
    </div>
  );
};
