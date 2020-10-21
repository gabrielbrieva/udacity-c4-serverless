import { TodoDataAccess } from "../data/TodoDataAccess";
import { TodoItem } from "../models/TodoItem";
import { CreateTodoRequest } from "../requests/CreateTodoRequest";
import * as uuid from 'uuid';
import { UpdateTodoRequest } from "../requests/UpdateTodoRequest";
import * as AWS from "aws-sdk";
import { createLogger } from "../utils/logger";

const s3BucketName = process.env.S3_ATTACHEMENTS_BUCKET;
const signedUrlExpiration = process.env.SIGNED_URL_EXPIRATION_TIME;

const AWSXRay = require('aws-xray-sdk');
const XAWS = AWSXRay.captureAWS(AWS);

const s3 = new XAWS.S3({
    signatureVersion: 'v4'
});

const logger = createLogger('TodoService');

export interface ITodoService {
    get(userId: string, todoId?: string): Promise<TodoItem[]>;
    create(createTodoReq: CreateTodoRequest, userId: string): Promise<TodoItem>;
    update(updateTodoReq: UpdateTodoRequest, userId: string, todoId: string): Promise<TodoItem>;
    delete(userId: string, todoId: string): Promise<void>;
    updateAttachment(attachmentUrl: string, userId: string, todoId: string): Promise<TodoItem>;
    getSignedUpdateAttachmentUrl(todoId: string): string;
}

class TodoServiceImpl implements ITodoService {

    private todosDataAccess: TodoDataAccess;

    constructor(todosDataAccess: TodoDataAccess = new TodoDataAccess()) {
        this.todosDataAccess = todosDataAccess;
    }

    async get(userId: string, todoId?: string): Promise<TodoItem[]> {
        return await this.todosDataAccess.getAll(userId, todoId);
    }

    async create(createTodoReq: CreateTodoRequest, userId: string): Promise<TodoItem> {
        return await this.todosDataAccess.create(<TodoItem>{
            userId: userId,
            todoId: uuid.v4(),
            createdAt: new Date().toISOString(),
            name: createTodoReq.name,
            dueDate: createTodoReq.dueDate,
            done: false
        });
    }

    async update(updateTodoReq: UpdateTodoRequest, userId: string, todoId: string): Promise<TodoItem> {
        return await this.todosDataAccess.update(<TodoItem>{
            userId: userId,
            todoId: todoId,
            name: updateTodoReq.name,
            dueDate: updateTodoReq.dueDate,
            done: updateTodoReq.done
        });
    }

    async delete(userId: string, todoId: string): Promise<void> {

        // Remove S3 object attached to Todo Item if exist
        const todoItems: TodoItem[] = await this.get(userId, todoId);

        logger.info(`Todo item to delete: ${JSON.stringify(todoItems)}`);

        if (todoItems && todoItems.length > 0 && todoItems[0] && todoItems[0].attachmentUrl) {

            logger.info(`Deleting Todo item '${todoId}' from S3...`);

            await s3.deleteObject({
                Bucket: s3BucketName,
                Key: todoId
            }).promise();
        }

        await this.todosDataAccess.delete(userId, todoId);
    }

    async updateAttachment(attachmentUrl: string, userId: string, todoId: string): Promise<TodoItem> {
        return await this.todosDataAccess.updateAttachmentUrl({
            userId: userId,
            todoId: todoId,
            attachmentUrl: attachmentUrl,
        });
    }

    getSignedUpdateAttachmentUrl(todoId: string): string {
        return s3.getSignedUrl('putObject', {
            Bucket: s3BucketName,
            Key: todoId,
            Expires: parseInt(signedUrlExpiration)
        });
    }

}

export const TodoService: ITodoService = new TodoServiceImpl();