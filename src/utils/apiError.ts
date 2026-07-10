import axios from 'axios';

/**
 * Extracts a clean, user-friendly message from an API / network error.
 *
 * This keeps raw axios strings (e.g. "Request failed with status code 401")
 * and unexpected runtime errors from ever reaching the user. Screens can pass
 * a `fallback` tailored to the action being performed.
 *
 * Precedence: network/timeout message > backend-provided message >
 * caller-supplied `statusMessages` override > generic status message > `fallback`.
 * A backend message is preferred over the override so real validation details
 * (e.g. "New password must contain a number") are never swallowed.
 */
export const getApiErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
  statusMessages?: Partial<Record<number, string>>
): string => {
  if (axios.isAxiosError(error)) {
    // No response means the request never reached the server
    // (offline, wrong host, DNS failure, or a timeout).
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return 'The request timed out. Please check your connection and try again.';
      }
      return 'Could not connect to the server. Please check your connection and try again.';
    }

    // Prefer a message the backend explicitly returned.
    const data: any = error.response.data;
    const serverMessage =
      (typeof data === 'string' && data.trim()) ||
      (typeof data?.message === 'string' && data.message) ||
      (typeof data?.error === 'string' && data.error) ||
      (Array.isArray(data?.errors) ? data.errors[0]?.message : undefined);

    if (typeof serverMessage === 'string' && serverMessage.trim()) {
      return serverMessage.trim();
    }

    // Allow the caller to tailor messages for specific statuses in its context
    // (e.g. a 401 on change-password means "wrong current password", not "session expired").
    const overridden = statusMessages?.[error.response.status];
    if (overridden) {
      return overridden;
    }

    // Otherwise fall back to a friendly, status-aware message.
    switch (error.response.status) {
      case 400:
        return 'Some of the information looks invalid. Please review it and try again.';
      case 401:
        return 'Your session is invalid or has expired. Please sign in again.';
      case 403:
        return "You don't have permission to do that.";
      case 404:
        return 'We could not find what you were looking for.';
      case 409:
        return 'That request conflicts with the current state. Please refresh and try again.';
      case 422:
        return 'Some of the information looks invalid. Please review it and try again.';
      case 429:
        return 'Too many attempts. Please wait a moment and try again.';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'The server ran into a problem. Please try again in a little while.';
      default:
        return fallback;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};
