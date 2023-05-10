import server from 'aws-ses-v2-local';

export const startLocalEmailServer = async () => {
  return server({ port: 8005 });
};
console.log('local email server: up and running');
