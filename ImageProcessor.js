// // ImageProcessor.js
// const axios = require('axios');
// const sharp = require('sharp');

// class ImageProcessor {
//     constructor(text = "Chanchal Kumar") {
//         this.text = text;
//     }

//     async getImageDimensions(imageUrl) {
//         try {
//             // Download the image
//             const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
//             const imageData = Buffer.from(response.data, 'binary');

//             // Get image metadata
//             const metadata = await sharp(imageData).metadata();
//             return {
//                 width: metadata.width,
//                 height: metadata.height
//             };
//         } catch (error) {
//             throw new Error('Error retrieving image dimensions');
//         }
//     }

//     async processImage(width_height, image_name, res) {
//         const imageUrl = 'https://cdn.sloshout.com/uploads/gallery/' + image_name;
    
//         const [width1, height1] = width_height.split(',');
    
//         // Extract width and height from parameters
//         let width = width1.split('w-')[1];
//         let height = height1.split('h-')[1];
    
//         // Initialize width_new and height_new
//         let width_new = width;
//         let height_new = height;
    
//         if (width === 'f' || height === 'f') {
//             // Get original image dimensions
//             const dimensions = await this.getImageDimensions(imageUrl);
//             width_new = width === 'f' ? dimensions.width : parseInt(width);
//             height_new = height === 'f' ? dimensions.height : parseInt(height);
//         } else {
//             width_new = parseInt(width);
//             height_new = parseInt(height);
//         }
    
//         // Assign final values to width and height
//         width = (width !== 'f') ? parseInt(width) : parseInt(width_new);
//         height = (height !== 'f') ? parseInt(height) : parseInt(height_new);
    
//         if (!width || !height) {
//             throw new Error('Invalid parameters');
//         }
    
//         // Download the image
//         const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
//         const imageData = Buffer.from(response.data, 'binary');
    
//         // Resize and crop the image
//         const resizedImageBuffer = await sharp(imageData)
//             .resize(width, height)
//             .toBuffer();
    
//         // Create SVG text with white color
//         const svgText = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
//                         <text x="50%" y="50%" font-family="Arial" font-size="20" fill="rgba(255, 255, 255, 0.5)" text-anchor="middle">${this.text}</text>
//                       </svg>`;
    
//         // Composite text on the image
//         const textImageBuffer = await sharp(resizedImageBuffer)
//             .composite([{ input: Buffer.from(svgText), gravity: 'northwest' }])
//             .webp({ quality: 100 }) // Convert to WebP format with specified quality
//             .toBuffer();
    
//         // Set caching headers
//         res.setHeader('Cache-Control', 'public, max-age=31557600'); // Cache for one year
//         res.setHeader('Expires', new Date(Date.now() + 31557600000).toUTCString()); // Expire in one year
//         res.setHeader('Content-Type', 'image/webp'); // Set appropriate content type
    
//         // Send the processed image with text
//         res.end(textImageBuffer);
//     }
    
// }

// module.exports = ImageProcessor;

const axios = require('axios');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

class ImageProcessor {
    constructor(text = "Chanchal Kumar") {
        this.text = text;
    }

    async getImageDimensions(imageUrl) {
        try {
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const imageData = Buffer.from(response.data, 'binary');
            const metadata = await sharp(imageData).metadata();
            return { width: metadata.width, height: metadata.height };
        } catch (error) {
            console.error('Error retrieving image dimensions:', error);
            throw new Error('Failed to fetch image dimensions');
        }
    }

    getCachePath(width_height, image_name) {
        const sanitizedImageName = image_name.replace(/[^a-zA-Z0-9]/g, '_');
        return path.join(__dirname, 'cache', `${width_height}_${sanitizedImageName}.webp`);
    }

    async processImage(width_height, image_name, res, forceUpdate = false) {
        try {
            const imageUrl = `https://cdn.sloshout.com/uploads/gallery/${image_name}`;
            const matches = width_height.match(/w-(\d+|f),h-(\d+|f)(?:,q-(\d+))?/);
    
            if (!matches) {
                if (!res.headersSent) res.status(400).json({ error: 'Invalid parameters' });
                return;
            }
    
            let [, width, height, quality] = matches;
            quality = quality ? parseInt(quality, 10) : 100;
    
            if (width === 'f' || height === 'f') {
                const dimensions = await this.getImageDimensions(imageUrl);
                width = width === 'f' ? dimensions.width : parseInt(width, 10);
                height = height === 'f' ? dimensions.height : parseInt(height, 10);
            } else {
                width = parseInt(width, 10);
                height = parseInt(height, 10);
            }
    
            if (isNaN(width) || isNaN(height) || isNaN(quality)) {
                if (!res.headersSent) res.status(400).json({ error: 'Invalid width, height, or quality values' });
                return;
            }
    
            const cachePath = this.getCachePath(`${width_height}_q${quality}`, image_name);
    
            // ✅ Delete cache if `forceUpdate = true`
            if (forceUpdate && fs.existsSync(cachePath)) {
                fs.unlinkSync(cachePath);
            }
    
            // ✅ Serve cached image if available
            if (fs.existsSync(cachePath)) {
                if (!res.headersSent) {
                    res.setHeader('Content-Type', 'image/webp');
                    res.setHeader('Cache-Control', 'public, max-age=31557600');
                    res.setHeader('Link', '<https://ik.imagekit.io/pu0hxo64d/images/favicon.ico>; rel="icon"');
                }
                return fs.createReadStream(cachePath).pipe(res);
            }
    
            // Download the image
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const imageData = Buffer.from(response.data, 'binary');
    
            // Resize and process the image
            const resizedImageBuffer = await sharp(imageData)
                .resize(width, height)
                .toBuffer();
    
            // Create SVG text overlay
            const svgText = `
                <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
                    <text x="50%" y="50%" font-family="Arial" font-size="20" fill="rgba(255, 255, 255, 0.5)" text-anchor="middle">${this.text}</text>
                </svg>`;
    
            // Composite text on the image
            const finalImageBuffer = await sharp(resizedImageBuffer)
                .composite([{ input: Buffer.from(svgText), gravity: 'northwest' }])
                .webp({ quality })
                .toBuffer();
    
            // Save processed image to cache
            fs.mkdirSync(path.dirname(cachePath), { recursive: true });
            fs.writeFileSync(cachePath, finalImageBuffer);
    
            // ✅ Set headers BEFORE sending response
            if (!res.headersSent) {
                res.setHeader('Content-Type', 'image/webp');
                res.setHeader('Cache-Control', 'public, max-age=31557600');
                res.setHeader('Link', '<https://ik.imagekit.io/pu0hxo64d/images/favicon.ico>; rel="icon"');
            }
    
            res.end(finalImageBuffer);
    
        } catch (error) {
            console.error('Error processing image:', error);
            
            // ✅ Prevent sending error response twice
            if (!res.headersSent) {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    }

}

module.exports = ImageProcessor;

