import server from 'aws-ses-v2-local';

export const startLocalEmailServer = async () => {
  const port = 8005;
  console.log(`local email server: up and running at localhost:${port}`);
  return server({ port });
};
