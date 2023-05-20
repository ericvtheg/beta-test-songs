# get sha of most recent commit
image_tag=$(git rev-parse HEAD)
echo $image_tag

# authenticate to default registry
aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin 837765293758.dkr.ecr.us-east-2.amazonaws.com

# build docker iamge
docker build -t $image_tag . 

# push image to ecr
docker tag $image_tag:latest 837765293758.dkr.ecr.us-east-2.amazonaws.com/beta-test-songs-repo-prod
docker push 837765293758.dkr.ecr.us-east-2.amazonaws.com/beta-test-songs-repo-prod

# run infra changes
(cd terraform && terraform apply -var="image_tag=$image_tag")