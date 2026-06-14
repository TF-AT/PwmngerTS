import {
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser';

export { startRegistration, startAuthentication };

import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/types';
import { loadAuthToken } from "@pwmnger/storage";

const BASE_URL = (globalThis as any).PW_API_URL || "http://localhost:4000";

async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const token = await loadAuthToken();
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(url, { ...options, headers, credentials: "include" });
}

export async function getWebAuthnRegistrationOptions() {
  const res = await authenticatedFetch(`${BASE_URL}/auth/2fa/webauthn/register/options`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to get registration options");
  return res.json();
}

export async function verifyWebAuthnRegistration(response: any) {
  const res = await authenticatedFetch(`${BASE_URL}/auth/2fa/webauthn/register/verify`, {
    method: "POST",
    body: JSON.stringify(response),
  });
  if (!res.ok) throw new Error("WebAuthn Verification failed");
  return res.json();
}

export async function getWebAuthnLoginOptions(email: string) {
  const res = await fetch(`${BASE_URL}/auth/2fa/webauthn/login/options`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error("Failed to get login options");
  return res.json();
}

export async function verifyWebAuthnLogin(response: any) {
  const isExtension = typeof globalThis !== "undefined" &&
    (globalThis.location?.protocol === "chrome-extension:" || globalThis.location?.protocol === "moz-extension:");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (isExtension) {
    headers["X-Client-Type"] = "extension";
  }

  const res = await fetch(`${BASE_URL}/auth/2fa/webauthn/login/verify`, {
    method: "POST",
    headers,
    body: JSON.stringify(response),
  });
  if (!res.ok) throw new Error("WebAuthn Login Verification failed");
  return res.json();
}
