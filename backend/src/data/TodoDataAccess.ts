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

    async getAll(userId: string): Promise<TodoItem[]> {
        logger.info(`Getting all todos for ${userId}`);

        const result = await this.docClient.query({
            TableName: this.todosTableName,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise();

        return result.Items as TodoItem[];
    }

}