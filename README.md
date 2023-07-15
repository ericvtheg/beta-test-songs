# BetaTestSongs.com

A webapp built for EDM producers to anonymously share their tracks and get feedback. 

Learn more about this service and what I learned by checking out my [blog post](https://www.ericventor.com/posts/beta-test-songs).

## Architecture

<div style="width: 640px; height: 480px; margin: 10px; position: relative;"><iframe allowfullscreen frameborder="0" style="width:640px; height:480px" src="https://lucid.app/documents/embedded/53942ca1-d74d-4190-a7e0-5b6f009ea749" id="QdEciukitnTJ"></iframe></div>

### Client (SPA)
* React
* React Router
* Vite
* Tailwind CSS

### Server
* Nestjs
* Prisma
* Postgres
* Mixpanel (Analytics)

### Hosting & Deploys
* AWS (ECS/EC2/ECR/RDS/Cloudfront/S3/SES)
* Docker
* Terraform
