const express = require('express');
const router = express.Router();

const ImageProcessor = require('./ImageProcessor');

router.get('/', (req, res) => {
    res.send('Welcome to my world');
});

router.get('/example', (req, res) => {
    res.send('This is an example route.');
});


// router.get('/image_kit/:width_height/:image_name', async (req, res) => {
   
//     const { width_height, image_name } = req.params;

//     try {
//         const imageProcessor = new ImageProcessor();
//         await imageProcessor.processImage(width_height, image_name, res);

//         // res.set('Link', '<link rel="icon" href="https://ik.imagekit.io/pu0hxo64d/images/favicon.ico" type="image/x-icon">');
//         // res.setHeader('Title', image_name); 

//     } catch (error) {
//         console.error('Error processing image:', error);
//         res.status(500).send('Internal Server Error');
//     }
// });


router.get('/image_kit/:width_height/:image_name/:quality?/:refresh?', async (req, res) => {
    const { width_height, image_name, quality, refresh } = req.params;

    try {
        const imageProcessor = new ImageProcessor();
        const qualityParam = quality ? `,q-${quality}` : '';
        const forceUpdate = refresh === "true"; 

        // ✅ Ensure no headers are modified after response is sent
        await imageProcessor.processImage(`${width_height}${qualityParam}`, image_name, res, forceUpdate);

    } catch (error) {
        console.error('Error processing image:', error);
        
        // ✅ Prevent double responses
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});



// Export the router
module.exports = router;
