//import * as AWSXRay from 'aws-xray-sdk';
import * as AWS from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { createLogger } from '../utils/logger';

const AWSXRay = require('aws-xray-sdk');
const XAWS = AWSXRay.captureAWS(AWS);
const logger = createLogger('createDocumentClient');

export function createDocumentClient(): DocumentClient {
    if (process.env.IS_OFFLINE) {
        logger.info('Creating a local DynamoDB instance');
        return new XAWS.DynamoDB.DocumentClient({
            region: 'localhost',
            endpoint: 'http://localhost:8000'
        });
    }

    return new XAWS.DynamoDB.DocumentClient();
}