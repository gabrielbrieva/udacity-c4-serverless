import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares';
import { getUserId } from '../utils';
import { TodoService } from '../../businessLogic/todoService';
import { createLogger } from '../../utils/logger';

const logger = createLogger('generateUploadUrl');

const s3BucketName = process.env.S3_ATTACHEMENTS_BUCKET;

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  logger.info('Processing event: ', event);

  const todoId = event.pathParameters.todoId;
  const userId = getUserId(event);

  let item = await TodoService.updateAttachment(`https://${s3BucketName}.s3.amazonaws.com/${todoId}`, userId, todoId);
  logger.info(`Atachment URL updated for Todo item id ${todoId} to ${item.attachmentUrl}`);

  const updateUrl = TodoService.getSignedUpdateAttachmentUrl(todoId);

  logger.info(`Signed Attachment Update URL for Todo item id ${todoId}: ${updateUrl}`);

  return {
    statusCode: 200,
    body: JSON.stringify({
      uploadUrl: updateUrl
    })
  };
});

handler.use(cors({
  origin: '*',
  credentials: true
}));
