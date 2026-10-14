const { query } = require('../lib/db');
const { json, claims } = require('../lib/http');

// Posts a review, or updates the existing one if this user already
// reviewed this drink unmodified (the "Review Again" flow).
exports.handler = async (event) => {
  const { sub, email } = claims(event);
  if (!sub) return json(401, { error: 'Not signed in' });

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Body must be valid JSON' });
  }

  const { drinkId, rating, note, photoKey, modified = false } = payload;

  if (!drinkId) return json(400, { error: 'drinkId is required' });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return json(400, { error: 'rating must be a whole number from 1 to 5' });
  }
  if (!photoKey) return json(400, { error: 'A photo is required on every review' });

  const [user] = await query(
    `INSERT INTO users (cognito_sub, display_name)
     VALUES ($1, $2)
     ON CONFLICT (cognito_sub) DO UPDATE SET display_name = EXCLUDED.display_name
     RETURNING id`,
    [sub, email || 'Reviewer']
  );

  const [review] = await query(
    `INSERT INTO reviews (user_id, drink_id, rating, note, photo_key, modified)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, drink_id) WHERE modified = false
     DO UPDATE SET rating = EXCLUDED.rating,
                   note = EXCLUDED.note,
                   photo_key = EXCLUDED.photo_key,
                   updated_at = now()
     RETURNING id, rating, note, created_at, updated_at`,
    [user.id, drinkId, rating, note || null, photoKey, modified]
  );

  return json(201, review);
};
