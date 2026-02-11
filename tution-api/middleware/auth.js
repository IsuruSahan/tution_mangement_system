const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        // 1. Grab the header safely
        const authHeader = req.header('Authorization');
        
        // 2. Check if the header exists and starts with "Bearer "
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required. No token provided.' });
        }

        // 3. Extract the token safely
        const token = authHeader.replace('Bearer ', '');

        // 4. Verify the token
        // IMPORTANT: Ensure this secret matches the one in your login route!
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key_here');
        
        // 5. Attach teacherId for use in other routes (like getting students)
        req.teacherId = decoded.id; 
        next();
        
    } catch (e) {
        console.error("JWT Verification Error:", e.message);
        res.status(401).send({ error: 'Invalid or expired token. Please login again.' });
    }
};

module.exports = auth;