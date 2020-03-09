'use strict';

const fetchForms = async (method, _path, { fetch }) => {
  const workspaceId = '4PMRpK';
  const accessToken = '5oef91pmMPz6KC2Fuk7R3iuRXeX53pHjGrHESe24YGpF';
  if (method !== 'GET') {
    return {
      status: 405,
      body: { message: 'Method not allowed.' }
    };
  }

  const response = await fetch(
    `https://api.typeform.com/forms?page_size=200&workspace_id=${workspaceId}`,
    {
      headers: {
        Authorization: 'Bearer ' + accessToken
      }
    }
  );

  if (response.status !== 200) {
    throw new Error(`Non-200 (${response.status}) response for GET Request`);
  }

  return await response.json();
};

module.exports = fetchForms;
