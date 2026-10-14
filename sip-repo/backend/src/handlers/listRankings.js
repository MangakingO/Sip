const { query } = require('../lib/db');
const { json } = require('../lib/http');

// The core feature: one drink name, every location that serves it,
// ranked by average rating rather than by the shop's overall score.
exports.handler = async (event) => {
  const drinkName = event.queryStringParameters?.drink;
  if (!drinkName) {
    return json(400, { error: 'Pass a drink name, e.g. /rankings?drink=Oat Milk Latte' });
  }

  const rows = await query(
    `SELECT d.id            AS drink_id,
            d.name          AS drink_name,
            l.name          AS location_name,
            l.address,
            ROUND(AVG(r.rating)::numeric, 2) AS average_rating,
            COUNT(r.id)     AS review_count
     FROM drinks d
     JOIN locations l ON l.id = d.location_id
     LEFT JOIN reviews r ON r.drink_id = d.id
     WHERE LOWER(d.name) = LOWER($1)
     GROUP BY d.id, d.name, l.name, l.address
     ORDER BY average_rating DESC NULLS LAST, review_count DESC`,
    [drinkName]
  );

  return json(200, { drink: drinkName, results: rows });
};
