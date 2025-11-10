// import and instantiate express
const express = require("express") // CommonJS import style!
const axios = require("axios"); 
const cors = require("cors");
const multer = require('multer');

const app = express() // instantiate an Express object
app.use(cors());
app.use(express.json());

// we will put some server logic here later...

//fall-back data
const fallbackBoards = [
    {
        id: 1,
        title: 'Your Cool Boards',
        isOwner: true,
        isJoined:true, 
        memberCount: 10,
        coverPhotoURL: `https://picsum.photos/800/400?seed=board-1`,
        descriptionShort:
          'purus eu magna vulputate luctus cum sociis natoque penatibus et magnis',
        descriptionLong:
            'non velit nec nisi vulputate nonummy maecenas tincidunt lacus at velit vivamus vel nulla eget eros elementum pellentesque quisque porta volutpat erat quisque erat eros viverra eget congue eget semper rutrum nulla nunc purus phasellus in felis donec semper sapien a libero nam dui proin leo odio porttitor id consequat in consequat ut nulla sed accumsan felis ut at dolor quis odio consequat varius integer ac leo pellentesque ultrices mattis odio donec vitae nisi nam ultrices libero'
      },
      {
        id: 2,
        title: 'Not Your Cool Boards',
        isOwner: false,
        isJoined: true, 
        memberCount: 10,
        coverPhotoURL: 'https://picsum.photos/800/400?seed=board-2',
        descriptionShort:
          'purus eu magna vulputate luctus cum sociis natoque penatibus et magnis',
        descriptionLong:
            'non velit nec nisi vulputate nonummy maecenas tincidunt lacus at velit vivamus vel nulla eget eros elementum pellentesque quisque porta volutpat erat quisque erat eros viverra eget congue eget semper rutrum nulla nunc purus phasellus in felis donec semper sapien a libero nam dui proin leo odio porttitor id consequat in consequat ut nulla sed accumsan felis ut at dolor quis odio consequat varius integer ac leo pellentesque ultrices mattis odio donec vitae nisi nam ultrices libero'
      }
  ];

  const fallbackMembers = [
    {
      id: 1,
      first_name: "Sherwin",
      last_name: "Peverell",
      username: "speverell0",
      country: "Indonesia",
      description: "non velit nec nisi vulputate",
      avatar: "https://i.pravatar.cc/100?img=1",
    },
    {
      id: 2,
      first_name: "Anna",
      last_name: "Petrova",
      username: "apetrova",
      country: "Russia",
      description: "non velit nec nisi vulputate",
      avatar: "https://i.pravatar.cc/100?img=2",
    },
  ];

  //mockaroo api - for now no env
  const MOCKAROO_URL = "https://my.api.mockaroo.com/mock_boards_data.json?key=dc8ece40";
  const MOCKAROO_URL_MEMBERS = 'https://my.api.mockaroo.com/members.json?key=dc8ece40';

//mock photos for boards
const picsumUrl = (id, w = 800, h = 400) => `https://picsum.photos/${w}/${h}?seed=board-${id}`;

const enrichBoard = (b) => {
  if (!b || typeof b !== "object") return b;
  const id = String(b.id ?? "").trim() || "unknown";
  return {
    ...b,
    coverPhotoURL: picsumUrl(id, 800, 400),
  };
};
//mock photos for members
const avatarUrl = (id) => `https://i.pravatar.cc/100?img=${id}`;

const enrichMember = (b) => {
  if (!b || typeof b !== "object") return b;
  const id = String(b.id ?? "").trim() || "unknown";
  return {
    ...b,
    avatar: avatarUrl(id),
  };
};
  //ROUTES

  //GET

  //get mock members
  app.get("/api/members", async (req, res) => {
    try {
      const response = await axios.get(MOCKAROO_URL_MEMBERS);
      console.log("Data loaded from Mockaroo");
      const members = Array.isArray(response.data) ? response.data : [];
      const enriched = members.map(enrichMember);
      res.json({ data: enriched });
    } catch (err) {
      console.warn("Mockaroo failed, using fallback data instead.");
      res.json({ data: fallbackMembers });
    }
  });

  //get mock boards
  // Homepage route - get data from Mockaroo
  app.get("/api/home", async (req, res) => {
    try {
      // Fetch boards data from Mockaroo to calculate homepage stats
      const response = await axios.get(MOCKAROO_URL);
      const boards = Array.isArray(response.data) ? response.data : [];
      
      // Calculate stats from Mockaroo data
      const totalBoards = boards.length;
      const activeCommunities = boards.filter(b => b.isJoined === true || b.isJoined === "true").length;
      
      // Get recent activity from boards data
      const recentActivity = boards.slice(0, 3).map(board => ({
        type: "board_joined",
        message: `You joined '${board.title || "Community Board"}'`,
        timestamp: new Date().toISOString()
      }));
      
      const homeData = {
        welcomeMessage: "Welcome to CommYOUnity",
        userStats: {
          totalBoards: totalBoards,
          totalFriends: 12, 
          activeCommunities: activeCommunities
        },
        recentActivity: recentActivity.length > 0 ? recentActivity : [
          {
            type: "board_joined",
            message: "Welcome to CommYOUnity!",
            timestamp: new Date().toISOString()
          }
        ]
      };
      
      res.json({ data: homeData });
    } catch (err) {
      console.warn("Mockaroo failed for homepage, using fallback data.");
      // Fallback data
      const fallbackData = {
        welcomeMessage: "Welcome to CommYOUnity",
        userStats: {
          totalBoards: fallbackBoards.length,
          totalFriends: 12,
          activeCommunities: fallbackBoards.filter(b => b.isJoined).length
        },
        recentActivity: [
          {
            type: "board_joined",
            message: `You joined '${fallbackBoards[0]?.title || "Community Board"}'`,
            timestamp: new Date().toISOString()
          }
        ]
      };
      res.json({ data: fallbackData });
    }
  });

  //get mock boards for viewBoards
  app.get("/api/boards", async (req, res) => {
    try {
      const response = await axios.get(MOCKAROO_URL);
      console.log("Data loaded from Mockaroo");
      const boards = Array.isArray(response.data) ? response.data : [];
      const enriched = boards.map(enrichBoard);
      res.json({ data: enriched });
    } catch (err) {
      console.warn("Mockaroo failed, using fallback data instead.");
      res.json({ data: fallbackBoards });
    }
  });

  //get data for single board
  app.get("/api/boards/:id", async (req, res) => {
    const boardId = parseInt(req.params.id, 10);
    try {
      const response = await axios.get(MOCKAROO_URL);
      const boards = Array.isArray(response.data) ? response.data : [];
      const board = boards.find(b => Number(b.id) === boardId);
      if (!board) return res.status(404).json({ error: "Board not found" });
      return res.json({ data: enrichBoard(board) });
    } catch (err) {
      console.warn("Mockaroo failed, using fallback for single board.");
      const board = fallbackBoards.find(b => b.id === boardId);
      if (!board) return res.status(404).json({ error: "Board not found" });
      res.json({ data: board });
    }
  });

  //get mock data for invite firends
  app.get("/api/friends", async (req, res) => {
    try {
      const MOCKAROO_URL_FRIENDS = "https://my.api.mockaroo.com/friends.json?key=dc8ece40";
      const response = await axios.get(MOCKAROO_URL_FRIENDS, {
        params: { count: 10 },
      });
  
      console.log("Data loaded from Mockaroo (friends)");
      const friends = Array.isArray(response.data) ? response.data : [];
      const enriched = friends.map(enrichMember);
      res.json({ data: enriched });
    } catch (err) {
      console.warn("Mockaroo failed for friends, using fallback data.");
      const fallbackFriends = [
        {
          id: 1,
          first_name: "Emma",
          last_name: "Chen",
          username: "emma_chen",
          mutualCount: 12,
          profilePhotoURL: "https://picsum.photos/seed/emma/200/200",
          bio: "Loves art museums, matcha lattes, and weekend hikes 🌿",
          online: true,
        },
        {
          id: 2,
          first_name: "Liam",
          last_name: "Patel",
          username: "liam.codes",
          mutualCount: 8,
          profilePhotoURL: "https://picsum.photos/seed/liam/200/200",
          online: false,
        },
        {
          id: 3,
          first_name: "Sofia",
          last_name: "Reyes",
          username: "sofiareyes",
          mutualCount: 5,
          profilePhotoURL: "https://picsum.photos/seed/sofia/200/200",
          online: true,
        },
      ];
      res.json({ data: fallbackFriends });
    }
  });

// POST 

//edit form

//multer

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file && !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed'));
    }
    cb(null, true);
  },
});

app.post('/api/boards/:id/edit', upload.single('photo'), (req, res) => {
  const { id } = req.params;
  const { title, descriptionLong } = req.body;

  const fileMeta = req.file
    ? {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      }
    : null;

  console.log('[BOARD EDIT RECEIVED]', {
    boardId: id,
    title,
    descriptionLong,
    file: fileMeta || '(no file)',
  });

  return res.status(202).json({
    status: 'received',
    boardId: id,
    received: {
      title: title ?? null,
      descriptionLong: descriptionLong ?? null,
      photo: fileMeta,
    },
    updatedAt: new Date().toISOString(),
  });
});

//leave board button

app.post('/api/boards/:id/leave', (req, res) => {
  const { id } = req.params;

  console.log('[LEAVE BOARD]', {
    boardId: id,
  });

  return res.status(202).json({
    status: 'received',
    boardId: id,
    message: 'User left the board (mock).',
    updated: {
      isJoined: false,
      memberCountDelta: -1, 
    },
    timestamp: new Date().toISOString(),
  });
});






//code might below be bad (shouldn't have been merged)... 
//double-check this pls - Carina

// Authentication Routes

// Login Route
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Attempt to fetch users from Mockaroo API
    const response = await axios.get(MOCKAROO_URL_MEMBERS);
    const users = Array.isArray(response.data) ? response.data : [];

    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      return res.json({
        data: {
          user: userWithoutPassword,
          token: "mock-jwt-token" // Replace with real JWT in production
        }
      });
    }
  } catch (err) {
    console.warn("Mockaroo API failed, falling back to local data.");
  }

  // Fallback to local data
  const user = fallbackUsers.find(u => u.email === email && u.password === password);
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    return res.json({
      data: {
        user: userWithoutPassword,
        token: "mock-jwt-token"
      }
    });
  }

  return res.status(401).json({ error: "Invalid email or password" });
});

// Signup Route
app.post("/api/auth/signup", async (req, res) => {
  const { email, password, username, first_name, last_name } = req.body;

  try {
    // Check if email already exists in Mockaroo API
    const response = await axios.get(MOCKAROO_URL_MEMBERS);
    const users = Array.isArray(response.data) ? response.data : [];

    if (users.some(u => u.email === email)) {
      return res.status(400).json({ error: "Email already registered" });
    }
  } catch (err) {
    console.warn("Mockaroo API failed, falling back to local data.");
  }

  // Check if email already exists in fallback data
  if (fallbackUsers.some(u => u.email === email)) {
    return res.status(400).json({ error: "Email already registered" });
  }

  // Create new user
  const newUser = {
    id: fallbackUsers.length + 1,
    email,
    password, // In real app, hash the password
    username,
    first_name,
    last_name,
    avatar: avatarUrl(fallbackUsers.length + 1),
    friends: [],
    boards: [],
    settings: {
      notifications: true,
      privacy: "public"
    }
  };

  fallbackUsers.push(newUser);

  const { password: _, ...userWithoutPassword } = newUser;
  return res.status(201).json({
    data: {
      user: userWithoutPassword,
      token: "mock-jwt-token"
    }
  });
});

// Add fallback users
defineFallbackUsers();

// Define fallback users
function defineFallbackUsers() {
  const fallbackUsers = [
    {
      id: 1,
      email: "user1@example.com",
      password: "password123", // In real app, hash the password
      username: "user1",
      first_name: "John",
      last_name: "Doe",
      avatar: "https://i.pravatar.cc/100?img=11",
      friends: [2, 3],
      boards: [1, 2],
      settings: {
        notifications: true,
        privacy: "public"
      }
    },
    {
      id: 2,
      email: "user2@example.com",
      password: "password456",
      username: "user2",
      first_name: "Jane",
      last_name: "Smith",
      avatar: "https://i.pravatar.cc/100?img=12",
      friends: [1],
      boards: [2],
      settings: {
        notifications: true,
        privacy: "private"
      }
    }
  ];
}

// export the express app we created to make it available to other modules
module.exports = app