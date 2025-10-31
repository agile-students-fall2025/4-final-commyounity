/**
 * Temporary Friend Request data used ONLY when the Mockaroo API is unavailable.
 *
 * Why keeping this here:
 * - The free Mockaroo key is limited to 200 calls per day. When that quota runs out,
 *   our Friend Requests screen would otherwise be completely empty.
 * - To keep sprint demos unblocked, we fall back to this data locally and make it
 *   obvious in both UI text and code comments that these entries are stand-ins.
 * - As soon as the real back-end endpoint is live (or we upgrade the Mockaroo plan),
 *   this file should be deleted.
 */

const mockFriendRequestsFallback = [
  {
    id: 501,
    first_name: "Nina",
    last_name: "Koval",
    username: "nkoval",
    mutualFriends: 4,
    avatar: "https://i.pravatar.cc/100?img=11",
    message: "We met at the community meetup last week!",
  },
  {
    id: 502,
    first_name: "Ethan",
    last_name: "Chambers",
    username: "echambers",
    mutualFriends: 2,
    avatar: "https://i.pravatar.cc/100?img=12",
    message: "I saw your recent project and would love to connect.",
  },
  {
    id: 503,
    first_name: "Lina",
    last_name: "Park",
    username: "lpark",
    mutualFriends: 6,
    avatar: "https://i.pravatar.cc/100?img=13",
    message: "We’re in the same book club—hi again!",
  },
  {
    id: 504,
    first_name: "Omar",
    last_name: "Hassan",
    username: "ohassan",
    mutualFriends: 1,
    avatar: "https://i.pravatar.cc/100?img=14",
    message: "Let’s team up for the next volunteer drive.",
  },
];

export default mockFriendRequestsFallback;
