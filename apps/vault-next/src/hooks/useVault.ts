import { useState, useCallback } from "react";
import { 
  unlockVault, 
  getVault, 
  lockVault as lockVaultLogic, 
  isUnlocked as isUnlockedLogic,
  syncVaultWithCloud,
  createNewVault,
  addVaultEntry,
  deleteVaultEntry,
  updateVaultEntry,
  createFolder,
  deleteFolder,
  moveEntryToFolder,
  unlockVaultWithRecoveryKey,
  exportRecoveryData,
  resetLocalVault,
  exportEncryptedVault,
  importEncryptedVault,
} from "@pwmnger/app-logic";
import type { Vault } from "@pwmnger/vault";

export function useVault() {
  const [vault, setVault] = useState<Vault | null>(() => {
    if (isUnlockedLogic()) {
      return getVault();
    }
    return null;
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState("");

  const updateVaultState = useCallback(() => {
    if (isUnlockedLogic()) {
      const v = getVault();
      setVault({ ...v, entries: [...v.entries], folders: [...(v.folders || [])] });
    } else {
      setVault(null);
    }
  }, []);

  const unlock = async (password: string) => {
    setIsUnlocking(true);
    setError("");
    try {
      await unlockVault(password);
      updateVaultState();
    } catch (err: any) {
      setError(err.message || "Unlock failed");
      throw err;
    } finally {
      setIsUnlocking(false);
    }
  };

  const unlockWithRecovery = async (recoveryKeyHex: string, wrappedVaultKey: any) => {
    setIsUnlocking(true);
    setError("");
    try {
      await unlockVaultWithRecoveryKey(recoveryKeyHex, wrappedVaultKey);
      updateVaultState();
    } catch (err: any) {
      setError(err.message || "Recovery failed");
      throw err;
    } finally {
      setIsUnlocking(false);
    }
  };

  const lock = () => {
    lockVaultLogic();
    setVault(null);
  };

  const sync = async () => {
    setIsSyncing(true);
    setError("");
    try {
      await syncVaultWithCloud();
      updateVaultState();
    } catch (err: any) {
      setError(err.message || "Sync failed");
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const create = async (password: string, salt: Uint8Array) => {
    await createNewVault(password, salt);
    updateVaultState();
  };

  const reset = async () => {
    await resetLocalVault();
    updateVaultState();
  };

  const addEntry = async (site: string, username: string, password: string, folderId?: string | null) => {
    await addVaultEntry({ site, username, password, folderId: folderId || undefined });
    updateVaultState();
  };

  const deleteEntry = async (id: string) => {
    await deleteVaultEntry(id);
    updateVaultState();
  };

  const updateEntry = async (id: string, data: any) => {
    await updateVaultEntry(id, data);
    updateVaultState();
  };

  const importData = async (json: string) => {
    const payload = JSON.parse(json);
    await importEncryptedVault(payload);
    updateVaultState();
  };

  const exportBackup = async () => {
    const payload = await exportEncryptedVault();
    return JSON.stringify(payload, null, 2);
  };

  const createFolderAction = async (name: string) => {
    await createFolder(name);
    updateVaultState();
  };

  const deleteFolderAction = async (id: string) => {
    await deleteFolder(id);
    updateVaultState();
  };

  const moveEntry = async (entryId: string, folderId: string | null) => {
    await moveEntryToFolder(entryId, folderId);
    updateVaultState();
  };

  const downloadRecoveryKit = async () => {
    const kit = await exportRecoveryData();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(kit, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "pwmnger_recovery_kit.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return {
    vault,
    isSyncing,
    isUnlocking,
    error,
    unlock,
    unlockWithRecovery,
    lock,
    sync,
    create,
    addEntry,
    deleteEntry,
    updateEntry,
    importData,
    exportBackup,
    createFolder: createFolderAction,
    deleteFolder: deleteFolderAction,
    moveEntry,
    downloadRecoveryKit,
    setError,
    reset
  };
}
