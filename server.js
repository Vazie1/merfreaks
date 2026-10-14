const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

// Load credentials from Render Environment Variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Basic health check endpoint
app.get('/', (req, res) => {
    res.send('Key API is live and running!');
});

// Verify Key Endpoint for Roblox
app.post('/api/verify', async (req, res) => {
    const { key, hwid } = req.body;

    if (!key || !hwid) {
        return res.status(400).json({ valid: false, message: "Missing key or HWID." });
    }

    const { data: license, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('key', key)
        .single();

    if (error || !license) {
        return res.status(404).json({ valid: false, message: "Invalid key." });
    }

    if (license.status !== 'active') {
        return res.status(403).json({ valid: false, message: "Key revoked or expired." });
    }

    // HWID Binding
    if (!license.hwid) {
        await supabase
            .from('licenses')
            .update({ hwid: hwid })
            .eq('key', key);
    } else if (license.hwid !== hwid) {
        return res.status(403).json({ valid: false, message: "Key already bound to another PC." });
    }

    return res.json({ valid: true, message: "Access granted!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
