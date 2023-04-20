const fs = require('fs');
const { readdirSync, readFileSync, writeFileSync, mkdirSync } = fs;

const buildActions = () => {
  try {
    console.log('Building app actions');
    mkdirSync('build/actions', { recursive: true });

    const actionsFiles = readdirSync('actions', {
      encoding: 'utf-8',
    });

    actionsFiles.forEach((fileName) => {
      const action = readFileSync(`actions/${fileName}`, {
        encoding: 'utf-8',
      }).toString();

      writeFileSync(`build/actions/${fileName}`, action);
      console.log('App actions successfully built');
    });
  } catch (e) {
    console.log('Failed to build app actions.');
    console.log(e);
    process.exit(1);
  }
};

buildActions();
