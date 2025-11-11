# Back-End (Express) Reference

This directory hosts the Express.js server that powers CommYOUnity’s friends and boards features.

## Scripts

```bash
npm install           # install dependencies
PORT=4000 npm run dev # start the dev server with nodemon (defaults to 4000)
npm test              # run mocha/chai tests
npm run coverage      # run mocha via c8 to verify code coverage
```

## Environment Variables

Set these in `back-end/.env` (never commit secrets):

| Variable | Purpose |
| --- | --- |
| `PORT` | Port for the Express server (defaults to `4000`). |
| `MOCKAROO_API_KEY` | API key used to proxy Mockaroo friends data. |
| `MOCKAROO_FRIENDS_URL` | Base URL for the friends dataset (defaults to Mockaroo friends endpoint). |
| `FRIENDS_FETCH_COUNT` | How many friends to request per fetch (defaults to 20). |
| `FRIENDS_CACHE_TTL_MS` | Cache lifetime for the friends roster in milliseconds (defaults to 5 minutes). |

## Key Routes

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/friends` | Returns the canonical friends roster that the front-end uses for hydration, filtering, and local storage seeding. Accepts `search`, `username`, and `limit` query params. |
| `GET` | `/api/friends?simulateError=true` | Dev/test helper that forces a `503` response, used by the mocha/chai suite to cover error handling without touching production code. |

The `/api/friends` response shape matches the React components’ expectations:

```jsonc
{
  "data": [
    {
      "id": "123",
      "first_name": "Skylar",
      "last_name": "Nguyen",
      "username": "skylar.ng",
      "avatar": "https://picsum.photos/seed/skylar.ng/200/200",
      "online": true
    }
  ],
  "meta": {
    "total": 20,
    "count": 20,
    "filtered": false,
    "cacheSource": "mockaroo",
    "cachedAt": 1700000000000,
    "ttlMs": 300000
  }
}
```

## Testing

The mocha/chai suite lives in `back-end/test`. To cover both success and error paths for the friends endpoint:

```bash
npm test               # quick test run
npm run coverage       # c8 + mocha (target ≥10% coverage)
```

`friends.test.js` hits `/api/friends` normally and again with `simulateError=true` to exercise the fallback/error handling logic. This keeps the friends API’s behavior in sync with the front-end integration. 
