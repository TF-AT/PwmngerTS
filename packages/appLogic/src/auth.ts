import {
  deriveKeysFromPassword,
  hashAuthKeyForServer,
  wipe,
  stringToUint8Array,
} from "@pwmnger/crypto";
import {
  saveAuthToken,
  loadAuthToken,
  clearAuthToken,
  loadVault,
} from "@pwmnger/storage";
import { guardJsonBody } from "./networkGuard";

const getBaseUrl = () => (globalThis as any).PW_API_URL || "http://localhost:4000";

export async function fetchKdfSalt(email: string): Promise<Uint8Array> {
  const res = await fetch(
    `${getBaseUrl()}/auth/kdf-salt?email=${encodeURIComponent(email)}`,
    { credentials: "include" },
  );
  if (!res.ok) {
    throw new Error("Could not load KDF salt for this account.");
  }
  const data = (await res.json()) as { kdfSalt: number[] };
  return new Uint8Array(data.kdfSalt);
}

async function authenticatedFetch(url: string, options: RequestInit = {}, isRetry = false) {
  let token = await loadAuthToken();
  const headers = new Headers(options.headers || {});

  headers.set("Content-Type", "application/json");
  
  const isExtension = typeof globalThis !== "undefined" &&
    (globalThis.location?.protocol === "chrome-extension:" || globalThis.location?.protocol === "moz-extension:");

  if (isExtension) {
    headers.set("X-Client-Type", "extension");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  if (options.body !== undefined && options.body !== null) {
    if (typeof options.body === "string") {
      try {
        guardJsonBody(JSON.parse(options.body), "authenticatedFetch.body");
      } catch {
        /* non-JSON body */
      }
    }
  }

  let res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && !isRetry && !url.includes("/auth/refresh") && !url.includes("/auth/login")) {
    try {
      console.log("Access token expired, attempting silent refresh...");
      await refreshAccount();

      token = await loadAuthToken();
      if (token) {
        if (isExtension) {
          headers.set("Authorization", `Bearer ${token}`);
        }
        res = await fetch(url, {
          ...options,
          headers,
          credentials: "include",
        });
      }
    } catch (e) {
      console.error("Silent refresh failed", e);
    }
  }

  return res;
}

export async function registerAccount(
  email: string,
  masterPassword: string,
  kdfSalt: Uint8Array,
) {
  const passwordBuffer = stringToUint8Array(masterPassword);
  try {
    const { authKey } = await deriveKeysFromPassword(passwordBuffer, kdfSalt);
    const authHash = await hashAuthKeyForServer(authKey);

    const body = {
      email,
      authHash,
      kdfSalt: Array.from(kdfSalt),
    };
    guardJsonBody(body, "registerAccount");

    const isExtension = typeof globalThis !== "undefined" &&
      (globalThis.location?.protocol === "chrome-extension:" || globalThis.location?.protocol === "moz-extension:");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (isExtension) {
      headers["X-Client-Type"] = "extension";
    }

    const res = await fetch(`${getBaseUrl()}/auth/register`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Registration failed");
    }

    const data = await res.json();
    if (data.accessToken) {
      await saveAuthToken(data.accessToken);
    }
  } finally {
    wipe(passwordBuffer);
  }

  return true;
}

export async function loginAccount(
  email: string,
  masterPassword: string,
  twoFactorToken?: string,
  kdfSalt?: Uint8Array,
) {
  const passwordBuffer = stringToUint8Array(masterPassword);
  try {
    let salt = kdfSalt;
    if (!salt) {
      const stored = await loadVault();
      if (stored) salt = new Uint8Array(stored.salt);
    }
    if (!salt) {
      salt = await fetchKdfSalt(email);
    }

    const { authKey } = await deriveKeysFromPassword(passwordBuffer, salt);
    const authHash = await hashAuthKeyForServer(authKey);

    const body = { email, authHash, twoFactorToken };
    guardJsonBody(body, "loginAccount");

    const isExtension = typeof globalThis !== "undefined" &&
      (globalThis.location?.protocol === "chrome-extension:" || globalThis.location?.protocol === "moz-extension:");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (isExtension) {
      headers["X-Client-Type"] = "extension";
    }

    const res = await fetch(`${getBaseUrl()}/auth/login`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json();
      if (err.requires2FA) {
        const error: Error & { requires2FA?: boolean } = new Error("2FA Required");
        error.requires2FA = true;
        throw error;
      }
      throw new Error(err.error || "Login failed");
    }
    const data = await res.json();
    if (data.accessToken) {
      await saveAuthToken(data.accessToken);
    }
    return true;
  } finally {
    wipe(passwordBuffer);
  }
}

export async function refreshAccount() {
  const res = await authenticatedFetch(`${getBaseUrl()}/auth/refresh`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Session expired");

  const data = await res.json();
  if (data.accessToken) {
    await saveAuthToken(data.accessToken);
  }
  return true;
}

export async function setup2FA() {
  const res = await authenticatedFetch(`${getBaseUrl()}/auth/2fa/setup`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to setup 2FA");
  return res.json();
}

export async function verify2FASetup(
  twoFactorToken: string,
  secret: string,
) {
  const body = { token: twoFactorToken, secret };
  guardJsonBody(body, "verify2FASetup");
  const res = await authenticatedFetch(`${getBaseUrl()}/auth/2fa/verify`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Invalid Token");
  return res.json();
}

export async function getAccountStatus() {
  const res = await authenticatedFetch(`${getBaseUrl()}/auth/me`);
  if (!res.ok) throw new Error("Failed to fetch account status");
  return res.json() as Promise<{
    email: string;
    is2FAEnabled: boolean;
    kdfSalt: number[] | null;
  }>;
}

export async function logoutAccount() {
  try {
    await authenticatedFetch(`${getBaseUrl()}/auth/logout`, {
      method: "POST",
    });
  } finally {
    await clearAuthToken();
  }
}

export async function changeMasterPassword(oldPass: string, newPass: string, newSalt?: Uint8Array) {
  const oldBuf = stringToUint8Array(oldPass);
  const newBuf = stringToUint8Array(newPass);

  try {
    const status = await getAccountStatus();
    if (!status.kdfSalt) {
      throw new Error("Account is missing KDF salt; cannot change password.");
    }
    const currentSalt = new Uint8Array(status.kdfSalt);
    const saltForNewHash = newSalt || currentSalt;

    const oldAuthHash = await hashAuthKeyForServer(
      (await deriveKeysFromPassword(oldBuf, currentSalt)).authKey,
    );
    const newAuthHash = await hashAuthKeyForServer(
      (await deriveKeysFromPassword(newBuf, saltForNewHash)).authKey,
    );

    const body = { 
      oldAuthHash, 
      newAuthHash,
      newKdfSalt: newSalt ? Array.from(newSalt) : undefined
    };
    guardJsonBody(body, "changeMasterPassword");

    const res = await authenticatedFetch(`${getBaseUrl()}/auth/change-password`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to change master password");
    }
  } finally {
    wipe(oldBuf);
    wipe(newBuf);
  }
}
