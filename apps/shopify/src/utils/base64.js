export const convertBase64ToString = (str) => {
  try {
    const decodedId = window.atob(str);
    return decodedId;
  } catch (error) {
    return null;
  }
};

export const convertStringToBase64 = (str) => {
  try {
    const undecodedId = window.btoa(str);
    return undecodedId;
  } catch (error) {
    return null;
  }
};

export const checkAndConvertToBase64 = (res) => {
  return { ...res, id: convertStringToBase64(res.id) };
};

export const isBase64 = (str) => {
  if (str === '' || str.trim() === '') {
    return false;
  }
  try {
    return window.btoa(window.atob(str)) === str;
  } catch (err) {
    return false;
  }
};
