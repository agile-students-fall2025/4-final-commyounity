const MOCKAROO_BASE_URL = "https://my.api.mockaroo.com";
const DEFAULT_FRIEND_COUNT = 12;

const buildFriendsUrl = (count = DEFAULT_FRIEND_COUNT) => {
  const key = process.env.REACT_APP_KEY;

  if (!key) {
    throw new Error(
      "Mockaroo key missing. Set REACT_APP_KEY in your front-end .env file."
    );
  }

  const searchParams = new URLSearchParams({
    key,
    count: String(count),
  });

  return `${MOCKAROO_BASE_URL}/friends.json?${searchParams.toString()}`;
};

export const fetchFriends = async (count = DEFAULT_FRIEND_COUNT) => {
  const endpoint = buildFriendsUrl(count);
  const apiKey = process.env.REACT_APP_KEY;

  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      "X-API-Key": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Mockaroo responded with status ${response.status}`);
  }

  const payload = await response.json();
  return Array.isArray(payload) ? payload : [payload];
};

export default fetchFriends;
