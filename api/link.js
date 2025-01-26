const express = require('express');
const URL = require('../Schemas/linkSchema');
const router = express.Router();
const UAParser = require('ua-parser-js'); 

router.post('/create', async (req, res) => {
  const { originalUrl, expiryDate, remarks, userId } = req.body;
  
  // Get the user's IP address and device info
  const ipAddress = req.ip;
  const userDevice = req.headers['user-agent'];  // This will capture the user's device type
  
  // Use UAParser to extract the OS
  const parser = new UAParser();
  const result = parser.setUA(userDevice).getResult();
  const osName = result.os.name;  // Extracts the operating system name

  if (!originalUrl || !expiryDate || !remarks) {
    return res.status(400).json({ message: 'Original URL, expiry date, and remarks are required' });
  }

  try {
    const { nanoid } = await import('nanoid'); // Dynamically import nanoid
    const shortId = nanoid(6);
    const host = req.get('host');
    const shortUrl = `${req.protocol}://${host}/${shortId}`;

    const newUrl = new URL({
      originalUrl,
      shortUrl,
      expiryDate: new Date(expiryDate),
      remarks,
      userId,
      ipAddress,
      userDevice: osName,  
    });

    await newUrl.save();
    res.status(201).json({ originalUrl, shortUrl, expiryDate, remarks, ipAddress, userDevice: osName });
  } catch (err) {
    console.error('Error creating shortened URL:', err);
    res.status(500).json({ message: 'Failed to create shortened URL' });
  }
});



router.get('/links/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const links = await URL.find({ userId });
    res.status(200).json(links);
  } catch (err) {
    console.error('Error fetching links:', err);
    res.status(500).json({ message: 'Failed to fetch links' });
  }
});

// GET route to handle redirection for shortened URLs
router.get('/:shortId', async (req, res) => {
  const { shortId } = req.params;

  try {
    const url = await URL.findOne({ shortUrl: { $regex: `/${shortId}$` } });

    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    if (new Date() > new Date(url.expiryDate)) {
      return res.status(410).json({ message: 'URL has expired' });
    }

    // Increment the visits count
    url.visits += 1;
    await url.save();

    return res.redirect(url.originalUrl);
  } catch (err) {
    console.error('Error during redirection:', err);
    res.status(500).json({ message: 'Failed to redirect' });
  }
});


router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedLink = await URL.findByIdAndDelete(id);

    if (!deletedLink) {
      return res.status(404).json({ message: 'Link not found' });
    }

    res.status(200).json({ message: 'Link deleted successfully' });
  } catch (err) {
    console.error('Error deleting link:', err);
    res.status(500).json({ message: 'Failed to delete link' });
  }
});

router.put('/update/:id', async (req, res) => {
  const { id } = req.params;
  const { originalUrl, expiryDate, remarks } = req.body;

  if (!originalUrl || !expiryDate || !remarks) {
    return res.status(400).json({ message: 'Original URL, expiry date, and remarks are required' });
  }

  try {
    const updatedLink = await URL.findByIdAndUpdate(
      id,
      { originalUrl, expiryDate: new Date(expiryDate), remarks },
      { new: true } // Return the updated document
    );

    if (!updatedLink) {
      return res.status(404).json({ message: 'Link not found' });
    }

    res.status(200).json(updatedLink);
  } catch (err) {
    console.error('Error updating link:', err);
    res.status(500).json({ message: 'Failed to update link' });
  }
});



module.exports = router;
