// utils/brevo.js
const SibApiV3Sdk = require('sib-api-v3-sdk');

const defaultClient = SibApiV3Sdk.ApiClient.instance;
defaultClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;
const apiInstance = new SibApiV3Sdk.ContactsApi();

async function addUserToBrevo({ email, firstName, accessDuration, modelsAccess = [] }) {

  const listId = parseInt(process.env.BREVO_LIST_ID, 10);
  if (isNaN(listId)) {
    throw new Error('Invalid BREVO_LIST_ID: must be a number');
  }

  // Build TOOL_ACCESS string based on modelsAccess array
  const accessLines = [];

  if (modelsAccess.includes('quillbot2')) {
    accessLines.push('✔ Advanced Paraphrasing (Quilbot)');
  }

  if (modelsAccess.includes('grammarly1')) {
    accessLines.push('✔ AI-Powered Grammar Checker (Grammarly)');
  }

  if (modelsAccess.includes('turnitin1')) {
    accessLines.push('✔ Originality Detection (Turnitin)');
  }

  const TOOL_ACCESS = accessLines.join('<br>');

  const contact = {
    email,
    attributes: {
      FIRSTNAME: firstName,
      EXPIRY: new Date(accessDuration).toISOString().split('T')[0],
      TOOL_ACCESS,
    },
    listIds: [listId],
    updateEnabled: true,
  };

  await apiInstance.createContact(contact);
}


module.exports = { addUserToBrevo };
