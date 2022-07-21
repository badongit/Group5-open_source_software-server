module.exports.toArrayUnique = (array) => {
  const newSet = new Set(array);

  return [...newSet];
};
