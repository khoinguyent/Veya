"""
AWS Lambda handler for Veya API using Mangum adapter.
This file should be at the root level alongside app/ directory.
"""
from mangum import Mangum
from app.main import app

# Create the Lambda handler with lifespan support
# Mangum will handle the lifespan events automatically
handler = Mangum(app, lifespan="auto")


def lambda_handler(event, context):
    """
    AWS Lambda entry point.
    
    Note: 
    - For production, use RDS Proxy for better database connection management
    - For Redis, consider using AWS ElastiCache or Redis Cloud
    - Connection pooling is important for Lambda to handle cold starts efficiently
    """
    return handler(event, context)

