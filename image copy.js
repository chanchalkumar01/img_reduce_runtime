const express = require('express');
const axios = require('axios');
const sharp = require('sharp');
const app = express();


// Define route for image processing

class Images {
// try {
    async load_img(req, res){
        
    	var  text = "Chanchal Kumar";
    	const { width_height, image_name } = req.params;
    	const [width1, height1] = width_height.split(',');
    
    	const width = width1.split('w-')[1];
    	const height = height1.split('h-')[1];
    
    	const imageUrl = 'https://cdn.sloshout.com/uploads/gallery/' + image_name;
    
    	// Validate width, height, and URL
    	if (!width || !height) {
    		return res.status(400).send('Invalid parameters');
    	}
    
    	try {
    		// Download the image file
    		const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    		const imageData = Buffer.from(response.data, 'binary');
    
    		// Resize/crop the image
    		const resizedImageBuffer = await sharp(imageData)
    			.resize(parseInt(width), parseInt(height))
    			.toBuffer();
    			
    		// Create SVG text with white color
    		const svgText = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
                          <text x="50%" y="50%" font-family="Arial" font-size="20" fill="rgba(255, 255, 255, 0.5)" text-anchor="middle">${text}</text>
                        </svg>`;
                        
    		// Composite text on the image
    		const textImageBuffer = await sharp(resizedImageBuffer)
    			.composite([{ input: Buffer.from(svgText), gravity: 'northwest' }])
    			.webp({ quality: 80 }) // Convert to WebP format with specified quality
    			.toBuffer();
    
    		res.set('Link', '<link rel="icon" href="https://ik.imagekit.io/pu0hxo64d/images/favicon.ico" type="image/x-icon">');
    		res.setHeader('Title', image_name); // Set the title header
    		res.setHeader('Content-Type', 'image/jpeg'); // Change content type to JPEG
    		// res.setHeader('Cache-Control', 'public, max-age=31557600'); // Cache for one year
    
    		// Send the processed image with text
    		res.end(textImageBuffer);
    	} catch (error) {
    		console.error('Error processing image:', error);
    		res.status(500).send('Internal Server Error');
    	}
    };

// } catch (error) {
// 		console.error('Error processing image:', error);
// 		res.status(500).send('Internal Server Error');
// }

}



// Start the server
// const PORT = process.env.PORT || 9889;
// app.listen(PORT, () => {
// 	console.log(`Server running on port ${PORT}`);
// });
