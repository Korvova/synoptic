// pathHelpers.js

/**
 * Добавляет префикс /synoptic к пути, если он начинается с /uploads/
 * @param {string} path
 * @returns {string}
 */
export const withPrefix = (path) => {
  if (!path || typeof path !== 'string') return path;
  return path.startsWith('/uploads/') ? `/synoptic${path}` : path;
};
