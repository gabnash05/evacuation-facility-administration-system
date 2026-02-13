import boto3
import os
from botocore.exceptions import ClientError
import logging

logger = logging.getLogger(__name__)

class S3Service:
    def __init__(self):
        self.s3_client = boto3.client(
            "s3",
            region_name=os.getenv("AWS_REGION", "ap-southeast-2")
        )
        self.bucket_name = os.getenv("S3_BUCKET_NAME")
    
    def generate_upload_url(self, file_name, file_type, expires_in=3600):
        """Generate presigned URL for PUT upload"""

        try:
            s3_key = f"centers/photos/{file_name}"
            
            response = self.s3_client.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': s3_key,
                    'ContentType': file_type
                },
                ExpiresIn=expires_in
            )
            return {
                'url': response,
                'key': s3_key,
                'bucket': self.bucket_name
            }
        except ClientError as e:
            logger.error(f"Error generating presigned URL: {e}")
            return None
    
    def generate_download_url(self, s3_key, expires_in=3600):
        """Generate presigned URL for GET/download"""

        try:
            response = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': s3_key
                },
                ExpiresIn=expires_in
            )
            return response
        except ClientError as e:
            logger.error(f"Error generating download URL: {e}")
            return None
    
    def generate_delete_url(self, s3_key, expires_in=3600):
        """Generate presigned URL for DELETE"""

        try:
            response = self.s3_client.generate_presigned_url(
                'delete_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': s3_key
                },
                ExpiresIn=expires_in
            )
            return response
        except ClientError as e:
            logger.error(f"Error generating delete URL: {e}")
            return None
