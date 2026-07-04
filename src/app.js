const { importFiles } = require('./importer');

async function main() {
  try {
    await importFiles();
  } catch (error) {
    console.error(error);
  }
}

main();
