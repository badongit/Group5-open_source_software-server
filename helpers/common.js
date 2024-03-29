module.exports.toArrayUnique = (array) => {
  const newSet = new Set(array);

  return [...newSet];
};

module.exports.mapById = (array) => {
  const map = {};
  array.forEach((item) => {
    map[item._id.toString()] = item;
  });

  return map;
};

module.exports.isDenyType = (mimetype) => {
  return mimetype.startsWith("application/x-");
};

module.exports.getExtensionFile = (filename) => {
  return "." + filename.split(".").pop();
};

module.exports.getTypeFile = (mimetype) => {
  if (mimetype.startsWith("image")) return "image";
  if (mimetype.startsWith("video")) return "video";
  if (mimetype.startsWith("audio")) return "audio";
  return "normal";
};
