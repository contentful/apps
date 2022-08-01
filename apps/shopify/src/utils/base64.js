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

export const convertToBase64 = (res) => {
  return {
    ...res,
    id: convertStringToBase64(res.id),
    product: res.product && { ...res.product, id: convertStringToBase64(res.product.id) },
  };
};
