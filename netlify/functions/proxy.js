// netlify/functions/proxy.js
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxzHdpP3bEl5CGIDpTeQTXRGx1VlO9AQLK4fEEWlKDlNqmZRu0CLb3lAl9X6DUFwKLY/exec';

exports.handler = async (event) => {
  try {
    let params = {};
    if (event.httpMethod === 'POST') {
      if (event.body) params = JSON.parse(event.body);
    } else {
      const url = new URL(event.path, `https://${event.headers.host}`);
      params = Object.fromEntries(url.searchParams);
    }
    if (!params.action) {
      const url = new URL(event.path, `https://${event.headers.host}`);
      params.action = url.searchParams.get('action');
    }

    // SELALU gunakan POST ke Apps Script (karena doPost membaca body JSON)
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await response.text();
    return {
      statusCode: 200,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json',
      },
      body: data,
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'error', message: error.toString() }),
    };
  }
};
