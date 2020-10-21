import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getUserId } from '../utils';
import * as middy from 'middy';
import { cors } from 'middy/middlewares';
import { TodoItem } from '../../models/TodoItem';
import { createLogger } from '../../utils/logger';
import { TodoService } from '../../businessLogic/todoService';

const logger = createLogger('getTodos');

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  logger.info('Processing event: ', event);

  const userId = getUserId(event);
  const items: TodoItem[] = await TodoService.get(userId);

  return {
    statusCode: 200,
    body: JSON.stringify({items})
  }
});

handler.use(cors({
  origin: '*',
  credentials: true
}));
