const manifest = require('../../contentful-app-manifest.json');

const validateActions = () => {
  const requiredProperties = ['id', 'path'];
  const uniqueValues = new Set();

  manifest.actions.forEach((action) => {
    requiredProperties.forEach((property) => {
      if (!action.hasOwnProperty(property)) {
        throw new Error(`Action with name: '${action.name}' is missing the '${property}' property`);
      }
    });

    const { id, path } = action;

    if (uniqueValues.has(id)) {
      throw new Error(`Duplicate action id: '${id}'`);
    }
    if (uniqueValues.has(path)) {
      throw new Error(`Duplicate action path: '${path}'`);
    }

    uniqueValues.add(path);
    uniqueValues.add(id);
  });
};

const main = async () => {
  console.log('Building app actions');
  validateActions();
};

main().then(() => console.log('Actions validated'));
