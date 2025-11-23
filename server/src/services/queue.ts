import Bull from 'bull';
import prisma from '../connection/client.js';

// Queue for notifications
export const notificationQueue = new Bull('notifications', {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

// Queue for image processing
export const imageProcessingQueue = new Bull('image_processing', {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

// Job types
export interface NotificationJobData {
  userId: number;
  type: 'like' | 'comment' | 'follow' | 'new_post' | 'comment_like';
  message: string;
  relatedId: number | null;
}

export interface ImageProcessingJobData {
  threadId: number;
  imagePath: string;
  userId: number;
}

// Process notification jobs
notificationQueue.process(async (job) => {
  const { userId, type, message, relatedId } = job.data as NotificationJobData;

  try {
    // Store notification in database
    await prisma.notifications.create({
      data: {
        user_id: userId,
        type,
        message,
        related_id: relatedId,
      },
    });

    console.log('Notification stored:', { userId, type, message });
  } catch (error) {
    console.error('Error processing notification job:', error);
    throw error;
  }
});

// Process image processing jobs
imageProcessingQueue.process(async (job) => {
  const { threadId, imagePath, userId } = job.data as ImageProcessingJobData;

  try {
    // Simulate image processing operations
    console.log('Processing image for thread:', {
      threadId,
      imagePath,
      userId
    });

    // Here you could add:
    // - Image resizing/resampling
    // - Format conversion
    // - Compression optimization
    // - Thumbnail generation
    // - Watermarking
    // - Image analysis/metadata extraction

    // For now, just mark as processed in the database
    // You might add a 'processed' field to the threads table
    console.log('Image processing completed for:', imagePath);

  } catch (error) {
    console.error('Error processing image job:', error);
    throw error;
  }
});

// Event listeners for retries/debugging
notificationQueue.on('completed', (job, result) => {
  console.log('Job completed with result', result);
});

notificationQueue.on('failed', (job, err) => {
  console.log('Job failed with error', err);
});

// Image processing queue event listeners
imageProcessingQueue.on('completed', (job, result) => {
  console.log('Image processing job completed');
});

imageProcessingQueue.on('failed', (job, err) => {
  console.log('Image processing job failed with error', err.message);
});

// Add a notification job
export const addNotificationJob = async (data: NotificationJobData) => {
  await notificationQueue.add(data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true, // Clean up completed jobs
    removeOnFail: false, // Keep failed jobs for inspection
  });
};

// Add an image processing job
export const addImageProcessingJob = async (data: ImageProcessingJobData) => {
  await imageProcessingQueue.add(data, {
    attempts: 2,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: false, // Keep for audit trail
    removeOnFail: false,
  });
};
