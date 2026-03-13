import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
  console.log('Testing upload to "gallery" bucket...');
  const { data, error } = await supabase.storage
    .from('gallery')
    .upload('test.txt', 'Hello world!', {
      contentType: 'text/plain',
      upsert: true
    });
    
  if (error) {
    console.error('Upload Failed!', error);
  } else {
    console.log('Upload Success!', data);
  }
}

testUpload();
