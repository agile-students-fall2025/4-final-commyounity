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
