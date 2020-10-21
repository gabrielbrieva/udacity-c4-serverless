import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger';
import { TodoService } from '../../businessLogic/todoService';
import * as middy from 'middy';
import { cors } from 'middy/middlewares';

const logger = createLogger('deleteTodo');

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  logger.info('Processing event: ', event);

  const userId = getUserId(event);
  const todoId = event.pathParameters.todoId
  
  try {
    await TodoService.delete(userId, todoId);
  } catch (err) {

    logger.info(`Todo item ${todoId} not found`);

    return {
      statusCode: 404,
      body: `Todo item ${todoId} not found`
    };
  }

  return {
    statusCode: 200,
    body: ''
  };
});

handler.use(cors({
  origin: '*',
  credentials: true
}))