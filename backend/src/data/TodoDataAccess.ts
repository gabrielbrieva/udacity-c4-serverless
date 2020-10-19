import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { TodoItem } from "../models/TodoItem";
import { createLogger } from "../utils/logger";
import { createDocumentClient } from "./dynamoDB";

const logger = createLogger('TodoDataAccess');

export class TodoDataAccess {

    private readonly docClient: DocumentClient;
    private readonly todosTableName: string;

    constructor(docClient: DocumentClient = createDocumentClient(), todosTableName: string = process.env.TODOS_TABLE) {
        this.docClient = docClient;
        this.todosTableName = todosTableName;
    }

    async getAll(userId: string, todoId?: string): Promise<TodoItem[]> {
        logger.info(`Getting all todos by user id '${userId}'`);

        let queryInput: DocumentClient.QueryInput  = {
            TableName: this.todosTableName,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }

        if (todoId) {
            logger.info(`Using todo id '${todoId}'`);
            queryInput.KeyConditionExpression += ' AND todoId = :todoId';
            queryInput.ExpressionAttributeValues[':todoId'] = todoId;
        }

        const result = await this.docClient.query(queryInput).promise();

        return result.Items as TodoItem[];
    }

    async create(todo: TodoItem): Promise<TodoItem> {
        await this.docClient.put({
            TableName: this.todosTableName,
            Item: todo,
        }).promise();

        return todo;
    }

    async update(updatedTodo: any): Promise<TodoItem> {
        await this.docClient.update({
            TableName: this.todosTableName,
            Key: {
                todoId: updatedTodo.todoId,
                userId: updatedTodo.userId
            },
            ExpressionAttributeNames: { "#N": "name" },
            UpdateExpression: "set #N = :name, dueDate = :dueDate, done = :done",
            ExpressionAttributeValues: {
                ":name": updatedTodo.name,
                ":dueDate": updatedTodo.dueDate,
                ":done": updatedTodo.done,
            },
            ReturnValues: "UPDATED_NEW"
        }).promise();

        return updatedTodo;
    }

    async delete(userId: string, todoId: string) {
        await this.docClient.delete({
            TableName: this.todosTableName,
            Key: {
                todoId,
                userId
            }
        }).promise();
    }
}