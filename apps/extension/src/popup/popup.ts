import {
  loadVault,
  saveVault,
  saveAuthToken,
  loadAuthToken,
} from "@pwmnger/storage";
import {
  loginAccount,
  registerAccount,
  syncVaultWithCloud,
  lockVault,
  unlockVault,
  getVault,
  addVaultEntry,
  deleteVaultEntry,
  updateVaultEntry,
  isUnlocked,
  createNewVault,
  startAutoLock,
  exportRecoveryData,
  unlockVaultWithRecoveryKey,
} from "@pwmnger/app-logic";
import { passwordStrength } from "../password/strength";
import { checkPasswordBreach } from "../password/breach";
import { generatePassword } from "../password/generator";

// Initialize API URL for app-logic package
(globalThis as any).PW_API_URL = "http://localhost:4000";

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      const log = (message: string, ...args: any[]) => {
        console.log(`[PwmngerTS:Popup] ${message}`, ...args);
      };
      log("Initializing...");
    const unlockBtn = document.getElementById("unlockBtn");
    const masterInput = document.getElementById(
      "masterPassword",
    ) as HTMLInputElement | null;
    const vaultDiv = document.getElementById("vault");
    const lockedDiv = document.getElementById("locked");
    const entriesUl = document.getElementById("entries");
    const searchInput = document.getElementById(
      "searchInput",
    ) as HTMLInputElement | null;

    const registerDiv = document.getElementById("register");
    const regEmailInput = document.getElementById(
      "regEmail",
    ) as HTMLInputElement | null;
    const regPasswordInput = document.getElementById(
      "regPassword",
    ) as HTMLInputElement | null;
    const createVaultBtn = document.getElementById(
      "createVaultBtn",
    ) as HTMLButtonElement | null;
    const showLoginLink = document.getElementById("showLoginLink");

    const loginDiv = document.getElementById("login");
    const loginEmailInput = document.getElementById(
      "loginEmail",
    ) as HTMLInputElement | null;
    const loginPasswordInput = document.getElementById(
      "loginPassword",
    ) as HTMLInputElement | null;
    const loginBtn = document.getElementById(
      "loginBtn",
    ) as HTMLButtonElement | null;
    const showRegisterLink = document.getElementById("showRegisterLink");

    // Strength meter elements
    const strengthBar = document.getElementById("regStrengthBar");
    const strengthText = document.getElementById("regStrengthText");

    // Add Entry elements
    const addEntryForm = document.getElementById("add-entry-form");
    const showAddEntryBtn = document.getElementById("showAddEntryBtn");
    const saveEntryBtn = document.getElementById("saveEntryBtn");
    const cancelAddBtn = document.getElementById("cancelAddBtn");
    const siteInput = document.getElementById(
      "siteInput",
    ) as HTMLInputElement | null;
    const usernameInput = document.getElementById(
      "usernameInput",
    ) as HTMLInputElement | null;
    const passwordInput = document.getElementById(
      "passwordInput",
    ) as HTMLInputElement | null;


    const login2FASection = document.getElementById("login2FASection");
    const login2FATokenInput = document.getElementById(
      "login2FAToken",
    ) as HTMLInputElement | null;
    const syncBtn = document.getElementById("syncBtn");
    const folderSelect = document.getElementById(
      "folderSelect",
    ) as HTMLSelectElement | null;

    const editEntryForm = document.getElementById("edit-entry-form");
    const editEntryIdInput = document.getElementById("editEntryId") as HTMLInputElement | null;
    const editSiteInput = document.getElementById("editSiteInput") as HTMLInputElement | null;
    const editUsernameInput = document.getElementById("editUsernameInput") as HTMLInputElement | null;
    const editPasswordInput = document.getElementById("editPasswordInput") as HTMLInputElement | null;
    const editFolderSelect = document.getElementById("editFolderSelect") as HTMLSelectElement | null;
    const updateEntryBtn = document.getElementById("updateEntryBtn");
    const deleteEntryBtn = document.getElementById("deleteEntryBtn");
    const cancelEditBtn = document.getElementById("cancelEditBtn");
    const capturePrompt = document.getElementById("capture-prompt");
    const captureSiteSpan = document.getElementById("captureSite");
    const confirmCaptureBtn = document.getElementById("confirmCaptureBtn");
    const ignoreCaptureBtn = document.getElementById("ignoreCaptureBtn");
    const showRecoverLink = document.getElementById("showRecoverLink");
    const recoverView = document.getElementById("recover-view");
    const recoveryFileInput = document.getElementById("recoveryFileInput") as HTMLInputElement | null;
    const closeRecoverBtn = document.getElementById("closeRecoverBtn");
    const settingsBtn = document.getElementById("settingsBtn");
    const settingsView = document.getElementById("settings-view");
    const lockTimeoutSelect = document.getElementById("lockTimeoutSelect") as HTMLSelectElement | null;
    const saveSettingsBtn = document.getElementById("saveSettingsBtn");
    const downloadKitBtn = document.getElementById("downloadKitBtn");
    const closeSettingsBtn = document.getElementById("closeSettingsBtn");

    const addStrengthBar = document.getElementById("addStrengthBar");
    const addStrengthText = document.getElementById("addStrengthText");
    const editStrengthBar = document.getElementById("editStrengthBar");
    const editStrengthText = document.getElementById("editStrengthText");
    const addBreachAlert = document.getElementById("addBreachAlert");
    const editBreachAlert = document.getElementById("editBreachAlert");

    if (
      !unlockBtn ||
      !masterInput ||
      !vaultDiv ||
      !lockedDiv ||
      !entriesUl ||
      !registerDiv ||
      !regPasswordInput ||
      !createVaultBtn ||
      !addEntryForm ||
      !showAddEntryBtn ||
      !saveEntryBtn ||
      !cancelAddBtn ||
      !siteInput ||
      !usernameInput ||
      !passwordInput ||
      !regEmailInput ||
      !loginDiv ||
      !loginEmailInput ||
      !loginPasswordInput ||
      !loginBtn ||
      !syncBtn ||
      !folderSelect ||
      !editEntryForm ||
      !editEntryIdInput ||
      !editSiteInput ||
      !editUsernameInput ||
      !editPasswordInput ||
      !editFolderSelect ||
      !updateEntryBtn ||
      !deleteEntryBtn ||
      !cancelEditBtn ||
      !capturePrompt ||
      !captureSiteSpan ||
      !confirmCaptureBtn ||
      !ignoreCaptureBtn ||
      !settingsBtn ||
      !settingsView ||
      !lockTimeoutSelect ||
      !saveSettingsBtn ||
      !downloadKitBtn ||
      !closeSettingsBtn ||
      !showRecoverLink ||
      !recoverView ||
      !recoveryFileInput ||
      !closeRecoverBtn
    ) {
      console.error("Required DOM elements not found");
      return;
    }

    // Capture logic
    chrome.runtime.sendMessage({ action: "get-pending-entry" }, (pending: any) => {
      if (pending && isUnlocked()) {
        captureSiteSpan.innerText = pending.site;
        capturePrompt.hidden = false;

        confirmCaptureBtn.onclick = async () => {
          try {
            await addVaultEntry({
              site: pending.site,
              username: pending.username,
              password: pending.password,
            } as any);
            const token = await loadAuthToken();
            await syncVaultWithCloud();
            updateView();
            capturePrompt.hidden = true;
          } catch (e) {
            alert("Failed to save captured password");
          }
        };

        ignoreCaptureBtn.onclick = () => {
          capturePrompt.hidden = true;
        };
      }
    });

    // Settings logic
    settingsBtn.onclick = async () => {
      vaultDiv.hidden = true;
      settingsView.hidden = false;
      const { autoLockTimeout } = await chrome.storage.local.get("autoLockTimeout");
      if (autoLockTimeout) lockTimeoutSelect.value = autoLockTimeout.toString();
    };

    closeSettingsBtn.onclick = () => {
      settingsView.hidden = true;
      vaultDiv.hidden = false;
    };

    saveSettingsBtn.onclick = async () => {
      const timeoutMinutes = parseInt(lockTimeoutSelect.value);
      await chrome.storage.local.set({ autoLockTimeout: timeoutMinutes });
      
      if (timeoutMinutes > 0) {
        chrome.runtime.sendMessage({ 
          action: "start-auto-lock", 
          timeoutMs: timeoutMinutes * 60 * 1000 
        }).catch(() => {});
      } else {
        chrome.runtime.sendMessage({ action: "stop-auto-lock" }).catch(() => {});
      }
      
      settingsView.hidden = true;
      vaultDiv.hidden = false;
      alert("Settings saved");
    };

    downloadKitBtn.onclick = async () => {
      try {
        const kit = await exportRecoveryData();
        const blob = new Blob([JSON.stringify(kit, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "pwmnger_recovery_kit.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert("Recovery kit downloaded! Keep it safe.");
      } catch (e: any) {
        alert("Failed to generate kit: " + e.message);
      }
    };

    const initAutoLock = async () => {
      const { autoLockTimeout } = await chrome.storage.local.get("autoLockTimeout");
      if (autoLockTimeout && autoLockTimeout > 0) {
        chrome.runtime.sendMessage({ 
          action: "start-auto-lock", 
          timeoutMs: autoLockTimeout * 60 * 1000 
        }).catch(() => {});
      }
    };

    // Global reset on any click in the popup
    document.addEventListener("click", async () => {
      const { autoLockTimeout } = await chrome.storage.local.get("autoLockTimeout");
      if (autoLockTimeout && autoLockTimeout > 0) {
        chrome.runtime.sendMessage({ 
          action: "reset-auto-lock", 
          timeoutMs: autoLockTimeout * 60 * 1000 
        }).catch(() => {});
      }
    });

    // Listen for background auto-lock
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === "lock-vault") {
        lockVault(); // From appLogic
        vaultDiv.hidden = true;
        addEntryForm.hidden = true;
        editEntryForm.hidden = true;
        settingsView.hidden = true;
        lockedDiv.hidden = false;
        masterInput.value = "";
        masterInput.focus();
        log("Vault auto-locked by background");
      }
    });

    // Password strength colors
    const getStrengthInfo = (password: string) => {
      if (!password) return { width: "0%", color: "#eee", label: "None" };
      const score = passwordStrength(password);

      if (score < 2) return { width: "20%", color: "#ff4d4f", label: "Weak" };
      if (score < 3) return { width: "40%", color: "#faad14", label: "Fair" };
      if (score < 5) return { width: "60%", color: "#52c41a", label: "Good" };
      if (score < 6) return { width: "80%", color: "#1890ff", label: "Strong" };
      return { width: "100%", color: "#1890ff", label: "Very Strong" };
    };

    const updateStrengthUI = async (password: string, bar: HTMLElement | null, text: HTMLElement | null, alertEl?: HTMLElement | null) => {
      const info = getStrengthInfo(password);
      if (bar) {
        bar.style.width = info.width;
        bar.style.backgroundColor = info.color;
      }
      if (text) {
        text.innerText = info.label;
        text.style.color = info.color;
      }

      if (alertEl) {
        if (!password) {
          alertEl.hidden = true;
          return;
        }
        // Basic debounce mechanism could be added here if needed
        const breachCount = await checkPasswordBreach(password);
        if (breachCount > 0) {
          alertEl.hidden = false;
        } else {
          alertEl.hidden = true;
        }
      }
    };

    let regTimeout: NodeJS.Timeout;
    regPasswordInput.addEventListener("input", () => {
      clearTimeout(regTimeout);
      regTimeout = setTimeout(() => {
        updateStrengthUI(regPasswordInput.value, strengthBar, strengthText);
        createVaultBtn.disabled = regPasswordInput.value.length < 8;
      }, 300);
    });

    let addTimeout: NodeJS.Timeout;
    passwordInput.addEventListener("input", () => {
      clearTimeout(addTimeout);
      addTimeout = setTimeout(() => {
        updateStrengthUI(passwordInput.value, addStrengthBar, addStrengthText, addBreachAlert);
      }, 300);
    });

    let editTimeout: NodeJS.Timeout;
    editPasswordInput.addEventListener("input", () => {
      clearTimeout(editTimeout);
      editTimeout = setTimeout(() => {
        updateStrengthUI(editPasswordInput.value, editStrengthBar, editStrengthText, editBreachAlert);
      }, 300);
    });

    const generateBtn = document.getElementById("generate");
    const lengthInput = document.getElementById("length") as HTMLInputElement | null;
    const generatedOutput = document.getElementById("generatedPassword") as HTMLInputElement | null;

    if (generateBtn && lengthInput && generatedOutput) {
      const excludeAmbiguousCheck = document.getElementById("excludeAmbiguous") as HTMLInputElement | null;
      generateBtn.addEventListener("click", () => {
        const length = parseInt(lengthInput.value, 10) || 16;
        const excludeAmbiguous = excludeAmbiguousCheck?.checked || false;
        
        try {
          const password = generatePassword({
            length,
            lowercase: true,
            uppercase: true,
            numbers: true,
            symbols: true,
            excludeAmbiguous
          });
          generatedOutput.value = password;
          navigator.clipboard.writeText(password);
        } catch (e: any) {
          alert("Failed to generate password: " + e.message);
        }
      });
    }

    // Toggle password visibility logic
    const setupToggle = (toggleId: string, inputId: string) => {
      const toggle = document.getElementById(toggleId);
      const input = document.getElementById(inputId) as HTMLInputElement | null;
      if (toggle && input) {
        toggle.onclick = () => {
          const isPassword = input.type === "password";
          input.type = isPassword ? "text" : "password";
          toggle.innerText = isPassword ? "🙈" : "👁️";
        };
      }
    };

    setupToggle("toggleLoginPassword", "loginPassword");
    setupToggle("toggleUnlockPassword", "masterPassword");

    // Initial Vault Check
    try {
      const existingVault = await loadVault();
      if (existingVault) {
        lockedDiv.hidden = false;
        loginDiv.hidden = true;
        masterInput.focus();
      } else {
        loginDiv.hidden = false; // Default to Login for new installs
      }
    } catch (e) {
      console.error("Failed to load vault:", e);
      alert("Error accessing storage. Please try reloading the extension.");
    }

    // Create (Register) logic
    createVaultBtn.addEventListener("click", async () => {
      const email = regEmailInput.value;
      const password = regPasswordInput.value;

      if (!email || !password) return alert("Email and Password required");

      try {
        createVaultBtn.disabled = true;
        createVaultBtn.innerText = "Creating...";

        const salt = crypto.getRandomValues(new Uint8Array(16));
        await registerAccount(email, password, salt);
        await createNewVault(password, salt);

        await loginAccount(email, password, undefined, salt);
        
        // Unlock locally in appLogic before sync
        await unlockVault(password);
        await syncVaultWithCloud();

        updateView();
        registerDiv.hidden = true;
        vaultDiv.hidden = false;
      } catch (e: any) {
        console.error(e);
        alert(e.message || "Failed to create vault");
        createVaultBtn.disabled = false;
        createVaultBtn.innerText = "Create & Unlock";
      }
    });

    // Login logic
    loginBtn?.addEventListener("click", async () => {
      const email = loginEmailInput.value;
      const password = loginPasswordInput.value;
      const token2fa = login2FATokenInput?.value;

      if (!email || !password) return alert("Required");

      try {
        loginBtn.innerText = "Syncing...";
        await loginAccount(email, password, token2fa);

        // If login successful, hide 2FA just in case
        login2FASection?.setAttribute("hidden", "");

        await syncVaultWithCloud();

        // Now unlock locally in appLogic library to synchronize state
        await unlockVault(password);

        updateView();
        loginDiv.hidden = true;
        vaultDiv.hidden = false;
      } catch (e: any) {
        if (e.requires2FA) {
          login2FASection?.removeAttribute("hidden");
          login2FATokenInput?.focus();
          alert("2FA Required. Please enter your code.");
        } else {
          alert(e.message || "Login failed");
        }
      } finally {
        loginBtn.innerText = "Login & Sync";
      }
    });

    syncBtn?.addEventListener("click", async () => {
      try {
        syncBtn.innerText = "⏳";
        syncBtn.style.pointerEvents = "none";
        
        const token = await loadAuthToken();
        if (!token) throw new Error("Please log in again to sync.");

        await syncVaultWithCloud();
        updateView();
        alert("Sync Success!");
      } catch (e: any) {
        alert(e.message || "Sync failed");
      } finally {
        syncBtn.innerText = "🔄";
        syncBtn.style.pointerEvents = "auto";
      }
    });

    const originalUnlockText = unlockBtn.innerText;
    unlockBtn.addEventListener("click", async () => {
      const password = masterInput.value;
      try {
        unlockBtn.innerText = "Unlocking...";
        (unlockBtn as HTMLButtonElement).disabled = true;
        
        await unlockVault(password);
        await initAutoLock();
        updateView();
        lockedDiv.hidden = true;
        vaultDiv.hidden = false;
      } catch (e: any) {
        alert(e.message || "Wrong master password");
      } finally {
        unlockBtn.innerText = originalUnlockText;
        (unlockBtn as HTMLButtonElement).disabled = false;
      }
    });

    showRecoverLink.addEventListener("click", (e) => {
      e.preventDefault();
      lockedDiv.hidden = true;
      recoverView.hidden = false;
    });

    closeRecoverBtn.addEventListener("click", () => {
      recoverView.hidden = true;
      lockedDiv.hidden = false;
    });

    recoveryFileInput.addEventListener("change", (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const kit = JSON.parse(event.target?.result as string);
          if (kit.recoveryKey && kit.encryptedVaultKey) {
            await unlockVaultWithRecoveryKey(kit.recoveryKey, kit.encryptedVaultKey);
            await initAutoLock();
            updateView();
            recoverView.hidden = true;
            vaultDiv.hidden = false;
            alert("Vault recovered and unlocked!");
          } else {
            alert("Invalid recovery kit format");
          }
        } catch (err) {
          alert("Failed to parse recovery kit");
        }
      };
      reader.readAsText(file);
    });

    searchInput?.addEventListener("input", () => {
      updateView();
    });

    showAddEntryBtn.addEventListener("click", async () => {
      vaultDiv.hidden = true;
      addEntryForm.hidden = false;

      // Populate folders
      if (folderSelect) {
        folderSelect.innerHTML = '<option value="">No Folder</option>';
        const folders = getVault().folders || [];
        folders.forEach((f: any) => {
          const opt = document.createElement("option");
          opt.value = f.id;
          opt.innerText = f.name;
          folderSelect.appendChild(opt);
        });
      }

      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab?.url) {
        siteInput.value = new URL(tab.url).hostname;
      }
      updateStrengthUI("", addStrengthBar, addStrengthText);
    });

    cancelAddBtn.addEventListener("click", () => {
      addEntryForm.hidden = true;
      vaultDiv.hidden = false;
    });

    saveEntryBtn.addEventListener("click", async () => {
      if (!siteInput.value || !usernameInput.value || !passwordInput.value) {
        alert("All fields are required");
        return;
      }

      try {
        const folderId = folderSelect?.value || undefined;
        await addVaultEntry({
          site: siteInput.value,
          username: usernameInput.value,
          password: passwordInput.value,
          ...(folderId ? { folderId } : {}),
        } as any);

        // Auto-sync
        const token = await loadAuthToken();
        if (token) {
          try {
            await syncVaultWithCloud();
          } catch (syncErr) {
            console.warn("Auto-sync failed, but entry saved locally", syncErr);
          }
        }

        updateView();
        addEntryForm.hidden = true;
        vaultDiv.hidden = false;

        siteInput.value = "";
        usernameInput.value = "";
        passwordInput.value = "";
      } catch (e: any) {
        console.error(e);
        alert(e.message || "Failed to save entry");
      }
    });

    cancelEditBtn.addEventListener("click", () => {
      editEntryForm.hidden = true;
      vaultDiv.hidden = false;
    });

    updateEntryBtn.addEventListener("click", async () => {
      if (!editEntryIdInput.value || !editSiteInput.value || !editUsernameInput.value || !editPasswordInput.value) {
        alert("All fields are required");
        return;
      }

      try {
        const folderId = editFolderSelect?.value || undefined;
        await updateVaultEntry(editEntryIdInput.value, {
          site: editSiteInput.value,
          username: editUsernameInput.value,
          password: editPasswordInput.value,
          ...(folderId ? { folderId } : {}),
        } as any);

        // Auto-sync
        const token = await loadAuthToken();
        if (token) await syncVaultWithCloud();

        updateView();
        editEntryForm.hidden = true;
        vaultDiv.hidden = false;
      } catch (e: any) {
        console.error(e);
        alert(e.message || "Failed to update entry");
      }
    });

    let isConfirmingDelete = false;
    deleteEntryBtn.addEventListener("click", async () => {
      if (!editEntryIdInput.value) return;
      
      if (!isConfirmingDelete) {
        isConfirmingDelete = true;
        deleteEntryBtn.innerText = "Confirm Delete?";
        deleteEntryBtn.style.background = "#ff4d4f";
        return;
      }

      try {
        deleteEntryBtn.innerText = "Deleting...";
        await deleteVaultEntry(editEntryIdInput.value);

        // Auto-sync
        const token = await loadAuthToken();
        if (token) await syncVaultWithCloud();

        updateView();
        editEntryForm.hidden = true;
        vaultDiv.hidden = false;
        isConfirmingDelete = false;
        deleteEntryBtn.innerText = "Delete Entry";
        deleteEntryBtn.style.background = "#ff4d4f"; // Reset to original if needed or keep red
      } catch (e: any) {
        console.error(e);
        alert(e.message || "Failed to delete entry");
        isConfirmingDelete = false;
        deleteEntryBtn.innerText = "Delete Entry";
      }
    });

    cancelEditBtn.addEventListener("click", () => {
      isConfirmingDelete = false;
      deleteEntryBtn.innerText = "Delete Entry";
      deleteEntryBtn.style.background = ""; // Reset background to default
      editEntryForm.hidden = true;
      vaultDiv.hidden = false;
    });

    function updateView() {
      if (!isUnlocked()) return;
      const vault = getVault();
      const entries = vault.entries;
      const folders = vault.folders || [];
      const query = searchInput?.value.toLowerCase() || "";
      
      const filtered = entries.filter((e) => 
        e.site.toLowerCase().includes(query) || 
        e.username.toLowerCase().includes(query)
      );

      renderEntries(filtered, folders, entriesUl!);
    }

    function renderEntries(entries: any[], folders: any[], container: HTMLElement) {
      container.innerHTML = "";
      for (const entry of entries) {
        const folder = folders.find((f) => f.id === entry.folderId);
        const folderLabel = folder
          ? `<span style="font-size: 10px; color: var(--primary); background: #e6f7ff; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">${folder.name}</span>`
          : "";

        const li = document.createElement("li");
        li.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <div class="site">${entry.site} ${folderLabel}</div>
            <div class="entry-actions">
              <button class="action-btn fill-btn" title="Auto-fill Site">⚡</button>
              <button class="action-btn edit-btn" title="Edit">✏️</button>
              <button class="action-btn copy-btn" title="Copy Password">📋</button>
            </div>
          </div>
          <div class="user">${entry.username}</div>
        `;

        // Fill button logic
        const fillBtn = li.querySelector(".fill-btn");
        fillBtn?.addEventListener("click", async (e) => {
          e.stopPropagation();
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, {
              action: "autofill",
              username: entry.username,
              password: entry.password,
            });
          }
        });

        // Copy button logic
        const copyBtn = li.querySelector(".copy-btn");
        copyBtn?.addEventListener("click", (e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(entry.password);
          const originalText = copyBtn.innerHTML;
          copyBtn.innerHTML = "✅";
          setTimeout(() => (copyBtn.innerHTML = originalText), 2000);
        });

        // Edit button logic (clicking the row or edit icon)
        li.addEventListener("click", () => {
          vaultDiv!.hidden = true;
          editEntryForm!.hidden = false;

          // Populate folders
          if (editFolderSelect) {
            editFolderSelect.innerHTML = '<option value="">No Folder</option>';
            folders.forEach((f) => {
              const opt = document.createElement("option");
              opt.value = f.id;
              opt.innerText = f.name;
              editFolderSelect.appendChild(opt);
            });
            editFolderSelect.value = entry.folderId || "";
          }

          editSiteInput!.value = entry.site;
          editUsernameInput!.value = entry.username;
          editPasswordInput!.value = entry.password;
          updateStrengthUI(entry.password, editStrengthBar, editStrengthText);
        });

        container.appendChild(li);
      }
    }

    // Switch Views
    showRegisterLink?.addEventListener("click", () => {
      loginDiv.hidden = true;
      registerDiv.hidden = false;
    });

    showLoginLink?.addEventListener("click", () => {
      registerDiv.hidden = true;
      loginDiv.hidden = false;
    });

    } catch (criticalError) {
      console.error("CRITICAL: Extension failed to initialize", criticalError);
      document.body.innerHTML = `
        <div class="glass-card" style="padding: 20px; color: #ff4d4f;">
          <h3>Critical Error</h3>
          <p>The extension failed to start correctly. This usually happens if there is a conflict in storage or a missing dependency.</p>
          <button onclick="location.reload()" style="background: var(--primary)">Retry</button>
        </div>
      `;
    }
  });
}
