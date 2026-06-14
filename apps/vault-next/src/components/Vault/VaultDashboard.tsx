import React, { useState, useMemo, useCallback, memo } from "react";
import { Button, Input, Toast } from "@pwmnger/ui";
import { Sparkles, ChevronDown } from "lucide-react";
import { AddEntryForm } from "./AddEntryForm";
import { EntryList } from "./EntryList";
import { Sidebar } from "./Sidebar";
import { DashboardHeader } from "./DashboardHeader";
import { SecurityActionPanel } from "./SecurityActionPanel";
import { AdminActionPanel } from "./AdminActionPanel";
import { copyWithAutoClear } from "../../utils/clipboard";
import type { Vault } from "@pwmnger/vault";
import styles from "../../styles/Dashboard.module.css";

interface VaultDashboardProps {
  vault: Vault;
  userEmail: string;
  onSync: () => void;
  onLock: () => void;
  onAddEntry: (
    site: string,
    username: string,
    password: string,
    folderId?: string | null,
  ) => void;
  onDeleteEntry: (id: string) => void;
  onCreateFolder: (name: string) => void;
  onDeleteFolder: (id: string) => void;
  onMoveEntry: (entryId: string, folderId: string | null) => void;
  onEditEntry: (entryId: string, site: string, username: string, password: string) => void;
  onImportVault: (jsonString: string) => Promise<void>;
  onExportVault: () => Promise<string>;
  onDownloadRecoveryKit: () => void;
  onRefreshAccountStatus: () => void;
  isSyncing: boolean;
  is2FAEnabled: boolean;
}

export const VaultDashboard = memo(({
  vault,
  userEmail,
  onSync,
  onLock,
  onAddEntry,
  onDeleteEntry,
  onCreateFolder,
  onDeleteFolder,
  onMoveEntry,
  onEditEntry,
  onImportVault,
  onExportVault,
  onDownloadRecoveryKit,
  onRefreshAccountStatus,
  isSyncing,
  is2FAEnabled,
}: VaultDashboardProps) => {
  const [search, setSearch] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [confirmingDeleteFolderId, setConfirmingDeleteFolderId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedFolderId]);
  
  const [newFolderName, setNewFolderName] = useState("");
  const [isAddFormExpanded, setIsAddFormExpanded] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const itemsPerPage = 10;

  const folders = vault.folders || [];

  const handleCopy = useCallback((text: string, label: string) => {
    copyWithAutoClear(text);
    setToast({
      message: `${label} copied to clipboard and will be cleared in 30s`,
      type: "success",
    });
  }, []);

  const handleCreateFolderLocal = useCallback(() => {
    if (!newFolderName.trim()) return;
    onCreateFolder(newFolderName);
    setNewFolderName("");
  }, [newFolderName, onCreateFolder]);

  const handleDeleteFolderLocal = useCallback((id: string, force = false) => {
    if (!force) {
      setConfirmingDeleteFolderId(id);
      return;
    }
    onDeleteFolder(id);
    if (selectedFolderId === id) setSelectedFolderId(null);
    setConfirmingDeleteFolderId(null);
  }, [onDeleteFolder, selectedFolderId]);

  const filteredEntries = useMemo(() => {
    let items = vault.entries.filter(
      (e) =>
        e.site.toLowerCase().includes(search.toLowerCase()) ||
        e.username.toLowerCase().includes(search.toLowerCase()),
    );

    if (selectedFolderId) {
      items = items.filter((e) => e.folderId === selectedFolderId);
    }

    return items;
  }, [vault.entries, search, selectedFolderId]);

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEntries.slice(start, start + itemsPerPage);
  }, [filteredEntries, currentPage]);

  if (!vault || !vault.entries) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "var(--bg-deep)", color: "var(--text-dim)" }}>
        <p>Vault data unavailable. Please try unlocking again.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Sidebar 
        userEmail={userEmail}
        folders={folders}
        selectedFolderId={selectedFolderId}
        setSelectedFolderId={setSelectedFolderId}
        newFolderName={newFolderName}
        setNewFolderName={setNewFolderName}
        handleCreateFolder={handleCreateFolderLocal}
        handleDeleteFolder={handleDeleteFolderLocal}
        confirmingDeleteFolderId={confirmingDeleteFolderId}
        setConfirmingDeleteFolderId={setConfirmingDeleteFolderId}
        onDownloadRecoveryKit={onDownloadRecoveryKit}
        onSync={onSync}
        onLock={onLock}
        isSyncing={isSyncing}
        totalItems={filteredEntries.length}
      />

      <main className={styles.mainContent}>
        <div
          style={{
            marginBottom: 20,
            padding: "14px 18px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid rgba(245, 158, 11, 0.18)",
            background: "rgba(245, 158, 11, 0.08)",
          }}
        >
          <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#fbbf24" }}>
            Experimental security build
          </p>
          <p style={{ margin: "6px 0 0", fontSize: "12px", color: "var(--text-dim)", lineHeight: 1.6 }}>
            This vault UI is still being hardened. Use encrypted backups, enable 2FA, and avoid treating the product as production-ready until the critical backlog is complete.
          </p>
        </div>

        {!userEmail && (
          <div style={{ 
            background: "rgba(239, 68, 68, 0.1)", 
            border: "1px solid rgba(239, 68, 68, 0.2)", 
            padding: "12px 20px", 
            borderRadius: "var(--radius-lg)", 
            marginBottom: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#ef4444" }}>Vault Decrypted via Recovery Kit</p>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "rgba(239, 68, 68, 0.8)" }}>You are in offline mode. Sync is disabled until you log in.</p>
            </div>
            <Button variant="secondary" onClick={onLock} style={{ height: "32px", fontSize: "12px" }}>Sign In to Sync</Button>
          </div>
        )}
        <DashboardHeader search={search} setSearch={setSearch} />

        <section className={styles.cardArea}>
          <div className={`${styles.cardActionContainer} ${isAddFormExpanded ? styles.expanded : ""}`}>
            <div 
              className={styles.addEntryToggle}
              onClick={() => setIsAddFormExpanded(!isAddFormExpanded)}
              style={{ background: "rgba(62, 207, 142, 0.05)", padding: "12px 16px", borderRadius: "var(--radius-md)", border: "1px solid rgba(62, 207, 142, 0.1)" }}
            >
              <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--accent-green)", display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={14} /> Add New Entry
              </h3>
              <ChevronDown size={14} className={styles.expandIcon} />
            </div>
            {isAddFormExpanded && (
              <div style={{ marginTop: 12, borderTop: "1px solid var(--border-subtle)", paddingTop: 16 }}>
                <AddEntryForm onAdd={(s, u, p, f) => {
                  onAddEntry(s, u, p, f);
                  setIsAddFormExpanded(false);
                }} folderId={selectedFolderId} />
              </div>
            )}
          </div>

          <div className={styles.scrollArea}>
            <EntryList
              entries={paginatedEntries}
              folders={folders}
              onCopy={handleCopy}
              onDelete={onDeleteEntry}
              onMove={onMoveEntry}
              onEdit={onEditEntry}
              searchQuery=""
            />
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, padding: "16px 0", borderTop: "1px solid var(--border-subtle)", flexShrink: 0 }}>
              <Button
                variant="secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                style={{ height: "32px", fontSize: "12px" }}
              >Previous</Button>
              <span style={{ fontSize: "12px", color: "var(--text-dim)", fontWeight: 500 }}>
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                style={{ height: "32px", fontSize: "12px" }}
              >Next</Button>
            </div>
          )}
        </section>

        <section className={styles.actionArea}>
          <SecurityActionPanel 
             is2FAEnabled={is2FAEnabled}
             show2FASetup={show2FASetup}
             setShow2FASetup={setShow2FASetup}
             onRefreshAccountStatus={onRefreshAccountStatus}
             setToast={setToast}
          />
          <AdminActionPanel
            onImportVault={onImportVault}
            onExportVault={onExportVault}
            setToast={setToast}
          />
        </section>
      </main>
    </div>
  );
});
