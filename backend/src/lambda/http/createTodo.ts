import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import * as middy from 'middy';
import { cors } from 'middy/middlewares';
import { getUserId } from '../utils';
import { createLogger } from '../../utils/logger';
import { TodoService } from '../../businessLogic/todoService';

const logger = createLogger('createTodo');

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  logger.info('Processing event: ', event);

  const userId: string = getUserId(event);
  const newTodoReq: CreateTodoRequest = JSON.parse(event.body);
  const newTodoItem = await TodoService.create(newTodoReq, userId);

  return {
    statusCode: 201,
    body: JSON.stringify({
      item: newTodoItem
    })
  }
});

handler.use(cors({
  origin: '*',
  credentials: true
}));
