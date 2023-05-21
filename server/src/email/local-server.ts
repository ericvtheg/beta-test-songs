import server from 'aws-ses-v2-local';

export const startLocalEmailServer = async () => {
  console.log('local email server: up and running');
  return server({ port: 8005 });
};
