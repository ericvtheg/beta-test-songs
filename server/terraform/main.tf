### VPC
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "${local.prefix}-vpc"
  cidr = local.vpc_cidr

  azs             = var.azs
  private_subnets = var.private_subnets
  public_subnets  = var.public_subnets

  enable_dns_hostnames   = true
  
  enable_nat_gateway     = true
  single_nat_gateway = true
  one_nat_gateway_per_az = false
}

# TODO must allow outbound traffic in security group in default vpc
# would really like to fix this with IAC

### IAM
resource "aws_iam_role" "ecs_agent" {
  name               = "${local.prefix}-execution-task-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_agent.json
}

data "aws_iam_policy_document" "ecs_agent" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com", "ecs.amazonaws.com", "ec2.amazonaws.com"]
    }
  }
}
resource "aws_iam_role_policy_attachment" "ecs-policy" {
  role       = aws_iam_role.ecs_agent.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
}

resource "aws_iam_role_policy_attachment" "rds-policy" {
  role       = aws_iam_role.ecs_agent.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonRDSDataFullAccess"
}

resource "aws_iam_role_policy_attachment" "ses-policy" {
  role       = aws_iam_role.ecs_agent.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSESFullAccess"
}

resource "aws_iam_instance_profile" "ecs_agent" {
  name = "ecs-agent"
  role = aws_iam_role.ecs_agent.name
}

### Cloudwatch
resource "aws_cloudwatch_log_group" "beta-test-songs-log-group" {
  name              = "${local.prefix}-${var.stage}-logs"
  retention_in_days = 14
}

### RDS 
resource "aws_db_subnet_group" "beta-test-songs-db-subnet-group" {
  name       = "${local.prefix}-db-subnet-group"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_db_instance" "beta-test-songs-rds" {
  depends_on = [module.vpc, resource.aws_db_subnet_group.beta-test-songs-db-subnet-group]

  allocated_storage                     = 5
  max_allocated_storage                 = 20
  allow_major_version_upgrade           = false
  identifier                            = "${local.prefix}-${var.stage}"
  availability_zone                     = var.azs[0]
  engine                                = "postgres"
  engine_version                        = "14.4"
  instance_class                        = "db.t4g.micro"
  skip_final_snapshot                   = true
  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name = aws_db_subnet_group.beta-test-songs-db-subnet-group.name
}

### ECR
resource "aws_ecr_repository" "beta-test-songs-ecr" {
  name                 = "${local.prefix}-repo-${var.stage}"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

### Autoscaling

# AMI
data "aws_ami" "aws_optimized_ecs" {
  most_recent = true

  filter {
    name   = "name"
    values = ["amzn-ami*amazon-ecs-optimized"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["591542846629"] # AWS
}

resource "aws_launch_configuration" "beta-test-songs-launch-config" {
  name_prefix          = "${local.prefix}-${var.stage}-launch-config-"
  image_id             = data.aws_ami.aws_optimized_ecs.id
  instance_type        = "t3.micro"
  iam_instance_profile = aws_iam_instance_profile.ecs_agent.arn

  lifecycle {
    create_before_destroy = true
  }

  user_data = <<EOF
#!/bin/bash
echo ECS_CLUSTER=${local.prefix}-${var.stage}-cluster >> /etc/ecs/ecs.config
EOF

  key_name = "eric"
}

resource "aws_autoscaling_group" "beta-test-songs-asg" {
  depends_on  = [module.vpc, resource.aws_launch_configuration.beta-test-songs-launch-config]
  name_prefix = resource.aws_launch_configuration.beta-test-songs-launch-config.name_prefix

  termination_policies      = ["OldestInstance"]
  default_cooldown          = 30
  health_check_grace_period = 300

  launch_configuration = aws_launch_configuration.beta-test-songs-launch-config.name
  min_size             = 1
  max_size             = 3

  # can use mixed instances
  # should I just do fargate?
  # use ec2 free tier for ssh tunneling to rds
  # do some thresholds for scaling more instances

  lifecycle {
    create_before_destroy = true
  }

  vpc_zone_identifier = module.vpc.private_subnets
}

### ECS
resource "aws_ecs_cluster" "beta-test-songs-cluster" {
  name = "${local.prefix}-${var.stage}-cluster"
}

resource "aws_ecs_task_definition" "beta-test-songs-task-definition" {
  family             = "${local.prefix}-${var.stage}"
  execution_role_arn = aws_iam_role.ecs_agent.arn
  container_definitions = jsonencode([
    {
      name      = "${local.prefix}-${var.stage}"
      image     = "${var.aws_account_id}.dkr.ecr.${local.aws_region}.amazonaws.com/${local.prefix}-repo-${var.stage}:${var.image_tag}"
      cpu       = 524
      memory    = 768
      essential = true
      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
        }
      ],
      environment = [
        { "name" : "STAGE", "value" : var.stage },
        { "name" : "DATABASE_URL", "value" : var.db_url },
        { "name" : "MIX_PANEL_TOKEN", "value" : var.mix_panel_token },
      ],
      logConfiguration = {
        logDriver = "awslogs",
        options = {
          "awslogs-group"         = "${resource.aws_cloudwatch_log_group.beta-test-songs-log-group.name}"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = merge(
    local.common_tags,
    {
      Name = "${local.prefix}-${var.stage}"
    }
  )
}

resource "aws_ecs_service" "beta-test-songs-ecs-service" {
  name            = var.service
  task_definition = aws_ecs_task_definition.beta-test-songs-task-definition.arn
  cluster         = aws_ecs_cluster.beta-test-songs-cluster.id
  desired_count   = 1
  deployment_minimum_healthy_percent = 0
  

  load_balancer {
    target_group_arn = aws_alb_target_group.beta-test-songs-alb-target-group.arn
    container_name   = aws_ecs_task_definition.beta-test-songs-task-definition.family
    container_port   = 3000
  }
}

### ALB
resource "aws_alb" "beta-test-songs-alb" {
  depends_on = [module.vpc]

  name               = "${local.prefix}-alb-${var.stage}"
  internal           = false
  load_balancer_type = "application"
  subnets            = module.vpc.public_subnets

  enable_deletion_protection = false
}

resource "aws_lb_listener" "beta-test-songs-alb-listener" {
  load_balancer_arn = aws_alb.beta-test-songs-alb.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = aws_acm_certificate.beta-test-songs-cert.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.beta-test-songs-alb-target-group.arn
  }
}

resource "aws_lb_listener_certificate" "beta-test-songs-alblc" {
  depends_on = [aws_lb_listener.beta-test-songs-alb-listener, aws_acm_certificate.beta-test-songs-cert]

  listener_arn    = aws_lb_listener.beta-test-songs-alb-listener.arn
  certificate_arn = aws_acm_certificate.beta-test-songs-cert.arn
}

resource "aws_alb_target_group" "beta-test-songs-alb-target-group" {
  name     = "${local.prefix}-alb-tg-${var.stage}"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = module.vpc.vpc_id

  health_check {
    matcher="200"
    path="/api/health"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate" "beta-test-songs-cert" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}