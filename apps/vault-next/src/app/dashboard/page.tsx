"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { VaultDashboard } from "@/components/Vault/VaultDashboard";
import { RegisterVault } from "@/components/Vault/RegisterVault";
import { useVaultContext } from "@/context/VaultContext";
import { Toast } from "@pwmnger/ui";

export default function DashboardPage() {
  const router = useRouter();
  const { auth, vault, actions, toast, setToast } = useVaultContext();
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const { session, is2FAEnabled, update2FAStatus } = auth;
  const { 
    vault: vaultData, 
    isSyncing, 
    sync, 
    addEntry, 
    deleteEntry, 
    updateEntry, 
    importData, 
    exportBackup,
    createFolder, 
    deleteFolder, 
    moveEntry, 
    downloadRecoveryKit, 
    lock 
  } = vault;

  useEffect(() => {
    async function checkVaultStatus() {
      if (!session && !vaultData) {
        router.push("/login");
        return;
      }

      if (session && !vaultData) {
        try {
          await sync();
          setIsInitializing(false);
        } catch (err: any) {
          if (err.message === "Vault not found" || !vaultData) {
            setShowSetupWizard(true);
          } else {
            router.push("/unlock");
          }
          setIsInitializing(false);
        }
      } else {
        setIsInitializing(false);
      }
    }

    checkVaultStatus();
  }, [session, vaultData, router]);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-green"></div>
      </div>
    );
  }

  if (showSetupWizard) {
    return (
      <div className="auth-container">
        <div className="mesh-glow" />
        <div className="setup-wizard-overlay animate-fade-in">
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h2 className="text-3xl font-bold">Welcome, {session?.email}!</h2>
            <p className="text-dim">You don't have a secure vault yet. Let's create one now.</p>
          </div>
          <RegisterVault 
            onRegister={async (email, password) => {
              try {
                await actions.handleRegister(email, password);
                setShowSetupWizard(false);
              } catch (err: any) {
                setToast({ message: err.message || "Setup failed", type: "error" });
              }
            }}
            onGoToLogin={() => router.push("/login")}
            initialEmail={session?.email}
            isWizard={true}
          />
        </div>
      </div>
    );
  }

  if (!vaultData) return null;

  return (
    <div className="dashboard-wrapper">
      <div className="mesh-glow" />
      
      <VaultDashboard
        vault={vaultData}
        userEmail={session?.email || ""}
        onSync={async () => {
          try {
            await sync();
            setToast({ message: "Sync successful!", type: "success" });
          } catch (err: any) {
            setToast({ message: err.message || "Sync failed", type: "error" });
          }
        }}
        onLock={() => { lock(); router.push("/unlock"); }}
        onAddEntry={addEntry}
        onDeleteEntry={deleteEntry}
        onCreateFolder={createFolder}
        onDeleteFolder={deleteFolder}
        onMoveEntry={moveEntry}
        onEditEntry={updateEntry}
        onImportVault={importData}
        onExportVault={exportBackup}
        onDownloadRecoveryKit={downloadRecoveryKit}
        onRefreshAccountStatus={update2FAStatus}
        isSyncing={isSyncing}
        is2FAEnabled={is2FAEnabled}
      />
    </div>
  );
}
