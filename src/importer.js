const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { parseRecord } = require('./parser');
const { upsertGame } = require('./db');

const STANDARD_HEADER =
  'Week,Day,Date,Time,Winner/tie,LocationIndicator,Loser/tie,,WinnerPts,LoserPts,YdsW,TOW,YdsL,TOL';

async function importFiles() {
  const csvFolder = path.join(__dirname, '..', 'csv');
  const importedFolder = path.join(csvFolder, 'imported');

  const files = fs.readdirSync(csvFolder).filter((file) => {
    return file.toLowerCase().endsWith('.csv');
  });

  for (const file of files) {
    console.log(`Importing ${file}...`);

    //get season info based on file name
    const baseFile = path.basename(file);
    const season = parseInt(baseFile);

    if (!season) {
      throw new Error('Invalid file name (' + file + ').');
    }

    //pasre file
    const filePath = path.join(csvFolder, file);

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split(/\r?\n/);

    if (lines.length) {
      lines[0] = STANDARD_HEADER;

      fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    }

    const parser = fs.createReadStream(filePath).pipe(
      parse({
        columns: true,
        trim: true,
      }),
    );

    for await (const record of parser) {
      const game = await parseRecord(record, season);

      if (game) {
        await upsertGame(game);

        console.log(game);
      }
    }

    console.log(`${file} complete.`);
    console.log('');

    //move files to archive
    const importedFilePath = path.join(importedFolder, file);

    fs.renameSync(filePath, importedFilePath);
  }
}

module.exports = {
  importFiles,
};
