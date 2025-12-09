export const AUTH_TOKEN_KEY = "token";

export const getStoredToken = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
};

export const isAuthError = (error) =>
  Boolean(
    error &&
      (error.code === "AUTH_REQUIRED" ||
        error.code === "AUTH_FORBIDDEN" ||
        error.code === "AUTH_INVALID")
  );

export const getAuthErrorMessage = () =>
  "Please sign in again so we can reach the friends service securely.";

const decodeJwtPayload = () => {
  const token = getStoredToken();
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    const json = atob(base64);
    return JSON.parse(json);
  } catch (error) {
    console.warn("Unable to parse JWT.", error);
    return null;
  }
};

export const getAuthProfileFromToken = () => {
  const payload = decodeJwtPayload();
  if (!payload) return null;
  const username =
    typeof payload.username === "string"
      ? payload.username.toLowerCase()
      : typeof payload.user?.username === "string"
      ? payload.user.username.toLowerCase()
      : null;
  const id =
    typeof payload.id === "string"
      ? payload.id
      : typeof payload._id === "string"
      ? payload._id
      : typeof payload.user?.id === "string"
      ? payload.user.id
      : null;
  return { username, id };
};

export const getUsernameFromToken = () => getAuthProfileFromToken()?.username || null;

export const fetchWithAuth = async (url, options = {}) => {
  const token = getStoredToken();
  if (!token) {
    const missingTokenError = new Error("Authentication required");
    missingTokenError.code = "AUTH_REQUIRED";
    throw missingTokenError;
  }

  const headers = new Headers(options.headers || {});
  if (!headers.has("Authorization")) {
    headers.set("Authorization", `JWT ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    const authError = new Error("Authentication failed");
    authError.code = "AUTH_FORBIDDEN";
    authError.response = response;
    throw authError;
  }

  return response;
};
