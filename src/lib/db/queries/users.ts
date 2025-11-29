import { db } from "../index";
import {users} from "../../../schema";
import { eq, gt, and, or } from 'drizzle-orm';

export async function createUser(name:string){
    const [result] = await db.insert(users).values({name:name}).returning();
    return result;
}

export async function getUser(name:string){
    try{
        const [userName] = await db.select().from(users).where(eq(users.name, name));
        return userName;
    }catch(e){
        return undefined;
    }
}
export async function getUsers(){
    const allUsers = await db.select().from(users);
    return allUsers;
}
export async function deleteUser(){
    const result = await db.delete(users);
    return result;
}