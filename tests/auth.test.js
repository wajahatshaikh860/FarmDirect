import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { authenticate, authOptions } from '../lib/auth.js';

globalThis.farmdirectMongo.connection = {};
const hash = await bcrypt.hash('ValidPassword123', 12);
const record = {id:'507f1f77bcf86cd799439011',name:'Test Account',email:'test@example.com',role:'BUYER',accountStatus:'ACTIVE',passwordHash:hash};
test('Credentials login accepts correct password and returns only safe user fields',async t=>{
 t.mock.method(User,'findOne',()=>({select:async()=>record}));
 assert.deepEqual(await authenticate({email:record.email,password:'ValidPassword123'}),{id:record.id,name:record.name,email:record.email,role:record.role});
});
test('Credentials login rejects wrong password, missing user, and invalid fields',async t=>{
 t.mock.method(User,'findOne',()=>({select:async()=>record}));
 assert.equal(await authenticate({email:record.email,password:'wrong'}),null);
 assert.equal(await authenticate({email:'invalid',password:'x'}),null);
 User.findOne.mock.mockImplementation(()=>({select:async()=>null}));
 assert.equal(await authenticate({email:record.email,password:'ValidPassword123'}),null);
});
test('Suspended accounts cannot authenticate',async t=>{
 t.mock.method(User,'findOne',()=>({select:async()=>({...record,accountStatus:'SUSPENDED'})}));
 await assert.rejects(()=>authenticate({email:record.email,password:'ValidPassword123'}),/Account suspended/);
});
test('Session exposes current database role, never password hash',async t=>{
 t.mock.method(User,'findById',async()=>({...record,role:'FARMER'}));
 const session=await authOptions.callbacks.session({session:{user:{},expires:'later'},token:{id:record.id,role:'BUYER'}});
 assert.equal(session.user.role,'FARMER');
 assert.equal(session.user.passwordHash,undefined);
 assert.deepEqual(Object.keys(session.user).sort(),['email','id','name','role']);
});
test('Suspended or deleted accounts lose session access',async t=>{
 t.mock.method(User,'findById',async()=>({...record,accountStatus:'SUSPENDED'}));
 assert.equal((await authOptions.callbacks.session({session:{user:{}},token:{id:record.id}})).user,null);
 User.findById.mock.mockImplementation(async()=>null);
 assert.equal((await authOptions.callbacks.session({session:{user:{}},token:{id:record.id}})).user,null);
});
test('Session JWT stores role and id without copying password hash',async()=>{
 const token=await authOptions.callbacks.jwt({token:{},user:record});
 assert.deepEqual(token,{id:record.id,role:record.role});
 assert.equal(authOptions.session.strategy,'jwt');
});
