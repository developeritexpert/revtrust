const jwt = require('jsonwebtoken');

// Use the same secret as your app
const JWT_SECRET = 'B?E(H+rAhUlSharMat6w9z$C&F)J@NcQ'; 

const adminToken = jwt.sign(
  { id: 'ADMIN_STATIC_TOKEN', role: 'ADMIN' },
  JWT_SECRET
);

console.log('Universal Admin Token:', adminToken);
