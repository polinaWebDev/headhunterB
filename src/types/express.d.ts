import {Users} from "../entity/Users";
import { Request } from 'express';

declare global {
    namespace Express {
        interface Request {
            user?: Users;
        }
    }
}