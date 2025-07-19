const config = require('../config/config');
const cloudinary = require('cloudinary').v2;
const { JsonRpcProvider, Wallet, Contract } = require('ethers');
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const FormData = require('form-data');
const got = require('got');
const NFT = require('../models/nft');
const crypto = require('crypto');
const { gql, default: request } = require('graphql-request');

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret
});

const pinataJwt = config.pinata.jwt;

const provider = new JsonRpcProvider(config.rpcUrl);
const wallet = new Wallet(config.privateKey, provider);
const contract = new Contract(
  config.contractAddress,
  require('../nft-marketplace-bsctestnet/abis/MyNFTCollection.json'),
  wallet
);

// Hàm tính hash MD5 của file từ path
async function getFileHash(filePath) {
  const fileBuffer = await fsp.readFile(filePath);
  return crypto.createHash('md5').update(fileBuffer).digest('hex');
}

// Hàm kiểm tra và tải ảnh lên Cloudinary, chỉ sử dụng file path, không xóa file
async function uploadOrReuseImage(file) {
  try {
    if (!file || !file.path) {
      throw new Error('Invalid file object: missing path');
    }

    const filePath = file.path;
    const fileHash = await getFileHash(filePath);

    const existingImage = await cloudinary.api.resources({
      type: 'upload',
      prefix: fileHash,
      max_results: 1,
    });
    
    if (existingImage.resources && existingImage.resources.length > 0) {
      return existingImage.resources[0].secure_url;
    }

    const uploadOptions = {
      resource_type: 'image',
      transformation: [{ width: 800, crop: 'scale' }],
      allowed_formats: ['jpg', 'png', 'gif', 'jpeg', 'avif', 'webp'], 
      public_id: fileHash,
    };
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    return result.secure_url;
  } catch (uploadError) {
    if (uploadError.message.includes('File size too large')) {
      throw new Error('File size exceeds 10MB limit. Please compress the file or upgrade your Cloudinary plan at https://www.cloudinary.com/pricing/upgrades/file-limit.');
    } else if (uploadError.message.includes('Maximum total number of pixels')) {
      throw new Error('Total pixels exceed 50 Megapixels limit. Please reduce the resolution or number of frames in the GIF.');
    }
    throw new Error(`Failed to upload or reuse image: ${uploadError.message}`);
  }
}

async function getUser(userAddress, { page, limit }) {
  const query = gql`
    query GetUser($userAddress: String!, $skip: Int!, $first: Int!) {
      _meta { block { number } }
      users(where: { id: $userAddress }) {
        id
        totalEarnings
        nftsOwnedCount: nftsOwned { id }
        nftsOwned(skip: $skip, first: $first, orderBy: createdAt, orderDirection: desc) {
          id
          tokenId
          tokenURI
          createdAt
        }
        nftsListed { id tokenId price active }
      }
    }
  `;
  const skip = (page - 1) * limit;
  const variables = { userAddress, skip, first: limit };
  try {
    const result = await request(config.subgraphEndpoint, query, variables);
    const user = result.users[0] || { id: userAddress, totalEarnings: "0", nftsOwned: [], nftsListed: [] };
    return {
      ...user,
      nftsOwned: user.nftsOwned.map(nft => ({
        ...nft,
        createdAt: new Date(parseInt(nft.createdAt.toString()) * 1000).toISOString(),
      })),
      total: user.nftsOwnedCount.length,
    };
  } catch (error) {
    console.error('GraphQL Error in getUser:', error.response?.errors || error);
    throw new Error('Failed to fetch user data');
  }
}

async function processMintMetadata(nftData, files) {
  if (!nftData || !Array.isArray(nftData) || nftData.length === 0) {
    throw new Error('Invalid NFT data');
  }

  const metadataDir = path.join(__dirname, '../metadata');
  await fsp.rm(metadataDir, { recursive: true, force: true }).catch(err => console.log('Directory removal error:', err));
  await fsp.mkdir(metadataDir, { recursive: true });

  const metadataFiles = [];
  const nftRecordsData = [];
  for (let i = 0; i < nftData.length; i++) {
    const nft = nftData[i];
    const { tokenId, name, description: inputDescription, attributes: rawAttributes } = nft;
    if (!tokenId || !name) {
      throw new Error(`Missing required fields for tokenId ${tokenId}`);
    }

    const existingNFT = await NFT.findOne({ tokenId });
    if (existingNFT) {
      console.log(`NFT with tokenId ${tokenId} already exists, skipping...`);
      continue;
    }

    let imageUrl;
    try {
      if (files && files[i]) {
        imageUrl = await uploadOrReuseImage(files[i]);
      } else {
        throw new Error(`No valid image for tokenId ${tokenId}`);
      }
    } catch (uploadError) {
      throw new Error(`Failed to upload image for tokenId ${tokenId}: ${uploadError.message}`);
    }

    const attributes = rawAttributes && Array.isArray(rawAttributes)
      ? rawAttributes.map(attr => ({
          trait_type: typeof attr === 'string' ? attr : attr.trait_type || 'Unknown',
          value: typeof attr === 'string' ? 'Present' : attr.value || 'Unknown',
        }))
      : [];

    const description = inputDescription || `A unique NFT with ID #${tokenId}`;
    const metadata = { tokenId, name, description, image: imageUrl, attributes };
    const filePath = path.join(metadataDir, `${tokenId}.json`);
    await fsp.writeFile(filePath, JSON.stringify(metadata, null, 2));
    metadataFiles.push(filePath);
    nftRecordsData.push({ tokenId, name, description, image: imageUrl, attributes });
  }

  try {
    const pinnedFiles = await Promise.all(metadataFiles.map(async (filePath) => {
      const fileName = path.basename(filePath);
      const fileStream = fs.createReadStream(filePath);

      const formData = new FormData();
      formData.append('file', fileStream, { filename: fileName });
      formData.append('network', 'public');

      console.log(`Uploading metadata to Pinata: ${fileName}`);
      const res = await got('https://uploads.pinata.cloud/v3/files', {
        method: 'POST',
        headers: { Authorization: `Bearer ${pinataJwt}`, ...formData.getHeaders() },
        body: formData,
      }).on('uploadProgress', (progress) => {
        const percent = Math.round(progress.percent * 100);
        console.log(`Upload progress for ${fileName}: ${percent}% (${progress.transferred}/${progress.total} bytes)`);
      });

      if (res.statusCode !== 200) {
        console.error('Pinata upload error response:', res.body);
        throw new Error(`Pinata upload error: ${res.body}`);
      }

      const resData = JSON.parse(res.body);
      if (!resData.data || !resData.data.cid) {
        console.error('Invalid Pinata response:', resData);
        throw new Error('Pinata response missing cid');
      }
      console.log(`Uploaded ${fileName} with CID: ${resData.data.cid}`);
      await fsp.unlink(filePath).catch(err => console.log(`Failed to delete temp file ${filePath}:`, err));
      return { fileName, cid: resData.data.cid };
    }));

    if (metadataFiles.length === 0) return { baseURI: null, txHash: null };

    const baseCID = pinnedFiles[0].cid;
    const baseURI = `ipfs://${baseCID}/`;
    const tx = await contract.setBaseURI(baseURI);
    await tx.wait();
    console.log(`BaseURI set to: ${baseURI}`);

    await NFT.insertMany(nftRecordsData);

    // Xóa tất cả file tạm sau khi xử lý hoàn tất
    const uploadedFiles = files.map(file => file.path);
    for (const filePath of uploadedFiles) {
      if (fs.existsSync(filePath)) {
        await fsp.unlink(filePath).catch(err => console.log(`Failed to delete temp file ${filePath}:`, err));
      }
    }

    return { baseURI, txHash: tx.hash };
  } catch (error) {
    console.error('Metadata processing error:', error.stack);
    // Xóa file tạm nếu có lỗi để tránh rác
    const uploadedFiles = files.map(file => file.path);
    for (const filePath of uploadedFiles) {
      if (fs.existsSync(filePath)) {
        await fsp.unlink(filePath).catch(err => console.log(`Failed to delete temp file ${filePath}:`, err));
      }
    }
    throw new Error(`Failed to process metadata: ${error.message}`);
  }
}

async function updateNFTMetadata(tokenId, updatedData, file) {
  try {
    const nft = await NFT.findOne({ tokenId });
    if (!nft) throw new Error(`NFT with tokenId ${tokenId} not found`);

    let imageUrl = nft.image;
    if (file) {
      imageUrl = await uploadOrReuseImage(file);
    }

    const metadata = {
      name: updatedData.name || nft.name,
      description: updatedData.description || nft.description,
      image: imageUrl,
      attributes: updatedData.attributes || nft.attributes,
    };

    const metadataDir = path.join(__dirname, '../metadata');
    await fsp.mkdir(metadataDir, { recursive: true }).catch(err => console.log('Directory creation error:', err));
    const filePath = path.join(metadataDir, `${tokenId}.json`);
    await fsp.writeFile(filePath, JSON.stringify(metadata, null, 2));

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath), { filename: `${tokenId}.json` });
    formData.append('network', 'public');

    const res = await got('https://uploads.pinata.cloud/v3/files', {
      method: 'POST',
      headers: { Authorization: `Bearer ${pinataJwt}`, ...formData.getHeaders() },
      body: formData,
    }).on('uploadProgress', (progress) => {
      const percent = Math.round(progress.percent * 100);
      console.log(`Upload progress for ${tokenId}.json: ${percent}% (${progress.transferred}/${progress.total} bytes)`);
    });

    if (res.statusCode !== 200) {
      console.error('Pinata upload error response:', res.body);
      throw new Error(`Pinata upload error: ${res.body}`);
    }

    const resData = JSON.parse(res.body);
    if (!resData.data || !resData.data.cid) {
      console.error('Invalid Pinata response:', resData);
      throw new Error('Pinata response missing cid');
    }
    console.log(`Uploaded ${tokenId}.json with CID: ${resData.data.cid}`);

    // Lấy CID cũ từ NFT hiện tại (giả sử baseURI đã lưu hoặc lấy từ contract)
    const oldBaseURI = await contract.getBaseURI(); // Giả sử contract có hàm baseURI
    const oldCID = oldBaseURI.replace('ipfs://', '').replace('/', '');

    // Gỡ pin CID cũ trên Pinata
    if (oldCID && oldCID !== resData.data.cid) {
      console.log(`Unpinning old CID: ${oldCID}`);
      const unpinRes = await got(`https://api.pinata.cloud/pinning/unpin/${oldCID}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${pinataJwt}` },
      });
      if (unpinRes.statusCode === 200) {
        console.log(`Successfully unpinned old CID: ${oldCID}`);
      } else {
        console.warn(`Failed to unpin old CID ${oldCID}: ${unpinRes.body}`);
      }
    }

    const baseURI = `ipfs://${resData.data.cid}/`;
    const tx = await contract.setBaseURI(baseURI);
    await tx.wait();
    console.log(`BaseURI set to: ${baseURI}`);

    await NFT.updateOne({ tokenId }, { $set: { ...metadata, updatedAt: new Date(), image: imageUrl } });
    console.log(`NFT with tokenId ${tokenId} updated in MongoDB`);

    await fsp.unlink(filePath).catch(err => console.log(`Failed to delete temp file ${filePath}:`, err));
    return { success: true, baseURI, txHash: tx.hash };
  } catch (error) {
    console.error('Error updating NFT metadata:', error.stack);
    throw new Error(`Failed to update metadata: ${error.message}`);
  }
}

module.exports = { getUser, processMintMetadata, updateNFTMetadata, contract };