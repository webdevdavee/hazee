export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " bytes";
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  else if (bytes < 1024 * 1024 * 1024)
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB";
};