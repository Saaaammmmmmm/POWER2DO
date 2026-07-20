import { getStore } from '@netlify/blobs';

function getJsonBody(event) {
  if (!event.body) return {};

  try {
    return JSON.parse(event.body);
  } catch {
    return {};
  }
}

function isUnavailableBlobError(error) {
  const message = (error?.message || '').toLowerCase();
  return (
    message.includes('not found') ||
    message.includes('no blob') ||
    message.includes('does not exist') ||
    message.includes('not configured to use netlify blobs') ||
    message.includes('siteid') ||
    message.includes('token')
  );
}

export async function handler(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const storeName = process.env.BLOB_STORE_NAME || 'power2do-data';
    const store = getStore({ name: storeName });
    const key = event.queryStringParameters?.key || null;

    if (event.httpMethod === 'GET') {
      if (!key) {
        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: null }),
        };
      }

      try {
        const value = await store.get(key, { type: 'json' });
        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ value }),
        };
      } catch (error) {
        if (isUnavailableBlobError(error)) {
          return {
            statusCode: 200,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: null }),
          };
        }

        throw error;
      }
    }

    if (event.httpMethod === 'POST') {
      const body = getJsonBody(event);
      if (!body.key) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Missing key' }),
        };
      }

      try {
        await store.setJSON(body.key, body.value);
      } catch (error) {
        if (isUnavailableBlobError(error)) {
          return {
            statusCode: 200,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ ok: true, fallback: true }),
          };
        }

        throw error;
      }

      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    if (event.httpMethod === 'DELETE') {
      const body = getJsonBody(event);
      if (!body.key) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Missing key' }),
        };
      }

      try {
        await store.delete(body.key);
      } catch (error) {
        if (isUnavailableBlobError(error)) {
          return {
            statusCode: 200,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ ok: true, fallback: true }),
          };
        }

        throw error;
      }

      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Persistence failure' }),
    };
  }
}
