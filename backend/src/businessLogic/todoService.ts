import { TodoDataAccess } from "../data/TodoDataAccess";
import { TodoItem } from "../models/TodoItem";
import { CreateTodoRequest } from "../requests/CreateTodoRequest";
import * as uuid from 'uuid';
import { UpdateTodoRequest } from "../requests/UpdateTodoRequest";
import { UpdateTodoAttachmentRequest } from "../requests/UpdateTodoAttachmentRequest";

export interface ITodoService {
    get(userId: string, todoId?: string): Promise<TodoItem[]>;
    create(createTodoReq: CreateTodoRequest, userId: string): Promise<TodoItem>;
    update(updateTodoReq: UpdateTodoRequest, userId: string, todoId: string): Promise<TodoItem>;
    delete(userId: string, todoId: string): Promise<void>;
    updateAttachment(updateTodoReq: UpdateTodoAttachmentRequest, userId: string, todoId: string): Promise<TodoItem>;
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
        return await this.todosDataAccess.delete(userId, todoId);
    }

    async updateAttachment(updateTodoReq: UpdateTodoAttachmentRequest, userId: string, todoId: string): Promise<TodoItem> {
        return await this.todosDataAccess.update({
            userId,
            todoId,
            attachmentUrl: updateTodoReq.attachmentUrl,
        });
    }

}

export const TodoService: ITodoService = new TodoServiceImpl();