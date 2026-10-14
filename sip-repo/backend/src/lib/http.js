function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}

// API Gateway's Cognito authorizer validates the JWT before we run,
// so the claims here are already trustworthy.
function claims(event) {
  return event.requestContext?.authorizer?.jwt?.claims || {};
}

module.exports = { json, claims };
