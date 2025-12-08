# Database Intregration

> For DB integration demo:
- Login with username: `carinutzza`
- Password: `123456`
- To test the "Find Members" feature in Edit Board, search for username: `foo`

This app uses Atlas and mongodb for database integration.

**Important notes:** some implmentations on the friends pages are not yet fully integrated - they are rendering mock data, which is now served from the data base, rather than from mockaroo. Check back in sprint 4 for further instructions.

If this is the first time you are runing the code after Sprint 3, re-run `npm install`.

# Back-End (Express) Reference

This directory hosts the Express.js server that powers CommYOUnity’s friends and boards features.

## Authentication

Protected friends endpoints require a JWT. Send an `Authorization` header with your token. Example:

```bash
# replace <token> with a real JWT
curl -H "Authorization: Bearer <token>" http://localhost:4000/api/friends
```

> If your client uses the `JWT <token>` scheme (as in the current passport config), swap `Bearer` for `JWT`.

## Scripts

```bash
npm install           # install dependencies
PORT=4000 npm run dev # start the dev server with nodemon (defaults to 4000)
npm test              # run mocha/chai tests
npm run coverage      # run mocha via c8 to verify code coverage
```

> For CI/review environments that cannot start mongodb-memory-server, set a reachable test URI:  
> `MONGODB_URI_TEST="mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority" npm test`
> Scripts set `NODE_ENV=test` automatically.
> For coverage with Atlas: `MONGODB_URI_TEST="mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority" npm run coverage`

## Environment Variables

Set these in `back-end/.env` (never commit secrets):

| Variable | Purpose |
| --- | --- |
| `PORT` | Port for the Express server (defaults to `4000`). |
| `MONGODB_URI` | MongoDB Atlas connection string. |
| `JWT_SECRET` | Secret used to sign JWTs. |
| `JWT_EXP_DAYS` | Days until JWT expiration (defaults to 7 if unset). |
| `MOCKAROO_API_KEY` | API key used to proxy Mockaroo friends data. |
| `MOCKAROO_FRIENDS_URL` | Base URL for the friends dataset (defaults to Mockaroo friends endpoint). |
| `FRIENDS_FETCH_COUNT` | How many friends to request per fetch (defaults to 20). |
| `FRIENDS_CACHE_TTL_MS` | Cache lifetime for the friends roster in milliseconds (defaults to 5 minutes). |

## Key Routes

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/friends` | Returns the canonical friends roster (JWT required). Supports filtering and uses Mongo-backed cache. |
| `GET` | `/api/friends?username=<exact>` | Exact, case-insensitive username match. Rejects invalid characters with `400`. |
| `GET` | `/api/friends?search=<term>` | Partial match across username and full name. |
| `GET` | `/api/friends?limit=5` | Optional cap on returned entries (applies after filtering). |
| `GET` | `/api/friends?simulateError=true` | Dev/test helper that forces a `503` response, used by the mocha/chai suite. |
| `GET` | `/api/friend-requests` | Returns the pending friend requests for the authenticated user (JWT required). |
| `POST` | `/api/friend-requests/:id/accept` | Accept a request (JWT required). Moves FriendRequest → Friend and deletes the request. |
| `POST` | `/api/friend-requests/:id/decline` | Decline a request (JWT required). Deletes the pending request only. |

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

> `username` queries accept only letters, digits, dots (`.`), underscores (`_`), and hyphens (`-`). Any other character results in a `400` response so the front end can surface “bad input” errors cleanly.

## Testing

The mocha/chai suite lives in `back-end/test`. To cover both success and error paths for the friends endpoint:

```bash
npm test               # quick test run
npm run coverage       # c8 + mocha (target ≥10% coverage)
```

`friends.test.js` hits `/api/friends` normally and again with `simulateError=true` to exercise the fallback/error handling logic. This keeps the friends API’s behavior in sync with the front-end integration. 

`friendRequests.test.js` covers the GET + POST routes for the friend requests module so the mocked accept/decline flow stays in sync with the React page.

**Friends tests note:** Friends/friend-requests suites require a reachable Mongo URI. Set `MONGODB_URI_TEST` (or `MONGODB_URI`) before running `npm test`/`npm run coverage`, e.g.:

```bash
MONGODB_URI_TEST="mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority" npm test
MONGODB_URI_TEST="mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority" npm run coverage
```

Test fixtures use generated usernames like `br_<ts>`, `cb_<ts>`, `edit_user_<ts>`, `feedtester_<ts>`, `loginuser_<ts>`, `mb_<ts>`, `member_<ts>`, `routeuser`, `fr_test_<ts>`, `frt_<ts>`, and `guser_<ts>` (seeded Mockaroo friends include usernames like `mparbrook1`, etc.).

CI: GitHub Actions runs `npm run coverage` on push/PR via `.github/workflows/backend-tests.yml`. Set repo secrets `MONGODB_URI_TEST` and `JWT_SECRET` so tests can reach Atlas and pass authentication checks.
