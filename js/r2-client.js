const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

class R2Client {
  constructor() {
    this.client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
    this.bucketName = process.env.R2_BUCKET_NAME;
  }

  async listFiles(prefix = '') {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
      });
      
      const response = await this.client.send(command);
      return response.Contents || [];
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  async getFile(key) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      
      const response = await this.client.send(command);
      const stream = response.Body;
      const chunks = [];
      
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      
      return Buffer.concat(chunks);
    } catch (error) {
      console.error('Error getting file:', error);
      throw error;
    }
  }

  async getJsonFile(key) {
    try {
      const data = await this.getFile(key);
      return JSON.parse(data.toString());
    } catch (error) {
      console.error('Error getting JSON file:', error);
      throw error;
    }
  }

  async getSubjectFiles(subject) {
    try {
      const files = await this.listFiles(`${subject}/`);
      return files.map(file => ({
        key: file.Key,
        size: file.Size,
        lastModified: file.LastModified,
        name: file.Key.split('/').pop(),
      }));
    } catch (error) {
      console.error(`Error getting ${subject} files:`, error);
      throw error;
    }
  }

  async getQuestionData(subject, questionId) {
    try {
      const key = `${subject}/questions/${questionId}.json`;
      return await this.getJsonFile(key);
    } catch (error) {
      console.error(`Error getting question data:`, error);
      throw error;
    }
  }
}

module.exports = R2Client;