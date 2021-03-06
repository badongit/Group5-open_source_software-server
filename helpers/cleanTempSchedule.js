const CronJob = require("cron").CronJob;
const path = require("path");
const fs = require("fs");

const tmpDir = path.join(__dirname, "../public/tmp/");

const cleanTempSchedule = new CronJob(
  "0 0 1 * * *",
  function () {
    console.log("running job: clean up tmp files");
    fs.readdir(tmpDir, { withFileTypes: true }, (err, files) => {
      if (err) {
        console.warn("unable to read temp files directory");
        console.log(err);
        return;
      }
      if (Array.isArray(files)) {
        const time = new Date().getTime(); //get ms since epoch
        //because of withFileTypes option, files are fs.Dirent objects instead of just string filenames.
        files.forEach((file) => {
          //make sure its a file before proceeding
          if (file.isFile() && file.name !== ".gitkeep") {
            fs.stat(tmpDir + file.name, (err, stats) => {
              if (err) {
                console.warn("unable to fs.stat() file %s", file.name);
                console.log(err);
                return;
              }
              //if the time the file created is greater than or equal to 1 hour, delete it
              if (time - stats.birthtimeMs >= 3.6e6) {
                console.log("removing temp file %s", file.name);
                fs.unlink(tmpDir + file.name, (err) => {
                  if (err) {
                    console.warn("unable to remove temp file %s", file.name);
                  } else {
                    console.log("temp file %s removed", file.name);
                  }
                });
              } else {
                console.log(
                  "the temp file %s will not be removed due to not being old enough.",
                  file.name
                );
              }
            });
          }
        });
      }
    });
  },
  null,
  true,
  "Asia/Ho_Chi_Minh"
);

module.exports = cleanTempSchedule;
