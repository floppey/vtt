export function getQueryParameter(paramName: string): string | null {
  if (!window?.location?.search) {
    return null;
  }
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(paramName);
}
