const API_HOST = process.env.REACT_APP_API_HOST || 'http://127.0.0.1:8000';

export const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  return `${API_HOST}${url.startsWith('/') ? '' : '/'}${url}`;
};
