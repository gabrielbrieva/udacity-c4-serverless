import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { TodoService } from '../../businessLogic/todoService';
import { getUserId } from '../utils';
import { TodoItem } from '../../models/TodoItem';
import * as middy from 'middy';
import { cors } from 'middy/middlewares';
import { createLogger } from '../../utils/logger';

const logger = createLogger('updateTodo');

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  logger.info('Processing event: ', event);

  const userId = getUserId(event);
  const todoId = event.pathParameters.todoId;
  const updatedTodoReq: UpdateTodoRequest = JSON.parse(event.body);

  let todoItem: TodoItem = await TodoService.update(updatedTodoReq, userId, todoId);

  return {
    statusCode: 200,
    body: JSON.stringify(todoItem)
  }
});

handler.use(cors({
  origin: '*',
  credentials: true
}));
