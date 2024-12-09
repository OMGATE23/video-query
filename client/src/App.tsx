import { createClient } from '@supabase/supabase-js';
import React, { useRef, useState } from 'react';
import { formatTime, getEmbedding } from './utils'
import { toast, Toaster } from 'sonner';
import UploadIcon from './assets/UploadIcon';
import { TimeStamp } from './types';

const App: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  // const [loading, setLoading] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [timestamps, setTimeStamps] = useState<TimeStamp[]>([]); 
  const handleSubmitQuery = async () => {
    if (!query) return;
    try {
      const video_id = localStorage.getItem('videoId');
      console.log(video_id)
      if (!video_id) return;
      const embedding = await getEmbedding(query);
      const supabase = createClient(import.meta.env.VITE_SUPABASE_URL!, import.meta.env.VITE_SUPABASE_KEY!);
      console.log({match_threshold: 0.3,
        match_count: 1,
        match_video_id: video_id})
      const { data, error } = await supabase.rpc(
        "match_video_embeddings", {
        query_embedding: embedding[0],
        match_threshold: 0.3,
        match_count: 5,
        match_video_id: video_id
      }
      )

      if (data !== null && data.length > 0 && videoRef.current !== null) {
        setTimeStamps(data);
        videoRef.current.currentTime = data[0].video_timestamp
      }
      console.log(data, error)

      if (error) {
        toast.error('Something went wrong')
        console.log(error);
      }

    } catch(e) {
      console.log(e)
      toast.error("Couldn't query");
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // setLoading(true);
    const file = event.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoSrc(URL.createObjectURL(file));
    }
    // setLoading(false)
  };

  const handleUpload = async () => {
    if (!videoFile) {
      toast.error('Please select a video file first');
      // setLoading(false)
      return;
    }

    if (!videoFile.type.startsWith('video/')) {
      toast.error('Selected file is not a video');
      // setLoading(false)
      return;
    }

    try {
      toast.loading('Uploading...')
      const formData = new FormData();
      formData.append('file', videoFile);

      const response = await fetch('http://localhost:8000/api/upload-video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        // setLoading(false)
        throw new Error('Failed to upload the video.');
      }

      const data = await response.json();
      localStorage.setItem('videoId', data.videoId);
      // setLoading(false)
      toast.success('Video uploaded successfully.')
    } catch (error) {
      // setLoading(false)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('An error occurred during the upload.')
      }
    }

    toast('Done')
  };

  return (
    <div className='overflow-x-hidden flex flex-col lg:flex-row h-[100vh] justify-center items-center gap-6 lg:gap-32 relative'>
      <div className='flex gap-4 flex-col items-center'>
        <video
          src={videoSrc || ''}
          controls
          className=' w-[80%] md:w-full  max-w-[500px] max-h-[60vh] rounded-md  md:min-w-[400px]'
          ref={videoRef}
        />
        <div className='flex items-center gap-4 w-[80%] overflow-x-auto'>
          {
            timestamps.map(({id, video_timestamp, path}) => (
              <div 
                onClick={() => {
                  if(!videoRef.current) return;
                  videoRef.current.currentTime = video_timestamp
                }}
                className='flex flex-col items-center cursor-pointer' 
                key={id}
              >
                <img 
                  alt={`Timestamp at ${video_timestamp}`} 
                  className='w-[100px] rounded'
                  src={path} 
                />
                <p>{formatTime(video_timestamp)}</p>
              </div>
            ))
          }
        </div>
      </div>
      <div className='flex flex-col items-center lg:block text-center'>
        <h1 className='text-4xl font-semibold text-neutral-700'>
          Welcome to&nbsp;
          <span className='text-black'>VideoQuery</span>
        </h1>
          <input
            type="file"
            accept="video/*"
            className='py-4 px-2'
            onChange={handleFileChange}
          />
        <div>
          <button
            onClick={handleUpload}
            className='flex items-center gap-2 shadow py-2 px-4 rounded-full bg-neutral-900 text-white'
          >
            <UploadIcon size={16} />
            Upload Video
          </button>
        </div>

        { videoSrc && (
          <div className='flex justify-start gap-4 items-center mt-4'>
            <input
              placeholder='Enter query'
              type='text'
              value={query}
              className='px-2 outline outline-neutral-200 shadow h-10 w-[80%] rounded-md'
              onChange={e => setQuery(e.target.value)}
            />
            <button
              className='py-2 px-4 rounded-md bg-neutral-900 text-white'
              onClick={() => { handleSubmitQuery() }}
            >
              Search
            </button>
          </div>
        )}
      </div>
      <Toaster position='top-center' />
      <div className='  absolute h-full w-full scale-[2] top-[-45%] lg:left-[50%] lg:top-[0%] bg-gray-200 rotate-[-45deg] z-[-10]' />
    </div>
  );
};

export default App;
