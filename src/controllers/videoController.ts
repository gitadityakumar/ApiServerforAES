import { Request, Response } from 'express';
import { fetchUserById } from '../middlewares/auth';
import { jobQueue } from '../queues/jobQueue';
import { Job } from 'bullmq';

// Enqueue video processing job
export const processVideo = async (req: Request, res: Response) => {
  try {
    const videoData = req.body.videoData;
    
    if (!videoData || !videoData.userId) {
         return res.status(400).send('Bad Request: Missing video data or userID');
    }
    // auth 
    const id = videoData.userId;
    const user = await fetchUserById(id);
    if(!user){
        return res.status(401).send('Unauthorized');
    }

    // Add a job to the queue
    const job = await jobQueue.add('video-job', {
      videoData
    });

    return res.status(200).json({
      message: 'Job enqueued successfully!',
      jobId: job.id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to enqueue job' });
  }
};

// Get job status by ID (polling approach)
export const getJobStatus = async (req: Request, res: Response) => {
  const { jobId } = req.params;

  try {
    const job = await jobQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Get job progress and status
    const jobState = await job.getState();
    const jobProgress = job.progress;

    if (jobState === 'completed') {
      const result = await job.returnvalue;
      return res.status(200).json({
        jobId,
        status: jobState,
        progress: jobProgress,
        result,
      });
    }

    if (jobState === 'failed') {
      return res.status(500).json({
        jobId,
        status: jobState,
        error: job.failedReason,
      });
    }

    // For 'waiting', 'active', or 'delayed'
    return res.status(200).json({
      jobId,
      status: jobState,
      progress: jobProgress,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error retrieving job status' });
  }
};

//dummy process endpoint to check auth
// export const processVideo = async (req: Request, res: Response) => {
//   try {
//     const videoData = req.body.videoData;
    
    
//     if (!videoData || !videoData.userId) {
//       return res.status(400).send('Bad Request: Missing video data or user ID');
//     }
    
//     const id = videoData.userId;
    
//     const user = await fetchUserById(id);
    
//     if (!user) {
//       return res.status(401).send('Unauthorized');
//     }
    
//     return res.status(200).send("you can process your videos");
//   } catch (error) {
//     console.error('Error processing video:', error);
//     return res.status(500).send('Internal Server Error');
//   }
// };

// Dummy health-check method
export const healthCheck = (req: Request, res: Response) => {
  return res.status(200).send('OK');
};

export default {
  processVideo,
  getJobStatus,
  healthCheck,
  // processVideo,
};
