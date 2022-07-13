const drive = require("./drive");
const fs = require("fs");

module.exports.uploadFileToDrive = async function (
  file,
  { name, mimeType, parents }
) {
  try {
    const response = await drive.files.create({
      requestBody: {
        name: name || file.name,
        mimeType: mimeType || file.mimetype,
        parents: [parents],
      },
      media: {
        mimeType: mimeType || file.mimetype,
        body: fs.createReadStream(file.tempFilePath),
      },
    });

    return response;
  } catch (error) {
    console.log(`Error uploading file to drive: ${error.message}`);
  }
};

module.exports.generateLinkFileByID = async function (fileId) {
  try {
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    const results = await drive.files.get({
      fileId,
      fields: "webContentLink",
    });

    return results.data.webContentLink;
  } catch (error) {
    console.log(`Error get link image: ${error.message}`);
  }
};

module.exports.updateFileInDrive = async function (
  fileId,
  file,
  { name, mimeType, parents }
) {
  try {
    const response = await drive.files.update({
      fileId,
      requestBody: {
        name: name || file.name,
        mimeType: mimeType || file.mimetype,
        parents: [parents],
      },
      media: {
        mimeType: mimeType || file.mimetype,
        body: fs.createReadStream(file.tempFilePath),
      },
    });

    return response;
  } catch (error) {
    console.log(`Error uploading file to drive: ${error.message}`);
  }
};

module.exports.deleteFileInDrive = async function (fileId) {
  try {
    await drive.files.delete({
      fileId,
    });
  } catch (error) {
    console.log(`Error deleting file drive: ${error.message}`);
  }
};
