import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { TodoDataAccess } from '../../data/TodoDataAccess';
import { getUserId } from '../utils';
import * as middy from 'middy';
import { cors } from 'middy/middlewares';
import { TodoItem } from '../../models/TodoItem';

const todosDataAccess = new TodoDataAccess();

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // TODO: Get all TODO items for a current user

  console.log('Processing event: ', event)

  const userId = getUserId(event);
  const items: TodoItem[] = await todosDataAccess.getAll(userId);

  return {
    statusCode: 200,
    body: JSON.stringify({items})
  }
});

handler.use(
  cors({
      credentials: true
  })
);
