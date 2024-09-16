const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const multer = require("multer");
const { s3Client } = require("./config/awsBucketConfig");
const { PutObjectCommand, } = require("@aws-sdk/client-s3");
const mime = require("mime-types");
const fs = require('fs');
const path = require('path');



const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors()); 


const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const storage = multer.diskStorage({
  destination: 'data/',
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

async function fetchWithRetry(url, options, retries = 0) {
  try {
    console.log(options);
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    console.log(response);
    return response;
  } catch (error) {
    if (retries < MAX_RETRIES) {
      console.log(`Attempt ${retries + 1} failed. Retrying...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, options, retries + 1);
    }
    throw error;
  }
}

const addFileToStorage = async (image, folder, owner = "user") => {
  try {
    const fileContent = fs.readFileSync(image.path); 
    const fileName = `${image.originalname}`;
    const url = `https://petpetclub.s3.ap-southeast-1.amazonaws.com/${folder}/${fileName}`;
    const params = {
      Bucket: "petpetclub",
      Key: `${folder}/${fileName}`,
      Body: fileContent,
      ACL: 'public-read', // Set the ACL to public-read
      ContentType: 'image/jpeg', // Set the Content-Type to the appropriate image type
    };
    const results = await s3Client.send(new PutObjectCommand(params));
    return url;
  } catch (err) {
    console.log("Error", err);
  }
};

app.post('/api-proxy', upload.single("file"), async (req, res) => {
  

  try {
    
    const file = req.file;
    const imageUrl = req.body.url;

    if (file != undefined) {
      url = await addFileToStorage((image = file), (folder = `user-uploads/test-server`));
    } else {
      url = imageUrl;
    }
    const response = await fetchWithRetry("http://13.212.11.191:9095/eye-predict", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();
    console.log(data);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error in API Proxy:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


