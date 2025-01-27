const express = require('express');
const URL = require('../Schemas/linkSchema');
const router = express.Router();
const UAParser = require('ua-parser-js'); 

router.post('/create', async (req, res) => {
  const { originalUrl, expiryDate, remarks, userId } = req.body;

  const ipAddress = req.ip;
  const userDevice = req.headers['user-agent'];  
  
 
  const parser = new UAParser();
  const result = parser.setUA(userDevice).getResult();
  const osName = result.os.name;  

  if (!originalUrl || !expiryDate || !remarks) {
    return res.status(400).json({ message: 'Original URL, expiry date, and remarks are required' });
  }

  try {
    const { nanoid } = await import('nanoid'); 
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

    url.visits += 1;

    const userDevice = req.headers['user-agent'];
    const parser = new UAParser();
    const osName = parser.setUA(userDevice).getResult().os.name;
    url.clicks.push({ date: new Date(), device: osName });

    await url.save();

    console.log('URL visited: ', url); 

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

router.get('/analytics/date/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const links = await URL.find({ userId });
    const analytics = links.map((link) => ({
      shortUrl: link.shortUrl,
      clicksByDate: link.clicks.reduce((acc, click) => {
        const date = click.date.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {}),
    }));

    console.log('Date-wise analytics: ', analytics);
    res.status(200).json(analytics);
  } catch (err) {
    console.error('Error fetching date-wise analytics:', err);
    res.status(500).json({ message: 'Failed to fetch date-wise analytics' });
  }
});

router.get('/analytics/device/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const links = await URL.find({ userId });
    const analytics = links.map((link) => ({
      shortUrl: link.shortUrl,
      clicksByDevice: link.clicks.reduce((acc, click) => {
        if (click.device) {
          acc[click.device] = (acc[click.device] || 0) + 1;
        }
        return acc;
      }, {}),
    }));
    
    res.status(200).json(analytics);
  } catch (err) {
    console.error('Error fetching device-wise analytics:', err);
    res.status(500).json({ message: 'Failed to fetch device-wise analytics' });
  }
});


module.exports = router;
