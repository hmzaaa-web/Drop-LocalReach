export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function getDaysRemaining(expiresAtString: string): string {
  try {
    const expiresAt = new Date(expiresAtString).getTime();
    const now = Date.now();
    const diffMs = expiresAt - now;
    if (diffMs <= 0) return 'Expired';
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return '1 day';
    return `${diffDays} days`;
  } catch {
    return '10 days';
  }
}
