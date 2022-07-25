const drive = require("./drive");
const fs = require("fs");
const { Readable } = require("stream");

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
    console.log(`Error when uploading file to drive: ${error.message}`);
    throw error;
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
    console.log(`Error when get link image: ${error.message}`);
    throw error;
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
    console.log(`Error when updating file to drive: ${error.message}`);
    throw error;
  }
};

module.exports.deleteFileInDrive = async function (fileId) {
  try {
    await drive.files.delete({
      fileId,
    });
  } catch (error) {
    console.log(`Error when deleting file drive: ${error.message}`);
    throw error;
  }
};

module.exports.createFileInDrive = async function (
  fileBuffer,
  { type, name, parents }
) {
  try {
    const response = await drive.files.create({
      requestBody: {
        name: name,
        mimeType: type,
        parents: [parents],
      },
      media: {
        mimeType: type,
        body: Readable.from(fileBuffer),
      },
    });

    return response;
  } catch (error) {
    console.log(`Error when creating file drive: ${error.message}`);
    throw error;
  }
};
