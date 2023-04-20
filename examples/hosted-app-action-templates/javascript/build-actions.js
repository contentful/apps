const fs = require('fs/promises');
const { readdir, readFile, writeFile, mkdir } = fs;

const buildActions = async () => {
  try {
    console.log('Building app actions');
    await mkdir('build/actions', { recursive: true });

    const actionsFiles = await readdir('actions', {
      encoding: 'utf-8',
    });

    const actions = await Promise.all(
      actionsFiles.map((fileName) => {
        return readFile(`actions/${fileName}`, {
          encoding: 'utf-8',
        });
      })
    );

    await Promise.all(
      actionsFiles.map((fileName, index) => {
        return writeFile(`build/actions/${fileName}`, actions[index]);
      })
    );

    console.log('App actions successfully built');
  } catch (e) {
    console.log(e);
  }
};

buildActions();
