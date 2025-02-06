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


router.get('/image_kit/:width_height/:image_name/:quality?', async (req, res) => {
    const { width_height, image_name, quality } = req.params;

    try {
        const imageProcessor = new ImageProcessor();
        await imageProcessor.processImage(`${width_height},q-${quality || 100}`, image_name, res);
    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).send('Internal Server Error');
    }
});


// Export the router
module.exports = router;
