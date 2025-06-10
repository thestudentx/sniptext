// utils/brevo.js
const SibApiV3Sdk = require('sib-api-v3-sdk');

const defaultClient = SibApiV3Sdk.ApiClient.instance;
defaultClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.ContactsApi();

async function addUserToBrevo({ email, firstName, accessDuration }) {
  const listId = parseInt(process.env.BREVO_LIST_ID, 10);
  if (isNaN(listId)) {
    throw new Error('Invalid BREVO_LIST_ID: must be a number');
  }

  const contact = {
    email,
    attributes: {
      FIRSTNAME: firstName,
      EXPIRY: accessDuration
    },
    listIds: [listId],      // ✅ ensures integer format
    updateEnabled: true
  };

  await apiInstance.createContact(contact);
}

module.exports = { addUserToBrevo };
