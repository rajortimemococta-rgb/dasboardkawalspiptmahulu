// netlify/functions/proxy.js
const https = require('https');

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzsnV0RtLDyo6epqyZOUZ5-TIS6FJwLtGVuELwOS5fZuEqPQ2887UIU70wm6McoEZxHGw/exec';

// Daftar aksi yang HARUS menggunakan POST (karena data besar)
const POST_ACTIONS = ['saveData', 'uploadFile', 'importData'];

exports.handler = async (event) => {
  try {
    let params = {};

    if (event.httpMethod === 'POST') {
      if (event.body) {
        params = JSON.parse(event.body);
      }
    } else {
      const url = new URL(event.path, `https://${event.headers.host}`);
      params = Object.fromEntries(url.searchParams);
    }

    if (!params.action) {
      const url = new URL(event.path, `https://${event.headers.host}`);
      params.action = url.searchParams.get('action');
    }

    const action = params.action || '';

    // Jika aksi termasuk POST_ACTIONS, gunakan POST ke Apps Script
    if (POST_ACTIONS.includes(action)) {
      // Kirim sebagai POST dengan body JSON
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.text();
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: data,
      };
    }

    // Untuk aksi lainnya, gunakan GET (karena data kecil)
    const queryString = new URLSearchParams(params).toString();
    const targetUrl = APPS_SCRIPT_URL + (queryString ? `?${queryString}` : '');

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.text();
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: data,
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'error', message: error.toString() }),
    };
  }
};
