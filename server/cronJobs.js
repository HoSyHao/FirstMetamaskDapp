const cron = require('node-cron');
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const FormData = require('form-data');
const got = require('got');
const NFT = require('./models/nft');

// Import contract từ userService
const { contract } = require('./services/userService');

const pinataJwt = process.env.PINATA_JWT;

// Biến môi trường để kiểm soát việc giữ file (mặc định xóa)
const KEEP_FILES = process.env.KEEP_FILES === 'true' || false;

async function checkDatabaseForUpdates() {
  try {
    const nfts = await NFT.find();
    return nfts.map(nft => ({
      tokenId: nft.tokenId,
      name: nft.name,
      description: nft.description,
      image: nft.image,
      attributes: nft.attributes,
    }));
  } catch (error) {
    console.error('Error checking database updates:', error);
    return [];
  }
}

async function hasMetadataChanged(nft, filePath) {
  try {
    const existingMetadata = await NFT.findOne({ tokenId: nft.tokenId }, { name: 1, description: 1, image: 1, attributes: 1 });
    if (!existingMetadata) return true;
    const newMetadata = JSON.parse(await fsp.readFile(filePath, 'utf8'));
    const hasChanged = existingMetadata.name !== newMetadata.name ||
                       existingMetadata.description !== newMetadata.description ||
                       existingMetadata.image !== newMetadata.image ||
                       JSON.stringify(existingMetadata.attributes) !== JSON.stringify(newMetadata.attributes);
    if (hasChanged) {
      await NFT.updateOne({ tokenId: nft.tokenId }, { $set: { updatedAt: new Date() } });
    }
    return hasChanged;
  } catch (error) {
    console.error(`Error checking metadata change for tokenId ${nft.tokenId}:`, error);
    return true;
  }
}

async function uploadMetadataToPinata(filePath) {
  const fileName = path.basename(filePath);
  const fileStream = fs.createReadStream(filePath);
  const formData = new FormData();
  formData.append('file', fileStream, { filename: fileName });
  formData.append('network', 'public');

  try {
    console.log(`Uploading metadata to Pinata: ${fileName}`);
    const res = await got('https://uploads.pinata.cloud/v3/files', {
      method: 'POST',
      headers: { Authorization: `Bearer ${pinataJwt}`, ...formData.getHeaders() },
      body: formData,
    });

    if (res.statusCode !== 200) {
      throw new Error(`Pinata upload failed with status ${res.statusCode}: ${res.body}`);
    }

    const resData = JSON.parse(res.body);
    if (!resData.data || !resData.data.cid) {
      throw new Error('Pinata response missing cid');
    }
    console.log(`Uploaded ${fileName} with CID: ${resData.data.cid}`);
    return { fileName, cid: resData.data.cid };
  } catch (error) {
    console.error(`Failed to upload ${fileName} to Pinata:`, error.message);
    throw error;
  }
}

function startCronJobs() {
  cron.schedule('0 0 * * *', async () => { // Chạy hàng ngày lúc 00:00
    console.log('Running metadata update cronjob...');
    try {
      const nfts = await checkDatabaseForUpdates();
      if (nfts.length === 0) {
        console.log('No NFTs found in database.');
        return;
      }

      const metadataDir = path.join(__dirname, 'cron-metadata');
      await fsp.rm(metadataDir, { recursive: true, force: true }).catch(err => {});
      await fsp.mkdir(metadataDir, { recursive: true }).catch(err => {});

      const metadataFiles = [];
      for (const nft of nfts) {
        const filePath = path.join(metadataDir, `${nft.tokenId}.json`);
        await fsp.writeFile(filePath, JSON.stringify({
          tokenId: nft.tokenId, // Thêm tokenId vào metadata
          name: nft.name,
          description: nft.description,
          image: nft.image,
          attributes: nft.attributes.map(attr => ({
            trait_type: attr.trait_type || 'Unknown',
            value: attr.value || 'Unknown',
          })),
        }, null, 2));
        if (await hasMetadataChanged(nft, filePath)) {
          metadataFiles.push(filePath);
        } else if (!KEEP_FILES && fs.existsSync(filePath)) {
          await fsp.unlink(filePath).catch(err => {});
        }
      }

      if (metadataFiles.length > 0) {
        const pinnedFiles = await Promise.all(metadataFiles.map(async (filePath) => {
          const result = await uploadMetadataToPinata(filePath);
          if (!KEEP_FILES && fs.existsSync(filePath)) {
            await fsp.unlink(filePath).catch(err => {});
          }
          return result;
        }));

        // Cập nhật baseURI cho từng token (nếu cần) hoặc giữ logic chung
        for (const { fileName, cid } of pinnedFiles) {
          const tokenId = parseInt(fileName.split('.')[0]);
          const baseURI = `ipfs://${cid}/`; // URI riêng cho từng token
          const tx = await contract.setBaseURI(baseURI); // Cập nhật baseURI cho token
          await tx.wait();
          console.log(`Updated baseURI for tokenId ${tokenId}: ${baseURI}`);

          // Cập nhật CID mới vào MongoDB
          await NFT.updateOne({ tokenId }, { $set: { baseURI, updatedAt: new Date() } });
        }
      }
    } catch (error) {
      console.error('Cronjob failed:', error.message);
    }
  });
}

module.exports = startCronJobs;